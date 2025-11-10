-- Migration: Add cover_letter_drafts table for storing user cover letter drafts
-- Created: 2025-11-10
-- Purpose: Store cover letter drafts with AI generation support, tone/style settings,
--          company research integration, and multi-device sync capabilities.
--          Mirrors resume_drafts architecture for consistency.

-- Drop existing table if this is a re-run (dev only)
-- DROP TABLE IF EXISTS public.cover_letter_drafts CASCADE;

-- Create cover_letter_drafts table
CREATE TABLE IF NOT EXISTS public.cover_letter_drafts (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,

  -- Basic draft info
  name text NOT NULL,
  template_id text DEFAULT 'formal', -- 'formal', 'creative', 'technical', 'modern', 'minimal'

  -- Job and company context
  job_id bigint, -- Optional link to jobs table
  company_name text, -- Target company name
  job_title text, -- Position title

  -- Cover letter content (structured JSON)
  -- Structure: { header: {name, address, contact}, opening: string, body: string[], closing: string }
  content jsonb NOT NULL DEFAULT '{}'::jsonb,

  -- Metadata about tone, style, and generation settings
  -- Structure: { tone: 'formal'|'casual'|'enthusiastic'|'analytical',
  --             length: 'brief'|'standard'|'detailed',
  --             culture: 'corporate'|'startup'|'creative',
  --             industry: string,
  --             companyResearch: {...},
  --             lastModified: timestamp }
  metadata jsonb NOT NULL DEFAULT '{"tone": "formal", "length": "standard", "culture": "corporate"}'::jsonb,

  -- Company research data (auto-fetched or manual)
  company_research jsonb DEFAULT '{}'::jsonb,

  -- Version tracking
  version integer NOT NULL DEFAULT 1,
  is_active boolean NOT NULL DEFAULT true, -- soft delete support

  -- Timestamps
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  last_accessed_at timestamptz DEFAULT now()
);

-- Add foreign key constraints
DO $$
BEGIN
  -- User FK
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'cover_letter_drafts_user_id_fkey'
  ) THEN
    ALTER TABLE public.cover_letter_drafts
      ADD CONSTRAINT cover_letter_drafts_user_id_fkey
      FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
  END IF;

  -- Job FK (optional - SET NULL on delete)
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'cover_letter_drafts_job_id_fkey'
  ) THEN
    ALTER TABLE public.cover_letter_drafts
      ADD CONSTRAINT cover_letter_drafts_job_id_fkey
      FOREIGN KEY (job_id) REFERENCES public.jobs(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_cover_letter_drafts_user_id ON public.cover_letter_drafts(user_id);
CREATE INDEX IF NOT EXISTS idx_cover_letter_drafts_job_id ON public.cover_letter_drafts(job_id);
CREATE INDEX IF NOT EXISTS idx_cover_letter_drafts_updated_at ON public.cover_letter_drafts(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_cover_letter_drafts_is_active ON public.cover_letter_drafts(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_cover_letter_drafts_template ON public.cover_letter_drafts(template_id);
CREATE INDEX IF NOT EXISTS idx_cover_letter_drafts_company ON public.cover_letter_drafts(company_name);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_cover_letter_drafts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS cover_letter_drafts_updated_at_trigger ON public.cover_letter_drafts;
CREATE TRIGGER cover_letter_drafts_updated_at_trigger
  BEFORE UPDATE ON public.cover_letter_drafts
  FOR EACH ROW
  EXECUTE FUNCTION update_cover_letter_drafts_updated_at();

-- Row Level Security (RLS)
ALTER TABLE public.cover_letter_drafts ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own drafts
DROP POLICY IF EXISTS "Users can view own cover letter drafts" ON public.cover_letter_drafts;
CREATE POLICY "Users can view own cover letter drafts"
  ON public.cover_letter_drafts
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own drafts
DROP POLICY IF EXISTS "Users can insert own cover letter drafts" ON public.cover_letter_drafts;
CREATE POLICY "Users can insert own cover letter drafts"
  ON public.cover_letter_drafts
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own drafts
DROP POLICY IF EXISTS "Users can update own cover letter drafts" ON public.cover_letter_drafts;
CREATE POLICY "Users can update own cover letter drafts"
  ON public.cover_letter_drafts
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own drafts
DROP POLICY IF EXISTS "Users can delete own cover letter drafts" ON public.cover_letter_drafts;
CREATE POLICY "Users can delete own cover letter drafts"
  ON public.cover_letter_drafts
  FOR DELETE
  USING (auth.uid() = user_id);

-- Add helpful comments
COMMENT ON TABLE public.cover_letter_drafts IS 'Stores user cover letter drafts with AI generation, tone settings, and company research integration';
COMMENT ON COLUMN public.cover_letter_drafts.content IS 'Cover letter content as JSON: {header, opening, body[], closing}';
COMMENT ON COLUMN public.cover_letter_drafts.metadata IS 'Draft metadata: {tone, length, culture, industry, companyResearch, lastModified}';
COMMENT ON COLUMN public.cover_letter_drafts.template_id IS 'Template identifier for styling (formal, creative, technical, modern, minimal)';
COMMENT ON COLUMN public.cover_letter_drafts.company_research IS 'Auto-fetched company information: {size, industry, mission, recentNews, competitors}';
COMMENT ON COLUMN public.cover_letter_drafts.is_active IS 'Soft delete flag - false means draft is archived/deleted';
COMMENT ON COLUMN public.cover_letter_drafts.version IS 'Version number for optimistic locking and history';
COMMENT ON COLUMN public.cover_letter_drafts.job_id IS 'Optional link to specific job application (FK to jobs table)';
