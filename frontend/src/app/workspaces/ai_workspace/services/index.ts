/**
 * AI WORKSPACE SERVICES (Barrel Export)
 *
 * Services included:
 * - aiGenerationService: ✅ Backend integrated - AI document generation with database persistence
 * - templateService: ✅ Database integrated - Fetch templates from database with static fallback
 * - themeService: ⏳ Static only - Visual theme management (needs themes table)
 * - versionService: ⏳ In-memory only - Document version control (needs document_versions table)
 * - exportService: ⏳ Placeholders - Document export (needs backend export API)
 * - companyResearchService: ✅ Backend integrated - Company research with shared cache
 *
 * Backend Integration Status:
 * ✅ AI Generation: POST /api/generate/resume, /api/generate/cover-letter
 * ✅ Templates: Fetches from templates table via @shared/services/crud
 * ✅ Documents: Saves to documents + document_versions tables
 * ✅ Company Research: GET /api/company/research (7-day shared cache)
 * ⏳ Themes: TODO - Connect to themes table
 * ⏳ Export: TODO - Connect to backend export API
 */

// =====================================================================
// AI GENERATION (Backend Integration)
// =====================================================================
export * from "./aiGenerationService";
export { default as aiGenerationService } from "./aiGenerationService";

// =====================================================================
// TEMPLATE SERVICE (Database Integration)
// =====================================================================
export * from "./templateService";

// =====================================================================
// THEME SERVICE (Database Integration)
// =====================================================================
export * from "./themeService";

// =====================================================================
// COMPANY RESEARCH SERVICE (Backend Integration)
// =====================================================================
export * from "./companyResearchService";

// =====================================================================
// DOCUMENT SERVICES (In-Memory/Placeholder)
// =====================================================================
export * from "./versionService";
export * from "./exportService";

// =====================================================================
// REVIEW SERVICE (UC-110: Collaborative Document Review)
// =====================================================================
export * from "./reviewService";

// =====================================================================
// SYSTEM DATA EXPORTS
// =====================================================================
export {
  SYSTEM_RESUME_TEMPLATES,
  SYSTEM_COVER_LETTER_TEMPLATES,
} from "./templates/systemTemplates";
export { SYSTEM_THEMES } from "./themes/systemThemes";
