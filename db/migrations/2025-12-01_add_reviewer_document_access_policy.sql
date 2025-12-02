-- Migration: Add RLS policy for reviewers to access shared documents
-- Purpose: Allow users who are assigned as reviewers on a document_review
--          to view the associated document (UC-110 Collaborative Document Review)
--
-- Issue: When a mentor opens a review, they couldn't see the document because
--        RLS on documents table only allowed user_id = auth.uid()
--
-- Solution: Add SELECT policy that checks if the user is a reviewer on any
--           active document_review for that document

-- Add policy for reviewers to view documents shared with them
CREATE POLICY "Reviewers can view documents shared for review"
  ON public.documents FOR SELECT
  USING (
    -- User owns the document
    user_id = auth.uid()
    OR
    -- User is a reviewer on an active review for this document
    EXISTS (
      SELECT 1 FROM public.document_reviews dr
      WHERE dr.document_id = documents.id
        AND dr.reviewer_id = auth.uid()
        AND dr.status NOT IN ('cancelled', 'expired')
    )
  );

-- Drop the old restrictive policy and replace with the new one
-- (The new policy above includes the original condition plus reviewer access)
DROP POLICY IF EXISTS "Users can view their own documents" ON public.documents;

-- Add comment explaining the policy
COMMENT ON POLICY "Reviewers can view documents shared for review" ON public.documents IS
  'Allows document owners and assigned reviewers to view documents. Reviewers can only see documents where they have an active (non-cancelled, non-expired) review assignment.';
