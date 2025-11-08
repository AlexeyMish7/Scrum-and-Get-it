-- Migration: Add AI artifacts storage table
-- Purpose: store AI-generated artifacts (resume bullets, cover letters, skills optimizations,
-- company research summaries, matching/gap analyses) as versions tied to a user and optionally a job.
-- This table stores the prompt, model metadata, generated structured content (jsonb), and arbitrary metadata.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'ai_artifacts'
  ) THEN
    CREATE TABLE public.ai_artifacts (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
      job_id bigint NULL REFERENCES public.jobs(id) ON DELETE SET NULL,
      kind text NOT NULL CHECK (kind IN ('resume','cover_letter','skills_optimization','company_research','match','gap_analysis')),
      title text NULL,
      prompt text NULL,
      model text NULL,
      content jsonb NOT NULL,
      metadata jsonb DEFAULT '{}'::jsonb,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    );

    CREATE INDEX IF NOT EXISTS idx_ai_artifacts_user_id ON public.ai_artifacts(user_id);
    CREATE INDEX IF NOT EXISTS idx_ai_artifacts_job_id ON public.ai_artifacts(job_id);
    CREATE INDEX IF NOT EXISTS idx_ai_artifacts_kind ON public.ai_artifacts(kind);
  END IF;
END$$;

-- Trigger function to update updated_at (reuse existing name if present)
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Attach trigger for ai_artifacts
DROP TRIGGER IF EXISTS trg_set_updated_at_ai_artifacts ON public.ai_artifacts;
CREATE TRIGGER trg_set_updated_at_ai_artifacts
  BEFORE UPDATE ON public.ai_artifacts
  FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

-- Row level security: allow users to operate only on their own artifacts
ALTER TABLE public.ai_artifacts ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'ai_artifacts' AND policyname = 'ai_artifacts_select_own'
  ) THEN
    EXECUTE $SQL$
      CREATE POLICY "ai_artifacts_select_own"
        ON public.ai_artifacts
        FOR SELECT
        USING ( user_id = auth.uid() );
    $SQL$;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'ai_artifacts' AND policyname = 'ai_artifacts_insert_own'
  ) THEN
    EXECUTE $SQL$
      CREATE POLICY "ai_artifacts_insert_own"
        ON public.ai_artifacts
        FOR INSERT
        WITH CHECK ( user_id = auth.uid() );
    $SQL$;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'ai_artifacts' AND policyname = 'ai_artifacts_update_own'
  ) THEN
    EXECUTE $SQL$
      CREATE POLICY "ai_artifacts_update_own"
        ON public.ai_artifacts
        FOR UPDATE
        USING ( user_id = auth.uid() );
    $SQL$;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'ai_artifacts' AND policyname = 'ai_artifacts_delete_own'
  ) THEN
    EXECUTE $SQL$
      CREATE POLICY "ai_artifacts_delete_own"
        ON public.ai_artifacts
        FOR DELETE
        USING ( user_id = auth.uid() );
    $SQL$;
  END IF;
END$$;

-- Notes:
-- - `content` should contain the structured generation output, e.g. for resumes: {"bullets": [...], "variants": [...]}
-- - `metadata` may hold things like `prompt_preview`, `generation_confidence`, `source_company_id` or `external_refs`.
-- - Consumers (API/server-side) should scope queries via `user_id` (use `withUser(user.id)` in frontend services).
