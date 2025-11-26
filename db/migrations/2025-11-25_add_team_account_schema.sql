-- ============================================================================
-- Team Account Management Schema Migration
-- Created: 2025-11-25
-- Purpose: Add team collaboration features for UC-108
-- ============================================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- SECTION 1: CUSTOM TYPES
-- ============================================================================

-- Drop existing team-related enums if they exist (to allow clean recreation)
DROP TYPE IF EXISTS team_role_enum CASCADE;
DROP TYPE IF EXISTS invitation_status_enum CASCADE;
DROP TYPE IF EXISTS subscription_tier_enum CASCADE;
DROP TYPE IF EXISTS team_activity_type_enum CASCADE;

-- Team member roles: admin can manage everything, mentor can coach candidates, candidate is being coached
CREATE TYPE team_role_enum AS ENUM ('admin', 'mentor', 'candidate');

-- Invitation status tracking
CREATE TYPE invitation_status_enum AS ENUM ('pending', 'accepted', 'declined', 'expired', 'cancelled');

-- Team subscription tiers (for future billing integration)
CREATE TYPE subscription_tier_enum AS ENUM ('free', 'starter', 'professional', 'enterprise');

-- Activity event types for audit logging
CREATE TYPE team_activity_type_enum AS ENUM (
  'team_created',
  'member_invited',
  'member_joined',
  'member_left',
  'member_removed',
  'role_changed',
  'permissions_updated',
  'candidate_assigned',
  'candidate_unassigned',
  'settings_updated'
);

-- ============================================================================
-- SECTION 2: CORE TABLES
-- ============================================================================

-- -----------------------------------------------------------------------------
-- TEAMS TABLE
-- Stores team metadata and configuration
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.teams (
  id uuid NOT NULL DEFAULT gen_random_uuid(),

  -- Team information
  name text NOT NULL,
  description text,

  -- Owner (admin who created the team)
  owner_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,

  -- Settings (JSON for flexibility)
  settings jsonb DEFAULT '{
    "allow_member_invites": false,
    "require_admin_approval": true,
    "auto_assign_candidates": false,
    "notification_preferences": {
      "member_joins": true,
      "activity_updates": true,
      "weekly_reports": true
    }
  }'::jsonb,

  -- Team statistics (denormalized for performance)
  total_members integer NOT NULL DEFAULT 1,
  total_candidates integer NOT NULL DEFAULT 0,
  total_mentors integer NOT NULL DEFAULT 0,

  -- Status
  is_active boolean NOT NULL DEFAULT true,

  -- Timestamps
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),

  CONSTRAINT teams_pkey PRIMARY KEY (id),
  CONSTRAINT teams_name_check CHECK (char_length(name) >= 2 AND char_length(name) <= 100)
);

-- Index for owner lookups
CREATE INDEX IF NOT EXISTS idx_teams_owner_id ON public.teams(owner_id);

-- Index for active teams
CREATE INDEX IF NOT EXISTS idx_teams_active ON public.teams(is_active) WHERE is_active = true;

COMMENT ON TABLE public.teams IS 'Team accounts for collaborative job search coaching';
COMMENT ON COLUMN public.teams.settings IS 'Team configuration stored as JSONB for flexibility';

-- -----------------------------------------------------------------------------
-- TEAM_MEMBERS TABLE
-- Links users to teams with roles and permissions
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.team_members (
  id uuid NOT NULL DEFAULT gen_random_uuid(),

  -- Relationships
  team_id uuid NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,

  -- Role within the team
  role team_role_enum NOT NULL DEFAULT 'candidate',

  -- Invitation tracking
  invited_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  invited_at timestamp with time zone,
  joined_at timestamp with time zone NOT NULL DEFAULT now(),

  -- Member status
  is_active boolean NOT NULL DEFAULT true,

  -- Custom permissions override (JSONB for granular control)
  custom_permissions jsonb DEFAULT '{
    "can_view_all_candidates": false,
    "can_edit_candidates": false,
    "can_invite_members": false,
    "can_remove_members": false,
    "can_change_roles": false,
    "can_view_analytics": true,
    "can_export_data": false,
    "can_manage_team_settings": false
  }'::jsonb,

  -- Metadata
  metadata jsonb DEFAULT '{}'::jsonb,

  -- Timestamps
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),

  CONSTRAINT team_members_pkey PRIMARY KEY (id),
  -- A user can only be in a team once
  CONSTRAINT team_members_team_user_unique UNIQUE (team_id, user_id)
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_team_members_team_id ON public.team_members(team_id);
CREATE INDEX IF NOT EXISTS idx_team_members_user_id ON public.team_members(user_id);
CREATE INDEX IF NOT EXISTS idx_team_members_role ON public.team_members(team_id, role) WHERE is_active = true;

COMMENT ON TABLE public.team_members IS 'User membership in teams with roles and permissions';
COMMENT ON COLUMN public.team_members.custom_permissions IS 'Override default role permissions for specific members';

-- -----------------------------------------------------------------------------
-- TEAM_INVITATIONS TABLE
-- Tracks pending and historical team invitations
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.team_invitations (
  id uuid NOT NULL DEFAULT gen_random_uuid(),

  -- Team and inviter
  team_id uuid NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  invited_by uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,

  -- Invitee information
  invitee_email text NOT NULL,
  invitee_user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,

  -- Invitation details
  role team_role_enum NOT NULL DEFAULT 'candidate',
  message text,

  -- Security token for acceptance (unique, secure random string)
  invitation_token text NOT NULL UNIQUE,

  -- Status tracking
  status invitation_status_enum NOT NULL DEFAULT 'pending',

  -- Expiry (default 7 days from creation)
  expires_at timestamp with time zone NOT NULL DEFAULT (now() + interval '7 days'),

  -- Response tracking
  accepted_at timestamp with time zone,
  declined_at timestamp with time zone,
  declined_reason text,

  -- Timestamps
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),

  CONSTRAINT team_invitations_pkey PRIMARY KEY (id),
  CONSTRAINT team_invitations_email_check CHECK (invitee_email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

-- Indexes for invitation lookups
CREATE INDEX IF NOT EXISTS idx_team_invitations_token ON public.team_invitations(invitation_token);
CREATE INDEX IF NOT EXISTS idx_team_invitations_team_id ON public.team_invitations(team_id);
CREATE INDEX IF NOT EXISTS idx_team_invitations_email ON public.team_invitations(invitee_email);
CREATE INDEX IF NOT EXISTS idx_team_invitations_status ON public.team_invitations(team_id, status) WHERE status = 'pending';

COMMENT ON TABLE public.team_invitations IS 'Invitation management for team membership';
COMMENT ON COLUMN public.team_invitations.invitation_token IS 'Secure token for accepting invitation via email link';

-- -----------------------------------------------------------------------------
-- TEAM_MEMBER_ASSIGNMENTS TABLE
-- Links mentors to specific candidates for focused coaching
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.team_member_assignments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),

  -- Team context
  team_id uuid NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,

  -- Mentor and candidate relationship
  mentor_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  candidate_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,

  -- Assignment details
  assigned_by uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  assigned_at timestamp with time zone NOT NULL DEFAULT now(),

  -- Status
  is_active boolean NOT NULL DEFAULT true,

  -- Notes about the assignment
  notes text,

  -- Timestamps
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),

  CONSTRAINT team_member_assignments_pkey PRIMARY KEY (id),
  -- Prevent duplicate active assignments
  CONSTRAINT team_assignments_unique UNIQUE (team_id, mentor_id, candidate_id, is_active)
    DEFERRABLE INITIALLY DEFERRED,
  -- Can't assign yourself
  CONSTRAINT team_assignments_different_users CHECK (mentor_id != candidate_id)
);

-- Indexes for mentor/candidate lookups
CREATE INDEX IF NOT EXISTS idx_team_assignments_mentor ON public.team_member_assignments(mentor_id, is_active);
CREATE INDEX IF NOT EXISTS idx_team_assignments_candidate ON public.team_member_assignments(candidate_id, is_active);
CREATE INDEX IF NOT EXISTS idx_team_assignments_team ON public.team_member_assignments(team_id);

COMMENT ON TABLE public.team_member_assignments IS 'Mentor-candidate assignments within teams';

-- ============================================================================
-- SECTION 3: SUPPORTING TABLES
-- ============================================================================

-- -----------------------------------------------------------------------------
-- TEAM_ACTIVITY_LOG TABLE
-- Audit trail for team actions
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.team_activity_log (
  id uuid NOT NULL DEFAULT gen_random_uuid(),

  -- Team context
  team_id uuid NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,

  -- Actor (who performed the action)
  actor_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,

  -- Activity details
  activity_type team_activity_type_enum NOT NULL,
  description text NOT NULL,

  -- Target (who/what was affected)
  target_user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,

  -- Additional context (JSON for flexibility)
  metadata jsonb DEFAULT '{}'::jsonb,

  -- Timestamp
  created_at timestamp with time zone NOT NULL DEFAULT now(),

  CONSTRAINT team_activity_log_pkey PRIMARY KEY (id)
);

-- Indexes for activity queries
CREATE INDEX IF NOT EXISTS idx_activity_log_team ON public.team_activity_log(team_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_log_actor ON public.team_activity_log(actor_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_log_type ON public.team_activity_log(team_id, activity_type);

COMMENT ON TABLE public.team_activity_log IS 'Audit trail of team activities and changes';

-- -----------------------------------------------------------------------------
-- TEAM_MESSAGES TABLE
-- Internal team communication
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.team_messages (
  id uuid NOT NULL DEFAULT gen_random_uuid(),

  -- Team context
  team_id uuid NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,

  -- Message details
  sender_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  message_text text NOT NULL,

  -- Thread support (optional parent message for replies)
  parent_message_id uuid REFERENCES public.team_messages(id) ON DELETE CASCADE,

  -- Mentions (array of user IDs mentioned in message)
  mentioned_users uuid[] DEFAULT ARRAY[]::uuid[],

  -- Attachments (store file paths/URLs)
  attachments jsonb DEFAULT '[]'::jsonb,

  -- Message status
  is_edited boolean NOT NULL DEFAULT false,
  edited_at timestamp with time zone,
  is_deleted boolean NOT NULL DEFAULT false,

  -- Timestamps
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),

  CONSTRAINT team_messages_pkey PRIMARY KEY (id),
  CONSTRAINT team_messages_text_check CHECK (char_length(message_text) >= 1 AND char_length(message_text) <= 5000)
);

-- Indexes for message retrieval
CREATE INDEX IF NOT EXISTS idx_team_messages_team ON public.team_messages(team_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_team_messages_sender ON public.team_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_team_messages_parent ON public.team_messages(parent_message_id) WHERE parent_message_id IS NOT NULL;

COMMENT ON TABLE public.team_messages IS 'Internal messaging system for team communication';

-- -----------------------------------------------------------------------------
-- SUBSCRIPTION_PLANS TABLE (System table - no user_id)
-- Defines available subscription tiers
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.subscription_plans (
  id uuid NOT NULL DEFAULT gen_random_uuid(),

  -- Plan details
  name text NOT NULL UNIQUE,
  tier subscription_tier_enum NOT NULL UNIQUE,
  description text,

  -- Pricing (in cents to avoid floating point issues)
  monthly_price_cents integer NOT NULL DEFAULT 0,
  annual_price_cents integer NOT NULL DEFAULT 0,

  -- Feature limits
  limits jsonb NOT NULL DEFAULT '{
    "max_team_members": 5,
    "max_candidates": 3,
    "max_mentors": 2,
    "max_storage_mb": 1000,
    "max_ai_generations_per_month": 50,
    "analytics_retention_days": 90,
    "priority_support": false,
    "custom_branding": false,
    "api_access": false
  }'::jsonb,

  -- Status
  is_active boolean NOT NULL DEFAULT true,

  -- Timestamps
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),

  CONSTRAINT subscription_plans_pkey PRIMARY KEY (id),
  CONSTRAINT subscription_plans_price_check CHECK (monthly_price_cents >= 0 AND annual_price_cents >= 0)
);

COMMENT ON TABLE public.subscription_plans IS 'Available subscription tiers and pricing';

-- -----------------------------------------------------------------------------
-- TEAM_SUBSCRIPTIONS TABLE
-- Tracks team subscription status and billing
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.team_subscriptions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),

  -- Team relationship
  team_id uuid NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE UNIQUE,

  -- Subscription details
  plan_id uuid NOT NULL REFERENCES public.subscription_plans(id),
  tier subscription_tier_enum NOT NULL DEFAULT 'free',

  -- Billing status
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'past_due', 'cancelled', 'expired', 'trialing')),

  -- Billing dates
  current_period_start timestamp with time zone NOT NULL DEFAULT now(),
  current_period_end timestamp with time zone NOT NULL DEFAULT (now() + interval '30 days'),
  trial_end timestamp with time zone,
  cancelled_at timestamp with time zone,

  -- Payment integration (placeholder for Stripe)
  stripe_customer_id text,
  stripe_subscription_id text,

  -- Usage tracking (denormalized for quick access)
  usage_stats jsonb DEFAULT '{
    "current_members": 0,
    "current_candidates": 0,
    "ai_generations_this_month": 0,
    "storage_used_mb": 0
  }'::jsonb,

  -- Metadata
  metadata jsonb DEFAULT '{}'::jsonb,

  -- Timestamps
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),

  CONSTRAINT team_subscriptions_pkey PRIMARY KEY (id)
);

-- Indexes for subscription queries
CREATE INDEX IF NOT EXISTS idx_team_subscriptions_team ON public.team_subscriptions(team_id);
CREATE INDEX IF NOT EXISTS idx_team_subscriptions_status ON public.team_subscriptions(status) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_team_subscriptions_stripe ON public.team_subscriptions(stripe_subscription_id) WHERE stripe_subscription_id IS NOT NULL;

COMMENT ON TABLE public.team_subscriptions IS 'Team subscription management and billing tracking';

-- -----------------------------------------------------------------------------
-- TEAM_SETTINGS TABLE
-- Additional team configuration and branding
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.team_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid(),

  -- Team relationship (one-to-one)
  team_id uuid NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE UNIQUE,

  -- Branding
  logo_url text,
  primary_color text DEFAULT '#2563eb',
  secondary_color text DEFAULT '#64748b',

  -- Custom domain (for white-label enterprise)
  custom_domain text,

  -- Email preferences
  email_settings jsonb DEFAULT '{
    "send_welcome_emails": true,
    "send_invitation_reminders": true,
    "weekly_digest_enabled": true,
    "notification_email": null
  }'::jsonb,

  -- Feature flags
  feature_flags jsonb DEFAULT '{
    "enable_messaging": true,
    "enable_analytics": true,
    "enable_reports": true,
    "enable_candidate_assignment": true
  }'::jsonb,

  -- Timestamps
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),

  CONSTRAINT team_settings_pkey PRIMARY KEY (id),
  CONSTRAINT team_settings_color_format CHECK (
    primary_color ~* '^#[0-9A-Fa-f]{6}$' AND
    secondary_color ~* '^#[0-9A-Fa-f]{6}$'
  )
);

COMMENT ON TABLE public.team_settings IS 'Extended team configuration and branding options';

-- ============================================================================
-- SECTION 4: ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all team tables
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_member_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_settings ENABLE ROW LEVEL SECURITY;
-- subscription_plans is a system table, no RLS needed

-- -----------------------------------------------------------------------------
-- TEAMS TABLE POLICIES
-- Users can see teams they're members of or own
-- -----------------------------------------------------------------------------
CREATE POLICY "Users can view their teams"
  ON public.teams FOR SELECT
  USING (
    owner_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.team_members tm
      WHERE tm.team_id = teams.id
        AND tm.user_id = auth.uid()
        AND tm.is_active = true
    )
  );

-- Only owners can insert new teams
CREATE POLICY "Users can create teams"
  ON public.teams FOR INSERT
  WITH CHECK (owner_id = auth.uid());

-- Only owners can update teams
CREATE POLICY "Team owners can update teams"
  ON public.teams FOR UPDATE
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

-- Only owners can delete teams
CREATE POLICY "Team owners can delete teams"
  ON public.teams FOR DELETE
  USING (owner_id = auth.uid());

-- -----------------------------------------------------------------------------
-- TEAM_MEMBERS TABLE POLICIES
-- Members can view other members in their teams
-- -----------------------------------------------------------------------------
CREATE POLICY "Team members can view team membership"
  ON public.team_members FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.team_members tm
      WHERE tm.team_id = team_members.team_id
        AND tm.user_id = auth.uid()
        AND tm.is_active = true
    )
  );

-- Admins can add members (handled by invitation system mostly)
CREATE POLICY "Team admins can add members"
  ON public.team_members FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.team_members tm
      WHERE tm.team_id = team_members.team_id
        AND tm.user_id = auth.uid()
        AND tm.role = 'admin'
        AND tm.is_active = true
    )
  );

-- Admins can update member roles and permissions
CREATE POLICY "Team admins can update members"
  ON public.team_members FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.team_members tm
      WHERE tm.team_id = team_members.team_id
        AND tm.user_id = auth.uid()
        AND tm.role = 'admin'
        AND tm.is_active = true
    )
  );

-- Admins can remove members, or users can remove themselves
CREATE POLICY "Team admins can remove members or self-removal"
  ON public.team_members FOR DELETE
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.team_members tm
      WHERE tm.team_id = team_members.team_id
        AND tm.user_id = auth.uid()
        AND tm.role = 'admin'
        AND tm.is_active = true
    )
  );

-- -----------------------------------------------------------------------------
-- TEAM_INVITATIONS TABLE POLICIES
-- Team members can view invitations, admins can create/manage
-- -----------------------------------------------------------------------------
CREATE POLICY "Team members can view invitations"
  ON public.team_invitations FOR SELECT
  USING (
    invitee_email = (SELECT email FROM public.profiles WHERE id = auth.uid()) OR
    invitee_user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.team_members tm
      WHERE tm.team_id = team_invitations.team_id
        AND tm.user_id = auth.uid()
        AND tm.is_active = true
    )
  );

-- Admins can create invitations
CREATE POLICY "Team admins can create invitations"
  ON public.team_invitations FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.team_members tm
      WHERE tm.team_id = team_invitations.team_id
        AND tm.user_id = auth.uid()
        AND tm.role = 'admin'
        AND tm.is_active = true
    )
  );

-- Invitees can update their invitation (accept/decline)
CREATE POLICY "Invitees can update their invitations"
  ON public.team_invitations FOR UPDATE
  USING (
    invitee_email = (SELECT email FROM public.profiles WHERE id = auth.uid()) OR
    invitee_user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.team_members tm
      WHERE tm.team_id = team_invitations.team_id
        AND tm.user_id = auth.uid()
        AND tm.role = 'admin'
        AND tm.is_active = true
    )
  );

-- -----------------------------------------------------------------------------
-- TEAM_MEMBER_ASSIGNMENTS TABLE POLICIES
-- Mentors, candidates, and admins can view assignments
-- -----------------------------------------------------------------------------
CREATE POLICY "Team members can view assignments"
  ON public.team_member_assignments FOR SELECT
  USING (
    mentor_id = auth.uid() OR
    candidate_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.team_members tm
      WHERE tm.team_id = team_member_assignments.team_id
        AND tm.user_id = auth.uid()
        AND tm.role = 'admin'
        AND tm.is_active = true
    )
  );

-- Only admins can create assignments
CREATE POLICY "Team admins can create assignments"
  ON public.team_member_assignments FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.team_members tm
      WHERE tm.team_id = team_member_assignments.team_id
        AND tm.user_id = auth.uid()
        AND tm.role = 'admin'
        AND tm.is_active = true
    )
  );

-- Only admins can update assignments
CREATE POLICY "Team admins can update assignments"
  ON public.team_member_assignments FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.team_members tm
      WHERE tm.team_id = team_member_assignments.team_id
        AND tm.user_id = auth.uid()
        AND tm.role = 'admin'
        AND tm.is_active = true
    )
  );

-- Only admins can delete assignments
CREATE POLICY "Team admins can delete assignments"
  ON public.team_member_assignments FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.team_members tm
      WHERE tm.team_id = team_member_assignments.team_id
        AND tm.user_id = auth.uid()
        AND tm.role = 'admin'
        AND tm.is_active = true
    )
  );

-- -----------------------------------------------------------------------------
-- TEAM_ACTIVITY_LOG TABLE POLICIES
-- Team members can view activity logs
-- -----------------------------------------------------------------------------
CREATE POLICY "Team members can view activity logs"
  ON public.team_activity_log FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.team_members tm
      WHERE tm.team_id = team_activity_log.team_id
        AND tm.user_id = auth.uid()
        AND tm.is_active = true
    )
  );

-- Anyone can insert activity logs (used by triggers)
CREATE POLICY "Enable activity log inserts"
  ON public.team_activity_log FOR INSERT
  WITH CHECK (true);

-- -----------------------------------------------------------------------------
-- TEAM_MESSAGES TABLE POLICIES
-- Team members can view and send messages
-- -----------------------------------------------------------------------------
CREATE POLICY "Team members can view messages"
  ON public.team_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.team_members tm
      WHERE tm.team_id = team_messages.team_id
        AND tm.user_id = auth.uid()
        AND tm.is_active = true
    )
  );

-- Team members can send messages
CREATE POLICY "Team members can send messages"
  ON public.team_messages FOR INSERT
  WITH CHECK (
    sender_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.team_members tm
      WHERE tm.team_id = team_messages.team_id
        AND tm.user_id = auth.uid()
        AND tm.is_active = true
    )
  );

-- Users can update their own messages
CREATE POLICY "Users can update their own messages"
  ON public.team_messages FOR UPDATE
  USING (sender_id = auth.uid())
  WITH CHECK (sender_id = auth.uid());

-- Users can delete their own messages
CREATE POLICY "Users can delete their own messages"
  ON public.team_messages FOR DELETE
  USING (sender_id = auth.uid());

-- -----------------------------------------------------------------------------
-- TEAM_SUBSCRIPTIONS TABLE POLICIES
-- Team admins can view/manage subscriptions
-- -----------------------------------------------------------------------------
CREATE POLICY "Team admins can view subscriptions"
  ON public.team_subscriptions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.teams t
      JOIN public.team_members tm ON tm.team_id = t.id
      WHERE t.id = team_subscriptions.team_id
        AND tm.user_id = auth.uid()
        AND tm.role = 'admin'
        AND tm.is_active = true
    )
  );

CREATE POLICY "Team admins can manage subscriptions"
  ON public.team_subscriptions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.teams t
      JOIN public.team_members tm ON tm.team_id = t.id
      WHERE t.id = team_subscriptions.team_id
        AND tm.user_id = auth.uid()
        AND tm.role = 'admin'
        AND tm.is_active = true
    )
  );

-- -----------------------------------------------------------------------------
-- TEAM_SETTINGS TABLE POLICIES
-- Team admins can view/manage settings
-- -----------------------------------------------------------------------------
CREATE POLICY "Team members can view settings"
  ON public.team_settings FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.team_members tm
      WHERE tm.team_id = team_settings.team_id
        AND tm.user_id = auth.uid()
        AND tm.is_active = true
    )
  );

CREATE POLICY "Team admins can manage settings"
  ON public.team_settings FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.teams t
      JOIN public.team_members tm ON tm.team_id = t.id
      WHERE t.id = team_settings.team_id
        AND tm.user_id = auth.uid()
        AND tm.role = 'admin'
        AND tm.is_active = true
    )
  );

-- ============================================================================
-- SECTION 5: DATABASE FUNCTIONS
-- ============================================================================

-- -----------------------------------------------------------------------------
-- Function: check_team_permission
-- Checks if a user has a specific permission in a team
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION check_team_permission(
  p_user_id uuid,
  p_team_id uuid,
  p_permission text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_member_record RECORD;
  v_has_permission boolean;
BEGIN
  -- Get the team member record
  SELECT role, custom_permissions INTO v_member_record
  FROM public.team_members
  WHERE team_id = p_team_id
    AND user_id = p_user_id
    AND is_active = true;

  -- If not a member, return false
  IF NOT FOUND THEN
    RETURN false;
  END IF;

  -- Admins have all permissions
  IF v_member_record.role = 'admin' THEN
    RETURN true;
  END IF;

  -- Check custom permissions if set
  IF v_member_record.custom_permissions ? p_permission THEN
    RETURN (v_member_record.custom_permissions->p_permission)::boolean;
  END IF;

  -- Default permissions based on role
  CASE p_permission
    WHEN 'can_view_all_candidates' THEN
      v_has_permission := v_member_record.role IN ('admin', 'mentor');
    WHEN 'can_edit_candidates' THEN
      v_has_permission := v_member_record.role = 'admin';
    WHEN 'can_invite_members' THEN
      v_has_permission := v_member_record.role = 'admin';
    WHEN 'can_remove_members' THEN
      v_has_permission := v_member_record.role = 'admin';
    WHEN 'can_change_roles' THEN
      v_has_permission := v_member_record.role = 'admin';
    WHEN 'can_view_analytics' THEN
      v_has_permission := true; -- All members can view analytics
    WHEN 'can_export_data' THEN
      v_has_permission := v_member_record.role IN ('admin', 'mentor');
    WHEN 'can_manage_team_settings' THEN
      v_has_permission := v_member_record.role = 'admin';
    ELSE
      v_has_permission := false;
  END CASE;

  RETURN v_has_permission;
END;
$$;

COMMENT ON FUNCTION check_team_permission IS 'Check if user has specific permission in team';

-- -----------------------------------------------------------------------------
-- Function: get_user_teams
-- Get all teams a user is a member of
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION get_user_teams(p_user_id uuid)
RETURNS TABLE (
  team_id uuid,
  team_name text,
  team_description text,
  role team_role_enum,
  is_owner boolean,
  member_count integer,
  joined_at timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    t.id AS team_id,
    t.name AS team_name,
    t.description AS team_description,
    tm.role,
    (t.owner_id = p_user_id) AS is_owner,
    t.total_members AS member_count,
    tm.joined_at
  FROM public.teams t
  JOIN public.team_members tm ON tm.team_id = t.id
  WHERE tm.user_id = p_user_id
    AND tm.is_active = true
    AND t.is_active = true
  ORDER BY tm.joined_at DESC;
END;
$$;

COMMENT ON FUNCTION get_user_teams IS 'Get all teams user is a member of with role information';

-- -----------------------------------------------------------------------------
-- Function: get_assigned_candidates
-- Get candidates assigned to a mentor
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION get_assigned_candidates(
  p_mentor_id uuid,
  p_team_id uuid DEFAULT NULL
)
RETURNS TABLE (
  candidate_id uuid,
  candidate_name text,
  candidate_email text,
  team_id uuid,
  team_name text,
  assigned_at timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id AS candidate_id,
    p.full_name AS candidate_name,
    p.email AS candidate_email,
    t.id AS team_id,
    t.name AS team_name,
    tma.assigned_at
  FROM public.team_member_assignments tma
  JOIN public.profiles p ON p.id = tma.candidate_id
  JOIN public.teams t ON t.id = tma.team_id
  WHERE tma.mentor_id = p_mentor_id
    AND tma.is_active = true
    AND (p_team_id IS NULL OR tma.team_id = p_team_id)
  ORDER BY tma.assigned_at DESC;
END;
$$;

COMMENT ON FUNCTION get_assigned_candidates IS 'Get all candidates assigned to a mentor';

-- ============================================================================
-- SECTION 6: TRIGGERS
-- ============================================================================

-- Create trigger function for updated_at
CREATE OR REPLACE FUNCTION update_team_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Apply updated_at trigger to all team tables
CREATE TRIGGER update_teams_updated_at
  BEFORE UPDATE ON public.teams
  FOR EACH ROW
  EXECUTE FUNCTION update_team_updated_at();

CREATE TRIGGER update_team_members_updated_at
  BEFORE UPDATE ON public.team_members
  FOR EACH ROW
  EXECUTE FUNCTION update_team_updated_at();

CREATE TRIGGER update_team_invitations_updated_at
  BEFORE UPDATE ON public.team_invitations
  FOR EACH ROW
  EXECUTE FUNCTION update_team_updated_at();

CREATE TRIGGER update_team_assignments_updated_at
  BEFORE UPDATE ON public.team_member_assignments
  FOR EACH ROW
  EXECUTE FUNCTION update_team_updated_at();

CREATE TRIGGER update_team_messages_updated_at
  BEFORE UPDATE ON public.team_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_team_updated_at();

CREATE TRIGGER update_team_subscriptions_updated_at
  BEFORE UPDATE ON public.team_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_team_updated_at();

CREATE TRIGGER update_team_settings_updated_at
  BEFORE UPDATE ON public.team_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_team_updated_at();

-- Trigger to update team statistics when members join/leave
CREATE OR REPLACE FUNCTION update_team_member_stats()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Update team member counts
  UPDATE public.teams
  SET
    total_members = (
      SELECT COUNT(*)
      FROM public.team_members
      WHERE team_id = COALESCE(NEW.team_id, OLD.team_id)
        AND is_active = true
    ),
    total_candidates = (
      SELECT COUNT(*)
      FROM public.team_members
      WHERE team_id = COALESCE(NEW.team_id, OLD.team_id)
        AND is_active = true
        AND role = 'candidate'
    ),
    total_mentors = (
      SELECT COUNT(*)
      FROM public.team_members
      WHERE team_id = COALESCE(NEW.team_id, OLD.team_id)
        AND is_active = true
        AND role = 'mentor'
    )
  WHERE id = COALESCE(NEW.team_id, OLD.team_id);

  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER update_team_stats_on_member_change
  AFTER INSERT OR UPDATE OR DELETE ON public.team_members
  FOR EACH ROW
  EXECUTE FUNCTION update_team_member_stats();

-- ============================================================================
-- SECTION 7: SEED DATA
-- ============================================================================

-- Insert default subscription plans
INSERT INTO public.subscription_plans (name, tier, description, monthly_price_cents, annual_price_cents, limits)
VALUES
  (
    'Free',
    'free',
    'Perfect for individual job seekers',
    0,
    0,
    '{
      "max_team_members": 1,
      "max_candidates": 1,
      "max_mentors": 0,
      "max_storage_mb": 100,
      "max_ai_generations_per_month": 10,
      "analytics_retention_days": 30,
      "priority_support": false,
      "custom_branding": false,
      "api_access": false
    }'::jsonb
  ),
  (
    'Starter',
    'starter',
    'For small teams and mentors',
    1999,
    19990,
    '{
      "max_team_members": 5,
      "max_candidates": 3,
      "max_mentors": 2,
      "max_storage_mb": 1000,
      "max_ai_generations_per_month": 50,
      "analytics_retention_days": 90,
      "priority_support": false,
      "custom_branding": false,
      "api_access": false
    }'::jsonb
  ),
  (
    'Professional',
    'professional',
    'For career coaches and agencies',
    4999,
    49990,
    '{
      "max_team_members": 25,
      "max_candidates": 15,
      "max_mentors": 10,
      "max_storage_mb": 10000,
      "max_ai_generations_per_month": 500,
      "analytics_retention_days": 365,
      "priority_support": true,
      "custom_branding": true,
      "api_access": false
    }'::jsonb
  ),
  (
    'Enterprise',
    'enterprise',
    'For large organizations and universities',
    14999,
    149990,
    '{
      "max_team_members": null,
      "max_candidates": null,
      "max_mentors": null,
      "max_storage_mb": null,
      "max_ai_generations_per_month": null,
      "analytics_retention_days": null,
      "priority_support": true,
      "custom_branding": true,
      "api_access": true
    }'::jsonb
  )
ON CONFLICT (tier) DO NOTHING;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Team Account Management schema migration completed successfully!';
  RAISE NOTICE 'Created tables: teams, team_members, team_invitations, team_member_assignments, team_activity_log, team_messages, subscription_plans, team_subscriptions, team_settings';
  RAISE NOTICE 'Created custom types: team_role_enum, invitation_status_enum, subscription_tier_enum, team_activity_type_enum';
  RAISE NOTICE 'Applied RLS policies for multi-user access control';
  RAISE NOTICE 'Seeded subscription plans: Free, Starter, Professional, Enterprise';
END $$;
