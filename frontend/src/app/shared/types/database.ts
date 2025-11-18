/**
 * DATABASE TYPE DEFINITIONS
 * Auto-generated from 2025-11-17_ai_workspace_schema_redesign.sql
 *
 * Complete type definitions for all 18 tables in the database.
 * These types match the exact schema structure for type-safe CRUD operations.
 */

// =====================================================================
// ENUM TYPES
// =====================================================================

export type ExperienceLevel = "entry" | "mid" | "senior" | "executive";
export type ProficiencyLevel =
  | "beginner"
  | "intermediate"
  | "advanced"
  | "expert";
export type ProjectStatus = "planned" | "ongoing" | "completed";
export type VerificationStatus =
  | "unverified"
  | "pending"
  | "verified"
  | "rejected";
export type EducationLevel =
  | "high_school"
  | "associate"
  | "bachelor"
  | "master"
  | "phd"
  | "other";

// =====================================================================
// PROFILE SYSTEM (6 tables)
// =====================================================================

export interface ProfileRow {
  id: string; // uuid, FK to auth.users
  first_name: string;
  last_name: string;
  full_name: string; // GENERATED ALWAYS
  email: string;
  phone: string | null;
  professional_title: string | null;
  summary: string | null;
  experience_level: ExperienceLevel | null;
  industry: string | null;
  city: string | null;
  state: string | null;
  metadata: Record<string, unknown>;
  created_at: string; // timestamptz
  updated_at: string; // timestamptz
}

export interface EmploymentRow {
  id: string; // uuid
  user_id: string; // uuid
  job_title: string;
  company_name: string;
  location: string | null;
  start_date: string; // date
  end_date: string | null; // date
  current_position: boolean;
  job_description: string | null;
  achievements: string[]; // text[]
  metadata: Record<string, unknown>;
  created_at: string; // timestamptz
  updated_at: string; // timestamptz
}

export interface EducationRow {
  id: string; // uuid
  user_id: string; // uuid
  institution_name: string;
  degree_type: string | null;
  field_of_study: string | null;
  education_level: EducationLevel | null;
  start_date: string; // date
  graduation_date: string | null; // date
  enrollment_status: "enrolled" | "graduated" | "transferred" | "dropped";
  gpa: number | null; // numeric
  honors: string | null;
  metadata: Record<string, unknown>;
  created_at: string; // timestamptz
  updated_at: string; // timestamptz
}

export interface SkillRow {
  id: string; // uuid
  user_id: string; // uuid
  skill_name: string;
  proficiency_level: ProficiencyLevel;
  skill_category:
    | "Technical"
    | "Soft"
    | "Language"
    | "Tool"
    | "Framework"
    | "Other";
  years_of_experience: number | null; // numeric
  last_used_date: string | null; // date
  metadata: Record<string, unknown>;
  created_at: string; // timestamptz
  updated_at: string; // timestamptz
}

export interface CertificationRow {
  id: string; // uuid
  user_id: string; // uuid
  name: string;
  issuing_org: string | null;
  category: string | null;
  certification_id: string | null;
  date_earned: string | null; // date
  expiration_date: string | null; // date
  does_not_expire: boolean;
  verification_status: VerificationStatus;
  verification_url: string | null;
  media_path: string | null;
  metadata: Record<string, unknown>;
  created_at: string; // timestamptz
  updated_at: string; // timestamptz
}

export interface ProjectRow {
  id: string; // uuid
  user_id: string; // uuid
  proj_name: string;
  proj_description: string | null;
  role: string | null;
  start_date: string; // date
  end_date: string | null; // date
  status: ProjectStatus;
  tech_and_skills: string[]; // text[]
  industry_proj_type: string | null;
  team_size: number | null; // integer
  team_details: string | null;
  project_url: string | null;
  media_path: string | null;
  proj_outcomes: string | null;
  metadata: Record<string, unknown>;
  created_at: string; // timestamptz
  updated_at: string; // timestamptz
}

// =====================================================================
// COMPANY SYSTEM (2 tables)
// =====================================================================

export interface CompanyRow {
  id: string; // uuid
  name: string;
  domain: string | null;
  description: string | null;
  industry: string | null;
  company_size:
    | "1-10"
    | "11-50"
    | "51-200"
    | "201-500"
    | "501-1000"
    | "1001-5000"
    | "5001-10000"
    | "10000+"
    | null;
  founded_year: number | null; // integer
  headquarters_location: string | null;
  website: string | null;
  linkedin_url: string | null;
  careers_page: string | null;
  company_data: {
    locations?: string[];
    departments?: string[];
    benefits?: string[];
    techStack?: string[];
    fundingInfo?: Record<string, unknown>;
    recentNews?: Array<Record<string, unknown>>;
  };
  research_cache: Record<string, unknown>;
  research_last_updated: string | null; // timestamptz
  logo_url: string | null;
  is_verified: boolean;
  created_at: string; // timestamptz
  updated_at: string; // timestamptz
}

export interface UserCompanyNoteRow {
  id: string; // uuid
  user_id: string; // uuid
  company_id: string; // uuid
  personal_notes: string | null;
  pros: string | null;
  cons: string | null;
  culture_notes: string | null;
  interview_tips: string | null;
  contacts: Array<Record<string, unknown>>; // jsonb array
  application_count: number;
  is_favorite: boolean;
  is_blacklisted: boolean;
  created_at: string; // timestamptz
  updated_at: string; // timestamptz
}

// =====================================================================
// JOB PIPELINE (2 tables)
// =====================================================================

export interface JobRow {
  id: number; // bigint GENERATED ALWAYS AS IDENTITY
  user_id: string; // uuid
  company_id: string | null; // uuid
  job_title: string;
  company_name: string | null;
  job_description: string | null;
  industry: string | null;
  job_type:
    | "full-time"
    | "part-time"
    | "contract"
    | "internship"
    | "freelance"
    | null;
  experience_level:
    | "entry"
    | "mid"
    | "senior"
    | "executive"
    | "internship"
    | null;
  street_address: string | null;
  city_name: string | null;
  state_code: string | null;
  zipcode: string | null;
  remote_type: "onsite" | "remote" | "hybrid" | null;
  start_salary_range: number | null; // bigint
  end_salary_range: number | null; // bigint
  benefits: string[]; // text[]
  job_link: string | null;
  posted_date: string | null; // date
  application_deadline: string | null; // date
  source:
    | "manual"
    | "imported-url"
    | "linkedin"
    | "indeed"
    | "glassdoor"
    | "company-site"
    | "referral"
    | "recruiter"
    | null;
  required_skills: string[]; // text[]
  preferred_skills: string[]; // text[]
  job_status:
    | "Interested"
    | "Applied"
    | "Phone Screen"
    | "Interview"
    | "Offer"
    | "Rejected"
    | "Accepted"
    | "Declined";
  status_changed_at: string; // timestamptz
  match_score: number | null; // integer 0-100
  is_favorite: boolean;
  is_archived: boolean;
  archive_reason:
    | "filled"
    | "expired"
    | "not-interested"
    | "rejected"
    | "accepted-other"
    | "other"
    | null;
  created_at: string; // timestamptz
  updated_at: string; // timestamptz
}

export interface JobNoteRow {
  id: string; // uuid
  user_id: string; // uuid
  job_id: number; // bigint
  recruiter_name: string | null;
  recruiter_email: string | null;
  recruiter_phone: string | null;
  hiring_manager_name: string | null;
  hiring_manager_email: string | null;
  hiring_manager_phone: string | null;
  personal_notes: string | null;
  red_flags: string | null;
  pros: string | null;
  cons: string | null;
  interview_schedule: Array<Record<string, unknown>>; // jsonb array
  follow_ups: Array<Record<string, unknown>>; // jsonb array
  questions_to_ask: string[]; // text[]
  interview_notes: string | null;
  interview_feedback: string | null;
  salary_negotiation_notes: string | null;
  application_history: Array<Record<string, unknown>>; // jsonb array
  rating: number | null; // integer 1-5
  offer_details: Record<string, unknown> | null; // jsonb
  rejection_reason: string | null;
  rejection_date: string | null; // date
  created_at: string; // timestamptz
  updated_at: string; // timestamptz
}

// =====================================================================
// TEMPLATE SYSTEM (2 tables)
// =====================================================================

export interface TemplateRow {
  id: string; // uuid
  user_id: string | null; // uuid (NULL for system templates)
  name: string;
  category: "resume" | "cover-letter";
  subtype:
    | "chronological"
    | "functional"
    | "hybrid"
    | "creative"
    | "academic"
    | "executive"
    | "simple";
  layout: {
    columns?: number;
    pageSize?: string;
    margins?: { top: number; right: number; bottom: number; left: number };
    sectionOrder?: string[];
    headerFooter?: { showHeader: boolean; showFooter: boolean };
  };
  schema: {
    requiredSections?: string[];
    optionalSections?: string[];
    customSections?: boolean;
    maxSections?: number | null;
  };
  features: {
    atsOptimized?: boolean;
    customizable?: boolean;
    skillsHighlight?: boolean;
    portfolioSupport?: boolean;
    photoSupport?: boolean;
  };
  metadata: {
    description?: string;
    tags?: string[];
    industryFocus?: string[];
    experienceLevel?: string[];
  };
  version: number;
  author: "system" | "user";
  is_default: boolean;
  is_public: boolean;
  created_at: string; // timestamptz
  updated_at: string; // timestamptz
}

export interface ThemeRow {
  id: string; // uuid
  user_id: string | null; // uuid (NULL for system themes)
  name: string;
  category:
    | "professional"
    | "creative"
    | "modern"
    | "classic"
    | "minimal"
    | null;
  colors: {
    primary?: string;
    secondary?: string;
    accent?: string;
    text?: string;
    textSecondary?: string;
    background?: string;
    surface?: string;
    border?: string;
  };
  typography: {
    fontFamily?: { heading: string; body: string; mono: string };
    fontSize?: Record<string, number>;
    fontWeight?: Record<string, number>;
    lineHeight?: Record<string, number>;
  };
  spacing: {
    section?: number;
    subsection?: number;
    item?: number;
    compact?: number;
  };
  effects: {
    borderRadius?: number;
    dividerStyle?: string;
    dividerWidth?: number;
    shadowEnabled?: boolean;
  };
  metadata: {
    description?: string;
    tags?: string[];
    previewImage?: string | null;
  };
  author: "system" | "user";
  is_default: boolean;
  is_public: boolean;
  created_at: string; // timestamptz
  updated_at: string; // timestamptz
}

// =====================================================================
// DOCUMENT MANAGEMENT (2 tables)
// =====================================================================

export interface DocumentRow {
  id: string; // uuid
  user_id: string; // uuid
  type: "resume" | "cover-letter";
  status: "draft" | "final" | "archived";
  name: string;
  description: string | null;
  template_id: string; // uuid
  theme_id: string; // uuid
  template_overrides: Record<string, unknown>;
  theme_overrides: Record<string, unknown>;
  content: Record<string, unknown>; // Full resume or cover letter content
  current_version_id: string | null; // uuid
  job_id: number | null; // bigint
  target_role: string | null;
  target_company: string | null;
  target_industry: string | null;
  context_notes: string | null;
  tags: string[]; // text[]
  folder: string | null;
  color: string | null;
  rating: number | null; // integer 1-5
  user_notes: string | null;
  total_versions: number;
  total_edits: number;
  times_exported: number;
  times_used: number;
  word_count: number;
  is_default: boolean;
  is_pinned: boolean;
  is_archived: boolean;
  created_at: string; // timestamptz
  last_edited_at: string; // timestamptz
  last_generated_at: string | null; // timestamptz
}

export interface DocumentVersionRow {
  id: string; // uuid
  document_id: string; // uuid
  user_id: string; // uuid
  version_number: number;
  content: Record<string, unknown>; // Immutable snapshot
  template_id: string; // uuid
  theme_id: string; // uuid
  template_overrides: Record<string, unknown>;
  theme_overrides: Record<string, unknown>;
  job_id: number | null; // bigint
  generation_session_id: string | null; // uuid
  name: string;
  description: string | null;
  tags: string[]; // text[]
  color: string | null;
  notes: string | null;
  change_type:
    | "ai-generated"
    | "manual-edit"
    | "template-change"
    | "theme-change"
    | "merge"
    | "restore"
    | "import";
  changed_sections: string[]; // text[]
  change_summary: string | null;
  parent_version_id: string | null; // uuid
  branch_name: string | null;
  merge_source_id: string | null; // uuid
  word_count: number;
  character_count: number;
  ats_score: number | null; // integer 0-100
  status: "active" | "archived" | "deleted";
  is_pinned: boolean;
  is_archived: boolean;
  created_at: string; // timestamptz
  created_by: string; // uuid
}

// =====================================================================
// AI WORKFLOW (1 table)
// =====================================================================

export interface GenerationSessionRow {
  id: string; // uuid
  user_id: string; // uuid
  generation_type: "resume" | "cover-letter";
  status: "in-progress" | "completed" | "failed" | "cancelled";
  template_id: string | null; // uuid
  theme_id: string | null; // uuid
  job_id: number | null; // bigint
  options: {
    tone?: string;
    style?: string;
    length?: string;
    focusAreas?: string[];
    customInstructions?: string | null;
  };
  model: string | null;
  prompt_template: string | null;
  prompt_variables: Record<string, unknown>;
  result_version_id: string | null; // uuid
  generated_content: Record<string, unknown> | null; // Raw AI output
  error_message: string | null;
  error_details: Record<string, unknown> | null;
  tokens_used: number | null;
  generation_time_ms: number | null;
  cost_cents: number | null;
  started_at: string; // timestamptz
  completed_at: string | null; // timestamptz
  user_rating: number | null; // integer 1-5
  user_feedback: string | null;
}

// =====================================================================
// ANALYTICS & EXPORT (2 tables)
// =====================================================================

export interface ExportHistoryRow {
  id: string; // uuid
  user_id: string; // uuid
  document_id: string; // uuid
  version_id: string; // uuid
  format: "pdf" | "docx" | "html" | "txt" | "json";
  file_name: string;
  file_size_bytes: number | null;
  storage_path: string | null;
  storage_url: string | null;
  export_options: {
    includeHeader?: boolean;
    includeFooter?: boolean;
    pageNumbers?: boolean;
    watermark?: string | null;
  };
  status: "completed" | "failed";
  error_message: string | null;
  created_at: string; // timestamptz
  expires_at: string | null; // timestamptz
  download_count: number;
  last_downloaded_at: string | null; // timestamptz
}

export interface AnalyticsCacheRow {
  id: string; // uuid
  user_id: string; // uuid
  analytics_type:
    | "document-match-score"
    | "skills-gap"
    | "company-research"
    | "interview-prep"
    | "salary-research"
    | "ats-analysis";
  document_id: string | null; // uuid
  job_id: number | null; // bigint
  company_name: string | null;
  data: Record<string, unknown>;
  match_score: number | null; // integer 0-100
  ats_score: number | null; // integer 0-100
  metadata: {
    source?: string;
    model?: string | null;
    confidence?: number | null;
  };
  generated_at: string; // timestamptz
  expires_at: string; // timestamptz
  last_accessed_at: string; // timestamptz
  access_count: number;
  created_at: string; // timestamptz
  updated_at: string; // timestamptz
}

// =====================================================================
// RELATIONSHIPS (1 table)
// =====================================================================

export interface DocumentJobRow {
  id: string; // uuid
  document_id: string; // uuid
  version_id: string | null; // uuid
  job_id: number; // bigint
  user_id: string; // uuid
  status: "planned" | "submitted" | "interview" | "offer" | "rejected";
  submitted_at: string | null; // timestamptz
  response_received_at: string | null; // timestamptz
  outcome: string | null;
  notes: string | null;
  created_at: string; // timestamptz
  updated_at: string; // timestamptz
}

// =====================================================================
// HELPER TYPES FOR INSERT/UPDATE OPERATIONS
// =====================================================================

// Omit auto-generated and timestamp fields for inserts
export type ProfileInsert = Omit<
  ProfileRow,
  "id" | "full_name" | "created_at" | "updated_at"
>;
export type EmploymentInsert = Omit<
  EmploymentRow,
  "id" | "created_at" | "updated_at"
>;
export type EducationInsert = Omit<
  EducationRow,
  "id" | "created_at" | "updated_at"
>;
export type SkillInsert = Omit<SkillRow, "id" | "created_at" | "updated_at">;
export type CertificationInsert = Omit<
  CertificationRow,
  "id" | "created_at" | "updated_at"
>;
export type ProjectInsert = Omit<
  ProjectRow,
  "id" | "created_at" | "updated_at"
>;
export type CompanyInsert = Omit<
  CompanyRow,
  "id" | "created_at" | "updated_at"
>;
export type UserCompanyNoteInsert = Omit<
  UserCompanyNoteRow,
  "id" | "created_at" | "updated_at"
>;
export type JobInsert = Omit<JobRow, "id" | "created_at" | "updated_at">;
export type JobNoteInsert = Omit<
  JobNoteRow,
  "id" | "created_at" | "updated_at"
>;
export type TemplateInsert = Omit<
  TemplateRow,
  "id" | "created_at" | "updated_at"
>;
export type ThemeInsert = Omit<ThemeRow, "id" | "created_at" | "updated_at">;
export type DocumentInsert = Omit<
  DocumentRow,
  "id" | "created_at" | "last_edited_at" | "last_generated_at"
>;
export type DocumentVersionInsert = Omit<
  DocumentVersionRow,
  "id" | "created_at"
>;
export type GenerationSessionInsert = Omit<
  GenerationSessionRow,
  "id" | "started_at" | "completed_at"
>;
export type ExportHistoryInsert = Omit<ExportHistoryRow, "id" | "created_at">;
export type AnalyticsCacheInsert = Omit<
  AnalyticsCacheRow,
  "id" | "created_at" | "updated_at"
>;
export type DocumentJobInsert = Omit<
  DocumentJobRow,
  "id" | "created_at" | "updated_at"
>;

// Partial types for updates (all fields optional except user_id)
export type ProfileUpdate = Partial<
  Omit<ProfileRow, "id" | "full_name" | "created_at" | "updated_at">
>;
export type EmploymentUpdate = Partial<
  Omit<EmploymentRow, "id" | "user_id" | "created_at" | "updated_at">
>;
export type EducationUpdate = Partial<
  Omit<EducationRow, "id" | "user_id" | "created_at" | "updated_at">
>;
export type SkillUpdate = Partial<
  Omit<SkillRow, "id" | "user_id" | "created_at" | "updated_at">
>;
export type CertificationUpdate = Partial<
  Omit<CertificationRow, "id" | "user_id" | "created_at" | "updated_at">
>;
export type ProjectUpdate = Partial<
  Omit<ProjectRow, "id" | "user_id" | "created_at" | "updated_at">
>;
export type CompanyUpdate = Partial<
  Omit<CompanyRow, "id" | "created_at" | "updated_at">
>;
export type UserCompanyNoteUpdate = Partial<
  Omit<
    UserCompanyNoteRow,
    "id" | "user_id" | "company_id" | "created_at" | "updated_at"
  >
>;
export type JobUpdate = Partial<
  Omit<JobRow, "id" | "user_id" | "created_at" | "updated_at">
>;
export type JobNoteUpdate = Partial<
  Omit<JobNoteRow, "id" | "user_id" | "job_id" | "created_at" | "updated_at">
>;
export type TemplateUpdate = Partial<
  Omit<TemplateRow, "id" | "user_id" | "created_at" | "updated_at">
>;
export type ThemeUpdate = Partial<
  Omit<ThemeRow, "id" | "user_id" | "created_at" | "updated_at">
>;
export type DocumentUpdate = Partial<
  Omit<
    DocumentRow,
    "id" | "user_id" | "created_at" | "last_edited_at" | "last_generated_at"
  >
>;
export type DocumentVersionUpdate = Partial<
  Omit<DocumentVersionRow, "id" | "document_id" | "user_id" | "created_at">
>;
export type GenerationSessionUpdate = Partial<
  Omit<GenerationSessionRow, "id" | "user_id" | "started_at">
>;
export type ExportHistoryUpdate = Partial<
  Omit<ExportHistoryRow, "id" | "user_id" | "created_at">
>;
export type AnalyticsCacheUpdate = Partial<
  Omit<AnalyticsCacheRow, "id" | "user_id" | "created_at" | "updated_at">
>;
export type DocumentJobUpdate = Partial<
  Omit<
    DocumentJobRow,
    "id" | "document_id" | "job_id" | "user_id" | "created_at" | "updated_at"
  >
>;

// Legacy type exports for backward compatibility
export interface UserOwnedRow {
  user_id: string;
  created_at: string;
  updated_at: string;
}

// Legacy AI artifact type (replaced by new document system)
export interface AIArtifactRow extends UserOwnedRow {
  id: string;
  job_id: number | null;
  kind:
    | "resume"
    | "cover_letter"
    | "skills_optimization"
    | "company_research"
    | "match"
    | "gap_analysis";
  title: string | null;
  prompt: string | null;
  model: string | null;
  content: Record<string, unknown>;
  metadata: Record<string, unknown>;
}

// Legacy job material type (replaced by document_jobs)
export interface JobMaterialRow extends UserOwnedRow {
  id: string;
  job_id: number;
  resume_document_id: string | null;
  resume_artifact_id: string | null;
  cover_document_id: string | null;
  cover_artifact_id: string | null;
  metadata: Record<string, unknown>;
}
