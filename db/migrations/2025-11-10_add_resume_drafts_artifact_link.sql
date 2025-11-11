-- Migration: Add source_artifact_id to resume_drafts table
-- Created: 2025-11-10
-- Purpose: Link resume drafts to the AI artifact they were generated from (if any)
--          This allows tracking which drafts originated from AI generation vs manual creation

-- Add source_artifact_id column
ALTER TABLE public.resume_drafts
ADD COLUMN IF NOT EXISTS source_artifact_id uuid;

-- Add foreign key constraint if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'resume_drafts_source_artifact_fkey'
  ) THEN
    ALTER TABLE public.resume_drafts
      ADD CONSTRAINT resume_drafts_source_artifact_fkey
      FOREIGN KEY (source_artifact_id) REFERENCES public.ai_artifacts(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Create index for querying drafts by source artifact
CREATE INDEX IF NOT EXISTS idx_resume_drafts_source_artifact
  ON public.resume_drafts(source_artifact_id)
  WHERE source_artifact_id IS NOT NULL;

-- Add helpful comment
COMMENT ON COLUMN public.resume_drafts.source_artifact_id IS 'Optional link to the AI artifact this draft was generated from. NULL for manually created drafts.';
