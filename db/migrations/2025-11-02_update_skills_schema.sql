-- Migration: Make skill fields required and set sensible defaults
-- Adds NOT NULL and DEFAULTs for proficiency_level and skill_category
-- Also backfills existing rows to avoid constraint violations

BEGIN;

-- 1) Backfill NULL proficiency_level to 'beginner'
UPDATE public.skills
SET proficiency_level = 'beginner'
WHERE proficiency_level IS NULL;

-- 2) Alter column to set default and NOT NULL
ALTER TABLE public.skills
ALTER COLUMN proficiency_level SET DEFAULT 'beginner'::public.proficiency_level_enum,
ALTER COLUMN proficiency_level SET NOT NULL;

-- 3) Backfill NULL skill_category to 'Technical'
UPDATE public.skills
SET skill_category = 'Technical'
WHERE skill_category IS NULL OR trim(skill_category) = '';

-- 4) Alter column to set default and NOT NULL
ALTER TABLE public.skills
ALTER COLUMN skill_category SET DEFAULT 'Technical',
ALTER COLUMN skill_category SET NOT NULL;

-- 5) Ensure created_at/updated_at defaults exist (they likely do already)
ALTER TABLE public.skills
ALTER COLUMN created_at SET DEFAULT now();
ALTER TABLE public.skills
ALTER COLUMN updated_at SET DEFAULT now();

-- 6) Optionally add an index for quicker case-insensitive lookups (functional index)
-- This helps enforce approximate uniqueness and faster searches by user + lower(skill_name)
CREATE INDEX IF NOT EXISTS idx_skills_user_low_name ON public.skills USING btree (user_id, lower(skill_name));

COMMIT;
