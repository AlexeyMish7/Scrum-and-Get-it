/*
Resume prompt builder with light sanitization and guardrails.
*/

function safe(text: any, max = 1500): string {
  const s = String(text ?? "")
    .replace(/\s+/g, " ")
    .trim();
  return s.length > max ? s.slice(0, max) + " …" : s;
}

function list(arr: any, maxItems = 20, maxLen = 80): string {
  if (!Array.isArray(arr) || arr.length === 0) return "";
  const items = arr.slice(0, maxItems).map((x) => safe(x, maxLen));
  return items.join(", ");
}

export interface BuildResumePromptArgs {
  profile: any;
  job: any;
  tone?: string;
  focus?: string;
}

export function buildResumePrompt(args: BuildResumePromptArgs): string {
  const { profile, job, tone, focus } = args;
  const name = safe(profile?.full_name || profile?.first_name || "");
  const summary = safe(profile?.summary || "");
  const skills = list(profile?.skills || profile?.tech_and_skills || []);

  const title = safe(job?.job_title || job?.title || "");
  const company = safe(job?.company_name || job?.company || "");
  const description = safe(
    job?.job_description || job?.description || "",
    2000
  );

  const toneStr = tone || "professional";
  const focusStr = focus ? `Focus on ${safe(focus, 120)}.` : "";

  return [
    `You are an expert resume writer. Do not fabricate information. Use only the provided profile and job content.`,
    `Write concise, ATS-friendly results tailored for the role.`,
    `Constraints: factual, action-oriented, quantified where possible, avoid fluff.`,
    // Expanded JSON contract to support richer editors while keeping backward compatibility with bullets[]
    `Output: Strict JSON only. Shape:`,
    `{
      "summary": string?,
      "bullets": [{ "text": string }]?,
      "ordered_skills": string[]?,
      "emphasize_skills": string[]?,
      "add_skills": string[]?,
      "ats_keywords": string[]?,
      "score": number?,
      "sections": {
        "experience"?: [{ "employment_id"?: string, "role"?: string, "company"?: string, "dates"?: string, "bullets": string[] }],
        "education"?: [{ "education_id"?: string, "institution"?: string, "degree"?: string, "graduation_date"?: string, "details"?: string[] }],
        "projects"?: [{ "project_id"?: string, "name"?: string, "role"?: string, "bullets": string[] }]
      }?,
      "meta"?: object
    }`,
    `Do not include any prose outside of JSON.`,
    `Tone: ${toneStr}. ${focusStr}`,
    `\nCandidate: ${name}`,
    summary ? `Summary: ${summary}` : "",
    skills ? `Skills: ${skills}` : "",
    `\nTarget Role: ${title} at ${company}`,
    description ? `Job Description: ${description}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}
