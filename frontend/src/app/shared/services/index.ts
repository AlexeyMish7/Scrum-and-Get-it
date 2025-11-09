/**
 * Shared Services
 * Barrel export for simplified imports
 */

export * from './crud';
export { supabase } from './supabaseClient';
export * from './jobMaterials';
export type { CrudError } from './types';
export type { AiArtifactRow } from './types/aiArtifacts';
