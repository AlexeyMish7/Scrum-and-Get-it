/**
 * SHARED SERVICES - Central Export
 *
 * Core database operations, AI backend integration, and utility services.
 * All services use proper auth, error handling, and type safety.
 */

// =====================================================================
// CORE DATABASE & AUTH
// =====================================================================

// Supabase client (singleton with RLS)
export { supabase } from "./supabaseClient";

// CRUD operations with user scoping
export * from "./crud";

// =====================================================================
// CURRENT SERVICES (Use these for new code)
// =====================================================================

// Document management (resumes, cover letters, portfolios)
// - Replaces legacy ai_artifacts
// - Supports versioning, exports, file storage
// - Links to jobs via document_jobs table
// ⚠️ Prefer these typed document functions over dbMappers versions
export * from "./documents";

// =====================================================================
// DATABASE MAPPERS & VALIDATION
// =====================================================================

// 18 table mappers with form validation
// Note: listDocuments and getDocument are excluded (use documents.ts typed versions)
export {
  // Utility formatters
  formatToSqlDate,
  // Job mappers
  mapJob,
  listJobs,
  getJob,
  createJob,
  updateJob,
  deleteJob,
  // Job notes
  listJobNotes,
  getJobNote,
  createJobNote,
  updateJobNote,
  deleteJobNote,
  // Cover letter drafts
  listCoverLetterDrafts,
  getCoverLetterDraft,
  createCoverLetterDraft,
  updateCoverLetterDraft,
  deleteCoverLetterDraft,
  // Companies
  listCompanies,
  getCompany,
  createCompany,
  updateCompany,
  deleteCompany,
  // User company notes
  listUserCompanyNotes,
  getUserCompanyNote,
  createUserCompanyNote,
  updateUserCompanyNote,
  deleteUserCompanyNote,
  // Templates
  listTemplates,
  getTemplate,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  // Themes
  listThemes,
  getTheme,
  createTheme,
  updateTheme,
  deleteTheme,
  // Documents (except listDocuments and getDocument - use documents.ts)
  mapDocument,
  createDocument,
  updateDocument,
  deleteDocument,
  // Document versions
  listDocumentVersions,
  getDocumentVersion,
  createDocumentVersion,
  // Generation sessions
  listGenerationSessions,
  getGenerationSession,
  createGenerationSession,
  updateGenerationSession,
  // Export history
  listExportHistory,
  getExportHistory,
  createExportHistory,
  // Analytics cache
  listAnalyticsCache,
  getAnalyticsCache,
  createAnalyticsCache,
  // Document-job linking
  listDocumentJobs,
  getDocumentJob,
  createDocumentJob,
  updateDocumentJob,
  deleteDocumentJob,
} from "./dbMappers";

// =====================================================================
// LEGACY SERVICES (⚠️ DEPRECATED - Read-only, do not use for new code)
// =====================================================================

// Legacy AI artifacts service
// ⚠️ DEPRECATED: Use documents.ts for new code
// This service is kept for reading historical data only
export * from "./aiArtifacts";

// Legacy job materials linking
// ⚠️ DEPRECATED: Use document_jobs table directly for new code
// This service is kept for reading historical data only
export * from "./jobMaterials";

// =====================================================================
// UTILITIES
// =====================================================================

// In-memory cache with TTL
export * from "./cache";

// External company news API
export * from "./fetchCompanyNews";

// =====================================================================
// TYPE RE-EXPORTS (for convenience)
// =====================================================================

export type {
  CrudError,
  Result,
  ListOptions,
  FilterOptions,
  ProfileRow,
  Project,
} from "./types";
export type { AiArtifactRow, AiArtifactKind } from "./types/aiArtifacts";
export type { DocumentKind, DocumentRow } from "./documents";
