/**
 * Shared Services
 * Barrel export for simplified imports
 */

// Core database and client
export * from "./crud";
export { supabase } from "./supabaseClient";

// Specialized services
export * from "./jobMaterials";
export * from "./dbMappers";
export * from "./documents";
export * from "./aiArtifacts";

// Utilities
export * from "./cache";
export * from "./fetchCompanyNews";

// Re-export all common types for convenience
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
