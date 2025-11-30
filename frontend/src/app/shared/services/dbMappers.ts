/**
 * DATABASE MAPPERS (18 Table Data Transformations)
 *
 * Purpose:
 * - Transform UI form data into database-ready payloads
 * - Validate required fields before insertion
 * - Normalize data types (dates, nulls, metadata)
 * - Ensure consistent data formats across all tables
 *
 * Backend Connection:
 * - Built on top of crud.ts (which uses supabaseClient.ts)
 * - All operations enforce RLS via automatic user_id scoping
 * - Validates userId presence before executing any operation
 *
 * Tables Covered (18 total):
 *   Profile System (6): profiles, employment, education, skills, certifications, projects
 *   Jobs System (2): jobs, job_notes
 *   Company System (2): companies, user_company_notes
 *   Template System (2): templates, themes
 *   Document System (2): documents, document_versions
 *   AI Workflow (1): generation_sessions
 *   Analytics (2): export_history, analytics_cache
 *   Relationships (1): document_jobs
 *
 * Data Transformations:
 * - Dates: Convert various formats to YYYY-MM-DD SQL date strings
 * - Metadata: Ensure JSONB fields default to {} not null
 * - Arrays: Validate and normalize skill lists, achievements, etc.
 * - Nulls: Explicit handling of optional vs required fields
 *
 * Usage Pattern:
 *   import { formatToSqlDate, normalizeEmploymentPayload } from '@shared/services/dbMappers';
 *
 *   const payload = normalizeEmploymentPayload({
 *     company_name: 'Acme Corp',
 *     start_date: new Date('2024-01-15'),
 *     achievements: ['Led team of 5']
 *   });
 */

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

// --- References list CRUD helpers (references_list table) ---
/**
 * listReferences()
 * List reference requests for the current user. Optionally filter by contact_id or job_id.
 */
export async function listReferences(
  userId: string,
  opts?: ListOptions
): Promise<Result<unknown[]>> {
  const userCrud = withUser(userId);
  return userCrud.listRows("references_list", "*", opts);
}

/**
 * getReference()
 * Get a single reference request row for the user.
 */
export async function getReference(
  userId: string,
  id: number | string
): Promise<Result<unknown | null>> {
  const userCrud = withUser(userId);
  return userCrud.getRow("references_list", "*", { eq: { id }, single: true });
}

/**
 * createReference()
 * Insert a new reference request for the user.
 */
export async function createReference(
  userId: string,
  payload: Record<string, unknown>
): Promise<Result<unknown>> {
  const userCrud = withUser(userId);
  return userCrud.insertRow("references_list", payload, "*");
}

/**
 * updateReference()
 * Update an existing reference request (scoped to current user).
 */
export async function updateReference(
  userId: string,
  id: number | string,
  payload: Record<string, unknown>
): Promise<Result<unknown>> {
  const userCrud = withUser(userId);
  return userCrud.updateRow("references_list", payload, { eq: { id } }, "*");
}

/**
 * deleteReference()
 * Delete a reference request for the current user.
 */
export async function deleteReference(
  userId: string,
  id: number | string
): Promise<Result<null>> {
  const userCrud = withUser(userId);
  return userCrud.deleteRow("references_list", { eq: { id } });
}

type MapperResult<T> = { payload?: T; error?: string };

// =====================================================================
// PROFILE SYSTEM MAPPERS (6 tables)
// =====================================================================

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
    location: (formData.location as string) ?? null,
    start_date,
    end_date: formatToSqlDate(formData.end_date) ?? null,
    current_position: (formData.is_current as unknown) === true,
    job_description: (formData.description as string) ?? null,
    achievements: Array.isArray(formData.achievements)
      ? (formData.achievements as string[])
      : [],
    metadata: (formData.metadata as Record<string, unknown>) ?? {},
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

  // Updated payload to match new schema: skill_name, proficiency_level, skill_category, years_of_experience, last_used_date, metadata
  const payload: Record<string, unknown> = {
    skill_name,
    proficiency_level,
    skill_category: (formData.category as string) ?? "Technical",
    years_of_experience:
      formData.years_of_experience == null
        ? null
        : Number(formData.years_of_experience) || null,
    last_used_date: formatToSqlDate(formData.last_used_date) ?? null,
    metadata: (formData.metadata as Record<string, unknown>) ?? {},
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
      (formData.is_current as unknown) === true ? "enrolled" : "graduated",
    education_level: (formData.education_level as string) ?? null,
    honors: (formData.awards as string) ?? null,
    metadata: (formData.metadata as Record<string, unknown>) ?? {},
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
    role: (formData.role as string) ?? null,
    start_date,
    end_date: formatToSqlDate(formData.end_date ?? formData.endDate) ?? null,
    tech_and_skills: techs ?? [],
    project_url: (formData.url as string) ?? null,
    team_size:
      formData.team_size == null ? null : Number(formData.team_size) || null,
    team_details: (formData.team_details as string) ?? null,
    industry_proj_type: (formData.industry as string) ?? null,
    proj_outcomes: (formData.outcomes as string) ?? null,
    status: (formData.is_ongoing as unknown) === true ? "ongoing" : "planned",
    media_path: null,
    metadata: (formData.metadata as Record<string, unknown>) ?? {},
  };

  return { payload };
};

export const mapCertification = (
  formData: Record<string, unknown>
): MapperResult<Record<string, unknown>> => {
  const name = String(
    formData.name ?? formData.certification_name ?? ""
  ).trim();
  if (!name) return { error: "Certification name is required" };

  const payload: Record<string, unknown> = {
    name,
    issuing_org: (formData.issuing_org as string) ?? null,
    category: (formData.category as string) ?? null,
    certification_id:
      (formData.certification_id as string) ??
      (formData.cert_id as string) ??
      null,
    date_earned: formatToSqlDate(formData.date_earned) ?? null,
    expiration_date: formatToSqlDate(formData.expiration_date) ?? null,
    does_not_expire: (formData.does_not_expire as unknown) === true,
    verification_status:
      (formData.verification_status as string) ?? "unverified",
    verification_url: (formData.verification_url as string) ?? null,
    media_path: (formData.media_path as string) ?? null,
    metadata: (formData.metadata as Record<string, unknown>) ?? {},
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

  // Normalize job_type to allowed DB values
  const normalizeJobType = (raw: unknown): string | null => {
    if (raw == null) return null;
    const s = String(raw).trim().toLowerCase();
    if (!s) return null;
    // common variants mapping
    const map: Record<string, string> = {
      "full-time": "full-time",
      "full time": "full-time",
      "fulltime": "full-time",
      "part-time": "part-time",
      "part time": "part-time",
      "parttime": "part-time",
      contract: "contract",
      internship: "internship",
      intern: "internship",
      freelance: "freelance",
      "freelance/contract": "freelance",
    };
    if (map[s]) return map[s];
    // accept exact allowed values (fallback)
    const allowed = new Set(["full-time", "part-time", "contract", "internship", "freelance"]);
    if (allowed.has(s)) return s;
    return null;
  };

  const job_type_value = normalizeJobType(formData.job_type);

  const payload: Record<string, unknown> = {
    job_title,
    company_name,
    company_id: (formData.company_id as string) ?? null,
    street_address: (formData.street_address as string) ?? null,
    city_name: (formData.city_name as string) ?? null,
    zipcode: (formData.zipcode as string) ?? null,
    state_code: (formData.state_code as string) ?? null,
    remote_type: (formData.remote_type as string) ?? null,
    start_salary_range: start_salary_range,
    end_salary_range: end_salary_range,
    job_link: (formData.job_link as string) ?? null,
    posted_date: formatToSqlDate(formData.posted_date) ?? null,
    application_deadline: formatToSqlDate(
      formData.application_deadline ?? formData.deadline
    ),
    job_description: (formData.job_description as string) ?? null,
    industry: (formData.industry as string) ?? null,
    job_type: job_type_value,
    experience_level: (formData.experience_level as string) ?? null,
    required_skills: Array.isArray(formData.required_skills)
      ? (formData.required_skills as string[])
      : [],
    preferred_skills: Array.isArray(formData.preferred_skills)
      ? (formData.preferred_skills as string[])
      : [],
    benefits: Array.isArray(formData.benefits)
      ? (formData.benefits as string[])
      : [],
    match_score:
      formData.match_score == null
        ? null
        : Number(formData.match_score) || null,
    is_favorite: (formData.is_favorite as unknown) === true,
    is_archived: (formData.is_archived as unknown) === true,
    archive_reason: (formData.archive_reason as string) ?? null,
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
    return userCrud.updateRow("jobs", mapped.payload ?? {}, {
      eq: { id: jobId },
    });
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
  // Build payload with only non-null/non-empty fields to avoid conflicts with DB defaults
  const payload: Record<string, unknown> = {};

  // Required field
  if (formData.job_id != null) {
    payload.job_id = Number(formData.job_id) || null;
  }

  // Text fields - only include if truthy
  if (formData.personal_notes)
    payload.personal_notes = String(formData.personal_notes);
  if (formData.recruiter_name)
    payload.recruiter_name = String(formData.recruiter_name);
  if (formData.recruiter_email)
    payload.recruiter_email = String(formData.recruiter_email);
  if (formData.recruiter_phone)
    payload.recruiter_phone = String(formData.recruiter_phone);
  if (formData.hiring_manager_name)
    payload.hiring_manager_name = String(formData.hiring_manager_name);
  if (formData.hiring_manager_email)
    payload.hiring_manager_email = String(formData.hiring_manager_email);
  if (formData.hiring_manager_phone)
    payload.hiring_manager_phone = String(formData.hiring_manager_phone);
  if (formData.salary_negotiation_notes)
    payload.salary_negotiation_notes = String(
      formData.salary_negotiation_notes
    );
  if (formData.interview_notes)
    payload.interview_notes = String(formData.interview_notes);
  if (formData.interview_feedback)
    payload.interview_feedback = String(formData.interview_feedback);
  if (formData.red_flags) payload.red_flags = String(formData.red_flags);
  if (formData.pros) payload.pros = String(formData.pros);
  if (formData.cons) payload.cons = String(formData.cons);
  if (formData.rejection_reason)
    payload.rejection_reason = String(formData.rejection_reason);

  // JSONB fields - only include if present
  if (
    formData.application_history !== undefined &&
    formData.application_history !== null
  ) {
    payload.application_history =
      typeof formData.application_history === "string"
        ? (() => {
            try {
              return JSON.parse(formData.application_history as string);
            } catch {
              return [];
            }
          })()
        : formData.application_history;
  }

  if (
    formData.interview_schedule !== undefined &&
    formData.interview_schedule !== null
  ) {
    payload.interview_schedule = formData.interview_schedule;
  }

  if (formData.follow_ups !== undefined && formData.follow_ups !== null) {
    payload.follow_ups = formData.follow_ups;
  }

  if (formData.offer_details !== undefined && formData.offer_details !== null) {
    payload.offer_details = formData.offer_details;
  }

  // Array field
  if (
    Array.isArray(formData.questions_to_ask) &&
    formData.questions_to_ask.length > 0
  ) {
    payload.questions_to_ask = formData.questions_to_ask;
  }

  // Numeric fields
  if (formData.rating != null) {
    payload.rating = Number(formData.rating) || null;
  }

  // Date fields
  if (formData.rejection_date) {
    payload.rejection_date = formatToSqlDate(formData.rejection_date);
  }

  // Don't include updated_at - let database handle it with trigger/default

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
  return userCrud.getRow("job_notes", "*", {
    eq: { id: noteId },
    single: true,
  });
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

// --- Cover Letter Drafts mapping + helpers ---
/**
 * mapCoverLetterDraft()
 * Normalize and validate incoming cover letter draft payloads from UI forms.
 * Inputs: formData (free-form object from the page)
 * Output: { payload } on success or { error } when validation fails
 */
export const mapCoverLetterDraft = (
  formData: Record<string, unknown>
): MapperResult<Record<string, unknown>> => {
  const name = String(formData.name ?? formData.title ?? "").trim();
  if (!name) return { error: "Draft name is required" };

  // Ensure content is a JSON object. Accept object or JSON string. Default to {}
  let content: unknown = formData.content ?? formData.body ?? {};
  if (typeof content === "string") {
    try {
      content = JSON.parse(content);
    } catch {
      // If parsing fails, keep as-string inside an object to avoid DB errors
      content = { text: formData.content };
    }
  }
  if (content == null) content = {};

  // Metadata defaults align with DB defaults
  let metadata: unknown = formData.metadata ?? formData.meta ?? null;
  if (typeof metadata === "string") {
    try {
      metadata = JSON.parse(metadata);
    } catch {
      metadata = null;
    }
  }
  if (metadata == null)
    metadata = { tone: "formal", length: "standard", culture: "corporate" };

  const payload: Record<string, unknown> = {
    name,
    template_id:
      (formData.template_id as string) ??
      (formData.template as string) ??
      "formal",
    job_id: formData.job_id == null ? null : Number(formData.job_id) || null,
    company_name: (formData.company_name as string) ?? null,
    job_title: (formData.job_title as string) ?? null,
    content,
    metadata,
    company_research:
      formData.company_research == null
        ? null
        : typeof formData.company_research === "string"
        ? (() => {
            try {
              return JSON.parse(formData.company_research as string);
            } catch {
              return null;
            }
          })()
        : (formData.company_research as Record<string, unknown>),
    version: formData.version == null ? 1 : Number(formData.version) || 1,
    is_active: (formData.is_active as unknown) === false ? false : true,
  };

  return { payload };
};

export async function listCoverLetterDrafts(
  userId: string,
  opts?: ListOptions
): Promise<Result<unknown[]>> {
  const userCrud = withUser(userId);
  return userCrud.listRows("cover_letter_drafts", "*", opts);
}

export async function getCoverLetterDraft(
  userId: string,
  draftId: string
): Promise<Result<unknown | null>> {
  const userCrud = withUser(userId);
  return userCrud.getRow("cover_letter_drafts", "*", {
    eq: { id: draftId },
    single: true,
  });
}

export async function createCoverLetterDraft(
  userId: string,
  formData: Record<string, unknown>
): Promise<Result<unknown>> {
  const mapped = mapCoverLetterDraft(formData);
  if (mapped.error) {
    return {
      data: null,
      error: { message: mapped.error, status: null },
      status: null,
    } as Result<unknown>;
  }
  const userCrud = withUser(userId);
  return userCrud.insertRow("cover_letter_drafts", mapped.payload ?? {});
}

export async function updateCoverLetterDraft(
  userId: string,
  draftId: string,
  formData: Record<string, unknown>
): Promise<Result<unknown>> {
  // For updates, allow partial patches. If name is present validate it.
  if (formData.name != null) {
    const name = String(formData.name ?? "").trim();
    if (!name) {
      return {
        data: null,
        error: { message: "Draft name is required", status: null },
        status: null,
      } as Result<unknown>;
    }
  }

  const userCrud = withUser(userId);
  return userCrud.updateRow("cover_letter_drafts", formData, {
    eq: { id: draftId },
  });
}

export async function deleteCoverLetterDraft(
  userId: string,
  draftId: string
): Promise<Result<null>> {
  const userCrud = withUser(userId);
  return userCrud.deleteRow("cover_letter_drafts", { eq: { id: draftId } });
}

// =====================================================================
// COMPANY SYSTEM MAPPERS (2 tables)
// =====================================================================

/**
 * mapCompany()
 * Normalize and validate company data for storage.
 * Inputs: formData with company information
 * Output: { payload } on success or { error } when validation fails
 */
export const mapCompany = (
  formData: Record<string, unknown>
): MapperResult<Record<string, unknown>> => {
  const name = String(formData.name ?? formData.company_name ?? "").trim();
  if (!name) return { error: "Company name is required" };

  const payload: Record<string, unknown> = {
    name,
    domain: (formData.domain as string) ?? null,
    description: (formData.description as string) ?? null,
    industry: (formData.industry as string) ?? null,
    company_size: (formData.company_size as string) ?? null,
    founded_year:
      formData.founded_year == null
        ? null
        : Number(formData.founded_year) || null,
    headquarters_location: (formData.headquarters_location as string) ?? null,
    website: (formData.website as string) ?? null,
    linkedin_url: (formData.linkedin_url as string) ?? null,
    careers_page: (formData.careers_page as string) ?? null,
    company_data: (formData.company_data as Record<string, unknown>) ?? {},
    research_cache: (formData.research_cache as Record<string, unknown>) ?? {},
    logo_url: (formData.logo_url as string) ?? null,
    is_verified: (formData.is_verified as unknown) === true,
  };

  return { payload };
};

/**
 * mapUserCompanyNote()
 * Map user notes and research about specific companies.
 * Inputs: formData with company_id and note fields
 * Output: { payload } on success or { error } when validation fails
 */
export const mapUserCompanyNote = (
  formData: Record<string, unknown>
): MapperResult<Record<string, unknown>> => {
  const company_id = String(formData.company_id ?? "").trim();
  if (!company_id) return { error: "Company ID is required" };

  const payload: Record<string, unknown> = {
    company_id,
    personal_notes: (formData.personal_notes as string) ?? null,
    pros: (formData.pros as string) ?? null,
    cons: (formData.cons as string) ?? null,
    culture_notes: (formData.culture_notes as string) ?? null,
    interview_tips: (formData.interview_tips as string) ?? null,
    contacts: Array.isArray(formData.contacts) ? formData.contacts : [],
    application_count:
      formData.application_count == null
        ? 0
        : Number(formData.application_count) || 0,
    is_favorite: (formData.is_favorite as unknown) === true,
    is_blacklisted: (formData.is_blacklisted as unknown) === true,
  };

  return { payload };
};

// Company CRUD helpers
export async function listCompanies(
  opts?: ListOptions
): Promise<Result<unknown[]>> {
  const { listRows } = await import("./crud");
  return listRows("companies", "*", opts);
}

export async function getCompany(
  companyId: string
): Promise<Result<unknown | null>> {
  const { getRow } = await import("./crud");
  return getRow("companies", "*", { eq: { id: companyId }, single: true });
}

export async function createCompany(
  formData: Record<string, unknown>
): Promise<Result<unknown>> {
  const mapped = mapCompany(formData);
  if (mapped.error) {
    return {
      data: null,
      error: { message: mapped.error, status: null },
      status: null,
    } as Result<unknown>;
  }
  const { insertRow } = await import("./crud");
  return insertRow("companies", mapped.payload ?? {});
}

export async function updateCompany(
  companyId: string,
  formData: Record<string, unknown>
): Promise<Result<unknown>> {
  const { updateRow } = await import("./crud");
  return updateRow("companies", formData, { eq: { id: companyId } });
}

export async function deleteCompany(companyId: string): Promise<Result<null>> {
  const { deleteRow } = await import("./crud");
  return deleteRow("companies", { eq: { id: companyId } });
}

// User Company Notes CRUD helpers
export async function listUserCompanyNotes(
  userId: string,
  opts?: ListOptions
): Promise<Result<unknown[]>> {
  const userCrud = withUser(userId);
  return userCrud.listRows("user_company_notes", "*", opts);
}

export async function getUserCompanyNote(
  userId: string,
  noteId: string
): Promise<Result<unknown | null>> {
  const userCrud = withUser(userId);
  return userCrud.getRow("user_company_notes", "*", {
    eq: { id: noteId },
    single: true,
  });
}

export async function createUserCompanyNote(
  userId: string,
  formData: Record<string, unknown>
): Promise<Result<unknown>> {
  const mapped = mapUserCompanyNote(formData);
  if (mapped.error) {
    return {
      data: null,
      error: { message: mapped.error, status: null },
      status: null,
    } as Result<unknown>;
  }
  const userCrud = withUser(userId);
  return userCrud.insertRow("user_company_notes", mapped.payload ?? {});
}

export async function updateUserCompanyNote(
  userId: string,
  noteId: string,
  formData: Record<string, unknown>
): Promise<Result<unknown>> {
  const userCrud = withUser(userId);
  return userCrud.updateRow("user_company_notes", formData, {
    eq: { id: noteId },
  });
}

export async function deleteUserCompanyNote(
  userId: string,
  noteId: string
): Promise<Result<null>> {
  const userCrud = withUser(userId);
  return userCrud.deleteRow("user_company_notes", { eq: { id: noteId } });
}

// =====================================================================
// TEMPLATE SYSTEM MAPPERS (2 tables)
// =====================================================================

/**
 * mapTemplate()
 * Normalize and validate resume/cover letter template data.
 * Inputs: formData with template configuration
 * Output: { payload } on success or { error } when validation fails
 */
export const mapTemplate = (
  formData: Record<string, unknown>
): MapperResult<Record<string, unknown>> => {
  const name = String(formData.name ?? formData.template_name ?? "").trim();
  const category = formData.category as string;
  const subtype = formData.subtype as string;

  if (!name) return { error: "Template name is required" };
  if (!category || !["resume", "cover-letter"].includes(category)) {
    return { error: "Valid category required (resume or cover-letter)" };
  }
  if (!subtype) return { error: "Template subtype is required" };

  const payload: Record<string, unknown> = {
    name,
    category,
    subtype,
    layout: (formData.layout as Record<string, unknown>) ?? {},
    schema: (formData.schema as Record<string, unknown>) ?? {},
    features: (formData.features as Record<string, unknown>) ?? {},
    metadata: (formData.metadata as Record<string, unknown>) ?? {},
    version: formData.version == null ? 1 : Number(formData.version) || 1,
    author: (formData.author as string) ?? "user",
    is_default: (formData.is_default as unknown) === true,
    is_public: (formData.is_public as unknown) === true,
  };

  return { payload };
};

/**
 * mapTheme()
 * Normalize and validate theme/styling data for documents.
 * Inputs: formData with theme configuration
 * Output: { payload } on success or { error } when validation fails
 */
export const mapTheme = (
  formData: Record<string, unknown>
): MapperResult<Record<string, unknown>> => {
  const name = String(formData.name ?? formData.theme_name ?? "").trim();
  if (!name) return { error: "Theme name is required" };

  const payload: Record<string, unknown> = {
    name,
    category: (formData.category as string) ?? null,
    colors: (formData.colors as Record<string, unknown>) ?? {},
    typography: (formData.typography as Record<string, unknown>) ?? {},
    spacing: (formData.spacing as Record<string, unknown>) ?? {},
    effects: (formData.effects as Record<string, unknown>) ?? {},
    metadata: (formData.metadata as Record<string, unknown>) ?? {},
    author: (formData.author as string) ?? "user",
    is_default: (formData.is_default as unknown) === true,
    is_public: (formData.is_public as unknown) === true,
  };

  return { payload };
};

// Template CRUD helpers
export async function listTemplates(
  userId: string | null,
  opts?: ListOptions
): Promise<Result<unknown[]>> {
  const { listRows } = await import("./crud");
  if (userId) {
    const userCrud = withUser(userId);
    return userCrud.listRows("templates", "*", opts);
  }
  return listRows("templates", "*", opts);
}

export async function getTemplate(
  templateId: string
): Promise<Result<unknown | null>> {
  const { getRow } = await import("./crud");
  return getRow("templates", "*", { eq: { id: templateId }, single: true });
}

export async function createTemplate(
  userId: string,
  formData: Record<string, unknown>
): Promise<Result<unknown>> {
  const mapped = mapTemplate(formData);
  if (mapped.error) {
    return {
      data: null,
      error: { message: mapped.error, status: null },
      status: null,
    } as Result<unknown>;
  }
  const userCrud = withUser(userId);
  return userCrud.insertRow("templates", mapped.payload ?? {});
}

export async function updateTemplate(
  userId: string,
  templateId: string,
  formData: Record<string, unknown>
): Promise<Result<unknown>> {
  const userCrud = withUser(userId);
  return userCrud.updateRow("templates", formData, { eq: { id: templateId } });
}

export async function deleteTemplate(
  userId: string,
  templateId: string
): Promise<Result<null>> {
  const userCrud = withUser(userId);
  return userCrud.deleteRow("templates", { eq: { id: templateId } });
}

// Theme CRUD helpers
export async function listThemes(
  userId: string | null,
  opts?: ListOptions
): Promise<Result<unknown[]>> {
  const { listRows } = await import("./crud");
  if (userId) {
    const userCrud = withUser(userId);
    return userCrud.listRows("themes", "*", opts);
  }
  return listRows("themes", "*", opts);
}

export async function getTheme(
  themeId: string
): Promise<Result<unknown | null>> {
  const { getRow } = await import("./crud");
  return getRow("themes", "*", { eq: { id: themeId }, single: true });
}

export async function createTheme(
  userId: string,
  formData: Record<string, unknown>
): Promise<Result<unknown>> {
  const mapped = mapTheme(formData);
  if (mapped.error) {
    return {
      data: null,
      error: { message: mapped.error, status: null },
      status: null,
    } as Result<unknown>;
  }
  const userCrud = withUser(userId);
  return userCrud.insertRow("themes", mapped.payload ?? {});
}

export async function updateTheme(
  userId: string,
  themeId: string,
  formData: Record<string, unknown>
): Promise<Result<unknown>> {
  const userCrud = withUser(userId);
  return userCrud.updateRow("themes", formData, { eq: { id: themeId } });
}

export async function deleteTheme(
  userId: string,
  themeId: string
): Promise<Result<null>> {
  const userCrud = withUser(userId);
  return userCrud.deleteRow("themes", { eq: { id: themeId } });
}

// =====================================================================
// DOCUMENT MANAGEMENT MAPPERS (2 tables)
// =====================================================================

/**
 * mapDocument()
 * Normalize and validate document (resume/cover letter) data.
 * Inputs: formData with document metadata and content
 * Output: { payload } on success or { error } when validation fails
 */
export const mapDocument = (
  formData: Record<string, unknown>
): MapperResult<Record<string, unknown>> => {
  const name = String(formData.name ?? formData.document_name ?? "").trim();
  const type = formData.type as string;
  const template_id = formData.template_id as string;
  const theme_id = formData.theme_id as string;

  if (!name) return { error: "Document name is required" };
  if (!type || !["resume", "cover-letter"].includes(type)) {
    return { error: "Valid document type required (resume or cover-letter)" };
  }
  if (!template_id) return { error: "Template ID is required" };
  if (!theme_id) return { error: "Theme ID is required" };

  const payload: Record<string, unknown> = {
    type,
    status: (formData.status as string) ?? "draft",
    name,
    description: (formData.description as string) ?? null,
    template_id,
    theme_id,
    template_overrides:
      (formData.template_overrides as Record<string, unknown>) ?? {},
    theme_overrides:
      (formData.theme_overrides as Record<string, unknown>) ?? {},
    content: (formData.content as Record<string, unknown>) ?? {},
    job_id: formData.job_id == null ? null : Number(formData.job_id) || null,
    target_role: (formData.target_role as string) ?? null,
    target_company: (formData.target_company as string) ?? null,
    target_industry: (formData.target_industry as string) ?? null,
    context_notes: (formData.context_notes as string) ?? null,
    tags: Array.isArray(formData.tags) ? (formData.tags as string[]) : [],
    folder: (formData.folder as string) ?? null,
    color: (formData.color as string) ?? null,
    rating: formData.rating == null ? null : Number(formData.rating) || null,
    user_notes: (formData.user_notes as string) ?? null,
    is_default: (formData.is_default as unknown) === true,
    is_pinned: (formData.is_pinned as unknown) === true,
    is_archived: (formData.is_archived as unknown) === true,
  };

  return { payload };
};

/**
 * mapDocumentVersion()
 * Normalize and validate document version snapshot data.
 * Inputs: formData with version metadata and content
 * Output: { payload } on success or { error } when validation fails
 */
export const mapDocumentVersion = (
  formData: Record<string, unknown>
): MapperResult<Record<string, unknown>> => {
  const document_id = formData.document_id as string;
  const version_number = formData.version_number as number;
  const content = formData.content as Record<string, unknown>;
  const template_id = formData.template_id as string;
  const theme_id = formData.theme_id as string;
  const name = String(formData.name ?? "").trim();
  const change_type = formData.change_type as string;
  const created_by = formData.created_by as string;

  if (!document_id) return { error: "Document ID is required" };
  if (version_number == null) return { error: "Version number is required" };
  if (!content) return { error: "Content is required" };
  if (!template_id) return { error: "Template ID is required" };
  if (!theme_id) return { error: "Theme ID is required" };
  if (!name) return { error: "Version name is required" };
  if (!change_type) return { error: "Change type is required" };
  if (!created_by) return { error: "Created by user ID is required" };

  const payload: Record<string, unknown> = {
    document_id,
    version_number,
    content,
    template_id,
    theme_id,
    template_overrides:
      (formData.template_overrides as Record<string, unknown>) ?? {},
    theme_overrides:
      (formData.theme_overrides as Record<string, unknown>) ?? {},
    job_id: formData.job_id == null ? null : Number(formData.job_id) || null,
    generation_session_id: (formData.generation_session_id as string) ?? null,
    name,
    description: (formData.description as string) ?? null,
    tags: Array.isArray(formData.tags) ? (formData.tags as string[]) : [],
    color: (formData.color as string) ?? null,
    notes: (formData.notes as string) ?? null,
    change_type,
    changed_sections: Array.isArray(formData.changed_sections)
      ? (formData.changed_sections as string[])
      : [],
    change_summary: (formData.change_summary as string) ?? null,
    parent_version_id: (formData.parent_version_id as string) ?? null,
    branch_name: (formData.branch_name as string) ?? null,
    merge_source_id: (formData.merge_source_id as string) ?? null,
    word_count:
      formData.word_count == null ? 0 : Number(formData.word_count) || 0,
    character_count:
      formData.character_count == null
        ? 0
        : Number(formData.character_count) || 0,
    ats_score:
      formData.ats_score == null ? null : Number(formData.ats_score) || null,
    status: (formData.status as string) ?? "active",
    is_pinned: (formData.is_pinned as unknown) === true,
    is_archived: (formData.is_archived as unknown) === true,
    created_by,
  };

  return { payload };
};

// Document CRUD helpers
export async function listDocuments(
  userId: string,
  opts?: ListOptions
): Promise<Result<unknown[]>> {
  const userCrud = withUser(userId);
  return userCrud.listRows("documents", "*", opts);
}

export async function getDocument(
  userId: string,
  documentId: string
): Promise<Result<unknown | null>> {
  const userCrud = withUser(userId);
  return userCrud.getRow("documents", "*", {
    eq: { id: documentId },
    single: true,
  });
}

export async function createDocument(
  userId: string,
  formData: Record<string, unknown>
): Promise<Result<unknown>> {
  const mapped = mapDocument(formData);
  if (mapped.error) {
    return {
      data: null,
      error: { message: mapped.error, status: null },
      status: null,
    } as Result<unknown>;
  }
  const userCrud = withUser(userId);
  return userCrud.insertRow("documents", mapped.payload ?? {});
}

export async function updateDocument(
  userId: string,
  documentId: string,
  formData: Record<string, unknown>
): Promise<Result<unknown>> {
  const userCrud = withUser(userId);
  return userCrud.updateRow("documents", formData, { eq: { id: documentId } });
}

export async function deleteDocument(
  userId: string,
  documentId: string
): Promise<Result<null>> {
  const userCrud = withUser(userId);
  return userCrud.deleteRow("documents", { eq: { id: documentId } });
}

// Document Version CRUD helpers
export async function listDocumentVersions(
  userId: string,
  documentId: string,
  opts?: ListOptions
): Promise<Result<unknown[]>> {
  const userCrud = withUser(userId);
  return userCrud.listRows("document_versions", "*", {
    ...opts,
    eq: { ...opts?.eq, document_id: documentId },
  });
}

export async function getDocumentVersion(
  userId: string,
  versionId: string
): Promise<Result<unknown | null>> {
  const userCrud = withUser(userId);
  return userCrud.getRow("document_versions", "*", {
    eq: { id: versionId },
    single: true,
  });
}

export async function createDocumentVersion(
  userId: string,
  formData: Record<string, unknown>
): Promise<Result<unknown>> {
  const mapped = mapDocumentVersion(formData);
  if (mapped.error) {
    return {
      data: null,
      error: { message: mapped.error, status: null },
      status: null,
    } as Result<unknown>;
  }
  const userCrud = withUser(userId);
  return userCrud.insertRow("document_versions", mapped.payload ?? {});
}

// =====================================================================
// AI WORKFLOW MAPPERS (1 table)
// =====================================================================

/**
 * mapGenerationSession()
 * Normalize and validate AI generation session data.
 * Inputs: formData with generation parameters and results
 * Output: { payload } on success or { error } when validation fails
 */
export const mapGenerationSession = (
  formData: Record<string, unknown>
): MapperResult<Record<string, unknown>> => {
  const generation_type = formData.generation_type as string;
  if (
    !generation_type ||
    !["resume", "cover-letter"].includes(generation_type)
  ) {
    return { error: "Valid generation type required (resume or cover-letter)" };
  }

  const payload: Record<string, unknown> = {
    generation_type,
    status: (formData.status as string) ?? "in-progress",
    template_id: (formData.template_id as string) ?? null,
    theme_id: (formData.theme_id as string) ?? null,
    job_id: formData.job_id == null ? null : Number(formData.job_id) || null,
    options: (formData.options as Record<string, unknown>) ?? {},
    model: (formData.model as string) ?? null,
    prompt_template: (formData.prompt_template as string) ?? null,
    prompt_variables:
      (formData.prompt_variables as Record<string, unknown>) ?? {},
    result_version_id: (formData.result_version_id as string) ?? null,
    generated_content:
      (formData.generated_content as Record<string, unknown>) ?? null,
    error_message: (formData.error_message as string) ?? null,
    error_details: (formData.error_details as Record<string, unknown>) ?? null,
    tokens_used:
      formData.tokens_used == null
        ? null
        : Number(formData.tokens_used) || null,
    generation_time_ms:
      formData.generation_time_ms == null
        ? null
        : Number(formData.generation_time_ms) || null,
    cost_cents:
      formData.cost_cents == null ? null : Number(formData.cost_cents) || null,
    user_rating:
      formData.user_rating == null
        ? null
        : Number(formData.user_rating) || null,
    user_feedback: (formData.user_feedback as string) ?? null,
  };

  return { payload };
};

// Generation Session CRUD helpers
export async function listGenerationSessions(
  userId: string,
  opts?: ListOptions
): Promise<Result<unknown[]>> {
  const userCrud = withUser(userId);
  return userCrud.listRows("generation_sessions", "*", opts);
}

export async function getGenerationSession(
  userId: string,
  sessionId: string
): Promise<Result<unknown | null>> {
  const userCrud = withUser(userId);
  return userCrud.getRow("generation_sessions", "*", {
    eq: { id: sessionId },
    single: true,
  });
}

export async function createGenerationSession(
  userId: string,
  formData: Record<string, unknown>
): Promise<Result<unknown>> {
  const mapped = mapGenerationSession(formData);
  if (mapped.error) {
    return {
      data: null,
      error: { message: mapped.error, status: null },
      status: null,
    } as Result<unknown>;
  }
  const userCrud = withUser(userId);
  return userCrud.insertRow("generation_sessions", mapped.payload ?? {});
}

export async function updateGenerationSession(
  userId: string,
  sessionId: string,
  formData: Record<string, unknown>
): Promise<Result<unknown>> {
  const userCrud = withUser(userId);
  return userCrud.updateRow("generation_sessions", formData, {
    eq: { id: sessionId },
  });
}

// =====================================================================
// ANALYTICS & EXPORT MAPPERS (2 tables)
// =====================================================================

/**
 * mapExportHistory()
 * Normalize and validate document export data.
 * Inputs: formData with export metadata
 * Output: { payload } on success or { error } when validation fails
 */
export const mapExportHistory = (
  formData: Record<string, unknown>
): MapperResult<Record<string, unknown>> => {
  const document_id = formData.document_id as string;
  const version_id = formData.version_id as string;
  const format = formData.format as string;
  const file_name = String(formData.file_name ?? "").trim();

  if (!document_id) return { error: "Document ID is required" };
  if (!version_id) return { error: "Version ID is required" };
  if (!format || !["pdf", "docx", "html", "txt", "json"].includes(format)) {
    return { error: "Valid format required (pdf, docx, html, txt, json)" };
  }
  if (!file_name) return { error: "File name is required" };

  const payload: Record<string, unknown> = {
    document_id,
    version_id,
    format,
    file_name,
    file_size_bytes:
      formData.file_size_bytes == null
        ? null
        : Number(formData.file_size_bytes) || null,
    storage_path: (formData.storage_path as string) ?? null,
    storage_url: (formData.storage_url as string) ?? null,
    export_options: (formData.export_options as Record<string, unknown>) ?? {},
    status: (formData.status as string) ?? "completed",
    error_message: (formData.error_message as string) ?? null,
    expires_at: (formData.expires_at as string) ?? null,
  };

  return { payload };
};

/**
 * mapAnalyticsCache()
 * Normalize and validate analytics/AI results cache data.
 * Inputs: formData with analytics type and computed data
 * Output: { payload } on success or { error } when validation fails
 */
export const mapAnalyticsCache = (
  formData: Record<string, unknown>
): MapperResult<Record<string, unknown>> => {
  const analytics_type = formData.analytics_type as string;
  const data = formData.data as Record<string, unknown>;

  if (!analytics_type) return { error: "Analytics type is required" };
  if (!data) return { error: "Data is required" };

  const payload: Record<string, unknown> = {
    analytics_type,
    document_id: (formData.document_id as string) ?? null,
    job_id: formData.job_id == null ? null : Number(formData.job_id) || null,
    company_name: (formData.company_name as string) ?? null,
    data,
    match_score:
      formData.match_score == null
        ? null
        : Number(formData.match_score) || null,
    ats_score:
      formData.ats_score == null ? null : Number(formData.ats_score) || null,
    metadata: (formData.metadata as Record<string, unknown>) ?? {},
    generated_at: (formData.generated_at as string) ?? new Date().toISOString(),
    expires_at: (formData.expires_at as string) ?? null,
  };

  return { payload };
};

// Export History CRUD helpers
export async function listExportHistory(
  userId: string,
  opts?: ListOptions
): Promise<Result<unknown[]>> {
  const userCrud = withUser(userId);
  return userCrud.listRows("export_history", "*", opts);
}

export async function getExportHistory(
  userId: string,
  exportId: string
): Promise<Result<unknown | null>> {
  const userCrud = withUser(userId);
  return userCrud.getRow("export_history", "*", {
    eq: { id: exportId },
    single: true,
  });
}

export async function createExportHistory(
  userId: string,
  formData: Record<string, unknown>
): Promise<Result<unknown>> {
  const mapped = mapExportHistory(formData);
  if (mapped.error) {
    return {
      data: null,
      error: { message: mapped.error, status: null },
      status: null,
    } as Result<unknown>;
  }
  const userCrud = withUser(userId);
  return userCrud.insertRow("export_history", mapped.payload ?? {});
}

// Analytics Cache CRUD helpers
export async function listAnalyticsCache(
  userId: string,
  opts?: ListOptions
): Promise<Result<unknown[]>> {
  const userCrud = withUser(userId);
  return userCrud.listRows("analytics_cache", "*", opts);
}

export async function getAnalyticsCache(
  userId: string,
  cacheId: string
): Promise<Result<unknown | null>> {
  const userCrud = withUser(userId);
  return userCrud.getRow("analytics_cache", "*", {
    eq: { id: cacheId },
    single: true,
  });
}

export async function createAnalyticsCache(
  userId: string,
  formData: Record<string, unknown>
): Promise<Result<unknown>> {
  const mapped = mapAnalyticsCache(formData);
  if (mapped.error) {
    return {
      data: null,
      error: { message: mapped.error, status: null },
      status: null,
    } as Result<unknown>;
  }
  const userCrud = withUser(userId);
  return userCrud.insertRow("analytics_cache", mapped.payload ?? {});
}

// =====================================================================
// RELATIONSHIP MAPPERS (1 table)
// =====================================================================

/**
 * mapDocumentJob()
 * Normalize and validate document-job linking data.
 * Inputs: formData with document_id, job_id, and submission details
 * Output: { payload } on success or { error } when validation fails
 */
export const mapDocumentJob = (
  formData: Record<string, unknown>
): MapperResult<Record<string, unknown>> => {
  const document_id = formData.document_id as string;
  const job_id = formData.job_id as number;

  if (!document_id) return { error: "Document ID is required" };
  if (job_id == null) return { error: "Job ID is required" };

  const payload: Record<string, unknown> = {
    document_id,
    version_id: (formData.version_id as string) ?? null,
    job_id,
    status: (formData.status as string) ?? "planned",
    submitted_at: (formData.submitted_at as string) ?? null,
    response_received_at: (formData.response_received_at as string) ?? null,
    outcome: (formData.outcome as string) ?? null,
    notes: (formData.notes as string) ?? null,
  };

  return { payload };
};

// Document-Job CRUD helpers
export async function listDocumentJobs(
  userId: string,
  opts?: ListOptions
): Promise<Result<unknown[]>> {
  const userCrud = withUser(userId);
  return userCrud.listRows("document_jobs", "*", opts);
}

export async function getDocumentJob(
  userId: string,
  linkId: string
): Promise<Result<unknown | null>> {
  const userCrud = withUser(userId);
  return userCrud.getRow("document_jobs", "*", {
    eq: { id: linkId },
    single: true,
  });
}

export async function createDocumentJob(
  userId: string,
  formData: Record<string, unknown>
): Promise<Result<unknown>> {
  const mapped = mapDocumentJob(formData);
  if (mapped.error) {
    return {
      data: null,
      error: { message: mapped.error, status: null },
      status: null,
    } as Result<unknown>;
  }
  const userCrud = withUser(userId);
  return userCrud.insertRow("document_jobs", mapped.payload ?? {});
}

export async function updateDocumentJob(
  userId: string,
  linkId: string,
  formData: Record<string, unknown>
): Promise<Result<unknown>> {
  const userCrud = withUser(userId);
  return userCrud.updateRow("document_jobs", formData, { eq: { id: linkId } });
}

export async function deleteDocumentJob(
  userId: string,
  linkId: string
): Promise<Result<null>> {
  const userCrud = withUser(userId);
  return userCrud.deleteRow("document_jobs", { eq: { id: linkId } });
}

// =====================================================================
// CONTACTS SYSTEM MAPPERS (2 tables)
// =====================================================================

/**
 * mapContact()
 * Normalize and validate contact data used in the `contacts` table.
 */
export const mapContact = (
  formData: Record<string, unknown>
): MapperResult<Record<string, unknown>> => {
  const first_name = String(
    formData.first_name ?? formData.firstName ?? ""
  ).trim();
  const last_name = String(
    formData.last_name ?? formData.lastName ?? ""
  ).trim();
  const emailRaw = formData.email as string | undefined;
  const email = emailRaw ? String(emailRaw).trim().toLowerCase() : null;
  const phone = (formData.phone as string) ?? null;
  const company = (formData.company as string) ?? null;
  const role = (formData.role as string) ?? null;
  const industry = (formData.industry as string) ?? null;
  const relationship_type = (formData.relationship_type as string) ?? null;
  const relationship_strength =
    formData.relationship_strength == null
      ? null
      : Number(formData.relationship_strength) || null;

  // At least one identifying field should be present
  if (!first_name && !last_name && !email) {
    return { error: "Provide at least a name or email for the contact" };
  }

  const payload: Record<string, unknown> = {
    first_name: first_name || null,
    last_name: last_name || null,
    email,
    phone,
    company,
    role,
    industry,
    relationship_type,
    relationship_strength,
    is_professional_reference: (formData.is_professional_reference as unknown) === true,
    personal_notes: (formData.personal_notes as string) ?? null,
    professional_notes: (formData.professional_notes as string) ?? null,
    linkedin_url: (formData.linkedin_url as string) ?? null,
    mutual_contacts: (() => {
      const raw = (formData as any).mutual_contact_ids ?? (formData as any).mutual_contacts;
      if (raw == null) return null;
      if (Array.isArray(raw)) return raw.map(String);
      if (typeof raw === 'string') {
        try {
          const parsed = JSON.parse(raw as string);
          if (Array.isArray(parsed)) return parsed.map(String);
        } catch {
          // fallthrough to CSV split
        }
        return (raw as string).split(',').map((s) => s.trim()).filter(Boolean);
      }
      return null;
    })(),
  };

  return { payload };
};

/**
 * mapContactInteraction()
 * Normalize and validate interaction data used in `contact_interactions`.
 */
export const mapContactInteraction = (
  formData: Record<string, unknown>
): MapperResult<Record<string, unknown>> => {
  const contact_id = formData.contact_id as string | undefined;
  if (!contact_id) return { error: "contact_id is required" };

  const interaction_type = (formData.interaction_type as string) ?? null;
  const notes = (formData.notes as string) ?? null;

  // Accept Date or ISO string for occurred_at; default to now
  let occurred_at: string | null = null;
  if (formData.occurred_at != null) {
    try {
      const d = formData.occurred_at instanceof Date
        ? formData.occurred_at
        : new Date(String(formData.occurred_at));
      if (!Number.isNaN(d.getTime())) occurred_at = d.toISOString();
    } catch {
      occurred_at = null;
    }
  }
  if (!occurred_at) occurred_at = new Date().toISOString();

  // Analytics tracking fields (optional)
  const referral_generated = formData.referral_generated === true;
  const job_opportunity_created = formData.job_opportunity_created === true;
  const event_name = (formData.event_name as string) || null;
  const event_outcome = (formData.event_outcome as string) || null;
  const value_provided = (formData.value_provided as string) || null;
  const value_received = (formData.value_received as string) || null;
  const follow_up_scheduled = formData.follow_up_scheduled === true;
  const interaction_quality = formData.interaction_quality != null 
    ? Number(formData.interaction_quality) 
    : null;
  const tags = Array.isArray(formData.tags) ? formData.tags : null;

  const payload: Record<string, unknown> = {
    contact_id,
    interaction_type,
    notes,
    occurred_at,
    referral_generated,
    job_opportunity_created,
    event_name,
    event_outcome,
    value_provided,
    value_received,
    follow_up_scheduled,
    interaction_quality,
    tags,
  };

  return { payload };
};

// Contacts CRUD helpers (user-scoped)
export async function listContacts(
  userId: string,
  opts?: ListOptions
): Promise<Result<unknown[]>> {
  const userCrud = withUser(userId);
  return userCrud.listRows("contacts", "*", opts);
}

export async function getContact(
  userId: string,
  contactId: string
): Promise<Result<unknown | null>> {
  const userCrud = withUser(userId);
  return userCrud.getRow("contacts", "*", { eq: { id: contactId }, single: true });
}

export async function createContact(
  userId: string,
  formData: Record<string, unknown>
): Promise<Result<unknown>> {
  const mapped = mapContact(formData);
  if (mapped.error) {
    return {
      data: null,
      error: { message: mapped.error, status: null },
      status: null,
    } as Result<unknown>;
  }
  const userCrud = withUser(userId);
  return userCrud.insertRow("contacts", mapped.payload ?? {});
}

export async function updateContact(
  userId: string,
  contactId: string,
  formData: Record<string, unknown>
): Promise<Result<unknown>> {
  const userCrud = withUser(userId);
  // Normalize mutual_contact_ids -> mutual_contacts for updates coming from UI
  if ((formData as any).mutual_contact_ids !== undefined) {
    const mc = (formData as any).mutual_contact_ids;
    if (mc == null) {
      (formData as any).mutual_contacts = null;
    } else if (Array.isArray(mc)) {
      (formData as any).mutual_contacts = mc.map(String);
    } else if (typeof mc === 'string') {
      try {
        const parsed = JSON.parse(mc as string);
        (formData as any).mutual_contacts = Array.isArray(parsed) ? parsed.map(String) : (mc as string).split(',').map((s) => s.trim()).filter(Boolean);
      } catch {
        (formData as any).mutual_contacts = (mc as string).split(',').map((s) => s.trim()).filter(Boolean);
      }
    }
    delete (formData as any).mutual_contact_ids;
  }

  // Allow partial updates; if core identity fields provided validate them
  if (formData.first_name || formData.last_name || formData.email) {
    const mapped = mapContact(formData);
    if (mapped.error) {
      return {
        data: null,
        error: { message: mapped.error, status: null },
        status: null,
      } as Result<unknown>;
    }
    return userCrud.updateRow("contacts", mapped.payload ?? {}, { eq: { id: contactId } });
  }

  return userCrud.updateRow("contacts", formData, { eq: { id: contactId } });
}

export async function deleteContact(
  userId: string,
  contactId: string
): Promise<Result<null>> {
  const userCrud = withUser(userId);
  return userCrud.deleteRow("contacts", { eq: { id: contactId } });
}

// Contact Interactions CRUD helpers (user-scoped)
export async function listContactInteractions(
  userId: string,
  opts?: ListOptions
): Promise<Result<unknown[]>> {
  const userCrud = withUser(userId);
  return userCrud.listRows("contact_interactions", "*", opts);
}

export async function getContactInteraction(
  userId: string,
  interactionId: string
): Promise<Result<unknown | null>> {
  const userCrud = withUser(userId);
  return userCrud.getRow("contact_interactions", "*", {
    eq: { id: interactionId },
    single: true,
  });
}

export async function createContactInteraction(
  userId: string,
  formData: Record<string, unknown>
): Promise<Result<unknown>> {
  const mapped = mapContactInteraction(formData);
  if (mapped.error) {
    return {
      data: null,
      error: { message: mapped.error, status: null },
      status: null,
    } as Result<unknown>;
  }
  const userCrud = withUser(userId);
  return userCrud.insertRow("contact_interactions", mapped.payload ?? {});
}

export async function updateContactInteraction(
  userId: string,
  interactionId: string,
  formData: Record<string, unknown>
): Promise<Result<unknown>> {
  const userCrud = withUser(userId);
  return userCrud.updateRow("contact_interactions", formData, {
    eq: { id: interactionId },
  });
}

export async function deleteContactInteraction(
  userId: string,
  interactionId: string
): Promise<Result<null>> {
  const userCrud = withUser(userId);
  return userCrud.deleteRow("contact_interactions", { eq: { id: interactionId } });
}

// =====================================================================
// CONTACT REMINDERS MAPPERS (contact_reminders table)
// =====================================================================

/**
 * mapContactReminder()
 * Normalize and validate reminder rows for `contact_reminders` table.
 */
export const mapContactReminder = (
  formData: Record<string, unknown>
): MapperResult<Record<string, unknown>> => {
  const contact_id = formData.contact_id as string | undefined;
  if (!contact_id) return { error: "contact_id is required" };

  // Parse remind_at and completed_at into full ISO timestamps if possible
  function parseIso(v: unknown): string | null {
    if (v == null) return null;
    try {
      const d = v instanceof Date ? v : new Date(String(v));
      if (!Number.isNaN(d.getTime())) return d.toISOString();
    } catch {
      return null;
    }
    return null;
  }

  const remind_at = parseIso(formData.remind_at ?? formData.reminder_time);
  const completed_at = parseIso(formData.completed_at);

  // frequency_interval stored as bigint; accept numeric or string
  let frequency_interval: number | null = null;
  if (formData.frequency_interval != null) {
    const n = Number((formData.frequency_interval as unknown) ?? NaN);
    frequency_interval = Number.isNaN(n) ? null : Math.floor(n);
  }

  const reminder_type = (formData.reminder_type as string) ?? null;

  const payload: Record<string, unknown> = {
    contact_id,
    remind_at,
    frequency_interval,
    completed_at,
    reminder_type,
  };

  return { payload };
};

// Contact Reminders CRUD helpers (user-scoped)
export async function listContactReminders(
  userId: string,
  opts?: ListOptions
): Promise<Result<unknown[]>> {
  const userCrud = withUser(userId);
  return userCrud.listRows("contact_reminders", "*", opts);
}

export async function getContactReminder(
  userId: string,
  reminderId: string
): Promise<Result<unknown | null>> {
  const userCrud = withUser(userId);
  return userCrud.getRow("contact_reminders", "*", {
    eq: { id: reminderId },
    single: true,
  });
}

export async function createContactReminder(
  userId: string,
  formData: Record<string, unknown>
): Promise<Result<unknown>> {
  const mapped = mapContactReminder(formData);
  if (mapped.error) {
    return {
      data: null,
      error: { message: mapped.error, status: null },
      status: null,
    } as Result<unknown>;
  }
  const userCrud = withUser(userId);
  return userCrud.insertRow("contact_reminders", mapped.payload ?? {});
}

export async function updateContactReminder(
  userId: string,
  reminderId: string,
  formData: Record<string, unknown>
): Promise<Result<unknown>> {
  const userCrud = withUser(userId);
  // If core fields are provided (contact_id or remind_at), validate via mapper
  if (formData.contact_id != null || formData.remind_at != null) {
    const mapped = mapContactReminder({ ...formData, contact_id: formData.contact_id });
    if (mapped.error) {
      return {
        data: null,
        error: { message: mapped.error, status: null },
        status: null,
      } as Result<unknown>;
    }
    return userCrud.updateRow("contact_reminders", mapped.payload ?? {}, {
      eq: { id: reminderId },
    });
  }

  return userCrud.updateRow("contact_reminders", formData, { eq: { id: reminderId } });
}

export async function deleteContactReminder(
  userId: string,
  reminderId: string
): Promise<Result<null>> {
  const userCrud = withUser(userId);
  return userCrud.deleteRow("contact_reminders", { eq: { id: reminderId } });
}

// =====================================================================
// NETWORKING ANALYTICS
// =====================================================================

/**
 * Fetch networking analytics from server
 * Calculates comprehensive metrics on networking effectiveness
 */
export async function getNetworkingAnalytics(
  userId: string,
  authToken: string,
  timeRange: string = "30d"
): Promise<Result<unknown>> {
  try {
    const response = await fetch("http://localhost:8787/api/analytics/networking", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${authToken}`,
      },
      body: JSON.stringify({ timeRange }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        data: null,
        error: {
          message: errorData.error || "Failed to fetch networking analytics",
          status: response.status,
        },
        status: response.status,
      };
    }

    const result = await response.json();
    return {
      data: result.data,
      error: null,
      status: response.status,
    };
  } catch (err: any) {
    return {
      data: null,
      error: {
        message: err.message || "Network error fetching analytics",
        status: null,
      },
      status: null,
    };
  }
}

/**
 * GET SALARY ANALYTICS
 * 
 * Fetch comprehensive salary progression and negotiation analytics
 * Calculates salary progression over time, negotiation success rates,
 * compensation evolution, and career advancement impact on earnings
 */
export async function getSalaryAnalytics(
  userId: string,
  authToken: string,
  timeRange: string = "all"
): Promise<Result<unknown>> {
  try {
    const response = await fetch("http://localhost:8787/api/analytics/salary", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${authToken}`,
      },
      body: JSON.stringify({ timeRange }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        data: null,
        error: {
          message: errorData.error || "Failed to fetch salary analytics",
          status: response.status,
        },
        status: response.status,
      };
    }

    const result = await response.json();
    return {
      data: result,
      error: null,
      status: response.status,
    };
  } catch (err: any) {
    return {
      data: null,
      error: {
        message: err.message || "Network error fetching salary analytics",
        status: null,
      },
      status: null,
    };
  }
}

// =====================================================================
// NETWORKING EVENTS (networking_events table)
// =====================================================================

/**
 * mapNetworkingEvent()
 * Normalize and validate networking event rows for `networking_events` table.
 */
export const mapNetworkingEvent = (
  formData: Record<string, unknown>
): MapperResult<Record<string, unknown>> => {
  // small helper to parse Date/ISO-ish values into full ISO strings
  function parseIso(v: unknown): string | null {
    if (v == null) return null;
    try {
      const d = v instanceof Date ? v : new Date(String(v));
      if (!Number.isNaN(d.getTime())) return d.toISOString();
    } catch {
      return null;
    }
    return null;
  }

  const name = (formData.name as string) ?? null;
  const location = (formData.location as string) ?? null;
  const url = (formData.url as string) ?? null;
  const start_time = parseIso(formData.start_time ?? formData.startTime ?? formData.starts_at);
  const end_time = parseIso(formData.end_time ?? formData.endTime ?? formData.ends_at);
  const goals = (formData.goals as string) ?? null;
  const research_notes = (formData.research_notes as string) ?? (formData.researchNotes as string) ?? null;
  const preparation_notes = (formData.preparation_notes as string) ?? (formData.preparationNotes as string) ?? null;
  const industry = (formData.industry as string) ?? null;
  const attended = formData.attended === true ? true : formData.attended === false ? false : null;

  const payload: Record<string, unknown> = {
    name: name && String(name).trim() ? String(name).trim() : null,
    location: location && String(location).trim() ? String(location).trim() : null,
    url: url && String(url).trim() ? String(url).trim() : null,
    start_time,
    end_time,
    goals: goals ?? null,
    research_notes,
    preparation_notes,
    industry,
    attended,
  };

  return { payload };
};

// Networking Events CRUD helpers (user-scoped)
export async function listNetworkingEvents(
  userId: string,
  opts?: ListOptions
): Promise<Result<unknown[]>> {
  const userCrud = withUser(userId);
  return userCrud.listRows("networking_events", "*", opts);
}

export async function getNetworkingEvent(
  userId: string,
  eventId: string
): Promise<Result<unknown | null>> {
  const userCrud = withUser(userId);
  return userCrud.getRow("networking_events", "*", { eq: { id: eventId }, single: true });
}

export async function createNetworkingEvent(
  userId: string,
  formData: Record<string, unknown>
): Promise<Result<unknown>> {
  const mapped = mapNetworkingEvent(formData);
  if (mapped.error) {
    return {
      data: null,
      error: { message: mapped.error, status: null },
      status: null,
    } as Result<unknown>;
  }
  const userCrud = withUser(userId);
  return userCrud.insertRow("networking_events", mapped.payload ?? {});
}

export async function updateNetworkingEvent(
  userId: string,
  eventId: string,
  formData: Record<string, unknown>
): Promise<Result<unknown>> {
  const userCrud = withUser(userId);

  // If core fields provided (name/start_time/end_time), normalize via mapper
  if (
    formData.name != null ||
    formData.start_time != null ||
    formData.end_time != null ||
    formData.startTime != null ||
    formData.endTime != null
  ) {
    const mapped = mapNetworkingEvent(formData);
    if (mapped.error) {
      return {
        data: null,
        error: { message: mapped.error, status: null },
        status: null,
      } as Result<unknown>;
    }
    return userCrud.updateRow("networking_events", mapped.payload ?? {}, { eq: { id: eventId } });
  }

  // Otherwise perform a partial update
  return userCrud.updateRow("networking_events", formData, { eq: { id: eventId } });
}

export async function deleteNetworkingEvent(
  userId: string,
  eventId: string
): Promise<Result<null>> {
  const userCrud = withUser(userId);
  return userCrud.deleteRow("networking_events", { eq: { id: eventId } });
}

// =====================================================================
// NETWORKING EVENT CONTACTS (networking_event_contacts table)
// =====================================================================

/**
 * mapNetworkingEventContact()
 * Normalize and validate rows for `networking_event_contacts` table.
 */
export const mapNetworkingEventContact = (
  formData: Record<string, unknown>
): MapperResult<Record<string, unknown>> => {
  const event_id = String(
    formData.event_id ?? formData.eventId ?? formData.event ?? ""
  ).trim();
  const contact_id = String(
    formData.contact_id ?? formData.contactId ?? formData.contact ?? ""
  ).trim();

  if (!event_id) return { error: "event_id is required" };
  if (!contact_id) return { error: "contact_id is required" };

  const payload: Record<string, unknown> = {
    event_id,
    contact_id,
    follow_up_required:
      formData.follow_up_required === true || formData.followUpRequired === true
        ? true
        : formData.follow_up_required === false || formData.followUpRequired === false
        ? false
        : null,
    follow_up_notes: (formData.follow_up_notes as string) ?? (formData.followUpNotes as string) ?? null,
  };

  return { payload };
};

// Networking Event Contacts CRUD helpers (user-scoped)
export async function listNetworkingEventContacts(
  userId: string,
  opts?: ListOptions
): Promise<Result<unknown[]>> {
  const userCrud = withUser(userId);
  return userCrud.listRows("networking_event_contacts", "*", opts);
}

export async function getNetworkingEventContact(
  userId: string,
  id: string | number
): Promise<Result<unknown | null>> {
  const userCrud = withUser(userId);
  return userCrud.getRow("networking_event_contacts", "*", { eq: { id }, single: true });
}

export async function createNetworkingEventContact(
  userId: string,
  formData: Record<string, unknown>
): Promise<Result<unknown>> {
  const mapped = mapNetworkingEventContact(formData);
  if (mapped.error) {
    return {
      data: null,
      error: { message: mapped.error, status: null },
      status: null,
    } as Result<unknown>;
  }
  const userCrud = withUser(userId);
  return userCrud.insertRow("networking_event_contacts", mapped.payload ?? {});
}

export async function updateNetworkingEventContact(
  userId: string,
  id: string | number,
  formData: Record<string, unknown>
): Promise<Result<unknown>> {
  const userCrud = withUser(userId);

  // If core identity fields provided, validate via mapper
  if (formData.event_id != null || formData.contact_id != null || formData.eventId != null || formData.contactId != null) {
    const mapped = mapNetworkingEventContact(formData);
    if (mapped.error) {
      return {
        data: null,
        error: { message: mapped.error, status: null },
        status: null,
      } as Result<unknown>;
    }
    return userCrud.updateRow("networking_event_contacts", mapped.payload ?? {}, { eq: { id } });
  }

  // Partial update
  return userCrud.updateRow("networking_event_contacts", formData, { eq: { id } });
}

export async function deleteNetworkingEventContact(
  userId: string,
  id: string | number
): Promise<Result<null>> {
  const userCrud = withUser(userId);
  return userCrud.deleteRow("networking_event_contacts", { eq: { id } });
}

// =====================================================================
// INFORMATIONAL INTERVIEWS (informational_interviews table)
// =====================================================================

/**
 * mapInformationalInterview()
 * Normalize and validate informational interview payloads.
 */
export const mapInformationalInterview = (
  formData: Record<string, unknown>
): MapperResult<Record<string, unknown>> => {
  const contact_id = String(
    formData.contact_id ?? formData.contactId ?? formData.contact ?? ""
  ).trim();

  if (!contact_id) return { error: "contact_id is required" };

  // Accept timestamps or date strings; convert to ISO if valid
  function toIso(v: unknown): string | null {
    if (v == null) return null;
    if (v instanceof Date && !Number.isNaN(v.getTime())) return v.toISOString();
    const s = String(v).trim();
    if (!s) return null;
    const d = new Date(s);
    return Number.isNaN(d.getTime()) ? null : d.toISOString();
  }

  const payload: Record<string, unknown> = {
    contact_id,
    request_template:
      (formData.request_template as Record<string, unknown>) ??
      (formData.requestTemplate as Record<string, unknown>) ??
      {},
    // Note: DB column is `prepartion_notes` (keeps DB naming/typo intact)
    prepartion_notes:
      (formData.prepartion_notes as Record<string, unknown>) ??
      (formData.preparationNotes as Record<string, unknown>) ??
      (formData.preparation_notes as Record<string, unknown>) ??
      {},
    interview_date: toIso(formData.interview_date ?? formData.interviewDate ?? null),
    additional_notes:
      (formData.additional_notes as string) ?? (formData.additionalNotes as string) ?? null,
    // Status: optional textual status (e.g., 'confirmed', 'completed', 'ignored')
    status: (formData.status as string) ?? null,
  };

  return { payload };
};

// CRUD helpers for informational_interviews (user-scoped)
export async function listInformationalInterviews(
  userId: string,
  opts?: ListOptions
): Promise<Result<unknown[]>> {
  const userCrud = withUser(userId);
  return userCrud.listRows("informational_interviews", "*", opts);
}

export async function getInformationalInterview(
  userId: string,
  id: string | number
): Promise<Result<unknown | null>> {
  const userCrud = withUser(userId);
  return userCrud.getRow("informational_interviews", "*", { eq: { id }, single: true });
}

export async function createInformationalInterview(
  userId: string,
  formData: Record<string, unknown>
): Promise<Result<unknown>> {
  const mapped = mapInformationalInterview(formData);
  if (mapped.error) {
    return {
      data: null,
      error: { message: mapped.error, status: null },
      status: null,
    } as Result<unknown>;
  }
  const userCrud = withUser(userId);
  return userCrud.insertRow("informational_interviews", mapped.payload ?? {});
}

export async function updateInformationalInterview(
  userId: string,
  id: string | number,
  formData: Record<string, unknown>
): Promise<Result<unknown>> {
  const userCrud = withUser(userId);

  // If identity fields present, validate full payload via mapper
  if (
    formData.contact_id != null ||
    formData.contactId != null ||
    formData.request_template != null ||
    formData.prepartion_notes != null ||
    formData.status != null
  ) {
    const mapped = mapInformationalInterview(formData);
    if (mapped.error) {
      return {
        data: null,
        error: { message: mapped.error, status: null },
        status: null,
      } as Result<unknown>;
    }
    return userCrud.updateRow("informational_interviews", mapped.payload ?? {}, { eq: { id } });
  }

  // Partial update allowed
  return userCrud.updateRow("informational_interviews", formData, { eq: { id } });
}

export async function deleteInformationalInterview(
  userId: string,
  id: string | number
): Promise<Result<null>> {
  const userCrud = withUser(userId);
  return userCrud.deleteRow("informational_interviews", { eq: { id } });
}
