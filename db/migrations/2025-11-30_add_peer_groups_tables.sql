-- ============================================================================
-- UC-112: Peer Networking and Support Groups
-- Migration: Create tables for peer support groups, discussions, challenges,
-- success stories, referrals, and networking impact tracking
-- ============================================================================

-- ============================================================================
-- ROLLBACK: Drop existing objects if re-running migration
-- ============================================================================

-- Drop policies first (they depend on tables)
DROP POLICY IF EXISTS "Anyone can view public groups" ON peer_groups;
DROP POLICY IF EXISTS "Members can view their private groups" ON peer_groups;
DROP POLICY IF EXISTS "Authenticated users can create groups" ON peer_groups;
DROP POLICY IF EXISTS "Group owners can update groups" ON peer_groups;

DROP POLICY IF EXISTS "Users can view their own membership" ON peer_group_members;
DROP POLICY IF EXISTS "Members can view group members" ON peer_group_members;
DROP POLICY IF EXISTS "Users can join public groups" ON peer_group_members;
DROP POLICY IF EXISTS "Users can update their own membership" ON peer_group_members;
DROP POLICY IF EXISTS "Users can leave groups" ON peer_group_members;

DROP POLICY IF EXISTS "Members can view group posts" ON peer_group_posts;
DROP POLICY IF EXISTS "Members can create posts" ON peer_group_posts;
DROP POLICY IF EXISTS "Authors can update their posts" ON peer_group_posts;
DROP POLICY IF EXISTS "Authors can delete their posts" ON peer_group_posts;

DROP POLICY IF EXISTS "Users can see post likes" ON peer_post_likes;
DROP POLICY IF EXISTS "Users can like posts" ON peer_post_likes;
DROP POLICY IF EXISTS "Users can unlike posts" ON peer_post_likes;

DROP POLICY IF EXISTS "Members can view challenges" ON peer_group_challenges;
DROP POLICY IF EXISTS "Members can create challenges" ON peer_group_challenges;
DROP POLICY IF EXISTS "Challenge creators can update" ON peer_group_challenges;

DROP POLICY IF EXISTS "Group members can view participants" ON peer_challenge_participants;
DROP POLICY IF EXISTS "Users can join challenges" ON peer_challenge_participants;
DROP POLICY IF EXISTS "Users can update their participation" ON peer_challenge_participants;

DROP POLICY IF EXISTS "Anyone can view approved stories" ON peer_success_stories;
DROP POLICY IF EXISTS "Users can create stories" ON peer_success_stories;
DROP POLICY IF EXISTS "Authors can update stories" ON peer_success_stories;

DROP POLICY IF EXISTS "Group members can view referrals" ON peer_referrals;
DROP POLICY IF EXISTS "Members can share referrals" ON peer_referrals;
DROP POLICY IF EXISTS "Sharers can update referrals" ON peer_referrals;

DROP POLICY IF EXISTS "Users can view referral interests" ON peer_referral_interests;
DROP POLICY IF EXISTS "Users can express interest" ON peer_referral_interests;
DROP POLICY IF EXISTS "Users can update their interest" ON peer_referral_interests;

DROP POLICY IF EXISTS "Users can view their own impact" ON peer_networking_impact;
DROP POLICY IF EXISTS "Users can insert their own impact" ON peer_networking_impact;
DROP POLICY IF EXISTS "Users can update their own impact" ON peer_networking_impact;

DROP POLICY IF EXISTS "Users can view their own settings" ON user_peer_settings;
DROP POLICY IF EXISTS "Users can insert their own settings" ON user_peer_settings;
DROP POLICY IF EXISTS "Users can update their own settings" ON user_peer_settings;

-- Drop helper functions
DROP FUNCTION IF EXISTS is_peer_group_member(uuid, uuid);
DROP FUNCTION IF EXISTS is_peer_group_admin(uuid, uuid);

-- Drop triggers
DROP TRIGGER IF EXISTS update_peer_groups_updated_at ON peer_groups;
DROP TRIGGER IF EXISTS update_peer_group_members_updated_at ON peer_group_members;
DROP TRIGGER IF EXISTS update_peer_group_posts_updated_at ON peer_group_posts;
DROP TRIGGER IF EXISTS update_peer_challenges_updated_at ON peer_group_challenges;
DROP TRIGGER IF EXISTS update_peer_success_stories_updated_at ON peer_success_stories;
DROP TRIGGER IF EXISTS update_peer_referrals_updated_at ON peer_referrals;
DROP TRIGGER IF EXISTS update_peer_impact_updated_at ON peer_networking_impact;
DROP TRIGGER IF EXISTS update_user_peer_settings_updated_at ON user_peer_settings;
DROP TRIGGER IF EXISTS trigger_update_group_member_count ON peer_group_members;
DROP TRIGGER IF EXISTS trigger_update_group_post_count ON peer_group_posts;
DROP TRIGGER IF EXISTS trigger_update_challenge_participant_count ON peer_challenge_participants;
DROP TRIGGER IF EXISTS trigger_update_post_like_count ON peer_post_likes;

-- Drop trigger functions
DROP FUNCTION IF EXISTS update_peer_updated_at();
DROP FUNCTION IF EXISTS update_group_member_count();
DROP FUNCTION IF EXISTS update_group_post_count();
DROP FUNCTION IF EXISTS update_challenge_participant_count();
DROP FUNCTION IF EXISTS update_post_like_count();

-- Drop tables (in order of dependencies)
DROP TABLE IF EXISTS user_peer_settings CASCADE;
DROP TABLE IF EXISTS peer_networking_impact CASCADE;
DROP TABLE IF EXISTS peer_referral_interests CASCADE;
DROP TABLE IF EXISTS peer_referrals CASCADE;
DROP TABLE IF EXISTS peer_success_stories CASCADE;
DROP TABLE IF EXISTS peer_challenge_participants CASCADE;
DROP TABLE IF EXISTS peer_group_challenges CASCADE;
DROP TABLE IF EXISTS peer_post_likes CASCADE;
DROP TABLE IF EXISTS peer_group_posts CASCADE;
DROP TABLE IF EXISTS peer_group_members CASCADE;
DROP TABLE IF EXISTS peer_groups CASCADE;

-- Drop enum types
DROP TYPE IF EXISTS peer_referral_status_enum;
DROP TYPE IF EXISTS peer_privacy_level_enum;
DROP TYPE IF EXISTS challenge_participant_status_enum;
DROP TYPE IF EXISTS peer_challenge_status_enum;
DROP TYPE IF EXISTS peer_post_type_enum;
DROP TYPE IF EXISTS peer_membership_status_enum;
DROP TYPE IF EXISTS peer_group_category_enum;

-- ============================================================================
-- CUSTOM ENUM TYPES
-- ============================================================================

-- Group categories (industry or role-specific)
CREATE TYPE peer_group_category_enum AS ENUM (
  'technology',
  'healthcare',
  'finance',
  'marketing',
  'sales',
  'engineering',
  'design',
  'data_science',
  'product_management',
  'human_resources',
  'legal',
  'education',
  'consulting',
  'entry_level',
  'mid_career',
  'senior_executive',
  'career_transition',
  'remote_work',
  'freelance',
  'general'
);

-- Membership status in groups
CREATE TYPE peer_membership_status_enum AS ENUM (
  'pending',
  'active',
  'suspended',
  'left'
);

-- Post types for discussions
CREATE TYPE peer_post_type_enum AS ENUM (
  'discussion',
  'question',
  'insight',
  'resource',
  'celebration',
  'advice_request'
);

-- Challenge status
CREATE TYPE peer_challenge_status_enum AS ENUM (
  'upcoming',
  'active',
  'completed',
  'cancelled'
);

-- Challenge participant status
CREATE TYPE challenge_participant_status_enum AS ENUM (
  'joined',
  'in_progress',
  'completed',
  'failed',
  'withdrawn'
);

-- Privacy level for user visibility
CREATE TYPE peer_privacy_level_enum AS ENUM (
  'full_name',
  'initials_only',
  'anonymous'
);

-- Referral status
CREATE TYPE peer_referral_status_enum AS ENUM (
  'shared',
  'interested',
  'applied',
  'hired',
  'expired'
);

-- ============================================================================
-- PEER GROUPS TABLE
-- Main table for support groups organized by industry/role
-- ============================================================================

CREATE TABLE public.peer_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Group identity
  name text NOT NULL,
  description text,
  category peer_group_category_enum NOT NULL DEFAULT 'general',

  -- Group settings
  is_public boolean NOT NULL DEFAULT true,
  requires_approval boolean NOT NULL DEFAULT false,
  max_members integer DEFAULT NULL,

  -- Group owner (creator)
  created_by uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  -- Group metadata
  tags text[] DEFAULT ARRAY[]::text[],
  rules text,
  welcome_message text,

  -- Group image/branding
  avatar_url text,
  banner_url text,

  -- Stats (denormalized for performance)
  member_count integer NOT NULL DEFAULT 0,
  post_count integer NOT NULL DEFAULT 0,
  active_challenge_count integer NOT NULL DEFAULT 0,

  -- Coaching/webinar info (UC-112 requirement)
  has_coaching_sessions boolean NOT NULL DEFAULT false,
  coaching_schedule jsonb DEFAULT '[]'::jsonb,
  upcoming_webinars jsonb DEFAULT '[]'::jsonb,

  -- Status
  is_active boolean NOT NULL DEFAULT true,

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Index for group discovery
CREATE INDEX idx_peer_groups_category ON peer_groups(category) WHERE is_active = true;
CREATE INDEX idx_peer_groups_public ON peer_groups(is_public, is_active) WHERE is_active = true;

-- ============================================================================
-- PEER GROUP MEMBERS TABLE
-- Tracks membership in groups with roles and privacy settings
-- ============================================================================

CREATE TABLE public.peer_group_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Group and user references
  group_id uuid NOT NULL REFERENCES peer_groups(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  -- Membership details
  status peer_membership_status_enum NOT NULL DEFAULT 'active',
  role text NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'moderator', 'member')),

  -- Privacy settings for this user in this group
  privacy_level peer_privacy_level_enum NOT NULL DEFAULT 'full_name',
  show_activity boolean NOT NULL DEFAULT true,

  -- Notification preferences
  notifications_enabled boolean NOT NULL DEFAULT true,
  notification_preferences jsonb DEFAULT '{
    "new_posts": true,
    "replies_to_my_posts": true,
    "challenge_updates": true,
    "referrals": true,
    "coaching_sessions": true
  }'::jsonb,

  -- Stats for this member
  posts_count integer NOT NULL DEFAULT 0,
  challenges_completed integer NOT NULL DEFAULT 0,
  referrals_shared integer NOT NULL DEFAULT 0,

  joined_at timestamptz NOT NULL DEFAULT now(),
  last_active_at timestamptz DEFAULT now(),
  left_at timestamptz,

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  -- Ensure user can only join a group once
  CONSTRAINT unique_group_membership UNIQUE (group_id, user_id)
);

-- Indexes for member queries
CREATE INDEX idx_peer_group_members_user ON peer_group_members(user_id) WHERE status = 'active';
CREATE INDEX idx_peer_group_members_group ON peer_group_members(group_id) WHERE status = 'active';

-- ============================================================================
-- PEER GROUP POSTS TABLE
-- Discussions, insights, and shared strategies within groups
-- ============================================================================

CREATE TABLE public.peer_group_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Group and author
  group_id uuid NOT NULL REFERENCES peer_groups(id) ON DELETE CASCADE,
  author_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  -- Post content
  post_type peer_post_type_enum NOT NULL DEFAULT 'discussion',
  title text,
  content text NOT NULL,

  -- Privacy (author can post anonymously)
  is_anonymous boolean NOT NULL DEFAULT false,

  -- Threading support
  parent_post_id uuid REFERENCES peer_group_posts(id) ON DELETE CASCADE,

  -- Engagement stats
  reply_count integer NOT NULL DEFAULT 0,
  like_count integer NOT NULL DEFAULT 0,

  -- Attachments/resources
  attachments jsonb DEFAULT '[]'::jsonb,

  -- Moderation
  is_pinned boolean NOT NULL DEFAULT false,
  is_hidden boolean NOT NULL DEFAULT false,
  hidden_reason text,

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes for post queries
CREATE INDEX idx_peer_posts_group ON peer_group_posts(group_id, created_at DESC) WHERE is_hidden = false;
CREATE INDEX idx_peer_posts_author ON peer_group_posts(author_id);
CREATE INDEX idx_peer_posts_parent ON peer_group_posts(parent_post_id) WHERE parent_post_id IS NOT NULL;

-- ============================================================================
-- PEER POST LIKES TABLE
-- Tracks likes/reactions to posts
-- ============================================================================

CREATE TABLE public.peer_post_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES peer_group_posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT unique_post_like UNIQUE (post_id, user_id)
);

-- ============================================================================
-- PEER GROUP CHALLENGES TABLE
-- Accountability programs and group challenges
-- ============================================================================

CREATE TABLE public.peer_group_challenges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Group and creator
  group_id uuid NOT NULL REFERENCES peer_groups(id) ON DELETE CASCADE,
  created_by uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  -- Challenge details
  title text NOT NULL,
  description text,

  -- Challenge type and goal
  challenge_type text NOT NULL DEFAULT 'applications' CHECK (
    challenge_type IN ('applications', 'networking', 'interviews', 'learning', 'custom')
  ),
  target_value integer NOT NULL,
  target_unit text NOT NULL DEFAULT 'count',

  -- Schedule
  start_date date NOT NULL,
  end_date date NOT NULL,
  status peer_challenge_status_enum NOT NULL DEFAULT 'upcoming',

  -- Participation stats
  participant_count integer NOT NULL DEFAULT 0,
  completion_count integer NOT NULL DEFAULT 0,

  -- Rewards/recognition
  badge_name text,
  badge_icon text,
  celebration_message text,

  -- Rules and guidelines
  rules text,
  verification_required boolean NOT NULL DEFAULT false,

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT valid_date_range CHECK (end_date >= start_date)
);

-- Index for active challenges
CREATE INDEX idx_peer_challenges_group ON peer_group_challenges(group_id, status);
CREATE INDEX idx_peer_challenges_dates ON peer_group_challenges(start_date, end_date) WHERE status = 'active';

-- ============================================================================
-- PEER CHALLENGE PARTICIPANTS TABLE
-- Tracks individual progress in challenges
-- ============================================================================

CREATE TABLE public.peer_challenge_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  challenge_id uuid NOT NULL REFERENCES peer_group_challenges(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  -- Progress tracking
  status challenge_participant_status_enum NOT NULL DEFAULT 'joined',
  current_value integer NOT NULL DEFAULT 0,

  -- Progress history (for charts/leaderboards)
  progress_history jsonb DEFAULT '[]'::jsonb,

  -- Completion
  completed_at timestamptz,

  joined_at timestamptz NOT NULL DEFAULT now(),
  last_updated_at timestamptz DEFAULT now(),

  CONSTRAINT unique_challenge_participant UNIQUE (challenge_id, user_id)
);

-- Index for leaderboards and progress queries
CREATE INDEX idx_challenge_participants_challenge ON peer_challenge_participants(challenge_id, current_value DESC);
CREATE INDEX idx_challenge_participants_user ON peer_challenge_participants(user_id);

-- ============================================================================
-- PEER SUCCESS STORIES TABLE
-- Shared success stories and learning opportunities
-- ============================================================================

CREATE TABLE public.peer_success_stories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Author and group (optional - can be platform-wide)
  author_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  group_id uuid REFERENCES peer_groups(id) ON DELETE SET NULL,

  -- Story content
  title text NOT NULL,
  story_content text NOT NULL,

  -- Privacy - allow anonymous sharing
  is_anonymous boolean NOT NULL DEFAULT false,

  -- Categorization
  industry text,
  role_type text,
  job_search_duration_weeks integer,

  -- Key learnings
  key_learnings text[] DEFAULT ARRAY[]::text[],
  advice_for_others text,

  -- What helped most
  helpful_factors jsonb DEFAULT '{
    "peer_support": false,
    "group_challenges": false,
    "referrals": false,
    "networking": false,
    "resume_help": false,
    "interview_prep": false
  }'::jsonb,

  -- Engagement
  view_count integer NOT NULL DEFAULT 0,
  like_count integer NOT NULL DEFAULT 0,

  -- Moderation
  is_featured boolean NOT NULL DEFAULT false,
  is_approved boolean NOT NULL DEFAULT true,

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Index for story discovery
CREATE INDEX idx_success_stories_group ON peer_success_stories(group_id) WHERE is_approved = true;
CREATE INDEX idx_success_stories_featured ON peer_success_stories(is_featured, created_at DESC) WHERE is_approved = true;
CREATE INDEX idx_success_stories_industry ON peer_success_stories(industry) WHERE is_approved = true;

-- ============================================================================
-- PEER REFERRALS TABLE
-- Job opportunity sharing within groups
-- ============================================================================

CREATE TABLE public.peer_referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Sharer and group
  shared_by uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  group_id uuid NOT NULL REFERENCES peer_groups(id) ON DELETE CASCADE,

  -- Job details
  job_title text NOT NULL,
  company_name text NOT NULL,
  job_description text,
  job_link text,
  location text,
  salary_range text,

  -- Referral details
  is_internal_referral boolean NOT NULL DEFAULT false,
  referral_notes text,
  application_deadline date,

  -- Status
  status peer_referral_status_enum NOT NULL DEFAULT 'shared',

  -- Engagement tracking
  views_count integer NOT NULL DEFAULT 0,
  interested_count integer NOT NULL DEFAULT 0,
  applied_count integer NOT NULL DEFAULT 0,

  -- Expiration
  expires_at timestamptz DEFAULT (now() + interval '30 days'),

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Index for referral discovery
CREATE INDEX idx_peer_referrals_group ON peer_referrals(group_id, created_at DESC) WHERE status = 'shared';
CREATE INDEX idx_peer_referrals_expiry ON peer_referrals(expires_at) WHERE status = 'shared';

-- ============================================================================
-- PEER REFERRAL INTERESTS TABLE
-- Tracks who is interested in/applied to referrals
-- ============================================================================

CREATE TABLE public.peer_referral_interests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  referral_id uuid NOT NULL REFERENCES peer_referrals(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  status text NOT NULL DEFAULT 'interested' CHECK (status IN ('interested', 'applied', 'hired')),
  notes text,

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT unique_referral_interest UNIQUE (referral_id, user_id)
);

-- ============================================================================
-- PEER NETWORKING IMPACT TABLE
-- Tracks the value/impact of peer networking on job search
-- ============================================================================

CREATE TABLE public.peer_networking_impact (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  -- Date range for metrics (monthly snapshots)
  period_start date NOT NULL,
  period_end date NOT NULL,

  -- Activity metrics
  groups_joined integer NOT NULL DEFAULT 0,
  posts_created integer NOT NULL DEFAULT 0,
  replies_given integer NOT NULL DEFAULT 0,
  challenges_participated integer NOT NULL DEFAULT 0,
  challenges_completed integer NOT NULL DEFAULT 0,
  referrals_shared integer NOT NULL DEFAULT 0,
  referrals_received integer NOT NULL DEFAULT 0,
  connections_made integer NOT NULL DEFAULT 0,

  -- Outcome metrics (from peer leads)
  interviews_from_peers integer NOT NULL DEFAULT 0,
  offers_from_peers integer NOT NULL DEFAULT 0,

  -- Calculated impact score (0-100)
  impact_score integer DEFAULT 0 CHECK (impact_score >= 0 AND impact_score <= 100),

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT unique_user_period UNIQUE (user_id, period_start, period_end)
);

-- Index for impact queries
CREATE INDEX idx_peer_impact_user ON peer_networking_impact(user_id, period_start DESC);

-- ============================================================================
-- USER PEER SETTINGS TABLE
-- Global privacy and notification settings for peer features
-- ============================================================================

CREATE TABLE public.user_peer_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,

  -- Default privacy level for all groups
  default_privacy_level peer_privacy_level_enum NOT NULL DEFAULT 'full_name',

  -- What others can see about this user
  show_group_memberships boolean NOT NULL DEFAULT true,
  show_challenge_progress boolean NOT NULL DEFAULT true,
  show_success_stories boolean NOT NULL DEFAULT true,

  -- Notification preferences
  email_notifications boolean NOT NULL DEFAULT true,
  push_notifications boolean NOT NULL DEFAULT true,

  -- Discovery settings
  allow_group_invites boolean NOT NULL DEFAULT true,
  discoverable_in_groups boolean NOT NULL DEFAULT true,

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Auto-update updated_at timestamps
CREATE OR REPLACE FUNCTION update_peer_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_peer_groups_updated_at
  BEFORE UPDATE ON peer_groups
  FOR EACH ROW EXECUTE FUNCTION update_peer_updated_at();

CREATE TRIGGER update_peer_group_members_updated_at
  BEFORE UPDATE ON peer_group_members
  FOR EACH ROW EXECUTE FUNCTION update_peer_updated_at();

CREATE TRIGGER update_peer_group_posts_updated_at
  BEFORE UPDATE ON peer_group_posts
  FOR EACH ROW EXECUTE FUNCTION update_peer_updated_at();

CREATE TRIGGER update_peer_challenges_updated_at
  BEFORE UPDATE ON peer_group_challenges
  FOR EACH ROW EXECUTE FUNCTION update_peer_updated_at();

CREATE TRIGGER update_peer_success_stories_updated_at
  BEFORE UPDATE ON peer_success_stories
  FOR EACH ROW EXECUTE FUNCTION update_peer_updated_at();

CREATE TRIGGER update_peer_referrals_updated_at
  BEFORE UPDATE ON peer_referrals
  FOR EACH ROW EXECUTE FUNCTION update_peer_updated_at();

CREATE TRIGGER update_peer_impact_updated_at
  BEFORE UPDATE ON peer_networking_impact
  FOR EACH ROW EXECUTE FUNCTION update_peer_updated_at();

CREATE TRIGGER update_user_peer_settings_updated_at
  BEFORE UPDATE ON user_peer_settings
  FOR EACH ROW EXECUTE FUNCTION update_peer_updated_at();

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to update group member count
CREATE OR REPLACE FUNCTION update_group_member_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.status = 'active' THEN
    UPDATE peer_groups SET member_count = member_count + 1 WHERE id = NEW.group_id;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.status != 'active' AND NEW.status = 'active' THEN
      UPDATE peer_groups SET member_count = member_count + 1 WHERE id = NEW.group_id;
    ELSIF OLD.status = 'active' AND NEW.status != 'active' THEN
      UPDATE peer_groups SET member_count = member_count - 1 WHERE id = NEW.group_id;
    END IF;
  ELSIF TG_OP = 'DELETE' AND OLD.status = 'active' THEN
    UPDATE peer_groups SET member_count = member_count - 1 WHERE id = OLD.group_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_group_member_count
  AFTER INSERT OR UPDATE OR DELETE ON peer_group_members
  FOR EACH ROW EXECUTE FUNCTION update_group_member_count();

-- Function to update post counts
CREATE OR REPLACE FUNCTION update_group_post_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.is_hidden = false THEN
    UPDATE peer_groups SET post_count = post_count + 1 WHERE id = NEW.group_id;
    -- Also update parent post reply count if this is a reply
    IF NEW.parent_post_id IS NOT NULL THEN
      UPDATE peer_group_posts SET reply_count = reply_count + 1 WHERE id = NEW.parent_post_id;
    END IF;
  ELSIF TG_OP = 'DELETE' AND OLD.is_hidden = false THEN
    UPDATE peer_groups SET post_count = post_count - 1 WHERE id = OLD.group_id;
    IF OLD.parent_post_id IS NOT NULL THEN
      UPDATE peer_group_posts SET reply_count = reply_count - 1 WHERE id = OLD.parent_post_id;
    END IF;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_group_post_count
  AFTER INSERT OR DELETE ON peer_group_posts
  FOR EACH ROW EXECUTE FUNCTION update_group_post_count();

-- Function to update challenge participant count
CREATE OR REPLACE FUNCTION update_challenge_participant_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE peer_group_challenges SET participant_count = participant_count + 1 WHERE id = NEW.challenge_id;
  ELSIF TG_OP = 'UPDATE' AND OLD.status != 'completed' AND NEW.status = 'completed' THEN
    UPDATE peer_group_challenges SET completion_count = completion_count + 1 WHERE id = NEW.challenge_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE peer_group_challenges SET participant_count = participant_count - 1 WHERE id = OLD.challenge_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_challenge_participant_count
  AFTER INSERT OR UPDATE OR DELETE ON peer_challenge_participants
  FOR EACH ROW EXECUTE FUNCTION update_challenge_participant_count();

-- Function to update post like count
CREATE OR REPLACE FUNCTION update_post_like_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE peer_group_posts SET like_count = like_count + 1 WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE peer_group_posts SET like_count = like_count - 1 WHERE id = OLD.post_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_post_like_count
  AFTER INSERT OR DELETE ON peer_post_likes
  FOR EACH ROW EXECUTE FUNCTION update_post_like_count();

-- ============================================================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE peer_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE peer_group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE peer_group_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE peer_post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE peer_group_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE peer_challenge_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE peer_success_stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE peer_referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE peer_referral_interests ENABLE ROW LEVEL SECURITY;
ALTER TABLE peer_networking_impact ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_peer_settings ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- SECURITY DEFINER HELPER FUNCTION
-- This function bypasses RLS to check membership without causing recursion
-- ============================================================================

CREATE OR REPLACE FUNCTION is_peer_group_member(p_group_id uuid, p_user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM peer_group_members
    WHERE group_id = p_group_id
    AND user_id = p_user_id
    AND status = 'active'
  );
$$;

-- Check if user is owner/moderator of a group (bypasses RLS)
CREATE OR REPLACE FUNCTION is_peer_group_admin(p_group_id uuid, p_user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM peer_group_members
    WHERE group_id = p_group_id
    AND user_id = p_user_id
    AND role IN ('owner', 'moderator')
    AND status = 'active'
  );
$$;

-- PEER GROUPS POLICIES
-- Anyone can view public groups
CREATE POLICY "Anyone can view public groups"
  ON peer_groups FOR SELECT
  USING (is_public = true AND is_active = true);

-- Members can view their private groups (uses helper function to avoid recursion)
CREATE POLICY "Members can view their private groups"
  ON peer_groups FOR SELECT
  USING (is_peer_group_member(id, auth.uid()));

-- Authenticated users can create groups
CREATE POLICY "Authenticated users can create groups"
  ON peer_groups FOR INSERT
  WITH CHECK (auth.uid() = created_by);

-- Group owners/moderators can update groups (uses helper function)
CREATE POLICY "Group owners can update groups"
  ON peer_groups FOR UPDATE
  USING (is_peer_group_admin(id, auth.uid()));

-- PEER GROUP MEMBERS POLICIES
-- Users can always see their own membership
CREATE POLICY "Users can view their own membership"
  ON peer_group_members FOR SELECT
  USING (user_id = auth.uid());

-- Members can view other members in their groups (uses helper function)
CREATE POLICY "Members can view group members"
  ON peer_group_members FOR SELECT
  USING (is_peer_group_member(group_id, auth.uid()));

-- Users can join public groups
CREATE POLICY "Users can join public groups"
  ON peer_group_members FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM peer_groups
      WHERE peer_groups.id = group_id
      AND peer_groups.is_public = true
      AND peer_groups.is_active = true
    )
  );

-- Users can update their own membership
CREATE POLICY "Users can update their own membership"
  ON peer_group_members FOR UPDATE
  USING (user_id = auth.uid());

-- Users can leave groups (delete their membership)
CREATE POLICY "Users can leave groups"
  ON peer_group_members FOR DELETE
  USING (user_id = auth.uid());

-- PEER GROUP POSTS POLICIES
-- Members can view posts in their groups (uses helper function)
CREATE POLICY "Members can view group posts"
  ON peer_group_posts FOR SELECT
  USING (
    is_hidden = false
    AND is_peer_group_member(group_id, auth.uid())
  );

-- Members can create posts (uses helper function)
CREATE POLICY "Members can create posts"
  ON peer_group_posts FOR INSERT
  WITH CHECK (
    auth.uid() = author_id
    AND is_peer_group_member(group_id, auth.uid())
  );

-- Authors can update their posts
CREATE POLICY "Authors can update their posts"
  ON peer_group_posts FOR UPDATE
  USING (author_id = auth.uid());

-- Authors can delete their posts
CREATE POLICY "Authors can delete their posts"
  ON peer_group_posts FOR DELETE
  USING (author_id = auth.uid());

-- POST LIKES POLICIES
-- Users can see likes on posts they can see (simplified - if they can see post, they can see likes)
CREATE POLICY "Users can see post likes"
  ON peer_post_likes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM peer_group_posts
      WHERE peer_group_posts.id = peer_post_likes.post_id
      AND is_peer_group_member(peer_group_posts.group_id, auth.uid())
    )
  );

-- Users can like posts
CREATE POLICY "Users can like posts"
  ON peer_post_likes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can unlike posts
CREATE POLICY "Users can unlike posts"
  ON peer_post_likes FOR DELETE
  USING (user_id = auth.uid());

-- CHALLENGES POLICIES
-- Members can view challenges (uses helper function)
CREATE POLICY "Members can view challenges"
  ON peer_group_challenges FOR SELECT
  USING (is_peer_group_member(group_id, auth.uid()));

-- Members can create challenges (uses helper function)
CREATE POLICY "Members can create challenges"
  ON peer_group_challenges FOR INSERT
  WITH CHECK (
    auth.uid() = created_by
    AND is_peer_group_member(group_id, auth.uid())
  );

-- Challenge creators can update
CREATE POLICY "Challenge creators can update"
  ON peer_group_challenges FOR UPDATE
  USING (created_by = auth.uid());

-- CHALLENGE PARTICIPANTS POLICIES
-- Participants visible to group members (uses helper function via challenge lookup)
CREATE POLICY "Group members can view participants"
  ON peer_challenge_participants FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM peer_group_challenges
      WHERE peer_group_challenges.id = peer_challenge_participants.challenge_id
      AND is_peer_group_member(peer_group_challenges.group_id, auth.uid())
    )
  );

-- Users can join challenges
CREATE POLICY "Users can join challenges"
  ON peer_challenge_participants FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own participation
CREATE POLICY "Users can update their participation"
  ON peer_challenge_participants FOR UPDATE
  USING (user_id = auth.uid());

-- SUCCESS STORIES POLICIES
-- Approved stories are public
CREATE POLICY "Anyone can view approved stories"
  ON peer_success_stories FOR SELECT
  USING (is_approved = true);

-- Users can create stories
CREATE POLICY "Users can create stories"
  ON peer_success_stories FOR INSERT
  WITH CHECK (auth.uid() = author_id);

-- Authors can update their stories
CREATE POLICY "Authors can update stories"
  ON peer_success_stories FOR UPDATE
  USING (author_id = auth.uid());

-- REFERRALS POLICIES
-- Group members can view referrals (uses helper function)
CREATE POLICY "Group members can view referrals"
  ON peer_referrals FOR SELECT
  USING (is_peer_group_member(group_id, auth.uid()));

-- Members can share referrals (uses helper function)
CREATE POLICY "Members can share referrals"
  ON peer_referrals FOR INSERT
  WITH CHECK (
    auth.uid() = shared_by
    AND is_peer_group_member(group_id, auth.uid())
  );

-- Sharers can update referrals
CREATE POLICY "Sharers can update referrals"
  ON peer_referrals FOR UPDATE
  USING (shared_by = auth.uid());

-- REFERRAL INTERESTS POLICIES
CREATE POLICY "Users can view referral interests"
  ON peer_referral_interests FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can express interest"
  ON peer_referral_interests FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their interest"
  ON peer_referral_interests FOR UPDATE
  USING (user_id = auth.uid());

-- NETWORKING IMPACT POLICIES
-- Users can only see their own impact data
CREATE POLICY "Users can view their own impact"
  ON peer_networking_impact FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own impact"
  ON peer_networking_impact FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own impact"
  ON peer_networking_impact FOR UPDATE
  USING (user_id = auth.uid());

-- USER PEER SETTINGS POLICIES
CREATE POLICY "Users can view their own settings"
  ON user_peer_settings FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own settings"
  ON user_peer_settings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own settings"
  ON user_peer_settings FOR UPDATE
  USING (user_id = auth.uid());

-- ============================================================================
-- SEED DATA: Default Groups
-- ============================================================================

-- Insert some default public groups for common industries/roles
INSERT INTO peer_groups (name, description, category, is_public, created_by, tags, welcome_message)
SELECT
  name, description, category, true,
  (SELECT id FROM profiles LIMIT 1),
  tags, welcome_message
FROM (VALUES
  ('Tech Industry Job Seekers',
   'Support group for job seekers in technology, software, and IT roles',
   'technology'::peer_group_category_enum,
   ARRAY['software', 'tech', 'IT', 'engineering'],
   'Welcome! Share your experiences, ask questions, and support fellow tech job seekers.'),
  ('Healthcare Professionals Network',
   'Connect with other healthcare professionals navigating job transitions',
   'healthcare'::peer_group_category_enum,
   ARRAY['healthcare', 'medical', 'nursing', 'clinical'],
   'Welcome to the healthcare job seekers community!'),
  ('Entry Level & New Grads',
   'Support for those starting their careers and recent graduates',
   'entry_level'::peer_group_category_enum,
   ARRAY['entry-level', 'new-grad', 'first-job', 'internship'],
   'Welcome! This is a supportive space for those beginning their professional journey.'),
  ('Career Changers Hub',
   'For professionals transitioning to new industries or roles',
   'career_transition'::peer_group_category_enum,
   ARRAY['career-change', 'transition', 'pivot', 'new-career'],
   'Welcome career changers! Share your journey and learn from others who have made successful transitions.'),
  ('Remote Work Seekers',
   'Find and share remote job opportunities and WFH tips',
   'remote_work'::peer_group_category_enum,
   ARRAY['remote', 'work-from-home', 'distributed', 'flexible'],
   'Welcome to the remote work community! Share opportunities and remote work strategies.')
) AS data(name, description, category, tags, welcome_message)
WHERE EXISTS (SELECT 1 FROM profiles LIMIT 1);

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================

-- Grant usage on sequences (if any auto-increment sequences exist)
-- Note: Using UUIDs so no sequences needed

-- Ensure authenticated users can access the tables through RLS
GRANT ALL ON peer_groups TO authenticated;
GRANT ALL ON peer_group_members TO authenticated;
GRANT ALL ON peer_group_posts TO authenticated;
GRANT ALL ON peer_post_likes TO authenticated;
GRANT ALL ON peer_group_challenges TO authenticated;
GRANT ALL ON peer_challenge_participants TO authenticated;
GRANT ALL ON peer_success_stories TO authenticated;
GRANT ALL ON peer_referrals TO authenticated;
GRANT ALL ON peer_referral_interests TO authenticated;
GRANT ALL ON peer_networking_impact TO authenticated;
GRANT ALL ON user_peer_settings TO authenticated;
