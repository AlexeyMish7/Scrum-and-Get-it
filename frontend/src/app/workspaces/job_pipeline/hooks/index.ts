/**
 * JOB PIPELINE HOOKS (Barrel Export)
 *
 * Organized hooks for Jobs workspace state management:
 *
 * Core Pipeline Hooks:
 * - useJobsPipeline: Centralized state for entire pipeline (kanban board)
 * - useJobMatch: AI-powered job matching with cache integration
 *
 * Data Management Hooks:
 * - useJobsPagination: Infinite scroll pagination for job lists
 * - useJobsSearch: Debounced search with client-side caching
 *
 * All hooks integrate with:
 * - @shared/context/AuthContext for user authentication
 * - @shared/hooks/useErrorHandler for error notifications
 * - @job_pipeline/services for data layer operations
 */

// =====================================================================
// CORE PIPELINE STATE
// =====================================================================
export { useJobsPipeline } from "./useJobsPipeline";
export { useJobMatch } from "./useJobMatch";

// =====================================================================
// DATA MANAGEMENT
// =====================================================================
export { useJobsPagination } from "./useJobsPagination";
export { useJobsSearch } from "./useJobsSearch";
