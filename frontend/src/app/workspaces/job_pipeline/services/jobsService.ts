/**
 * JOBS SERVICE LAYER
 * Centralized service for Jobs table CRUD operations.
 *
 * PURPOSE:
 * - Abstract Supabase/database access for Jobs workspace
 * - Provide consistent error handling and Result<T> types
 * - Enable testing, caching, and optimistic updates
 * - Separate data access from UI components
 *
 * PATTERNS:
 * - All operations scoped to user via withUser(userId)
 * - Returns Result<T> type: { data, error, status }
 * - Pagination support with limit/offset
 * - Optional filtering and sorting
 *
 * USAGE:
 * ```ts
 * import jobsService from "@job_pipeline/services/jobsService";
 * const { data, error } = await jobsService.listJobs(user.id, { limit: 50 });
 * ```
 */

import * as crud from "@shared/services/crud";
import type { Result } from "@shared/services/types";
import type { JobRow } from "@shared/types/database";
import type {
  JobFormData,
  JobFilters,
  PaginatedJobs,
} from "@job_pipeline/types";
import { dataCache, getCacheKey } from "@shared/services/cache";
import { deduplicateRequest } from "@shared/utils";
import { supabase } from "@shared/services/supabaseClient";
import { checkAndCreateAchievement } from "../../team_management/services/progressSharingService";
import { getAppQueryClient } from "@shared/cache";
import { coreKeys } from "@shared/cache/coreQueryKeys";
import { fetchCoreJobs } from "@shared/cache/coreFetchers";

// Cache TTL for job data (5 minutes)
const JOBS_CACHE_TTL = 5 * 60 * 1000;

function normalizeString(v: unknown): string {
  return String(v ?? "").toLowerCase();
}

function getJobUnknownField(job: JobRow, field: string): unknown {
  return (job as unknown as Record<string, unknown>)[field];
}

function applyClientSideFilters(all: JobRow[], filters?: JobFilters): JobRow[] {
  if (!filters) return all;

  let out = all;

  // Stage filter
  if (filters.stage && filters.stage !== "All") {
    out = out.filter(
      (j) => String(j.job_status ?? "") === String(filters.stage)
    );
  }

  // Industry filter
  if (filters.industry) {
    const want = normalizeString(filters.industry);
    out = out.filter((j) => normalizeString(j.industry).includes(want));
  }

  // Job type filter
  if (filters.jobType) {
    const want = String(filters.jobType);
    out = out.filter(
      (j) => String(getJobUnknownField(j, "job_type") ?? "") === want
    );
  }

  // Search across title/company/description
  if (filters.search) {
    const q = normalizeString(filters.search);
    out = out.filter((j) => {
      const hay =
        normalizeString(j.job_title) +
        " " +
        normalizeString(j.company_name) +
        " " +
        normalizeString(getJobUnknownField(j, "job_description"));
      return hay.includes(q);
    });
  }

  // Salary range (best-effort)
  if (typeof filters.minSalary === "number") {
    out = out.filter((j) => {
      const val = Number(getJobUnknownField(j, "start_salary_range") ?? 0);
      return Number.isFinite(val) && val >= filters.minSalary!;
    });
  }
  if (typeof filters.maxSalary === "number") {
    out = out.filter((j) => {
      const val = Number(
        getJobUnknownField(j, "end_salary_range") ??
          getJobUnknownField(j, "start_salary_range") ??
          0
      );
      return Number.isFinite(val) && val <= filters.maxSalary!;
    });
  }

  // Date filters (best-effort ISO comparisons)
  const toTime = (d?: string | null) => {
    if (!d) return null;
    const t = new Date(String(d)).getTime();
    return Number.isFinite(t) ? t : null;
  };

  if (filters.deadlineAfter || filters.deadlineBefore) {
    const after = toTime(filters.deadlineAfter) ?? null;
    const before = toTime(filters.deadlineBefore) ?? null;
    out = out.filter((j) => {
      const t = toTime(getJobUnknownField(j, "application_deadline") ?? null);
      if (t == null) return true;
      if (after != null && t < after) return false;
      if (before != null && t > before) return false;
      return true;
    });
  }

  if (filters.createdAfter || filters.createdBefore) {
    const after = toTime(filters.createdAfter) ?? null;
    const before = toTime(filters.createdBefore) ?? null;
    out = out.filter((j) => {
      const t = toTime(j.created_at ?? null);
      if (t == null) return true;
      if (after != null && t < after) return false;
      if (before != null && t > before) return false;
      return true;
    });
  }

  return out;
}

function applyClientSideSort(rows: JobRow[], filters?: JobFilters): JobRow[] {
  const sortBy = filters?.sortBy ?? "created_at";
  const sortOrder = filters?.sortOrder ?? "desc";
  const dir = sortOrder === "asc" ? 1 : -1;

  const toTime = (d: unknown) => {
    const t = new Date(String(d ?? "")).getTime();
    return Number.isFinite(t) ? t : 0;
  };

  const out = [...rows];
  out.sort((a, b) => {
    if (sortBy === "created_at")
      return dir * (toTime(a.created_at) - toTime(b.created_at));
    if (sortBy === "application_deadline")
      return (
        dir *
        (toTime(getJobUnknownField(a, "application_deadline")) -
          toTime(getJobUnknownField(b, "application_deadline")))
      );
    if (sortBy === "company_name")
      return (
        dir *
        String(a.company_name ?? "").localeCompare(String(b.company_name ?? ""))
      );
    if (sortBy === "job_title")
      return (
        dir * String(a.job_title ?? "").localeCompare(String(b.job_title ?? ""))
      );
    return 0;
  });
  return out;
}

function applyPagination(rows: JobRow[], filters?: JobFilters): JobRow[] {
  const offset = filters?.offset ?? 0;
  const limit = filters?.limit;
  if (!limit) return offset ? rows.slice(offset) : rows;
  return rows.slice(offset, offset + limit);
}

/**
 * LIST JOBS: Retrieve jobs for a user with optional filters and pagination.
 *
 * Inputs:
 * - userId: User UUID (RLS scope)
 * - filters?: Optional filtering, sorting, pagination options
 *
 * Outputs:
 * - Result<JobRow[]> or Result<PaginatedJobs> if pagination requested
 *
 * Error modes:
 * - Database connection errors
 * - RLS policy violations (should not occur with proper userId)
 */
const listJobs = async (
  userId: string,
  filters?: JobFilters
): Promise<Result<JobRow[]>> => {
  // Generate deduplication key based on user and filters
  const filterKey = filters
    ? `-${filters.stage || "all"}-${filters.search || ""}-${
        filters.sortBy || "created_at"
      }`
    : "";
  const dedupKey = `jobs-list-${userId}${filterKey}`;

  // Deduplicate the request to prevent parallel fetches of same data
  return deduplicateRequest(dedupKey, async () => {
    // Prefer the app-wide React Query cache so jobs are loaded once per session
    // and reused across workspaces (AI hub, pipeline, analytics, etc.).
    try {
      const qc = getAppQueryClient();
      const all = await qc.ensureQueryData({
        queryKey: coreKeys.jobs(userId),
        queryFn: () => fetchCoreJobs<JobRow>(userId),
        staleTime: 60 * 60 * 1000,
      });

      const allJobs = Array.isArray(all) ? (all as JobRow[]) : [];
      const filtered = applyClientSideFilters(allJobs, filters);
      const sorted = applyClientSideSort(filtered, filters);
      const paged = applyPagination(sorted, filters);

      // Keep legacy 5-min in-memory cache populated for older call sites.
      const cacheKey = getCacheKey("jobs", userId, "list");
      dataCache.set(cacheKey, paged, JOBS_CACHE_TTL);

      return { data: paged, error: null, status: null };
    } catch {
      // Fallback to direct Supabase read if cache/persistence is unavailable.
      const userCrud = crud.withUser(userId);
      const result = await userCrud.listRows<JobRow>("jobs", "*", {
        order: {
          column: filters?.sortBy ?? "created_at",
          ascending: (filters?.sortOrder ?? "desc") === "asc",
        },
      });
      return result;
    }
  });
};

/**
 * GET JOB: Retrieve a single job by ID.
 *
 * Inputs:
 * - userId: User UUID (RLS scope)
 * - jobId: Job ID (bigint as number)
 *
 * Outputs:
 * - Result<JobRow | null>
 *
 * Error modes:
 * - Job not found (returns null data, no error)
 * - Job belongs to different user (RLS blocks, returns error)
 */
const getJob = async (
  userId: string,
  jobId: number
): Promise<Result<JobRow | null>> => {
  const dedupKey = `job-${jobId}-${userId}`;

  return deduplicateRequest(dedupKey, async () => {
    // Prefer the shared core jobs cache to avoid redundant Supabase reads.
    // If the job isn't present in cache (deleted/stale), fall back to a direct fetch.
    try {
      const qc = getAppQueryClient();
      const all = await qc.ensureQueryData({
        queryKey: coreKeys.jobs(userId),
        queryFn: () => fetchCoreJobs<JobRow>(userId),
        staleTime: 60 * 60 * 1000,
      });
      const allJobs = Array.isArray(all) ? (all as JobRow[]) : [];
      const found = allJobs.find((j) => j.id === jobId) ?? null;
      if (found) return { data: found, error: null, status: null };
    } catch {
      // ignore and fall back
    }

    const userCrud = crud.withUser(userId);
    return await userCrud.getRow("jobs", "*", {
      eq: { id: jobId },
      single: true,
    });
  });
};

/**
 * CREATE JOB: Create a new job entry.
 *
 * Inputs:
 * - userId: User UUID (RLS scope, auto-injected)
 * - formData: Job creation payload (validates job_title and company_name)
 *
 * Outputs:
 * - Result<JobRow> with created job data
 *
 * Error modes:
 * - Validation error (missing required fields)
 * - Database constraint violations
 * - Profile not found (auto-creates if missing)
 */
const createJob = async (
  userId: string,
  formData: JobFormData
): Promise<Result<JobRow>> => {
  // Validate required fields
  if (!formData.job_title || !formData.job_title.trim()) {
    return {
      data: null,
      error: { message: "Job title is required", status: null },
      status: null,
    } as Result<JobRow>;
  }
  if (!formData.company_name || !formData.company_name.trim()) {
    return {
      data: null,
      error: { message: "Company name is required", status: null },
      status: null,
    } as Result<JobRow>;
  }

  // Ensure profile exists before creating job (jobs table has FK to profiles)
  // This handles users who signed up before the auto-create profile trigger was deployed
  const { data: profileData, error: profileCheckError } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", userId)
    .single();

  // If no profile exists, create a minimal one using auth user's email
  if (!profileData && !profileCheckError) {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        return {
          data: null,
          error: {
            message: "Authentication required to add jobs.",
            status: null,
          },
          status: null,
        } as Result<JobRow>;
      }

      const minimalProfile = {
        id: userId,
        first_name: user.user_metadata?.first_name || "User",
        last_name: user.user_metadata?.last_name || "",
        email: user.email || "",
      };

      // Create profile directly since profiles table uses 'id' not 'user_id'
      const { error: profileError } = await supabase
        .from("profiles")
        .insert(minimalProfile);

      if (profileError) {
        console.error("Profile creation failed:", profileError);
        return {
          data: null,
          error: {
            message: "Failed to create profile. Please try again.",
            status: null,
          },
          status: null,
        } as Result<JobRow>;
      }
    } catch (err) {
      console.error("Profile creation error:", err);
      return {
        data: null,
        error: {
          message: "Failed to initialize profile. Please try again.",
          status: null,
        },
        status: null,
      } as Result<JobRow>;
    }
  }

  const userCrud = crud.withUser(userId);

  // Build database payload
  const formRecord = formData as unknown as Record<string, unknown>;
  const payload: Record<string, unknown> = {
    job_title: formData.job_title.trim(),
    company_name: formData.company_name.trim(),
    street_address: formData.street_address ?? null,
    city_name: formData.city_name ?? null,
    state_code: formData.state_code ?? null,
    zipcode: formData.zipcode ?? null,
    start_salary_range: formData.start_salary_range ?? null,
    end_salary_range: formData.end_salary_range ?? null,
    job_link: formData.job_link ?? null,
    application_deadline: formData.application_deadline ?? null,
    job_description: formData.job_description ?? null,
    industry: formData.industry ?? null,
    job_type: formData.job_type ?? null,
    location_type: formRecord["location_type"] ?? null,
    // Default to "Interested" if no status provided
    job_status: formData.job_status ?? "Interested",
    status_changed_at: new Date().toISOString(),
  };

  const result = await userCrud.insertRow<JobRow>("jobs", payload, "*");

  if (result.data && !result.error) {
    // Keep app-wide cache in sync so other workspaces see the new job immediately.
    try {
      const qc = getAppQueryClient();
      qc.setQueryData(coreKeys.jobs(userId), (old: unknown) => {
        const existing = Array.isArray(old) ? (old as JobRow[]) : [];
        const inserted = result.data as JobRow;
        return [inserted, ...existing.filter((j) => j.id !== inserted.id)];
      });
    } catch {
      // ignore
    }

    // Legacy in-memory cache invalidation for older call sites.
    dataCache.invalidatePattern(new RegExp(`^jobs-${userId}`));

    // Trigger achievement check for application milestone
    // Get user's team to check for achievements
    try {
      const { data: teamMember } = await supabase
        .from("team_members")
        .select("team_id")
        .eq("user_id", userId)
        .eq("is_active", true)
        .limit(1)
        .single();

      if (teamMember?.team_id) {
        // Check for application milestones (1st, 10th, 25th, etc.)
        checkAndCreateAchievement(
          userId,
          teamMember.team_id,
          "application_added"
        ).catch((err) => {
          console.error("Failed to check achievement:", err);
        });
      }
    } catch {
      // Silently fail - achievement is optional
    }
  }

  return result;
};

/**
 * UPDATE JOB: Update fields on a job entry.
 *
 * Outputs:
 * - Result<JobRow> with updated job data
 *
 * Error modes:
 * - Job belongs to different user (RLS blocks)
 * - Validation error (if updating required fields to invalid values)
 */
const updateJob = async (
  userId: string,
  jobId: number,
  updates: Partial<JobFormData>
): Promise<Result<JobRow>> => {
  // Validate if updating required fields
  if (updates.job_title !== undefined && !updates.job_title.trim()) {
    return {
      data: null,
      error: { message: "Job title cannot be empty", status: null },
      status: null,
    } as Result<JobRow>;
  }
  if (updates.company_name !== undefined && !updates.company_name.trim()) {
    return {
      data: null,
      error: { message: "Company name cannot be empty", status: null },
      status: null,
    } as Result<JobRow>;
  }

  const userCrud = crud.withUser(userId);

  // Build update payload (only include provided fields)
  const payload: Record<string, unknown> = {};
  const keys = Object.keys(updates) as Array<keyof JobFormData>;

  for (const key of keys) {
    const value = updates[key];
    if (value !== undefined) {
      payload[key] = value;
    }
  }

  // Update status_changed_at if job_status is being changed
  if (updates.job_status !== undefined) {
    payload.status_changed_at = new Date().toISOString();
  }

  const result = await userCrud.updateRow<JobRow>(
    "jobs",
    payload,
    { eq: { id: jobId } },
    "*"
  );

  // Invalidate cache on successful update
  if (result.data && !result.error) {
    try {
      const qc = getAppQueryClient();
      qc.setQueryData(coreKeys.jobs(userId), (old: unknown) => {
        const existing = Array.isArray(old) ? (old as JobRow[]) : [];
        const updated = result.data as JobRow;
        return existing.map((j) => (j.id === updated.id ? updated : j));
      });
    } catch {
      // ignore
    }

    dataCache.invalidatePattern(new RegExp(`^jobs-${userId}`));
  }

  return result;
};

/**
 * DELETE JOB: Permanently delete a job entry.
 *
 * Inputs:
 * - userId: User UUID (RLS scope)
 * - jobId: Job ID (bigint as number)
 *
 * Outputs:
 * - Result<null> (null data on success)
 *
 * Error modes:
 * - Job not found
 * - Job belongs to different user (RLS blocks)
 * - Cascade delete errors (if job has related records)
 */
const deleteJob = async (
  userId: string,
  jobId: number
): Promise<Result<null>> => {
  const userCrud = crud.withUser(userId);
  const result = await userCrud.deleteRow("jobs", { eq: { id: jobId } });

  // Invalidate cache on successful delete
  if (!result.error) {
    try {
      const qc = getAppQueryClient();
      qc.setQueryData(coreKeys.jobs(userId), (old: unknown) => {
        const existing = Array.isArray(old) ? (old as JobRow[]) : [];
        return existing.filter((j) => j.id !== jobId);
      });
    } catch {
      // ignore
    }

    dataCache.invalidatePattern(new RegExp(`^jobs-${userId}`));
  }

  return result;
};

/**
 * ARCHIVE JOB: Soft delete by updating status to "Rejected" or a future archive status.
 * (For now, uses "Rejected" status. Future: add dedicated archive column)
 *
 * Inputs:
 * - userId: User UUID (RLS scope)
 * - jobId: Job ID (bigint as number)
 *
 * Outputs:
 * - Result<JobRow> with archived job data
 */
const archiveJob = async (
  userId: string,
  jobId: number
): Promise<Result<JobRow>> => {
  // For now, archiving means moving to "Rejected" status
  // Future: add dedicated `archived` boolean column
  return updateJob(userId, jobId, { job_status: "Rejected" });
};

/**
 * COUNT JOBS: Get total count of jobs (useful for pagination metadata).
 *
 * Inputs:
 * - userId: User UUID (RLS scope)
 * - filters?: Optional filters to count subset
 *
 * Outputs:
 * - Result<number> with count
 *
 * Note: For now, we fetch all jobs and count client-side.
 * Future: Add count RPC function to database for performance.
 */
const countJobs = async (
  userId: string,
  filters?: JobFilters
): Promise<Result<number>> => {
  // Fetch without pagination to get count
  const result = await listJobs(userId, {
    ...filters,
    limit: undefined,
    offset: undefined,
  });

  if (result.error) {
    return {
      data: null,
      error: result.error,
      status: result.status,
    } as Result<number>;
  }

  const count = Array.isArray(result.data) ? result.data.length : 0;
  return {
    data: count,
    error: null,
    status: result.status,
  };
};

/**
 * LIST JOBS PAGINATED: Convenience wrapper that returns pagination metadata.
 *
 * Inputs:
 * - userId: User UUID
 * - filters: Filters including limit and offset
 *
 * Outputs:
 * - Result<PaginatedJobs> with jobs array, total count, and hasMore flag
 */
const listJobsPaginated = async (
  userId: string,
  filters: JobFilters
): Promise<Result<PaginatedJobs>> => {
  const limit = filters.limit ?? 50;
  const offset = filters.offset ?? 0;

  // Fetch jobs with pagination
  const jobsResult = await listJobs(userId, filters);

  if (jobsResult.error) {
    return {
      data: null,
      error: jobsResult.error,
      status: jobsResult.status,
    } as Result<PaginatedJobs>;
  }

  // Get total count (for now, fetch all - future: optimize with count RPC)
  const countResult = await countJobs(userId, filters);
  const total = countResult.data ?? 0;

  const jobs = Array.isArray(jobsResult.data) ? jobsResult.data : [];
  const hasMore = offset + jobs.length < total;

  return {
    data: {
      jobs,
      total,
      limit,
      offset,
      hasMore,
    },
    error: null,
    status: jobsResult.status,
  };
};

export default {
  listJobs,
  getJob,
  createJob,
  updateJob,
  deleteJob,
  archiveJob,
  countJobs,
  listJobsPaginated,
};
