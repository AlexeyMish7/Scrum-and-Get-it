/**
 * PROGRESS SHARING AND ACCOUNTABILITY SCHEMA
 *
 * Purpose: Support UC-111 - Progress Sharing and Accountability
 * Created: 2025-11-30
 *
 * Features:
 * - Privacy settings for progress sharing with team members
 * - Progress snapshots for regular reporting
 * - Accountability partnerships for peer support
 * - Achievement celebrations for milestone recognition
 *
 * Tables:
 * - progress_sharing_settings: User privacy preferences for what data to share
 * - progress_snapshots: Periodic snapshots of user's job search progress
 * - accountability_partnerships: Links between users for mutual accountability
 * - achievement_celebrations: Milestone achievements and celebrations
 */

-- ============================================================================
-- SECTION 1: CUSTOM TYPES (ENUMs)
-- ============================================================================

-- Drop existing enums if they exist (for clean recreation)
DROP TYPE IF EXISTS sharing_visibility_enum CASCADE;
DROP TYPE IF EXISTS celebration_type_enum CASCADE;
DROP TYPE IF EXISTS partnership_status_enum CASCADE;

-- Visibility levels for progress sharing
-- Controls who can see the user's progress data
CREATE TYPE sharing_visibility_enum AS ENUM (
  'private',           -- Only the user can see their progress
  'mentors_only',      -- Only assigned mentors can view
  'accountability',    -- Accountability partners can view
  'team',              -- All team members can view
  'public'             -- Anyone in the organization (future use)
);

-- Types of achievements that can be celebrated
CREATE TYPE celebration_type_enum AS ENUM (
  'first_application',      -- First job application submitted
  'application_milestone',  -- 10, 25, 50, 100 applications
  'first_interview',        -- First interview scheduled
  'interview_milestone',    -- Multiple interviews in a week
  'goal_completed',         -- Completed a mentee goal
  'streak_achieved',        -- Maintained activity streak
  'offer_received',         -- Received a job offer
  'offer_accepted',         -- Accepted a job offer
  'document_approved',      -- Resume/cover letter approved by mentor
  'weekly_target_met',      -- Met weekly application target
  'monthly_target_met',     -- Met monthly application target
  'custom'                  -- Custom celebration created by mentor
);

-- Status of accountability partnerships
CREATE TYPE partnership_status_enum AS ENUM (
  'pending',    -- Invitation sent, awaiting response
  'active',     -- Partnership is active
  'paused',     -- Temporarily paused
  'ended'       -- Partnership has ended
);

-- ============================================================================
-- SECTION 2: PROGRESS SHARING SETTINGS TABLE
-- ============================================================================

/**
 * PROGRESS_SHARING_SETTINGS
 *
 * Stores user preferences for what progress data to share and with whom.
 * Each user has one settings record per team (can have different settings
 * for different teams they belong to).
 */
CREATE TABLE IF NOT EXISTS public.progress_sharing_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Relationships
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  team_id uuid NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,

  -- Overall visibility level
  visibility sharing_visibility_enum NOT NULL DEFAULT 'mentors_only',

  -- Granular sharing controls (what data to share)
  share_applications boolean NOT NULL DEFAULT true,
  share_interviews boolean NOT NULL DEFAULT true,
  share_offers boolean NOT NULL DEFAULT true,
  share_goals boolean NOT NULL DEFAULT true,
  share_activity_timeline boolean NOT NULL DEFAULT false,
  share_documents boolean NOT NULL DEFAULT false,  -- Allow document access for review

  -- Notification preferences
  notify_on_view boolean NOT NULL DEFAULT false,       -- Notify when someone views progress
  notify_on_celebration boolean NOT NULL DEFAULT true, -- Notify when receiving celebrations
  notify_weekly_summary boolean NOT NULL DEFAULT true, -- Send weekly progress summary

  -- Display preferences
  show_on_team_leaderboard boolean NOT NULL DEFAULT false, -- Opt-in to team leaderboard
  allow_encouragement boolean NOT NULL DEFAULT true,       -- Allow team members to send encouragement

  -- Timestamps
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  -- Constraints
  CONSTRAINT progress_sharing_settings_unique UNIQUE (user_id, team_id)
);

-- Enable RLS
ALTER TABLE public.progress_sharing_settings ENABLE ROW LEVEL SECURITY;

-- Indexes
CREATE INDEX idx_progress_sharing_user ON public.progress_sharing_settings(user_id);
CREATE INDEX idx_progress_sharing_team ON public.progress_sharing_settings(team_id);
CREATE INDEX idx_progress_sharing_visibility ON public.progress_sharing_settings(team_id, visibility);

-- Comments
COMMENT ON TABLE public.progress_sharing_settings IS 'User privacy preferences for progress sharing (UC-111)';
COMMENT ON COLUMN public.progress_sharing_settings.visibility IS 'Overall visibility level for progress data';
COMMENT ON COLUMN public.progress_sharing_settings.share_applications IS 'Share application count and status';
COMMENT ON COLUMN public.progress_sharing_settings.share_interviews IS 'Share interview scheduling data';

-- ============================================================================
-- SECTION 3: PROGRESS SNAPSHOTS TABLE
-- ============================================================================

/**
 * PROGRESS_SNAPSHOTS
 *
 * Periodic snapshots of user's job search progress for reporting.
 * Generated weekly (or on-demand) to track trends over time.
 * Mentors and accountability partners view these snapshots.
 */
CREATE TABLE IF NOT EXISTS public.progress_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Relationships
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  team_id uuid NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,

  -- Snapshot period
  snapshot_date date NOT NULL DEFAULT CURRENT_DATE,
  period_type text NOT NULL DEFAULT 'weekly' CHECK (period_type IN ('daily', 'weekly', 'monthly')),
  period_start date NOT NULL,
  period_end date NOT NULL,

  -- Application metrics
  applications_total integer NOT NULL DEFAULT 0,
  applications_this_period integer NOT NULL DEFAULT 0,
  applications_by_status jsonb NOT NULL DEFAULT '{}'::jsonb,
  -- e.g., {"Applied": 5, "Interview": 2, "Offer": 1, "Rejected": 3}

  -- Interview metrics
  interviews_scheduled integer NOT NULL DEFAULT 0,
  interviews_completed integer NOT NULL DEFAULT 0,
  interviews_this_period integer NOT NULL DEFAULT 0,

  -- Offer metrics
  offers_received integer NOT NULL DEFAULT 0,
  offers_this_period integer NOT NULL DEFAULT 0,

  -- Goal metrics
  goals_total integer NOT NULL DEFAULT 0,
  goals_completed integer NOT NULL DEFAULT 0,
  goals_completion_rate numeric(5,2) DEFAULT 0,

  -- Engagement metrics
  activity_score integer DEFAULT 0,  -- 0-100 score based on activity
  streak_days integer DEFAULT 0,     -- Consecutive days with activity

  -- Trend indicators (compared to previous period)
  applications_trend integer DEFAULT 0,  -- +/- compared to last period
  interviews_trend integer DEFAULT 0,
  activity_trend integer DEFAULT 0,

  -- Detailed data (for charts/visualization)
  daily_breakdown jsonb DEFAULT '[]'::jsonb,
  -- e.g., [{"date": "2025-11-25", "applications": 2, "interviews": 1}, ...]

  -- Timestamps
  created_at timestamptz NOT NULL DEFAULT now(),

  -- Constraints
  CONSTRAINT progress_snapshots_period_check CHECK (period_end >= period_start)
);

-- Enable RLS
ALTER TABLE public.progress_snapshots ENABLE ROW LEVEL SECURITY;

-- Indexes
CREATE INDEX idx_progress_snapshots_user ON public.progress_snapshots(user_id, snapshot_date DESC);
CREATE INDEX idx_progress_snapshots_team ON public.progress_snapshots(team_id, snapshot_date DESC);
CREATE INDEX idx_progress_snapshots_period ON public.progress_snapshots(user_id, period_type, snapshot_date DESC);

-- Comments
COMMENT ON TABLE public.progress_snapshots IS 'Periodic progress snapshots for reporting and visualization (UC-111)';
COMMENT ON COLUMN public.progress_snapshots.activity_score IS 'Engagement score 0-100 based on job search activity';
COMMENT ON COLUMN public.progress_snapshots.streak_days IS 'Consecutive days with at least one job search activity';

-- ============================================================================
-- SECTION 4: ACCOUNTABILITY PARTNERSHIPS TABLE
-- ============================================================================

/**
 * ACCOUNTABILITY_PARTNERSHIPS
 *
 * Links between users for mutual accountability and support.
 * Candidates can have accountability partners within their team
 * who can view their progress and send encouragement.
 */
CREATE TABLE IF NOT EXISTS public.accountability_partnerships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Relationships
  team_id uuid NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,      -- The candidate
  partner_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,   -- The accountability partner

  -- Partnership details
  status partnership_status_enum NOT NULL DEFAULT 'pending',

  -- Who initiated the partnership
  initiated_by uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,

  -- Optional message for invitation
  invitation_message text,

  -- Engagement tracking
  last_interaction_at timestamptz,
  interaction_count integer NOT NULL DEFAULT 0,
  encouragement_sent integer NOT NULL DEFAULT 0,
  encouragement_received integer NOT NULL DEFAULT 0,

  -- Effectiveness score (calculated based on activity after partnering)
  effectiveness_score integer DEFAULT 0,  -- 0-100

  -- Timestamps
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  accepted_at timestamptz,
  ended_at timestamptz,

  -- Constraints
  CONSTRAINT accountability_partnerships_different_users CHECK (user_id != partner_id),
  CONSTRAINT accountability_partnerships_unique UNIQUE (team_id, user_id, partner_id)
);

-- Enable RLS
ALTER TABLE public.accountability_partnerships ENABLE ROW LEVEL SECURITY;

-- Indexes
CREATE INDEX idx_accountability_partnerships_user ON public.accountability_partnerships(user_id, status);
CREATE INDEX idx_accountability_partnerships_partner ON public.accountability_partnerships(partner_id, status);
CREATE INDEX idx_accountability_partnerships_team ON public.accountability_partnerships(team_id, status);

-- Comments
COMMENT ON TABLE public.accountability_partnerships IS 'Peer accountability partnerships for job search support (UC-111)';
COMMENT ON COLUMN public.accountability_partnerships.effectiveness_score IS 'Score indicating partnership effectiveness on job search progress';

-- ============================================================================
-- SECTION 5: ACHIEVEMENT CELEBRATIONS TABLE
-- ============================================================================

/**
 * ACHIEVEMENT_CELEBRATIONS
 *
 * Records milestone achievements and celebrations.
 * These can be auto-generated or created by mentors/partners.
 * Provides encouragement and motivation features.
 */
CREATE TABLE IF NOT EXISTS public.achievement_celebrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Relationships
  team_id uuid NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,  -- Who achieved this

  -- Achievement details
  celebration_type celebration_type_enum NOT NULL,
  title text NOT NULL,
  description text,

  -- Achievement value (for milestones)
  milestone_value integer,  -- e.g., 10 for "10 applications"

  -- Related entities (optional)
  related_job_id bigint REFERENCES public.jobs(id) ON DELETE SET NULL,
  related_goal_id uuid REFERENCES public.mentee_goals(id) ON DELETE SET NULL,

  -- Who triggered this celebration (null = auto-generated)
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,

  -- Celebration metadata
  is_auto_generated boolean NOT NULL DEFAULT true,
  is_shared boolean NOT NULL DEFAULT true,   -- Visible to team
  is_dismissed boolean NOT NULL DEFAULT false,

  -- Reactions/encouragement from team
  reactions jsonb DEFAULT '[]'::jsonb,
  -- e.g., [{"user_id": "...", "emoji": "🎉", "message": "Great job!", "created_at": "..."}]

  -- Timestamps
  celebrated_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.achievement_celebrations ENABLE ROW LEVEL SECURITY;

-- Indexes
CREATE INDEX idx_achievement_celebrations_user ON public.achievement_celebrations(user_id, celebrated_at DESC);
CREATE INDEX idx_achievement_celebrations_team ON public.achievement_celebrations(team_id, celebrated_at DESC);
CREATE INDEX idx_achievement_celebrations_type ON public.achievement_celebrations(celebration_type, celebrated_at DESC);
CREATE INDEX idx_achievement_celebrations_shared ON public.achievement_celebrations(team_id, is_shared, celebrated_at DESC)
  WHERE is_shared = true AND is_dismissed = false;

-- Comments
COMMENT ON TABLE public.achievement_celebrations IS 'Milestone achievements and team celebrations (UC-111)';
COMMENT ON COLUMN public.achievement_celebrations.reactions IS 'Team member reactions stored as JSONB array';

-- ============================================================================
-- SECTION 6: ROW LEVEL SECURITY POLICIES
-- ============================================================================

-- -----------------------------------------------------------------------------
-- PROGRESS_SHARING_SETTINGS POLICIES
-- -----------------------------------------------------------------------------

-- Users can view their own settings
CREATE POLICY "Users can view their own sharing settings"
  ON public.progress_sharing_settings FOR SELECT
  USING (user_id = auth.uid());

-- Team members can view settings to determine what they can see
-- (Used by system to check visibility permissions)
CREATE POLICY "Team members can view team sharing settings"
  ON public.progress_sharing_settings FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.team_members tm
      WHERE tm.team_id = progress_sharing_settings.team_id
        AND tm.user_id = auth.uid()
        AND tm.is_active = true
    )
  );

-- Users can insert their own settings
CREATE POLICY "Users can create their own sharing settings"
  ON public.progress_sharing_settings FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Users can update their own settings
CREATE POLICY "Users can update their own sharing settings"
  ON public.progress_sharing_settings FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Users can delete their own settings
CREATE POLICY "Users can delete their own sharing settings"
  ON public.progress_sharing_settings FOR DELETE
  USING (user_id = auth.uid());

-- -----------------------------------------------------------------------------
-- PROGRESS_SNAPSHOTS POLICIES
-- -----------------------------------------------------------------------------

-- Users can always view their own snapshots
CREATE POLICY "Users can view their own snapshots"
  ON public.progress_snapshots FOR SELECT
  USING (user_id = auth.uid());

-- Mentors can view snapshots for their assigned candidates (if sharing enabled)
CREATE POLICY "Mentors can view assigned candidate snapshots"
  ON public.progress_snapshots FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.team_member_assignments tma
      JOIN public.progress_sharing_settings pss
        ON pss.user_id = progress_snapshots.user_id
        AND pss.team_id = progress_snapshots.team_id
      WHERE tma.mentor_id = auth.uid()
        AND tma.candidate_id = progress_snapshots.user_id
        AND tma.team_id = progress_snapshots.team_id
        AND tma.is_active = true
        AND pss.visibility IN ('mentors_only', 'accountability', 'team', 'public')
    )
  );

-- Accountability partners can view snapshots (if sharing enabled)
CREATE POLICY "Accountability partners can view snapshots"
  ON public.progress_snapshots FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.accountability_partnerships ap
      JOIN public.progress_sharing_settings pss
        ON pss.user_id = progress_snapshots.user_id
        AND pss.team_id = progress_snapshots.team_id
      WHERE ap.partner_id = auth.uid()
        AND ap.user_id = progress_snapshots.user_id
        AND ap.team_id = progress_snapshots.team_id
        AND ap.status = 'active'
        AND pss.visibility IN ('accountability', 'team', 'public')
    )
  );

-- Team members can view if visibility is 'team' or higher
CREATE POLICY "Team members can view team-visible snapshots"
  ON public.progress_snapshots FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.team_members tm
      JOIN public.progress_sharing_settings pss
        ON pss.user_id = progress_snapshots.user_id
        AND pss.team_id = progress_snapshots.team_id
      WHERE tm.team_id = progress_snapshots.team_id
        AND tm.user_id = auth.uid()
        AND tm.is_active = true
        AND pss.visibility IN ('team', 'public')
    )
  );

-- System can insert snapshots (service role)
CREATE POLICY "Allow snapshot inserts"
  ON public.progress_snapshots FOR INSERT
  WITH CHECK (user_id = auth.uid() OR true);  -- Allow system inserts

-- -----------------------------------------------------------------------------
-- ACCOUNTABILITY_PARTNERSHIPS POLICIES
-- -----------------------------------------------------------------------------

-- Users can view partnerships they're involved in
CREATE POLICY "Users can view their partnerships"
  ON public.accountability_partnerships FOR SELECT
  USING (user_id = auth.uid() OR partner_id = auth.uid());

-- Team admins can view all partnerships in their team
CREATE POLICY "Admins can view team partnerships"
  ON public.accountability_partnerships FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.team_members tm
      WHERE tm.team_id = accountability_partnerships.team_id
        AND tm.user_id = auth.uid()
        AND tm.role = 'admin'
        AND tm.is_active = true
    )
  );

-- Users can create partnership requests
CREATE POLICY "Users can create partnership requests"
  ON public.accountability_partnerships FOR INSERT
  WITH CHECK (
    initiated_by = auth.uid()
    AND (user_id = auth.uid() OR partner_id = auth.uid())
  );

-- Partnership participants can update (accept/decline/end)
CREATE POLICY "Partnership participants can update"
  ON public.accountability_partnerships FOR UPDATE
  USING (user_id = auth.uid() OR partner_id = auth.uid());

-- Only initiator can delete pending requests
CREATE POLICY "Initiator can delete pending requests"
  ON public.accountability_partnerships FOR DELETE
  USING (initiated_by = auth.uid() AND status = 'pending');

-- -----------------------------------------------------------------------------
-- ACHIEVEMENT_CELEBRATIONS POLICIES
-- -----------------------------------------------------------------------------

-- Users can view their own celebrations
CREATE POLICY "Users can view their own celebrations"
  ON public.achievement_celebrations FOR SELECT
  USING (user_id = auth.uid());

-- Team members can view shared celebrations (respecting privacy settings)
CREATE POLICY "Team members can view shared celebrations"
  ON public.achievement_celebrations FOR SELECT
  USING (
    is_shared = true
    AND EXISTS (
      SELECT 1 FROM public.team_members tm
      JOIN public.progress_sharing_settings pss
        ON pss.user_id = achievement_celebrations.user_id
        AND pss.team_id = achievement_celebrations.team_id
      WHERE tm.team_id = achievement_celebrations.team_id
        AND tm.user_id = auth.uid()
        AND tm.is_active = true
        AND pss.visibility != 'private'
    )
  );

-- System and mentors can create celebrations
CREATE POLICY "Allow celebration creation"
  ON public.achievement_celebrations FOR INSERT
  WITH CHECK (
    user_id = auth.uid()  -- User celebrating themselves
    OR created_by = auth.uid()  -- Mentor creating for mentee
    OR created_by IS NULL  -- Auto-generated
  );

-- Users can update their own celebrations (dismiss, etc.)
CREATE POLICY "Users can update their own celebrations"
  ON public.achievement_celebrations FOR UPDATE
  USING (user_id = auth.uid());

-- Team members can add reactions to shared celebrations
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

-- ============================================================================
-- SECTION 7: DATABASE FUNCTIONS
-- ============================================================================

/**
 * Function: create_progress_snapshot
 *
 * Creates a progress snapshot for a user for a given period.
 * Calculates metrics from jobs, interviews, and goals tables.
 */
CREATE OR REPLACE FUNCTION create_progress_snapshot(
  p_user_id uuid,
  p_team_id uuid,
  p_period_type text DEFAULT 'weekly',
  p_period_start date DEFAULT NULL,
  p_period_end date DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_snapshot_id uuid;
  v_period_start date;
  v_period_end date;
  v_apps_total integer;
  v_apps_period integer;
  v_apps_by_status jsonb;
  v_interviews_scheduled integer;
  v_interviews_completed integer;
  v_interviews_period integer;
  v_offers_total integer;
  v_offers_period integer;
  v_goals_total integer;
  v_goals_completed integer;
  v_goals_rate numeric;
  v_prev_apps integer;
  v_prev_interviews integer;
BEGIN
  -- Calculate period dates if not provided
  v_period_end := COALESCE(p_period_end, CURRENT_DATE);

  IF p_period_type = 'weekly' THEN
    v_period_start := COALESCE(p_period_start, v_period_end - INTERVAL '7 days');
  ELSIF p_period_type = 'monthly' THEN
    v_period_start := COALESCE(p_period_start, v_period_end - INTERVAL '30 days');
  ELSE
    v_period_start := COALESCE(p_period_start, v_period_end);
  END IF;

  -- Get total applications
  SELECT COUNT(*) INTO v_apps_total
  FROM public.jobs
  WHERE user_id = p_user_id;

  -- Get applications this period
  SELECT COUNT(*) INTO v_apps_period
  FROM public.jobs
  WHERE user_id = p_user_id
    AND created_at >= v_period_start
    AND created_at <= v_period_end + INTERVAL '1 day';

  -- Get applications by status
  SELECT COALESCE(jsonb_object_agg(job_status, cnt), '{}'::jsonb) INTO v_apps_by_status
  FROM (
    SELECT job_status, COUNT(*) as cnt
    FROM public.jobs
    WHERE user_id = p_user_id
    GROUP BY job_status
  ) status_counts;

  -- Get interview counts
  SELECT
    COUNT(*) FILTER (WHERE job_status IN ('Interview', 'Phone Screen')),
    COUNT(*) FILTER (WHERE job_status IN ('Interview', 'Phone Screen')
      AND updated_at >= v_period_start)
  INTO v_interviews_scheduled, v_interviews_period
  FROM public.jobs
  WHERE user_id = p_user_id;

  v_interviews_completed := v_interviews_scheduled;  -- Simplified

  -- Get offers
  SELECT
    COUNT(*) FILTER (WHERE job_status IN ('Offer', 'Accepted')),
    COUNT(*) FILTER (WHERE job_status IN ('Offer', 'Accepted')
      AND updated_at >= v_period_start)
  INTO v_offers_total, v_offers_period
  FROM public.jobs
  WHERE user_id = p_user_id;

  -- Get goals (from mentee_goals if exists)
  SELECT
    COUNT(*),
    COUNT(*) FILTER (WHERE status = 'completed')
  INTO v_goals_total, v_goals_completed
  FROM public.mentee_goals
  WHERE candidate_id = p_user_id
    AND team_id = p_team_id;

  -- Calculate completion rate
  v_goals_rate := CASE
    WHEN v_goals_total > 0 THEN ROUND((v_goals_completed::numeric / v_goals_total) * 100, 2)
    ELSE 0
  END;

  -- Get previous period for trends
  SELECT applications_this_period, interviews_this_period
  INTO v_prev_apps, v_prev_interviews
  FROM public.progress_snapshots
  WHERE user_id = p_user_id
    AND team_id = p_team_id
    AND period_type = p_period_type
  ORDER BY snapshot_date DESC
  LIMIT 1;

  -- Insert the snapshot
  INSERT INTO public.progress_snapshots (
    user_id,
    team_id,
    snapshot_date,
    period_type,
    period_start,
    period_end,
    applications_total,
    applications_this_period,
    applications_by_status,
    interviews_scheduled,
    interviews_completed,
    interviews_this_period,
    offers_received,
    offers_this_period,
    goals_total,
    goals_completed,
    goals_completion_rate,
    applications_trend,
    interviews_trend
  ) VALUES (
    p_user_id,
    p_team_id,
    CURRENT_DATE,
    p_period_type,
    v_period_start,
    v_period_end,
    v_apps_total,
    v_apps_period,
    v_apps_by_status,
    v_interviews_scheduled,
    v_interviews_completed,
    v_interviews_period,
    v_offers_total,
    v_offers_period,
    v_goals_total,
    v_goals_completed,
    v_goals_rate,
    COALESCE(v_apps_period - v_prev_apps, 0),
    COALESCE(v_interviews_period - v_prev_interviews, 0)
  )
  RETURNING id INTO v_snapshot_id;

  RETURN v_snapshot_id;
END;
$$;

COMMENT ON FUNCTION create_progress_snapshot IS 'Creates a progress snapshot for a user, calculating metrics from jobs and goals';

/**
 * Function: check_and_create_achievement
 *
 * Checks if user has reached a milestone and creates a celebration.
 * Called after job status changes or goal completions.
 */
CREATE OR REPLACE FUNCTION check_and_create_achievement(
  p_user_id uuid,
  p_team_id uuid,
  p_event_type text,
  p_event_value integer DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_celebration_id uuid;
  v_celebration_type celebration_type_enum;
  v_title text;
  v_description text;
  v_milestone integer;
  v_apps_count integer;
BEGIN
  -- Determine achievement based on event
  CASE p_event_type
    WHEN 'application_added' THEN
      -- Check for application milestones
      SELECT COUNT(*) INTO v_apps_count
      FROM public.jobs
      WHERE user_id = p_user_id;

      IF v_apps_count = 1 THEN
        v_celebration_type := 'first_application';
        v_title := 'First Application Submitted! 🎉';
        v_description := 'You''ve taken the first step in your job search journey.';
        v_milestone := 1;
      ELSIF v_apps_count IN (10, 25, 50, 100, 250, 500) THEN
        v_celebration_type := 'application_milestone';
        v_title := format('%s Applications Submitted! 🚀', v_apps_count);
        v_description := format('You''ve submitted %s job applications. Keep up the momentum!', v_apps_count);
        v_milestone := v_apps_count;
      ELSE
        RETURN NULL;  -- No celebration for this count
      END IF;

    WHEN 'interview_scheduled' THEN
      -- Check for first interview
      SELECT COUNT(*) INTO v_apps_count
      FROM public.jobs
      WHERE user_id = p_user_id
        AND job_status IN ('Interview', 'Phone Screen');

      IF v_apps_count = 1 THEN
        v_celebration_type := 'first_interview';
        v_title := 'First Interview Scheduled! 🎯';
        v_description := 'Your hard work is paying off - you landed an interview!';
        v_milestone := 1;
      ELSE
        RETURN NULL;
      END IF;

    WHEN 'offer_received' THEN
      v_celebration_type := 'offer_received';
      v_title := 'Job Offer Received! 🌟';
      v_description := 'Congratulations! You''ve received a job offer!';
      v_milestone := 1;

    WHEN 'offer_accepted' THEN
      v_celebration_type := 'offer_accepted';
      v_title := 'Offer Accepted! 🎊';
      v_description := 'Amazing! You''ve accepted a job offer. Congratulations on your new role!';
      v_milestone := 1;

    WHEN 'goal_completed' THEN
      v_celebration_type := 'goal_completed';
      v_title := 'Goal Achieved! ✅';
      v_description := 'You''ve completed a goal. Great progress!';
      v_milestone := p_event_value;

    ELSE
      RETURN NULL;
  END CASE;

  -- Create the celebration
  INSERT INTO public.achievement_celebrations (
    team_id,
    user_id,
    celebration_type,
    title,
    description,
    milestone_value,
    is_auto_generated,
    is_shared
  ) VALUES (
    p_team_id,
    p_user_id,
    v_celebration_type,
    v_title,
    v_description,
    v_milestone,
    true,
    true
  )
  RETURNING id INTO v_celebration_id;

  RETURN v_celebration_id;
END;
$$;

COMMENT ON FUNCTION check_and_create_achievement IS 'Creates achievement celebrations for milestones automatically';

/**
 * Function: get_user_progress_summary
 *
 * Returns a summary of user's progress for display in dashboards.
 * Respects privacy settings when called for another user.
 */
CREATE OR REPLACE FUNCTION get_user_progress_summary(
  p_user_id uuid,
  p_team_id uuid,
  p_viewer_id uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_settings record;
  v_can_view boolean := false;
  v_summary jsonb;
  v_latest_snapshot record;
BEGIN
  -- Check if viewer has permission
  IF p_viewer_id IS NULL OR p_viewer_id = p_user_id THEN
    v_can_view := true;
  ELSE
    -- Get sharing settings
    SELECT * INTO v_settings
    FROM public.progress_sharing_settings
    WHERE user_id = p_user_id AND team_id = p_team_id;

    IF v_settings IS NOT NULL THEN
      -- Check visibility level
      IF v_settings.visibility = 'team' OR v_settings.visibility = 'public' THEN
        v_can_view := true;
      ELSIF v_settings.visibility = 'mentors_only' THEN
        -- Check if viewer is mentor
        SELECT EXISTS (
          SELECT 1 FROM public.team_member_assignments
          WHERE mentor_id = p_viewer_id
            AND candidate_id = p_user_id
            AND team_id = p_team_id
            AND is_active = true
        ) INTO v_can_view;
      ELSIF v_settings.visibility = 'accountability' THEN
        -- Check if viewer is mentor or accountability partner
        SELECT EXISTS (
          SELECT 1 FROM public.team_member_assignments
          WHERE mentor_id = p_viewer_id
            AND candidate_id = p_user_id
            AND team_id = p_team_id
            AND is_active = true
          UNION
          SELECT 1 FROM public.accountability_partnerships
          WHERE partner_id = p_viewer_id
            AND user_id = p_user_id
            AND team_id = p_team_id
            AND status = 'active'
        ) INTO v_can_view;
      END IF;
    END IF;
  END IF;

  IF NOT v_can_view THEN
    RETURN jsonb_build_object('error', 'No permission to view progress');
  END IF;

  -- Get latest snapshot
  SELECT * INTO v_latest_snapshot
  FROM public.progress_snapshots
  WHERE user_id = p_user_id AND team_id = p_team_id
  ORDER BY snapshot_date DESC
  LIMIT 1;

  -- Build summary
  v_summary := jsonb_build_object(
    'user_id', p_user_id,
    'team_id', p_team_id,
    'has_snapshot', v_latest_snapshot IS NOT NULL,
    'snapshot', CASE
      WHEN v_latest_snapshot IS NOT NULL THEN
        jsonb_build_object(
          'snapshot_date', v_latest_snapshot.snapshot_date,
          'applications_total', v_latest_snapshot.applications_total,
          'applications_this_period', v_latest_snapshot.applications_this_period,
          'applications_trend', v_latest_snapshot.applications_trend,
          'interviews_scheduled', v_latest_snapshot.interviews_scheduled,
          'interviews_trend', v_latest_snapshot.interviews_trend,
          'offers_received', v_latest_snapshot.offers_received,
          'goals_total', v_latest_snapshot.goals_total,
          'goals_completed', v_latest_snapshot.goals_completed,
          'goals_completion_rate', v_latest_snapshot.goals_completion_rate,
          'activity_score', v_latest_snapshot.activity_score,
          'streak_days', v_latest_snapshot.streak_days
        )
      ELSE NULL
    END,
    'visibility', COALESCE(v_settings.visibility::text, 'mentors_only'),
    'sharing_enabled', v_settings IS NOT NULL
  );

  RETURN v_summary;
END;
$$;

COMMENT ON FUNCTION get_user_progress_summary IS 'Returns user progress summary respecting privacy settings';

-- ============================================================================
-- SECTION 8: TRIGGERS
-- ============================================================================

-- Updated_at trigger for progress_sharing_settings
CREATE TRIGGER update_progress_sharing_settings_updated_at
  BEFORE UPDATE ON public.progress_sharing_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Updated_at trigger for accountability_partnerships
CREATE TRIGGER update_accountability_partnerships_updated_at
  BEFORE UPDATE ON public.accountability_partnerships
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- SECTION 9: GRANTS AND PERMISSIONS
-- ============================================================================

-- Grant access to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON public.progress_sharing_settings TO authenticated;
GRANT SELECT, INSERT ON public.progress_snapshots TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.accountability_partnerships TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.achievement_celebrations TO authenticated;

-- Grant execute on functions
GRANT EXECUTE ON FUNCTION create_progress_snapshot TO authenticated;
GRANT EXECUTE ON FUNCTION check_and_create_achievement TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_progress_summary TO authenticated;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Progress Sharing and Accountability schema migration completed successfully!';
  RAISE NOTICE 'Created tables:';
  RAISE NOTICE '  - progress_sharing_settings: User privacy preferences';
  RAISE NOTICE '  - progress_snapshots: Periodic progress snapshots';
  RAISE NOTICE '  - accountability_partnerships: Peer accountability links';
  RAISE NOTICE '  - achievement_celebrations: Milestone celebrations';
  RAISE NOTICE 'Created ENUMs:';
  RAISE NOTICE '  - sharing_visibility_enum';
  RAISE NOTICE '  - celebration_type_enum';
  RAISE NOTICE '  - partnership_status_enum';
  RAISE NOTICE 'Created functions:';
  RAISE NOTICE '  - create_progress_snapshot()';
  RAISE NOTICE '  - check_and_create_achievement()';
  RAISE NOTICE '  - get_user_progress_summary()';
END $$;
