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

// Cache TTL for job data (5 minutes)
const JOBS_CACHE_TTL = 5 * 60 * 1000;

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
    // Check cache first (only for simple queries without complex filters)
    const useCache = !filters?.search && !filters?.stage && !filters?.industry;
    if (useCache) {
      const cacheKey = getCacheKey("jobs", userId, "list");
      const cached = dataCache.get<JobRow[]>(cacheKey);
      if (cached) {
        return { data: cached, error: null, status: null };
      }
    }

    const userCrud = crud.withUser(userId);

    // Build query options from filters
    const options: Record<string, unknown> = {};

    // Sorting
    if (filters?.sortBy) {
      options.order = {
        column: filters.sortBy,
        ascending: filters.sortOrder === "asc",
      };
    } else {
      // Default sort: most recent first
      options.order = { column: "created_at", ascending: false };
    }

    // Pagination
    if (filters?.limit) {
      options.limit = filters.limit;
    }
    if (filters?.offset) {
      options.offset = filters.offset;
    }

    // Filtering (stage, industry, job_type)
    // Note: Search filtering requires more complex query building (ILIKE)
    // For now, we'll do basic equality filters and handle search client-side
    // Future: Move to RPC function for full-text search
    const eqFilters: Record<string, unknown> = {};
    if (filters?.stage && filters.stage !== "All") {
      eqFilters.job_status = filters.stage;
    }
    if (filters?.industry) {
      eqFilters.industry = filters.industry;
    }
    if (filters?.jobType) {
      eqFilters.job_type = filters.jobType;
    }
    if (Object.keys(eqFilters).length > 0) {
      options.eq = eqFilters;
    }

    // Range filters for salary and dates
    // Future enhancement: add gte/lte support to crud layer
    // For now, we'll fetch all and filter client-side for complex queries

    const result = await userCrud.listRows<JobRow>("jobs", "*", options);

    // Cache successful results (only for simple queries)
    if (useCache && result.data && !result.error) {
      const cacheKey = getCacheKey("jobs", userId, "list");
      dataCache.set(cacheKey, result.data, JOBS_CACHE_TTL);
    }

    return result;
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

  const userCrud = crud.withUser(userId);

  // Build database payload
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
    location_type: (formData as any).location_type ?? null,
    // Default to "Interested" if no status provided
    job_status: formData.job_status ?? "Interested",
    status_changed_at: new Date().toISOString(),
  };

  const result = await userCrud.insertRow<JobRow>("jobs", payload, "*");

  // Invalidate cache on successful insert
  if (result.data && !result.error) {
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
 * UPDATE JOB: Update an existing job entry (partial updates supported).
 *
 * Inputs:
 * - userId: User UUID (RLS scope)
 * - jobId: Job ID (bigint as number)
 * - updates: Partial job data to update
 *
 * Outputs:
 * - Result<JobRow> with updated job data
 *
 * Error modes:
 * - Job not found
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
