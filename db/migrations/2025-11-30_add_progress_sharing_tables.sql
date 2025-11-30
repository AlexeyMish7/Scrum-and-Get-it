/**
 * PROGRESS SHARING AND ACCOUNTABILITY SCHEMA (UC-111)
 *
 * Purpose: Enable users to share job search progress with mentors and accountability partners
 *
 * Features:
 * - Privacy settings for progress sharing
 * - Milestone tracking and celebrations
 * - Progress report generation
 * - Accountability partner engagement tracking
 * - Encouragement/motivation features
 */

-- ============================================================================
-- SECTION 1: PROGRESS SHARING SETTINGS
-- ============================================================================

-- Stores user preferences for what data to share with whom
CREATE TABLE IF NOT EXISTS public.progress_shares (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- User who owns the progress data
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  
  -- Team context (sharing is within teams)
  team_id uuid NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  
  -- What to share (granular privacy controls)
  share_settings jsonb NOT NULL DEFAULT '{
    "share_job_stats": true,
    "share_application_count": true,
    "share_interview_count": true,
    "share_offer_count": true,
    "share_goals": true,
    "share_milestones": true,
    "share_activity_timeline": false,
    "share_company_names": false,
    "share_salary_info": false,
    "share_documents": false
  }'::jsonb,
  
  -- Report preferences
  report_settings jsonb NOT NULL DEFAULT '{
    "auto_generate_weekly": true,
    "auto_generate_monthly": false,
    "include_insights": true,
    "include_recommendations": true
  }'::jsonb,
  
  -- Notification preferences
  notification_settings jsonb NOT NULL DEFAULT '{
    "notify_on_milestone": true,
    "notify_on_goal_complete": true,
    "notify_mentor_on_inactivity": true,
    "inactivity_threshold_days": 7
  }'::jsonb,
  
  -- Status
  is_active boolean NOT NULL DEFAULT true,
  
  -- Timestamps
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  
  -- Ensure one config per user per team
  CONSTRAINT progress_shares_user_team_unique UNIQUE (user_id, team_id)
);

-- ============================================================================
-- SECTION 2: MILESTONES TABLE
-- ============================================================================

-- Track achievements and milestones for celebration
CREATE TABLE IF NOT EXISTS public.milestones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Owner
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  
  -- Team context (optional - personal milestones don't need team)
  team_id uuid REFERENCES public.teams(id) ON DELETE CASCADE,
  
  -- Milestone details
  milestone_type text NOT NULL CHECK (milestone_type IN (
    'first_application',
    'applications_5',
    'applications_10',
    'applications_25',
    'applications_50',
    'applications_100',
    'first_interview',
    'interviews_5',
    'interviews_10',
    'first_offer',
    'goal_completed',
    'streak_7_days',
    'streak_14_days',
    'streak_30_days',
    'profile_complete',
    'resume_created',
    'cover_letter_created',
    'custom'
  )),
  
  title text NOT NULL,
  description text,
  
  -- Achievement context
  metadata jsonb DEFAULT '{}'::jsonb,
  
  -- When achieved
  achieved_at timestamptz NOT NULL DEFAULT now(),
  
  -- Celebration tracking
  is_celebrated boolean NOT NULL DEFAULT false,
  celebrated_at timestamptz,
  celebrated_by uuid[] DEFAULT ARRAY[]::uuid[],
  
  -- Visibility
  is_shared boolean NOT NULL DEFAULT true,
  
  -- Timestamps
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================================
-- SECTION 3: PROGRESS REPORTS TABLE
-- ============================================================================

-- Store generated progress reports for sharing
CREATE TABLE IF NOT EXISTS public.progress_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Owner
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  
  -- Team context
  team_id uuid NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  
  -- Report type and period
  report_type text NOT NULL CHECK (report_type IN ('weekly', 'monthly', 'custom')),
  period_start date NOT NULL,
  period_end date NOT NULL,
  
  -- Report content
  report_data jsonb NOT NULL DEFAULT '{
    "summary": {},
    "job_stats": {},
    "goal_progress": [],
    "milestones_achieved": [],
    "activity_highlights": [],
    "insights": [],
    "recommendations": []
  }'::jsonb,
  
  -- Generation metadata
  generated_at timestamptz NOT NULL DEFAULT now(),
  generated_by text NOT NULL DEFAULT 'system' CHECK (generated_by IN ('system', 'user', 'mentor')),
  
  -- Sharing status
  is_shared boolean NOT NULL DEFAULT true,
  shared_with uuid[] DEFAULT ARRAY[]::uuid[],
  
  -- View tracking
  view_count integer NOT NULL DEFAULT 0,
  last_viewed_at timestamptz,
  
  -- Timestamps
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================================
-- SECTION 4: ENCOURAGEMENTS TABLE
-- ============================================================================

-- Store encouragement and celebration messages
CREATE TABLE IF NOT EXISTS public.encouragements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Team context
  team_id uuid NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  
  -- Sender and recipient
  sender_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  recipient_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  
  -- Message details
  message_type text NOT NULL CHECK (message_type IN (
    'congratulation',
    'encouragement',
    'milestone_celebration',
    'goal_cheer',
    'motivation',
    'check_in'
  )),
  message_text text NOT NULL,
  
  -- Optional link to related item
  related_milestone_id uuid REFERENCES public.milestones(id) ON DELETE SET NULL,
  related_goal_id uuid REFERENCES public.mentee_goals(id) ON DELETE SET NULL,
  
  -- Reaction (emoji or type)
  reaction_type text,
  
  -- Read status
  is_read boolean NOT NULL DEFAULT false,
  read_at timestamptz,
  
  -- Timestamps
  created_at timestamptz NOT NULL DEFAULT now(),
  
  -- Prevent self-encouragement (though it's technically fine)
  CONSTRAINT encouragements_different_users CHECK (sender_id != recipient_id)
);

-- ============================================================================
-- SECTION 5: ACCOUNTABILITY METRICS TABLE
-- ============================================================================

-- Track accountability partner engagement and effectiveness
CREATE TABLE IF NOT EXISTS public.accountability_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Relationship
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  partner_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  team_id uuid NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  
  -- Engagement metrics
  engagement_stats jsonb NOT NULL DEFAULT '{
    "messages_sent": 0,
    "messages_received": 0,
    "encouragements_sent": 0,
    "encouragements_received": 0,
    "feedback_given": 0,
    "feedback_received": 0,
    "check_ins": 0,
    "milestone_celebrations": 0
  }'::jsonb,
  
  -- Effectiveness tracking
  effectiveness_stats jsonb NOT NULL DEFAULT '{
    "goals_set_by_partner": 0,
    "goals_completed": 0,
    "goals_completion_rate": 0,
    "activity_increase_percent": 0,
    "streak_maintained": 0
  }'::jsonb,
  
  -- Relationship health
  last_interaction_at timestamptz,
  interaction_frequency_days numeric,
  health_score integer CHECK (health_score IS NULL OR (health_score >= 0 AND health_score <= 100)),
  
  -- Period tracking
  period_start date NOT NULL DEFAULT CURRENT_DATE,
  period_end date,
  
  -- Timestamps
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  
  -- One record per user-partner-team relationship
  CONSTRAINT accountability_metrics_unique UNIQUE (user_id, partner_id, team_id)
);

-- ============================================================================
-- SECTION 6: ENABLE RLS
-- ============================================================================

ALTER TABLE public.progress_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.progress_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.encouragements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accountability_metrics ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- SECTION 7: RLS POLICIES
-- ============================================================================

-- Progress Shares Policies
CREATE POLICY "Users can view their own progress shares"
  ON public.progress_shares FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can create their own progress shares"
  ON public.progress_shares FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own progress shares"
  ON public.progress_shares FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Team members can view shared progress settings"
  ON public.progress_shares FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.team_members tm
      WHERE tm.team_id = progress_shares.team_id
        AND tm.user_id = auth.uid()
        AND tm.is_active = true
    )
  );

-- Milestones Policies
CREATE POLICY "Users can view their own milestones"
  ON public.milestones FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can create their own milestones"
  ON public.milestones FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own milestones"
  ON public.milestones FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Team members can view shared milestones"
  ON public.milestones FOR SELECT
  USING (
    is_shared = true
    AND team_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.team_members tm
      WHERE tm.team_id = milestones.team_id
        AND tm.user_id = auth.uid()
        AND tm.is_active = true
    )
  );

-- Progress Reports Policies
CREATE POLICY "Users can view their own reports"
  ON public.progress_reports FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can create their own reports"
  ON public.progress_reports FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Shared recipients can view reports"
  ON public.progress_reports FOR SELECT
  USING (
    is_shared = true
    AND (
      auth.uid() = ANY(shared_with)
      OR EXISTS (
        SELECT 1 FROM public.team_member_assignments tma
        WHERE tma.team_id = progress_reports.team_id
          AND tma.mentor_id = auth.uid()
          AND tma.candidate_id = progress_reports.user_id
          AND tma.is_active = true
      )
    )
  );

-- Encouragements Policies
CREATE POLICY "Users can view encouragements they sent or received"
  ON public.encouragements FOR SELECT
  USING (sender_id = auth.uid() OR recipient_id = auth.uid());

CREATE POLICY "Users can send encouragements"
  ON public.encouragements FOR INSERT
  WITH CHECK (
    sender_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.team_members tm
      WHERE tm.team_id = encouragements.team_id
        AND tm.user_id = auth.uid()
        AND tm.is_active = true
    )
  );

CREATE POLICY "Recipients can update encouragement read status"
  ON public.encouragements FOR UPDATE
  USING (recipient_id = auth.uid())
  WITH CHECK (recipient_id = auth.uid());

-- Accountability Metrics Policies
CREATE POLICY "Users can view their own accountability metrics"
  ON public.accountability_metrics FOR SELECT
  USING (user_id = auth.uid() OR partner_id = auth.uid());

CREATE POLICY "System can insert accountability metrics"
  ON public.accountability_metrics FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "System can update accountability metrics"
  ON public.accountability_metrics FOR UPDATE
  USING (user_id = auth.uid() OR partner_id = auth.uid());

-- ============================================================================
-- SECTION 8: INDEXES
-- ============================================================================

-- Progress Shares
CREATE INDEX idx_progress_shares_user ON public.progress_shares(user_id);
CREATE INDEX idx_progress_shares_team ON public.progress_shares(team_id);

-- Milestones
CREATE INDEX idx_milestones_user ON public.milestones(user_id, achieved_at DESC);
CREATE INDEX idx_milestones_team ON public.milestones(team_id, achieved_at DESC) WHERE team_id IS NOT NULL;
CREATE INDEX idx_milestones_type ON public.milestones(user_id, milestone_type);
CREATE INDEX idx_milestones_uncelebrated ON public.milestones(user_id, is_celebrated) WHERE is_celebrated = false;

-- Progress Reports
CREATE INDEX idx_progress_reports_user ON public.progress_reports(user_id, generated_at DESC);
CREATE INDEX idx_progress_reports_team ON public.progress_reports(team_id, generated_at DESC);
CREATE INDEX idx_progress_reports_period ON public.progress_reports(user_id, period_start, period_end);

-- Encouragements
CREATE INDEX idx_encouragements_recipient ON public.encouragements(recipient_id, created_at DESC);
CREATE INDEX idx_encouragements_sender ON public.encouragements(sender_id, created_at DESC);
CREATE INDEX idx_encouragements_team ON public.encouragements(team_id, created_at DESC);
CREATE INDEX idx_encouragements_unread ON public.encouragements(recipient_id, is_read) WHERE is_read = false;

-- Accountability Metrics
CREATE INDEX idx_accountability_metrics_user ON public.accountability_metrics(user_id);
CREATE INDEX idx_accountability_metrics_partner ON public.accountability_metrics(partner_id);
CREATE INDEX idx_accountability_metrics_team ON public.accountability_metrics(team_id);

-- ============================================================================
-- SECTION 9: TRIGGERS
-- ============================================================================

-- Updated_at trigger for progress_shares
CREATE TRIGGER update_progress_shares_updated_at
  BEFORE UPDATE ON public.progress_shares
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Updated_at trigger for accountability_metrics
CREATE TRIGGER update_accountability_metrics_updated_at
  BEFORE UPDATE ON public.accountability_metrics
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- SECTION 10: HELPER FUNCTIONS
-- ============================================================================

-- Function to check if user can view another user's progress
CREATE OR REPLACE FUNCTION can_view_progress(viewer_id uuid, owner_id uuid, team_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- User can always view their own progress
  IF viewer_id = owner_id THEN
    RETURN true;
  END IF;
  
  -- Check if viewer is in the same team
  IF NOT EXISTS (
    SELECT 1 FROM public.team_members
    WHERE team_id = $3 AND user_id = viewer_id AND is_active = true
  ) THEN
    RETURN false;
  END IF;
  
  -- Check if progress sharing is enabled
  IF EXISTS (
    SELECT 1 FROM public.progress_shares
    WHERE user_id = owner_id AND team_id = $3 AND is_active = true
  ) THEN
    RETURN true;
  END IF;
  
  -- Check if viewer is assigned mentor
  IF EXISTS (
    SELECT 1 FROM public.team_member_assignments
    WHERE mentor_id = viewer_id AND candidate_id = owner_id AND team_id = $3 AND is_active = true
  ) THEN
    RETURN true;
  END IF;
  
  RETURN false;
END;
$$;

-- Function to get user's progress summary for sharing
CREATE OR REPLACE FUNCTION get_progress_summary(p_user_id uuid, p_team_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result jsonb;
  v_share_settings jsonb;
BEGIN
  -- Get share settings
  SELECT share_settings INTO v_share_settings
  FROM public.progress_shares
  WHERE user_id = p_user_id AND team_id = p_team_id AND is_active = true;
  
  -- If no sharing enabled, return minimal info
  IF v_share_settings IS NULL THEN
    RETURN jsonb_build_object('sharing_enabled', false);
  END IF;
  
  -- Build summary based on share settings
  SELECT jsonb_build_object(
    'sharing_enabled', true,
    'job_stats', CASE 
      WHEN (v_share_settings->>'share_job_stats')::boolean THEN (
        SELECT jsonb_build_object(
          'total', COUNT(*),
          'applied', COUNT(*) FILTER (WHERE job_status = 'Applied'),
          'interviewing', COUNT(*) FILTER (WHERE job_status IN ('Interview', 'Phone Screen')),
          'offers', COUNT(*) FILTER (WHERE job_status IN ('Offer', 'Accepted'))
        )
        FROM public.jobs WHERE user_id = p_user_id AND is_archived = false
      )
      ELSE NULL
    END,
    'milestones_count', (
      SELECT COUNT(*) FROM public.milestones 
      WHERE user_id = p_user_id AND team_id = p_team_id AND is_shared = true
    ),
    'recent_milestones', (
      SELECT jsonb_agg(jsonb_build_object(
        'id', id,
        'type', milestone_type,
        'title', title,
        'achieved_at', achieved_at
      ))
      FROM (
        SELECT * FROM public.milestones
        WHERE user_id = p_user_id AND team_id = p_team_id AND is_shared = true
        ORDER BY achieved_at DESC LIMIT 5
      ) sub
    )
  ) INTO v_result;
  
  RETURN v_result;
END;
$$;

-- ============================================================================
-- SECTION 11: COMMENTS
-- ============================================================================

COMMENT ON TABLE public.progress_shares IS 'User privacy settings for sharing job search progress (UC-111)';
COMMENT ON TABLE public.milestones IS 'Track and celebrate user achievements and milestones (UC-111)';
COMMENT ON TABLE public.progress_reports IS 'Generated progress reports for accountability sharing (UC-111)';
COMMENT ON TABLE public.encouragements IS 'Encouragement and celebration messages between team members (UC-111)';
COMMENT ON TABLE public.accountability_metrics IS 'Track accountability partner engagement and effectiveness (UC-111)';
