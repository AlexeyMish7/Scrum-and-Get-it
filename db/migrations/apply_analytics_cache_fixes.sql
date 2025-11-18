-- Apply analytics_cache table fixes
-- Run this in your Supabase SQL Editor

-- Step 1: Rename table from job_analytics_cache to analytics_cache
\i 2025-11-18_rename_job_analytics_cache_table.sql

-- Step 2: Update analytics type values to dash-separated format
\i 2025-11-18_update_analytics_types_format.sql

-- Verify the changes
SELECT
  table_name,
  constraint_name,
  constraint_type
FROM information_schema.table_constraints
WHERE table_name = 'analytics_cache'
ORDER BY constraint_type, constraint_name;

-- Check current analytics types in use
SELECT DISTINCT analytics_type, COUNT(*) as count
FROM public.analytics_cache
GROUP BY analytics_type;

