-- Migration: tighten employment table constraints
-- Adds checks and stricter NOT NULLs for better data quality.

BEGIN;

-- 1) Ensure current_position has no NULLs
UPDATE public.employment SET current_position = false WHERE current_position IS NULL;

-- 2) Ensure created_at/updated_at are populated
UPDATE public.employment SET created_at = now() WHERE created_at IS NULL;
UPDATE public.employment SET updated_at = now() WHERE updated_at IS NULL;

-- 3) Add check: end_date must be >= start_date when both present
ALTER TABLE public.employment
  ADD CONSTRAINT chk_employment_end_after_start CHECK (
    end_date IS NULL OR start_date IS NULL OR end_date >= start_date
  );

-- 4) Prevent having an end_date when current_position = true
ALTER TABLE public.employment
  ADD CONSTRAINT chk_employment_no_end_if_current CHECK (
    NOT current_position OR end_date IS NULL
  );

-- 5) Make columns NOT NULL / set defaults
ALTER TABLE public.employment
  ALTER COLUMN start_date SET NOT NULL;

ALTER TABLE public.employment
  ALTER COLUMN current_position SET NOT NULL;

ALTER TABLE public.employment
  ALTER COLUMN created_at SET NOT NULL;

ALTER TABLE public.employment
  ALTER COLUMN updated_at SET NOT NULL;

COMMIT;

-- Rollback (if needed): reverse the stricter constraints
-- BEGIN;
-- ALTER TABLE public.employment ALTER COLUMN updated_at DROP NOT NULL;
-- ALTER TABLE public.employment ALTER COLUMN created_at DROP NOT NULL;
-- ALTER TABLE public.employment ALTER COLUMN current_position DROP NOT NULL;
-- ALTER TABLE public.employment ALTER COLUMN start_date DROP NOT NULL;
-- ALTER TABLE public.employment DROP CONSTRAINT IF EXISTS chk_employment_no_end_if_current;
-- ALTER TABLE public.employment DROP CONSTRAINT IF EXISTS chk_employment_end_after_start;
-- COMMIT;
