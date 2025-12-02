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

interface SuggestContactsBody {
  job_title?: string;
  job_company?: string;
  alumni_school?: string | null;
}

function buildPrompt(body: SuggestContactsBody) {
  const { job_title, job_company, alumni_school } = body;

  return `
You are an assistant that suggests contacts the user can look up publicly.

There are TWO sections required:

1️⃣ "roleSuggestions": 2-4 professional contact types
   - "name" must be a role descriptor only (ex: "Software Hiring Manager")
   - DO NOT create any fake people
   - Must include strong "searchQuery" fields for LinkedIn or company pages

2️⃣ "publicLeaders": 1-3 public company executives
   - Allowed ONLY if they are widely recognized / appear on public company leadership pages
   - Include **real individuals** ONLY IF:
       ✔ They are C-suite, VP, or well-known executives
       ✔ Their names are easily verifiable on company websites
   - Include their actual name in "name"
   - Include a "role" field (ex: "CTO")
   - Include a "searchQuery" to validate the information publicly
   - NEVER include private or unverifiable individuals

Input context:
- job_title: ${job_title ?? "(not provided)"}
- job_company: ${job_company ?? "(not provided)"}
- alumni_school: ${alumni_school ?? "(not provided)"}

Return EXACT JSON ONLY:

{
  "roleSuggestions": [
    {
      "name": "Role descriptor only",
      "title": "Example: Senior Data Engineer",
      "company": "Example Company",
      "reason": "1-2 sentence reason",
      "searchQuery": "\"Senior Data Engineer\" \"Example Company\" site:linkedin.com"
    }
  ],
  "publicLeaders": [
    {
      "name": "Actual public figure name",
      "role": "Official job title",
      "company": "The company",
      "searchQuery": "\"Person Name\" \"Company Name\" site:linkedin.com"
    }
  ]
}
`;
}

export async function post(
  req: IncomingMessage,
  res: ServerResponse,
  url: URL,
  reqId: string,
  userId: string,
  counters: GenerationCounters
): Promise<void> {
  const limit = checkLimit(`suggest_contacts:${userId}`, 50, 300_000);
  if (!limit.ok) {
    res.setHeader("Retry-After", String(limit.retryAfterSec ?? 60));
    throw new ApiError(429, "rate limited", "rate_limited");
  }

  let body: SuggestContactsBody;
  try {
    body = await readJson(req) as SuggestContactsBody;
  } catch (e) {
    throw new ApiError(400, "invalid JSON body", "bad_json");
  }

  if (!body.job_title && !body.job_company) {
    throw new ApiError(400, "Missing required data: job_title or job_company", "bad_request");
  }

  counters.generate_total++;
  const start = Date.now();

  try {
    const prompt = buildPrompt(body);
    const aiResult = await generate("suggest_contacts", prompt, {
      model: "gpt-4o-mini",
      temperature: 0.25,
      maxTokens: 1000,
      timeoutMs: 20000,
    });

    let roleSuggestions: any[] = [];
    let publicLeaders: any[] = [];

    const payload = aiResult.json ?? (() => {
      try { return JSON.parse(aiResult.text || "{}"); } catch { return {}; }
    })();

    if (Array.isArray(payload.roleSuggestions)) {
      roleSuggestions = payload.roleSuggestions;
    }
    if (Array.isArray(payload.publicLeaders)) {
      publicLeaders = payload.publicLeaders;
    }

    // Fallback for role suggestions
    if (roleSuggestions.length === 0) {
      const role = body.job_title ?? "the role";
      const co = body.job_company ?? "the company";
      roleSuggestions = [
        {
          name: `Hiring Manager (${role})`,
          title: `Hiring Manager — ${role}`,
          company: co,
          reason: `Likely involved in hiring for ${role}.`,
          searchQuery: `"Hiring Manager" "${co}" site:linkedin.com"`
        }
      ];
    }

    // If no leader names returned safely, leave empty (better safe than sorry)
    publicLeaders = publicLeaders.filter(l => l.name && l.role);

    // Deduplicate generic roles
    const seenRoles = new Set();
    roleSuggestions = roleSuggestions.filter((s) => {
      const tag = (s.name || "").toLowerCase().replace(/[^a-z0-9]/g, "");
      if (!tag || seenRoles.has(tag)) return false;
      seenRoles.add(tag);
      return true;
    });

    const latencyMs = Date.now() - start;
    counters.generate_success++;
    logInfo("suggest_contacts_success", {
      userId, reqId, latencyMs,
      roles: roleSuggestions.length,
      leaders: publicLeaders.length
    });

    sendJson(res, 200, {
      roleSuggestions,
      publicLeaders,  // 👈 New section!
      meta: { latency_ms: latencyMs }
    });

  } catch (err: any) {
    const latencyMs = Date.now() - start;
    counters.generate_fail++;
    logError("suggest_contacts_error", {
      userId, reqId, latencyMs,
      error: err.message ?? String(err)
    });

    throw new ApiError(502, "AI generation failed", "ai_error");
  }
}
