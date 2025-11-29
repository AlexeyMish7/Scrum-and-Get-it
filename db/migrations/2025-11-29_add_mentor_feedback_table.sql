/**
 * MENTOR FEEDBACK TABLE
 *
 * Purpose: Store feedback from mentors to their assigned candidates
 * Used by UC-109: Mentor Dashboard and Coaching Tools
 *
 * Allows mentors to:
 * - Provide feedback on applications and interview prep
 * - Track coaching recommendations and follow-ups
 * - Record general coaching notes and observations
 */

-- ============================================================================
-- MENTOR FEEDBACK TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.mentor_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Relationships
  team_id uuid NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  mentor_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  candidate_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,

  -- Feedback content
  feedback_type text NOT NULL CHECK (feedback_type IN ('application', 'interview', 'resume', 'cover_letter', 'general', 'goal', 'milestone')),
  feedback_text text NOT NULL,

  -- Optional context (links feedback to specific items)
  related_job_id bigint REFERENCES public.jobs(id) ON DELETE SET NULL,
  related_document_id uuid REFERENCES public.document_versions(id) ON DELETE SET NULL,

  -- Status tracking
  is_read boolean NOT NULL DEFAULT false,
  read_at timestamptz,

  -- Timestamps
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.mentor_feedback ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

-- Mentors can create feedback for their assigned candidates
CREATE POLICY "Mentors can create feedback for assigned candidates"
  ON public.mentor_feedback FOR INSERT
  WITH CHECK (
    mentor_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.team_member_assignments tma
      WHERE tma.mentor_id = auth.uid()
        AND tma.candidate_id = mentor_feedback.candidate_id
        AND tma.team_id = mentor_feedback.team_id
        AND tma.is_active = true
    )
  );

-- Mentors can view feedback they created
CREATE POLICY "Mentors can view their own feedback"
  ON public.mentor_feedback FOR SELECT
  USING (mentor_id = auth.uid());

-- Candidates can view feedback written for them
CREATE POLICY "Candidates can view feedback about them"
  ON public.mentor_feedback FOR SELECT
  USING (candidate_id = auth.uid());

-- Team admins can view all feedback in their teams
CREATE POLICY "Admins can view all team feedback"
  ON public.mentor_feedback FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.team_members tm
      WHERE tm.team_id = mentor_feedback.team_id
        AND tm.user_id = auth.uid()
        AND tm.role = 'admin'
        AND tm.is_active = true
    )
  );

-- Mentors can update their own feedback
CREATE POLICY "Mentors can update their own feedback"
  ON public.mentor_feedback FOR UPDATE
  USING (mentor_id = auth.uid());

-- Candidates can mark feedback as read
CREATE POLICY "Candidates can mark feedback as read"
  ON public.mentor_feedback FOR UPDATE
  USING (candidate_id = auth.uid())
  WITH CHECK (candidate_id = auth.uid());

-- Mentors can delete their own feedback
CREATE POLICY "Mentors can delete their own feedback"
  ON public.mentor_feedback FOR DELETE
  USING (mentor_id = auth.uid());

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Index for mentor's feedback list
CREATE INDEX idx_mentor_feedback_mentor ON public.mentor_feedback(mentor_id, created_at DESC);

-- Index for candidate's feedback list
CREATE INDEX idx_mentor_feedback_candidate ON public.mentor_feedback(candidate_id, created_at DESC);

-- Index for team feedback
CREATE INDEX idx_mentor_feedback_team ON public.mentor_feedback(team_id, created_at DESC);

-- Index for unread feedback (candidates checking for new feedback)
CREATE INDEX idx_mentor_feedback_unread ON public.mentor_feedback(candidate_id, is_read) WHERE is_read = false;

-- ============================================================================
-- UPDATED_AT TRIGGER
-- ============================================================================

CREATE TRIGGER update_mentor_feedback_updated_at
  BEFORE UPDATE ON public.mentor_feedback
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- MENTEE GOALS TABLE (for tracking candidate goals)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.mentee_goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Relationships
  team_id uuid NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  candidate_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  mentor_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL, -- Optional: mentor who set the goal

  -- Goal details
  goal_type text NOT NULL CHECK (goal_type IN ('weekly_applications', 'monthly_applications', 'interview_prep', 'resume_update', 'networking', 'skill_development', 'custom')),
  title text NOT NULL,
  description text,
  target_value integer, -- e.g., "Apply to 10 jobs this week"
  current_value integer NOT NULL DEFAULT 0,

  -- Deadline tracking
  start_date date NOT NULL DEFAULT CURRENT_DATE,
  due_date date,

  -- Status
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'missed', 'cancelled')),
  completed_at timestamptz,

  -- Timestamps
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.mentee_goals ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- MENTEE GOALS RLS POLICIES
-- ============================================================================

-- Candidates can view their own goals
CREATE POLICY "Candidates can view their own goals"
  ON public.mentee_goals FOR SELECT
  USING (candidate_id = auth.uid());

-- Mentors can view goals for their assigned candidates
CREATE POLICY "Mentors can view assigned candidate goals"
  ON public.mentee_goals FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.team_member_assignments tma
      WHERE tma.mentor_id = auth.uid()
        AND tma.candidate_id = mentee_goals.candidate_id
        AND tma.team_id = mentee_goals.team_id
        AND tma.is_active = true
    )
  );

-- Team admins can view all goals in their teams
CREATE POLICY "Admins can view all team goals"
  ON public.mentee_goals FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.team_members tm
      WHERE tm.team_id = mentee_goals.team_id
        AND tm.user_id = auth.uid()
        AND tm.role = 'admin'
        AND tm.is_active = true
    )
  );

-- Mentors can create goals for assigned candidates
CREATE POLICY "Mentors can create goals for assigned candidates"
  ON public.mentee_goals FOR INSERT
  WITH CHECK (
    mentor_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.team_member_assignments tma
      WHERE tma.mentor_id = auth.uid()
        AND tma.candidate_id = mentee_goals.candidate_id
        AND tma.team_id = mentee_goals.team_id
        AND tma.is_active = true
    )
  );

-- Candidates can create their own goals
CREATE POLICY "Candidates can create their own goals"
  ON public.mentee_goals FOR INSERT
  WITH CHECK (candidate_id = auth.uid());

-- Candidates can update their own goals (progress tracking)
CREATE POLICY "Candidates can update their own goals"
  ON public.mentee_goals FOR UPDATE
  USING (candidate_id = auth.uid());

-- Mentors can update goals for assigned candidates
CREATE POLICY "Mentors can update assigned candidate goals"
  ON public.mentee_goals FOR UPDATE
  USING (
    mentor_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.team_member_assignments tma
      WHERE tma.mentor_id = auth.uid()
        AND tma.candidate_id = mentee_goals.candidate_id
        AND tma.team_id = mentee_goals.team_id
        AND tma.is_active = true
    )
  );

-- ============================================================================
-- MENTEE GOALS INDEXES
-- ============================================================================

CREATE INDEX idx_mentee_goals_candidate ON public.mentee_goals(candidate_id, status, created_at DESC);
CREATE INDEX idx_mentee_goals_team ON public.mentee_goals(team_id, created_at DESC);
CREATE INDEX idx_mentee_goals_due_date ON public.mentee_goals(due_date) WHERE status = 'active';

-- Updated at trigger
CREATE TRIGGER update_mentee_goals_updated_at
  BEFORE UPDATE ON public.mentee_goals
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE public.mentor_feedback IS 'Stores feedback from mentors to candidates for coaching and guidance (UC-109)';
COMMENT ON TABLE public.mentee_goals IS 'Tracks goals and milestones for candidates with optional mentor oversight (UC-109)';
