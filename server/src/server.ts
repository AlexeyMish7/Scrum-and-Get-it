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
import * as zlib from "zlib";
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
import { getMetricsSnapshot } from "./observability/metrics.js";
import {
  captureException,
  getSentryMeta,
  flushSentry,
  initSentry,
  isSentryEnabled,
} from "./observability/sentry.js";
import {
  handleHealth,
  handleGenerateResume,
  handleGenerateCoverLetter,
  handleSkillsOptimization,
  handleExperienceTailoring,
  handleCompanyResearch,
  handleRelationship,
  handleProfileTips,
  handleReferralRequest,
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

  // Validate CORS configuration
  // Why: In production, allowing "*" usually breaks authenticated browser requests and is not a secure default.
  if (process.env.NODE_ENV === "production") {
    const corsOrigin = (process.env.CORS_ORIGIN || "").trim();
    if (!corsOrigin) {
      logConfigEvent("missing", "CORS_ORIGIN", {
        severity: "error",
        issue:
          "CORS_ORIGIN should be set to your frontend origin in production",
      });
    } else if (corsOrigin === "*") {
      logConfigEvent("invalid", "CORS_ORIGIN", {
        severity: "error",
        issue:
          'CORS_ORIGIN should not be "*" in production; set it to https://<your-app>.vercel.app',
      });
    }
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
function jsonReply(
  req: http.IncomingMessage,
  res: http.ServerResponse,
  status: number,
  payload: unknown
) {
  const body = JSON.stringify(payload);
  const corsHeaders = getCorsHeaders();

  const acceptEncoding = String(req.headers["accept-encoding"] || "");
  const gzipAccepted = acceptEncoding.includes("gzip");

  // Why: gzip can significantly reduce payload size for JSON responses.
  // We keep a small threshold to avoid wasting CPU on tiny responses.
  const gzipThresholdBytes = 1024;
  const uncompressed = Buffer.from(body);

  if (gzipAccepted && uncompressed.byteLength >= gzipThresholdBytes) {
    const compressed = zlib.gzipSync(uncompressed, {
      level: zlib.constants.Z_BEST_SPEED,
    });

    res.writeHead(status, {
      "Content-Type": "application/json",
      "Content-Encoding": "gzip",
      Vary: "Accept-Encoding",
      "Content-Length": compressed.byteLength.toString(),
      ...corsHeaders,
    });
    res.end(compressed);
    return;
  }

  res.writeHead(status, {
    "Content-Type": "application/json",
    "Content-Length": uncompressed.byteLength.toString(),
    ...corsHeaders,
  });
  res.end(uncompressed);
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
function sendError(
  req: http.IncomingMessage,
  res: http.ServerResponse,
  err: any
) {
  const status = err instanceof ApiError ? err.status : 500;
  jsonReply(req, res, status, errorPayload(err));
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
    // MONITORING ENDPOINTS (public but protected by shared secret)
    // ------------------------------------------------------------------
    if (method === "GET" && pathname === "/api/metrics") {
      const metricsToken = (process.env.METRICS_TOKEN || "").trim();
      if (!metricsToken) {
        jsonReply(req, res, 404, { error: "Not Found" });
        ctx.logComplete(method, pathname, 404);
        return;
      }

      const authHeader = String(req.headers.authorization || "");
      if (authHeader !== `Bearer ${metricsToken}`) {
        jsonReply(req, res, 401, { error: "unauthorized" });
        ctx.logComplete(method, pathname, 401);
        return;
      }

      const windowSecondsRaw = url.searchParams.get("window");
      const windowSeconds = windowSecondsRaw ? Number(windowSecondsRaw) : 300;

      jsonReply(req, res, 200, {
        status: "ok",
        uptime_sec: Math.round((Date.now() - startedAt) / 1000),
        ...getMetricsSnapshot({
          windowSeconds: Number.isFinite(windowSeconds) ? windowSeconds : 300,
        }),
      });
      ctx.logComplete(method, pathname, 200);
      return;
    }

    if (method === "POST" && pathname === "/api/monitoring/test-error") {
      const testToken = (process.env.MONITORING_TEST_TOKEN || "").trim();
      if (!testToken) {
        jsonReply(req, res, 404, { error: "Not Found" });
        ctx.logComplete(method, pathname, 404);
        return;
      }

      const authHeader = String(req.headers.authorization || "");
      if (authHeader !== `Bearer ${testToken}`) {
        jsonReply(req, res, 401, { error: "unauthorized" });
        ctx.logComplete(method, pathname, 401);
        return;
      }

      const err = new Error("Monitoring test error (intentional)");
      captureException(err, {
        requestId: ctx.reqId,
        route: pathname,
        method,
        status: 500,
      });

      // Why: This endpoint exists specifically for verification; flush ensures the event
      // is delivered immediately so instructors/users can confirm it in the Sentry UI.
      await flushSentry(2000);

      const sentryMeta = getSentryMeta();

      jsonReply(req, res, 500, {
        error: "monitoring_test_error",
        message: "Intentional error emitted for monitoring verification",
        sentry_enabled: isSentryEnabled(),
        sentry_environment:
          process.env.SENTRY_ENVIRONMENT ||
          process.env.APP_ENV ||
          process.env.NODE_ENV ||
          "development",
        // Non-sensitive hint: helps confirm which Sentry project is receiving events.
        sentry_dsn_host: sentryMeta.dsnHost,
        sentry_project_id: sentryMeta.projectId,
      });
      ctx.logComplete(method, pathname, 500);
      return;
    }

    // ------------------------------------------------------------------
    // AI GENERATION ENDPOINTS (protected)
    // ------------------------------------------------------------------
    const aiRoutesEnabled =
      (process.env.FEATURE_AI_ROUTES ?? "true").toLowerCase() !== "false";

    // UC-131 (Feature flags): allow gradual rollout by disabling AI endpoints
    // in staging/production without code changes.
    if (
      !aiRoutesEnabled &&
      method === "POST" &&
      pathname.startsWith("/api/generate/")
    ) {
      jsonReply(req, res, 503, {
        error: "AI endpoints are disabled in this environment",
        feature: "FEATURE_AI_ROUTES",
      });
      ctx.logComplete(method, pathname, 503);
      return;
    }

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

    if (method === "POST" && pathname === "/api/generate/referral-request") {
      const userId = await requireAuth(req);
      await handleReferralRequest(
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

    if (method === "POST" && pathname === "/api/generate/suggest-contacts") {
      const userId = await requireAuth(req);
      const mod = await import("./routes/generate/suggest-contacts.js");
      await mod.post(req, res, url, ctx.reqId, userId, counters as any);
      ctx.logComplete(method, pathname, 200);
      return;
    }

    if (method === "POST" && pathname === "/api/generate/event-contacts") {
      const userId = await requireAuth(req);
      const mod = await import("./routes/generate/event-contacts.js");
      await mod.post(req, res, url, ctx.reqId, userId, counters as any);
      ctx.logComplete(method, pathname, 200);
      return;
    }

    if (method === "POST" && pathname === "/api/generate/profile-tips") {
      const userId = await requireAuth(req);
      const { handleProfileTips } = await import("./routes/index.js");
      await handleProfileTips(
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

    if (method === "POST" && pathname === "/api/generate/interview-request") {
      const userId = await requireAuth(req);
      const { handleGenerateInterviewRequest } = await import(
        "./routes/index.js"
      );
      await handleGenerateInterviewRequest(
        req,
        res,
        url,
        ctx.reqId,
        userId,
        counters as any
      );
      ctx.logComplete(method, pathname, 201);
      return;
    }

    if (method === "POST" && pathname === "/api/generate/interview-questions") {
      const userId = await requireAuth(req);
      const { handleGenerateInterviewQuestions } = await import(
        "./routes/index.js"
      );
      await handleGenerateInterviewQuestions(
        req,
        res,
        url,
        ctx.reqId,
        userId,
        counters as any
      );
      ctx.logComplete(method, pathname, 201);
      return;
    }

    if (method === "POST" && pathname === "/api/generate/interview-feedback") {
      const userId = await requireAuth(req);
      const { handleGenerateInterviewFeedback } = await import(
        "./routes/index.js"
      );
      await handleGenerateInterviewFeedback(
        req,
        res,
        url,
        ctx.reqId,
        userId,
        counters as any
      );
      ctx.logComplete(method, pathname, 201);
      return;
    }

    if (method === "POST" && pathname === "/api/generate/coaching-insights") {
      const userId = await requireAuth(req);
      const { handleCoachingInsights } = await import("./routes/index.js");
      await handleCoachingInsights(
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

    if (
      method === "POST" &&
      pathname === "/api/generate/mock-interview-summary"
    ) {
      const userId = await requireAuth(req);
      const mod = await import("./routes/generate/mock-interview-summary.js");
      await mod.post(req, res, url, ctx.reqId, userId, counters as any);
      ctx.logComplete(method, pathname, 201);
      return;
    }

    if (method === "POST" && pathname === "/api/generate/reference-points") {
      const userId = await requireAuth(req);
      const { handleReferencePoints } = await import("./routes/index.js");
      await handleReferencePoints(
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

    // ------------------------------------------------------------------
    // INTERVIEW ANALYTICS ENDPOINTS (protected)
    // ------------------------------------------------------------------
    if (method === "GET" && pathname === "/api/analytics/overview") {
      try {
        const { get: handleAnalyticsOverview } = await import(
          "./routes/analytics.js"
        );
        await handleAnalyticsOverview(req, res);
        ctx.logComplete(method, pathname, 200);
        return;
      } catch (err: any) {
        console.error("[analytics/overview] Error:", err);
        jsonReply(req, res, 500, { error: err?.message ?? String(err) });
        return;
      }
    }

    if (method === "GET" && pathname === "/api/analytics/trends") {
      try {
        const { getTrends: handleAnalyticsTrends } = await import(
          "./routes/analytics.js"
        );
        await handleAnalyticsTrends(req, res);
        ctx.logComplete(method, pathname, 200);
        return;
      } catch (err: any) {
        console.error("[analytics/trends] Error:", err);
        jsonReply(req, res, 500, { error: err?.message ?? String(err) });
        return;
      }
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
    if (
      method === "POST" &&
      pathname === "/api/analytics/competitive/position"
    ) {
      try {
        const { handleGetCompetitivePosition } = await import(
          "./routes/analytics/competitive.js"
        );
        await handleGetCompetitivePosition(req, res);
        ctx.logComplete(method, pathname, 200);
        return;
      } catch (error) {
        console.error("❌ ERROR in competitive route:", error);
        jsonReply(req, res, 500, { error: "Internal server error" });
        return;
      }
    }

    // ------------------------------------------------------------------
    // MARKET INTELLIGENCE ENDPOINT (protected)
    // ------------------------------------------------------------------
    if (
      method === "POST" &&
      pathname === "/api/analytics/market/intelligence"
    ) {
      try {
        const { handleGetMarketIntelligence } = await import(
          "./routes/analytics/market-intelligence.js"
        );
        await handleGetMarketIntelligence(req, res);
        ctx.logComplete(method, pathname, 200);
        return;
      } catch (error) {
        console.error("❌ ERROR in market intelligence route:", error);
        jsonReply(req, res, 500, { error: "Internal server error" });
        return;
      }
    }

    // ------------------------------------------------------------------
    // TIME ENTRIES ENDPOINT (protected)
    // ------------------------------------------------------------------
    if (method === "POST" && pathname === "/api/time-entries") {
      try {
        const { handleCreateTimeEntry } = await import(
          "./routes/time-entries/create.js"
        );
        await handleCreateTimeEntry(req, res);
        ctx.logComplete(method, pathname, 201);
        return;
      } catch (error) {
        console.error("❌ ERROR in time entries route:", error);
        jsonReply(req, res, 500, { error: "Internal server error" });
        return;
      }
    }

    // ------------------------------------------------------------------
    // TIME INVESTMENT & PRODUCTIVITY ANALYTICS ENDPOINT (protected)
    // ------------------------------------------------------------------
    if (
      method === "POST" &&
      pathname === "/api/analytics/productivity/time-investment"
    ) {
      try {
        const { handleTimeInvestmentAnalytics } = await import(
          "./routes/analytics/productivity/timeInvestment.js"
        );
        await handleTimeInvestmentAnalytics(req, res);
        ctx.logComplete(method, pathname, 200);
        return;
      } catch (error) {
        console.error("❌ ERROR in time investment route:", error);
        jsonReply(req, res, 500, { error: "Internal server error" });
        return;
      }
    }

    // ------------------------------------------------------------------
    // PATTERN RECOGNITION ANALYTICS ENDPOINT (protected)
    // ------------------------------------------------------------------
    if (
      method === "POST" &&
      pathname === "/api/analytics/pattern-recognition"
    ) {
      try {
        const userId = await requireAuth(req);
        (req as any).userId = userId;
        const { handleGetPatternRecognition } = await import(
          "./routes/analytics/pattern-recognition.js"
        );
        await handleGetPatternRecognition(req, res);
        ctx.logComplete(method, pathname, 200);
        return;
      } catch (error) {
        console.error("❌ ERROR in pattern recognition route:", error);
        jsonReply(req, res, 500, { error: "Internal server error" });
        return;
      }
    }

    // ------------------------------------------------------------------
    // ADMIN BENCHMARK ENDPOINTS (protected, admin only in production)
    // ------------------------------------------------------------------
    if (method === "POST" && pathname === "/api/admin/compute-benchmarks") {
      const userId = await requireAuth(req);
      const { handleComputeBenchmarks } = await import(
        "./routes/admin/benchmarks.js"
      );
      await handleComputeBenchmarks(req, res);
      ctx.logComplete(method, pathname, 200);
      return;
    }

    if (method === "GET" && pathname === "/api/admin/benchmark-status") {
      const userId = await requireAuth(req);
      const { handleBenchmarkStatus } = await import(
        "./routes/admin/benchmarks.js"
      );
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

    // POST /api/predictions/response-time
    if (method === "POST" && pathname === "/api/predictions/response-time") {
      const userId = await requireAuth(req);
      const mod = await import("./routes/predictions/response-time.js");
      await mod.post(req, res, url, ctx.reqId, userId, counters as any);
      ctx.logComplete(method, pathname, 200);
      return;
    }

    // ------------------------------------------------------------------
    // 404 NOT FOUND
    // ------------------------------------------------------------------
    jsonReply(req, res, 404, { error: "Not Found", path: pathname });
    ctx.logComplete(method, pathname, 404);
  } catch (err: any) {
    // Error handling - log full details safely
    try {
      console.error("=== CAUGHT ERROR IN REQUEST HANDLER ===");
      console.error("Error type:", typeof err);
      console.error("Error constructor:", err?.constructor?.name);
      console.error("Error object:", err);
      console.error("Error keys:", Object.keys(err || {}));
      console.error("========================================");

      logError("Request failed", {
        reqId: ctx.reqId,
        message: err?.message || "Unknown error",
        code: err?.code,
        status: err?.status,
        stack: err?.stack,
        name: err?.name,
      });
    } catch (logErr) {
      console.error("Failed to log error:", logErr);
      console.error("Original error:", err);
    }

    const status = err instanceof ApiError ? err.status : 500;
    if (status >= 500) {
      captureException(err, {
        requestId: ctx.reqId,
        route: req.url || "/",
        method: req.method || "UNKNOWN",
        status,
      });
    }
    sendError(req, res, err);
    ctx.logComplete(req.method, req.url || "/", status);
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

  // UC-133: enable backend error tracking when SENTRY_DSN is provided.
  initSentry();

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
