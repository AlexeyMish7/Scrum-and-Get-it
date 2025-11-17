-- Migration: Add job_analytics_cache table for storing AI-generated analytics
-- Purpose: Cache job analytics results (match scores, skills gaps, company research)
--          to avoid redundant API calls and improve performance.
--
-- Table structure:
-- - Unique constraint on (user_id, job_id, analytics_type) to prevent duplicates
-- - TTL field to manage cache expiration (default: 7 days)
-- - Metadata stores AI model info, confidence scores, etc.
-- - RLS policies ensure users only see their own analytics

-- Create analytics cache table
CREATE TABLE IF NOT EXISTS public.job_analytics_cache (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  job_id bigint NOT NULL,
  analytics_type text NOT NULL CHECK (analytics_type IN ('match_score', 'skills_gap', 'company_research', 'interview_prep')),

  -- Analytics data (JSONB for flexibility)
  data jsonb NOT NULL DEFAULT '{}'::jsonb,

  -- Match score specific fields (denormalized for quick queries)
  match_score integer CHECK (match_score IS NULL OR (match_score >= 0 AND match_score <= 100)),

  -- Metadata
  metadata jsonb DEFAULT '{}'::jsonb,

  -- Cache management
  generated_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '7 days'),

  -- Timestamps
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  -- Primary key
  CONSTRAINT job_analytics_cache_pkey PRIMARY KEY (id),

  -- Foreign keys
  CONSTRAINT job_analytics_cache_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE,
  CONSTRAINT job_analytics_cache_job_id_fkey FOREIGN KEY (job_id) REFERENCES public.jobs(id) ON DELETE CASCADE,

  -- Unique constraint: one analytics entry per user/job/type combination
  CONSTRAINT job_analytics_cache_unique_entry UNIQUE (user_id, job_id, analytics_type)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_job_analytics_cache_user_id ON public.job_analytics_cache(user_id);
CREATE INDEX IF NOT EXISTS idx_job_analytics_cache_job_id ON public.job_analytics_cache(job_id);
CREATE INDEX IF NOT EXISTS idx_job_analytics_cache_type ON public.job_analytics_cache(analytics_type);
CREATE INDEX IF NOT EXISTS idx_job_analytics_cache_expires_at ON public.job_analytics_cache(expires_at);
CREATE INDEX IF NOT EXISTS idx_job_analytics_cache_match_score ON public.job_analytics_cache(match_score) WHERE match_score IS NOT NULL;

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_job_analytics_cache_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER job_analytics_cache_updated_at_trigger
  BEFORE UPDATE ON public.job_analytics_cache
  FOR EACH ROW
  EXECUTE FUNCTION update_job_analytics_cache_updated_at();

-- RLS Policies
ALTER TABLE public.job_analytics_cache ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own analytics
CREATE POLICY "Users can view their own analytics"
  ON public.job_analytics_cache
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own analytics
CREATE POLICY "Users can insert their own analytics"
  ON public.job_analytics_cache
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own analytics
CREATE POLICY "Users can update their own analytics"
  ON public.job_analytics_cache
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own analytics
CREATE POLICY "Users can delete their own analytics"
  ON public.job_analytics_cache
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create view for active (non-expired) analytics
CREATE OR REPLACE VIEW public.v_active_job_analytics AS
SELECT
  id,
  user_id,
  job_id,
  analytics_type,
  data,
  match_score,
  metadata,
  generated_at,
  expires_at,
  created_at,
  updated_at,
  -- Calculate cache age in hours
  EXTRACT(EPOCH FROM (now() - generated_at)) / 3600 AS age_hours,
  -- Calculate time until expiration in hours
  EXTRACT(EPOCH FROM (expires_at - now())) / 3600 AS expires_in_hours
FROM public.job_analytics_cache
WHERE expires_at > now();

-- Grant permissions on view
GRANT SELECT ON public.v_active_job_analytics TO authenticated;

-- Function to clean up expired analytics (run periodically via cron or manually)
CREATE OR REPLACE FUNCTION cleanup_expired_analytics()
RETURNS integer AS $$
DECLARE
  deleted_count integer;
BEGIN
  DELETE FROM public.job_analytics_cache
  WHERE expires_at <= now();

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION cleanup_expired_analytics() TO authenticated;

COMMENT ON TABLE public.job_analytics_cache IS 'Caches AI-generated analytics for jobs to improve performance and reduce API costs';
COMMENT ON COLUMN public.job_analytics_cache.analytics_type IS 'Type of analytics: match_score, skills_gap, company_research, interview_prep';
COMMENT ON COLUMN public.job_analytics_cache.data IS 'Full analytics data in JSON format (flexible structure per type)';
COMMENT ON COLUMN public.job_analytics_cache.match_score IS 'Denormalized match score (0-100) for quick filtering';
COMMENT ON COLUMN public.job_analytics_cache.expires_at IS 'When this cache entry expires (default: 7 days from generation)';
COMMENT ON FUNCTION cleanup_expired_analytics() IS 'Deletes expired analytics cache entries. Returns count of deleted rows.';
