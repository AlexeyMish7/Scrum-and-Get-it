/**
 * JOB PIPELINE TYPES INDEX
 * Central export point for all job pipeline types.
 *
 * Organized by domain:
 * - job.types.ts: Core job entity and form types
 * - pipeline.types.ts: Pipeline stages, filters, pagination
 * - analytics.types.ts: Statistics, metrics, match analysis
 * - navigation.types.ts: View types and navigation items
 */

// Job entity types
export type { JobRow, JobWithMetadata, JobFormData } from "./job.types";

// Pipeline types
export type {
  PipelineStage,
  JobFilters,
  PaginatedJobs,
} from "./pipeline.types";
export { PIPELINE_STAGES } from "./pipeline.types";

// Analytics types
export type {
  JobStats,
  AnalyticsCacheEntry,
  MatchData,
} from "./analytics.types";

// Navigation types
export type { JobsView, NavItem } from "./navigation.types";
export { NAV_ITEMS } from "./navigation.types";
