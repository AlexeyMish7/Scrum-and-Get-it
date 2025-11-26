/**
 * REFERENCE GUIDE GENERATION
 *
 * POST /api/generate/reference-points
 *
 * Generates a short guide and talking points a user can use when asking
 * a reference contact to provide a reference. The generation should use the
 * selected job descriptions, the user's skills (from the skills table), and
 * optional notes provided by the user.
 */
import type { IncomingMessage, ServerResponse } from "node:http";
import { generate } from "../../services/aiClient.js";
import {
  legacyLogInfo as logInfo,
  legacyLogError as logError,
} from "../../../utils/logger.js";
import { readJson, sendJson } from "../../../utils/http.js";
import { ApiError } from "../../../utils/errors.js";
import { checkLimit } from "../../../utils/rateLimiter.js";
import type { GenerationCounters } from "./types.js";

interface ReferenceRequestBody {
  // Array of selected job description texts (strings)
  job_descriptions?: string[];
  // User skills; accept array of skill names or objects with name prop
  skills?: Array<string | { name: string }>;
  // Optional freeform notes the user wants included
  notes?: string;
  // Optional name of the reference contact to personalize the guide
  contact_name?: string;
}

function normalizeSkills(skills?: Array<string | { name: string }>) {
  if (!skills || skills.length === 0) return [];
  return skills.map((s) => (typeof s === "string" ? s : s.name)).filter(Boolean);
}

function buildPrompt(body: ReferenceRequestBody) {
  const { job_descriptions, notes, contact_name } = body;
  const skillList = normalizeSkills(body.skills);

  return `You are a practical assistant that produces a short reference guide and talking points the user can give to a reference contact (someone who will speak to the user's qualifications).

Input:
- contact_name: ${contact_name ?? "(not provided)"}
- skills: ${skillList.length > 0 ? skillList.join(", ") : "(none)"}
- selected_job_descriptions: ${job_descriptions && job_descriptions.length > 0 ? job_descriptions.join("\n---\n") : "(none)"}
- notes: ${notes ? notes : "(none)"}

Task:
1) Produce a short one-paragraph 'guide' (2-4 sentences) the user can send to their reference contact. The guide should explain what the reference is for, which key skills and experience to emphasize (based on the skills and job descriptions), and any context from the notes.
2) Produce an array 'talking_points' with 5 concise bullet-style talking points (each 6-18 words) that the reference can use when speaking or writing the reference. Prioritize matching to the selected job descriptions and the listed skills.
3) If a contact_name is provided, personalize the guide opening with the name.
4) Keep language neutral, professional, and easy for the reference to read aloud or paste into a form.

Return ONLY valid JSON with this shape:
{
  "guide": "...",
  "talking_points": ["...", "..."]
}

Do NOT include any extra commentary or markdown outside the JSON.`;
}

export async function post(
  req: IncomingMessage,
  res: ServerResponse,
  url: URL,
  reqId: string,
  userId: string,
  counters: GenerationCounters
): Promise<void> {
  // Rate limit: moderate (50 requests/5min per user)
  const limit = checkLimit(`reference_points:${userId}`, 50, 300_000);
  if (!limit.ok) {
    res.setHeader("Retry-After", String(limit.retryAfterSec ?? 60));
    throw new ApiError(429, "rate limited", "rate_limited");
  }

  let body: ReferenceRequestBody;
  try {
    body = (await readJson(req)) as ReferenceRequestBody;
  } catch (e: any) {
    throw new ApiError(400, "invalid JSON body", "bad_json");
  }

  // Basic validation: require at least skills or a job description or notes
  if ((!body.skills || body.skills.length === 0) && (!body.job_descriptions || body.job_descriptions.length === 0) && !body.notes) {
    throw new ApiError(400, "Missing required data: skills, job_descriptions, or notes", "bad_request");
  }

  counters.generate_total++;
  const start = Date.now();

  try {
    const prompt = buildPrompt(body);

    const aiResult = await generate("reference_points", prompt, {
      model: "gpt-4o-mini",
      temperature: 0.5,
      maxTokens: 900,
      timeoutMs: 20000,
    });

    let guide = "";
    let talking_points: string[] = [];

    if (aiResult.json && typeof aiResult.json === "object") {
      guide = (aiResult.json as any).guide ?? "";
      if (Array.isArray((aiResult.json as any).talking_points)) {
        talking_points = (aiResult.json as any).talking_points;
      }
    } else if (aiResult.text) {
      try {
        const parsed = JSON.parse(aiResult.text);
        guide = parsed.guide ?? "";
        if (Array.isArray(parsed.talking_points)) talking_points = parsed.talking_points;
      } catch (e) {
        // ignore parse error
      }
    }

    // Basic fallback if AI didn't return structured output
    if (!guide) {
      const skillText = normalizeSkills(body.skills).slice(0, 5).join(", ") || "key skills";
      guide = `${body.contact_name ? `Hi ${body.contact_name}, ` : ""}I am applying for roles that value ${skillText}. Please emphasize my experience related to these skills and the responsibilities in the attached job descriptions. Thank you for your time and honesty.`;
    }

    if (!talking_points || talking_points.length === 0) {
      // heuristics to create talking points
      const skills = normalizeSkills(body.skills);
      const points: string[] = [];
      if (skills.length > 0) {
        skills.slice(0, 3).forEach((s) => points.push(`${s}: concrete example of achievements or impact`));
      }
      if (body.job_descriptions && body.job_descriptions.length > 0) {
        points.push("How the candidate's experience maps to the core responsibilities in the job description");
      }
      if (body.notes) points.push(body.notes.slice(0, 120));
      points.push("Candidate's strengths and areas they excelled at");
      // trim to 5
      talking_points = points.slice(0, 5).map((p) => typeof p === "string" ? p : String(p));
    }

    const latencyMs = Date.now() - start;
    counters.generate_success++;
    logInfo("reference_points_generate_success", { userId, reqId, latencyMs, count: talking_points.length });

    sendJson(res, 200, { guide, talking_points, meta: { latency_ms: latencyMs } });
  } catch (err: any) {
    const latencyMs = Date.now() - start;
    counters.generate_fail++;
    logError("reference_points_generate_error", { userId, reqId, error: err?.message ?? String(err), latencyMs });
    throw new ApiError(502, err?.message ?? "AI generation failed", "ai_error");
  }
}
