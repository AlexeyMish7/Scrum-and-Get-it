/**
 * Services barrel export
 *
 * Re-exports all service modules from the services directory.
 * This provides a single import point for all server-side services.
 *
 * Usage:
 *   import { handleGenerateResume, aiClient, supabaseAdmin } from './services/index.js';
 */

// Re-export orchestrator functions
export {
  handleGenerateResume,
  handleGenerateCoverLetter,
  handleSkillsOptimization,
  handleExperienceTailoring,
} from "./orchestrator.js";

// Re-export AI client
export { default as aiClient } from "./aiClient.js";
export type { GenerateOptions, GenerateResult } from "./aiClient.js";

// Re-export Supabase admin client and helpers
export { default as supabaseAdmin, insertAiArtifact } from "./supabaseAdmin.js";
