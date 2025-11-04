-- Migration: enforce stronger constraints on public.projects
-- Goals:
--  - Make key fields required (start_date, created_at, updated_at)
--  - Add DB-level checks to prevent invalid dates and negative team sizes
--  - Require an end_date when a project is marked as 'completed'
--
-- This migration is reversible using the down section at the bottom.

BEGIN;

-- 1) Ensure there are no rows violating the new NOT NULL constraints
-- If any rows exist with null start_date, we fail loudly so the operator
-- must resolve (data cleanup) before applying. This is intentional.
DO $$
DECLARE cnt int;
BEGIN
  SELECT count(*) INTO cnt FROM public.projects WHERE start_date IS NULL;
  IF cnt > 0 THEN
    RAISE EXCEPTION 'Cannot apply migration: % rows in projects have NULL start_date. Clean data first.', cnt;
  END IF;
END$$;

-- 2) Make start_date required
ALTER TABLE public.projects
  ALTER COLUMN start_date SET NOT NULL;

-- 3) Ensure created_at/updated_at are set and NOT NULL
-- Set missing timestamps to now() to avoid failing the migration unexpectedly.
UPDATE public.projects SET created_at = now() WHERE created_at IS NULL;
UPDATE public.projects SET updated_at = now() WHERE updated_at IS NULL;

ALTER TABLE public.projects
  ALTER COLUMN created_at SET NOT NULL,
  ALTER COLUMN updated_at SET NOT NULL;

-- 4) Add constraints
ALTER TABLE public.projects
  ADD CONSTRAINT projects_end_after_start CHECK (end_date IS NULL OR end_date >= start_date),
  ADD CONSTRAINT projects_team_size_nonnegative CHECK (team_size IS NULL OR team_size >= 0),
  ADD CONSTRAINT projects_completed_requires_end_date CHECK (status <> 'completed'::project_status_enum OR end_date IS NOT NULL);

COMMIT;

-- Down / rollback: remove constraints and make columns nullable again
-- Note: rolling back may allow rows that violate intended invariants.
-- Use carefully and prefer forward migration fixes where possible.
--
-- To revert run the statements below in order (wrapped in a transaction):
-- BEGIN;
-- ALTER TABLE public.projects DROP CONSTRAINT IF EXISTS projects_completed_requires_end_date;
-- ALTER TABLE public.projects DROP CONSTRAINT IF EXISTS projects_team_size_nonnegative;
-- ALTER TABLE public.projects DROP CONSTRAINT IF EXISTS projects_end_after_start;
-- ALTER TABLE public.projects ALTER COLUMN updated_at DROP NOT NULL;
-- ALTER TABLE public.projects ALTER COLUMN created_at DROP NOT NULL;
-- ALTER TABLE public.projects ALTER COLUMN start_date DROP NOT NULL;
-- COMMIT;
