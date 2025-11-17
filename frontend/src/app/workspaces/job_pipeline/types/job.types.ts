/**
 * JOB ENTITY TYPES
 * Core job data structures and database types.
 */

import type { JobRow } from "@shared/types/database";

// Re-export database type for convenience
export type { JobRow };

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
  job_status?: string;
}
