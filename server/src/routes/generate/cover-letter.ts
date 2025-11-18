/**
 * COVER LETTER GENERATION ENDPOINT
 *
 * POST /api/generate/cover-letter
 *
 * Generates AI-powered cover letter content tailored to a specific job posting.
 * Uses user profile data, job requirements, and company research to create
 * personalized cover letters.
 *
 * Request:
 * - Body: { jobId: number, options?: { tone, focus, variant, model, prompt, templateId } }
 * - Headers: Authorization (JWT) or X-User-Id (dev mode)
 *
 * Response: 201 with { id, kind, created_at, preview, content, persisted, metadata }
 *
 * Rate Limiting: 5 requests per minute per user
 * Authentication: Required
 */

import type { IncomingMessage, ServerResponse } from "node:http";
import type { URL } from "node:url";
import { ApiError } from "../../../utils/errors.js";
import { checkLimit } from "../../../utils/rateLimiter.js";
import { legacyLogError as logError } from "../../../utils/logger.js";
import { readJson } from "../../../utils/http.js";
import { getCorsHeaders } from "../../middleware/cors.js";
import * as orchestrator from "../../services/orchestrator.js";
import type { GenerationCounters } from "./types.js";
import { makePreview } from "./utils.js";

/**
 * POST /api/generate/cover-letter
 */
export async function post(
  req: IncomingMessage,
  res: ServerResponse,
  url: URL,
  reqId: string,
  userId: string,
  counters: GenerationCounters
): Promise<void> {
  const limit = checkLimit(`cover-letter:${userId}`, 50, 300_000);
  if (!limit.ok) {
    res.setHeader("Retry-After", String(limit.retryAfterSec ?? 60));
    throw new ApiError(429, "rate limited", "rate_limited");
  }

  let body: any;
  try {
    body = await readJson(req);
  } catch (e: any) {
    throw new ApiError(400, "invalid JSON body", "bad_json");
  }

  const jobId = body?.jobId;
  if (jobId === undefined || jobId === null || Number.isNaN(Number(jobId))) {
    throw new ApiError(
      400,
      "jobId is required and must be a number",
      "bad_request"
    );
  }
  const options = body?.options ?? undefined;

  if (options?.templateId) {
    console.log(
      `[Cover Letter Gen] Template-aware: ${options.templateId} for user ${userId}, job ${jobId}`
    );
  }

  counters.generate_total++;
  const start = Date.now();
  const result = await orchestrator.handleGenerateCoverLetter({
    userId,
    jobId,
    options,
  });
  const latencyMs = Date.now() - start;

  if (result.error) {
    counters.generate_fail++;
    logError("generate_cover_letter_failed", {
      reqId,
      userId,
      jobId,
      error: result.error,
      latency_ms: latencyMs,
    });
    throw new ApiError(502, result.error, "ai_error");
  }

  const artifact = result.artifact;
  if (!artifact) throw new ApiError(500, "no artifact produced", "no_artifact");

  const canPersist = Boolean(
    process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
  );
  const metadata = {
    ...(artifact.metadata ?? {}),
    latency_ms: latencyMs,
    persisted: false,
  } as Record<string, unknown>;

  if (canPersist) {
    try {
      const mod = await import("../../services/supabaseAdmin.js");
      const insert = mod.insertAiArtifact as any;
      const row = await insert({
        user_id: artifact.user_id,
        job_id: artifact.job_id,
        kind: artifact.kind,
        title: artifact.title,
        prompt: artifact.prompt,
        model: artifact.model,
        content: artifact.content,
        metadata,
      });
      metadata.persisted = true;
      metadata.artifact_id = row?.id;
    } catch (e: any) {
      logError("artifact_persist_failed", { reqId, error: e.message });
    }
  }

  counters.generate_success++;
  const payload = {
    id: artifact.id,
    kind: artifact.kind,
    created_at: artifact.created_at,
    preview: makePreview(artifact.content),
    content: artifact.content,
    persisted: metadata.persisted,
    metadata,
  };

  const bodyStr = JSON.stringify(payload);
  res.writeHead(201, {
    "Content-Type": "application/json",
    "Content-Length": Buffer.byteLength(bodyStr).toString(),
    ...getCorsHeaders(),
  });
  res.end(bodyStr);
}
