/**
 * SHARED TYPES FOR GENERATION ROUTES
 *
 * Common interfaces and types used across all AI generation endpoints.
 */

/**
 * Counters interface for tracking generation metrics
 */
export interface GenerationCounters {
  generate_total: number;
  generate_success: number;
  generate_fail: number;
}
