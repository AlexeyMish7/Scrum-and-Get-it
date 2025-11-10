/**
 * Routes Barrel Export
 *
 * Re-exports all route handler modules for convenient importing.
 *
 * Usage:
 *   import { handleHealth, handleGenerateResume, handleListArtifacts } from './routes/index.js';
 */

// Health route
export {
  handleHealth,
  type HealthCounters,
  type HealthCheckOptions,
} from "./health.js";

// AI generation routes
export {
  handleGenerateResume,
  handleGenerateCoverLetter,
  handleSkillsOptimization,
  handleExperienceTailoring,
  type GenerationCounters,
} from "./ai.js";

// Artifact and job materials routes
export {
  handleListArtifacts,
  handleGetArtifact,
  handleCreateJobMaterials,
  handleListJobMaterialsForJob,
} from "./artifacts.js";

// Cover letter drafts routes
export {
  handleListDrafts,
  handleGetDraft,
  handleCreateDraft,
  handleUpdateDraft,
  handleDeleteDraft,
} from "./coverLetterDrafts.js";
