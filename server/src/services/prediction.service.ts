/**
 * Prediction service
 * - Builds a concise prompt for job-search prediction
 * - Calls AI via aiClient.generate
 * - Falls back to a lightweight simulation when AI is unavailable
 */
import { generate } from "./aiClient.js";
import { legacyLogInfo as logInfo, legacyLogError as logError } from "../utils/logger.js";

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
  if (!jobs || !Array.isArray(jobs) || jobs.length === 0) {
    return { error: "jobs array required" };
  }

  // Local simulation fallback
  function simulate() {
    const total = jobs.length;
    const offers = jobs.filter((j) => (j.job_status ?? "").toLowerCase().includes("offer")).length;
    const interviews = jobs.filter((j) => {
      const s = (j.job_status ?? "").toLowerCase();
      return s.includes("interview") || s.includes("phone");
    }).length;

    const interviewProb = Math.min(0.95, Math.max(0.05, 0.15 + (interviews / Math.max(1, total)) * 0.6));
    const offerProb = Math.min(0.9, Math.max(0.01, 0.03 + (offers / Math.max(1, total)) * 0.7));
    const timelineWeeks = Math.max(4, Math.round(12 - interviews));

    return {
      success: true,
      predictions: [
        { kind: "interview_probability", score: Math.round(interviewProb * 100), confidence: 0.6 },
        { kind: "offer_probability", score: Math.round(offerProb * 100), confidence: 0.55 },
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
    const sample = jobs.slice(0, 30); // keep payload small
    const systemPrompt = `You are an assistant that analyzes a user's recent job applications and returns structured predictions about interview probability, offer probability, expected timeline (weeks), and concise recommendations. Return a single JSON object with top-level key \"predictions\" which is an array of objects with keys: kind (string), score (number), confidence (0-1), recommendations (array of strings, optional), details (optional object). Return ONLY JSON.`;

    const userMessage = `Analyze the following jobs (up to 30): ${JSON.stringify(sample)}\n\nReturn format: { "predictions": [ { "kind": "interview_probability", "score": 42, "confidence": 0.6, "recommendations": ["..."] } ] }`;

    const prompt = `${systemPrompt}\n\n${userMessage}`;

    const aiResult = await generate("job-prediction", prompt, { model: "gpt-4o-mini", temperature: 0.2, maxTokens: 800 });

    const parsed = aiResult.json ?? (typeof aiResult.text === "string" ? tryParseJson(aiResult.text) : null);
    if (!parsed || !Array.isArray((parsed as any).predictions)) {
      logError("predict.parse_failed", { userId, raw: aiResult.raw });
      return simulate();
    }

    return { success: true, predictions: (parsed as any).predictions, debug: { meta: aiResult.meta } };
  } catch (e: any) {
    logError("predict.failed", { userId, error: e?.message ?? String(e) });
    return simulate();
  }
}

function tryParseJson(text: any) {
  try {
    // strip code fences
    if (typeof text === "string") {
      const cleaned = text.replace(/```(?:json)?\n?/g, "").replace(/```/g, "").trim();
      return JSON.parse(cleaned);
    }
    return null;
  } catch {
    return null;
  }
}
