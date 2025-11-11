-- Migration: Add versioning fields to resume_drafts table
-- Purpose: Enable automatic version creation on save and side-by-side comparison
-- Date: 2025-11-11
-- Author: Sprint 2 Team

-- Add parent_draft_id to track version lineage (which draft this version came from)
ALTER TABLE public.resume_drafts
ADD COLUMN IF NOT EXISTS parent_draft_id uuid REFERENCES public.resume_drafts(id) ON DELETE SET NULL;

-- Add version_number field (separate from generic 'version' for clarity)
-- NOTE: 'version' field already exists, so we'll use that and ensure it auto-increments
-- No need to add duplicate field

-- Add is_latest flag to quickly identify the current version
-- NOTE: 'is_active' already exists and serves this purpose
-- No need to add duplicate field

-- Add origin_source to track how this version was created
ALTER TABLE public.resume_drafts
ADD COLUMN IF NOT EXISTS origin_source text DEFAULT 'manual';
-- Values: 'manual' (user edit), 'ai_generation', 'auto_save', 'duplicate', 'import'

-- Add content_hash to detect actual changes (prevents duplicate versions for no-op saves)
ALTER TABLE public.resume_drafts
ADD COLUMN IF NOT EXISTS content_hash text;

-- Create index on parent_draft_id for version tree queries
CREATE INDEX IF NOT EXISTS idx_resume_drafts_parent_id
ON public.resume_drafts(parent_draft_id);

-- Create index on user_id + is_active for fast "latest versions" queries
CREATE INDEX IF NOT EXISTS idx_resume_drafts_user_active
ON public.resume_drafts(user_id, is_active);

-- Create index on content_hash for duplicate detection
CREATE INDEX IF NOT EXISTS idx_resume_drafts_content_hash
ON public.resume_drafts(content_hash);

-- Add comment explaining versioning strategy
COMMENT ON COLUMN public.resume_drafts.parent_draft_id IS
'Points to the draft this version was created from. NULL for original drafts.';

COMMENT ON COLUMN public.resume_drafts.version IS
'Auto-incremented version number within a version family. Starts at 1 for original, increments for each save that changes content.';

COMMENT ON COLUMN public.resume_drafts.is_active IS
'TRUE for the latest/current version in a version family. Only one version should be active per family.';

COMMENT ON COLUMN public.resume_drafts.origin_source IS
'How this version was created: manual (user edit), ai_generation, auto_save, duplicate, import';

COMMENT ON COLUMN public.resume_drafts.content_hash IS
'SHA-256 hash of content JSON. Used to detect if content actually changed between saves.';

-- Create a function to auto-increment version number
CREATE OR REPLACE FUNCTION public.auto_increment_resume_version()
RETURNS TRIGGER AS $$
DECLARE
  max_version integer;
  version_family_root uuid;
BEGIN
  -- If this is a new draft (no parent), it's version 1
  IF NEW.parent_draft_id IS NULL THEN
    NEW.version := 1;
    RETURN NEW;
  END IF;

  -- Find the root of the version family (original draft)
  version_family_root := NEW.parent_draft_id;
  WHILE EXISTS (
    SELECT 1 FROM public.resume_drafts
    WHERE id = version_family_root AND parent_draft_id IS NOT NULL
  ) LOOP
    SELECT parent_draft_id INTO version_family_root
    FROM public.resume_drafts
    WHERE id = version_family_root;
  END LOOP;

  -- Get the maximum version number in this family
  SELECT COALESCE(MAX(version), 0) INTO max_version
  FROM public.resume_drafts
  WHERE (id = version_family_root OR parent_draft_id = version_family_root);

  -- Set new version number
  NEW.version := max_version + 1;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-increment version on insert
DROP TRIGGER IF EXISTS trigger_auto_increment_resume_version ON public.resume_drafts;
CREATE TRIGGER trigger_auto_increment_resume_version
BEFORE INSERT ON public.resume_drafts
FOR EACH ROW
EXECUTE FUNCTION public.auto_increment_resume_version();

-- Create a function to mark previous version as inactive when new version is created
CREATE OR REPLACE FUNCTION public.mark_previous_version_inactive()
RETURNS TRIGGER AS $$
BEGIN
  -- If this new draft has a parent (it's a version), mark parent as inactive
  IF NEW.parent_draft_id IS NOT NULL THEN
    UPDATE public.resume_drafts
    SET is_active = false
    WHERE id = NEW.parent_draft_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to mark previous version inactive
DROP TRIGGER IF EXISTS trigger_mark_previous_version_inactive ON public.resume_drafts;
CREATE TRIGGER trigger_mark_previous_version_inactive
AFTER INSERT ON public.resume_drafts
FOR EACH ROW
EXECUTE FUNCTION public.mark_previous_version_inactive();

-- Create a view for easy version history queries
CREATE OR REPLACE VIEW public.v_resume_draft_versions AS
SELECT
  rd.id,
  rd.user_id,
  rd.name,
  rd.version,
  rd.is_active,
  rd.parent_draft_id,
  rd.origin_source,
  rd.created_at,
  rd.updated_at,
  rd.template_id,
  -- Get the root draft ID (original in the version family)
  CASE
    WHEN rd.parent_draft_id IS NULL THEN rd.id
    ELSE (
      WITH RECURSIVE version_tree AS (
        SELECT id, parent_draft_id
        FROM public.resume_drafts
        WHERE id = rd.id
        UNION ALL
        SELECT p.id, p.parent_draft_id
        FROM public.resume_drafts p
        INNER JOIN version_tree vt ON p.id = vt.parent_draft_id
      )
      SELECT id FROM version_tree WHERE parent_draft_id IS NULL LIMIT 1
    )
  END as root_draft_id,
  -- Count total versions in this family
  (
    WITH RECURSIVE version_tree AS (
      SELECT id, parent_draft_id
      FROM public.resume_drafts
      WHERE id = rd.id OR parent_draft_id = rd.id
      UNION ALL
      SELECT p.id, p.parent_draft_id
      FROM public.resume_drafts p
      INNER JOIN version_tree vt ON p.id = vt.parent_draft_id OR p.parent_draft_id = vt.id
    )
    SELECT COUNT(*) FROM version_tree
  ) as total_versions
FROM public.resume_drafts rd;

COMMENT ON VIEW public.v_resume_draft_versions IS
'Enhanced view of resume drafts with version family information for easy querying';
