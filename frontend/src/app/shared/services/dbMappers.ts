// Mapping helpers: convert quick-add form payloads into DB-ready payloads
// Local date normalizer (kept small and deterministic)
const dateRegexFull = /^\d{4}-\d{2}-\d{2}$/;
const dateRegexMonth = /^\d{4}-\d{2}$/;
export function formatToSqlDate(v: unknown): string | null {
  if (v == null) return null;
  // Accept Date instances directly
  if (v instanceof Date && !Number.isNaN(v.getTime())) {
    return v.toISOString().split("T")[0];
  }
  const s = String(v).trim();
  if (!s) return null;
  if (dateRegexFull.test(s)) return s;
  if (dateRegexMonth.test(s)) return `${s}-01`;
  if (/^\d{4}-\d{2}/.test(s)) return `${s.slice(0, 7)}-01`;
  return null;
}

type MapperResult<T> = { payload?: T; error?: string };

export const mapEmployment = (
  formData: Record<string, unknown>
): MapperResult<Record<string, unknown>> => {
  const job_title = String(
    formData.position ?? formData.job_title ?? ""
  ).trim();
  const company_name = String(
    formData.company ?? formData.company_name ?? ""
  ).trim();
  const start_date =
    formatToSqlDate(formData.start_date ?? formData.start) ?? null;

  if (!job_title) return { error: "Job title is required" };
  if (!company_name) return { error: "Company name is required" };
  if (!start_date) return { error: "Start date is required" };

  const payload: Record<string, unknown> = {
    job_title,
    company_name,
    // Keep only columns that exist in the canonical DB schema for `employment`
    location: (formData.location as string) ?? null,
    start_date,
    end_date: formatToSqlDate(formData.end_date) ?? null,
    current_position: (formData.is_current as unknown) === true,
    job_description: (formData.description as string) ?? null,
    // The `employment` table doesn't include a `meta` column in the schema.
    // Drop any extra quick-add fields to avoid Supabase schema errors.
  };

  return { payload };
};

export const mapSkill = (
  formData: Record<string, unknown>
): MapperResult<Record<string, unknown>> => {
  const skill_name = String(formData.name ?? formData.skill_name ?? "").trim();
  const profRaw = formData.proficiency_level ?? formData.proficiency ?? 1;
  if (!skill_name) return { error: "Skill name is required" };

  const numToEnum: Record<number, string> = {
    1: "beginner",
    2: "intermediate",
    3: "advanced",
    4: "expert",
    5: "expert",
  };

  // Normalize proficiency input. Accept numeric (1-5) or string labels
  function normalizeProf(raw: unknown): string {
    if (typeof raw === "string") {
      const s = raw.trim().toLowerCase();
      if (["beginner", "intermediate", "advanced", "expert"].includes(s))
        return s;
      const parsed = Number(s);
      if (!Number.isNaN(parsed) && parsed >= 1 && parsed <= 5)
        return numToEnum[Math.round(parsed)];
    }
    const n = Number(raw);
    if (!Number.isNaN(n) && n >= 1 && n <= 5) return numToEnum[Math.round(n)];
    return "beginner";
  }

  const proficiency_level = normalizeProf(profRaw);

  // Keep payload shape identical to AddSkills page: skill_name, proficiency_level, skill_category
  const payload: Record<string, unknown> = {
    skill_name,
    proficiency_level,
    skill_category: (formData.category as string) ?? "Technical",
  };

  return { payload };
};

export const mapEducation = (
  formData: Record<string, unknown>
): MapperResult<Record<string, unknown>> => {
  const institution_name = String(
    formData.institution ?? formData.institution_name ?? ""
  ).trim();
  const start_date =
    formatToSqlDate(formData.start_date ?? formData.start) ?? null;
  if (!institution_name) return { error: "Institution name is required" };
  if (!start_date) return { error: "Start date is required for education" };

  const payload: Record<string, unknown> = {
    institution_name,
    degree_type:
      (formData.degree as string) ?? (formData.degree_type as string) ?? null,
    field_of_study:
      (formData.field_of_study as string) ?? (formData.major as string) ?? null,
    graduation_date: formatToSqlDate(formData.end_date ?? formData.end),
    start_date,
    gpa: formData.gpa == null ? null : Number(formData.gpa) || null,
    enrollment_status:
      (formData.is_current as unknown) === true ? "enrolled" : "not_enrolled",
    education_level: (formData.education_level as string) ?? null,
    honors: (formData.awards as string) ?? null,
    meta: (formData.meta as Record<string, unknown>) ?? null,
  };

  return { payload };
};

export const mapProject = (
  formData: Record<string, unknown>
): MapperResult<Record<string, unknown>> => {
  const proj_name = String(formData.title ?? formData.projectName ?? "").trim();
  const start_date =
    formatToSqlDate(formData.start_date ?? formData.startDate) ?? null;
  if (!proj_name) return { error: "Project name is required" };
  if (!start_date) return { error: "Project start date is required" };

  const techs =
    typeof formData.technologies_input === "string"
      ? (formData.technologies_input as string)
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
      : Array.isArray(formData.technologies)
      ? (formData.technologies as string[]).map((s) => String(s).trim())
      : null;

  const payload: Record<string, unknown> = {
    proj_name,
    proj_description: (formData.description as string) ?? null,
    start_date,
    end_date: formatToSqlDate(formData.end_date ?? formData.endDate) ?? null,
    tech_and_skills: techs,
    project_url: (formData.url as string) ?? null,
    team_size:
      formData.team_size == null ? null : Number(formData.team_size) || null,
    team_details: (formData.team_details as string) ?? null,
    industry_proj_type: (formData.industry as string) ?? null,
    proj_outcomes: (formData.outcomes as string) ?? null,
    status: (formData.is_ongoing as unknown) === true ? "ongoing" : "planned",
    media_path: null,
    meta: (formData.meta as Record<string, unknown>) ?? null,
  };

  return { payload };
};

// --- Jobs mapping + helpers ---
import type { Result, ListOptions } from "./types";
import { withUser } from "./crud";

export const mapJob = (
  formData: Record<string, unknown>
): MapperResult<Record<string, unknown>> => {
  const job_title = String(formData.job_title ?? formData.title ?? "").trim();
  const company_name = String(
    formData.company_name ?? formData.company ?? ""
  ).trim();

  if (!job_title) return { error: "Job title is required" };
  if (!company_name) return { error: "Company name is required" };

  const start_salary_range =
    formData.start_salary == null
      ? formData.start_salary_range == null
        ? null
        : Number(formData.start_salary_range) || null
      : Number(formData.start_salary) || null;

  const end_salary_range =
    formData.end_salary == null
      ? formData.end_salary_range == null
        ? null
        : Number(formData.end_salary_range) || null
      : Number(formData.end_salary) || null;

  const payload: Record<string, unknown> = {
    job_title,
    company_name,
    street_address: (formData.street_address as string) ?? null,
    city_name: (formData.city_name as string) ?? null,
    zipcode: (formData.zipcode as string) ?? null,
    state_code: (formData.state_code as string) ?? null,
    start_salary_range: start_salary_range,
    end_salary_range: end_salary_range,
    job_link: (formData.job_link as string) ?? null,
    application_deadline: formatToSqlDate(
      formData.application_deadline ?? formData.deadline
    ),
    job_description: (formData.job_description as string) ?? null,
    industry: (formData.industry as string) ?? null,
    job_type: (formData.job_type as string) ?? null,
    // Default pipeline status when creating a job if not provided
    job_status: (formData.job_status as string) ?? "Interested",
    // Track when the status last changed. If caller provided one, use it;
    // otherwise set to now when creating/updating via the mapper.
    status_changed_at:
      (formData.status_changed_at as string) ?? new Date().toISOString(),
  };

  return { payload };
};

// CRUD helpers for Jobs table (user-scoped)
export async function listJobs(
  userId: string,
  opts?: ListOptions
): Promise<Result<unknown[]>> {
  const userCrud = withUser(userId);
  return userCrud.listRows("jobs", "*", opts);
}

export async function getJob(
  userId: string,
  jobId: string | number
): Promise<Result<unknown | null>> {
  const userCrud = withUser(userId);
  return userCrud.getRow("jobs", "*", { eq: { id: jobId }, single: true });
}

export async function createJob(
  userId: string,
  formData: Record<string, unknown>
): Promise<Result<unknown>> {
  const mapped = mapJob(formData);
  if (mapped.error) {
    return {
      data: null,
      error: { message: mapped.error, status: null },
      status: null,
    } as Result<unknown>;
  }
  const userCrud = withUser(userId);
  return userCrud.insertRow("jobs", mapped.payload ?? {});
}

export async function updateJob(
  userId: string,
  jobId: string | number,
  formData: Record<string, unknown>
): Promise<Result<unknown>> {
  // Allow partial updates: if the payload includes core job fields (title/company)
  // run through mapJob for validation/normalization. Otherwise treat as a patch
  // and pass through directly so callers can update single columns like job_status.
  const hasCoreField =
    formData.job_title != null ||
    formData.title != null ||
    formData.company_name != null ||
    formData.company != null;

  const userCrud = withUser(userId);

  if (hasCoreField) {
    const mapped = mapJob(formData);
    if (mapped.error) {
      return {
        data: null,
        error: { message: mapped.error, status: null },
        status: null,
      } as Result<unknown>;
    }
    return userCrud.updateRow("jobs", mapped.payload ?? {}, { eq: { id: jobId } });
  }

  // Partial update: forward payload directly
  return userCrud.updateRow("jobs", formData, { eq: { id: jobId } });
}

export async function deleteJob(
  userId: string,
  jobId: string | number
): Promise<Result<null>> {
  const userCrud = withUser(userId);
  return userCrud.deleteRow("jobs", { eq: { id: jobId } });
}

// --- Job notes mapping + helpers ---
export const mapJobNote = (
  formData: Record<string, unknown>
): MapperResult<Record<string, unknown>> => {
  // No required fields by default — notes can be sparse. Normalize common fields.
  const payload: Record<string, unknown> = {
    job_id: formData.job_id == null ? null : Number(formData.job_id) || null,
    personal_notes: (formData.personal_notes as string) ?? null,
    recruiter_name: (formData.recruiter_name as string) ?? null,
    recruiter_email: (formData.recruiter_email as string) ?? null,
    recruiter_phone: (formData.recruiter_phone as string) ?? null,
    hiring_manager_name: (formData.hiring_manager_name as string) ?? null,
    hiring_manager_email: (formData.hiring_manager_email as string) ?? null,
    hiring_manager_phone: (formData.hiring_manager_phone as string) ?? null,
    // application_history is stored as jsonb; accept object or JSON string
    application_history:
      typeof formData.application_history === "string"
        ? (() => {
            try {
              return JSON.parse(formData.application_history as string);
            } catch {
              return null;
            }
          })()
        : (formData.application_history as Record<string, unknown>) ?? null,
    salary_negotiation_notes:
      (formData.salary_negotiation_notes as string) ?? null,
    interview_notes: (formData.interview_notes as string) ?? null,
    interview_feedback: (formData.interview_feedback as string) ?? null,
    updated_at: (formData.updated_at as string) ?? null,
  };

  return { payload };
};

export async function listJobNotes(
  userId: string,
  opts?: ListOptions
): Promise<Result<unknown[]>> {
  const userCrud = withUser(userId);
  return userCrud.listRows("job_notes", "*", opts);
}

export async function getJobNote(
  userId: string,
  noteId: string
): Promise<Result<unknown | null>> {
  const userCrud = withUser(userId);
  return userCrud.getRow("job_notes", "*", { eq: { id: noteId }, single: true });
}

export async function createJobNote(
  userId: string,
  formData: Record<string, unknown>
): Promise<Result<unknown>> {
  const mapped = mapJobNote(formData);
  if (mapped.error) {
    return {
      data: null,
      error: { message: mapped.error, status: null },
      status: null,
    } as Result<unknown>;
  }
  const userCrud = withUser(userId);
  return userCrud.insertRow("job_notes", mapped.payload ?? {});
}

export async function updateJobNote(
  userId: string,
  noteId: string,
  formData: Record<string, unknown>
): Promise<Result<unknown>> {
  // Allow partial updates — callers can patch specific fields
  const userCrud = withUser(userId);
  return userCrud.updateRow("job_notes", formData, { eq: { id: noteId } });
}

export async function deleteJobNote(
  userId: string,
  noteId: string
): Promise<Result<null>> {
  const userCrud = withUser(userId);
  return userCrud.deleteRow("job_notes", { eq: { id: noteId } });
}

