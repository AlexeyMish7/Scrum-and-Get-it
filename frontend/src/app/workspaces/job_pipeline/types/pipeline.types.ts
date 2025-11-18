/**
 * PIPELINE TYPES
 * Pipeline stages, transitions, and workflow types.
 */

/**
 * Pipeline stages (kanban columns)
 * Order matters for funnel analytics and UI progression.
 */
export type PipelineStage =
  | "Interested"
  | "Applied"
  | "Phone Screen"
  | "Interview"
  | "Offer"
  | "Rejected";

export const PIPELINE_STAGES = [
  "Interested",
  "Applied",
  "Phone Screen",
  "Interview",
  "Offer",
  "Rejected",
] as const;

/**
 * Job list filter options
 * Used for search, filtering, and pagination.
 */
export interface JobFilters {
  // Search query (title, company, description)
  search?: string;

  // Filter by pipeline stage
  stage?: PipelineStage | "All";

  // Filter by industry
  industry?: string;

  // Filter by job type
  jobType?: string;

  // Salary range filters
  minSalary?: number;
  maxSalary?: number;

  // Date range filters (ISO strings)
  deadlineBefore?: string;
  deadlineAfter?: string;
  createdBefore?: string;
  createdAfter?: string;

  // Pagination
  limit?: number;
  offset?: number;

  // Sorting
  sortBy?: "created_at" | "application_deadline" | "company_name" | "job_title";
  sortOrder?: "asc" | "desc";
}

/**
 * Pagination result
 */
export interface PaginatedJobs {
  jobs: Array<{
    id: number;
    user_id?: string;
    job_title?: string;
    company_name?: string;
    job_status?: string;
    created_at?: string;
    [key: string]: unknown;
  }>;
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}
