-- ============================================================================
-- Fix team_members INSERT policy for team owners
-- Created: 2025-12-02
-- Purpose: Allow team owners to add themselves as the first member
-- ============================================================================
--
-- Problem:
-- When a user creates a team, they become the owner (teams.owner_id).
-- But the team_members INSERT policy only allows:
--   1. Users with pending invitations, OR
--   2. Users who are already admins (in team_members)
--
-- This creates a chicken-and-egg problem: the owner can't add themselves
-- as the first member because they're not yet in team_members.
--
-- Solution:
-- Update is_team_admin() to also check if the user is the team owner.
-- ============================================================================

-- Update is_team_admin to also check if user owns the team
CREATE OR REPLACE FUNCTION is_team_admin(p_user_id uuid, p_team_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    -- Check if user is an admin member
    SELECT 1 FROM public.team_members
    WHERE user_id = p_user_id
    AND team_id = p_team_id
    AND role = 'admin'
    AND is_active = true
  )
  OR EXISTS (
    -- Check if user is the team owner (allows first member insertion)
    SELECT 1 FROM public.teams
    WHERE id = p_team_id
    AND owner_id = p_user_id
  );
$$;

COMMENT ON FUNCTION is_team_admin IS
  'Check if user is a team admin OR the team owner. Allows owners to add first member.';

-- ============================================================================
-- End of migration
-- ============================================================================
