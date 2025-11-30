-- ============================================================================
-- Peer Networking and Support Groups Schema Migration
-- Created: 2025-11-30
-- Purpose: Add peer networking features for UC-112
-- ============================================================================

-- ============================================================================
-- SECTION 1: CUSTOM TYPES
-- ============================================================================

-- Drop existing peer-related enums if they exist (to allow clean recreation)
DROP TYPE IF EXISTS peer_group_type_enum CASCADE;
DROP TYPE IF EXISTS peer_group_visibility_enum CASCADE;
DROP TYPE IF EXISTS challenge_status_enum CASCADE;
DROP TYPE IF EXISTS discussion_status_enum CASCADE;

-- Peer group types based on industry or role focus
CREATE TYPE peer_group_type_enum AS ENUM (
  'industry',      -- Industry-specific (tech, finance, healthcare, etc.)
  'role',          -- Role-specific (software engineer, product manager, etc.)
  'location',      -- Location-based groups
  'experience',    -- Experience level (entry, mid, senior)
  'general'        -- General job search support
);

-- Visibility controls for groups
CREATE TYPE peer_group_visibility_enum AS ENUM (
  'public',        -- Anyone can see and join
  'private',       -- Invite only
  'hidden'         -- Not discoverable, invite only
);

-- Challenge/accountability program status
CREATE TYPE challenge_status_enum AS ENUM (
  'draft',
  'active',
  'paused',
  'completed',
  'cancelled'
);

-- Discussion post status
CREATE TYPE discussion_status_enum AS ENUM (
  'active',
  'hidden',
  'flagged',
  'archived'
);

-- ============================================================================
-- SECTION 2: CORE TABLES
-- ============================================================================

-- -----------------------------------------------------------------------------
-- PEER_GROUPS TABLE
-- Stores peer support group metadata
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.peer_groups (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  
  -- Group information
  name text NOT NULL,
  description text,
  group_type peer_group_type_enum NOT NULL DEFAULT 'general',
  visibility peer_group_visibility_enum NOT NULL DEFAULT 'public',
  
  -- Categorization
  industry text,                -- For industry groups (e.g., "Technology", "Finance")
  role_focus text,              -- For role groups (e.g., "Software Engineer", "Data Scientist")
  location text,                -- For location groups (e.g., "New York", "Remote")
  experience_level text,        -- For experience groups (e.g., "Entry Level", "Senior")
  
  -- Group creator
  created_by uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  
  -- Settings (JSON for flexibility)
  settings jsonb DEFAULT '{
    "allow_anonymous_posts": true,
    "require_approval_to_join": false,
    "max_members": null,
    "allow_referral_sharing": true,
    "allow_success_stories": true
  }'::jsonb,
  
  -- Statistics (denormalized for performance)
  member_count integer NOT NULL DEFAULT 1,
  discussion_count integer NOT NULL DEFAULT 0,
  active_challenges integer NOT NULL DEFAULT 0,
  
  -- Status
  is_active boolean NOT NULL DEFAULT true,
  is_featured boolean NOT NULL DEFAULT false,
  
  -- Timestamps
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  
  CONSTRAINT peer_groups_pkey PRIMARY KEY (id),
  CONSTRAINT peer_groups_name_check CHECK (char_length(name) >= 2 AND char_length(name) <= 100)
);

-- Indexes for efficient lookups
CREATE INDEX IF NOT EXISTS idx_peer_groups_type ON public.peer_groups(group_type);
CREATE INDEX IF NOT EXISTS idx_peer_groups_visibility ON public.peer_groups(visibility) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_peer_groups_industry ON public.peer_groups(industry) WHERE industry IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_peer_groups_role ON public.peer_groups(role_focus) WHERE role_focus IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_peer_groups_created_by ON public.peer_groups(created_by);

COMMENT ON TABLE public.peer_groups IS 'Peer support groups for job search networking and mutual support';

-- -----------------------------------------------------------------------------
-- PEER_GROUP_MEMBERS TABLE
-- Links users to peer groups with privacy settings
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.peer_group_members (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  
  -- References
  group_id uuid NOT NULL REFERENCES public.peer_groups(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  
  -- Member settings
  display_name text,                       -- Optional display name for anonymity
  is_anonymous boolean NOT NULL DEFAULT false,  -- Whether to show profile details
  
  -- Privacy controls (what to share with the group)
  privacy_settings jsonb DEFAULT '{
    "share_job_stats": true,
    "share_success_stories": true,
    "share_company_names": false,
    "share_salary_info": false,
    "receive_referral_alerts": true,
    "receive_challenge_notifications": true
  }'::jsonb,
  
  -- Participation tracking
  posts_count integer NOT NULL DEFAULT 0,
  challenges_completed integer NOT NULL DEFAULT 0,
  referrals_shared integer NOT NULL DEFAULT 0,
  
  -- Status
  is_active boolean NOT NULL DEFAULT true,
  is_moderator boolean NOT NULL DEFAULT false,
  
  -- Timestamps
  joined_at timestamp with time zone NOT NULL DEFAULT now(),
  last_active_at timestamp with time zone NOT NULL DEFAULT now(),
  
  CONSTRAINT peer_group_members_pkey PRIMARY KEY (id),
  CONSTRAINT peer_group_members_unique UNIQUE (group_id, user_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_peer_group_members_group ON public.peer_group_members(group_id) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_peer_group_members_user ON public.peer_group_members(user_id) WHERE is_active = true;

COMMENT ON TABLE public.peer_group_members IS 'Peer group membership with privacy and participation settings';

-- -----------------------------------------------------------------------------
-- PEER_DISCUSSIONS TABLE
-- Anonymous or identified discussion posts within groups
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.peer_discussions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  
  -- References
  group_id uuid NOT NULL REFERENCES public.peer_groups(id) ON DELETE CASCADE,
  author_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  parent_id uuid REFERENCES public.peer_discussions(id) ON DELETE CASCADE,  -- For replies/threads
  
  -- Content
  title text,                              -- Required for top-level posts, optional for replies
  content text NOT NULL,
  
  -- Anonymity
  is_anonymous boolean NOT NULL DEFAULT false,
  anonymous_display_name text,             -- Used when is_anonymous = true
  
  -- Categorization
  category text,                           -- e.g., "success_story", "question", "tip", "referral"
  tags text[] DEFAULT ARRAY[]::text[],
  
  -- Engagement metrics
  likes_count integer NOT NULL DEFAULT 0,
  replies_count integer NOT NULL DEFAULT 0,
  views_count integer NOT NULL DEFAULT 0,
  
  -- Status
  status discussion_status_enum NOT NULL DEFAULT 'active',
  is_pinned boolean NOT NULL DEFAULT false,
  
  -- Timestamps
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  
  CONSTRAINT peer_discussions_pkey PRIMARY KEY (id),
  CONSTRAINT peer_discussions_content_check CHECK (char_length(content) >= 1)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_peer_discussions_group ON public.peer_discussions(group_id, status) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_peer_discussions_author ON public.peer_discussions(author_id);
CREATE INDEX IF NOT EXISTS idx_peer_discussions_parent ON public.peer_discussions(parent_id) WHERE parent_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_peer_discussions_category ON public.peer_discussions(category) WHERE category IS NOT NULL;

COMMENT ON TABLE public.peer_discussions IS 'Discussion posts and replies within peer groups';

-- -----------------------------------------------------------------------------
-- PEER_DISCUSSION_LIKES TABLE
-- Track likes on discussions to prevent duplicates
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.peer_discussion_likes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  
  discussion_id uuid NOT NULL REFERENCES public.peer_discussions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  
  CONSTRAINT peer_discussion_likes_pkey PRIMARY KEY (id),
  CONSTRAINT peer_discussion_likes_unique UNIQUE (discussion_id, user_id)
);

-- -----------------------------------------------------------------------------
-- GROUP_CHALLENGES TABLE
-- Accountability challenges and programs
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.group_challenges (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  
  -- References
  group_id uuid NOT NULL REFERENCES public.peer_groups(id) ON DELETE CASCADE,
  created_by uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  
  -- Challenge details
  title text NOT NULL,
  description text,
  
  -- Goals and requirements
  goal_type text NOT NULL,                  -- e.g., "applications_count", "interviews_count", "networking_events"
  goal_target integer NOT NULL,             -- Number to achieve
  goal_timeframe_days integer NOT NULL,     -- Days to complete the challenge
  
  -- Dates
  start_date date NOT NULL,
  end_date date NOT NULL,
  
  -- Status
  status challenge_status_enum NOT NULL DEFAULT 'draft',
  
  -- Participation stats
  participant_count integer NOT NULL DEFAULT 0,
  completed_count integer NOT NULL DEFAULT 0,
  
  -- Settings
  settings jsonb DEFAULT '{
    "allow_late_join": true,
    "show_leaderboard": true,
    "send_reminders": true,
    "reminder_frequency_days": 2
  }'::jsonb,
  
  -- Timestamps
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  
  CONSTRAINT group_challenges_pkey PRIMARY KEY (id),
  CONSTRAINT group_challenges_dates_check CHECK (end_date > start_date)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_group_challenges_group ON public.group_challenges(group_id, status);
CREATE INDEX IF NOT EXISTS idx_group_challenges_active ON public.group_challenges(status) WHERE status = 'active';

COMMENT ON TABLE public.group_challenges IS 'Accountability challenges for peer group members';

-- -----------------------------------------------------------------------------
-- CHALLENGE_PARTICIPANTS TABLE
-- Track participation and progress in challenges
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.challenge_participants (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  
  -- References
  challenge_id uuid NOT NULL REFERENCES public.group_challenges(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  
  -- Progress tracking
  current_progress integer NOT NULL DEFAULT 0,
  goal_met boolean NOT NULL DEFAULT false,
  goal_met_at timestamp with time zone,
  
  -- Status
  is_active boolean NOT NULL DEFAULT true,
  
  -- Timestamps
  joined_at timestamp with time zone NOT NULL DEFAULT now(),
  last_updated_at timestamp with time zone NOT NULL DEFAULT now(),
  
  CONSTRAINT challenge_participants_pkey PRIMARY KEY (id),
  CONSTRAINT challenge_participants_unique UNIQUE (challenge_id, user_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_challenge_participants_challenge ON public.challenge_participants(challenge_id) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_challenge_participants_user ON public.challenge_participants(user_id);

COMMENT ON TABLE public.challenge_participants IS 'Challenge participation and progress tracking';

-- -----------------------------------------------------------------------------
-- PEER_REFERRALS TABLE
-- Track shared referral opportunities
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.peer_referrals (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  
  -- References
  group_id uuid NOT NULL REFERENCES public.peer_groups(id) ON DELETE CASCADE,
  shared_by uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  
  -- Referral details
  company_name text NOT NULL,
  job_title text NOT NULL,
  job_link text,
  description text,
  
  -- Referral type
  is_internal_referral boolean NOT NULL DEFAULT false,  -- Can the sharer refer directly?
  application_deadline date,
  
  -- Status
  is_active boolean NOT NULL DEFAULT true,
  interested_count integer NOT NULL DEFAULT 0,
  
  -- Timestamps
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  expires_at timestamp with time zone,
  
  CONSTRAINT peer_referrals_pkey PRIMARY KEY (id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_peer_referrals_group ON public.peer_referrals(group_id) WHERE is_active = true;

COMMENT ON TABLE public.peer_referrals IS 'Job referral opportunities shared within peer groups';

-- -----------------------------------------------------------------------------
-- SUCCESS_STORIES TABLE
-- Celebrate and share successes with the group
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.success_stories (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  
  -- References
  group_id uuid NOT NULL REFERENCES public.peer_groups(id) ON DELETE CASCADE,
  author_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  
  -- Story content
  title text NOT NULL,
  content text NOT NULL,
  
  -- Outcome details (optional, for learning)
  company_name text,                        -- Can be anonymized
  job_title text,
  journey_days integer,                     -- How long the job search took
  applications_submitted integer,
  interviews_completed integer,
  
  -- Learnings to share
  key_learnings text[],
  tips_for_others text,
  
  -- Privacy
  is_anonymous boolean NOT NULL DEFAULT false,
  share_company_name boolean NOT NULL DEFAULT false,
  
  -- Engagement
  likes_count integer NOT NULL DEFAULT 0,
  comments_count integer NOT NULL DEFAULT 0,
  
  -- Status
  is_active boolean NOT NULL DEFAULT true,
  is_featured boolean NOT NULL DEFAULT false,
  
  -- Timestamps
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  
  CONSTRAINT success_stories_pkey PRIMARY KEY (id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_success_stories_group ON public.success_stories(group_id) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_success_stories_featured ON public.success_stories(is_featured) WHERE is_featured = true;

COMMENT ON TABLE public.success_stories IS 'Success stories shared within peer groups for motivation';

-- ============================================================================
-- SECTION 3: ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE public.peer_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.peer_group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.peer_discussions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.peer_discussion_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenge_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.peer_referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.success_stories ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------------------------------
-- PEER_GROUPS POLICIES
-- -----------------------------------------------------------------------------

-- Anyone can view public groups
CREATE POLICY "Anyone can view public peer groups"
  ON public.peer_groups FOR SELECT
  USING (visibility = 'public' AND is_active = true);

-- Group members can view their private groups
CREATE POLICY "Members can view their peer groups"
  ON public.peer_groups FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.peer_group_members
      WHERE peer_group_members.group_id = peer_groups.id
        AND peer_group_members.user_id = auth.uid()
        AND peer_group_members.is_active = true
    )
  );

-- Authenticated users can create groups
CREATE POLICY "Authenticated users can create peer groups"
  ON public.peer_groups FOR INSERT
  WITH CHECK (auth.uid() = created_by);

-- Group creator or moderators can update
CREATE POLICY "Creator or moderators can update peer groups"
  ON public.peer_groups FOR UPDATE
  USING (
    created_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.peer_group_members
      WHERE peer_group_members.group_id = peer_groups.id
        AND peer_group_members.user_id = auth.uid()
        AND peer_group_members.is_moderator = true
        AND peer_group_members.is_active = true
    )
  );

-- Only creator can delete
CREATE POLICY "Creator can delete peer groups"
  ON public.peer_groups FOR DELETE
  USING (created_by = auth.uid());

-- -----------------------------------------------------------------------------
-- PEER_GROUP_MEMBERS POLICIES
-- -----------------------------------------------------------------------------

-- Users can see members of groups they belong to
CREATE POLICY "Members can view group members"
  ON public.peer_group_members FOR SELECT
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.peer_group_members pgm
      WHERE pgm.group_id = peer_group_members.group_id
        AND pgm.user_id = auth.uid()
        AND pgm.is_active = true
    )
  );

-- Users can join public groups
CREATE POLICY "Users can join public peer groups"
  ON public.peer_group_members FOR INSERT
  WITH CHECK (
    user_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.peer_groups
      WHERE peer_groups.id = group_id
        AND (peer_groups.visibility = 'public' OR peer_groups.created_by = auth.uid())
        AND peer_groups.is_active = true
    )
  );

-- Users can update their own membership
CREATE POLICY "Users can update their membership"
  ON public.peer_group_members FOR UPDATE
  USING (user_id = auth.uid());

-- Users can leave groups
CREATE POLICY "Users can leave peer groups"
  ON public.peer_group_members FOR DELETE
  USING (user_id = auth.uid());

-- -----------------------------------------------------------------------------
-- PEER_DISCUSSIONS POLICIES
-- -----------------------------------------------------------------------------

-- Members can view discussions in their groups
CREATE POLICY "Members can view group discussions"
  ON public.peer_discussions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.peer_group_members
      WHERE peer_group_members.group_id = peer_discussions.group_id
        AND peer_group_members.user_id = auth.uid()
        AND peer_group_members.is_active = true
    )
  );

-- Members can create discussions
CREATE POLICY "Members can create discussions"
  ON public.peer_discussions FOR INSERT
  WITH CHECK (
    author_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.peer_group_members
      WHERE peer_group_members.group_id = peer_discussions.group_id
        AND peer_group_members.user_id = auth.uid()
        AND peer_group_members.is_active = true
    )
  );

-- Authors can update their discussions
CREATE POLICY "Authors can update their discussions"
  ON public.peer_discussions FOR UPDATE
  USING (author_id = auth.uid());

-- Authors or moderators can delete discussions
CREATE POLICY "Authors or moderators can delete discussions"
  ON public.peer_discussions FOR DELETE
  USING (
    author_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.peer_group_members
      WHERE peer_group_members.group_id = peer_discussions.group_id
        AND peer_group_members.user_id = auth.uid()
        AND peer_group_members.is_moderator = true
    )
  );

-- -----------------------------------------------------------------------------
-- PEER_DISCUSSION_LIKES POLICIES
-- -----------------------------------------------------------------------------

-- Members can view likes
CREATE POLICY "Members can view discussion likes"
  ON public.peer_discussion_likes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.peer_discussions pd
      JOIN public.peer_group_members pgm ON pgm.group_id = pd.group_id
      WHERE pd.id = peer_discussion_likes.discussion_id
        AND pgm.user_id = auth.uid()
        AND pgm.is_active = true
    )
  );

-- Members can like discussions
CREATE POLICY "Members can like discussions"
  ON public.peer_discussion_likes FOR INSERT
  WITH CHECK (
    user_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.peer_discussions pd
      JOIN public.peer_group_members pgm ON pgm.group_id = pd.group_id
      WHERE pd.id = discussion_id
        AND pgm.user_id = auth.uid()
        AND pgm.is_active = true
    )
  );

-- Users can remove their likes
CREATE POLICY "Users can remove their likes"
  ON public.peer_discussion_likes FOR DELETE
  USING (user_id = auth.uid());

-- -----------------------------------------------------------------------------
-- GROUP_CHALLENGES POLICIES
-- -----------------------------------------------------------------------------

-- Members can view challenges in their groups
CREATE POLICY "Members can view group challenges"
  ON public.group_challenges FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.peer_group_members
      WHERE peer_group_members.group_id = group_challenges.group_id
        AND peer_group_members.user_id = auth.uid()
        AND peer_group_members.is_active = true
    )
  );

-- Moderators can create challenges
CREATE POLICY "Moderators can create challenges"
  ON public.group_challenges FOR INSERT
  WITH CHECK (
    created_by = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.peer_group_members
      WHERE peer_group_members.group_id = group_challenges.group_id
        AND peer_group_members.user_id = auth.uid()
        AND peer_group_members.is_moderator = true
    )
  );

-- Creators can update their challenges
CREATE POLICY "Creators can update challenges"
  ON public.group_challenges FOR UPDATE
  USING (created_by = auth.uid());

-- Creators can delete their challenges
CREATE POLICY "Creators can delete challenges"
  ON public.group_challenges FOR DELETE
  USING (created_by = auth.uid());

-- -----------------------------------------------------------------------------
-- CHALLENGE_PARTICIPANTS POLICIES
-- -----------------------------------------------------------------------------

-- Participants can view challenge participation
CREATE POLICY "Members can view challenge participants"
  ON public.challenge_participants FOR SELECT
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.group_challenges gc
      JOIN public.peer_group_members pgm ON pgm.group_id = gc.group_id
      WHERE gc.id = challenge_participants.challenge_id
        AND pgm.user_id = auth.uid()
        AND pgm.is_active = true
    )
  );

-- Members can join challenges
CREATE POLICY "Members can join challenges"
  ON public.challenge_participants FOR INSERT
  WITH CHECK (
    user_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.group_challenges gc
      JOIN public.peer_group_members pgm ON pgm.group_id = gc.group_id
      WHERE gc.id = challenge_id
        AND pgm.user_id = auth.uid()
        AND pgm.is_active = true
        AND gc.status = 'active'
    )
  );

-- Participants can update their progress
CREATE POLICY "Participants can update their progress"
  ON public.challenge_participants FOR UPDATE
  USING (user_id = auth.uid());

-- Participants can leave challenges
CREATE POLICY "Participants can leave challenges"
  ON public.challenge_participants FOR DELETE
  USING (user_id = auth.uid());

-- -----------------------------------------------------------------------------
-- PEER_REFERRALS POLICIES
-- -----------------------------------------------------------------------------

-- Members can view referrals in their groups
CREATE POLICY "Members can view group referrals"
  ON public.peer_referrals FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.peer_group_members
      WHERE peer_group_members.group_id = peer_referrals.group_id
        AND peer_group_members.user_id = auth.uid()
        AND peer_group_members.is_active = true
    )
  );

-- Members can share referrals
CREATE POLICY "Members can share referrals"
  ON public.peer_referrals FOR INSERT
  WITH CHECK (
    shared_by = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.peer_group_members
      WHERE peer_group_members.group_id = peer_referrals.group_id
        AND peer_group_members.user_id = auth.uid()
        AND peer_group_members.is_active = true
    )
  );

-- Sharers can update their referrals
CREATE POLICY "Sharers can update referrals"
  ON public.peer_referrals FOR UPDATE
  USING (shared_by = auth.uid());

-- Sharers can delete their referrals
CREATE POLICY "Sharers can delete referrals"
  ON public.peer_referrals FOR DELETE
  USING (shared_by = auth.uid());

-- -----------------------------------------------------------------------------
-- SUCCESS_STORIES POLICIES
-- -----------------------------------------------------------------------------

-- Members can view success stories in their groups
CREATE POLICY "Members can view success stories"
  ON public.success_stories FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.peer_group_members
      WHERE peer_group_members.group_id = success_stories.group_id
        AND peer_group_members.user_id = auth.uid()
        AND peer_group_members.is_active = true
    )
  );

-- Members can share success stories
CREATE POLICY "Members can share success stories"
  ON public.success_stories FOR INSERT
  WITH CHECK (
    author_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.peer_group_members
      WHERE peer_group_members.group_id = success_stories.group_id
        AND peer_group_members.user_id = auth.uid()
        AND peer_group_members.is_active = true
    )
  );

-- Authors can update their stories
CREATE POLICY "Authors can update success stories"
  ON public.success_stories FOR UPDATE
  USING (author_id = auth.uid());

-- Authors can delete their stories
CREATE POLICY "Authors can delete success stories"
  ON public.success_stories FOR DELETE
  USING (author_id = auth.uid());

-- ============================================================================
-- SECTION 4: TRIGGERS
-- ============================================================================

-- Update member_count when members join/leave
CREATE OR REPLACE FUNCTION update_peer_group_member_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.peer_groups
    SET member_count = member_count + 1,
        updated_at = now()
    WHERE id = NEW.group_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' OR (TG_OP = 'UPDATE' AND NEW.is_active = false AND OLD.is_active IS NOT DISTINCT FROM true) THEN
    UPDATE public.peer_groups
    SET member_count = GREATEST(0, member_count - 1),
        updated_at = now()
    WHERE id = COALESCE(NEW.group_id, OLD.group_id);
    RETURN COALESCE(NEW, OLD);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_update_peer_group_member_count ON public.peer_group_members;
CREATE TRIGGER trigger_update_peer_group_member_count
  AFTER INSERT OR UPDATE OR DELETE ON public.peer_group_members
  FOR EACH ROW EXECUTE FUNCTION update_peer_group_member_count();

-- Update discussion_count when discussions are created
CREATE OR REPLACE FUNCTION update_peer_group_discussion_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.peer_groups
    SET discussion_count = discussion_count + 1,
        updated_at = now()
    WHERE id = NEW.group_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.peer_groups
    SET discussion_count = GREATEST(0, discussion_count - 1),
        updated_at = now()
    WHERE id = OLD.group_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_update_peer_group_discussion_count ON public.peer_discussions;
CREATE TRIGGER trigger_update_peer_group_discussion_count
  AFTER INSERT OR DELETE ON public.peer_discussions
  FOR EACH ROW EXECUTE FUNCTION update_peer_group_discussion_count();

-- Update likes_count when discussions are liked/unliked
CREATE OR REPLACE FUNCTION update_discussion_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.peer_discussions
    SET likes_count = likes_count + 1
    WHERE id = NEW.discussion_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.peer_discussions
    SET likes_count = GREATEST(0, likes_count - 1)
    WHERE id = OLD.discussion_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_update_discussion_likes_count ON public.peer_discussion_likes;
CREATE TRIGGER trigger_update_discussion_likes_count
  AFTER INSERT OR DELETE ON public.peer_discussion_likes
  FOR EACH ROW EXECUTE FUNCTION update_discussion_likes_count();

-- Update participant_count for challenges
CREATE OR REPLACE FUNCTION update_challenge_participant_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.group_challenges
    SET participant_count = participant_count + 1,
        updated_at = now()
    WHERE id = NEW.challenge_id;
  ELSIF TG_OP = 'DELETE' OR (TG_OP = 'UPDATE' AND NEW.is_active = false AND OLD.is_active = true) THEN
    UPDATE public.group_challenges
    SET participant_count = GREATEST(0, participant_count - 1),
        updated_at = now()
    WHERE id = COALESCE(NEW.challenge_id, OLD.challenge_id);
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_update_challenge_participant_count ON public.challenge_participants;
CREATE TRIGGER trigger_update_challenge_participant_count
  AFTER INSERT OR UPDATE OR DELETE ON public.challenge_participants
  FOR EACH ROW EXECUTE FUNCTION update_challenge_participant_count();

-- Update updated_at timestamps
CREATE OR REPLACE FUNCTION update_peer_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_peer_groups_updated_at ON public.peer_groups;
CREATE TRIGGER update_peer_groups_updated_at
  BEFORE UPDATE ON public.peer_groups
  FOR EACH ROW EXECUTE FUNCTION update_peer_updated_at_column();

DROP TRIGGER IF EXISTS update_peer_discussions_updated_at ON public.peer_discussions;
CREATE TRIGGER update_peer_discussions_updated_at
  BEFORE UPDATE ON public.peer_discussions
  FOR EACH ROW EXECUTE FUNCTION update_peer_updated_at_column();

DROP TRIGGER IF EXISTS update_group_challenges_updated_at ON public.group_challenges;
CREATE TRIGGER update_group_challenges_updated_at
  BEFORE UPDATE ON public.group_challenges
  FOR EACH ROW EXECUTE FUNCTION update_peer_updated_at_column();

DROP TRIGGER IF EXISTS update_success_stories_updated_at ON public.success_stories;
CREATE TRIGGER update_success_stories_updated_at
  BEFORE UPDATE ON public.success_stories
  FOR EACH ROW EXECUTE FUNCTION update_peer_updated_at_column();

-- ============================================================================
-- SECTION 5: HELPER FUNCTIONS
-- ============================================================================

-- Get user's peer groups with membership info
CREATE OR REPLACE FUNCTION get_user_peer_groups(p_user_id uuid)
RETURNS TABLE (
  group_id uuid,
  group_name text,
  group_type text,
  member_count integer,
  is_moderator boolean,
  joined_at timestamp with time zone
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    pg.id,
    pg.name,
    pg.group_type::text,
    pg.member_count,
    pgm.is_moderator,
    pgm.joined_at
  FROM public.peer_groups pg
  JOIN public.peer_group_members pgm ON pgm.group_id = pg.id
  WHERE pgm.user_id = p_user_id
    AND pgm.is_active = true
    AND pg.is_active = true
  ORDER BY pgm.joined_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Search for peer groups
CREATE OR REPLACE FUNCTION search_peer_groups(
  p_search_term text DEFAULT NULL,
  p_group_type text DEFAULT NULL,
  p_industry text DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  name text,
  description text,
  group_type text,
  industry text,
  role_focus text,
  member_count integer,
  is_featured boolean
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    pg.id,
    pg.name,
    pg.description,
    pg.group_type::text,
    pg.industry,
    pg.role_focus,
    pg.member_count,
    pg.is_featured
  FROM public.peer_groups pg
  WHERE pg.visibility = 'public'
    AND pg.is_active = true
    AND (p_search_term IS NULL OR pg.name ILIKE '%' || p_search_term || '%' OR pg.description ILIKE '%' || p_search_term || '%')
    AND (p_group_type IS NULL OR pg.group_type::text = p_group_type)
    AND (p_industry IS NULL OR pg.industry = p_industry)
  ORDER BY pg.is_featured DESC, pg.member_count DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_user_peer_groups IS 'Get all peer groups a user is a member of';
COMMENT ON FUNCTION search_peer_groups IS 'Search for public peer groups with optional filters';

-- Increment member posts count when a discussion is created
CREATE OR REPLACE FUNCTION increment_member_posts(p_group_id uuid, p_user_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE public.peer_group_members
  SET posts_count = posts_count + 1,
      last_active_at = now()
  WHERE group_id = p_group_id
    AND user_id = p_user_id
    AND is_active = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION increment_member_posts IS 'Increment member posts count and update last active timestamp';

-- ============================================================================
-- End of Migration
-- ============================================================================
