-- Migration: Add nullable project_id foreign key to documents
-- Purpose: allow documents to reference a project (optional). This improves
-- discoverability (documents list can show related project) and allows UI
-- linking between Projects and Documents.

-- Safe, idempotent: only add column/index if not already present.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'documents' AND column_name = 'project_id'
  ) THEN
    ALTER TABLE public.documents
      ADD COLUMN project_id uuid NULL;

    -- Add FK constraint referencing projects(id). Use ON DELETE SET NULL so
    -- documents remain if a project is removed but the link clears.
    ALTER TABLE public.documents
      ADD CONSTRAINT documents_project_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE SET NULL;

    CREATE INDEX IF NOT EXISTS idx_documents_project_id ON public.documents(project_id);
  END IF;
END$$;

-- Rollback (manual):
-- To remove this change, run:
-- ALTER TABLE public.documents DROP CONSTRAINT IF EXISTS documents_project_fkey;
-- DROP INDEX IF EXISTS idx_documents_project_id;
-- ALTER TABLE public.documents DROP COLUMN IF EXISTS project_id;

-- Notes:
-- - This migration is intentionally conservative: `project_id` is nullable so
--   existing documents remain valid and no immediate backfill is required.
-- - We use ON DELETE SET NULL to avoid cascading deletes of documents when a
--   project is removed. If you want stricter referential integrity change to
--   ON DELETE CASCADE after reviewing data retention policy.
