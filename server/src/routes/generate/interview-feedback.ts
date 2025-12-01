/**
 * INTERVIEW FEEDBACK GENERATION
 *
 * POST /api/generate/interview-feedback
 *
 * Given a question and a user's answer (code or text), return a short model
 * answer and feedback bullets. Returns JSON:
 * { modelAnswer: string|null, feedback: string[]|null }
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
  question?: string;
  answer?: string;
  category?: string;
  jobTitle?: string;
  industry?: string;
  difficulty?: string;
}

function buildPrompt(body: Body) {
  const question = body.question ?? "(not provided)";
  const answer = body.answer ?? "(not provided)";
  const ctx = `jobTitle=${body.jobTitle ?? "(none)"}; industry=${body.industry ?? "(none)"}; difficulty=${body.difficulty ?? "mid"}`;

  return `You are an interview coach. Given a question and a candidate's answer (which may be code or prose), provide:

1) A short model answer or summary (one paragraph) suitable as guidance.
2) 3 concise feedback bullets (strengths, issues, and suggestions).

Context: ${ctx}

Input:
Question: ${question}
Answer: ${answer}

Return ONLY valid JSON with this exact shape:
{
  "modelAnswer": "...",
  "feedback": ["...","...","..."]
}

Do not include any other text or markdown.`;
}

export async function post(
  req: IncomingMessage,
  res: ServerResponse,
  url: URL,
  reqId: string,
  userId: string,
  counters: GenerationCounters
): Promise<void> {
  const limit = checkLimit(`interview_feedback:${userId}`, 60, 60_000);
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

    const aiResult = await generate("interview_feedback", prompt, {
      model: "gpt-4o-mini",
      temperature: 0.35,
      maxTokens: 1000,
      timeoutMs: 20000,
    });

    let modelAnswer: string | null = null;
    let feedback: string[] | null = null;

    if (aiResult.json && typeof aiResult.json === "object") {
      const j = aiResult.json as any;
      modelAnswer = typeof j.modelAnswer === "string" ? j.modelAnswer : null;
      feedback = Array.isArray(j.feedback) ? j.feedback : null;
    } else if (aiResult.text) {
      try {
        const parsed = JSON.parse(aiResult.text);
        modelAnswer = typeof parsed.modelAnswer === "string" ? parsed.modelAnswer : null;
        feedback = Array.isArray(parsed.feedback) ? parsed.feedback : null;
      } catch (e) {
        // ignore parse errors
      }
    }

    const latencyMs = Date.now() - start;
    counters.generate_success++;
    logInfo("interview_feedback_generate_success", { userId, reqId, latencyMs });

    sendJson(res, 201, { modelAnswer, feedback, meta: { latency_ms: latencyMs } });
  } catch (err: any) {
    const latencyMs = Date.now() - start;
    counters.generate_fail++;
    logError("interview_feedback_generate_error", { userId, reqId, error: err?.message ?? String(err), latencyMs });
    throw new ApiError(502, err?.message ?? "AI generation failed", "ai_error");
  }
}
