/**
 * AI Generation Routes
 *
 * POST /api/generate/resume
 * POST /api/generate/cover-letter
 * POST /api/generate/skills-optimization
 * POST /api/generate/experience-tailoring
 *
 * All routes require authentication and perform rate limiting.
 * Each route calls the corresponding orchestrator service function.
 *
 * Flow:
 * 1. Authenticate user (JWT or X-User-Id in dev mode)
 * 2. Rate limit per user
 * 3. Parse and validate request body
 * 4. Call orchestrator service
 * 5. Persist artifact to Supabase (if env configured)
 * 6. Return artifact with preview
 */

import type { IncomingMessage, ServerResponse } from "node:http";
import type { URL } from "node:url";
import { ApiError } from "../../utils/errors.js";
import { checkLimit } from "../../utils/rateLimiter.js";
import { legacyLogError as logError } from "../../utils/logger.js";
import * as orchestrator from "../services/orchestrator.js";

/**
 * Counters interface for tracking generation metrics
 */
export interface GenerationCounters {
  generate_total: number;
  generate_success: number;
  generate_fail: number;
}

/**
 * Read and parse JSON body safely
 * Returns {} for empty body
 */
async function readJson(req: IncomingMessage): Promise<any> {
  return new Promise<any>((resolve, reject) => {
    let data = "";
    req.on("data", (chunk) => (data += chunk));
    req.on("end", () => {
      if (!data) return resolve({});
      try {
        resolve(JSON.parse(data));
      } catch (err) {
        reject(err);
      }
    });
    req.on("error", reject);
  });
}

/**
 * Build a short preview for UI
 * Extracts first few bullets or truncates JSON/string
 */
function makePreview(content: any): string | null {
  try {
    if (!content) return null;
    if (typeof content === "string") return content.slice(0, 400);
    if (content?.bullets && Array.isArray(content.bullets)) {
      return content.bullets
        .slice(0, 3)
        .map((b: any) => b.text ?? b)
        .join("\n");
    }
    // Try to stringify small JSON parts
    const s = JSON.stringify(content);
    return s.length > 400 ? s.slice(0, 400) + "…" : s;
  } catch {
    return null;
  }
}

/**
 * RESUME GENERATION: POST /api/generate/resume
 *
 * Body: { jobId: number, options?: { tone, focus, variant, model, prompt } }
 * Headers: Authorization (JWT) or X-User-Id (dev mode)
 *
 * Response: 201 with { id, kind, created_at, preview, content, persisted, metadata }
 */
export async function handleGenerateResume(
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
      const mod = await import("../services/supabaseAdmin.js");
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
  });
  res.end(bodyStr);
}

/**
 * COVER LETTER GENERATION: POST /api/generate/cover-letter
 *
 * Body: { jobId: number, options?: { tone, focus, variant, model, prompt } }
 * Headers: Authorization (JWT) or X-User-Id (dev mode)
 *
 * Response: 201 with { id, kind, created_at, preview, content, persisted, metadata }
 */
export async function handleGenerateCoverLetter(
  req: IncomingMessage,
  res: ServerResponse,
  url: URL,
  reqId: string,
  userId: string,
  counters: GenerationCounters
): Promise<void> {
  // Rate limit (5/min per user)
  const limit = checkLimit(`cover-letter:${userId}`, 5, 60_000);
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
      const mod = await import("../services/supabaseAdmin.js");
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
  });
  res.end(bodyStr);
}

/**
 * SKILLS OPTIMIZATION: POST /api/generate/skills-optimization
 *
 * Body: { jobId: number }
 * Headers: Authorization (JWT) or X-User-Id (dev mode)
 *
 * Response: 200 with { id, kind, created_at, preview, content, persisted, metadata }
 */
export async function handleSkillsOptimization(
  req: IncomingMessage,
  res: ServerResponse,
  url: URL,
  reqId: string,
  userId: string,
  counters: GenerationCounters
): Promise<void> {
  // Rate limit (5/min per user)
  const limit = checkLimit(`skills:${userId}`, 5, 60_000);
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

  counters.generate_total++;
  const start = Date.now();
  const result = await orchestrator.handleSkillsOptimization({
    userId,
    jobId,
  });
  const latencyMs = Date.now() - start;

  if (result.error) {
    counters.generate_fail++;
    logError("skills_optimization_failed", {
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
      const mod = await import("../services/supabaseAdmin.js");
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
  res.writeHead(200, {
    "Content-Type": "application/json",
    "Content-Length": Buffer.byteLength(bodyStr).toString(),
  });
  res.end(bodyStr);
}

/**
 * EXPERIENCE TAILORING: POST /api/generate/experience-tailoring
 *
 * Body: { jobId: number }
 * Headers: Authorization (JWT) or X-User-Id (dev mode)
 *
 * Response: 201 with { id, kind, created_at, preview, content, persisted, metadata }
 */
export async function handleExperienceTailoring(
  req: IncomingMessage,
  res: ServerResponse,
  url: URL,
  reqId: string,
  userId: string,
  counters: GenerationCounters
): Promise<void> {
  // Rate limit (5/min per user)
  const limit = checkLimit(`experience:${userId}`, 5, 60_000);
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
      const mod = await import("../services/supabaseAdmin.js");
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
  });
  res.end(bodyStr);
}
