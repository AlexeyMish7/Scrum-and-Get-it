-- Migration: Add job_materials table for linking resume/cover letter to jobs
-- Purpose: Track which resume/cover letter (uploaded document or AI artifact) was used per job
-- and maintain a history of changes by inserting a new row per update.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'job_materials'
  ) THEN
    CREATE TABLE public.job_materials (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
      job_id bigint NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
      -- Either a document or an AI artifact may be linked for each material type
      resume_document_id uuid NULL REFERENCES public.documents(id) ON DELETE SET NULL,
      resume_artifact_id uuid NULL REFERENCES public.ai_artifacts(id) ON DELETE SET NULL,
      cover_document_id uuid NULL REFERENCES public.documents(id) ON DELETE SET NULL,
      cover_artifact_id uuid NULL REFERENCES public.ai_artifacts(id) ON DELETE SET NULL,
      metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    );

    CREATE INDEX IF NOT EXISTS idx_job_materials_user ON public.job_materials(user_id);
    CREATE INDEX IF NOT EXISTS idx_job_materials_job ON public.job_materials(job_id, created_at DESC);
  END IF;
END$$;

-- Trigger to keep updated_at fresh
DROP TRIGGER IF EXISTS trg_set_updated_at_job_materials ON public.job_materials;
CREATE TRIGGER trg_set_updated_at_job_materials
  BEFORE UPDATE ON public.job_materials
  FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

-- RLS: Users only see and modify their own rows
ALTER TABLE public.job_materials ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'job_materials' AND policyname = 'job_materials_select_own'
  ) THEN
    EXECUTE $SQL$
      CREATE POLICY "job_materials_select_own"
        ON public.job_materials
        FOR SELECT
        USING ( user_id = auth.uid() );
    $SQL$;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'job_materials' AND policyname = 'job_materials_insert_own'
  ) THEN
    EXECUTE $SQL$
      CREATE POLICY "job_materials_insert_own"
        ON public.job_materials
        FOR INSERT
        WITH CHECK ( user_id = auth.uid() );
    $SQL$;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'job_materials' AND policyname = 'job_materials_update_own'
  ) THEN
    EXECUTE $SQL$
      CREATE POLICY "job_materials_update_own"
        ON public.job_materials
        FOR UPDATE
        USING ( user_id = auth.uid() );
    $SQL$;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'job_materials' AND policyname = 'job_materials_delete_own'
  ) THEN
    EXECUTE $SQL$
      CREATE POLICY "job_materials_delete_own"
        ON public.job_materials
        FOR DELETE
        USING ( user_id = auth.uid() );
    $SQL$;
  END IF;
END$$;

-- Optional convenience view: latest materials per job
CREATE OR REPLACE VIEW public.v_job_current_materials AS
SELECT DISTINCT ON (jm.job_id)
  jm.job_id,
  jm.user_id,
  jm.resume_document_id,
  jm.resume_artifact_id,
  jm.cover_document_id,
  jm.cover_artifact_id,
  jm.metadata,
  jm.created_at AS linked_at
FROM public.job_materials jm
ORDER BY jm.job_id, jm.created_at DESC;

-- Notes:
-- - To update selected materials, INSERT a new row for (user_id, job_id) with the new pointers.
-- - The history is the set of rows per job_id ordered by created_at DESC.
-- - Usage analytics can be computed via COUNT(*) GROUP BY resume_document_id/cover_document_id or artifact ids.

