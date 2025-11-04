-- Migration: Fill and require start_date on public.education
-- Date: 2025-11-02
-- This migration:
-- 1) creates a backup of the table
-- 2) fills missing/invalid values using graduation_date when available, otherwise a fallback date
-- 3) fixes degree/field blanks and out-of-range GPA (optional, safe fills)
-- 4) sets start_date NOT NULL
-- NOTE: Run this in Supabase SQL editor or psql. Test on staging first.

BEGIN;

-- 1) Backup current table (data snapshot)
DROP TABLE IF EXISTS public.education_backup;
CREATE TABLE public.education_backup AS TABLE public.education;

-- 2) Fill start_date: prefer graduation_date, else fallback to a recognizable date
-- (Adjust fallback as appropriate for your app; choose a value you can later find/clean.)
UPDATE public.education
SET start_date = COALESCE(start_date, graduation_date, DATE '2000-01-01')
WHERE start_date IS NULL;

-- 3) Optional cleanups (safe):
-- 3a) If both degree_type and field_of_study are blank, set degree_type = 'Unknown'
UPDATE public.education
SET degree_type = 'Unknown'
WHERE (degree_type IS NULL OR btrim(degree_type) = '')
  AND (field_of_study IS NULL OR btrim(field_of_study) = '');

-- 3b) Fix out-of-range GPA by setting to NULL
UPDATE public.education
SET gpa = NULL
WHERE gpa IS NOT NULL AND (gpa < 0 OR gpa > 4);

-- 4) Make start_date NOT NULL
ALTER TABLE public.education
  ALTER COLUMN start_date SET NOT NULL;

COMMIT;

-- Rollback note:
-- If you need to restore, you can replace the table with the backup (careful: this will drop new changes):
-- BEGIN; DROP TABLE public.education; CREATE TABLE public.education AS TABLE public.education_backup; COMMIT;
