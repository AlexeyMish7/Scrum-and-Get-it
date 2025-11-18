/**
 * EXPERIENCE TAILORING ROUTE
 *
 * POST /api/generate/experience-tailoring
 *
 * Generates tailored work experience descriptions optimized for specific
 * job applications. Emphasizes relevant achievements and responsibilities.
 *
 * Flow:
 *   1. Validate request (userId, jobId required)
 *   2. Rate limit check (5/min per user)
 *   3. Orchestrate AI experience tailoring
 *   4. Persist artifact to Supabase
 *   5. Generate UI preview
 *   6. Return artifact with preview
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
 * POST /api/generate/experience-tailoring
 *
 * Generates tailored experience descriptions for job applications.
 *
 * Request headers:
 *   - X-User-Id: uuid (required)
 *
 * Request body:
 *   - jobId: number (required)
 *
 * Response (201):
 *   - id: artifact ID
 *   - kind: 'experience_tailoring'
 *   - created_at: timestamp
 *   - preview: short preview text
 *   - content: { experiences: [{ role, bullets, relevance }] }
 *   - persisted: boolean
 *   - metadata: { latency_ms, artifact_id?, persisted }
 *
 * Errors:
 *   - 400: Missing or invalid jobId
 *   - 429: Rate limit exceeded (5/min)
 *   - 500: No artifact produced
 *   - 502: AI orchestration failure
 */
export async function post(
  req: IncomingMessage,
  res: ServerResponse,
  url: URL,
  reqId: string,
  userId: string,
  counters: GenerationCounters
): Promise<void> {
  // Rate limit: 50 requests per 5 minutes per user
  const limit = checkLimit(`experience:${userId}`, 50, 300_000);
  if (!limit.ok) {
    res.setHeader("Retry-After", String(limit.retryAfterSec ?? 60));
    throw new ApiError(429, "rate limited", "rate_limited");
  }

  // Parse and validate request body
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

  // Orchestrate AI experience tailoring
  counters.generate_total++;
  const start = Date.now();
  const result = await orchestrator.handleExperienceTailoring({
    userId,
    jobId,
  });
  const latencyMs = Date.now() - start;

  if (result.error) {
    counters.generate_fail++;
    logError("experience_tailoring_failed", {
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

  // Persist artifact to Supabase (if configured)
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

  // Build response payload with preview
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
