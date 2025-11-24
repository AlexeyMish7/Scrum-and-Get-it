/**
 * RELATIONSHIP OUTREACH GENERATION
 *
 * POST /api/generate/relationship
 *
 * Generates personalized outreach message suggestions for a contact using AI.
 * Expects JSON body with fields: name, company, industry, personal_notes,
 * professional_notes, relationship_strength (number 0-100).
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

interface RelationshipRequestBody {
  name?: string;
  company?: string;
  industry?: string;
  personal_notes?: string;
  professional_notes?: string;
  relationship_strength?: number;
}

function buildPrompt(body: RelationshipRequestBody) {
  const { name, company, industry, personal_notes, professional_notes, relationship_strength } = body;

  return `You are a helpful assistant that drafts concise, personalized outreach messages to re-engage or strengthen a relationship with a contact.

Input:
- name: ${name ?? "(not provided)"}
- company: ${company ?? "(not provided)"}
- industry: ${industry ?? "(not provided)"}
- personal_notes: ${personal_notes ? personal_notes : "(none)"}
- professional_notes: ${professional_notes ? professional_notes : "(none)"}
- relationship_strength: ${relationship_strength ?? "unknown"}  # number 0-100

Task:
1) Produce an array called "suggestions" with 3 to 5 short (1-3 sentence) personalized outreach message options tailored to the contact.
   - Do NOT just copy the "personal_notes" or "professional_notes" verbatim into the message. Instead, integrate the information naturally (e.g. if personal_notes is "loves coffee", write "I remember you mentioned you love coffee — would you like to grab a coffee sometime?" rather than quoting the note).
   - Prefer natural, conversational phrasing that makes it easy for the user to copy/paste or send.
2) For each suggestion include a "tone" value (e.g., warm, professional, casual).
3) Also include a short "rationale" explaining why the message is appropriate given the relationship_strength.

Return ONLY valid JSON with the following shape (no extra text):
{
  "suggestions": [
    { "message": "...", "tone": "...", "rationale": "..." }
  ]
}

Example output:
{
  "suggestions": [
    {
      "message": "Hi Alex — I remember you mentioned you love coffee. Would you be up for a quick coffee next week to catch up?",
      "tone": "warm",
      "rationale": "References a personal detail in a natural way and proposes a low-friction meeting."
    }
  ]
}

Be concise and avoid any markdown or explanatory text outside the JSON.`;
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
  const limit = checkLimit(`relationship:${userId}`, 50, 300_000);
  if (!limit.ok) {
    res.setHeader("Retry-After", String(limit.retryAfterSec ?? 60));
    throw new ApiError(429, "rate limited", "rate_limited");
  }

  let body: RelationshipRequestBody;
  try {
    body = (await readJson(req)) as RelationshipRequestBody;
  } catch (e: any) {
    throw new ApiError(400, "invalid JSON body", "bad_json");
  }

  // Basic validation: at least one note or a name must be provided
  if (!body.name && !body.personal_notes && !body.professional_notes) {
    throw new ApiError(400, "Missing required data: name or notes", "bad_request");
  }

  counters.generate_total++;
  const start = Date.now();

  try {
    const prompt = buildPrompt(body);

    const aiResult = await generate("relationship", prompt, {
      model: "gpt-4o-mini",
      temperature: 0.6,
      maxTokens: 800,
      timeoutMs: 20000,
    });

    // Parse suggestions from JSON or try to parse text
    let suggestions: Array<{ message: string; tone?: string; rationale?: string }> = [];
    if (aiResult.json && Array.isArray((aiResult.json as any).suggestions)) {
      suggestions = (aiResult.json as any).suggestions;
    } else if (aiResult.text) {
      try {
        const parsed = JSON.parse(aiResult.text);
        if (Array.isArray(parsed.suggestions)) suggestions = parsed.suggestions;
      } catch (e) {
        // ignore parse error
      }
    }

    // Fallback simple heuristic if AI didn't return structured suggestions
    if (!suggestions || suggestions.length === 0) {
      const nameShort = body.name?.split(" ")[0] ?? "there";
      const fallback: any[] = [];
      if (body.personal_notes) {
        fallback.push({
          message: `Hi ${nameShort}, I remembered when you mentioned ${body.personal_notes}. Would love to hear an update when you have a moment.`,
          tone: "warm",
          rationale: "References personal detail to re-open conversation",
        });
      }
      if (body.professional_notes) {
        fallback.push({
          message: `Hi ${nameShort}, I enjoyed hearing about ${body.professional_notes}. If you're open, I'd love to learn more about how that went.`,
          tone: "professional",
          rationale: "Engages on professional topic to build rapport",
        });
      }
      fallback.push({
        message: `Hi ${nameShort}, hope you're well — would you be open to a quick catch-up over coffee or a short call?`,
        tone: "casual",
        rationale: "Simple low-friction ask to re-establish connection",
      });
      suggestions = fallback;
    }

    const latencyMs = Date.now() - start;
    counters.generate_success++;
    logInfo("relationship_generate_success", { userId, reqId, latencyMs, count: suggestions.length });

    sendJson(res, 200, { suggestions, meta: { latency_ms: latencyMs } });
  } catch (err: any) {
    const latencyMs = Date.now() - start;
    counters.generate_fail++;
    logError("relationship_generate_error", { userId, reqId, error: err?.message ?? String(err), latencyMs });
    throw new ApiError(502, err?.message ?? "AI generation failed", "ai_error");
  }
}
