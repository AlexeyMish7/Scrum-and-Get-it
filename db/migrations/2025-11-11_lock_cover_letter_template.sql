-- Migration: Lock cover letter template_id after creation
-- Created: 2025-11-11
-- Purpose: Prevent changes to template_id after draft creation to maintain consistency
--          with the design intent that templates control AI generation style.

-- Create function to prevent template_id changes
CREATE OR REPLACE FUNCTION prevent_cover_letter_template_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Allow template_id change only if it's NULL (shouldn't happen, but be safe)
  IF OLD.template_id IS NOT NULL AND NEW.template_id != OLD.template_id THEN
    RAISE EXCEPTION 'Cannot change template_id after draft creation. Template is locked to maintain generation consistency.';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to enforce template lock
DROP TRIGGER IF EXISTS prevent_cover_letter_template_change_trigger ON public.cover_letter_drafts;
CREATE TRIGGER prevent_cover_letter_template_change_trigger
  BEFORE UPDATE ON public.cover_letter_drafts
  FOR EACH ROW
  EXECUTE FUNCTION prevent_cover_letter_template_change();

-- Update comment to reflect locked behavior
COMMENT ON COLUMN public.cover_letter_drafts.template_id IS 'Template identifier for styling (formal, creative, technical, modern, minimal) - LOCKED after creation, cannot be changed';

