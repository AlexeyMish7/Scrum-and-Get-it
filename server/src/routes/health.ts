/**
 * Health Check Route
 *
 * GET /api/health
 *
 * Returns server health status including:
 * - Supabase connection status
 * - AI provider configuration
 * - Mock mode status
 * - Uptime and request counters
 *
 * Query params:
 * - deep=1: Perform deep health check with Supabase query test
 *
 * Response:
 * {
 *   status: "ok",
 *   supabase_env: "present" | "missing",
 *   supabase: "ok" | "missing-env" | "error",
 *   ai_provider: string,
 *   mock_mode: boolean,
 *   uptime_sec: number,
 *   counters: { requests_total, generate_total, generate_success, generate_fail }
 * }
 */

import type { IncomingMessage, ServerResponse } from "node:http";
import { URL } from "node:url";
import * as zlib from "node:zlib";
import { getCorsHeaders } from "../middleware/cors.js";

export interface HealthCounters {
  requests_total: number;
  generate_total: number;
  generate_success: number;
  generate_fail: number;
}

export interface HealthCheckOptions {
  /** Server start timestamp */
  startedAt: number;
  /** Request counters */
  counters: HealthCounters;
}

/**
 * Handle GET /api/health
 *
 * Inputs:
 * - url: URL object with query params
 * - res: HTTP response object
 * - options: { startedAt, counters }
 *
 * Outputs:
 * - JSON response with health status (status 200)
 *
 * Flow:
 * 1. Check environment variables for Supabase
 * 2. If deep=1 query param, test Supabase connection
 * 3. Return status with uptime and counters
 */
export async function handleHealth(
  url: URL,
  req: IncomingMessage,
  res: ServerResponse,
  options: HealthCheckOptions
): Promise<void> {
  const { startedAt, counters } = options;

  const supaEnv = Boolean(
    process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
  );
  const aiProvider = process.env.AI_PROVIDER ?? "openai";
  const mockMode = (process.env.FAKE_AI ?? "false").toLowerCase() === "true";
  const uptimeSec = Math.round((Date.now() - startedAt) / 1000);

  let supabaseStatus: "ok" | "missing-env" | "error" = supaEnv
    ? "ok"
    : "missing-env";

  // Deep health check: test Supabase connection
  if (supaEnv && url.searchParams.get("deep") === "1") {
    try {
      const mod = await import("../services/supabaseAdmin.js");
      // Type assertion: dynamic import returns module with default export (SupabaseClient)
      const supabase: any = mod.default;
      const test = await supabase
        .from("ai_artifacts")
        .select("id", { count: "exact", head: true })
        .limit(1);
      if (test.error) supabaseStatus = "error";
    } catch {
      supabaseStatus = "error";
    }
  }

  const payload = {
    status: "ok",
    supabase_env: supaEnv ? "present" : "missing",
    supabase: supabaseStatus,
    ai_provider: aiProvider,
    mock_mode: mockMode,
    uptime_sec: uptimeSec,
    counters,
  };

  const body = JSON.stringify(payload);
  const corsHeaders = getCorsHeaders();

  const acceptEncoding = String(req.headers["accept-encoding"] || "");
  const gzipAccepted = acceptEncoding.includes("gzip");

  // Why: Health checks are polled frequently; compression keeps bandwidth low.
  const gzipThresholdBytes = 512;
  const uncompressed = Buffer.from(body);

  if (gzipAccepted && uncompressed.byteLength >= gzipThresholdBytes) {
    const compressed = zlib.gzipSync(uncompressed, {
      level: zlib.constants.Z_BEST_SPEED,
    });

    res.writeHead(200, {
      "Content-Type": "application/json",
      "Content-Encoding": "gzip",
      Vary: "Accept-Encoding",
      // Why: Never cache health checks; uptime monitors should reflect the current state.
      "Cache-Control": "no-store",
      "Content-Length": compressed.byteLength.toString(),
      ...corsHeaders,
    });
    res.end(compressed);
    return;
  }

  res.writeHead(200, {
    "Content-Type": "application/json",
    // Why: Never cache health checks; uptime monitors should reflect the current state.
    "Cache-Control": "no-store",
    "Content-Length": uncompressed.byteLength.toString(),
    ...corsHeaders,
  });
  res.end(uncompressed);
}
