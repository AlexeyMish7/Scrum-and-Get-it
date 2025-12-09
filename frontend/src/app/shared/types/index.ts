/**
 * SHARED TYPES
 *
 * Central export point for all shared type definitions.
 * Import types from here rather than individual files.
 *
 * Usage:
 *   import type { Profile, Job, ApiResponse } from '@shared/types';
 */

// Database types (raw DB rows)
export type {
  UserOwnedRow,
  ProfileRow,
  EducationRow,
  EmploymentRow,
  SkillRow,
  ProjectRow,
  CertificationRow,
  JobRow,
  DocumentRow,
  AIArtifactRow,
  JobMaterialRow,
  JobNoteRow,
} from "./database";

// Domain types (business entities)
export type {
  Profile,
  Education,
  Employment,
  Skill,
  Project,
  Certification,
  Job,
  Document,
  AIArtifact,
  JobMaterial,
  JobNote,
} from "./domain";

// API types (requests/responses)
export type {
  ApiResponse,
  ApiError,
  PaginationParams,
  PaginationMeta,
  PaginatedResponse,
  SortParams,
  FilterParams,
  ListParams,
  GenerateResumeRequest,
  GenerateResumeResponse,
  GenerateCoverLetterRequest,
  GenerateCoverLetterResponse,
  CompanyResearchRequest,
  CompanyResearchResponse,
  JobMatchRequest,
  JobMatchResponse,
} from "./api";

export type { ApiLogEntry } from "./apiLog";
export type { SupabaseLogEntry } from "./supabaseLog";
