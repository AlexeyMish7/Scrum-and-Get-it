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
import orchestrator from "../orchestrator.js";
import { genRequestId, logError, logInfo } from "../utils/logger.js";
import { ApiError, errorPayload } from "../utils/errors.js";
import { checkLimit } from "../utils/rateLimiter.js";

// ------------------------------------------------------------------
// Environment Loading
// ------------------------------------------------------------------
// Best-effort: load env vars from local .env if not already present.
// In dev, we run `npm run dev` inside /server so cwd points here.
function loadEnvFromFile() {
  try {
    const envPath = path.resolve(process.cwd(), ".env");
    if (!fs.existsSync(envPath)) return;
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
  } catch (e) {
    // ignore – non-fatal
  }
}

loadEnvFromFile();

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
  // Dev auth header
  const userId = req.headers["x-user-id"] as string | undefined;
  if (!userId)
    throw new ApiError(401, "missing X-User-Id header", "auth_missing");

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
      jsonReply(res, 201, {
        id: row.id,
        kind: row.kind,
        created_at: row.created_at,
        preview,
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
  const userId = req.headers["x-user-id"] as string | undefined;
  if (!userId)
    throw new ApiError(401, "missing X-User-Id header", "auth_missing");

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

// ------------------------------------------------------------------
// HTTP Server: route dispatch
// ------------------------------------------------------------------
const server = http.createServer(async (req, res) => {
  counters.requests_total++;
  const reqId = genRequestId();
  const url = new URL(
    req.url ?? "",
    `http://${req.headers.host ?? `localhost:${PORT}`}`
  );
  try {
    // ROUTE: Health
    if (req.method === "GET" && url.pathname === "/api/health") {
      await handleHealth(url, res);
      return;
    }
    // ROUTE: Generate Resume
    if (req.method === "POST" && url.pathname === "/api/generate/resume") {
      await handleGenerateResume(req, res, url, reqId);
      return;
    }
    // ROUTE: Generate Cover Letter
    if (
      req.method === "POST" &&
      url.pathname === "/api/generate/cover-letter"
    ) {
      await handleGenerateCoverLetter(req, res, url, reqId);
      return;
    }
    // 404 fallback
    throw new ApiError(404, "not found", "not_found");
  } catch (err: any) {
    if (!(err instanceof ApiError)) {
      // unexpected error path
      logError("unhandled_server_error", { reqId, error: err?.message });
    }
    sendError(res, err);
  }
});

server.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`AI orchestrator listening on http://localhost:${PORT}`);
});

export default server;
