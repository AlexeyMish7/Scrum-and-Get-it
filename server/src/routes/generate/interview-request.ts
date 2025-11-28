/**
 * INTERVIEW REQUEST GENERATION
 *
 * POST /api/generate/interview-request
 *
 * Generates a tailored outreach email requesting an informational interview
 * given a contact and optional job/topic context.
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
import { getProfile, getJob } from "../../services/supabaseAdmin.js";

interface InterviewRequestBody {
  // Contact fields
  name?: string;
  company?: string;
  industry?: string;
  personal_notes?: string;
  professional_notes?: string;
  // Optional app-specific ids
  contact_id?: number | string;

  // Optional job/topic context
  jobId?: number | string;
  job_title?: string;
  job_company?: string;
  topic?: string;
  preferred_time?: string;
}

function buildPrompt(body: InterviewRequestBody) {
  const name = body.name ?? "(not provided)";
  const company = body.company ?? body.job_company ?? "(not provided)";
  const industry = body.industry ?? "(not provided)";
  // Do not include or consider contact personal or professional notes.
  // Personal notes are removed for privacy and must not influence generation.
  const jobTitle = body.job_title ?? (body.jobId ? "the role you applied for" : "(none)");
  const topic = body.topic ?? "informational interview / career conversation";
  const preferredTime = body.preferred_time ? String(body.preferred_time) : "(no preference)";

  return `You are an assistant that drafts a concise, professional outreach email requesting an informational interview.

Input:\n- name: ${name}\n- company: ${company}\n- industry: ${industry}\n- job_title: ${jobTitle}\n- topic: ${topic}\n- preferred_time: ${preferredTime}\n
Instructions for generation:\n- If a specific job (job_title and/or job company) is provided, explicitly include the phrasing "the {job_title} role at {job_company}" in the email (subject or first paragraph) and ask for advice about that role/company.\n- If only a general topic is provided, mention that specific topic explicitly and ask to speak about it (e.g., "I'd love 20-30 minutes to talk specifically about X").\n- If the requester provided a preferred meeting time, include a sentence asking if the contact is available at that time (e.g., "Would you be available on {preferred_time}?").\n- If the contact has worked at the same company as the job company, mention that shared company briefly as a connection point.\n- Do not use or reference any personal notes or private messages about the contact. Respect privacy and avoid quoting or summarizing internal notes.\n
Task:\n1) Produce a JSON object with the following shape (no extra text):\n{\n  "subject": "...",\n  "email": "...",\n  "prep": ["short bullet points the requester should review before the interview (3-6 items)"]\n}\n\n2) The email should be 3-6 short paragraphs (2-6 sentences total), polite, specific, and include a clear low-friction next step (e.g., 20-30 minute call, coffee, or quick Zoom).\n\n3) Ensure the subject line is concise (6-10 words) and the prep array contains actionable items (relevant projects to review, suggested questions, and a 30-second intro the requester can prepare).\n\nReturn only valid JSON and do not include any explanation or markdown.`;
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
  const limit = checkLimit(`interview-request:${userId}`, 50, 300_000);
  if (!limit.ok) {
    res.setHeader("Retry-After", String(limit.retryAfterSec ?? 60));
    throw new ApiError(429, "rate limited", "rate_limited");
  }

  let body: InterviewRequestBody;
  try {
    body = (await readJson(req)) as InterviewRequestBody;
  } catch (e: any) {
    throw new ApiError(400, "invalid JSON body", "bad_json");
  }

  // Basic validation: require at least a name or an identifier (contact_id), or some context (jobId or topic)
  if (!body.name && !body.contact_id && !body.jobId && !body.topic) {
    throw new ApiError(400, "Missing required data: provide contact name/contact_id or job/topic", "bad_request");
  }

  // Fetch requesting user's profile for personalization (fallback name)
  let requesterProfile: any = null;
  try {
    requesterProfile = await getProfile(userId);
  } catch (e) {
    // Non-fatal - we'll proceed without profile
    requesterProfile = null;
  }

  // If jobId provided, fetch job for additional context
  let jobRow: any = null;
  if (body.jobId) {
    try {
      const jobIdNum = Number(body.jobId);
      if (!Number.isNaN(jobIdNum)) jobRow = await getJob(jobIdNum);
    } catch (e) {
      jobRow = null;
    }
  }

  // Derive some simple relational signals for prompt
  const contactCompany = body.company ? String(body.company).toLowerCase() : null;
  const jobCompany = (body.job_company ?? jobRow?.company_name) ? String((body.job_company ?? jobRow?.company_name)).toLowerCase() : null;
  // We do not derive role similarity from stored notes. Only use explicit fields like company/job.
  const jobTitle = (body.job_title ?? jobRow?.job_title) ? String((body.job_title ?? jobRow?.job_title)).toLowerCase() : null;
  const sharedCompany = contactCompany && jobCompany && contactCompany === jobCompany;
  const similarRole = false; // disabled: avoid using inferred role similarity from private notes

  counters.generate_total++;
  const start = Date.now();

  try {
    let prompt = buildPrompt(body);

    // Prefer explicit sign-off using the requester's profile first+last name when available
    const requesterName = requesterProfile
      ? ([(requesterProfile.first_name ?? "").trim(), (requesterProfile.last_name ?? "").trim()].filter(Boolean).join(" ") || requesterProfile.name || requesterProfile.full_name || null)
      : null;

    if (requesterName) {
      prompt += `\n\nSignatureInstruction: Use the requester's name for the email sign-off exactly as "${requesterName}" (e.g., "Best, ${requesterName}"). Do not leave a placeholder like [Your Name].`;
    } else {
      prompt += `\n\nSignatureInstruction: Sign the email with the requester's full name when available; otherwise use a polite neutral sign-off.`;
    }
    // Attach simple signals to help the model mention shared company / similar role when relevant
    prompt += `\n\nContextFlags:\n- shared_company: ${sharedCompany ? "true" : "false"}\n- similar_role: ${similarRole ? "true" : "false"}`;

    const aiResult = await generate("interview_request", prompt, {
      model: "gpt-4o-mini",
      temperature: 0.6,
      maxTokens: 900,
      timeoutMs: 20000,
    });

    let payload: { subject?: string; email?: string; prep?: string[] } = {};

    if (aiResult.json && typeof aiResult.json === "object") {
      const j = aiResult.json as any;
      payload.subject = j.subject ?? j.title ?? undefined;
      payload.email = j.email ?? j.body ?? undefined;
      payload.prep = Array.isArray(j.prep) ? j.prep : undefined;
    } else if (aiResult.text) {
      try {
        const parsed = JSON.parse(aiResult.text);
        payload.subject = parsed.subject ?? parsed.title ?? undefined;
        payload.email = parsed.email ?? parsed.body ?? undefined;
        payload.prep = Array.isArray(parsed.prep) ? parsed.prep : undefined;
      } catch (e) {
        // ignore parse error
      }
    }

    // Fallbacks if AI didn't return structured output
    if (!payload.email) {
      // Use a short form of the contact's name for greeting
      const nameShort = body.name?.split(" ")[0] ?? "there";

      // requesterName from above (computed from first+last name when available)

      // Prefer an explicit job+company phrase when available
      const jobTitleValue = body.job_title ?? jobRow?.job_title ?? null;
      const jobCompanyValue = body.job_company ?? jobRow?.company_name ?? null;
      let targetPhrase: string;
      if (jobTitleValue && jobCompanyValue) {
        targetPhrase = `the ${jobTitleValue} role at ${jobCompanyValue}`;
      } else if (jobTitleValue) {
        targetPhrase = jobTitleValue;
      } else {
        targetPhrase = body.topic ?? jobRow?.job_title ?? "your work";
      }

      // Include a suggested meeting time sentence if provided
      const preferred = body.preferred_time ? String(body.preferred_time) : null;

      const subject = jobTitleValue && jobCompanyValue
        ? `Quick question about ${jobTitleValue} at ${jobCompanyValue}`
        : jobTitleValue
        ? `Quick question about ${jobTitleValue}`
        : `Quick request about ${body.topic ?? "a short chat"}`;

      // Build body with job/topic/connection signals
      let connectionSentence = "";
      if (sharedCompany) connectionSentence = `I noticed you have experience at ${jobCompanyValue}, which caught my eye.`;
      else if (similarRole) connectionSentence = `I see you've held roles similar to ${jobTitleValue ?? "the role"}, which I would love to learn from.`;

      const availabilitySentence = preferred ? `Would you be available ${preferred}? ` : "";

      const email = `Hi ${nameShort},\n\nI hope you're doing well. I'm reaching out because I'm interested in learning more about ${targetPhrase} and would really value 20-30 minutes of your time for an informational conversation. ${connectionSentence ? connectionSentence + " " : ""}${availabilitySentence}If you're open to it, I'd love to find a time that works for you — I'm happy to work around your schedule or meet for a quick call or coffee.\n\nThanks so much for considering this — I appreciate any time you can spare.\n\nBest,\n${requesterName ?? "[Your Name]"}`;
      const prep = [
        `Review your recent role or project related to ${body.job_title ?? body.topic ?? "the topic"}`,
        "Prepare 3 specific questions about their experience or the company",
        "Have a 30-second summary of your background and goals",
      ];
      payload = { subject, email, prep };
    }

    const latencyMs = Date.now() - start;
    counters.generate_success++;
    logInfo("interview_request_generate_success", { userId, reqId, latencyMs });

      // Ensure the email ends with the requester's first+last name sign-off when available
      if (payload.email && requesterName) {
        try {
          // Strip common sign-off blocks (Best, Regards, Thanks, Sincerely) and replace with canonical sign-off
          payload.email = String(payload.email).replace(/\n\n(Best|Regards|Thanks|Sincerely)[\s\S]*$/i, "").trim();
          payload.email = payload.email + `\n\nBest,\n${requesterName}`;
        } catch (e) {
          // if anything goes wrong, fall back to returning the original payload
        }
      }

      sendJson(res, 201, { ...payload, meta: { latency_ms: latencyMs } });
  } catch (err: any) {
    const latencyMs = Date.now() - start;
    counters.generate_fail++;
    logError("interview_request_generate_error", { userId, reqId, error: err?.message ?? String(err), latencyMs });
    throw new ApiError(502, err?.message ?? "AI generation failed", "ai_error");
  }
}
