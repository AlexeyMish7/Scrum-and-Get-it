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
  length?: string; // brief | standard | detailed
  culture?: string; // startup | corporate | academic | nonprofit
  companyResearch?: any; // Company research artifact content for personalization
}

/**
 * COVER LETTER GENERATION: instruction builder
 * Output contract: JSON { sections: { opening: string, body: string[], closing: string }, metadata: { wordCount: number, tone: string } }
 */
export function buildCoverLetterPrompt(
  args: BuildCoverLetterPromptArgs
): string {
  const { profile, job, tone, focus, companyResearch, length, culture } = args;

  // Candidate details
  const name = safe(
    profile?.full_name ||
      `${profile?.first_name ?? ""} ${profile?.last_name ?? ""}`.trim()
  );
  const summary = safe(profile?.summary || "");
  const skills = list(profile?.skills || profile?.tech_and_skills || []);
  const titleLine = safe(profile?.professional_title || "");

  // Education details
  const education = profile?.education || [];
  const educationText = education
    .slice(0, 3)
    .map((edu: any) => {
      const degree = safe(edu?.degree_type || "");
      const field = safe(edu?.field_of_study || "");
      const institution = safe(edu?.institution_name || "");
      const gradDate = edu?.graduation_date
        ? new Date(edu.graduation_date).getFullYear()
        : "";
      const gpa = edu?.gpa ? ` (GPA: ${edu.gpa})` : "";
      return `${degree} in ${field}, ${institution}${
        gradDate ? ` (${gradDate})` : ""
      }${gpa}`;
    })
    .filter(Boolean)
    .join("\n");

  // Skills breakdown
  const skillsList = profile?.skills || [];
  const technicalSkills = skillsList
    .filter((s: any) => s.skill_category === "Technical")
    .map((s: any) => safe(s.skill_name))
    .slice(0, 10);
  const softSkills = skillsList
    .filter((s: any) => s.skill_category !== "Technical")
    .map((s: any) => safe(s.skill_name))
    .slice(0, 5);

  // Experience details for richer context
  const experience = profile?.employment || profile?.experience || [];
  const experienceText = experience
    .slice(0, 4)
    .map((exp: any) => {
      const role = safe(exp?.job_title || exp?.title || "");
      const company = safe(exp?.company_name || exp?.company || "");
      const desc = safe(exp?.job_description || exp?.description || "", 300);
      const startDate = exp?.start_date
        ? new Date(exp.start_date).getFullYear()
        : "";
      const endDate = exp?.current_position
        ? "Present"
        : exp?.end_date
        ? new Date(exp.end_date).getFullYear()
        : "";
      const dates = startDate || endDate ? ` (${startDate}-${endDate})` : "";
      return `${role} at ${company}${dates}:\n  ${desc}`;
    })
    .join("\n\n");

  // Projects
  const projects = profile?.projects || [];
  const projectsText = projects
    .slice(0, 3)
    .map((proj: any) => {
      const name = safe(proj?.proj_name || "");
      const desc = safe(proj?.proj_description || "", 200);
      const role = safe(proj?.role || "");
      const tech = list(proj?.tech_and_skills || [], 8, 50);
      return `${name}${role ? ` (${role})` : ""}:\n  ${desc}${
        tech ? `\n  Technologies: ${tech}` : ""
      }`;
    })
    .filter(Boolean)
    .join("\n\n");

  // Certifications
  const certifications = profile?.certifications || [];
  const certificationsText = certifications
    .slice(0, 5)
    .map((cert: any) => {
      const name = safe(cert?.name || "");
      const org = safe(cert?.issuing_org || "");
      const date = cert?.date_earned
        ? new Date(cert.date_earned).getFullYear()
        : "";
      return `${name}${org ? ` - ${org}` : ""}${date ? ` (${date})` : ""}`;
    })
    .filter(Boolean)
    .join("\n");

  // Target role details
  const title = safe(job?.job_title || job?.title || "");
  const company = safe(job?.company_name || job?.company || "");
  const description = safe(
    job?.job_description || job?.description || "",
    2000
  );

  // Company research context (if available)
  let companyContext = "";
  if (companyResearch) {
    const companyName = safe(companyResearch?.name || company);
    const mission = safe(companyResearch?.mission || "");
    const values = list(companyResearch?.values || []);
    const recentNews = companyResearch?.recent_news || [];
    const products = list(companyResearch?.products || []);

    const newsItems = recentNews
      .slice(0, 2)
      .map((news: any) => {
        return `- ${safe(news?.title || "", 150)}`;
      })
      .join("\n");

    companyContext = [
      `\n--- COMPANY RESEARCH ---`,
      `IMPORTANT: This company research data is provided to help you craft a highly personalized cover letter.`,
      `You MUST reference specific details from this section to demonstrate genuine interest and research.`,
      ``,
      `Company: ${companyName}`,
      mission ? `Mission: ${mission}` : "",
      values ? `Core Values: ${values}` : "",
      products ? `Products/Services: ${products}` : "",
      newsItems ? `Recent News:\n${newsItems}` : "",
      ``,
      `REQUIREMENTS FOR USING THIS DATA:`,
      `- Reference at least 2-3 specific elements from the company research`,
      `- Connect the candidate's values/experience to the company's mission or values`,
      `- Mention recent company news or initiatives where relevant`,
      `- Show how the candidate's skills align with the company's products/services`,
      `- Make it clear this letter is specifically tailored to THIS company (not generic)`,
    ]
      .filter(Boolean)
      .join("\n");
  }

  const toneStr = tone || "professional";
  const focusStr = focus ? `Focus on ${safe(focus, 120)}.` : "";
  const lengthStr = length || "standard";
  const cultureStr = culture || "corporate";

  // Length-based adjustments
  let wordCountTarget = "350-450";
  let lengthGuidance = "";
  switch (lengthStr) {
    case "brief":
      wordCountTarget = "300-350";
      lengthGuidance =
        "Keep it concise but substantive. Aim for the lower end of word counts while maintaining impact.";
      break;
    case "detailed":
      wordCountTarget = "450-550";
      lengthGuidance =
        "Provide comprehensive detail. Include additional examples and elaboration. Aim for the higher end of word counts.";
      break;
    default: // standard
      wordCountTarget = "350-450";
      lengthGuidance =
        "Balanced coverage. Provide sufficient detail without being overly lengthy.";
  }

  // Culture-based tone adjustments
  let cultureGuidance = "";
  switch (cultureStr) {
    case "startup":
      cultureGuidance =
        "Use energetic, innovative language. Show adaptability and entrepreneurial mindset. Reference fast-paced environments and scrappy problem-solving.";
      break;
    case "corporate":
      cultureGuidance =
        "Professional, polished language. Emphasize structure, process, and alignment with business objectives. Reference teamwork and organizational impact.";
      break;
    case "academic":
      cultureGuidance =
        "Scholarly, precise language. Emphasize research, analysis, and intellectual contributions. Reference publications, methodologies, and academic rigor.";
      break;
    case "nonprofit":
      cultureGuidance =
        "Mission-driven language. Emphasize social impact, values alignment, and community benefit. Reference passion for the cause and desire to make a difference.";
      break;
    default:
      cultureGuidance =
        "Balanced professional language appropriate for the organization.";
  }

  // Template-specific style instructions
  const templateId = args.templateId || "formal";
  let templateInstructions = "";
  let structureGuidance = "";

  switch (templateId) {
    case "formal":
      templateInstructions =
        "Use highly professional, business-formal language. Traditional structure with formal salutation. Emphasize qualifications and alignment with company goals.";
      structureGuidance =
        "Opening: Express genuine interest and mention how you learned about the role. Body (2-3 paragraphs): Connect your experience to specific job requirements, provide examples with measurable outcomes, demonstrate knowledge of the company. Closing: Express enthusiasm, mention availability for interview, and thank them for consideration.";
      break;
    case "creative":
      templateInstructions =
        "Use engaging, personable language that showcases personality. Storytelling approach. Emphasize passion and unique perspectives. Can use less formal salutation.";
      structureGuidance =
        "Opening: Share a compelling story or insight that connects you to the role. Body (2-3 paragraphs): Describe your creative approach, show passion for the work, highlight unique contributions you've made. Closing: Express excitement about the opportunity to bring your creativity to their team.";
      break;
    case "technical":
      templateInstructions =
        "Use precise, technical language. Focus on specific technologies, methodologies, and quantifiable outcomes. Emphasize technical skills and problem-solving approaches.";
      structureGuidance =
        "Opening: Mention specific technologies or methodologies relevant to the role. Body (2-3 paragraphs): Detail technical projects with metrics, explain problem-solving approaches, reference relevant tech stack experience. Closing: Express interest in discussing technical challenges and how you can contribute.";
      break;
    case "modern":
      templateInstructions =
        "Use contemporary, direct language. Concise paragraphs. Focus on impact and innovation. Balance professionalism with approachability.";
      structureGuidance =
        "Opening: Direct statement of interest with a compelling hook. Body (2-3 paragraphs): Highlight impact-driven achievements, show alignment with company mission, demonstrate forward-thinking approach. Closing: Confident call-to-action expressing eagerness to contribute.";
      break;
    default:
      templateInstructions =
        "Use balanced professional language appropriate for the target role.";
      structureGuidance =
        "Opening: Express interest and briefly state why you're a strong fit. Body (2-3 paragraphs): Connect experience to requirements, provide specific examples, show company knowledge. Closing: Thank them and express interest in next steps.";
  }

  return [
    `You are an expert cover letter writer creating a compelling, personalized cover letter.`,
    ``,
    `CRITICAL INSTRUCTIONS - MUST FOLLOW EXACTLY:`,
    `- Use ONLY the provided candidate information - do not fabricate any details about experience, skills, or accomplishments`,
    `- Create substantive, well-developed paragraphs (4-6 sentences each MINIMUM)`,
    `- MINIMUM paragraph lengths: Opening 100 words, Each body paragraph 120-150 words, Closing 80 words`,
    `- Include specific examples from the candidate's background that align with job requirements`,
    `- Use quantifiable achievements when the candidate's profile includes them`,
    `- Make explicit connections between candidate's experience and the company's needs`,
    `- Demonstrate genuine enthusiasm and cultural fit`,
    `- TARGET WORD COUNT: ${wordCountTarget} words (this is critical - ${lengthGuidance})`,
    ``,
    `CULTURE FIT: ${cultureGuidance}`,
    ``,
    `PARAGRAPH STRUCTURE (YOU MUST FOLLOW THIS):`,
    `Opening paragraph: 100-120 words (4-5 sentences)`,
    `  - Hook the reader with genuine interest`,
    `  - State the position you're applying for`,
    `  - Brief mention of 1-2 top qualifications`,
    `  - Show you know about the company`,
    ``,
    `Body paragraph 1: 120-150 words (5-6 sentences)`,
    `  - Detailed example of most relevant experience`,
    `  - Specific accomplishments with metrics if available`,
    `  - Direct connection to job requirements`,
    `  - Technical skills or relevant expertise`,
    ``,
    `Body paragraph 2: 120-150 words (5-6 sentences)`,
    `  - Additional qualifications or complementary skills`,
    `  - Different aspect of your background`,
    `  - Team collaboration or leadership examples`,
    `  - Problem-solving or innovation examples`,
    ``,
    `Closing paragraph: 80-100 words (3-4 sentences)`,
    `  - Express enthusiasm for the opportunity`,
    `  - Reference company mission or values alignment`,
    `  - Call to action (mention availability for interview)`,
    `  - Professional thank you`,
    ``,
    `EXAMPLE LENGTH (FOLLOW THIS CLOSELY):`,
    `"I am writing to express my strong interest in the Senior Software Engineer position at TechCorp, as advertised on your careers page. With over five years of experience developing scalable web applications and a proven track record of delivering high-impact features, I am excited about the opportunity to contribute to your innovative team. Your company's commitment to cutting-edge technology and user-centric design aligns perfectly with my professional values and technical expertise. I am particularly drawn to TechCorp's recent expansion into cloud-native solutions, an area where I have extensive hands-on experience."`,
    ``,
    `This opening is exactly 100 words. Each of your paragraphs should be AT LEAST this length or longer.`,
    ``,
    `TEMPLATE STYLE: ${templateInstructions}`,
    ``,
    `STRUCTURE GUIDANCE: ${structureGuidance}`,
    ``,
    `TONE: ${toneStr}. ${focusStr}`,
    ``,
    `OUTPUT FORMAT: JSON with this exact structure:`,
    `{`,
    `  "sections": {`,
    `    "opening": "Well-developed opening paragraph (100-120 words, 4-5 sentences)",`,
    `    "body": [`,
    `      "First body paragraph (120-150 words, 5-6 sentences)",`,
    `      "Second body paragraph (120-150 words, 5-6 sentences)"`,
    `    ],`,
    `    "closing": "Closing paragraph (80-100 words, 3-4 sentences)"`,
    `  },`,
    `  "metadata": {`,
    `    "wordCount": 420,`,
    `    "tone": "${toneStr}",`,
    `    "paragraphCount": 4`,
    `  }`,
    `}`,
    ``,
    `--- CANDIDATE INFORMATION ---`,
    `Name: ${name}`,
    titleLine ? `Professional Title: ${titleLine}` : "",
    summary ? `Professional Summary: ${summary}` : "",
    ``,
    educationText ? `Education:\n${educationText}` : "",
    ``,
    certificationsText ? `Certifications:\n${certificationsText}` : "",
    ``,
    technicalSkills.length > 0
      ? `Technical Skills: ${technicalSkills.join(", ")}`
      : "",
    softSkills.length > 0 ? `Soft Skills: ${softSkills.join(", ")}` : "",
    ``,
    experienceText ? `Employment History:\n${experienceText}` : "",
    ``,
    projectsText ? `Notable Projects:\n${projectsText}` : "",
    ``,
    `--- TARGET POSITION ---`,
    `Role: ${title}`,
    `Company: ${company}`,
    description ? `Job Description:\n${description}` : "",
    companyContext,
    ``,
    `NOW WRITE THE COVER LETTER following these requirements:`,
    `1. ANALYZE the job description thoroughly and identify 3-5 key requirements`,
    `2. MATCH the candidate's experience to those specific requirements with concrete examples from their employment history`,
    `3. USE the candidate's actual education, skills, projects, certifications, and work history (do NOT invent)`,
    `4. INCORPORATE company research to show genuine interest and knowledge:`,
    `   - Reference the company's mission, values, or recent news if provided`,
    `   - Connect candidate's values and experience to the company's culture`,
    `   - Show understanding of the company's products/services and how candidate can contribute`,
    `   - Demonstrate that this is NOT a generic letter - it's tailored specifically to THIS company`,
    `5. APPLY the ${toneStr} tone and ${cultureStr} culture throughout`,
    `6. TARGET ${wordCountTarget} words - this is NOT optional`,
    `7. ENSURE each paragraph meets the minimum word count (Opening 100+, Body 120+ each, Closing 80+)`,
    `8. HIGHLIGHT relevant projects and certifications that align with the job requirements`,
    `9. USE specific technical skills from the candidate's profile that match the job description`,
    ``,
    `Remember: Create SUBSTANTIVE, DETAILED, COMPANY-SPECIFIC paragraphs. Generic or short content is unacceptable.`,
    ``,
    `IMPORTANT: Return ONLY the JSON object with no additional text before or after. Do not include explanations or markdown formatting.`,
  ]
    .filter(Boolean)
    .join("\n");
}
