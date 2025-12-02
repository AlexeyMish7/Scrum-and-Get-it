-- ============================================================================
-- Add get_team_members_for_sharing function
-- Created: 2025-12-02
-- Purpose: Allow team members to see other members in their team for sharing
--          documents and requesting reviews (UC-110)
-- ============================================================================

-- This SECURITY DEFINER function bypasses RLS to allow users to see
-- other members of teams they belong to. This is necessary because
-- the team_members RLS policies only allow users to see their own records.

-- Drop existing function if it exists (to allow recreation)
DROP FUNCTION IF EXISTS get_team_members_for_sharing(uuid, uuid);

CREATE OR REPLACE FUNCTION get_team_members_for_sharing(
  p_user_id uuid,
  p_team_id uuid
)
RETURNS TABLE (
  member_user_id uuid,
  member_full_name text,
  member_email text,
  member_role text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- First verify the requesting user is a member of this team
  IF NOT EXISTS (
    SELECT 1 FROM public.team_members tm_check
    WHERE tm_check.team_id = p_team_id
      AND tm_check.user_id = p_user_id
      AND tm_check.is_active = true
  ) THEN
    -- User is not a member of this team, return empty
    RETURN;
  END IF;

  -- Return all other active team members with their profile info
  RETURN QUERY
  SELECT
    tm.user_id AS member_user_id,
    COALESCE(p.full_name, 'Unknown')::text AS member_full_name,
    COALESCE(p.email, '')::text AS member_email,
    tm.role::text AS member_role
  FROM public.team_members tm
  LEFT JOIN public.profiles p ON p.id = tm.user_id
  WHERE tm.team_id = p_team_id
    AND tm.is_active = true
    AND tm.user_id != p_user_id  -- Exclude the requesting user
  ORDER BY p.full_name;
END;
$$;

COMMENT ON FUNCTION get_team_members_for_sharing IS
  'Get team members for document sharing. Bypasses RLS after verifying caller is a team member.';

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_team_members_for_sharing TO authenticated;
