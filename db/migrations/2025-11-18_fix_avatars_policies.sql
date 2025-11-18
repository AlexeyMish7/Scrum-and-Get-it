-- Migration: Fix avatars bucket RLS policies to support upsert and delete
-- Date: 2025-11-18
-- Purpose: Add UPDATE and DELETE policies so users can replace/remove their own avatars

BEGIN;

DO $$
BEGIN
  -- Create UPDATE policy for avatars if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'avatars_update_own'
  ) THEN
    EXECUTE $SQL$
      CREATE POLICY "avatars_update_own"
        ON storage.objects
        FOR UPDATE
        USING (
          bucket_id = 'avatars' AND (split_part(name,'/',1))::uuid = auth.uid()
        )
        WITH CHECK (
          bucket_id = 'avatars' AND (split_part(name,'/',1))::uuid = auth.uid()
        );
    $SQL$;
  END IF;

  -- Create DELETE policy for avatars if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'avatars_delete_own'
  ) THEN
    EXECUTE $SQL$
      CREATE POLICY "avatars_delete_own"
        ON storage.objects
        FOR DELETE
        USING (
          bucket_id = 'avatars' AND (split_part(name,'/',1))::uuid = auth.uid()
        );
    $SQL$;
  END IF;

END$$;

COMMIT;
