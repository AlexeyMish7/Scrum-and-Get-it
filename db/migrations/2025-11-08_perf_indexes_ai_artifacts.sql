-- Migration: Performance indexes for ai_artifacts
-- Purpose: Speed up frequent filters by user/kind/job

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE schemaname='public' AND indexname='idx_ai_artifacts_user_kind_job'
  ) THEN
    CREATE INDEX idx_ai_artifacts_user_kind_job
      ON public.ai_artifacts(user_id, kind, job_id);
  END IF;
END$$;