/**
 * Services barrel export
 *
 * Re-exports all service modules from their root-level locations.
 * This provides a single import point for services while maintaining
 * backward compatibility during the refactor process.
 *
 * Usage:
 *   import { orchestrator, aiClient, supabaseAdmin } from './services/index.js';
 *   // or import individually:
 *   import orchestrator from './services/index.js';
 */

// Re-export orchestrator functions
export {
  handleGenerateResume,
  handleGenerateCoverLetter,
  handleSkillsOptimization,
  handleExperienceTailoring,
} from "../../orchestrator.js";

// Re-export AI client
export { default as aiClient } from "../../aiClient.js";
export type { GenerateOptions, GenerateResult } from "../../aiClient.js";

// Re-export Supabase admin client and helpers
export {
  default as supabaseAdmin,
  insertAiArtifact,
} from "../../supabaseAdmin.js";
