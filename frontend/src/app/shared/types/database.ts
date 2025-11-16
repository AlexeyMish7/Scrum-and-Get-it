/**
 * DATABASE TYPES
 *
 * Types representing raw database row structures from Supabase tables.
 * These match the actual column names and types in PostgreSQL.
 *
 * Note: Eventually these should be auto-generated from Supabase schema.
 * For now, they're manually maintained to match the database.
 */

// Base type for all user-owned records
export interface UserOwnedRow {
  user_id: string;
  created_at: string;
  updated_at: string;
}

// Profile table row
export interface ProfileRow {
  id: string; // UUID, matches auth.users id
  first_name: string;
  last_name: string;
  full_name: string | null;
  email: string;
  phone: string | null;
  professional_title: string | null;
  summary: string | null;
  experience_level: "entry" | "mid" | "senior" | "lead" | "executive" | null;
  industry: string | null;
  city: string | null;
  state: string | null;
  meta: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

// Education table row
export interface EducationRow extends UserOwnedRow {
  id: string;
  institution_name: string;
  degree_type: string | null;
  field_of_study: string | null;
  start_date: string; // Date as ISO string
  graduation_date: string | null; // Date as ISO string
  gpa: number | null;
  enrollment_status: string | null;
  education_level: string | null;
  honors: string | null;
  meta: Record<string, unknown> | null;
}

// Employment table row
export interface EmploymentRow extends UserOwnedRow {
  id: string;
  job_title: string;
  company_name: string;
  location: string | null;
  start_date: string; // Date as ISO string
  end_date: string | null; // Date as ISO string
  job_description: string | null;
  current_position: boolean;
}

// Skills table row
export interface SkillRow extends UserOwnedRow {
  id: string;
  skill_name: string;
  proficiency_level: "beginner" | "intermediate" | "advanced" | "expert";
  skill_category: string;
  meta: Record<string, unknown> | null;
}

// Projects table row
export interface ProjectRow extends UserOwnedRow {
  id: string;
  proj_name: string;
  proj_description: string | null;
  role: string | null;
  start_date: string; // Date as ISO string
  end_date: string | null; // Date as ISO string
  tech_and_skills: string[] | null;
  project_url: string | null;
  team_size: number | null;
  team_details: string | null;
  industry_proj_type: string | null;
  proj_outcomes: string | null;
  status: "planned" | "in_progress" | "completed" | "on_hold" | null;
  media_path: string | null;
  meta: Record<string, unknown> | null;
}

// Certifications table row
export interface CertificationRow extends UserOwnedRow {
  id: string;
  name: string;
  issuing_org: string | null;
  category: string | null;
  date_earned: string | null; // Date as ISO string
  expiration_date: string | null; // Date as ISO string
  does_not_expire: boolean;
  cert_id: string | null;
  media_path: string | null;
  verification_status: "unverified" | "pending" | "verified" | "expired";
}

// Jobs table row
export interface JobRow {
  id: number; // bigint auto-increment
  user_id: string | null;
  created_at: string;
  job_title: string | null;
  company_name: string | null;
  street_address: string | null;
  city_name: string | null;
  state_code: string | null;
  zipcode: string | null;
  start_salary_range: number | null;
  end_salary_range: number | null;
  job_link: string | null;
  application_deadline: string | null; // Date as ISO string
  job_description: string | null;
  industry: string | null;
  job_type: string | null;
  job_status: string | null;
  status_changed_at: string | null;
}

// Documents table row
export interface DocumentRow extends UserOwnedRow {
  id: string;
  kind: "resume" | "cover_letter" | "portfolio" | "other";
  file_name: string;
  file_path: string;
  mime_type: string | null;
  bytes: number | null;
  meta: Record<string, unknown> | null;
  uploaded_at: string;
  project_id: string | null;
}

// AI Artifacts table row
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

// Job Materials table row (links jobs to resumes/cover letters)
export interface JobMaterialRow extends UserOwnedRow {
  id: string;
  job_id: number;
  resume_document_id: string | null;
  resume_artifact_id: string | null;
  cover_document_id: string | null;
  cover_artifact_id: string | null;
  metadata: Record<string, unknown>;
}

// Job Notes table row
export interface JobNoteRow {
  id: string;
  user_id: string | null;
  job_id: number | null;
  created_at: string;
  updated_at: string | null;
  personal_notes: string | null;
  recruiter_name: string | null;
  recruiter_email: string | null;
  recruiter_phone: string | null;
  hiring_manager_name: string | null;
  hiring_manager_email: string | null;
  hiring_manager_phone: string | null;
  application_history: Record<string, unknown>[] | null;
  salary_negotiation_notes: string | null;
  interview_notes: string | null;
  interview_feedback: string | null;
}
