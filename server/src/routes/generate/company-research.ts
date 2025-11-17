/**
 * COMPANY RESEARCH GENERATION ROUTE
 *
 * POST /api/generate/company-research
 *
 * Generates comprehensive company research including mission, values,
 * culture, recent news, and interview insights for job applications.
 *
 * Flow:
 *   1. Validate request (userId, companyName required)
 *   2. Rate limit check (10/min per user - research is less intensive)
 *   3. Orchestrate AI company research
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
 * POST /api/generate/company-research
 *
 * Generates company research for job application preparation.
 *
 * Request headers:
 *   - X-User-Id: uuid (required)
 *
 * Request body:
 *   - companyName: string (required, non-empty)
 *   - jobId?: number (optional)
 *
 * Response (201):
 *   - id: artifact ID
 *   - kind: 'company_research'
 *   - created_at: timestamp
 *   - preview: short preview text
 *   - content: { company, mission, culture, news, insights }
 *   - persisted: boolean
 *   - metadata: { latency_ms, artifact_id?, persisted }
 *
 * Errors:
 *   - 400: Missing or invalid companyName, invalid jobId
 *   - 429: Rate limit exceeded (10/min)
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
  // Rate limit: 10 requests per minute per user (research is less intensive than generation)
  const limit = checkLimit(`company-research:${userId}`, 10, 60_000);
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

  const companyName = body?.companyName;
  if (!companyName || typeof companyName !== "string" || !companyName.trim()) {
    throw new ApiError(
      400,
      "companyName is required and must be a non-empty string",
      "bad_request"
    );
  }

  const jobId = body?.jobId;
  // jobId is optional, but if provided must be valid
  if (jobId !== undefined && jobId !== null && Number.isNaN(Number(jobId))) {
    throw new ApiError(
      400,
      "jobId must be a number if provided",
      "bad_request"
    );
  }

  // Orchestrate AI company research
  counters.generate_total++;
  const start = Date.now();
  const result = await orchestrator.handleCompanyResearch({
    userId,
    companyName: companyName.trim(),
    jobId: jobId ? Number(jobId) : undefined,
  });
  const latencyMs = Date.now() - start;

  if (result.error) {
    counters.generate_fail++;
    logError("company_research_failed", {
      reqId,
      userId,
      companyName,
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
