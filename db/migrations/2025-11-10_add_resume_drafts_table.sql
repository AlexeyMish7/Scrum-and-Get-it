-- Migration: Add resume_drafts table for storing user resume drafts
-- Created: 2025-11-10
-- Purpose: Move resume draft storage from localStorage to database for persistence,
--          multi-device sync, and better querying capabilities

-- Drop existing table if this is a re-run (dev only)
-- DROP TABLE IF EXISTS public.resume_drafts CASCADE;

-- Create resume_drafts table
CREATE TABLE IF NOT EXISTS public.resume_drafts (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,

  -- Basic draft info
  name text NOT NULL,
  template_id text DEFAULT 'classic', -- 'classic', 'modern', 'minimal', etc.

  -- Resume content (structured JSON)
  content jsonb NOT NULL DEFAULT '{}'::jsonb,

  -- Metadata about sections and state
  metadata jsonb NOT NULL DEFAULT '{"sections": [], "jobId": null, "jobTitle": null, "jobCompany": null}'::jsonb,

  -- Version tracking
  version integer NOT NULL DEFAULT 1,
  is_active boolean NOT NULL DEFAULT true, -- soft delete support

  -- Timestamps
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  last_accessed_at timestamptz DEFAULT now()
);

-- Add foreign key constraint if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'resume_drafts_user_id_fkey'
  ) THEN
    ALTER TABLE public.resume_drafts
      ADD CONSTRAINT resume_drafts_user_id_fkey
      FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_resume_drafts_user_id ON public.resume_drafts(user_id);
CREATE INDEX IF NOT EXISTS idx_resume_drafts_updated_at ON public.resume_drafts(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_resume_drafts_is_active ON public.resume_drafts(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_resume_drafts_template ON public.resume_drafts(template_id);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_resume_drafts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS resume_drafts_updated_at_trigger ON public.resume_drafts;
CREATE TRIGGER resume_drafts_updated_at_trigger
  BEFORE UPDATE ON public.resume_drafts
  FOR EACH ROW
  EXECUTE FUNCTION update_resume_drafts_updated_at();

-- Row Level Security (RLS)
ALTER TABLE public.resume_drafts ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own drafts
DROP POLICY IF EXISTS "Users can view own resume drafts" ON public.resume_drafts;
CREATE POLICY "Users can view own resume drafts"
  ON public.resume_drafts
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own drafts
DROP POLICY IF EXISTS "Users can insert own resume drafts" ON public.resume_drafts;
CREATE POLICY "Users can insert own resume drafts"
  ON public.resume_drafts
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own drafts
DROP POLICY IF EXISTS "Users can update own resume drafts" ON public.resume_drafts;
CREATE POLICY "Users can update own resume drafts"
  ON public.resume_drafts
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own drafts
DROP POLICY IF EXISTS "Users can delete own resume drafts" ON public.resume_drafts;
CREATE POLICY "Users can delete own resume drafts"
  ON public.resume_drafts
  FOR DELETE
  USING (auth.uid() = user_id);

-- Add helpful comment
COMMENT ON TABLE public.resume_drafts IS 'Stores user resume drafts with versioning and soft delete support';
COMMENT ON COLUMN public.resume_drafts.content IS 'Resume content as JSON: {summary, skills, experience, education, projects}';
COMMENT ON COLUMN public.resume_drafts.metadata IS 'Draft metadata: {sections[], jobId, jobTitle, jobCompany, lastModified, createdAt}';
COMMENT ON COLUMN public.resume_drafts.template_id IS 'Template identifier for styling (classic, modern, minimal)';
COMMENT ON COLUMN public.resume_drafts.is_active IS 'Soft delete flag - false means draft is archived/deleted';
COMMENT ON COLUMN public.resume_drafts.version IS 'Version number for optimistic locking and history';
