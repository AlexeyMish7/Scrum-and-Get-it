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
  include_detailed_feedback?: boolean;
}

function buildPromptSimple(body: Body) {
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

function buildPromptDetailed(body: Body) {
  const question = body.question ?? "(not provided)";
  const answer = body.answer ?? "(not provided)";
  const ctx = `jobTitle=${body.jobTitle ?? "(none)"}; industry=${body.industry ?? "(none)"}; difficulty=${body.difficulty ?? "mid"}`;

  return `You are an expert interview coach. Given a question and a candidate's answer (which may be code or prose), produce a detailed structured JSON object with the following fields:

1) modelAnswer: A concise model answer or ideal response (string).
2) feedback: An array of short feedback bullets summarizing strengths and issues (array of strings).
3) content_feedback: A short paragraph about the content quality (string).
4) structure_feedback: A short paragraph about the answer structure and organization (string).
5) clarity_feedback: A short paragraph about clarity, conciseness, and language (string).
6) impact_score: A numeric score from 0-100 indicating overall impact and persuasiveness (number).
7) score: A numeric score from 0-100 indicating overall quality (number).
8) alternatives: An array of 2-4 alternative approaches or phrasings the candidate could use (array of strings).
9) improvement_suggestions: An array of actionable suggestions to improve the response (array of strings).

Context: ${ctx}

Input:
Question: ${question}
Answer: ${answer}

Return ONLY valid JSON with exactly those keys. Values should be short and concrete. Do not include any other text, explanation, or markdown.`;
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
    const prompt = body.include_detailed_feedback ? buildPromptDetailed(body) : buildPromptSimple(body);

    const aiResult = await generate("interview_feedback", prompt, {
      model: "gpt-4o-mini",
      temperature: 0.35,
      maxTokens: 1200,
      timeoutMs: 30000,
    });

    // default fields
    let modelAnswer: string | null = null;
    let feedback: string[] | null = null;

    // detailed fields
    let content_feedback: string | null = null;
    let structure_feedback: string | null = null;
    let clarity_feedback: string | null = null;
    let impact_score: number | null = null;
    let score: number | null = null;
    let alternatives: string[] | null = null;
    let improvement_suggestions: string[] | null = null;

    if (aiResult.json && typeof aiResult.json === "object") {
      const j = aiResult.json as any;
      modelAnswer = typeof j.modelAnswer === "string" ? j.modelAnswer : typeof j.model_answer === "string" ? j.model_answer : null;
      feedback = Array.isArray(j.feedback) ? j.feedback : null;

      // structured
      content_feedback = typeof j.content_feedback === "string" ? j.content_feedback : typeof j.contentFeedback === "string" ? j.contentFeedback : null;
      structure_feedback = typeof j.structure_feedback === "string" ? j.structure_feedback : typeof j.structureFeedback === "string" ? j.structureFeedback : null;
      clarity_feedback = typeof j.clarity_feedback === "string" ? j.clarity_feedback : typeof j.clarityFeedback === "string" ? j.clarityFeedback : null;
      alternatives = Array.isArray(j.alternatives) ? j.alternatives.map(String) : Array.isArray(j.alternative_approaches) ? j.alternative_approaches.map(String) : null;
      improvement_suggestions = Array.isArray(j.improvement_suggestions) ? j.improvement_suggestions.map(String) : Array.isArray(j.suggestions) ? j.suggestions.map(String) : null;

      const rawImpact = j.impact_score ?? j.impactScore ?? j.impact_percent ?? j.impactPercent ?? null;
      if (rawImpact != null) {
        const n = Number(rawImpact);
        if (!Number.isNaN(n)) impact_score = n > 0 && n <= 1 ? Math.round(n * 100) : Math.round(n);
      }

      const rawScore = j.score ?? j.rating ?? j.scorePercent ?? j.score_percent ?? null;
      if (rawScore != null) {
        const n = Number(rawScore);
        if (!Number.isNaN(n)) score = n > 0 && n <= 1 ? Math.round(n * 100) : Math.round(n);
      }
    } else if (aiResult.text) {
      try {
        const parsed = JSON.parse(aiResult.text);
        modelAnswer = typeof parsed.modelAnswer === "string" ? parsed.modelAnswer : typeof parsed.model_answer === "string" ? parsed.model_answer : null;
        feedback = Array.isArray(parsed.feedback) ? parsed.feedback : null;

        content_feedback = typeof parsed.content_feedback === "string" ? parsed.content_feedback : typeof parsed.contentFeedback === "string" ? parsed.contentFeedback : null;
        structure_feedback = typeof parsed.structure_feedback === "string" ? parsed.structure_feedback : typeof parsed.structureFeedback === "string" ? parsed.structureFeedback : null;
        clarity_feedback = typeof parsed.clarity_feedback === "string" ? parsed.clarity_feedback : typeof parsed.clarityFeedback === "string" ? parsed.clarityFeedback : null;
        alternatives = Array.isArray(parsed.alternatives) ? parsed.alternatives.map(String) : Array.isArray(parsed.alternative_approaches) ? parsed.alternative_approaches.map(String) : null;
        improvement_suggestions = Array.isArray(parsed.improvement_suggestions) ? parsed.improvement_suggestions.map(String) : Array.isArray(parsed.suggestions) ? parsed.suggestions.map(String) : null;

        const rawImpact = parsed.impact_score ?? parsed.impactScore ?? parsed.impact_percent ?? parsed.impactPercent ?? null;
        if (rawImpact != null) {
          const n = Number(rawImpact);
          if (!Number.isNaN(n)) impact_score = n > 0 && n <= 1 ? Math.round(n * 100) : Math.round(n);
        }

        const rawScore = parsed.score ?? parsed.rating ?? parsed.scorePercent ?? parsed.score_percent ?? null;
        if (rawScore != null) {
          const n = Number(rawScore);
          if (!Number.isNaN(n)) score = n > 0 && n <= 1 ? Math.round(n * 100) : Math.round(n);
        }
      } catch (e) {
        // ignore parse errors
      }
    }

    const latencyMs = Date.now() - start;
    counters.generate_success++;
    logInfo("interview_feedback_generate_success", { userId, reqId, latencyMs });

    // Build response payload including detailed fields when available
    const respPayload: Record<string, unknown> = { modelAnswer, feedback, meta: { latency_ms: latencyMs } };
    if (content_feedback) respPayload.content_feedback = content_feedback;
    if (structure_feedback) respPayload.structure_feedback = structure_feedback;
    if (clarity_feedback) respPayload.clarity_feedback = clarity_feedback;
    if (impact_score != null) respPayload.impact_score = impact_score;
    if (score != null) respPayload.score = score;
    if (alternatives) respPayload.alternatives = alternatives;
    if (improvement_suggestions) respPayload.improvement_suggestions = improvement_suggestions;

    sendJson(res, 201, respPayload);
  } catch (err: any) {
    const latencyMs = Date.now() - start;
    counters.generate_fail++;
    logError("interview_feedback_generate_error", { userId, reqId, error: err?.message ?? String(err), latencyMs });
    throw new ApiError(502, err?.message ?? "AI generation failed", "ai_error");
  }
}
