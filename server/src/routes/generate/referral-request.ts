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

interface ReferralRequestBody {
  name?: string; // contact name
  contact_current_company?: string;
  contact_previous_companies?: string; // free text or comma list
  personal_notes?: string;
  professional_notes?: string;
  relationship_strength?: number; // 0-100
  job_title?: string; // target job title
  job_company?: string; // target company
}

function buildPrompt(body: ReferralRequestBody) {
  const {
    name,
    contact_current_company,
    contact_previous_companies,
    personal_notes,
    professional_notes,
    relationship_strength,
    job_title,
    job_company,
  } = body;

  return `You are an assistant that writes concise, polite, and persuasive referral request messages the user can send to a contact. The user is asking this contact to refer them for a specific job opening.

Input:
- contact name: ${name ?? "(not provided)"}
- contact current company: ${contact_current_company ?? "(not provided)"}
- contact previous companies: ${contact_previous_companies ?? "(not provided)"}
- personal notes about the contact: ${personal_notes ? personal_notes : "(none)"}
- professional notes about the contact: ${professional_notes ? professional_notes : "(none)"}
- relationship_strength (0-100): ${relationship_strength ?? "unknown"}
- target job title: ${job_title ?? "(not provided)"}
- target job company: ${job_company ?? "(not provided)"}

Task:
1) Produce an array called "suggestions" with 2 to 4 short, personalized referral-request message options (1-4 sentences each). Each suggestion should:
   - Politely remind the contact who the sender is (brief context) and ask if they'd be willing to refer the sender for the specified role.
   - If the contact previously worked at or currently works at the target company (or a previous company matches the job company), explicitly and naturally reference that experience (e.g., "I noticed you worked at X — I would value any insights or referral you'd be willing to provide").
   - Keep the ask low-friction: offer to provide a short summary, resume, or bullet points to make referring easy.
2) For each suggestion include a "tone" value (e.g., warm, professional, casual) and a one-sentence "rationale" explaining why the message is appropriate.

Return ONLY valid JSON with the following shape (no extra text):
{
  "suggestions": [
    { "message": "...", "tone": "...", "rationale": "..." }
  ]
}

Be concise, avoid marketing buzzwords, and do not include any markdown or explanatory text outside the JSON.`;
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
  const limit = checkLimit(`referral:${userId}`, 50, 300_000);
  if (!limit.ok) {
    res.setHeader("Retry-After", String(limit.retryAfterSec ?? 60));
    throw new ApiError(429, "rate limited", "rate_limited");
  }

  let body: ReferralRequestBody;
  try {
    body = (await readJson(req)) as ReferralRequestBody;
  } catch (e: any) {
    throw new ApiError(400, "invalid JSON body", "bad_json");
  }

  // Basic validation: need at least job title/company and some contact identifier or notes
  if (!body.job_title && !body.job_company) {
    throw new ApiError(400, "Missing required data: job_title or job_company", "bad_request");
  }

  counters.generate_total++;
  const start = Date.now();

  try {
    // If caller provided a contact id, try to fetch the contact's name from the DB
    let promptBody = { ...body } as ReferralRequestBody & Record<string, unknown>;
    try {
      const contactId = (body as any).contact_id ?? (body as any).contactId ?? null;
      if (contactId) {
        const { default: supabase } = await import("../../services/supabaseAdmin.js");
        if (supabase) {
          const { data: contactRow, error: contactErr } = await supabase
            .from("contacts")
            .select("first_name,last_name")
            .eq("id", contactId)
            .maybeSingle();
          if (!contactErr && contactRow) {
            const fname = (contactRow.first_name as string) ?? "";
            const lname = (contactRow.last_name as string) ?? "";
            const contactName = (fname || lname) ? `${(fname || "").trim()} ${(lname || "").trim()}`.trim() : null;
            if (contactName) promptBody.name = contactName;
          }
        }
      }
    } catch (e) {
      // Non-fatal: if DB lookup fails, continue using provided body values
    }

    const prompt = buildPrompt(promptBody as ReferralRequestBody);

    const aiResult = await generate("referral_request", prompt, {
      model: "gpt-4o-mini",
      temperature: 0.6,
      maxTokens: 800,
      timeoutMs: 20000,
    });

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

    // Fallback heuristic if AI didn't return structured suggestions
    if (!suggestions || suggestions.length === 0) {
      const nameShort = body.name?.split(" ")[0] ?? "there";
      const fallback: any[] = [];
      const companyMention = body.contact_previous_companies && body.contact_previous_companies.includes(body.job_company ?? "")
        ? `I noticed you have experience at ${body.job_company}. `
        : '';

      fallback.push({
        message: `Hi ${nameShort}, I hope you're well. I'm applying for the ${body.job_title ?? 'role'} at ${body.job_company ?? 'the company'} and was wondering if you'd be comfortable referring me — I can send a short summary or resume to make it easy. ${companyMention}`,
        tone: "professional",
        rationale: "Clear ask with offer to make referring easy and references any company experience when available",
      });

      fallback.push({
        message: `Hey ${nameShort}, quick note — I'm interested in the ${body.job_title ?? 'role'} at ${body.job_company ?? 'the company'}. If you're open to it, would you mind referring me or pointing me to the right person? I can provide a 2–3 line summary to paste into the referral`,
        tone: "casual",
        rationale: "Short, low-friction ask that offers a ready-to-send summary",
      });

      suggestions = fallback;
    }

    const latencyMs = Date.now() - start;
    counters.generate_success++;
    logInfo("referral_generate_success", { userId, reqId, latencyMs, count: suggestions.length });

    sendJson(res, 200, { suggestions, meta: { latency_ms: latencyMs } });
  } catch (err: any) {
    const latencyMs = Date.now() - start;
    counters.generate_fail++;
    logError("referral_generate_error", { userId, reqId, error: err?.message ?? String(err), latencyMs });
    throw new ApiError(502, err?.message ?? "AI generation failed", "ai_error");
  }
      }
