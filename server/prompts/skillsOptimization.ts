/*
Resume Skills Optimization prompt builder.
Goal: analyze job requirements vs user's skills and produce structured suggestions.

Output JSON contract:
{
  "emphasize": string[],         // existing skills to highlight
  "add": string[],               // suggested skills to add (if truly relevant)
  "order": string[],             // recommended ordering of skills for the resume
  "categories": {
    "technical": string[],
    "soft": string[]
  },
  "gaps": string[],              // explicit gaps vs job requirements
  "score": number                // overall match score 0..100
}
*/

function safe(text: any, max = 1500): string {
  const s = String(text ?? "")
    .replace(/\s+/g, " ")
    .trim();
  return s.length > max ? s.slice(0, max) + " …" : s;
}

function list(arr: any, maxItems = 40, maxLen = 50): string {
  if (!Array.isArray(arr) || arr.length === 0) return "";
  const items = arr.slice(0, maxItems).map((x) => safe(x, maxLen));
  return items.join(", ");
}

export interface BuildSkillsOptimizationPromptArgs {
  profile: any; // profile from DB (summary, etc.)
  job: any; // job row (job_description, job_title, company)
  skills: Array<{
    // user's skills from DB
    skill_name: string;
    skill_category?: string;
  }>;
}

/** Build a compact, factual instruction for skills optimization. */
export function buildSkillsOptimizationPrompt(
  args: BuildSkillsOptimizationPromptArgs
): string {
  const { profile, job, skills } = args;
  const name = safe(
    profile?.full_name ||
      `${profile?.first_name ?? ""} ${profile?.last_name ?? ""}`.trim()
  );
  const summary = safe(profile?.summary || "");

  const skillNames = (skills ?? []).map((s) => s.skill_name).filter(Boolean);
  const skillList = list(skillNames, 60, 50);

  const title = safe(job?.job_title || job?.title || "");
  const company = safe(job?.company_name || job?.company || "");
  const description = safe(
    job?.job_description || job?.description || "",
    2000
  );

  return [
    `You are an ATS-savvy resume assistant. Do not fabricate skills.`,
    `Compare the candidate's skills with the target job and recommend an optimized skills section.`,
    `Constraints: be concise, only include relevant skills, avoid buzzword stuffing.`,
    `Output STRICT JSON with keys { emphasize, add, order, categories: { technical, soft }, gaps, score }.`,
    `Score range: 0..100 (higher = better alignment).`,
    `\nCandidate: ${name}`,
    summary ? `Summary: ${summary}` : "",
    skillList ? `Skills: ${skillList}` : "",
    `\nTarget Role: ${title} at ${company}`,
    description ? `Job Description: ${description}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}
