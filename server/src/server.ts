/**
 * =============================================================
 * SERVER SETUP AND ROUTING
 * =============================================================
 * Purpose:
 *   Core HTTP server setup that ties together middleware and routes.
 *   Handles environment loading, configuration validation, CORS,
 *   request routing, and error handling.
 *
 * Flow:
 *   1. Load environment variables from .env files
 *   2. Validate required and optional configuration
 *   3. Initialize server counters and state
 *   4. Create HTTP server with routing logic
 *   5. Apply middleware (CORS, logging, auth)
 *   6. Dispatch to route handlers
 *   7. Handle errors and send JSON responses
 *
 * Exports:
 *   - createServer(): Returns configured HTTP server instance
 */

import http from "http";
import { URL } from "url";
import fs from "fs";
import path from "path";
import {
  logSystemEvent,
  logConfigEvent,
  createRequestLogger,
  legacyLogError as logError,
} from "../utils/logger.js";
import { ApiError, errorPayload } from "../utils/errors.js";
import { getCorsHeaders, handleCorsPreflight } from "./middleware/cors.js";
import { createRequestContext } from "./middleware/logging.js";
import { requireAuth, tryAuth } from "./middleware/auth.js";
import {
  handleHealth,
  handleGenerateResume,
  handleGenerateCoverLetter,
  handleSkillsOptimization,
  handleExperienceTailoring,
  handleCompanyResearch,
  handleRelationship,
  handleProfileTips,
  handleJobImport,
  handleJobMatch,
  handleSalaryResearch,
  handleListArtifacts,
  handleGetArtifact,
  handleCreateJobMaterials,
  handleListJobMaterialsForJob,
  handleListDrafts,
  handleGetDraft,
  handleCreateDraft,
  handleUpdateDraft,
  handleDeleteDraft,
} from "./routes/index.js";
import { post as handleNetworkingAnalytics } from "./routes/analytics/networking.js";
import { post as handleSalaryAnalytics } from "./routes/analytics/salary.js";
import { post as handleGoalsAnalytics } from "./routes/analytics/goals.js";

// ------------------------------------------------------------------
// ENVIRONMENT LOADING
// ------------------------------------------------------------------
/**
 * Load environment variables from .env files
 *
 * Flow:
 * - Check for .env in cwd or src/ directory
 * - Parse key=value lines (ignore comments and blank lines)
 * - Handle quoted values (single/double quotes)
 * - Only set vars that don't already exist in process.env
 *
 * Error handling: Non-fatal; logs but doesn't crash on file read errors
 */
export function loadEnvFromFiles() {
  try {
    const candidates = [
      path.resolve(process.cwd(), ".env"),
      path.resolve(process.cwd(), "src/.env"),
    ];

    for (const envPath of candidates) {
      if (!fs.existsSync(envPath)) continue;

      const content = fs.readFileSync(envPath, "utf8");
      for (const line of content.split(/\r?\n/)) {
        // Skip blank lines and comments
        if (!line || /^\s*#/.test(line)) continue;

        // Match KEY=VALUE pattern
        const m = line.match(/^\s*([^=\s]+)=(.*)$/);
        if (!m) continue;

        const key = m[1];
        let val = m[2] ?? "";

        // Strip surrounding quotes
        if (
          (val.startsWith('"') && val.endsWith('"')) ||
          (val.startsWith("'") && val.endsWith("'"))
        ) {
          val = val.slice(1, -1);
        }

        // Only set if not already defined
        if (process.env[key] === undefined) {
          process.env[key] = val;
        }
      }
    }
  } catch {
    // Non-fatal: ignore env loading errors
  }
}

// ------------------------------------------------------------------
// CONFIGURATION VALIDATION
// ------------------------------------------------------------------
/**
 * Validate environment configuration and log issues
 *
 * Checks:
 * - Required vars: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 * - Optional vars: AI_API_KEY, CORS_ORIGIN, LOG_LEVEL, FAKE_AI, ALLOW_DEV_AUTH
 * - AI provider validation (AI_API_KEY required unless FAKE_AI=true)
 * - Auth security (ALLOW_DEV_AUTH should be disabled in production)
 *
 * Outputs: Structured logs for each config item (missing, loaded, invalid)
 */
export function validateConfiguration() {
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

// ------------------------------------------------------------------
// SERVER STATE AND COUNTERS
// ------------------------------------------------------------------
export interface ServerCounters {
  requests_total: number;
  generate_total: number;
  generate_success: number;
  generate_fail: number;
}

let startedAt = Date.now();
const counters: ServerCounters = {
  requests_total: 0,
  generate_total: 0,
  generate_success: 0,
  generate_fail: 0,
};

// ------------------------------------------------------------------
// RESPONSE HELPERS
// ------------------------------------------------------------------
/**
 * Send JSON response with proper headers
 *
 * Inputs:
 * - res: HTTP response object
 * - status: HTTP status code
 * - payload: Any JSON-serializable object
 *
 * Outputs: Sends complete HTTP response with JSON body
 */
function jsonReply(res: http.ServerResponse, status: number, payload: unknown) {
  const body = JSON.stringify(payload);
  const corsHeaders = getCorsHeaders();

  res.writeHead(status, {
    "Content-Type": "application/json",
    "Content-Length": Buffer.byteLength(body).toString(),
    ...corsHeaders,
  });
  res.end(body);
}

/**
 * Send error response using ApiError or generic Error
 *
 * Inputs:
 * - res: HTTP response object
 * - err: Error object (ApiError or Error)
 *
 * Outputs: JSON error response with appropriate status code
 */
function sendError(res: http.ServerResponse, err: any) {
  const status = err instanceof ApiError ? err.status : 500;
  jsonReply(res, status, errorPayload(err));
}

// ------------------------------------------------------------------
// REQUEST ROUTING
// ------------------------------------------------------------------
/**
 * Main HTTP request handler with routing logic
 *
 * Flow:
 * 1. Increment request counter
 * 2. Create request context (logging, timing)
 * 3. Handle CORS preflight (OPTIONS)
 * 4. Parse URL and route to handlers
 * 5. Apply auth middleware for protected routes
 * 6. Call route handler with necessary context
 * 7. Handle errors and send response
 * 8. Log completion with timing
 *
 * Routes:
 * - GET  /api/health
 * - POST /api/generate/resume
 * - POST /api/generate/cover-letter
 * - POST /api/generate/skills-optimization
 * - POST /api/generate/experience-tailoring
 * - POST /api/generate/company-research
 * - POST /api/generate/job-import
 * - POST /api/generate/job-match
 * - GET  /api/artifacts
 * - GET  /api/artifacts/:id
 * - POST /api/job-materials
 * - GET  /api/jobs/:jobId/materials
 * - GET  /api/cover-letter/drafts
 * - GET  /api/cover-letter/drafts/:id
 * - POST /api/cover-letter/drafts
 * - PATCH /api/cover-letter/drafts/:id
 * - DELETE /api/cover-letter/drafts/:id
 *
 * Error modes:
 * - 404 for unknown routes
 * - 401 for missing/invalid auth on protected routes
 * - 500 for unhandled exceptions
 */
async function handleRequest(
  req: http.IncomingMessage,
  res: http.ServerResponse
) {
  counters.requests_total++;

  // Skip logging health checks to reduce clutter
  const isHealthCheck = req.url === "/api/health";
  if (!isHealthCheck) {
    console.log("🧭 Incoming request:", req.method, req.url);
  }

  const ctx = createRequestContext(req);

  try {
    // Handle CORS preflight
    if (req.method === "OPTIONS") {
      handleCorsPreflight(req, res);
      ctx.logComplete(req.method, req.url || "/", 204);
      return;
    }

    const url = new URL(req.url!, `http://${req.headers.host}`);
    const pathname = url.pathname;
    const method = req.method || "GET";

    // ------------------------------------------------------------------
    // HEALTH CHECK ENDPOINT (public)
    // ------------------------------------------------------------------
    if (method === "GET" && pathname === "/api/health") {
      await handleHealth(url, res, { startedAt, counters });
      // Don't log health checks to reduce clutter
      return;
    }

    // ------------------------------------------------------------------
    // AI GENERATION ENDPOINTS (protected)
    // ------------------------------------------------------------------
    if (method === "POST" && pathname === "/api/generate/resume") {
      const userId = await requireAuth(req);
      await handleGenerateResume(req, res, url, ctx.reqId, userId, counters);
      ctx.logComplete(method, pathname, 201);
      return;
    }

    if (method === "POST" && pathname === "/api/generate/cover-letter") {
      const userId = await requireAuth(req);
      await handleGenerateCoverLetter(
        req,
        res,
        url,
        ctx.reqId,
        userId,
        counters
      );
      ctx.logComplete(method, pathname, 201);
      return;
    }

    if (method === "POST" && pathname === "/api/generate/skills-optimization") {
      const userId = await requireAuth(req);
      await handleSkillsOptimization(
        req,
        res,
        url,
        ctx.reqId,
        userId,
        counters
      );
      ctx.logComplete(method, pathname, 201);
      return;
    }

    if (
      method === "POST" &&
      pathname === "/api/generate/experience-tailoring"
    ) {
      const userId = await requireAuth(req);
      await handleExperienceTailoring(
        req,
        res,
        url,
        ctx.reqId,
        userId,
        counters
      );
      ctx.logComplete(method, pathname, 201);
      return;
    }

    if (method === "POST" && pathname === "/api/generate/company-research") {
      const userId = await requireAuth(req);
      await handleCompanyResearch(req, res, url, ctx.reqId, userId, counters);
      ctx.logComplete(method, pathname, 201);
      return;
    }

    if (method === "POST" && pathname === "/api/generate/job-import") {
      const userId = await requireAuth(req);
      await handleJobImport(req, res, url, ctx.reqId, userId, counters);
      ctx.logComplete(method, pathname, 200);
      return;
    }

    if (method === "POST" && pathname === "/api/generate/job-match") {
      const userId = await requireAuth(req);
      await handleJobMatch(req, res, url, ctx.reqId, userId, counters);
      ctx.logComplete(method, pathname, 200);
      return;
    }

    if (method === "POST" && pathname === "/api/generate/checklist") {
      const userId = await requireAuth(req);
      // dynamic import to avoid loading when not needed
      const mod = await import("./routes/generate/checklist.js");
      await mod.post(req, res, url, ctx.reqId, userId);
      ctx.logComplete(method, pathname, 201);
      return;
    }

    if (method === "POST" && pathname === "/api/generate/relationship") {
      const userId = await requireAuth(req);
      await handleRelationship(
        req,
        res,
        url,
        ctx.reqId,
        userId,
        counters as any
      );
      ctx.logComplete(method, pathname, 200);
      return;
    }

    if (method === "POST" && pathname === "/api/generate/profile-tips") {
      const userId = await requireAuth(req);
      const { handleProfileTips } = await import("./routes/index.js");
      await handleProfileTips(req, res, url, ctx.reqId, userId, counters as any);
      ctx.logComplete(method, pathname, 200);
      return;
    }

    if (method === "POST" && pathname === "/api/generate/interview-request") {
      const userId = await requireAuth(req);
      const { handleGenerateInterviewRequest } = await import("./routes/index.js");
      await handleGenerateInterviewRequest(req, res, url, ctx.reqId, userId, counters as any);
      ctx.logComplete(method, pathname, 201);
      return;
    }

    if (method === "POST" && pathname === "/api/generate/reference-points") {
      const userId = await requireAuth(req);
      const { handleReferencePoints } = await import("./routes/index.js");
      await handleReferencePoints(req, res, url, ctx.reqId, userId, counters as any);
      ctx.logComplete(method, pathname, 200);
      return;
    }

    // ------------------------------------------------------------------
    // NETWORKING ANALYTICS ENDPOINT (protected)
    // ------------------------------------------------------------------
    if (method === "POST" && pathname === "/api/analytics/networking") {
      const userId = await requireAuth(req);
      await handleNetworkingAnalytics(req, res, url, ctx.reqId, userId);
      ctx.logComplete(method, pathname, 200);
      return;
    }

    // ------------------------------------------------------------------
    // SALARY ANALYTICS ENDPOINT (protected)
    // ------------------------------------------------------------------
    if (method === "POST" && pathname === "/api/analytics/salary") {
      const userId = await requireAuth(req);
      await handleSalaryAnalytics(req, res, url, ctx.reqId, userId);
      ctx.logComplete(method, pathname, 200);
      return;
    }

    // ------------------------------------------------------------------
    // GOALS ANALYTICS ENDPOINT (protected)
    // ------------------------------------------------------------------
    if (method === "POST" && pathname === "/api/analytics/goals") {
      const userId = await requireAuth(req);
      await handleGoalsAnalytics(req, res, userId);
      ctx.logComplete(method, pathname, 200);
      return;
    }

    // ------------------------------------------------------------------
    // COMPETITIVE BENCHMARKING ENDPOINT (protected)
    // ------------------------------------------------------------------
    if (method === "POST" && pathname === "/api/analytics/competitive/position") {
      console.log("🎯 HIT COMPETITIVE ROUTE!");
      try {
        const { handleGetCompetitivePosition } = await import("./routes/analytics/competitive.js");
        console.log("✅ Import successful, calling handler...");
        await handleGetCompetitivePosition(req, res);
        console.log("✅ Handler completed");
        ctx.logComplete(method, pathname, 200);
        return;
      } catch (error) {
        console.error("❌ ERROR in competitive route:", error);
        jsonReply(res, 500, { error: "Internal server error" });
        return;
      }
    }

    // ------------------------------------------------------------------
    // ADMIN BENCHMARK ENDPOINTS (protected, admin only in production)
    // ------------------------------------------------------------------
    if (method === "POST" && pathname === "/api/admin/compute-benchmarks") {
      const userId = await requireAuth(req);
      const { handleComputeBenchmarks } = await import("./routes/admin/benchmarks.js");
      await handleComputeBenchmarks(req, res);
      ctx.logComplete(method, pathname, 200);
      return;
    }

    if (method === "GET" && pathname === "/api/admin/benchmark-status") {
      const userId = await requireAuth(req);
      const { handleBenchmarkStatus } = await import("./routes/admin/benchmarks.js");
      await handleBenchmarkStatus(req, res);
      ctx.logComplete(method, pathname, 200);
      return;
    }

    // ------------------------------------------------------------------
    // SALARY RESEARCH ENDPOINT (protected)
    // ------------------------------------------------------------------
    if (method === "POST" && pathname === "/api/salary-research") {
      const userId = await requireAuth(req);
      await handleSalaryResearch(req, res, url, ctx.reqId, userId, counters);
      ctx.logComplete(method, pathname, 201);
      return;
    }

    // ------------------------------------------------------------------
    // ARTIFACT ENDPOINTS (protected)
    // ------------------------------------------------------------------
    if (method === "GET" && pathname === "/api/artifacts") {
      const userId = await requireAuth(req);
      await handleListArtifacts(req, res, url, userId);
      ctx.logComplete(method, pathname, 200);
      return;
    }

    // GET /api/artifacts/:id
    if (method === "GET" && pathname.startsWith("/api/artifacts/")) {
      const userId = await requireAuth(req);
      await handleGetArtifact(req, res, url, userId);
      ctx.logComplete(method, pathname, 200);
      return;
    }

    // ------------------------------------------------------------------
    // JOB MATERIALS ENDPOINTS (protected)
    // ------------------------------------------------------------------
    if (method === "POST" && pathname === "/api/job-materials") {
      const userId = await requireAuth(req);
      await handleCreateJobMaterials(req, res, url, ctx.reqId, userId);
      ctx.logComplete(method, pathname, 201);
      return;
    }

    // GET /api/jobs/:jobId/materials
    if (method === "GET" && pathname.match(/^\/api\/jobs\/\d+\/materials$/)) {
      const userId = await requireAuth(req);
      await handleListJobMaterialsForJob(req, res, url, userId);
      ctx.logComplete(method, pathname, 200);
      return;
    }

    

    // ------------------------------------------------------------------
    // COVER LETTER DRAFTS ENDPOINTS (protected)
    // ------------------------------------------------------------------
    // GET /api/cover-letter/drafts
    if (method === "GET" && pathname === "/api/cover-letter/drafts") {
      const userId = await requireAuth(req);
      await handleListDrafts(req, res, url, ctx.reqId, userId);
      ctx.logComplete(method, pathname, 200);
      return;
    }

    // GET /api/cover-letter/drafts/:id
    if (
      method === "GET" &&
      pathname.match(/^\/api\/cover-letter\/drafts\/.+$/)
    ) {
      const userId = await requireAuth(req);
      const draftId = pathname.split("/").pop() || "";
      await handleGetDraft(req, res, url, ctx.reqId, userId, draftId);
      ctx.logComplete(method, pathname, 200);
      return;
    }

    // POST /api/cover-letter/drafts
    if (method === "POST" && pathname === "/api/cover-letter/drafts") {
      const userId = await requireAuth(req);
      await handleCreateDraft(req, res, url, ctx.reqId, userId);
      ctx.logComplete(method, pathname, 201);
      return;
    }

    // PATCH /api/cover-letter/drafts/:id
    if (
      method === "PATCH" &&
      pathname.match(/^\/api\/cover-letter\/drafts\/.+$/)
    ) {
      const userId = await requireAuth(req);
      const draftId = pathname.split("/").pop() || "";
      await handleUpdateDraft(req, res, url, ctx.reqId, userId, draftId);
      ctx.logComplete(method, pathname, 200);
      return;
    }

    // DELETE /api/cover-letter/drafts/:id
    if (
      method === "DELETE" &&
      pathname.match(/^\/api\/cover-letter\/drafts\/.+$/)
    ) {
      const userId = await requireAuth(req);
      const draftId = pathname.split("/").pop() || "";
      await handleDeleteDraft(req, res, url, ctx.reqId, userId, draftId);
      ctx.logComplete(method, pathname, 204);
      return;
    }

    // ------------------------------------------------------------------
    // COMPANY RESEARCH
    // ------------------------------------------------------------------

    // GET /api/company/research
    if (method === "GET" && pathname === "/api/company/research") {
      const userId = await requireAuth(req);
      const { handleGetCompanyResearch } = await import("./routes/index.js");
      await handleGetCompanyResearch(req, res, url, ctx.reqId, userId);
      ctx.logComplete(method, pathname, 200);
      return;
    }

    // GET /api/company/user-companies
    if (method === "GET" && pathname === "/api/company/user-companies") {
      const userId = await requireAuth(req);
      const { handleGetUserCompanies } = await import("./routes/index.js");
      await handleGetUserCompanies(req, res, url, ctx.reqId, userId);
      ctx.logComplete(method, pathname, 200);
      return;
    }

    // ------------------------------------------------------------------
    // PREDICTIONS
    // ------------------------------------------------------------------
    // POST /api/predict/job-search
    if (method === "POST" && pathname === "/api/predict/job-search") {
      const userId = await requireAuth(req);
      const mod = await import("./routes/predict/job-search.js");
      await mod.post(req, res, url, ctx.reqId, userId, counters as any);
      ctx.logComplete(method, pathname, 200);
      return;
    }

    // ------------------------------------------------------------------
    // 404 NOT FOUND
    // ------------------------------------------------------------------
    jsonReply(res, 404, { error: "Not Found", path: pathname });
    ctx.logComplete(method, pathname, 404);
  } catch (err: any) {
    // Error handling
    logError("Request failed", {
      reqId: ctx.reqId,
      error: err.message,
      stack: err.stack,
    });
    sendError(res, err);
    ctx.logComplete(
      req.method,
      req.url || "/",
      err instanceof ApiError ? err.status : 500
    );
  }
}

// ------------------------------------------------------------------
// SERVER CREATION AND EXPORT
// ------------------------------------------------------------------
/**
 * Create configured HTTP server instance
 *
 * Flow:
 * 1. Load environment variables
 * 2. Validate configuration
 * 3. Create HTTP server with request handler
 *
 * Inputs: None (uses process.env)
 * Outputs: Configured http.Server instance
 *
 * Usage:
 *   const server = createServer();
 *   server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
 */
export function createServer(): http.Server {
  // Initialize environment and configuration
  loadEnvFromFiles();
  validateConfiguration();

  // Reset counters and start time (for testing/restart scenarios)
  startedAt = Date.now();
  Object.assign(counters, {
    requests_total: 0,
    generate_total: 0,
    generate_success: 0,
    generate_fail: 0,
  });

  // Create HTTP server
  return http.createServer(handleRequest);
}

/**
 * Get current server counters (for testing/monitoring)
 */
export function getCounters(): Readonly<ServerCounters> {
  return { ...counters };
}

/**
 * Get server start time (for testing/monitoring)
 */
export function getStartedAt(): number {
  return startedAt;
}
