-- Migration: Fix analytics_cache for profile-aware caching
-- Date: 2025-11-18
-- Purpose:
--   1. Add missing unique constraint for upsert operations
--   2. Add profile_version column to track profile state changes
--   3. Enable automatic cache invalidation when profile changes

-- Step 1: Add unique constraint (required for ON CONFLICT upserts)
ALTER TABLE public.analytics_cache
  ADD CONSTRAINT analytics_cache_unique_entry
  UNIQUE (user_id, job_id, analytics_type);

-- Step 2: Add profile_version column
ALTER TABLE public.analytics_cache
  ADD COLUMN IF NOT EXISTS profile_version text;

-- Step 3: Create index for profile_version lookups
CREATE INDEX IF NOT EXISTS idx_analytics_cache_profile_version
  ON public.analytics_cache(profile_version);

-- Step 4: Add helpful comments
COMMENT ON CONSTRAINT analytics_cache_unique_entry ON public.analytics_cache IS
  'Ensures one analytics entry per user/job/type combination. Required for upsert operations.';

COMMENT ON COLUMN public.analytics_cache.profile_version IS
  'ISO timestamp representing profile state when analytics were generated. Cache is invalidated when current profile version differs from stored version.';

-- Verification query (optional - can be run separately)
-- SELECT
--   table_name,
--   constraint_name,
--   constraint_type
-- FROM information_schema.table_constraints
-- WHERE table_name = 'analytics_cache'
--   AND constraint_name = 'analytics_cache_unique_entry';

