-- ============================================================================
-- Add RLS policy for reviewers to view document_versions
-- Created: 2025-12-02
-- Purpose: Allow reviewers to see the content of documents they're reviewing
-- ============================================================================
--
-- Problem:
-- The document_versions table only allows owners to view versions.
-- When a reviewer tries to view a document (resume or cover letter),
-- they can see the document metadata but not the actual content because
-- the content is stored in document_versions.
--
-- Solution:
-- Add a SECURITY DEFINER function to check if a user can view a version
-- based on being the owner OR being an active reviewer for that document.
-- ============================================================================

-- Create function to check if user can view a document version
-- Uses SECURITY DEFINER to bypass RLS and avoid recursion
CREATE OR REPLACE FUNCTION public.user_can_view_document_version(p_version_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT
    -- User owns the version
    EXISTS (
      SELECT 1 FROM public.document_versions
      WHERE id = p_version_id AND user_id = auth.uid()
    )
    OR
    -- User is a reviewer on an active review for the document that owns this version
    EXISTS (
      SELECT 1
      FROM public.document_versions dv
      JOIN public.document_reviews dr ON dr.document_id = dv.document_id
      WHERE dv.id = p_version_id
        AND dr.reviewer_id = auth.uid()
        AND dr.status NOT IN ('cancelled', 'expired')
    )
$$;

GRANT EXECUTE ON FUNCTION public.user_can_view_document_version TO authenticated;

COMMENT ON FUNCTION public.user_can_view_document_version IS
  'Check if current user can view a document version. Owners and active reviewers can view.';

-- Drop old policy that only allowed owners
DROP POLICY IF EXISTS "Users can view their own document versions" ON public.document_versions;

-- Create new policy using the SECURITY DEFINER function
CREATE POLICY "Users can view accessible document versions"
  ON public.document_versions FOR SELECT
  USING (public.user_can_view_document_version(id));

-- ============================================================================
-- End of migration
-- ============================================================================
