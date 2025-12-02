-- Migration: Fix achievement_celebrations RLS policies
-- Purpose: Allow team members to view shared celebrations without requiring progress_sharing_settings
-- Date: 2025-12-02

-- Drop the existing restrictive policy
DROP POLICY IF EXISTS "Team members can view shared celebrations" ON public.achievement_celebrations;

-- Create a simpler policy that allows team members to view any shared celebration in their team
CREATE POLICY "Team members can view shared celebrations"
  ON public.achievement_celebrations FOR SELECT
  USING (
    is_shared = true
    AND EXISTS (
      SELECT 1 FROM public.team_members tm
      WHERE tm.team_id = achievement_celebrations.team_id
        AND tm.user_id = auth.uid()
        AND tm.is_active = true
    )
  );

-- Also ensure the creator can always see their celebration
DROP POLICY IF EXISTS "Creators can view celebrations they created" ON public.achievement_celebrations;
CREATE POLICY "Creators can view celebrations they created"
  ON public.achievement_celebrations FOR SELECT
  USING (created_by = auth.uid());

-- Improve insert policy to allow any team member to create a celebration for themselves or others in team
DROP POLICY IF EXISTS "Allow celebration creation" ON public.achievement_celebrations;
CREATE POLICY "Allow celebration creation"
  ON public.achievement_celebrations FOR INSERT
  WITH CHECK (
    -- User can create celebrations for themselves
    user_id = auth.uid()
    OR created_by = auth.uid()  -- Mentor/team member creating for another member
    OR created_by IS NULL  -- Auto-generated celebrations
  );

-- Improve update policy for team reactions
DROP POLICY IF EXISTS "Team members can react to celebrations" ON public.achievement_celebrations;
CREATE POLICY "Team members can react to celebrations"
  ON public.achievement_celebrations FOR UPDATE
  USING (
    is_shared = true
    AND EXISTS (
      SELECT 1 FROM public.team_members tm
      WHERE tm.team_id = achievement_celebrations.team_id
        AND tm.user_id = auth.uid()
        AND tm.is_active = true
    )
  );

COMMENT ON POLICY "Team members can view shared celebrations" ON public.achievement_celebrations
  IS 'Allow any active team member to view shared celebrations in their team';
