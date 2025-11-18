/**
 * SERVICES BARREL EXPORT
 *
 * Centralized export for all server-side services.
 * Provides a single import point for AI, database, and orchestration services.
 *
 * Structure:
 * - AI Client: OpenAI/Azure integration (aiClient)
 * - Orchestrators: End-to-end AI generation flows (orchestrator)
 * - Supabase: Database and artifact persistence (supabaseAdmin)
 * - Company Research: External data fetching (companyResearchService)
 * - Cover Letter Drafts: CRUD operations for drafts (coverLetterDraftsService)
 * - Scraper: Browser-based content extraction (scraper)
 *
 * Usage:
 *   import { aiClient, supabaseAdmin } from './services/index.js';
 *   import * as orchestrator from './services/index.js';
 */

// ===== AI CLIENT =====
// Unified interface for OpenAI/Azure LLM calls
export { default as aiClient } from "./aiClient.js";
export type { GenerateOptions, GenerateResult } from "./aiClient.js";

// ===== ORCHESTRATORS =====
// High-level AI generation flows (resume, cover letter, skills, experience)
// Note: Import as namespace to avoid polluting top-level exports
//   import * as orchestrator from './services/index.js';
//   orchestrator.handleGenerateResume({ userId, jobId, options });
export * as orchestrator from "./orchestrator.js";

// ===== SUPABASE ADMIN =====
// Server-side database client with service role access
export { default as supabaseAdmin } from "./supabaseAdmin.js";
export {
  insertAiArtifact,
  getProfile,
  getComprehensiveProfile,
  getJob,
  listAiArtifactsForUser,
  getAiArtifactForUser,
  getDocumentForUser,
  insertJobMaterials,
  listJobMaterialsForJob,
} from "./supabaseAdmin.js";

// ===== COMPANY RESEARCH =====
// External company data aggregation for cover letter personalization
export {
  fetchCompanyResearch,
  extractCompanyName,
  type CompanyResearch,
  type CompanyNews,
  type CompanyCulture,
  type CompanyLeader,
} from "./companyResearchService.js";

// ===== COVER LETTER DRAFTS =====
// CRUD operations for cover letter drafts table
export {
  listCoverLetterDrafts,
  getCoverLetterDraft,
  createCoverLetterDraft,
  updateCoverLetterDraft,
  deleteCoverLetterDraft,
  type CoverLetterDraftRow,
  type CreateCoverLetterDraftInput,
  type UpdateCoverLetterDraftInput,
} from "./coverLetterDraftsService.js";

// ===== SCRAPER =====
// Puppeteer-based browser automation for JS-rendered content
export {
  scrapeWithBrowser,
  closeBrowser,
  type ScraperOptions,
  type ScraperResult,
} from "./scraper.js";
