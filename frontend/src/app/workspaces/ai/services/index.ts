/**
 * AI Workspace Services
 * Barrel export for simplified imports
 */

// AI generation services
export * from "./aiGeneration";
export { default as aiGeneration } from "./aiGeneration";
export { default as aiClient } from "./client";

// Resume draft management services
export * from "./resumeDraftsService";
export * from "./resumeDraftsCache";
export * from "./resumeVersionService";
export * from "./resumeDraftsMigration";

// Cover letter draft services
export * as coverLetterDraftsApi from "./coverLetterDraftsApi";

// Job materials linking
export * from "./jobMaterialsService";

// Dashboard data aggregation
export * from "./dashboardService";
