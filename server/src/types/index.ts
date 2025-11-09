/**
 * Types barrel export
 *
 * Re-exports all type definitions from root-level types.ts.
 * This provides a single import point for types while maintaining
 * backward compatibility during the refactor process.
 *
 * Usage:
 *   import type { GenerateResumeRequest, ArtifactRow } from './types/index.js';
 */

export type {
  GenerateResumeRequest,
  GenerateCoverLetterRequest,
  GenerateSkillsOptimizationRequest,
  ArtifactRow,
  ResumeArtifactContent,
  GenerateResumeResponse,
} from "../../types.js";
