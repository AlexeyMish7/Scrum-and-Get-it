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
  // Optional enriched profile data
  skillsList?: Array<{ skill_name: string; skill_category?: string }>;
  employment?: Array<{
    id?: string;
    job_title?: string;
    company_name?: string;
    start_date?: string;
    end_date?: string | null;
  }>;
  education?: Array<{
    id?: string;
    institution_name?: string;
    degree_type?: string | null;
    field_of_study?: string | null;
    graduation_date?: string | null;
  }>;
  projects?: Array<{
    id?: string;
    proj_name?: string;
    role?: string | null;
    tech_and_skills?: string[] | null;
  }>;
  certifications?: Array<{
    id?: string;
    name: string;
    issuing_org?: string | null;
  }>;
}

export function buildResumePrompt(args: BuildResumePromptArgs): string {
  const { profile, job, tone, focus } = args;
  const name = safe(profile?.full_name || profile?.first_name || "");
  const summary = safe(profile?.summary || "");
  // Prefer normalized skills from `skills` table when provided, fall back to any inline arrays on profile
  const skillsFromTable = (args.skillsList || []).map((s) => s.skill_name);
  const skills = list(
    skillsFromTable.length
      ? skillsFromTable
      : profile?.skills || profile?.tech_and_skills || []
  );

  const title = safe(job?.job_title || job?.title || "");
  const company = safe(job?.company_name || job?.company || "");
  const description = safe(
    job?.job_description || job?.description || "",
    2000
  );

  const toneStr = tone || "professional";
  const focusStr = focus ? `Focus on ${safe(focus, 120)}.` : "";

  // Build compact context lines from related tables (limit tokens)
  const employmentLines = (args.employment || [])
    .slice(0, 6)
    .map((e) =>
      safe(
        [
          e.job_title || "",
          e.company_name ? `@ ${e.company_name}` : "",
          e.start_date || e.end_date
            ? `(${e.start_date ?? "?"} – ${e.end_date ?? "present"})`
            : "",
        ]
          .filter(Boolean)
          .join(" ")
      )
    )
    .filter(Boolean)
    .join("; ");

  const educationLines = (args.education || [])
    .slice(0, 4)
    .map((ed) =>
      safe(
        [
          ed.institution_name || "",
          ed.degree_type || ed.field_of_study
            ? `— ${[ed.degree_type, ed.field_of_study]
                .filter(Boolean)
                .join(" ")}`
            : "",
          ed.graduation_date ? `(Grad: ${ed.graduation_date})` : "",
        ]
          .filter(Boolean)
          .join(" ")
      )
    )
    .filter(Boolean)
    .join("; ");

  const projectLines = (args.projects || [])
    .slice(0, 4)
    .map((p) =>
      safe(
        [
          p.proj_name || "",
          p.role ? `— ${p.role}` : "",
          Array.isArray(p.tech_and_skills) && p.tech_and_skills.length
            ? `(Tech: ${p.tech_and_skills.slice(0, 6).join(", ")})`
            : "",
        ]
          .filter(Boolean)
          .join(" ")
      )
    )
    .filter(Boolean)
    .join("; ");

  const certLines = (args.certifications || [])
    .slice(0, 6)
    .map((c) =>
      safe(
        [c.name, c.issuing_org ? `(${c.issuing_org})` : ""]
          .filter(Boolean)
          .join(" ")
      )
    )
    .filter(Boolean)
    .join("; ");

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
    employmentLines ? `Employment: ${employmentLines}` : "",
    educationLines ? `Education: ${educationLines}` : "",
    projectLines ? `Projects: ${projectLines}` : "",
    certLines ? `Certifications: ${certLines}` : "",
    `\nTarget Role: ${title} at ${company}`,
    description ? `Job Description: ${description}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}
