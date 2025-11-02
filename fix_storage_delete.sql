-- Quick fix: Add DELETE policy for projects storage bucket
-- Run this in your Supabase SQL editor or via psql

CREATE POLICY "projects_delete_own"
  ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'projects' AND (split_part(name,'/',1))::uuid = auth.uid()
  );