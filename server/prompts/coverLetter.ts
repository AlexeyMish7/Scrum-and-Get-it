/*
Cover letter prompt builder with light sanitization and guardrails.
Produces content suitable for a JSON-structured cover letter.
*/

function safe(text: any, max = 1500): string {
  const s = String(text ?? "")
    .replace(/\s+/g, " ")
    .trim();
  return s.length > max ? s.slice(0, max) + " …" : s;
}

function list(arr: any, maxItems = 12, maxLen = 100): string {
  if (!Array.isArray(arr) || arr.length === 0) return "";
  const items = arr.slice(0, maxItems).map((x) => safe(x, maxLen));
  return items.join(", ");
}

export interface BuildCoverLetterPromptArgs {
  profile: any;
  job: any;
  tone?: string; // e.g., formal | enthusiastic | analytical
  focus?: string; // optional focus area (team leadership, cloud, data)
  templateId?: string; // Template identifier for template-aware generation
}

/**
 * COVER LETTER GENERATION: instruction builder
 * Output contract: JSON { sections: { opening: string, body: string, closing: string } }
 */
export function buildCoverLetterPrompt(
  args: BuildCoverLetterPromptArgs
): string {
  const { profile, job, tone, focus } = args;

  // Candidate details
  const name = safe(
    profile?.full_name ||
      `${profile?.first_name ?? ""} ${profile?.last_name ?? ""}`.trim()
  );
  const summary = safe(profile?.summary || "");
  const skills = list(profile?.skills || profile?.tech_and_skills || []);
  const titleLine = safe(profile?.professional_title || "");

  // Target role details
  const title = safe(job?.job_title || job?.title || "");
  const company = safe(job?.company_name || job?.company || "");
  const description = safe(
    job?.job_description || job?.description || "",
    2000
  );

  const toneStr = tone || "professional";
  const focusStr = focus ? `Focus on ${safe(focus, 120)}.` : "";

  // Template-specific style instructions
  const templateId = args.templateId || "formal";
  let templateInstructions = "";
  switch (templateId) {
    case "formal":
      templateInstructions =
        "Use highly professional, business-formal language. Traditional structure with formal salutation. Emphasize qualifications and alignment with company goals.";
      break;
    case "creative":
      templateInstructions =
        "Use engaging, personable language that showcases personality. Storytelling approach. Emphasize passion and unique perspectives. Can use less formal salutation.";
      break;
    case "technical":
      templateInstructions =
        "Use precise, technical language. Focus on specific technologies, methodologies, and quantifiable outcomes. Emphasize technical skills and problem-solving approaches.";
      break;
    case "modern":
      templateInstructions =
        "Use contemporary, direct language. Concise paragraphs. Focus on impact and innovation. Balance professionalism with approachability.";
      break;
    default:
      templateInstructions =
        "Use balanced professional language appropriate for the target role.";
  }

  return [
    `You are an expert cover letter writer. Do not fabricate details. Use only the provided profile and job content.`,
    `Write a personalized cover letter with clear motivation, role alignment, and quantified impact when possible.`,
    `Constraints: factual, concise, friendly-professional tone, ATS-friendly phrasing.`,
    `Template Style: ${templateInstructions}`,
    `Output: JSON with { sections: { opening: string, body: string, closing: string } } and no extra prose.`,
    `Tone: ${toneStr}. ${focusStr}`,
    `\nCandidate: ${name}`,
    titleLine ? `Title: ${titleLine}` : "",
    summary ? `Summary: ${summary}` : "",
    skills ? `Skills: ${skills}` : "",
    `\nTarget Role: ${title} at ${company}`,
    description ? `Job Description: ${description}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}
