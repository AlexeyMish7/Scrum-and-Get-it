-- Migration: Add profile_version to analytics_cache
-- Purpose: Track which version of the profile was used for analytics generation
--          Invalidates cache automatically when profile changes
-- Date: 2025-11-18

-- Add profile_version column (stores hash/timestamp of profile state)
ALTER TABLE public.analytics_cache
  ADD COLUMN IF NOT EXISTS profile_version text;

-- Add index for performance (queries will filter by profile_version)
CREATE INDEX IF NOT EXISTS idx_analytics_cache_profile_version
  ON public.analytics_cache(profile_version);

-- Add comment
COMMENT ON COLUMN public.analytics_cache.profile_version IS
  'Hash or timestamp representing profile state when analytics were generated. Used to invalidate cache when profile changes.';

