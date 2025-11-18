/**
 * JOB PIPELINE SERVICES (Barrel Export)
 *
 * Organized services for Jobs workspace data layer:
 * - jobsService: Core CRUD operations for jobs table
 * - pipelineService: Pipeline stage transitions and grouping
 * - analyticsCache: AI analytics caching layer (match scores, research, etc.)
 *
 * All services use:
 * - @shared/services/crud for database operations (RLS-enforced)
 * - @shared/services/cache for in-memory caching
 * - @shared/services/types for Result<T> wrapper
 */

// =====================================================================
// CORE JOBS SERVICES
// =====================================================================
export { default as jobsService } from "./jobsService.js";
export { default as pipelineService } from "./pipelineService.js";

// =====================================================================
// ANALYTICS & CACHING
// =====================================================================
export * from "./analyticsCache.js";
