/**
 * Experience Tailoring Prompt (UC-050)
 * WHAT: Build a prompt instructing AI to refine per-role bullets towards a target job.
 * WHY: Enables focused resume customization to highlight relevant achievements and impact.
 * OUTPUT (STRICT JSON):
 * {
 *   roles: [{
 *     employment_id?: string,
 *     role?: string,
 *     company?: string,
 *     dates?: string,
 *     original_bullets?: string[],
 *     tailored_bullets: string[],
 *     relevance_score: number, // 0..100
 *     notes?: string[]
 *   }],
 *   overall?: {
 *     summary_suggestion?: string,
 *     keywords?: string[],
 *     global_score: number // 0..100
 *   }
 * }
 * GUARDRAILS: no fabrication; quantify only when source includes numeric signals; avoid fluff.
 */

function safe(text: any, max = 800): string {
  const s = String(text ?? "")
    .replace(/\s+/g, " ")
    .trim();
  return s.length > max ? s.slice(0, max) + " …" : s;
}

function list(arr: any, maxItems = 12, maxLen = 120): string {
  if (!Array.isArray(arr) || arr.length === 0) return "";
  const items = arr.slice(0, maxItems).map((x) => safe(x, maxLen));
  return items.join("; ");
}

export interface BuildExperienceTailoringPromptArgs {
  profile: any; // profiles row
  job: any; // jobs row
  employment: Array<{
    id?: string;
    job_title?: string;
    company_name?: string;
    start_date?: string;
    end_date?: string | null;
    job_description?: string | null;
  }>;
}

/** Build an instruction prompt guiding the AI to tailor experience bullets. */
export function buildExperienceTailoringPrompt(
  args: BuildExperienceTailoringPromptArgs
): string {
  const { profile, job, employment } = args;
  const name = safe(
    profile?.full_name ||
      `${profile?.first_name ?? ""} ${profile?.last_name ?? ""}`.trim()
  );
  const candidateSummary = safe(profile?.summary || "");
  const targetTitle = safe(job?.job_title || job?.title || "");
  const targetCompany = safe(job?.company_name || job?.company || "");
  const targetDesc = safe(job?.job_description || job?.description || "", 2000);

  const rolesBlock = employment
    .map((e) => {
      const dates = [safe(e.start_date || ""), safe(e.end_date || "Present")]
        .filter(Boolean)
        .join(" – ");
      const desc = safe(e.job_description || "", 1200);
      return `ROLE:\nID: ${e.id || "(none)"}\nTitle: ${safe(
        e.job_title || ""
      )}\nCompany: ${safe(
        e.company_name || ""
      )}\nDates: ${dates}\nDescription: ${desc}`;
    })
    .join("\n\n");

  return [
    `You are an expert resume editor focusing on tailoring experience. Output STRICT JSON only (no extra text).`,
    `Target Role: ${targetTitle} at ${targetCompany}`,
    targetDesc ? `Target Description: ${targetDesc}` : "",
    name ? `Candidate: ${name}` : "",
    candidateSummary ? `Existing Summary: ${candidateSummary}` : "",
    `Raw Roles (do not fabricate beyond provided details):\n${rolesBlock}`,
    `Instructions: For each role, produce improved tailored_bullets (max 6) emphasizing achievements relevant to the target role. Use action verbs. Quantify only when source description contains numbers or measurable outcomes. Provide a relevance_score 0..100. Provide optional notes explaining major tailoring choices.`,
    `Provide overall.summary_suggestion ONLY if a clear improvement to candidate summary is apparent (succinct, role-aligned). Provide global_score (holistic strength). Keywords: extract top 10 distinct ATS-aligned terms.`,
    `Output JSON shape exactly as documented earlier. No markdown, no commentary.`,
  ]
    .filter(Boolean)
    .join("\n\n");
}

export default buildExperienceTailoringPrompt;
