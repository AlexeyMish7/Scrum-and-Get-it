import type { IncomingMessage, ServerResponse } from "node:http";
import type { URL } from "node:url";
import { ApiError } from "../../../utils/errors.js";
import { readJson, sendJson } from "../../../utils/http.js";
import { checkLimit } from "../../../utils/rateLimiter.js";
import { legacyLogInfo as logInfo, legacyLogError as logError } from "../../../utils/logger.js";
import { generate } from "../../services/aiClient.js";
import type { GenerationCounters } from "../generate/types.js";

type Submission = {
  companySize?: string | null;
  industry?: string | null;
  jobLevel?: string | null;
  submittedAt?: string | null;
  respondedAt?: string | null;
};

function toDays(submitted?: string | null, responded?: string | null) {
  if (!submitted || !responded) return null;
  try {
    const s = new Date(submitted);
    const r = new Date(responded);
    if (isNaN(s.getTime()) || isNaN(r.getTime())) return null;
    const ms = r.getTime() - s.getTime();
    return ms < 0 ? null : ms / (1000 * 60 * 60 * 24);
  } catch {
    return null;
  }
}

function mean(nums: number[]) {
  if (!nums.length) return null;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

function median(nums: number[]) {
  if (!nums.length) return null;
  const s = [...nums].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 === 1 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

function percentile(nums: number[], p: number) {
  if (!nums.length) return null;
  const s = [...nums].sort((a, b) => a - b);
  const idx = Math.max(0, Math.min(s.length - 1, Math.floor((p / 100) * s.length)));
  return s[idx];
}

function summarizeGroup(values: (number | null)[]) {
  const nums = values.filter((v): v is number => typeof v === "number");
  return {
    sampleCount: nums.length,
    meanDays: mean(nums),
    medianDays: median(nums),
    p10: percentile(nums, 10),
    p90: percentile(nums, 90),
  };
}

/**
 * POST /api/predictions/response-time
 * Body: { submissions: Submission[] }
 */
export async function post(
  req: IncomingMessage,
  res: ServerResponse,
  url: URL,
  reqId: string,
  userId: string,
  counters: GenerationCounters
): Promise<void> {
  const limit = checkLimit(`predictions_response_time:${userId}`, 30, 300_000);
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

  const submissions: any[] = Array.isArray(body?.submissions) ? body.submissions : [];
  const job = body?.job ?? null;

  // Allow either a submissions array OR job metadata for AI-only prediction
  if (submissions.length === 0 && !job) {
    throw new ApiError(400, "submissions array or job object is required", "bad_request");
  }

  counters.generate_total++;
  const start = Date.now();

  try {
    const valuesByCompanySize: Record<string, (number | null)[]> = {};
    const valuesByIndustry: Record<string, (number | null)[]> = {};
    const valuesByJobLevel: Record<string, (number | null)[]> = {};

    for (const s of submissions) {
      const sub: Submission = s ?? {};
      const days = toDays(sub.submittedAt ?? null, sub.respondedAt ?? null);
      const size = String(sub.companySize ?? "unknown").trim() || "unknown";
      const industry = String(sub.industry ?? "unknown").trim() || "unknown";
      const level = String(sub.jobLevel ?? "unknown").trim() || "unknown";

      valuesByCompanySize[size] = valuesByCompanySize[size] ?? [];
      valuesByCompanySize[size].push(days);

      valuesByIndustry[industry] = valuesByIndustry[industry] ?? [];
      valuesByIndustry[industry].push(days);

      valuesByJobLevel[level] = valuesByJobLevel[level] ?? [];
      valuesByJobLevel[level].push(days);
    }

    const grouped = {
      companySize: Object.fromEntries(
        Object.entries(valuesByCompanySize).map(([k, v]) => [k, summarizeGroup(v)])
      ),
      industry: Object.fromEntries(
        Object.entries(valuesByIndustry).map(([k, v]) => [k, summarizeGroup(v)])
      ),
      jobLevel: Object.fromEntries(
        Object.entries(valuesByJobLevel).map(([k, v]) => [k, summarizeGroup(v)])
      ),
    };

    // If no local samples but a job object was provided, ask the AI to predict from job metadata
    let aiAnalysis: { text?: string; json?: unknown } | null = null;
    if (submissions.length === 0 && job && (process.env.AI_API_KEY || process.env.FAKE_AI === "true")) {
      try {
        const safeJob = {
          title: job.title ?? null,
          company: job.company ?? null,
          industry: job.industry ?? null,
          companySize: job.companySize ?? job.company_size ?? null,
          jobLevel: job.jobLevel ?? job.job_level ?? null,
          location: job.location ?? null,
        };
        const prompt = `You are an assistant that predicts how long a company typically takes to respond to a job application. Respond ONLY with JSON: { "median_days": number, "mean_days": number, "ci_low": number, "ci_high": number, "confidence": number (0-1), "recommendations": [string] }. Use the job metadata to make a best-effort prediction. Job: ${JSON.stringify(safeJob)}`;
        const aiRes = await generate("response-time-predict", prompt, {
          model: "gpt-4o-mini",
          temperature: 0.2,
          maxTokens: 300,
        });
        let parsed: any = aiRes.json ?? null;
        if (!parsed && typeof aiRes.text === "string") {
          try { parsed = JSON.parse(aiRes.text); } catch { parsed = null; }
        }
        aiAnalysis = { text: aiRes.text ?? undefined, json: parsed ?? null };
      } catch (e: any) {
        logError("predictions.response.ai_failed", { userId, error: e?.message ?? String(e) });
      }
    }

    const latencyMs = Date.now() - start;

    // Optionally enrich with AI analysis if provider configured
    try {
      if (process.env.AI_API_KEY || process.env.FAKE_AI === "true") {
        // Provide a compact JSON summary to the AI, not the entire submission list
        const prompt = `Analyze the following aggregated response-time summaries and provide insights and actionable recommendations. Return a short JSON object with keys: summary (string), recommendations (array of strings).\n\nAGGREGATES:${JSON.stringify(grouped).slice(0,20000)}`;
        const aiRes = await generate("response-time-analysis", prompt, {
          model: "gpt-4o-mini",
          temperature: 0.2,
          maxTokens: 800,
        });
        aiAnalysis = { text: aiRes.text ?? undefined, json: aiRes.json ?? undefined };
      }
    } catch (e: any) {
      logError("predictions.response.ai_failed", { userId, error: e?.message ?? String(e) });
      // non-fatal - continue returning local aggregates
    }

    counters.generate_success++;
    sendJson(res, 200, {
      success: true,
      grouped,
      meta: { latency_ms: latencyMs },
      aiAnalysis,
    });
  } catch (err: any) {
    counters.generate_fail++;
    logError("predictions.response.error", { userId, reqId, error: err?.message ?? String(err) });
    throw new ApiError(500, err?.message ?? "Failed to compute response-time predictions", "server_error");
  }
}
