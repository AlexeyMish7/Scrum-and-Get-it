/**
 * Resume Validation Utility
 *
 * WHAT: Analyzes resume drafts to calculate health scores and identify issues
 * WHY: Help users create effective resumes by highlighting missing sections, length issues, and quality concerns
 *
 * Outputs:
 * - Health score (0-100)
 * - Character and word counts
 * - Page length estimation
 * - Missing section warnings
 * - Quality recommendations
 */

import type { ResumeDraft } from "@workspaces/ai/hooks/useResumeDraftsV2";

export interface ValidationIssue {
  severity: "error" | "warning" | "info";
  category: "length" | "content" | "structure" | "quality";
  message: string;
  section?: string;
}

export interface ValidationResult {
  healthScore: number; // 0-100
  issues: ValidationIssue[];
  stats: {
    totalCharacters: number;
    totalWords: number;
    estimatedPages: number;
    sectionsCount: number;
    missingSections: string[];
  };
  recommendations: string[];
}

// Constants for validation thresholds
const IDEAL_RESUME_PAGES = 1;
const MAX_RECOMMENDED_PAGES = 2;
const MIN_SUMMARY_CHARS = 100;
const MAX_SUMMARY_CHARS = 500;
const MIN_EXPERIENCE_BULLETS = 3;
const MAX_EXPERIENCE_BULLETS = 6;
const CHARS_PER_PAGE_ESTIMATE = 3000; // Rough estimate for standard resume formatting

/**
 * Validate a resume draft and return comprehensive analysis
 *
 * Inputs:
 * - draft: ResumeDraft to analyze
 *
 * Outputs:
 * - ValidationResult with health score, issues, stats, and recommendations
 */
export function validateResume(
  draft: ResumeDraft,
  userProfile?: { full_name?: string; email?: string; phone?: string }
): ValidationResult {
  const issues: ValidationIssue[] = [];
  const recommendations: string[] = [];
  const missingSections: string[] = [];

  // Calculate statistics
  const stats = calculateResumeStats(draft);

  // Check for missing critical sections
  checkMissingSections(draft, missingSections, issues);

  // Validate summary section
  validateSummary(draft, issues, recommendations);

  // Validate skills section
  validateSkills(draft, issues, recommendations);

  // Validate experience section
  validateExperience(draft, issues, recommendations);

  // Validate education section
  validateEducation(draft, issues);

  // Validate contact information (if provided via userProfile)
  validateContactInfo(userProfile, issues, recommendations);

  // Grammar, spell and tone heuristics (lightweight)
  validateGrammarAndTone(draft, issues, recommendations);

  // Validate resume length
  validateLength(stats, issues, recommendations);

  // Calculate overall health score
  const healthScore = calculateHealthScore(draft, issues, stats);

  return {
    healthScore,
    issues,
    stats: { ...stats, missingSections },
    recommendations,
  };
}

/**
 * Validate contact information using basic checks on email and phone
 */
function validateContactInfo(
  userProfile: { full_name?: string; email?: string; phone?: string } | undefined,
  issues: ValidationIssue[],
  recommendations: string[]
) {
  if (!userProfile) {
    issues.push({
      severity: "info",
      category: "content",
      message: "No contact info available from profile. Add email and phone in your profile for exported resumes.",
    });
    recommendations.push("Provide a professional email and phone number in your profile to include in exported resumes.");
    return;
  }

  // Email validation
  if (!userProfile.email || !/^\S+@\S+\.\S+$/.test(userProfile.email)) {
    issues.push({
      severity: "warning",
      category: "content",
      message: "Missing or invalid email address",
    });
    recommendations.push("Add a valid email address (e.g., name@example.com) to your profile");
  }

  // Phone validation (very permissive)
  if (!userProfile.phone || !/[0-9]{7,15}/.test(userProfile.phone.replace(/[^0-9]/g, ""))) {
    issues.push({
      severity: "info",
      category: "content",
      message: "Phone number missing or appears invalid",
    });
    recommendations.push("Add a phone number to your profile if you want it included on the resume");
  }
}

/**
 * Lightweight grammar/spell/tone heuristics
 * - Detect common typos
 * - Detect likely passive voice patterns
 * - Detect first-person pronouns used in resume text
 */
function validateGrammarAndTone(
  draft: ResumeDraft,
  issues: ValidationIssue[],
  recommendations: string[]
) {
  const textChunks: string[] = [];
  if (draft.content.summary) textChunks.push(draft.content.summary);
  if (draft.content.experience) {
    draft.content.experience.forEach((e) => {
      e.bullets.forEach((b) => textChunks.push(b));
    });
  }

  const fullText = textChunks.join(" \n ").toLowerCase();

  // Common typos
  const typos = [" teh ", " recieve ", " occured ", " seperat ", " advoid "];
  typos.forEach((t) => {
    if (fullText.includes(t)) {
      issues.push({
        severity: "info",
        category: "quality",
        message: `Possible typo detected: '${t.trim()}'`,
      });
      recommendations.push("Run a spell-checker or manually review highlighted typos");
    }
  });

  // Passive voice heuristic: look for 'was|were|is|are' + past participle-ish words
  const passivePattern = /\b(was|were|is|are|be|been|being)\b\s+\w+ed\b/;
  if (passivePattern.test(fullText)) {
    issues.push({
      severity: "info",
      category: "quality",
      message: "Possible passive voice detected — prefer active verbs (e.g., 'Led', 'Designed')",
    });
    recommendations.push("Use active verbs and quantify achievements where possible");
  }

  // First-person pronouns (resume should be written without 'I' statements)
  const firstPersonPattern = /\b(i|me|my|mine)\b/;
  if (firstPersonPattern.test(fullText)) {
    issues.push({
      severity: "info",
      category: "quality",
      message: "First-person pronouns detected — resumes typically avoid 'I' or 'my'",
    });
    recommendations.push("Rewrite sentences to remove first-person pronouns (e.g., 'Led' instead of 'I led')");
  }
}

/**
 * Calculate basic statistics about the resume
 */
function calculateResumeStats(draft: ResumeDraft) {
  let totalCharacters = 0;
  let totalWords = 0;
  let sectionsCount = 0;

  const content = draft.content;

  // Summary
  if (content.summary) {
    sectionsCount++;
    totalCharacters += content.summary.length;
    totalWords += content.summary.split(/\s+/).filter(Boolean).length;
  }

  // Skills
  if (content.skills && content.skills.length > 0) {
    sectionsCount++;
    const skillsText = content.skills.join(", ");
    totalCharacters += skillsText.length;
    totalWords += content.skills.length;
  }

  // Experience
  if (content.experience && content.experience.length > 0) {
    sectionsCount++;
    content.experience.forEach((exp) => {
      totalCharacters += (exp.role || "").length;
      totalCharacters += (exp.company || "").length;
      totalCharacters += (exp.dates || "").length;
      exp.bullets.forEach((bullet) => {
        totalCharacters += bullet.length;
        totalWords += bullet.split(/\s+/).filter(Boolean).length;
      });
    });
  }

  // Education
  if (content.education && content.education.length > 0) {
    sectionsCount++;
    content.education.forEach((edu) => {
      totalCharacters += (edu.institution || "").length;
      totalCharacters += (edu.degree || "").length;
      totalCharacters += (edu.graduation_date || "").length;
      if (edu.details) {
        edu.details.forEach((detail) => {
          totalCharacters += detail.length;
          totalWords += detail.split(/\s+/).filter(Boolean).length;
        });
      }
    });
  }

  // Projects
  if (content.projects && content.projects.length > 0) {
    sectionsCount++;
    content.projects.forEach((proj) => {
      totalCharacters += (proj.name || "").length;
      totalCharacters += (proj.role || "").length;
      if (proj.bullets) {
        proj.bullets.forEach((bullet) => {
          totalCharacters += bullet.length;
          totalWords += bullet.split(/\s+/).filter(Boolean).length;
        });
      }
    });
  }

  const estimatedPages = Math.max(
    1,
    Math.ceil(totalCharacters / CHARS_PER_PAGE_ESTIMATE)
  );

  return {
    totalCharacters,
    totalWords,
    estimatedPages,
    sectionsCount,
  };
}

/**
 * Check for missing critical sections
 */
function checkMissingSections(
  draft: ResumeDraft,
  missingSections: string[],
  issues: ValidationIssue[]
) {
  const content = draft.content;

  if (!content.summary || content.summary.trim().length === 0) {
    missingSections.push("Professional Summary");
    issues.push({
      severity: "warning",
      category: "content",
      message: "Missing professional summary",
      section: "summary",
    });
  }

  if (!content.skills || content.skills.length === 0) {
    missingSections.push("Skills");
    issues.push({
      severity: "warning",
      category: "content",
      message: "No skills listed",
      section: "skills",
    });
  }

  if (!content.experience || content.experience.length === 0) {
    missingSections.push("Work Experience");
    issues.push({
      severity: "error",
      category: "content",
      message: "Missing work experience section",
      section: "experience",
    });
  }

  if (!content.education || content.education.length === 0) {
    missingSections.push("Education");
    issues.push({
      severity: "warning",
      category: "content",
      message: "No education listed",
      section: "education",
    });
  }
}

/**
 * Validate summary section
 */
function validateSummary(
  draft: ResumeDraft,
  issues: ValidationIssue[],
  recommendations: string[]
) {
  const summary = draft.content.summary;
  if (!summary) return;

  if (summary.length < MIN_SUMMARY_CHARS) {
    issues.push({
      severity: "warning",
      category: "quality",
      message: `Summary is too short (${summary.length} chars). Aim for ${MIN_SUMMARY_CHARS}-${MAX_SUMMARY_CHARS} characters.`,
      section: "summary",
    });
    recommendations.push(
      "Expand your professional summary to highlight key achievements and value proposition"
    );
  } else if (summary.length > MAX_SUMMARY_CHARS) {
    issues.push({
      severity: "info",
      category: "quality",
      message: `Summary is lengthy (${summary.length} chars). Consider condensing to ${MIN_SUMMARY_CHARS}-${MAX_SUMMARY_CHARS} characters.`,
      section: "summary",
    });
    recommendations.push(
      "Condense your summary to focus on the most impactful points"
    );
  }
}

/**
 * Validate skills section
 */
function validateSkills(
  draft: ResumeDraft,
  issues: ValidationIssue[],
  recommendations: string[]
) {
  const skills = draft.content.skills;
  if (!skills || skills.length === 0) return;

  if (skills.length < 5) {
    issues.push({
      severity: "info",
      category: "quality",
      message: `Only ${skills.length} skills listed. Consider adding more relevant skills.`,
      section: "skills",
    });
    recommendations.push(
      "Add more skills to demonstrate breadth of expertise (aim for 8-15 skills)"
    );
  } else if (skills.length > 20) {
    issues.push({
      severity: "info",
      category: "quality",
      message: `Many skills listed (${skills.length}). Focus on most relevant ones.`,
      section: "skills",
    });
    recommendations.push(
      "Prioritize quality over quantity - focus on skills most relevant to your target role"
    );
  }
}

/**
 * Validate experience section
 */
function validateExperience(
  draft: ResumeDraft,
  issues: ValidationIssue[],
  recommendations: string[]
) {
  const experience = draft.content.experience;
  if (!experience || experience.length === 0) return;

  experience.forEach((exp) => {
    const bulletCount = exp.bullets.length;

    if (bulletCount < MIN_EXPERIENCE_BULLETS) {
      issues.push({
        severity: "warning",
        category: "quality",
        message: `${exp.role}: Only ${bulletCount} bullet points. Add ${
          MIN_EXPERIENCE_BULLETS - bulletCount
        } more to showcase achievements.`,
        section: "experience",
      });
    } else if (bulletCount > MAX_EXPERIENCE_BULLETS) {
      issues.push({
        severity: "info",
        category: "quality",
        message: `${exp.role}: ${bulletCount} bullet points may be too many. Focus on top ${MAX_EXPERIENCE_BULLETS} achievements.`,
        section: "experience",
      });
    }

    // Check for weak bullets (too short)
    exp.bullets.forEach((bullet, bidx) => {
      if (bullet.length < 30) {
        issues.push({
          severity: "info",
          category: "quality",
          message: `${exp.role}: Bullet ${
            bidx + 1
          } is very brief. Add more detail and impact.`,
          section: "experience",
        });
      }
    });
  });

  if (experience.length === 0) {
    recommendations.push(
      "Add work experience with 3-5 achievement-focused bullet points per role"
    );
  }
}

/**
 * Validate education section
 */
function validateEducation(draft: ResumeDraft, issues: ValidationIssue[]) {
  const education = draft.content.education;
  if (!education || education.length === 0) return;

  education.forEach((edu) => {
    if (!edu.degree || !edu.institution) {
      issues.push({
        severity: "warning",
        category: "content",
        message: "Education entry missing degree or institution name",
        section: "education",
      });
    }
  });
}

/**
 * Validate overall resume length
 */
function validateLength(
  stats: {
    totalCharacters: number;
    totalWords: number;
    estimatedPages: number;
    sectionsCount: number;
  },
  issues: ValidationIssue[],
  recommendations: string[]
) {
  if (stats.estimatedPages > MAX_RECOMMENDED_PAGES) {
    issues.push({
      severity: "warning",
      category: "length",
      message: `Resume is approximately ${stats.estimatedPages} pages. Consider condensing to ${MAX_RECOMMENDED_PAGES} pages maximum.`,
    });
    recommendations.push(
      "Shorten bullet points, remove older or less relevant experience, and focus on recent achievements"
    );
  } else if (
    stats.estimatedPages < IDEAL_RESUME_PAGES &&
    stats.sectionsCount >= 3
  ) {
    issues.push({
      severity: "info",
      category: "length",
      message: `Resume seems brief (approx. ${stats.estimatedPages} page). You may have room to expand key sections.`,
    });
    recommendations.push(
      "Expand experience bullets with quantified achievements and additional relevant details"
    );
  }
}

/**
 * Calculate overall health score based on issues and completeness
 *
 * Scoring:
 * - Start at 100
 * - Deduct points for errors (15 each), warnings (10 each), info (3 each)
 * - Bonus points for completeness (sections present)
 * - Minimum score: 0, Maximum: 100
 */
function calculateHealthScore(
  draft: ResumeDraft,
  issues: ValidationIssue[],
  stats: { sectionsCount: number; estimatedPages: number }
): number {
  let score = 100;

  // Deduct for issues
  issues.forEach((issue) => {
    if (issue.severity === "error") score -= 15;
    else if (issue.severity === "warning") score -= 10;
    else if (issue.severity === "info") score -= 3;
  });

  // Bonus for having all key sections (max +10)
  const content = draft.content;
  if (content.summary) score += 2;
  if (content.skills && content.skills.length >= 5) score += 2;
  if (content.experience && content.experience.length > 0) score += 3;
  if (content.education && content.education.length > 0) score += 2;
  if (content.projects && content.projects.length > 0) score += 1;

  // Penalty for too short or too long
  if (stats.estimatedPages < 1) score -= 10;
  if (stats.estimatedPages > 3) score -= 15;

  // Clamp to 0-100
  return Math.max(0, Math.min(100, score));
}

/**
 * Get a color for the health score
 */
export function getHealthScoreColor(score: number): string {
  if (score >= 80) return "success";
  if (score >= 60) return "warning";
  return "error";
}

/**
 * Get a label for the health score
 */
export function getHealthScoreLabel(score: number): string {
  if (score >= 90) return "Excellent";
  if (score >= 80) return "Good";
  if (score >= 70) return "Fair";
  if (score >= 60) return "Needs Work";
  return "Poor";
}
