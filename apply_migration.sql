-- Apply the documents project_id migration
-- This script can be run safely multiple times (idempotent)

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
    
    RAISE NOTICE 'Added project_id column and foreign key to documents table';
  ELSE
    RAISE NOTICE 'project_id column already exists in documents table';
  END IF;
END$$;