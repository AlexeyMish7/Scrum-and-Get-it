-- Migration: Update analytics_type values to use dash-separated format
-- Purpose: Align database values with new format: document-match-score, skills-gap, etc.
-- Date: 2025-11-18

-- Update existing records to use dash-separated format
UPDATE public.analytics_cache
SET analytics_type = CASE analytics_type
  WHEN 'match_score' THEN 'document-match-score'
  WHEN 'skills_gap' THEN 'skills-gap'
  WHEN 'company_research' THEN 'company-research'
  WHEN 'interview_prep' THEN 'interview-prep'
  ELSE analytics_type
END
WHERE analytics_type IN ('match_score', 'skills_gap', 'company_research', 'interview_prep');

-- Update the CHECK constraint to accept new format
ALTER TABLE public.analytics_cache
  DROP CONSTRAINT IF EXISTS analytics_cache_analytics_type_check;

ALTER TABLE public.analytics_cache
  ADD CONSTRAINT analytics_cache_analytics_type_check
  CHECK (analytics_type IN ('document-match-score', 'skills-gap', 'company-research', 'interview-prep'));

-- Update comment
COMMENT ON COLUMN public.analytics_cache.analytics_type IS 'Type of analytics: document-match-score, skills-gap, company-research, interview-prep';

