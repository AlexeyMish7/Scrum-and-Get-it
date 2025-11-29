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

interface ProfileBody {
	first_name?: string;
	last_name?: string;
	headline?: string | null;
	bio?: string | null;
	skills?: string[] | null;
	experience_summary?: string | null;
	education?: string | null;
	location?: string | null;
	// any other profile fields can be passed through
	[key: string]: unknown;
}

function buildPrompt(body: ProfileBody) {
    const headline = body.headline ?? "(not provided)";
    const bio = body.bio ?? "(not provided)";

	return `You are a concise career coach assistant that inspects a user's public profile headline and bio/summary and returns actionable tips to improve them.\n\nInput:\n- Headline: ${headline}\n- Bio: ${bio}\n\nTask:\n1) Identify whether the headline and bio are missing, weak, or effective. When a field is strong, set \"issue\" to \"ok\" and include a one-line rationale for why it's effective.\n2) For each field that can be improved, produce a short, concrete tip and, when appropriate, provide a one-sentence suggested rewrite or example.\n3) Prioritize the tips (most important first).\n4) Keep suggestions practical and copy-paste friendly (no more than 2 sentences per tip).\n\nReturn ONLY valid JSON with this exact shape (no extra text):\n{\n  "tips": [\n    { "field": "headline|bio|other", "issue": "missing|weak|ok", "tip": "...", "example": "optional suggested text" }\n  ]\n}\n\nBe concise, avoid marketing fluff, and do not return any markdown or explanatory text outside the JSON.`;
}

export async function post(
	req: IncomingMessage,
	res: ServerResponse,
	url: URL,
	reqId: string,
	userId: string,
	counters: GenerationCounters
): Promise<void> {
	// Rate limit: moderate per-user
	const limit = checkLimit(`profile_tips:${userId}`, 30, 300_000);
	if (!limit.ok) {
		res.setHeader("Retry-After", String(limit.retryAfterSec ?? 60));
		throw new ApiError(429, "rate limited", "rate_limited");
	}

	let body: ProfileBody;
	try {
		body = (await readJson(req)) as ProfileBody;
	} catch (e: any) {
		throw new ApiError(400, "invalid JSON body", "bad_json");
	}

	// Basic validation: body should be an object
	if (!body || typeof body !== "object") {
		throw new ApiError(400, "Missing profile data", "bad_request");
	}

	counters.generate_total++;
	const start = Date.now();

	try {
		const prompt = buildPrompt(body);

		const aiResult = await generate("profile_tips", prompt, {
			model: "gpt-4o-mini",
			temperature: 0.35,
			maxTokens: 800,
			timeoutMs: 20000,
		});

		let tips: Array<{ field: string; issue?: string; tip: string; example?: string }> = [];

		if (aiResult.json && Array.isArray((aiResult.json as any).tips)) {
			tips = (aiResult.json as any).tips;
		} else if (aiResult.text) {
			try {
				const parsed = JSON.parse(aiResult.text);
				if (Array.isArray(parsed.tips)) tips = parsed.tips;
			} catch (e) {
				// ignore parse error
			}
		}

		// Fallback heuristics if AI didn't return structured tips
		if (!tips || tips.length === 0) {
			const fallback: any[] = [];

			const headlineText = typeof body.headline === "string" ? body.headline.trim() : "";
			const bioText = typeof body.bio === "string" ? body.bio.trim() : "";

			// Headline checks
			if (!headlineText) {
				fallback.push({
					field: "headline",
					issue: "missing",
					tip: "Add a short, specific headline that highlights your role and top skill (e.g., 'Senior Frontend Engineer — React, TypeScript').",
					example: "Senior Frontend Engineer — React · TypeScript · Accessibility",
				});
			} else if (headlineText.length < 30) {
				fallback.push({
					field: "headline",
					issue: "weak",
					tip: "Make your headline more specific: include role, primary skill, and one differentiator.",
					example: `Instead of '${headlineText}', try 'Product Designer — UX research & enterprise apps'`,
				});
			} else if (
				headlineText.length >= 40 || /[·—\-|,]/.test(headlineText) || /\b(Manager|Engineer|Designer|Developer|Product|Research|Lead|Senior|Director|Founder)\b/i.test(headlineText)
			) {
				// Consider headline strong if it's sufficiently descriptive or contains role/skills separators
				fallback.push({
					field: "headline",
					issue: "ok",
					tip: "Headline is clear and informative: it includes role and/or key skills which helps discoverability.",
					example: headlineText,
				});
			}

			// Bio checks
			if (!bioText) {
				fallback.push({
					field: "bio",
					issue: "missing",
					tip: "Add a short professional summary (2–4 sentences) focusing on what you do, for whom, and a recent impact.",
					example: "I design intuitive B2B interfaces for healthcare startups, improving user retention by 18% through research-driven design.",
				});
			} else if (bioText.length < 80) {
				fallback.push({
					field: "bio",
					issue: "weak",
					tip: "Expand your summary to include context (what you do), audience (who you help), and impact (measurable result).",
					example: `Instead of '${bioText}', try 'I build scalable APIs for fintech platforms, reducing latency by 30% and improving developer experience.'`,
				});
			} else if (/(\d+%|\bincrease\b|\breduced\b|\bimproved\b|\bled\b|\bdelivered\b)/i.test(bioText) || bioText.length >= 180) {
				// Consider bio strong if it contains metrics or is reasonably detailed
				fallback.push({
					field: "bio",
					issue: "ok",
					tip: "Bio is strong: it contains context and measurable impact which recruiters value.",
					example: bioText,
				});
			}

			if (fallback.length === 0) {
				fallback.push({ field: "other", issue: "ok", tip: "Profile looks fine — consider adding measurable impact statements to your experience entries for more strength." });
			}

			tips = fallback;
		}

		const latencyMs = Date.now() - start;
		counters.generate_success++;
		logInfo("profile_tips_generate_success", { userId, reqId, latencyMs, count: tips.length });

		sendJson(res, 200, { tips, meta: { latency_ms: latencyMs } });
	} catch (err: any) {
		const latencyMs = Date.now() - start;
		counters.generate_fail++;
		logError("profile_tips_generate_error", { userId, reqId, error: err?.message ?? String(err), latencyMs });
		throw new ApiError(502, err?.message ?? "AI generation failed", "ai_error");
	}
}