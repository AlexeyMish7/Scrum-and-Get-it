/**
 * Database Row Types
 *
 * Type definitions for database table rows.
 * These match the schema structure from Supabase/Postgres tables.
 */

/**
 * ArtifactRow
 * Represents a row from the ai_artifacts table.
 */
export interface ArtifactRow {
  id: string;
  user_id: string;
  job_id?: number | null;
  kind: string; // 'resume' | 'cover_letter' | 'skills_optimization' | 'company_research' | 'match' | 'gap_analysis'
  title?: string | null;
  prompt?: string | null;
  model?: string | null;
  content: unknown; // jsonb field, cast to specific artifact content type based on kind
  metadata?: Record<string, unknown> | null;
  created_at?: string;
  updated_at?: string;
}
