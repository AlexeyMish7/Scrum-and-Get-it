-- ============================================================================
-- Allow profiles to be read in review and team context
-- Created: 2025-12-02
-- Purpose: Allow users to see profile info (name, email) for reviewers,
--          document owners, and team members in collaborative features
-- ============================================================================

-- The current profiles RLS only allows users to see their own profile.
-- This causes 500 errors when querying document_reviews with profile joins.
--
-- Solution: Add policies that allow viewing profiles when:
-- 1. It's your own profile
-- 2. You are in a review relationship (owner/reviewer)
-- 3. You share a team with the user (for selecting reviewers)

-- First drop the old restrictive policy
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_policy" ON public.profiles;
DROP POLICY IF EXISTS "Users can view profiles of review participants" ON public.profiles;
DROP POLICY IF EXISTS "Team members can view teammate profiles" ON public.profiles;

-- Create a comprehensive SELECT policy
-- Note: Using a function to check team membership avoids direct RLS recursion
CREATE OR REPLACE FUNCTION public.can_view_profile(profile_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT
    -- Own profile
    profile_id = auth.uid()
    OR
    -- In a review together
    EXISTS (
      SELECT 1 FROM public.document_reviews dr
      WHERE (dr.owner_id = auth.uid() AND dr.reviewer_id = profile_id)
         OR (dr.reviewer_id = auth.uid() AND dr.owner_id = profile_id)
    )
    OR
    -- In the same team (uses SECURITY DEFINER to bypass team_members RLS)
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
  'Check if current user can view a profile. Used by RLS policy.';
