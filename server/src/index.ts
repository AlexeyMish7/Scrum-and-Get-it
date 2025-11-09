/**
 * =============================================================
 * AI Orchestrator Dev Server (no external framework)
 * =============================================================
 * Purpose:
 *   Provide minimal HTTP endpoints for health checks and AI generation.
 *   This file avoids external dependencies (Express, Fastify) to keep the
 *   learning surface small and the logic explicit.
 *
 * High-Level Flow (POST /api/generate/resume):
 *   1. Parse request + increment counters.
 *   2. Basic auth header check (X-User-Id) – dev only.
 *   3. Rate limit per user (in-memory).
 *   4. Validate body (jobId).
 *   5. Delegate to orchestrator (fetch profile/job, build prompt, call AI).
 *   6. Optionally persist artifact (if Supabase admin env vars present).
 *   7. Return preview + metadata.
 *
 * Endpoints:
 *   GET  /api/health            – Basic status + optional deep Supabase check
 *   POST /api/generate/resume   – Generate resume artifact
 *   (Future: POST /api/generate/cover-letter, etc.)
 *
 * NOTE: All persistence and profile/job fetching is done lazily
 *       so missing Supabase env vars do not crash server startup.
 */
import http from "http";
import { URL } from "url";
import fs from "fs";
import path from "path";
import * as orchestrator from "./services/orchestrator.js";
import {
  createRequestLogger,
  logSystemEvent,
  logConfigEvent,
  legacyLogError as logError,
  legacyLogInfo as logInfo,
} from "../utils/logger.js";
import { ApiError, errorPayload } from "../utils/errors.js";
import { checkLimit } from "../utils/rateLimiter.js";
import { extractUserId } from "../utils/auth.js";

// ------------------------------------------------------------------
// Environment Loading
// ------------------------------------------------------------------
// Best-effort: load env vars from local .env if not already present.
// In dev, we run `npm run dev` inside /server so cwd points here.
// Some developers may place the file in server/src/.env by mistake; support both locations.
function loadEnvFromFiles() {
  try {
    const candidates = [
      path.resolve(process.cwd(), ".env"),
      path.resolve(process.cwd(), "src/.env"),
    ];
    for (const envPath of candidates) {
      if (!fs.existsSync(envPath)) continue;
      const content = fs.readFileSync(envPath, "utf8");
      for (const line of content.split(/\r?\n/)) {
        if (!line || /^\s*#/.test(line)) continue;
        const m = line.match(/^\s*([^=\s]+)=(.*)$/);
        if (!m) continue;
        const key = m[1];
        let val = m[2] ?? "";
        if (
          (val.startsWith('"') && val.endsWith('"')) ||
          (val.startsWith("'") && val.endsWith("'"))
        ) {
          val = val.slice(1, -1);
        }
        if (process.env[key] === undefined) {
          process.env[key] = val;
        }
      }
    }
  } catch {
    // ignore – non-fatal
  }
}

loadEnvFromFiles();

// ------------------------------------------------------------------
// Configuration validation and logging
// ------------------------------------------------------------------
function validateConfiguration() {
  // Required environment variables
  const required = ["SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"];
  const optional = [
    "AI_API_KEY",
    "CORS_ORIGIN",
    "LOG_LEVEL",
    "FAKE_AI",
    "ALLOW_DEV_AUTH",
  ];

  // Check required variables
  for (const varName of required) {
    if (!process.env[varName]) {
      logConfigEvent("missing", varName, { severity: "error" });
    } else {
      logConfigEvent("loaded", varName, {
        length: process.env[varName]!.length,
        masked: `${process.env[varName]!.substring(0, 8)}...`,
      });
    }
  }

  // Check optional variables
  for (const varName of optional) {
    if (process.env[varName]) {
      logConfigEvent("loaded", varName, {
        value: varName.includes("KEY") ? "[MASKED]" : process.env[varName],
      });
    }
  }

  // Validate AI configuration
  if (process.env.FAKE_AI !== "true" && !process.env.AI_API_KEY) {
    logConfigEvent("invalid", "AI_PROVIDER", {
      issue: "AI_API_KEY required when FAKE_AI is not true",
    });
  }

  // Validate auth configuration
  if (
    process.env.NODE_ENV === "production" &&
    process.env.ALLOW_DEV_AUTH === "true"
  ) {
    logConfigEvent("invalid", "ALLOW_DEV_AUTH", {
      issue: "Dev auth should be disabled in production",
    });
  }
}

validateConfiguration();

// ------------------------------------------------------------------
// Runtime configuration + basic counters for observability
// ------------------------------------------------------------------
const PORT = process.env.PORT ? Number(process.env.PORT) : 8787;
const startedAt = Date.now();
const counters = {
  requests_total: 0,
  generate_total: 0,
  generate_success: 0,
  generate_fail: 0,
};

// Unified JSON response helper.
function jsonReply(res: http.ServerResponse, status: number, payload: unknown) {
  const body = JSON.stringify(payload);
  res.writeHead(status, {
    "Content-Type": "application/json",
    "Content-Length": Buffer.byteLength(body).toString(),
    "Access-Control-Allow-Origin": process.env.CORS_ORIGIN || "*",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, X-User-Id",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
  });
  res.end(body);
}

// Send an error using ApiError (or generic Error) -> consistent shape.
function sendError(res: http.ServerResponse, err: any) {
  const status = err instanceof ApiError ? err.status : 500;
  jsonReply(res, status, errorPayload(err));
}

// ------------------------------------------------------------------
// Request Body Parsing
// ------------------------------------------------------------------
// Read and parse JSON body safely; returns {} for empty body.
async function readJson(req: http.IncomingMessage) {
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

// ------------------------------------------------------------------
// Artifact Preview Helper
// ------------------------------------------------------------------
// Build a short preview for UI (first few bullets or truncated JSON/string).
function makePreview(content: any) {
  try {
    if (!content) return null;
    if (typeof content === "string") return content.slice(0, 400);
    if (content?.bullets && Array.isArray(content.bullets)) {
      return content.bullets
        .slice(0, 3)
        .map((b: any) => b.text ?? b)
        .join("\n");
    }
    // try to stringify small json parts
    const s = JSON.stringify(content);
    return s.length > 400 ? s.slice(0, 400) + "…" : s;
  } catch (e) {
    return null;
  }
}

// ------------------------------------------------------------------
// Endpoint Handlers (pure functions for clarity)
// ------------------------------------------------------------------

// HEALTH: GET /api/health
async function handleHealth(url: URL, res: http.ServerResponse) {
  const supaEnv = Boolean(
    process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
  );
  const aiProvider = process.env.AI_PROVIDER ?? "openai";
  const mockMode = (process.env.FAKE_AI ?? "false").toLowerCase() === "true";
  const uptimeSec = Math.round((Date.now() - startedAt) / 1000);
  let supabaseStatus: "ok" | "missing-env" | "error" = supaEnv
    ? "ok"
    : "missing-env";
  if (supaEnv && url.searchParams.get("deep") === "1") {
    try {
      const mod = await import("../supabaseAdmin.js");
      const supabase = (mod as any).default;
      const test = await supabase
        .from("ai_artifacts")
        .select("id", { count: "exact", head: true })
        .limit(1);
      if (test.error) supabaseStatus = "error";
    } catch {
      supabaseStatus = "error";
    }
  }
  jsonReply(res, 200, {
    status: "ok",
    supabase_env: supaEnv ? "present" : "missing",
    supabase: supabaseStatus,
    ai_provider: aiProvider,
    mock_mode: mockMode,
    uptime_sec: uptimeSec,
    counters,
  });
}

// RESUME GENERATION: POST /api/generate/resume
async function handleGenerateResume(
  req: http.IncomingMessage,
  res: http.ServerResponse,
  url: URL,
  reqId: string
) {
  // JWT auth verification
  let userId: string;
  try {
    userId = await extractUserId(
      req.headers.authorization,
      req.headers["x-user-id"] as string | undefined
    );
  } catch (err: any) {
    throw new ApiError(401, err.message, "auth_failed");
  }

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
      const mod = await import("../supabaseAdmin.js");
      const insert = mod.insertAiArtifact as any;
      const row = await insert({
        user_id: artifact.user_id,
        job_id: artifact.job_id ?? null,
        kind: artifact.kind,
        title: artifact.title ?? null,
        prompt: artifact.prompt ?? null,
        model: artifact.model ?? null,
        content: artifact.content,
        metadata: { ...metadata, persisted: true },
      });
      const preview = makePreview(artifact.content);
      counters.generate_success++;
      logInfo("generate_resume_persisted", {
        reqId,
        userId,
        jobId,
        latency_ms: latencyMs,
      });
      // Include full content for resume to enable immediate UI rendering
      jsonReply(res, 201, {
        id: row.id,
        kind: row.kind,
        created_at: row.created_at,
        preview,
        content: artifact.content,
        persisted: true,
        metadata: row.metadata ?? metadata,
      });
      return;
    } catch (e: any) {
      counters.generate_fail++;
      logError("persist_failed", {
        reqId,
        userId,
        jobId,
        error: e?.message,
        latency_ms: latencyMs,
      });
      throw new ApiError(500, "failed to persist artifact", "persist_failed");
    }
  }

  // Non-persisted (mock/dev) path
  try {
    const preview = makePreview(artifact.content);
    counters.generate_success++;
    logInfo("generate_resume_mock", {
      reqId,
      userId,
      jobId,
      latency_ms: latencyMs,
    });
    // Include non-persisted content as well to keep UX consistent
    jsonReply(res, 200, {
      id: `tmp-${Date.now()}`,
      kind: artifact.kind,
      created_at: artifact.created_at,
      persisted: false,
      preview,
      content: artifact.content,
      metadata,
    });
  } catch (e: any) {
    counters.generate_fail++;
    logError("preview_failed", { reqId, userId, jobId, error: e?.message });
    throw new ApiError(500, "failed to build preview", "preview_failed");
  }
}

// COVER LETTER GENERATION: POST /api/generate/cover-letter
async function handleGenerateCoverLetter(
  req: http.IncomingMessage,
  res: http.ServerResponse,
  url: URL,
  reqId: string
) {
  let userId: string;
  try {
    userId = await extractUserId(
      req.headers.authorization,
      req.headers["x-user-id"] as string | undefined
    );
  } catch (err: any) {
    throw new ApiError(401, err.message, "auth_failed");
  }

  const limit = checkLimit(`cover_letter:${userId}`, 5, 60_000);
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
      const mod = await import("../supabaseAdmin.js");
      const insert = mod.insertAiArtifact as any;
      const row = await insert({
        user_id: artifact.user_id,
        job_id: artifact.job_id ?? null,
        kind: artifact.kind,
        title: artifact.title ?? null,
        prompt: artifact.prompt ?? null,
        model: artifact.model ?? null,
        content: artifact.content,
        metadata: { ...metadata, persisted: true },
      });
      const preview = makePreview(artifact.content);
      counters.generate_success++;
      logInfo("generate_cover_letter_persisted", {
        reqId,
        userId,
        jobId,
        latency_ms: latencyMs,
      });
      jsonReply(res, 201, {
        id: row.id,
        kind: row.kind,
        created_at: row.created_at,
        preview,
      });
      return;
    } catch (e: any) {
      counters.generate_fail++;
      logError("cover_letter_persist_failed", {
        reqId,
        userId,
        jobId,
        error: e?.message,
        latency_ms: latencyMs,
      });
      throw new ApiError(500, "failed to persist artifact", "persist_failed");
    }
  }

  try {
    const preview = makePreview(artifact.content);
    counters.generate_success++;
    logInfo("generate_cover_letter_mock", {
      reqId,
      userId,
      jobId,
      latency_ms: latencyMs,
    });
    jsonReply(res, 200, {
      id: `tmp-${Date.now()}`,
      kind: artifact.kind,
      created_at: artifact.created_at,
      persisted: false,
      preview,
      metadata,
    });
  } catch (e: any) {
    counters.generate_fail++;
    logError("cover_letter_preview_failed", {
      reqId,
      userId,
      jobId,
      error: e?.message,
    });
    throw new ApiError(500, "failed to build preview", "preview_failed");
  }
}

// SKILLS OPTIMIZATION: POST /api/generate/skills-optimization
async function handleSkillsOptimization(
  req: http.IncomingMessage,
  res: http.ServerResponse,
  url: URL,
  reqId: string
) {
  let userId: string;
  try {
    userId = await extractUserId(
      req.headers.authorization,
      req.headers["x-user-id"] as string | undefined
    );
  } catch (err: any) {
    throw new ApiError(401, err.message, "auth_failed");
  }

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
      const mod = await import("../supabaseAdmin.js");
      const insert = mod.insertAiArtifact as any;
      const row = await insert({
        user_id: artifact.user_id,
        job_id: artifact.job_id ?? null,
        kind: artifact.kind,
        title: artifact.title ?? null,
        prompt: artifact.prompt ?? null,
        model: artifact.model ?? null,
        content: artifact.content,
        metadata: { ...metadata, persisted: true },
      });
      const preview = makePreview(artifact.content);
      counters.generate_success++;
      logInfo("skills_optimization_persisted", {
        reqId,
        userId,
        jobId,
        latency_ms: latencyMs,
      });
      jsonReply(res, 201, {
        id: row.id,
        kind: row.kind,
        created_at: row.created_at,
        preview,
      });
      return;
    } catch (e: any) {
      counters.generate_fail++;
      logError("skills_optimization_persist_failed", {
        reqId,
        userId,
        jobId,
        error: e?.message,
        latency_ms: latencyMs,
      });
      throw new ApiError(500, "failed to persist artifact", "persist_failed");
    }
  }

  try {
    const preview = makePreview(artifact.content);
    counters.generate_success++;
    logInfo("skills_optimization_mock", {
      reqId,
      userId,
      jobId,
      latency_ms: latencyMs,
    });
    jsonReply(res, 200, {
      id: `tmp-${Date.now()}`,
      kind: artifact.kind,
      created_at: artifact.created_at,
      persisted: false,
      preview,
      metadata,
    });
  } catch (e: any) {
    counters.generate_fail++;
    logError("skills_optimization_preview_failed", {
      reqId,
      userId,
      jobId,
      error: e?.message,
    });
    throw new ApiError(500, "failed to build preview", "preview_failed");
  }
}

// EXPERIENCE TAILORING (UC-050): POST /api/generate/experience-tailoring
// Flow mirrors other generation endpoints: auth → rate-limit → parse → orchestrate → persist → return
async function handleExperienceTailoring(
  req: http.IncomingMessage,
  res: http.ServerResponse,
  url: URL,
  reqId: string
) {
  let userId: string;
  try {
    userId = await extractUserId(
      req.headers.authorization,
      req.headers["x-user-id"] as string | undefined
    );
  } catch (err: any) {
    throw new ApiError(401, err.message, "auth_failed");
  }

  const limit = checkLimit(`experience_tailoring:${userId}`, 5, 60_000);
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
      const mod = await import("../supabaseAdmin.js");
      const insert = mod.insertAiArtifact as any;
      const row = await insert({
        user_id: artifact.user_id,
        job_id: artifact.job_id ?? null,
        kind: artifact.kind, // stored as 'resume' with metadata.subkind
        title: artifact.title ?? null,
        prompt: artifact.prompt ?? null,
        model: artifact.model ?? null,
        content: artifact.content,
        metadata: { ...metadata, persisted: true },
      });
      const preview = makePreview(artifact.content);
      counters.generate_success++;
      logInfo("experience_tailoring_persisted", {
        reqId,
        userId,
        jobId,
        latency_ms: latencyMs,
      });
      jsonReply(res, 201, {
        id: row.id,
        kind: row.kind,
        created_at: row.created_at,
        preview,
        content: artifact.content, // include full content for immediate merge UI
        persisted: true,
      });
      return;
    } catch (e: any) {
      counters.generate_fail++;
      logError("experience_tailoring_persist_failed", {
        reqId,
        userId,
        jobId,
        error: e?.message,
        latency_ms: latencyMs,
      });
      throw new ApiError(500, "failed to persist artifact", "persist_failed");
    }
  }

  try {
    const preview = makePreview(artifact.content);
    counters.generate_success++;
    logInfo("experience_tailoring_mock", {
      reqId,
      userId,
      jobId,
      latency_ms: latencyMs,
    });
    jsonReply(res, 200, {
      id: `tmp-${Date.now()}`,
      kind: artifact.kind,
      created_at: artifact.created_at,
      persisted: false,
      preview,
      content: artifact.content,
      metadata,
    });
  } catch (e: any) {
    counters.generate_fail++;
    logError("experience_tailoring_preview_failed", {
      reqId,
      userId,
      jobId,
      error: e?.message,
    });
    throw new ApiError(500, "failed to build preview", "preview_failed");
  }
}

// ------------------------------------------------------------------
// HTTP Server: route dispatch
// ------------------------------------------------------------------
const server = http.createServer(async (req, res) => {
  counters.requests_total++;
  const requestStart = Date.now();

  // Create request-scoped logger
  const logger = createRequestLogger(req);
  const url = new URL(
    req.url ?? "",
    `http://${req.headers.host ?? `localhost:${PORT}`}`
  );

  // Log request start
  logger.requestStart(req.method || "UNKNOWN", url.pathname);

  try {
    // CORS preflight
    if (req.method === "OPTIONS") {
      res.writeHead(204, {
        "Access-Control-Allow-Origin": process.env.CORS_ORIGIN || "*",
        "Access-Control-Allow-Headers":
          "Content-Type, Authorization, X-User-Id",
        "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
        "Access-Control-Max-Age": "86400",
      });
      res.end();

      // Log successful OPTIONS
      const duration = Date.now() - requestStart;
      logger.requestEnd(req.method || "OPTIONS", url.pathname, 204, duration);
      return;
    }

    // Extract user context early for logging (if available)
    try {
      const authHeader = req.headers.authorization;
      const userIdHeader = req.headers["x-user-id"] as string | undefined;
      if (authHeader || userIdHeader) {
        const userId = await extractUserId(authHeader, userIdHeader);
        if (userId) {
          logger.setContext({ userId });
        }
      }
    } catch {
      // Auth extraction failed, but we'll let endpoints handle auth errors
    }

    // ROUTE: Health
    if (req.method === "GET" && url.pathname === "/api/health") {
      await handleHealth(url, res);
      const duration = Date.now() - requestStart;
      logger.requestEnd(req.method, url.pathname, 200, duration);
      return;
    }
    // ROUTE: Create job materials linkage
    if (req.method === "POST" && url.pathname === "/api/job-materials") {
      await handleCreateJobMaterials(
        req,
        res,
        url,
        logger.getContext().requestId || "unknown"
      );
      const duration = Date.now() - requestStart;
      logger.requestEnd(req.method, url.pathname, 201, duration);
      return;
    }
    // ROUTE: List job materials for a job
    if (
      req.method === "GET" &&
      /^\/api\/jobs\/\d+\/materials$/.test(url.pathname)
    ) {
      await handleListJobMaterialsForJob(req, res, url);
      const duration = Date.now() - requestStart;
      logger.requestEnd(req.method, url.pathname, 200, duration);
      return;
    }
    // ROUTE: List AI Artifacts
    if (req.method === "GET" && url.pathname === "/api/artifacts") {
      await handleListArtifacts(req, res, url);
      const duration = Date.now() - requestStart;
      logger.requestEnd(req.method, url.pathname, 200, duration);
      return;
    }
    // ROUTE: Get Artifact by ID
    if (req.method === "GET" && url.pathname.startsWith("/api/artifacts/")) {
      await handleGetArtifact(req, res, url);
      const duration = Date.now() - requestStart;
      logger.requestEnd(req.method, url.pathname, 200, duration);
      return;
    }
    // ROUTE: Generate Resume
    if (req.method === "POST" && url.pathname === "/api/generate/resume") {
      await handleGenerateResume(
        req,
        res,
        url,
        logger.getContext().requestId || "unknown"
      );
      const duration = Date.now() - requestStart;
      logger.requestEnd(req.method, url.pathname, 201, duration);
      return;
    }
    // ROUTE: Generate Cover Letter
    if (
      req.method === "POST" &&
      url.pathname === "/api/generate/cover-letter"
    ) {
      await handleGenerateCoverLetter(
        req,
        res,
        url,
        logger.getContext().requestId || "unknown"
      );
      const duration = Date.now() - requestStart;
      logger.requestEnd(req.method, url.pathname, 201, duration);
      return;
    }
    // ROUTE: Skills Optimization
    if (
      req.method === "POST" &&
      url.pathname === "/api/generate/skills-optimization"
    ) {
      await handleSkillsOptimization(
        req,
        res,
        url,
        logger.getContext().requestId || "unknown"
      );
      const duration = Date.now() - requestStart;
      logger.requestEnd(req.method, url.pathname, 201, duration);
      return;
    }
    // ROUTE: Experience Tailoring
    if (
      req.method === "POST" &&
      url.pathname === "/api/generate/experience-tailoring"
    ) {
      await handleExperienceTailoring(
        req,
        res,
        url,
        logger.getContext().requestId || "unknown"
      );
      const duration = Date.now() - requestStart;
      logger.requestEnd(req.method, url.pathname, 201, duration);
      return;
    }
    // 404 fallback
    throw new ApiError(404, "not found", "not_found");
  } catch (err: any) {
    const duration = Date.now() - requestStart;
    const statusCode = err instanceof ApiError ? err.status : 500;

    if (!(err instanceof ApiError)) {
      // unexpected error path
      logger.error("unhandled_server_error", err);
    }

    logger.requestEnd(
      req.method || "UNKNOWN",
      url.pathname,
      statusCode,
      duration,
      {
        error: err?.message,
        error_code: err instanceof ApiError ? err.code : "internal_error",
      }
    );

    sendError(res, err);
  }
});

server.listen(PORT, () => {
  // Log system startup with configuration
  logSystemEvent("startup", {
    port: PORT,
    node_version: process.version,
    log_level: process.env.LOG_LEVEL || "info",
    fake_ai: process.env.FAKE_AI === "true",
    allow_dev_auth: process.env.ALLOW_DEV_AUTH === "true",
    supabase_configured: Boolean(
      process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
    ),
    cors_origin: process.env.CORS_ORIGIN || "*",
  });

  // eslint-disable-next-line no-console
  console.log(`AI orchestrator listening on http://localhost:${PORT}`);
});

// ---------------------------------------------------------------
// Artifact listing + retrieval handlers
// ---------------------------------------------------------------
async function handleListArtifacts(
  req: http.IncomingMessage,
  res: http.ServerResponse,
  url: URL
) {
  let userId: string;
  try {
    userId = await extractUserId(
      req.headers.authorization,
      req.headers["x-user-id"] as string | undefined
    );
  } catch (err: any) {
    throw new ApiError(401, err.message, "auth_failed");
  }
  const kind = url.searchParams.get("kind") || undefined;
  const jobIdParam = url.searchParams.get("jobId");
  const jobId = jobIdParam ? Number(jobIdParam) : undefined;
  const limit = Number(url.searchParams.get("limit") || 20);
  const offset = Number(url.searchParams.get("offset") || 0);
  if (jobIdParam && Number.isNaN(jobId)) {
    throw new ApiError(400, "jobId must be numeric", "bad_request");
  }
  const canPersist = Boolean(
    process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
  );
  if (!canPersist) {
    // In mock mode, return empty list (no persistence available)
    jsonReply(res, 200, { items: [], persisted: false });
    return;
  }
  try {
    const mod = await import("../supabaseAdmin.js");
    const listFn = (mod as any).listAiArtifactsForUser;
    if (typeof listFn !== "function") throw new Error("list function missing");
    const data = await listFn({ userId, kind, jobId, limit, offset });
    jsonReply(res, 200, { items: data, persisted: true });
  } catch (e: any) {
    throw new ApiError(
      500,
      e?.message || "artifact list failed",
      "artifact_list_failed"
    );
  }
}

async function handleGetArtifact(
  req: http.IncomingMessage,
  res: http.ServerResponse,
  url: URL
) {
  let userId: string;
  try {
    userId = await extractUserId(
      req.headers.authorization,
      req.headers["x-user-id"] as string | undefined
    );
  } catch (err: any) {
    throw new ApiError(401, err.message, "auth_failed");
  }
  const id = url.pathname.split("/api/artifacts/")[1];
  if (!id) throw new ApiError(400, "missing artifact id", "bad_request");
  const canPersist = Boolean(
    process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
  );
  if (!canPersist) {
    throw new ApiError(
      404,
      "artifact not found (persistence disabled)",
      "not_found"
    );
  }
  try {
    const mod = await import("../supabaseAdmin.js");
    const getFn = (mod as any).getAiArtifactForUser;
    if (typeof getFn !== "function") throw new Error("get function missing");
    const row = await getFn(userId, id);
    if (!row) throw new ApiError(404, "artifact not found", "not_found");
    jsonReply(res, 200, { artifact: row });
  } catch (e: any) {
    if (e instanceof ApiError) throw e;
    throw new ApiError(
      500,
      e?.message || "artifact fetch failed",
      "artifact_fetch_failed"
    );
  }
}

// ---------------------------------------------------------------
// Job Materials handlers
// ---------------------------------------------------------------
/**
 * POST /api/job-materials
 * Body: {
 *   jobId: number,
 *   resume_artifact_id?: string,
 *   resume_document_id?: string,
 *   cover_artifact_id?: string,
 *   cover_document_id?: string,
 *   metadata?: Record<string, unknown>
 * }
 * Validates ownership and creates a job_materials row.
 */
async function handleCreateJobMaterials(
  req: http.IncomingMessage,
  res: http.ServerResponse,
  url: URL,
  reqId: string
) {
  let userId: string;
  try {
    userId = await extractUserId(
      req.headers.authorization,
      req.headers["x-user-id"] as string | undefined
    );
  } catch (err: any) {
    throw new ApiError(401, err.message, "auth_failed");
  }

  let body: any;
  try {
    body = await readJson(req);
  } catch (e: any) {
    throw new ApiError(400, "invalid JSON body", "bad_json");
  }

  const jobId = Number(body?.jobId);
  if (!Number.isFinite(jobId)) {
    throw new ApiError(
      400,
      "jobId is required and must be a number",
      "bad_request"
    );
  }

  const resume_artifact_id = body?.resume_artifact_id as string | undefined;
  const cover_artifact_id = body?.cover_artifact_id as string | undefined;
  const resume_document_id = body?.resume_document_id as string | undefined;
  const cover_document_id = body?.cover_document_id as string | undefined;
  const metadata =
    (body?.metadata as Record<string, unknown> | undefined) ?? {};

  if (
    !resume_artifact_id &&
    !cover_artifact_id &&
    !resume_document_id &&
    !cover_document_id
  ) {
    throw new ApiError(
      400,
      "at least one of resume/cover artifact/document id must be provided",
      "bad_request"
    );
  }

  let mod: any;
  try {
    mod = await import("../supabaseAdmin.js");
  } catch (e: any) {
    throw new ApiError(
      500,
      "server not configured for persistence",
      "server_config"
    );
  }

  const job = await mod.getJob(jobId);
  if (!job) throw new ApiError(404, "job not found", "not_found");
  if (job.user_id && job.user_id !== userId) {
    throw new ApiError(403, "job does not belong to user", "forbidden");
  }

  if (resume_artifact_id) {
    const a = await mod.getAiArtifactForUser(userId, resume_artifact_id);
    if (!a) throw new ApiError(404, "resume artifact not found", "not_found");
    if (a.kind !== "resume") {
      throw new ApiError(
        400,
        "resume_artifact_id must point to kind=resume",
        "bad_request"
      );
    }
  }
  if (cover_artifact_id) {
    const a = await mod.getAiArtifactForUser(userId, cover_artifact_id);
    if (!a) throw new ApiError(404, "cover artifact not found", "not_found");
    if (a.kind !== "cover_letter") {
      throw new ApiError(
        400,
        "cover_artifact_id must point to kind=cover_letter",
        "bad_request"
      );
    }
  }
  if (resume_document_id) {
    const d = await mod.getDocumentForUser(userId, resume_document_id);
    if (!d) throw new ApiError(404, "resume document not found", "not_found");
    if (d.kind && d.kind !== "resume") {
      throw new ApiError(
        400,
        "resume_document_id must be a resume document",
        "bad_request"
      );
    }
  }
  if (cover_document_id) {
    const d = await mod.getDocumentForUser(userId, cover_document_id);
    if (!d) throw new ApiError(404, "cover document not found", "not_found");
    if (d.kind && d.kind !== "cover_letter") {
      throw new ApiError(
        400,
        "cover_document_id must be a cover_letter document",
        "bad_request"
      );
    }
  }

  try {
    const row = await mod.insertJobMaterials({
      user_id: userId,
      job_id: jobId,
      resume_artifact_id: resume_artifact_id ?? null,
      cover_artifact_id: cover_artifact_id ?? null,
      resume_document_id: resume_document_id ?? null,
      cover_document_id: cover_document_id ?? null,
      metadata,
    });
    logInfo("job_materials_created", { reqId, userId, jobId, id: row.id });
    jsonReply(res, 201, { material: row });
  } catch (e: any) {
    logError("job_materials_insert_failed", {
      reqId,
      userId,
      jobId,
      error: e?.message,
    });
    throw new ApiError(500, "failed to create job materials", "insert_failed");
  }
}

/** GET /api/jobs/:jobId/materials?limit=10 */
async function handleListJobMaterialsForJob(
  req: http.IncomingMessage,
  res: http.ServerResponse,
  url: URL
) {
  let userId: string;
  try {
    userId = await extractUserId(
      req.headers.authorization,
      req.headers["x-user-id"] as string | undefined
    );
  } catch (err: any) {
    throw new ApiError(401, err.message, "auth_failed");
  }
  const m = url.pathname.match(/^\/api\/jobs\/(\d+)\/materials$/);
  const jobId = m ? Number(m[1]) : NaN;
  if (!Number.isFinite(jobId)) {
    throw new ApiError(400, "jobId must be numeric", "bad_request");
  }
  const limit = Number(url.searchParams.get("limit") || 10);
  const canPersist = Boolean(
    process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
  );
  if (!canPersist) {
    jsonReply(res, 200, { items: [], persisted: false });
    return;
  }
  try {
    const mod = await import("../supabaseAdmin.js");
    const items = await (mod as any).listJobMaterialsForJob(
      userId,
      jobId,
      limit
    );
    jsonReply(res, 200, { items, persisted: true });
  } catch (e: any) {
    throw new ApiError(
      500,
      e?.message || "materials list failed",
      "materials_list_failed"
    );
  }
}

export default server;
