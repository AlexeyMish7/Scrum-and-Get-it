// Centralized type for document rows used across the app
// Updated to match new schema from 2025-11-17_ai_workspace_schema_redesign.sql
export type DocumentRow = {
  id: string;
  name?: string | null;
  created_at?: string | null;
};
