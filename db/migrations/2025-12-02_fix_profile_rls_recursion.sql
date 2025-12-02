-- ============================================================================
-- Fix infinite recursion in RLS policies
-- Created: 2025-12-02
-- Purpose: Prevent RLS recursion when inserting into document_reviews
-- ============================================================================
--
-- Problem:
-- There's circular RLS between documents and document_reviews:
--   1. document_reviews INSERT policy checks: EXISTS(SELECT FROM documents...)
--   2. documents SELECT policy checks: EXISTS(SELECT FROM document_reviews...)
--   3. Infinite recursion!
--
-- Solution:
-- Use SECURITY DEFINER functions to bypass RLS when checking ownership.
-- ============================================================================

-- Drop the problematic function and policy
DROP POLICY IF EXISTS "profiles_select_policy" ON public.profiles;
DROP FUNCTION IF EXISTS public.can_view_profile(uuid);

-- Create a simpler function that doesn't query document_reviews
CREATE OR REPLACE FUNCTION public.can_view_profile(profile_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT
    -- Always can see own profile
    profile_id = auth.uid()
    OR
    -- Can see profiles of users in the same active team
    EXISTS (
      SELECT 1 FROM public.team_members tm1
      JOIN public.team_members tm2 ON tm1.team_id = tm2.team_id
      WHERE tm1.user_id = auth.uid()
        AND tm2.user_id = profile_id
        AND tm1.is_active = true
        AND tm2.is_active = true
    )
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION public.can_view_profile TO authenticated;

-- Create the policy using the function
CREATE POLICY "profiles_select_policy"
  ON public.profiles FOR SELECT
  USING (public.can_view_profile(id));

COMMENT ON FUNCTION public.can_view_profile IS
  'Check if current user can view a profile. Allows own profile and teammates.';

-- ============================================================================
-- Fix document_reviews INSERT policy using SECURITY DEFINER function
-- ============================================================================
-- The issue: INSERT policy queries documents table, which has a policy that
-- queries document_reviews - causing infinite recursion.
--
-- Solution: Use a SECURITY DEFINER function to check document ownership
-- without triggering the documents RLS policies.

-- Create function to check if user owns a document (bypasses RLS)
CREATE OR REPLACE FUNCTION public.user_owns_document(p_user_id uuid, p_document_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.documents
    WHERE id = p_document_id AND user_id = p_user_id
  )
$$;

GRANT EXECUTE ON FUNCTION public.user_owns_document TO authenticated;

COMMENT ON FUNCTION public.user_owns_document IS
  'Check if a user owns a document. SECURITY DEFINER to bypass RLS.';

-- Drop old policy
DROP POLICY IF EXISTS "Owners can create reviews" ON public.document_reviews;

-- New policy using the SECURITY DEFINER function to avoid RLS recursion
CREATE POLICY "Owners can create reviews"
  ON public.document_reviews FOR INSERT
  WITH CHECK (
    auth.uid() = owner_id
    AND public.user_owns_document(auth.uid(), document_id)
  );

-- ============================================================================
-- Ensure document_reviews SELECT works for participants
-- ============================================================================
-- These policies should already exist but let's make sure they're correct

-- Drop and recreate to ensure clean state
DROP POLICY IF EXISTS "Owners can view their document reviews" ON public.document_reviews;
DROP POLICY IF EXISTS "Reviewers can view assigned reviews" ON public.document_reviews;

CREATE POLICY "Owners can view their document reviews"
  ON public.document_reviews FOR SELECT
  USING (auth.uid() = owner_id);

CREATE POLICY "Reviewers can view assigned reviews"
  ON public.document_reviews FOR SELECT
  USING (auth.uid() = reviewer_id);

-- ============================================================================
-- Fix documents SELECT policy to avoid recursion with document_reviews
-- ============================================================================
-- The existing policy "Reviewers can view documents shared for review" queries
-- document_reviews, which can cause recursion. Replace it with a SECURITY
-- DEFINER function.

-- Create function to check if user can view a document (bypasses RLS)
CREATE OR REPLACE FUNCTION public.user_can_view_document(p_document_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT
    -- User owns the document
    EXISTS (
      SELECT 1 FROM public.documents
      WHERE id = p_document_id AND user_id = auth.uid()
    )
    OR
    -- User is a reviewer on an active review for this document
    EXISTS (
      SELECT 1 FROM public.document_reviews
      WHERE document_id = p_document_id
        AND reviewer_id = auth.uid()
        AND status NOT IN ('cancelled', 'expired')
    )
$$;

GRANT EXECUTE ON FUNCTION public.user_can_view_document TO authenticated;

COMMENT ON FUNCTION public.user_can_view_document IS
  'Check if current user can view a document. Owners and active reviewers can view.';

-- Drop old policies
DROP POLICY IF EXISTS "Reviewers can view documents shared for review" ON public.documents;
DROP POLICY IF EXISTS "Users can view their own documents" ON public.documents;

-- Create new policy using the SECURITY DEFINER function
CREATE POLICY "Users can view accessible documents"
  ON public.documents FOR SELECT
  USING (public.user_can_view_document(id));


