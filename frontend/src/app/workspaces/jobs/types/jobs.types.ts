/**
 * JOBS WORKSPACE TYPES
 * Domain types, form interfaces, and enums for Jobs workspace.
 * Separate from database types to allow transformation/mapping.
 */

import type { JobRow } from "@shared/types/database";

// Re-export database type for convenience
export type { JobRow };

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
 * Job form data (for creation and editing)
 * Maps user input to database schema fields.
 */
export interface JobFormData {
  // Required fields
  job_title: string;
  company_name: string;

  // Location fields (optional)
  street_address?: string;
  city_name?: string;
  state_code?: string;
  zipcode?: string;

  // Salary range (optional)
  start_salary_range?: number | null;
  end_salary_range?: number | null;

  // Application details (optional)
  job_link?: string | null;
  application_deadline?: string | null; // ISO date string or null
  job_description?: string | null;
  industry?: string | null;
  job_type?: string | null;

  // Pipeline status (defaults to "Interested" if not provided)
  job_status?: PipelineStage;
}

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
 * Job statistics and analytics data
 */
export interface JobStats {
  total: number;
  byStage: Record<PipelineStage, number>;
  responseRate: number; // Percentage of applications that got responses
  avgDaysInStage: Record<PipelineStage, number>;
}

/**
 * Job with calculated metadata
 * Extends JobRow with computed fields for UI display.
 */
export interface JobWithMetadata extends JobRow {
  daysInStage?: number;
  isOverdue?: boolean;
  daysUntilDeadline?: number;
}

/**
 * Pagination result
 */
export interface PaginatedJobs {
  jobs: JobRow[];
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}
