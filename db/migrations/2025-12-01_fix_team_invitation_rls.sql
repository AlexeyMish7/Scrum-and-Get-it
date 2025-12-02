-- ============================================================================
-- Fix Team RLS for Invitations
-- Created: 2025-12-01
-- Purpose: Allow users to see team info when they have a pending invitation
--          AND fix infinite recursion in existing policies
-- ============================================================================

-- THE PROBLEM:
-- 1. Users who receive invitations can't see the team name/description
--    because the current RLS only allows owners to see teams.
-- 2. The existing team_invitations policies use:
--      invitee_email = (SELECT email FROM profiles WHERE id = auth.uid())
--    This queries profiles, and if profiles has ANY policy that checks
--    team_invitations, we get infinite recursion:
--      team_invitations -> profiles -> team_invitations -> ...
--
-- SOLUTION:
-- Use auth.email() directly instead of querying profiles table.
-- auth.email() is a Supabase function that returns the authenticated user's email
-- without needing to query any tables - avoiding all recursion.

-- ============================================================================
-- FIRST: Fix existing team_invitations policies that cause recursion
-- Replace (SELECT email FROM profiles WHERE id = auth.uid()) with auth.email()
-- ============================================================================

-- Drop and recreate the SELECT policy
DROP POLICY IF EXISTS "Team members can view invitations" ON public.team_invitations;

CREATE POLICY "Team members can view invitations"
  ON public.team_invitations FOR SELECT
  USING (
    -- Use auth.email() directly instead of querying profiles
    invitee_email = auth.email() OR
    invitee_user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.team_members tm
      WHERE tm.team_id = team_invitations.team_id
        AND tm.user_id = auth.uid()
        AND tm.is_active = true
    )
  );

-- Drop and recreate the UPDATE policy
DROP POLICY IF EXISTS "Invitees can update their invitations" ON public.team_invitations;

CREATE POLICY "Invitees can update their invitations"
  ON public.team_invitations FOR UPDATE
  USING (
    -- Use auth.email() directly instead of querying profiles
    invitee_email = auth.email() OR
    invitee_user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.team_members tm
      WHERE tm.team_id = team_invitations.team_id
        AND tm.user_id = auth.uid()
        AND tm.role = 'admin'
        AND tm.is_active = true
    )
  );

-- ============================================================================
-- Add policy for invited users to see team info
-- ============================================================================

DROP POLICY IF EXISTS "Invitees can view team they are invited to" ON public.teams;

-- Allow users to see teams they have been invited to (pending invitations)
CREATE POLICY "Invitees can view team they are invited to"
  ON public.teams FOR SELECT
  USING (
    id IN (
      SELECT team_id FROM public.team_invitations
      WHERE invitee_email = auth.email()
      AND status = 'pending'
    )
  );

-- ============================================================================
-- Also allow team MEMBERS to see their team (not just owners)
-- ============================================================================

DROP POLICY IF EXISTS "Members can view their teams" ON public.teams;

CREATE POLICY "Members can view their teams"
  ON public.teams FOR SELECT
  USING (
    id IN (
      SELECT team_id FROM public.team_members
      WHERE user_id = auth.uid()
      AND is_active = true
    )
  );

-- ============================================================================
-- Allow invitees to see the profile of who invited them
-- ============================================================================

DROP POLICY IF EXISTS "Users can view profiles of people who invited them" ON public.profiles;

-- Now that team_invitations uses auth.email() instead of querying profiles,
-- this policy won't cause recursion
CREATE POLICY "Users can view profiles of people who invited them"
  ON public.profiles FOR SELECT
  USING (
    id IN (
      SELECT invited_by FROM public.team_invitations
      WHERE invitee_email = auth.email()
      AND status = 'pending'
    )
  );

-- ============================================================================
-- NOTES
-- ============================================================================
-- These changes:
-- 1. Fix infinite recursion by replacing profiles query with auth.email()
-- 2. Allow invitees to see team name/description for pending invitations
-- 3. Allow members to see their team info
-- 4. Allow invitees to see the profile of who invited them
--
-- Security is maintained because:
-- - auth.email() is the authenticated user's email from JWT
-- - Only pending invitations to YOUR email grant access
-- - Only active memberships grant team visibility

-- ============================================================================
-- Fix team_members visibility using SECURITY DEFINER function
-- This avoids infinite recursion by not triggering RLS in the helper function
-- ============================================================================

-- Drop existing functions first (CASCADE removes dependent policies too)
DROP FUNCTION IF EXISTS get_user_team_ids(uuid) CASCADE;
DROP FUNCTION IF EXISTS is_team_admin(uuid, uuid) CASCADE;
DROP FUNCTION IF EXISTS has_pending_invitation(text, uuid) CASCADE;

-- Create a helper function that bypasses RLS to get user's team IDs
CREATE OR REPLACE FUNCTION get_user_team_ids(p_user_id uuid)
RETURNS SETOF uuid
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT team_id
  FROM public.team_members
  WHERE user_id = p_user_id
  AND is_active = true;
$$;

-- Create a helper function to check if user is admin of a team
CREATE OR REPLACE FUNCTION is_team_admin(p_user_id uuid, p_team_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.team_members
    WHERE user_id = p_user_id
    AND team_id = p_team_id
    AND role = 'admin'
    AND is_active = true
  );
$$;

-- Create a helper function to check if user has pending invitation
CREATE OR REPLACE FUNCTION has_pending_invitation(p_email text, p_team_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.team_invitations
    WHERE invitee_email = p_email
    AND team_id = p_team_id
    AND status = 'pending'
    AND expires_at > now()
  );
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION get_user_team_ids(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION is_team_admin(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION has_pending_invitation(text, uuid) TO authenticated;

-- Drop ALL existing team_members policies to start fresh
DROP POLICY IF EXISTS "Team members can see other members" ON public.team_members;
DROP POLICY IF EXISTS "Users can view own memberships" ON public.team_members;
DROP POLICY IF EXISTS "Users can join teams" ON public.team_members;
DROP POLICY IF EXISTS "Users can join teams via invitation" ON public.team_members;
DROP POLICY IF EXISTS "Team admins can add members" ON public.team_members;
DROP POLICY IF EXISTS "Users can update own membership" ON public.team_members;
DROP POLICY IF EXISTS "Users can leave teams" ON public.team_members;

-- ============================================================================
-- team_members SELECT policy - uses helper function to avoid recursion
-- ============================================================================
CREATE POLICY "Team members can see other members"
  ON public.team_members FOR SELECT
  USING (
    team_id IN (SELECT get_user_team_ids(auth.uid()))
    OR user_id = auth.uid()  -- Can always see your own record
  );

-- ============================================================================
-- team_members INSERT policy - uses helper functions to avoid recursion
-- ============================================================================
CREATE POLICY "Users can join teams via invitation"
  ON public.team_members FOR INSERT
  WITH CHECK (
    -- Must be inserting yourself AND have a valid invitation
    (user_id = auth.uid() AND has_pending_invitation(auth.email(), team_id))
    OR
    -- OR you're an admin of the team adding someone
    is_team_admin(auth.uid(), team_id)
  );

-- ============================================================================
-- team_members UPDATE policy
-- ============================================================================
CREATE POLICY "Team admins can update members"
  ON public.team_members FOR UPDATE
  USING (
    is_team_admin(auth.uid(), team_id)
    OR user_id = auth.uid()  -- Can update your own record
  );

-- ============================================================================
-- team_members DELETE policy
-- ============================================================================
CREATE POLICY "Team admins can remove members"
  ON public.team_members FOR DELETE
  USING (
    is_team_admin(auth.uid(), team_id)
    OR user_id = auth.uid()  -- Can remove yourself
  );

-- ============================================================================
-- Allow team members to see profiles of other team members
-- ============================================================================

DROP POLICY IF EXISTS "Team members can see other member profiles" ON public.profiles;

CREATE POLICY "Team members can see other member profiles"
  ON public.profiles FOR SELECT
  USING (
    -- The profile belongs to someone in a team with the current user
    id IN (
      SELECT tm.user_id
      FROM public.team_members tm
      WHERE tm.team_id IN (SELECT get_user_team_ids(auth.uid()))
      AND tm.is_active = true
    )
  );
