/**
 * Prediction service
 * - Builds a concise prompt for job-search prediction
 * - Calls AI via aiClient.generate
 * - Falls back to a lightweight simulation when AI is unavailable
 */
import { generate } from "./aiClient.js";
import {
  legacyLogInfo as logInfo,
  legacyLogError as logError,
} from "../utils/logger.js";

type InputJob = {
  id?: number | string;
  title?: string;
  company?: string;
  industry?: string | null;
  created_at?: string | null;
  status_changed_at?: string | null;
  job_status?: string | null;
};

export async function predictJobSearch(params: {
  jobs: InputJob[];
  userId: string;
}) {
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
  function simulate() {
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
    // Sanitize jobs before sending to AI - only include safe fields
    const sample = jobs.slice(0, 30).map((j) => ({
      id: j.id ?? null,
      title: String(j.title ?? "").slice(0, 100),
      company: String(j.company ?? "").slice(0, 100),
      industry: j.industry ? String(j.industry).slice(0, 50) : null,
      status: String(j.job_status ?? "").slice(0, 50),
    }));

    const systemPrompt = `You are an assistant that analyzes a user's recent job applications and returns structured predictions about interview probability, offer probability, expected timeline (weeks), and concise recommendations. Return a single JSON object with top-level key \"predictions\" which is an array of objects with keys: kind (string), score (number), confidence (0-1), recommendations (array of strings, optional), details (optional object). Return ONLY JSON.`;

    const userMessage = `Analyze the following jobs (up to 30): ${JSON.stringify(
      sample
    )}\n\nReturn format: { "predictions": [ { "kind": "interview_probability", "score": 42, "confidence": 0.6, "recommendations": ["..."] } ] }`;

    const prompt = `${systemPrompt}\n\n${userMessage}`;

    const aiResult = await generate("job-prediction", prompt, {
      model: "gpt-4o-mini",
      temperature: 0.2,
      maxTokens: 800,
    });

    // Handle null/undefined aiResult defensively
    if (!aiResult) {
      logError("predict.null_result", { userId });
      return simulate();
    }

    const parsed =
      aiResult.json ??
      (typeof aiResult.text === "string" ? tryParseJson(aiResult.text) : null);

    // Validate parsed result structure
    if (!parsed || typeof parsed !== "object") {
      logError("predict.parse_failed", {
        userId,
        raw: JSON.stringify(aiResult.raw ?? {}).slice(0, 200),
      });
      return simulate();
    }

    const predictions = (parsed as any).predictions;
    if (!Array.isArray(predictions) || predictions.length === 0) {
      logError("predict.no_predictions", {
        userId,
        parsedKeys: Object.keys(parsed),
      });
      return simulate();
    }

    // Validate each prediction has required fields
    const validPredictions = predictions.filter(
      (p: any) =>
        p &&
        typeof p === "object" &&
        typeof p.kind === "string" &&
        typeof p.score === "number"
    );

    if (validPredictions.length === 0) {
      logError("predict.invalid_predictions", {
        userId,
        count: predictions.length,
      });
      return simulate();
    }

    return {
      success: true,
      predictions: validPredictions,
      debug: { meta: aiResult.meta },
    };
  } catch (e: any) {
    logError("predict.failed", { userId, error: e?.message ?? String(e) });
    return simulate();
  }
}

function tryParseJson(text: any) {
  try {
    // strip code fences
    if (typeof text === "string") {
      const cleaned = text
        .replace(/```(?:json)?\n?/g, "")
        .replace(/```/g, "")
        .trim();
      return JSON.parse(cleaned);
    }
    return null;
  } catch {
    return null;
  }
}
