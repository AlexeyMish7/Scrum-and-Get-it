/**
 * Types barrel export
 *
 * Re-exports all type definitions from organized type modules.
 * This provides a single import point for types organized by domain.
 *
 * Usage:
 *   import type { GenerateResumeRequest, ArtifactRow } from './types/index.js';
 */

// API Request types
export type {
  GenerateResumeRequest,
  GenerateCoverLetterRequest,
  GenerateSkillsOptimizationRequest,
} from "./requests.js";

// Database row types
export type { ArtifactRow } from "./database.js";

// AI artifact content types
export type {
  ResumeArtifactContent,
  GenerateResumeResponse,
} from "./artifacts.js";
