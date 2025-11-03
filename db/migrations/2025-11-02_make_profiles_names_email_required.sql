-- Migration: Make profiles.email, profiles.first_name and profiles.last_name NOT NULL
-- Date: 2025-11-02
-- Notes:
-- 1) Existing NULL emails are converted to a unique placeholder using the row id
--    (this avoids violating the UNIQUE constraint). You should follow up to
--    prompt users to set a real email where appropriate.
-- 2) first_name and last_name NULLs are converted to empty strings.
-- 3) A rollback section is included as a hint for manual rollback.

BEGIN;

-- 1) Make NULL emails unique placeholders to satisfy the unique constraint.
UPDATE public.profiles
SET email = id::text || '@no-email.local'
WHERE email IS NULL;

-- 2) Replace NULL names with empty strings (safe default)
UPDATE public.profiles
SET first_name = ''
WHERE first_name IS NULL;

UPDATE public.profiles
SET last_name = ''
WHERE last_name IS NULL;

-- 3) Apply NOT NULL constraints
ALTER TABLE public.profiles
  ALTER COLUMN email SET NOT NULL;

ALTER TABLE public.profiles
  ALTER COLUMN first_name SET NOT NULL;

ALTER TABLE public.profiles
  ALTER COLUMN last_name SET NOT NULL;

COMMIT;

-- ===== ROLLBACK (manual) =====
-- If you need to revert these changes, run the block below manually.
-- It drops the NOT NULL constraints and attempts to restore NULLs for rows
-- that received the placeholder email.
--
-- BEGIN;
-- ALTER TABLE public.profiles
--   ALTER COLUMN email DROP NOT NULL;
-- ALTER TABLE public.profiles
--   ALTER COLUMN first_name DROP NOT NULL;
-- ALTER TABLE public.profiles
--   ALTER COLUMN last_name DROP NOT NULL;
--
-- -- Restore emails that were placeholder values
-- UPDATE public.profiles
-- SET email = NULL
-- WHERE email LIKE '%@no-email.local';
--
-- -- Optionally restore names back to NULL (if desired)
-- UPDATE public.profiles
-- SET first_name = NULL
-- WHERE first_name = '';
-- UPDATE public.profiles
-- SET last_name = NULL
-- WHERE last_name = '';
--
-- COMMIT;
