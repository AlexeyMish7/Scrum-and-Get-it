-- Migration: Add sensible constraints and defaults for `education`
-- Date: 2025-11-02

BEGIN;

-- Ensure enrollment_status default
ALTER TABLE public.education
  ALTER COLUMN enrollment_status SET DEFAULT 'not_enrolled';

-- Add a CHECK constraint requiring start_date to be present for new/updated rows.
-- Using CHECK is safer than changing to NOT NULL immediately (avoids breaking existing rows).
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'education_require_start_date'
  ) THEN
    ALTER TABLE public.education
      ADD CONSTRAINT education_require_start_date CHECK (start_date IS NOT NULL);
  END IF;
END$$;

-- Require at least degree_type OR field_of_study
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'education_degree_or_field_not_null'
  ) THEN
    ALTER TABLE public.education
      ADD CONSTRAINT education_degree_or_field_not_null CHECK (
        (degree_type IS NOT NULL AND btrim(degree_type) <> '')
        OR (field_of_study IS NOT NULL AND btrim(field_of_study) <> '')
      );
  END IF;
END$$;

-- Add GPA range check (0.00 - 4.00)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'education_gpa_range'
  ) THEN
    ALTER TABLE public.education
      ADD CONSTRAINT education_gpa_range CHECK (gpa IS NULL OR (gpa >= 0 AND gpa <= 4));
  END IF;
END$$;

-- Ensure updated_at trigger exists (function set_updated_at assumed to exist)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_set_updated_at_education'
  ) THEN
    DROP TRIGGER IF EXISTS trg_set_updated_at_education ON public.education;
    CREATE TRIGGER trg_set_updated_at_education
      BEFORE UPDATE ON public.education
      FOR EACH ROW EXECUTE FUNCTION set_updated_at();
  END IF;
END$$;

COMMIT;
