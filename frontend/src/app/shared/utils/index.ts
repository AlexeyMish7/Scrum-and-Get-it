/**
 * SHARED UTILITIES - Central Export
 *
 * Pure utility functions with no dependencies on React or UI.
 * Safe to use anywhere in the app (components, services, hooks).
 */

// =====================================================================
// DATE & TIME UTILITIES
// =====================================================================

// SQL date formatting, parsing, and validation
export * from "./dateUtils";

// =====================================================================
// REQUEST OPTIMIZATION
// =====================================================================

// Prevent duplicate concurrent API calls (reduces server load)
export * from "./requestDeduplication";

// =====================================================================
// DEVELOPMENT TOOLS
// =====================================================================

// Accessibility audit (dev/test only, no-op in production)
export * from "./a11yAudit";
