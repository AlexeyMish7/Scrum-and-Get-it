-- Migration: Add storage.object RLS policies for avatars bucket
-- Date: 2025-11-03
-- Purpose: Ensure authenticated users can read/write objects under their own prefix

BEGIN;

DO $$
BEGIN
  -- Create read policy for avatars if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'avatars_read_own'
  ) THEN
    EXECUTE $SQL$
      CREATE POLICY "avatars_read_own"
        ON storage.objects
        FOR SELECT
        USING (
          bucket_id = 'avatars' AND (split_part(name,'/',1))::uuid = auth.uid()
        );
    $SQL$;
  END IF;

  -- Create write policy for avatars if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'avatars_write_own'
  ) THEN
    EXECUTE $SQL$
      CREATE POLICY "avatars_write_own"
        ON storage.objects
        FOR INSERT
        WITH CHECK (
          bucket_id = 'avatars' AND (split_part(name,'/',1))::uuid = auth.uid()
        );
    $SQL$;
  END IF;

END$$;

COMMIT;
