-- =====================================================================
-- GOAL SETTING AND ACHIEVEMENT TRACKING
-- Sprint 3 - UC-101: Career goal management with SMART criteria
-- =====================================================================
-- Purpose: Create career_goals table for tracking user's career objectives
-- Features:
--   - SMART goal framework (Specific, Measurable, Achievable, Relevant, Time-bound)
--   - Short-term and long-term goal categories
--   - Milestone tracking with celebration features
--   - Progress measurement against target metrics
--   - Accountability and progress sharing options
--   - Goal impact tracking on job search success
-- =====================================================================

-- Create goal status enum
DO $$ BEGIN
  CREATE TYPE goal_status_enum AS ENUM (
    'active',
    'completed',
    'paused',
    'cancelled',
    'archived'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create goal category enum
DO $$ BEGIN
  CREATE TYPE goal_category_enum AS ENUM (
    'application_volume',
    'interview_success',
    'skill_development',
    'networking',
    'salary_target',
    'career_advancement',
    'work_life_balance',
    'custom'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create goal timeframe enum
DO $$ BEGIN
  CREATE TYPE goal_timeframe_enum AS ENUM (
    'short_term',
    'medium_term',
    'long_term'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create career_goals table
CREATE TABLE IF NOT EXISTS public.career_goals (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  
  -- SMART Goal Definition
  title text NOT NULL,
  description text,
  category goal_category_enum NOT NULL DEFAULT 'custom',
  timeframe goal_timeframe_enum NOT NULL DEFAULT 'short_term',
  
  -- Measurable Metrics
  target_value numeric NOT NULL,
  current_value numeric NOT NULL DEFAULT 0,
  unit text NOT NULL DEFAULT 'count',
  
  -- Time-bound
  start_date date NOT NULL DEFAULT CURRENT_DATE,
  target_date date NOT NULL,
  
  -- Status Tracking
  status goal_status_enum NOT NULL DEFAULT 'active',
  completion_date date,
  
  -- Milestones (JSONB array)
  milestones jsonb DEFAULT '[]'::jsonb,
  
  -- Progress Notes
  notes text,
  
  -- Accountability Features
  is_shared boolean NOT NULL DEFAULT false,
  shared_with jsonb DEFAULT '[]'::jsonb,
  reminder_frequency text CHECK (reminder_frequency IN ('daily', 'weekly', 'biweekly', 'monthly', 'none')) DEFAULT 'weekly',
  last_reminder_sent timestamp with time zone,
  
  -- Impact Tracking
  linked_job_ids bigint[] DEFAULT ARRAY[]::bigint[],
  success_metrics jsonb DEFAULT '{}'::jsonb,
  
  -- Metadata
  motivation_notes text,
  obstacles text,
  support_needed text,
  
  -- Celebration & Achievements
  achievements jsonb DEFAULT '[]'::jsonb,
  celebration_message text,
  
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  
  CONSTRAINT career_goals_pkey PRIMARY KEY (id),
  CONSTRAINT career_goals_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE,
  CONSTRAINT career_goals_target_value_positive CHECK (target_value > 0),
  CONSTRAINT career_goals_current_value_non_negative CHECK (current_value >= 0),
  CONSTRAINT career_goals_target_date_after_start CHECK (target_date >= start_date)
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_career_goals_user_id ON public.career_goals(user_id);
CREATE INDEX IF NOT EXISTS idx_career_goals_status ON public.career_goals(user_id, status) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_career_goals_category ON public.career_goals(user_id, category);
CREATE INDEX IF NOT EXISTS idx_career_goals_target_date ON public.career_goals(user_id, target_date) WHERE status = 'active';

-- Enable RLS
ALTER TABLE public.career_goals ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own goals" ON public.career_goals;
DROP POLICY IF EXISTS "Users can insert their own goals" ON public.career_goals;
DROP POLICY IF EXISTS "Users can update their own goals" ON public.career_goals;
DROP POLICY IF EXISTS "Users can delete their own goals" ON public.career_goals;

-- RLS Policies
CREATE POLICY "Users can view their own goals"
  ON public.career_goals FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own goals"
  ON public.career_goals FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own goals"
  ON public.career_goals FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own goals"
  ON public.career_goals FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_career_goals_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS career_goals_updated_at_trigger ON public.career_goals;

CREATE TRIGGER career_goals_updated_at_trigger
  BEFORE UPDATE ON public.career_goals
  FOR EACH ROW
  EXECUTE FUNCTION update_career_goals_updated_at();

-- Function to calculate goal progress percentage
CREATE OR REPLACE FUNCTION get_goal_progress(goal_id uuid)
RETURNS numeric AS $$
DECLARE
  goal_record RECORD;
  progress numeric;
BEGIN
  SELECT current_value, target_value INTO goal_record
  FROM career_goals
  WHERE id = goal_id;
  
  IF goal_record.target_value = 0 THEN
    RETURN 0;
  END IF;
  
  progress := (goal_record.current_value / goal_record.target_value) * 100;
  
  -- Cap at 100%
  IF progress > 100 THEN
    progress := 100;
  END IF;
  
  RETURN ROUND(progress, 2);
END;
$$ LANGUAGE plpgsql;

-- Function to get active goals summary for user
CREATE OR REPLACE FUNCTION get_active_goals_summary(p_user_id uuid)
RETURNS TABLE(
  total_active integer,
  on_track integer,
  behind_schedule integer,
  completed_this_month integer,
  avg_progress numeric
) AS $$
BEGIN
  RETURN QUERY
  WITH goal_stats AS (
    SELECT
      COUNT(*) FILTER (WHERE status = 'active') as total,
      COUNT(*) FILTER (
        WHERE status = 'active' 
        AND (current_value / NULLIF(target_value, 0)) >= 
            EXTRACT(EPOCH FROM (CURRENT_DATE - start_date)) / 
            NULLIF(EXTRACT(EPOCH FROM (target_date - start_date)), 0)
      ) as on_track_count,
      COUNT(*) FILTER (
        WHERE status = 'active'
        AND (current_value / NULLIF(target_value, 0)) < 
            EXTRACT(EPOCH FROM (CURRENT_DATE - start_date)) / 
            NULLIF(EXTRACT(EPOCH FROM (target_date - start_date)), 0)
      ) as behind_count,
      COUNT(*) FILTER (
        WHERE status = 'completed'
        AND completion_date >= DATE_TRUNC('month', CURRENT_DATE)
      ) as completed_month,
      AVG(current_value / NULLIF(target_value, 0) * 100) FILTER (WHERE status = 'active') as avg_prog
    FROM career_goals
    WHERE user_id = p_user_id
  )
  SELECT
    COALESCE(total::integer, 0),
    COALESCE(on_track_count::integer, 0),
    COALESCE(behind_count::integer, 0),
    COALESCE(completed_month::integer, 0),
    COALESCE(ROUND(avg_prog, 2), 0)
  FROM goal_stats;
END;
$$ LANGUAGE plpgsql;

-- Add comments for documentation
COMMENT ON TABLE public.career_goals IS 'User career goals with SMART framework and milestone tracking';
COMMENT ON COLUMN public.career_goals.milestones IS 'Array of milestone objects: [{"title": "...", "target": number, "completed": boolean, "completed_at": timestamp}]';
COMMENT ON COLUMN public.career_goals.shared_with IS 'Array of user IDs or email addresses with whom goal is shared for accountability';
COMMENT ON COLUMN public.career_goals.success_metrics IS 'Impact metrics: {"applications_sent": number, "interviews_scheduled": number, "offers_received": number}';
COMMENT ON COLUMN public.career_goals.achievements IS 'Array of achievement objects: [{"milestone": "...", "achieved_at": timestamp, "message": "..."}]';

-- Sample data structure for milestones JSONB:
-- [
--   {
--     "id": "milestone-1",
--     "title": "Complete 10 applications",
--     "target_value": 10,
--     "completed": false,
--     "completed_at": null
--   },
--   {
--     "id": "milestone-2",
--     "title": "Complete 25 applications",
--     "target_value": 25,
--     "completed": true,
--     "completed_at": "2025-11-20T10:00:00Z"
--   }
-- ]

-- Sample data structure for achievements JSONB:
-- [
--   {
--     "milestone": "First milestone completed!",
--     "achieved_at": "2025-11-20T10:00:00Z",
--     "message": "You reached 10 applications! Keep up the great work!",
--     "progress_at_achievement": 40
--   }
-- ]
