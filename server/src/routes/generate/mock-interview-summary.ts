/**
 * MOCK INTERVIEW SUMMARY
 *
 * POST /api/generate/mock-interview-summary
 *
 * Accepts: { jobTitle, industry, difficulty, qa: [{ question, answer }] }
 * Returns: { overall_score, improvement_areas, response_quality_analysis, confidence_tips, meta }
 */
import type { IncomingMessage, ServerResponse } from "node:http";
import type { URL } from "node:url";
import { generate } from "../../services/aiClient.js";
import { legacyLogInfo as logInfo, legacyLogError as logError } from "../../../utils/logger.js";
import { readJson, sendJson } from "../../../utils/http.js";
import { ApiError } from "../../../utils/errors.js";
import { checkLimit } from "../../../utils/rateLimiter.js";
import type { GenerationCounters } from "./types.js";

interface Body {
  jobTitle?: string;
  industry?: string;
  difficulty?: string;
  qa?: Array<{ question: string; answer: string }>;
}

function buildPrompt(body: Body) {
  const title = body.jobTitle ?? "(unknown)";
  const industry = body.industry ?? "(unknown)";
  const difficulty = body.difficulty ?? "mid";

  const pairs = (body.qa ?? [])
    .map((q, i) => `Q${i + 1}: ${q.question}\nA${i + 1}: ${q.answer}`)
    .join("\n\n");

  return `You are an expert interview coach. Given the following mock interview Q/A for a ${title} role in ${industry} (difficulty=${difficulty}), produce a JSON object summarizing the candidate's performance.

Required output JSON shape:
{
  "overall_score": number, // 0-100
  "improvement_areas": [string],
  "response_quality_analysis": string, // short paragraph summarizing recurring quality issues and strengths
  "confidence_tips": [string]
}

Input:
${pairs}

Return ONLY valid JSON with exactly those keys. Provide concise, actionable suggestions in "improvement_areas" and short confidence tips.
Do not include markdown or extra text.`;
}

export async function post(
  req: IncomingMessage,
  res: ServerResponse,
  url: URL,
  reqId: string,
  userId: string,
  counters: GenerationCounters
): Promise<void> {
  const limit = checkLimit(`mock_interview:${userId}`, 10, 60_000);
  if (!limit.ok) {
    res.setHeader("Retry-After", String(limit.retryAfterSec ?? 60));
    throw new ApiError(429, "rate limited", "rate_limited");
  }

  let body: Body;
  try {
    body = (await readJson(req)) as Body;
  } catch (e: any) {
    throw new ApiError(400, "invalid JSON body", "bad_json");
  }

  counters.generate_total++;
  const start = Date.now();

  try {
    const prompt = buildPrompt(body);
    const aiResult = await generate("mock_interview_summary", prompt, {
      model: "gpt-4o-mini",
      temperature: 0.35,
      maxTokens: 1000,
      timeoutMs: 30000,
    });

    let parsed: any = null;

    if (aiResult.json && typeof aiResult.json === "object") {
      parsed = aiResult.json;
    } else if (aiResult.text) {
      try {
        parsed = JSON.parse(aiResult.text);
      } catch (e) {
        // ignore parse error
      }
    }

    const latencyMs = Date.now() - start;
    counters.generate_success++;
    logInfo("mock_interview_generate_success", { userId, reqId, latencyMs });

    if (!parsed) {
      // no structured output - return generic fallback
      sendJson(res, 201, {
        overall_score: null,
        improvement_areas: ["AI did not return structured summary. Try again."],
        response_quality_analysis: null,
        confidence_tips: null,
        meta: { latency_ms: latencyMs },
      });
      return;
    }

    // sanitize response
    const overall_score = parsed.overall_score ?? parsed.score ?? null;
    const improvement_areas = Array.isArray(parsed.improvement_areas) ? parsed.improvement_areas : Array.isArray(parsed.improvements) ? parsed.improvements : null;
    const response_quality_analysis = parsed.response_quality_analysis ?? parsed.analysis ?? null;
    const confidence_tips = Array.isArray(parsed.confidence_tips) ? parsed.confidence_tips : Array.isArray(parsed.tips) ? parsed.tips : null;

    sendJson(res, 201, {
      overall_score,
      improvement_areas,
      response_quality_analysis,
      confidence_tips,
      meta: { latency_ms: latencyMs },
    });
  } catch (err: any) {
    const latencyMs = Date.now() - start;
    counters.generate_fail++;
    logError("mock_interview_generate_error", { userId, reqId, error: err?.message ?? String(err), latencyMs });
    throw new ApiError(502, err?.message ?? "AI generation failed", "ai_error");
  }
}
