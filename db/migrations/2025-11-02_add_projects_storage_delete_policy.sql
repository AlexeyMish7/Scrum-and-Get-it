-- Migration: Add DELETE policy for projects storage bucket
-- Purpose: Allow users to delete their own files from the projects storage bucket
-- This is required for proper cleanup when deleting projects

-- Add DELETE policy for projects bucket
DO $$
BEGIN
  -- projects bucket DELETE policy
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'projects_delete_own'
  ) THEN
    EXECUTE $SQL$
      CREATE POLICY "projects_delete_own"
        ON storage.objects
        FOR DELETE
        USING (
          bucket_id = 'projects' AND (split_part(name,'/',1))::uuid = auth.uid()
        );
    $SQL$;
    RAISE NOTICE 'Added projects_delete_own policy for storage bucket';
  ELSE
    RAISE NOTICE 'projects_delete_own policy already exists';
  END IF;
END$$;

-- Rollback (manual):
-- To remove this change, run:
-- DROP POLICY IF EXISTS "projects_delete_own" ON storage.objects;

-- Notes:
-- - This policy allows users to delete only their own files from the projects bucket
-- - Files are organized by user ID as the first part of the path (userId/filename)
-- - This matches the existing read/write policies for consistency