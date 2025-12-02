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

interface EventContactsBody {
  event_name?: string;
  url?: string | null;
  description?: string | null;
}

function buildPrompt(body: EventContactsBody) {
  const { event_name, url, description } = body;

  return `
You are an assistant that suggests 2-4 publicly verifiable speakers or leaders connected to a public event.

You MAY include real individuals ONLY IF:
- They are **public figures** listed as speakers/leaders
- You can include a **public reference link** confirming their role at the event

If uncertain, fall back to **role-based entries** instead of a name.

Return ONLY valid JSON in this structure:

{
  "suggestions": [
    {
      "name": "Full public name OR role descriptor",
      "title": "Confirmed job title OR relevant role",
      "org": "Company or affiliation",
      "reason": "Why this person/role is relevant to connect with at the event",
      "referenceUrl": "Link to speaker profile or event page (required if real name)",
      "searchQuery": "Search to find more info about this individual or role"
    }
  ]
}

Event context:
- event_name: ${event_name ?? "(not provided)"}
- url: ${url ?? "(not provided)"}
- description: ${description ?? "(not provided)"}
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
  const limit = checkLimit(`event_contacts:${userId}`, 30, 300_000);
  if (!limit.ok) {
    res.setHeader("Retry-After", String(limit.retryAfterSec ?? 60));
    throw new ApiError(429, "rate limited", "rate_limited");
  }

  let body: EventContactsBody;
  try {
    body = await readJson(req) as EventContactsBody;
  } catch (e) {
    throw new ApiError(400, "invalid JSON body", "bad_json");
  }

  if (!body.event_name && !body.url) {
    throw new ApiError(400, "Missing required data: event_name or url", "bad_request");
  }

  counters.generate_total++;
  const start = Date.now();

  try {
    const prompt = buildPrompt(body);
    const aiResult = await generate("event_contacts", prompt, {
      model: "gpt-4o-mini",
      temperature: 0.4,
      maxTokens: 1000,
      timeoutMs: 20000,
    });

    let suggestions: any[] = [];

    if (aiResult.json && Array.isArray((aiResult.json as any).suggestions)) {
      suggestions = (aiResult.json as any).suggestions;
    } else if (aiResult.text) {
      try {
        const parsed = JSON.parse(aiResult.text);
        if (parsed && Array.isArray(parsed.suggestions)) suggestions = parsed.suggestions;
      } catch {
        // ignore parse errors from AI text
      }
    }

    // Safety check: filter out unverified real people
    suggestions = suggestions.filter((s) => {
      const name = String((s && s.name) || "");
      const isRealName = /\s/.test(name); // crude full-name check
      const hasRef = Boolean(s && s.referenceUrl && String(s.referenceUrl).includes("http"));
      return !isRealName || hasRef;
    });

    // Fallback: if all removed → give roles
    if (suggestions.length === 0) {
      const ev = body.event_name ?? "this event";
      suggestions = [
        {
          name: `AI Keynote Speaker`,
          title: `Speaker or Panel Leader`,
          org: `Unknown`,
          reason: `Keynote leaders are influential networking targets.`,
          referenceUrl: body.url ?? null,
          searchQuery: `"Keynote" "${ev}" site:linkedin.com"`,
        }
      ];
    }

    // Deduplicate by name or role
    const seen = new Set();
    suggestions = suggestions.filter((s) => {
      const key = String((s && (s.name || s.title)) || "").toLowerCase().replace(/[^a-z0-9]+/g, "");
      if (!key) return false;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    const latencyMs = Date.now() - start;
    counters.generate_success++;
    sendJson(res, 200, { suggestions, meta: { latency_ms: latencyMs } });
  } catch (err: any) {
    const latencyMs = Date.now() - start;
    counters.generate_fail++;
    logError("event_contacts_error", {
      userId,
      reqId,
      error: err.message ?? String(err),
      latencyMs,
    });
    throw new ApiError(502, "AI generation failed", "ai_error");
  }
}
