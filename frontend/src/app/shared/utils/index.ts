/**
 * SHARED UTILITIES - Barrel Export
 *
 * Central export point for all shared utility functions.
 * Import from here to maintain consistent module boundaries.
 */

// Date formatting and parsing (SQL + UI)
export * from "./dateUtils";

// Sprint 2 task mapping and ownership
export { pageTaskMap } from "./pageTaskMap";
export { taskOwners } from "./taskOwners";

// Request optimization (prevents duplicate API calls)
export * from "./requestDeduplication";

// Accessibility testing (dev/test environments only)
export * from "./a11yAudit";
