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
  templateId?: string; // Template identifier for template-aware generation
  // Optional enriched profile data
  skillsList?: Array<{ skill_name: string; skill_category?: string }>;
  employment?: Array<{
    id?: string;
    job_title?: string;
    company_name?: string;
    location?: string;
    start_date?: string;
    end_date?: string | null;
    job_description?: string;
    current_position?: boolean;
  }>;
  education?: Array<{
    id?: string;
    institution_name?: string;
    degree_type?: string | null;
    field_of_study?: string | null;
    graduation_date?: string | null;
    gpa?: number | null;
    honors?: string | null;
  }>;
  projects?: Array<{
    id?: string;
    proj_name?: string;
    proj_description?: string | null;
    role?: string | null;
    start_date?: string | null;
    end_date?: string | null;
    tech_and_skills?: string[] | null;
    proj_outcomes?: string | null;
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

  // Template-specific style instructions
  const templateId = args.templateId || "classic";
  let templateInstructions = "";
  switch (templateId) {
    case "classic":
      templateInstructions =
        "Use traditional, conservative language. Emphasize stability and proven track record. Prefer formal bullet points and conventional structure.";
      break;
    case "modern":
      templateInstructions =
        "Use contemporary, tech-forward language. Emphasize innovation and cutting-edge skills. Prioritize technical keywords and modern frameworks. Skills-first approach preferred.";
      break;
    case "minimal":
      templateInstructions =
        "Use concise, direct language. Avoid unnecessary adjectives. Focus on core achievements and measurable results. Keep bullets brief and impactful.";
      break;
    case "creative":
      templateInstructions =
        "Use engaging, dynamic language. Emphasize projects and creative problem-solving. Highlight unique contributions and innovative approaches. Projects-first approach preferred.";
      break;
    case "academic":
      templateInstructions =
        "Use formal academic language. Emphasize research, publications, and scholarly achievements. Education-first approach. Include methodologies and findings where applicable.";
      break;
    default:
      templateInstructions =
        "Use professional, balanced language suitable for the target role.";
  }

  // Build compact context lines from related tables (limit tokens)
  const employmentLines = (args.employment || [])
    .slice(0, 6)
    .map((e) => {
      const basics = [
        e.job_title || "",
        e.company_name ? `@ ${e.company_name}` : "",
        e.start_date || e.end_date
          ? `(${e.start_date ?? "?"} – ${
              e.current_position ? "present" : e.end_date ?? "present"
            })`
          : "",
      ]
        .filter(Boolean)
        .join(" ");
      // Include job description bullets if available (first 200 chars)
      const desc = e.job_description
        ? ` - ${safe(e.job_description, 200)}`
        : "";
      return safe(basics + desc);
    })
    .filter(Boolean)
    .join("; ");

  const educationLines = (args.education || [])
    .slice(0, 4)
    .map((ed) => {
      const basics = [
        ed.institution_name || "",
        ed.degree_type || ed.field_of_study
          ? `— ${[ed.degree_type, ed.field_of_study].filter(Boolean).join(" ")}`
          : "",
        ed.graduation_date ? `(Grad: ${ed.graduation_date})` : "",
      ]
        .filter(Boolean)
        .join(" ");
      const extras = [
        ed.gpa && ed.gpa > 0 ? `GPA: ${ed.gpa}` : "",
        ed.honors ? safe(ed.honors, 60) : "",
      ]
        .filter(Boolean)
        .join(", ");
      return safe(extras ? `${basics} [${extras}]` : basics);
    })
    .filter(Boolean)
    .join("; ");

  const projectLines = (args.projects || [])
    .slice(0, 4)
    .map((p) => {
      const basics = [
        p.proj_name || "",
        p.role ? `— ${p.role}` : "",
        p.start_date || p.end_date
          ? `(${p.start_date ?? "?"} – ${p.end_date ?? "present"})`
          : "",
      ]
        .filter(Boolean)
        .join(" ");
      const tech =
        Array.isArray(p.tech_and_skills) && p.tech_and_skills.length
          ? ` Tech: ${p.tech_and_skills.slice(0, 6).join(", ")}`
          : "";
      const desc = p.proj_description
        ? ` - ${safe(p.proj_description, 150)}`
        : "";
      const outcomes = p.proj_outcomes
        ? ` Outcomes: ${safe(p.proj_outcomes, 100)}`
        : "";
      return safe(basics + tech + desc + outcomes);
    })
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
    `Template Style: ${templateInstructions}`,
    // Expanded JSON contract to support richer editors while keeping backward compatibility with bullets[]
    `Output: Strict JSON only. Shape:`,
    `{
      "summary": string (REQUIRED - write a compelling 2-3 sentence professional summary tailored to the target role),
      "ordered_skills": string[] (REQUIRED - list of skills ordered by relevance to the job, with most important first),
      "emphasize_skills": string[]? (skills to highlight prominently),
      "add_skills": string[]? (job requirements the candidate should consider adding),
      "ats_keywords": string[]? (important keywords from job description for ATS optimization),
      "score": number? (0-100 match score),
      "sections": {
        "experience": [{ "employment_id": string, "role": string, "company": string, "dates": string, "bullets": string[] }] (REQUIRED if employment data provided - generate 3-5 impactful, quantified achievement bullets per role),
        "education": [{ "education_id": string, "institution": string, "degree": string, "graduation_date": string, "details": string[]? }] (REQUIRED if education data provided),
        "projects": [{ "project_id": string, "name": string, "role": string?, "bullets": string[] }]? (include if projects data provided - generate 2-3 bullets highlighting impact and tech used)
      },
      "meta"?: { "confidence": number, "notes": string }
    }`,
    `CRITICAL: If employment, education, or projects data is provided in the context below, you MUST populate the corresponding sections with tailored content.`,
    `For experience bullets: Use STAR format (Situation-Task-Action-Result). Quantify impact where possible. Start with strong action verbs.`,
    `For education: Include GPA if >= 3.5, honors if present.`,
    `For projects: Focus on technical achievements, team collaboration, and measurable outcomes.`,
    `Do not include any prose outside of JSON.`,
    `Tone: ${toneStr}. ${focusStr}`,
    `\nCandidate: ${name}`,
    summary ? `Current Summary: ${summary}` : "",
    skills ? `Current Skills: ${skills}` : "",
    employmentLines ? `Employment History:\n${employmentLines}` : "",
    educationLines ? `Education Background:\n${educationLines}` : "",
    projectLines ? `Projects:\n${projectLines}` : "",
    certLines ? `Certifications: ${certLines}` : "",
    `\nTarget Role: ${title} at ${company}`,
    description ? `Job Description:\n${description}` : "",
    `\nReminder: Generate all sections with data provided above. Focus on achievements and quantifiable results.`,
  ]
    .filter(Boolean)
    .join("\n");
}
