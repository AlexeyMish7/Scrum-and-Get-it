import type { IncomingMessage, ServerResponse } from "node:http";
import type { URL } from "node:url";
import { ApiError } from "../../../utils/errors.js";
import { readJson, sendJson } from "../../../utils/http.js";
import { checkLimit } from "../../../utils/rateLimiter.js";
import { legacyLogInfo as logInfo, legacyLogError as logError } from "../../../utils/logger.js";
import { predictJobSearch } from "../../services/prediction.service.js";
import type { GenerationCounters } from "../generate/types.js";

/**
 * POST /api/predict/job-search
 * Body: { jobs: [...] }
 */
export async function post(
  req: IncomingMessage,
  res: ServerResponse,
  url: URL,
  reqId: string,
  userId: string,
  counters: GenerationCounters
): Promise<void> {
  // Rate limit: reuse generation bucket logic (configurable)
  const limit = checkLimit(`predict:${userId}`, 50, 300_000);
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

  const jobs = body?.jobs;
  if (!Array.isArray(jobs) || jobs.length === 0) {
    throw new ApiError(400, "jobs array is required", "bad_request");
  }

  counters.generate_total++;
  const start = Date.now();

  try {
    const result = await predictJobSearch({ jobs, userId });
    const latencyMs = Date.now() - start;

    if (result.error) {
      logError("predict.failure", { userId, reqId, error: result.error });
      throw new ApiError(502, result.error, "ai_error");
    }

    counters.generate_success++;
    sendJson(res, 200, {
      success: true,
      predictions: result.predictions,
      simulated: Boolean((result as any).simulated),
      debug: (result as any).debug ?? null,
      meta: { latency_ms: latencyMs },
    });
  } catch (err: any) {
    counters.generate_fail++;
    logError("predict.error", { userId, reqId, error: err?.message ?? String(err) });
    throw new ApiError(502, err?.message ?? "Failed to generate predictions", "ai_error");
  }
}
