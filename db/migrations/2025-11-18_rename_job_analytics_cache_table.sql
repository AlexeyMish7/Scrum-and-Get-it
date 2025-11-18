-- Migration: Rename job_analytics_cache to analytics_cache
-- Purpose: Align table name with code that uses analytics_cache
-- Date: 2025-11-18

-- Rename the table
ALTER TABLE IF EXISTS public.job_analytics_cache
  RENAME TO analytics_cache;

-- Update constraint names to match new table name
ALTER TABLE public.analytics_cache
  RENAME CONSTRAINT job_analytics_cache_pkey TO analytics_cache_pkey;

ALTER TABLE public.analytics_cache
  RENAME CONSTRAINT job_analytics_cache_user_id_fkey TO analytics_cache_user_id_fkey;

ALTER TABLE public.analytics_cache
  RENAME CONSTRAINT job_analytics_cache_job_id_fkey TO analytics_cache_job_id_fkey;

ALTER TABLE public.analytics_cache
  RENAME CONSTRAINT job_analytics_cache_unique_entry TO analytics_cache_unique_entry;

-- Update index names
ALTER INDEX IF EXISTS idx_job_analytics_cache_user_id
  RENAME TO idx_analytics_cache_user_id;

ALTER INDEX IF EXISTS idx_job_analytics_cache_job_id
  RENAME TO idx_analytics_cache_job_id;

ALTER INDEX IF EXISTS idx_job_analytics_cache_type
  RENAME TO idx_analytics_cache_type;

ALTER INDEX IF EXISTS idx_job_analytics_cache_expires_at
  RENAME TO idx_analytics_cache_expires_at;

ALTER INDEX IF EXISTS idx_job_analytics_cache_match_score
  RENAME TO idx_analytics_cache_match_score;

-- Update trigger name
DROP TRIGGER IF EXISTS job_analytics_cache_updated_at_trigger ON public.analytics_cache;

CREATE TRIGGER analytics_cache_updated_at_trigger
  BEFORE UPDATE ON public.analytics_cache
  FOR EACH ROW
  EXECUTE FUNCTION update_job_analytics_cache_updated_at();

-- Rename the trigger function for consistency
ALTER FUNCTION update_job_analytics_cache_updated_at()
  RENAME TO update_analytics_cache_updated_at;

-- Update the trigger to use the renamed function
DROP TRIGGER IF EXISTS analytics_cache_updated_at_trigger ON public.analytics_cache;

CREATE TRIGGER analytics_cache_updated_at_trigger
  BEFORE UPDATE ON public.analytics_cache
  FOR EACH ROW
  EXECUTE FUNCTION update_analytics_cache_updated_at();

-- Drop old view
DROP VIEW IF EXISTS public.v_active_job_analytics;

-- Recreate view with new table name
CREATE OR REPLACE VIEW public.v_active_analytics AS
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
FROM public.analytics_cache
WHERE expires_at > now();

-- Grant permissions on view
GRANT SELECT ON public.v_active_analytics TO authenticated;

-- Update cleanup function
DROP FUNCTION IF EXISTS cleanup_expired_analytics();

CREATE OR REPLACE FUNCTION cleanup_expired_analytics()
RETURNS integer AS $$
DECLARE
  deleted_count integer;
BEGIN
  DELETE FROM public.analytics_cache
  WHERE expires_at <= now();

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION cleanup_expired_analytics() TO authenticated;

-- Update table comment
COMMENT ON TABLE public.analytics_cache IS 'Caches AI-generated analytics for jobs to improve performance and reduce API costs';

