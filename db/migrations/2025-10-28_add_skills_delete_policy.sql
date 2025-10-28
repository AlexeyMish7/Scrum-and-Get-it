-- Add delete policy for skills so authenticated users can delete their own skills
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'skills' AND policyname = 'skills_delete_own'
  ) THEN
    EXECUTE $SQL$
      CREATE POLICY "skills_delete_own"
        ON public.skills
        FOR DELETE
        USING ( user_id = auth.uid() );
    $SQL$;
  END IF;
END$$;
