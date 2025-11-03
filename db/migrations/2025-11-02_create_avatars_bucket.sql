-- Migration: Create storage bucket for profile avatars
-- Date: 2025-11-02
-- This uses Supabase's SQL helper to create a storage bucket named 'avatars'.
-- Note: The `storage.create_bucket` SQL function is available in Supabase-managed Postgres.
-- If the function is not available in your environment, create the bucket via the
-- Supabase dashboard or the Supabase CLI: `supabase storage bucket create avatars --public false`.

-- This migration is safe to rerun in environments where the function is absent
-- because it detects the absence and prints a notice instead of failing.

BEGIN;

DO $$
BEGIN
  -- Try to create a private bucket named 'avatars'
  BEGIN
    PERFORM storage.create_bucket('avatars', false);
    RAISE NOTICE 'Created storage bucket avatars';
  EXCEPTION WHEN undefined_function OR undefined_table THEN
    -- storage extension / helper not available in this environment
    RAISE NOTICE 'storage.create_bucket not available; create the avatars bucket using the Supabase dashboard or CLI.';
  WHEN unique_violation THEN
    -- bucket already exists or similar (ignore)
    RAISE NOTICE 'avatars bucket may already exist; skipping creation.';
  END;
END;
$$;

COMMIT;
