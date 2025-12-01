/**
 * INTERVIEW QUESTIONS GENERATION
 *
 * POST /api/generate/interview-questions
 *
 * Returns a JSON array of interview question objects tailored to job title,
 * industry and difficulty. This mirrors the client-side expectation used by
 * the Interview prep UI and the local fallback if the server call fails.
 */
import type { IncomingMessage, ServerResponse } from "node:http";
import type { URL } from "node:url";
import { generate } from "../../services/aiClient.js";
import {
  legacyLogInfo as logInfo,
  legacyLogError as logError,
} from "../../../utils/logger.js";
import { readJson, sendJson } from "../../../utils/http.js";
import { ApiError } from "../../../utils/errors.js";
import { checkLimit } from "../../../utils/rateLimiter.js";
import type { GenerationCounters } from "./types.js";

interface Body {
  jobTitle?: string;
  industry?: string;
  difficulty?: "entry" | "mid" | "senior";
  includeCompanySpecific?: boolean;
}

function buildPrompt(body: Body) {
  const title = body.jobTitle ?? "(not provided)";
  const industry = body.industry ?? "(not provided)";
  const difficulty = body.difficulty ?? "mid";

  return `You are an assistant that generates a compact list of interview questions tailored to a job.

Input:
- jobTitle: ${title}
- industry: ${industry}
- difficulty: ${difficulty}

Task:
Return ONLY valid JSON with this exact shape (no extra text):
{
  "questions": [
    {
      "id": "optional unique id",
      "text": "The question text",
      "category": "technical|behavioral|situational",
      "difficulty": "entry|mid|senior",
      "skillTags": ["tag1","tag2"],
      "companySpecific": true|false
    }
  ]
}

Generate 6-12 concise questions. For technical questions prefer concrete prompts (algorithms, system design, data structures). For behavioral and situational include STAR-style prompts. When information is missing, fill with general, widely-applicable questions. Do not include markdown or explanation text.`;
}

export async function post(
  req: IncomingMessage,
  res: ServerResponse,
  url: URL,
  reqId: string,
  userId: string,
  counters: GenerationCounters
): Promise<void> {
  // Rate limit: moderate
  const limit = checkLimit(`interview_questions:${userId}`, 30, 300_000);
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

    const aiResult = await generate("interview_questions", prompt, {
      model: "gpt-4o-mini",
      temperature: 0.55,
      maxTokens: 1200,
      timeoutMs: 20000,
    });

    let questions: any[] = [];

    if (aiResult.json && Array.isArray((aiResult.json as any).questions)) {
      questions = (aiResult.json as any).questions;
    } else if (aiResult.text) {
      try {
        const parsed = JSON.parse(aiResult.text);
        if (Array.isArray(parsed.questions)) questions = parsed.questions;
      } catch (e) {
        // ignore parse error
      }
    }

    // If AI returned nothing structured, return empty array and let client-side
    // fallback logic handle generation locally.
    const latencyMs = Date.now() - start;
    counters.generate_success++;
    logInfo("interview_questions_generate_success", { userId, reqId, latencyMs, count: questions.length });

    sendJson(res, 201, { questions, meta: { latency_ms: latencyMs } });
  } catch (err: any) {
    const latencyMs = Date.now() - start;
    counters.generate_fail++;
    logError("interview_questions_generate_error", { userId, reqId, error: err?.message ?? String(err), latencyMs });
    // Bubble up as AI error so client falls back to local generator
    throw new ApiError(502, err?.message ?? "AI generation failed", "ai_error");
  }
}
