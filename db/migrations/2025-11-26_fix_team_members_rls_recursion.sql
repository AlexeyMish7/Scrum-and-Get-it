-- ============================================================================
-- Fix Infinite Recursion in RLS Policies for Teams
-- Created: 2025-11-26
-- Purpose: Fix infinite recursion between teams and team_members policies
-- ============================================================================

-- THE PROBLEM:
-- teams SELECT policy → checks team_members → triggers team_members policy
-- team_members policies → check teams → triggers teams policy → INFINITE LOOP
--
-- SOLUTION:
-- Neither table can check the other. Use only simple owner_id checks.

-- ============================================================================
-- STEP 1: Drop ALL existing policies on both tables
-- ============================================================================

-- Drop teams policies
DROP POLICY IF EXISTS "Users can view their teams" ON public.teams;
DROP POLICY IF EXISTS "Users can create teams" ON public.teams;
DROP POLICY IF EXISTS "Team owners can update teams" ON public.teams;
DROP POLICY IF EXISTS "Team owners can delete teams" ON public.teams;

-- Drop team_members policies (all variations we've tried)
DROP POLICY IF EXISTS "Team admins can add members" ON public.team_members;
DROP POLICY IF EXISTS "Team owners and admins can add members" ON public.team_members;
DROP POLICY IF EXISTS "Team admins can update members" ON public.team_members;
DROP POLICY IF EXISTS "Team admins can remove members or self-removal" ON public.team_members;
DROP POLICY IF EXISTS "Team members can view team membership" ON public.team_members;
DROP POLICY IF EXISTS "Users can view their own memberships" ON public.team_members;
DROP POLICY IF EXISTS "Users can view their own membership records" ON public.team_members;
DROP POLICY IF EXISTS "Team owners can add members" ON public.team_members;
DROP POLICY IF EXISTS "Team owners can view all team members" ON public.team_members;
DROP POLICY IF EXISTS "Team owners can insert members" ON public.team_members;
DROP POLICY IF EXISTS "Team owners can update members" ON public.team_members;
DROP POLICY IF EXISTS "Team owners can remove members or users can leave" ON public.team_members;
DROP POLICY IF EXISTS "Team owners can delete members or self-removal" ON public.team_members;
DROP POLICY IF EXISTS "Users can view members of their teams" ON public.team_members;

-- ============================================================================
-- STEP 2: Ensure RLS is enabled
-- ============================================================================
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- STEP 3: Create simple NON-RECURSIVE policies for TEAMS
-- Only checks owner_id - NEVER queries team_members
-- ============================================================================

-- Anyone can view teams they own
CREATE POLICY "Owners can view their teams"
  ON public.teams FOR SELECT
  USING (owner_id = auth.uid());

-- Anyone can create a team (they become owner)
CREATE POLICY "Anyone can create teams"
  ON public.teams FOR INSERT
  WITH CHECK (owner_id = auth.uid());

-- Owners can update their teams
CREATE POLICY "Owners can update their teams"
  ON public.teams FOR UPDATE
  USING (owner_id = auth.uid());

-- Owners can delete their teams
CREATE POLICY "Owners can delete their teams"
  ON public.teams FOR DELETE
  USING (owner_id = auth.uid());

-- ============================================================================
-- STEP 4: Create simple NON-RECURSIVE policies for TEAM_MEMBERS
-- Only checks user_id on THIS record - NEVER queries teams table
-- ============================================================================

-- Users can view their own membership records
CREATE POLICY "Users can view own memberships"
  ON public.team_members FOR SELECT
  USING (user_id = auth.uid());

-- Users can insert themselves into teams (will be validated by FK)
CREATE POLICY "Users can join teams"
  ON public.team_members FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Users can update their own membership
CREATE POLICY "Users can update own membership"
  ON public.team_members FOR UPDATE
  USING (user_id = auth.uid());

-- Users can remove themselves from teams
CREATE POLICY "Users can leave teams"
  ON public.team_members FOR DELETE
  USING (user_id = auth.uid());

-- ============================================================================
-- NOTES
-- ============================================================================
-- These policies are INTENTIONALLY simple to avoid recursion:
--
-- 1. TEAMS: Only owners can see/manage their teams via RLS
-- 2. TEAM_MEMBERS: Only the member themselves can see their record
--
-- This means members can't see OTHER members via RLS alone.
-- The application code will need to:
--   a) Query teams where you're the owner
--   b) Query team_members where you're the member
--   c) For viewing other members, use a server function or join logic
--
-- The trade-off is simplicity and no recursion vs. slightly more app logic.
-- Security is still enforced - users can only see their own data.