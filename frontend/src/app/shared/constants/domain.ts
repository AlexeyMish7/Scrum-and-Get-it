/**
 * DOMAIN CONSTANTS MODULE
 * Centralized constants for domain entities across the application.
 *
 * Provides:
 * - Enums for job statuses, document types, AI artifacts, education, etc.
 * - Type-safe mappings between database values and display labels
 * - Option arrays for UI dropdowns and filters
 *
 * Usage:
 * ```ts
 * import { JOB_STATUSES, JOB_STATUS_OPTIONS } from "@shared/constants/domain";
 *
 * // Display label
 * const label = JOB_STATUSES["applied"]; // → "Applied"
 *
 * // Dropdown options
 * <Select options={JOB_STATUS_OPTIONS} />
 * ```
 */

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// JOB APPLICATION STATUSES (Pipeline Stages)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const JOB_STATUSES = {
  interested: "Interested",
  applied: "Applied",
  phone_screen: "Phone Screen",
  interview: "Interview",
  offer: "Offer",
  rejected: "Rejected",
} as const;

export type JobStatus = keyof typeof JOB_STATUSES;
export const JOB_STATUS_OPTIONS = Object.values(JOB_STATUSES);

/**
 * Get display label for a job status
 * @param status - Database enum value
 * @returns Display-friendly label
 */
export function formatJobStatus(status: string): string {
  const normalized = status.toLowerCase().replace(/\s+/g, "_") as JobStatus;
  return JOB_STATUSES[normalized] || status;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// DOCUMENT TYPES
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const DOCUMENT_TYPES = {
  resume: "Resume",
  cover_letter: "Cover Letter",
  portfolio: "Portfolio",
  other: "Other",
} as const;

export type DocumentType = keyof typeof DOCUMENT_TYPES;
export const DOCUMENT_TYPE_OPTIONS = Object.values(DOCUMENT_TYPES);

/**
 * Get display label for a document type
 * @param type - Database enum value
 * @returns Display-friendly label
 */
export function formatDocumentType(type: string): string {
  const normalized = type.toLowerCase() as DocumentType;
  return DOCUMENT_TYPES[normalized] || type;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// AI ARTIFACT KINDS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const ARTIFACT_KINDS = {
  resume: "Resume",
  cover_letter: "Cover Letter",
  skills_optimization: "Skills Optimization",
  company_research: "Company Research",
  match: "Job Match Analysis",
  gap_analysis: "Skills Gap Analysis",
} as const;

export type ArtifactKind = keyof typeof ARTIFACT_KINDS;
export const ARTIFACT_KIND_OPTIONS = Object.values(ARTIFACT_KINDS);

/**
 * Get display label for an AI artifact kind
 * @param kind - Database enum value
 * @returns Display-friendly label
 */
export function formatArtifactKind(kind: string): string {
  const normalized = kind.toLowerCase() as ArtifactKind;
  return ARTIFACT_KINDS[normalized] || kind;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// EDUCATION LEVELS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const EDUCATION_LEVELS = {
  high_school: "High School",
  associate: "Associate Degree",
  bachelor: "Bachelor's Degree",
  master: "Master's Degree",
  doctorate: "Doctorate",
  certification: "Professional Certification",
  bootcamp: "Bootcamp",
  other: "Other",
} as const;

export type EducationLevel = keyof typeof EDUCATION_LEVELS;
export const EDUCATION_LEVEL_OPTIONS = Object.values(EDUCATION_LEVELS);

/**
 * Get display label for an education level
 * @param level - Database enum value
 * @returns Display-friendly label
 */
export function formatEducationLevel(level: string): string {
  const normalized = level.toLowerCase().replace(/\s+/g, "_") as EducationLevel;
  return EDUCATION_LEVELS[normalized] || level;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ENROLLMENT STATUSES
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const ENROLLMENT_STATUSES = {
  not_enrolled: "Not Enrolled",
  currently_enrolled: "Currently Enrolled",
  graduated: "Graduated",
  withdrawn: "Withdrawn",
} as const;

export type EnrollmentStatus = keyof typeof ENROLLMENT_STATUSES;
export const ENROLLMENT_STATUS_OPTIONS = Object.values(ENROLLMENT_STATUSES);

/**
 * Get display label for an enrollment status
 * @param status - Database enum value
 * @returns Display-friendly label
 */
export function formatEnrollmentStatus(status: string): string {
  const normalized = status
    .toLowerCase()
    .replace(/\s+/g, "_") as EnrollmentStatus;
  return ENROLLMENT_STATUSES[normalized] || status;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// JOB TYPES (Employment Types)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const JOB_TYPES = {
  full_time: "Full-Time",
  part_time: "Part-Time",
  contract: "Contract",
  internship: "Internship",
  temporary: "Temporary",
  freelance: "Freelance",
} as const;

export type JobType = keyof typeof JOB_TYPES;
export const JOB_TYPE_OPTIONS = Object.values(JOB_TYPES);

/**
 * Get display label for a job type
 * @param type - Database enum value
 * @returns Display-friendly label
 */
export function formatJobType(type: string): string {
  const normalized = type.toLowerCase().replace(/[-\s]+/g, "_") as JobType;
  return JOB_TYPES[normalized] || type;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// INDUSTRIES (Common categories)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const INDUSTRIES = [
  "Technology",
  "Finance",
  "Healthcare",
  "Education",
  "Retail",
  "Manufacturing",
  "Consulting",
  "Marketing",
  "Government",
  "Non-Profit",
  "Entertainment",
  "Real Estate",
  "Other",
] as const;

export type Industry = (typeof INDUSTRIES)[number];
export const INDUSTRY_OPTIONS = [...INDUSTRIES];

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// EXPERIENCE LEVELS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const EXPERIENCE_LEVELS = {
  entry: "Entry Level",
  mid: "Mid Level",
  senior: "Senior Level",
  lead: "Lead",
  principal: "Principal",
  executive: "Executive",
} as const;

export type ExperienceLevel = keyof typeof EXPERIENCE_LEVELS;
export const EXPERIENCE_LEVEL_OPTIONS = Object.values(EXPERIENCE_LEVELS);

/**
 * Get display label for an experience level
 * @param level - Database enum value
 * @returns Display-friendly label
 */
export function formatExperienceLevel(level: string): string {
  const normalized = level.toLowerCase() as ExperienceLevel;
  return EXPERIENCE_LEVELS[normalized] || level;
}
