/**
 * RESUME GENERATION ENDPOINT
 *
 * POST /api/generate/resume
 *
 * Generates AI-powered resume content tailored to a specific job posting.
 * Uses user profile data and job requirements to create optimized resume sections.
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
 * POST /api/generate/resume
 *
 * Flow:
 * 1. Rate limit check (5/min per user)
 * 2. Parse and validate request body
 * 3. Call orchestrator service
 * 4. Persist artifact to Supabase (if configured)
 * 5. Return artifact with preview
 */
export async function post(
  req: IncomingMessage,
  res: ServerResponse,
  url: URL,
  reqId: string,
  userId: string,
  counters: GenerationCounters
): Promise<void> {
  // Rate limit (5/min per user)
  const limit = checkLimit(`resume:${userId}`, 5, 60_000);
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

  // Log template-aware generation if templateId provided
  if (options?.templateId) {
    console.log(
      `[Resume Gen] Template-aware: ${options.templateId} for user ${userId}, job ${jobId}`
    );
  }

  counters.generate_total++;
  const start = Date.now();
  const result = await orchestrator.handleGenerateResume({
    userId,
    jobId,
    options,
  });
  const latencyMs = Date.now() - start;

  if (result.error) {
    counters.generate_fail++;
    logError("generate_resume_failed", {
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
    id: (metadata as any).artifact_id ?? null,
    kind: artifact.kind,
    created_at: new Date().toISOString(),
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
