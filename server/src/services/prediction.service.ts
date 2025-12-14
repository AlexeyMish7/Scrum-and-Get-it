/**
 * Prediction service
 * - Builds a concise prompt for job-search prediction
 * - Calls AI via aiClient.generate
 * - Falls back to a lightweight simulation when AI is unavailable
 */
import aiClient from "./aiClient.js";
import { logError, logInfo } from "../../utils/logger.js";

type InputJob = {
  id?: number | string;
  title?: string;
  company?: string;
  industry?: string | null;
  created_at?: string | null;
  status_changed_at?: string | null;
  job_status?: string | null;
};

type PredictionResult =
  | { error: string }
  | {
      success: true;
      predictions: Prediction[];
      simulated?: boolean;
      note?: string;
      debug?: any;
    };

type PredictionKind =
  | "interview_probability"
  | "offer_probability"
  | "timeline_weeks"
  | "recommendations";

type Prediction = {
  kind: PredictionKind | string;
  score: number;
  confidence?: number;
  recommendations?: string[];
  details?: Record<string, unknown>;
};

type ValidationOk = { ok: true; value: { predictions: Prediction[] } };
type ValidationErr = { ok: false; errors: string[] };

function clampNumber(n: unknown, min: number, max: number, fallback: number) {
  const num = typeof n === "number" ? n : Number(n);
  if (!Number.isFinite(num)) return fallback;
  return Math.min(max, Math.max(min, num));
}

function coerceStringArray(
  input: unknown,
  maxItems = 8,
  maxLen = 200
): string[] {
  if (!Array.isArray(input)) return [];
  return input
    .map((v) => {
      try {
        return String(v ?? "").trim();
      } catch {
        return "";
      }
    })
    .filter(Boolean)
    .slice(0, maxItems)
    .map((s) => (s.length > maxLen ? s.slice(0, maxLen) : s));
}

function parseJsonFromAi(aiResult: any): unknown {
  if (aiResult?.json) return aiResult.json;
  const text = aiResult?.text;
  if (typeof text !== "string") return null;

  const cleaned = text
    .replace(/```(?:json)?\n?/g, "")
    .replace(/```/g, "")
    .trim();

  if (!cleaned) return null;
  try {
    return JSON.parse(cleaned);
  } catch {
    return null;
  }
}

function validateAndSanitizePredictions(
  parsed: unknown
): ValidationOk | ValidationErr {
  if (!parsed || typeof parsed !== "object") {
    return { ok: false, errors: ["response is not an object"] };
  }

  const predictionsRaw = (parsed as any).predictions;
  if (!Array.isArray(predictionsRaw)) {
    return { ok: false, errors: ["missing or invalid predictions[]"] };
  }

  const sanitized: Prediction[] = [];
  const errors: string[] = [];

  for (let i = 0; i < predictionsRaw.length; i++) {
    const p = predictionsRaw[i];
    if (!p || typeof p !== "object") {
      errors.push(`predictions[${i}] is not an object`);
      continue;
    }

    const kind =
      typeof (p as any).kind === "string" ? (p as any).kind.trim() : "";
    if (!kind) {
      errors.push(`predictions[${i}].kind missing`);
      continue;
    }

    // Normalize and clamp score based on known kinds.
    // Frontend expects probability scores in 0..1 (it multiplies by 100 for display).
    let scoreRaw: unknown = (p as any).score;
    let score = clampNumber(scoreRaw, 0, 1, 0);
    if (kind === "interview_probability" || kind === "offer_probability") {
      // Accept either 0..1 OR 0..100 from the model; normalize to 0..1.
      const n = typeof scoreRaw === "number" ? scoreRaw : Number(scoreRaw);
      if (Number.isFinite(n) && n > 1 && n <= 100) {
        score = clampNumber(n / 100, 0, 1, 0);
      } else {
        score = clampNumber(n, 0, 1, 0);
      }
    } else if (kind === "timeline_weeks") {
      // Timeline is an integer number of weeks.
      score = Math.round(clampNumber(scoreRaw, 1, 52, 12));
    } else {
      // Unknown kinds: keep conservative 0..100 scale but avoid absurd values.
      const n = typeof scoreRaw === "number" ? scoreRaw : Number(scoreRaw);
      score = clampNumber(n, 0, 100, 0);
    }

    const confidence =
      (p as any).confidence === undefined
        ? undefined
        : clampNumber((p as any).confidence, 0, 1, 0.5);

    const recommendations = coerceStringArray(
      (p as any).recommendations,
      10,
      220
    );

    const details =
      (p as any).details &&
      typeof (p as any).details === "object" &&
      !Array.isArray((p as any).details)
        ? ((p as any).details as Record<string, unknown>)
        : undefined;

    sanitized.push({ kind, score, confidence, recommendations, details });
  }

  if (sanitized.length === 0) {
    return {
      ok: false,
      errors: errors.length ? errors : ["no valid predictions"],
    };
  }

  // For a stable UX, keep only one item per key kind when duplicates appear.
  const preferKinds: Array<string> = [
    "interview_probability",
    "offer_probability",
    "timeline_weeks",
  ];
  const byKind = new Map<string, Prediction>();
  for (const p of sanitized) {
    if (!byKind.has(p.kind)) byKind.set(p.kind, p);
  }
  const ordered: Prediction[] = [];
  for (const k of preferKinds) {
    const v = byKind.get(k);
    if (v) ordered.push(v);
  }
  // Append any extra kinds after the known ones.
  for (const p of sanitized) {
    if (
      !preferKinds.includes(p.kind) &&
      !ordered.some((x) => x.kind === p.kind)
    ) {
      ordered.push(p);
    }
  }

  return { ok: true, value: { predictions: ordered } };
}

function buildPredictionPrompt(sample: Array<Record<string, unknown>>): string {
  // Keep the schema rules explicit and short; accuracy comes from clean inputs + constraints.
  return [
    "You analyze a user's job search pipeline and return structured predictions.",
    "Return ONLY valid JSON (no markdown, no prose).",
    "Schema:",
    '{ "predictions": [ { "kind": string, "score": number, "confidence": number, "recommendations": string[]?, "details": object? } ] }',
    "Kinds expected:",
    "- interview_probability (score is a probability 0..1, NOT a percent)",
    "- offer_probability (score is a probability 0..1, NOT a percent)",
    "- timeline_weeks (score is an integer 1..52)",
    "Rules:",
    "- confidence must be 0..1",
    "- include 1-3 concise recommendations per prediction (strings)",
    "- base predictions on the statuses and volume",
    "- return EXACTLY 3 predictions (one for each kind above); no extra items",
    "Example:",
    '{"predictions":[{"kind":"interview_probability","score":0.32,"confidence":0.62,"recommendations":["Follow up on recent applications","Tailor resume for top roles"]},{"kind":"offer_probability","score":0.08,"confidence":0.55,"recommendations":["Increase application volume","Network for referrals"]},{"kind":"timeline_weeks","score":8,"confidence":0.5,"recommendations":["Schedule weekly follow-ups"]}]}',
    "Input jobs (max 30):",
    JSON.stringify(sample),
  ].join("\n");
}

function buildRepairPrompt(params: {
  originalPrompt: string;
  validationErrors: string[];
  previousResponsePreview: string;
}): string {
  return [
    "The previous response failed validation.",
    "Fix the JSON to match the required schema exactly.",
    "Return ONLY valid JSON (no markdown, no prose).",
    "Validation errors:",
    ...params.validationErrors.map((e) => `- ${e}`),
    "Previous response preview:",
    params.previousResponsePreview,
    "Original instructions:",
    params.originalPrompt,
  ].join("\n");
}

export async function predictJobSearch(params: {
  jobs: InputJob[];
  userId: string;
}): Promise<PredictionResult> {
  const { jobs, userId } = params;

  // Validate inputs defensively
  if (!userId || typeof userId !== "string") {
    logError("predict.invalid_userId", { userId: typeof userId });
    return { error: "userId is required" };
  }

  if (!jobs || !Array.isArray(jobs)) {
    logError("predict.invalid_jobs", { type: typeof jobs });
    return { error: "jobs array required" };
  }

  if (jobs.length === 0) {
    // Return sensible defaults for empty job list
    return {
      success: true,
      predictions: [
        { kind: "interview_probability", score: 5, confidence: 0.3 },
        { kind: "offer_probability", score: 1, confidence: 0.2 },
        { kind: "timeline_weeks", score: 16, confidence: 0.3 },
      ],
      simulated: true,
      note: "No jobs to analyze, showing baseline predictions",
    };
  }

  // Local simulation fallback - robust against bad data
  function simulate(): PredictionResult {
    const total = jobs.length;

    // Safely count offers and interviews
    const offers = jobs.filter((j) => {
      try {
        const status = String(j?.job_status ?? "").toLowerCase();
        return status.includes("offer");
      } catch {
        return false;
      }
    }).length;

    const interviews = jobs.filter((j) => {
      try {
        const status = String(j?.job_status ?? "").toLowerCase();
        return status.includes("interview") || status.includes("phone");
      } catch {
        return false;
      }
    }).length;

    const interviewProb = Math.min(
      0.95,
      Math.max(0.05, 0.15 + (interviews / Math.max(1, total)) * 0.6)
    );
    const offerProb = Math.min(
      0.9,
      Math.max(0.01, 0.03 + (offers / Math.max(1, total)) * 0.7)
    );
    const timelineWeeks = Math.max(4, Math.round(12 - interviews));

    return {
      success: true,
      predictions: [
        {
          kind: "interview_probability",
          score: Math.round(interviewProb * 100),
          confidence: 0.6,
        },
        {
          kind: "offer_probability",
          score: Math.round(offerProb * 100),
          confidence: 0.55,
        },
        { kind: "timeline_weeks", score: timelineWeeks, confidence: 0.5 },
      ],
      simulated: true,
    };
  }

  // If AI provider not configured or FAKE_AI=true, return simulated result
  if (process.env.FAKE_AI === "true" || !process.env.AI_API_KEY) {
    logInfo("predict.simulate", { userId, jobsCount: jobs.length });
    return simulate();
  }

  try {
    logInfo("predict.start", { userId, jobsCount: jobs.length });

    // Sanitize jobs before sending to AI - only include safe fields
    const sample = jobs.slice(0, 30).map((j) => ({
      id: j.id ?? null,
      title: String(j.title ?? "").slice(0, 100),
      company: String(j.company ?? "").slice(0, 100),
      industry: j.industry ? String(j.industry).slice(0, 50) : null,
      status: String(j.job_status ?? "").slice(0, 50),
    }));

    const prompt = buildPredictionPrompt(sample);
    logInfo("predict.calling_ai", { userId, promptLength: prompt.length });

    // Attempt 1: normal generation
    const gen1 = await aiClient.generate("job-prediction", prompt, {
      model: process.env.AI_MODEL ?? "gpt-4o-mini",
      temperature: 0.2,
      maxTokens: 700,
      timeoutMs: 30_000,
      maxRetries: 2,
    });

    const parsed1 = parseJsonFromAi(gen1);
    const validated1 = validateAndSanitizePredictions(parsed1);
    if (validated1.ok) {
      return {
        success: true,
        predictions: validated1.value.predictions,
        debug: { meta: gen1?.meta ?? null },
      };
    }

    // Attempt 2: bounded repair/regenerate (more deterministic)
    const preview = (() => {
      try {
        const rawText =
          typeof gen1?.text === "string"
            ? gen1.text
            : JSON.stringify(gen1?.raw ?? {});
        return String(rawText ?? "").slice(0, 600);
      } catch {
        return "";
      }
    })();
    logError("predict.validation_failed", undefined, {
      userId,
      errors: validated1.errors,
    });

    const repairPrompt = buildRepairPrompt({
      originalPrompt: prompt,
      validationErrors: validated1.errors,
      previousResponsePreview: preview,
    });

    const gen2 = await aiClient.generate("job-prediction", repairPrompt, {
      model: process.env.AI_MODEL ?? "gpt-4o-mini",
      temperature: 0,
      maxTokens: 700,
      timeoutMs: 30_000,
      maxRetries: 1,
    });
    const parsed2 = parseJsonFromAi(gen2);
    const validated2 = validateAndSanitizePredictions(parsed2);
    if (validated2.ok) {
      return {
        success: true,
        predictions: validated2.value.predictions,
        debug: { meta: gen2?.meta ?? null, repaired: true },
      };
    }

    logError("predict.repair_failed", undefined, {
      userId,
      errors: validated2.errors,
    });
    return simulate();
  } catch (e: any) {
    logError("predict.failed", e, { userId });
    return simulate();
  }
}
