-- ============================================================================
-- PROGRESS SNAPSHOT AUTO-GENERATION FUNCTION (UC-111)
-- ============================================================================
-- Purpose: PostgreSQL function to automatically generate weekly progress
-- snapshots for all team members. This enables hands-free tracking of
-- progress over time.
--
-- Features:
-- - Calculates job application metrics from the jobs table
-- - Tracks interviews scheduled and completed
-- - Counts offers received
-- - Calculates activity streaks
-- - Generates trends by comparing to previous snapshot
--
-- Usage: Call this function via a scheduled job (cron) or on-demand:
--   SELECT * FROM generate_weekly_progress_snapshots('team-uuid-here');
--
-- Returns: Number of snapshots created
-- ============================================================================

-- Function to generate a progress snapshot for a single user
CREATE OR REPLACE FUNCTION generate_progress_snapshot(
  p_user_id UUID,
  p_team_id UUID,
  p_period_type TEXT DEFAULT 'weekly'
)
RETURNS UUID AS $$
DECLARE
  v_snapshot_id UUID;
  v_period_start DATE;
  v_period_end DATE;
  v_apps_total INTEGER;
  v_apps_this_period INTEGER;
  v_apps_by_status JSONB;
  v_interviews_scheduled INTEGER;
  v_interviews_completed INTEGER;
  v_interviews_this_period INTEGER;
  v_offers_received INTEGER;
  v_offers_this_period INTEGER;
  v_goals_total INTEGER;
  v_goals_completed INTEGER;
  v_goals_rate NUMERIC;
  v_activity_score INTEGER;
  v_streak_days INTEGER;
  v_apps_trend NUMERIC;
  v_interviews_trend NUMERIC;
  v_activity_trend NUMERIC;
  v_previous_snapshot RECORD;
  v_daily_breakdown JSONB;
BEGIN
  -- Calculate period bounds based on period type
  CASE p_period_type
    WHEN 'daily' THEN
      v_period_start := CURRENT_DATE;
      v_period_end := CURRENT_DATE;
    WHEN 'weekly' THEN
      -- Start from Monday of current week
      v_period_start := date_trunc('week', CURRENT_DATE)::DATE;
      v_period_end := v_period_start + INTERVAL '6 days';
    WHEN 'monthly' THEN
      v_period_start := date_trunc('month', CURRENT_DATE)::DATE;
      v_period_end := (date_trunc('month', CURRENT_DATE) + INTERVAL '1 month - 1 day')::DATE;
    ELSE
      RAISE EXCEPTION 'Invalid period_type: %. Must be daily, weekly, or monthly.', p_period_type;
  END CASE;

  -- Get total applications
  SELECT COUNT(*) INTO v_apps_total
  FROM jobs
  WHERE user_id = p_user_id;

  -- Get applications submitted this period
  SELECT COUNT(*) INTO v_apps_this_period
  FROM jobs
  WHERE user_id = p_user_id
    AND created_at::DATE >= v_period_start
    AND created_at::DATE <= v_period_end;

  -- Get applications by status
  SELECT jsonb_object_agg(COALESCE(status, 'unknown'), cnt)
  INTO v_apps_by_status
  FROM (
    SELECT status, COUNT(*) as cnt
    FROM jobs
    WHERE user_id = p_user_id
    GROUP BY status
  ) sub;

  -- Default to empty object if null
  v_apps_by_status := COALESCE(v_apps_by_status, '{}'::JSONB);

  -- Get interviews scheduled (status = 'interviewing' or has interview scheduled)
  SELECT COUNT(*) INTO v_interviews_scheduled
  FROM jobs
  WHERE user_id = p_user_id
    AND status = 'interviewing';

  -- Get interviews completed this period (approximation based on status changes)
  SELECT COUNT(*) INTO v_interviews_completed
  FROM jobs
  WHERE user_id = p_user_id
    AND status IN ('offer', 'rejected')
    AND updated_at::DATE >= v_period_start
    AND updated_at::DATE <= v_period_end;

  -- Interviews this period
  v_interviews_this_period := v_interviews_completed;

  -- Get offers received
  SELECT COUNT(*) INTO v_offers_received
  FROM jobs
  WHERE user_id = p_user_id
    AND status = 'offer';

  -- Offers this period
  SELECT COUNT(*) INTO v_offers_this_period
  FROM jobs
  WHERE user_id = p_user_id
    AND status = 'offer'
    AND updated_at::DATE >= v_period_start
    AND updated_at::DATE <= v_period_end;

  -- Get goals (from mentor_goals if that table exists)
  BEGIN
    SELECT COUNT(*), COUNT(*) FILTER (WHERE status = 'completed')
    INTO v_goals_total, v_goals_completed
    FROM mentor_goals
    WHERE candidate_id = p_user_id;
  EXCEPTION WHEN undefined_table THEN
    v_goals_total := 0;
    v_goals_completed := 0;
  END;

  -- Calculate goals completion rate
  IF v_goals_total > 0 THEN
    v_goals_rate := (v_goals_completed::NUMERIC / v_goals_total) * 100;
  ELSE
    v_goals_rate := 0;
  END IF;

  -- Calculate activity score (0-100)
  -- Based on: recent applications, interviews, and consistent activity
  v_activity_score := LEAST(100, (
    (v_apps_this_period * 10) +  -- 10 points per application
    (v_interviews_this_period * 20) +  -- 20 points per interview
    (v_offers_this_period * 30)  -- 30 points per offer
  ));

  -- Calculate streak days (consecutive days with activity)
  WITH daily_activity AS (
    SELECT DISTINCT created_at::DATE as activity_date
    FROM jobs
    WHERE user_id = p_user_id
    ORDER BY activity_date DESC
  ),
  streak_calc AS (
    SELECT
      activity_date,
      ROW_NUMBER() OVER (ORDER BY activity_date DESC) as rn,
      activity_date - (ROW_NUMBER() OVER (ORDER BY activity_date DESC))::INTEGER as streak_group
    FROM daily_activity
    WHERE activity_date >= CURRENT_DATE - 30  -- Look back 30 days max
  )
  SELECT COUNT(*)
  INTO v_streak_days
  FROM streak_calc
  WHERE streak_group = (
    SELECT streak_group FROM streak_calc WHERE rn = 1
  );

  v_streak_days := COALESCE(v_streak_days, 0);

  -- Get previous snapshot for trend calculation
  SELECT *
  INTO v_previous_snapshot
  FROM progress_snapshots
  WHERE user_id = p_user_id
    AND team_id = p_team_id
    AND period_type = p_period_type
  ORDER BY snapshot_date DESC
  LIMIT 1;

  -- Calculate trends (percentage change from previous period)
  IF v_previous_snapshot.id IS NOT NULL THEN
    -- Applications trend
    IF v_previous_snapshot.applications_this_period > 0 THEN
      v_apps_trend := ((v_apps_this_period - v_previous_snapshot.applications_this_period)::NUMERIC
                       / v_previous_snapshot.applications_this_period) * 100;
    ELSE
      v_apps_trend := CASE WHEN v_apps_this_period > 0 THEN 100 ELSE 0 END;
    END IF;

    -- Interviews trend
    IF v_previous_snapshot.interviews_this_period > 0 THEN
      v_interviews_trend := ((v_interviews_this_period - v_previous_snapshot.interviews_this_period)::NUMERIC
                             / v_previous_snapshot.interviews_this_period) * 100;
    ELSE
      v_interviews_trend := CASE WHEN v_interviews_this_period > 0 THEN 100 ELSE 0 END;
    END IF;

    -- Activity trend
    IF v_previous_snapshot.activity_score > 0 THEN
      v_activity_trend := ((v_activity_score - v_previous_snapshot.activity_score)::NUMERIC
                           / v_previous_snapshot.activity_score) * 100;
    ELSE
      v_activity_trend := CASE WHEN v_activity_score > 0 THEN 100 ELSE 0 END;
    END IF;
  ELSE
    v_apps_trend := 0;
    v_interviews_trend := 0;
    v_activity_trend := 0;
  END IF;

  -- Build daily breakdown for the period
  SELECT jsonb_agg(jsonb_build_object(
    'date', day_date::TEXT,
    'applications', COALESCE(apps, 0),
    'interviews', 0  -- Could be enhanced with interview tracking
  ) ORDER BY day_date)
  INTO v_daily_breakdown
  FROM (
    SELECT d::DATE as day_date
    FROM generate_series(v_period_start, LEAST(v_period_end, CURRENT_DATE), '1 day') d
  ) days
  LEFT JOIN (
    SELECT created_at::DATE as app_date, COUNT(*) as apps
    FROM jobs
    WHERE user_id = p_user_id
      AND created_at::DATE >= v_period_start
      AND created_at::DATE <= LEAST(v_period_end, CURRENT_DATE)
    GROUP BY created_at::DATE
  ) app_counts ON days.day_date = app_counts.app_date;

  v_daily_breakdown := COALESCE(v_daily_breakdown, '[]'::JSONB);

  -- Insert the snapshot
  INSERT INTO progress_snapshots (
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
    activity_score,
    streak_days,
    applications_trend,
    interviews_trend,
    activity_trend,
    daily_breakdown
  ) VALUES (
    p_user_id,
    p_team_id,
    CURRENT_DATE,
    p_period_type,
    v_period_start,
    v_period_end,
    v_apps_total,
    v_apps_this_period,
    v_apps_by_status,
    v_interviews_scheduled,
    v_interviews_completed,
    v_interviews_this_period,
    v_offers_received,
    v_offers_this_period,
    v_goals_total,
    v_goals_completed,
    v_goals_rate,
    v_activity_score,
    v_streak_days,
    v_apps_trend,
    v_interviews_trend,
    v_activity_trend,
    v_daily_breakdown
  )
  RETURNING id INTO v_snapshot_id;

  RETURN v_snapshot_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to generate weekly snapshots for all team members
CREATE OR REPLACE FUNCTION generate_weekly_progress_snapshots(p_team_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_member RECORD;
  v_count INTEGER := 0;
BEGIN
  -- Loop through all active team members
  FOR v_member IN
    SELECT user_id
    FROM team_members
    WHERE team_id = p_team_id
      AND status = 'active'
  LOOP
    BEGIN
      -- Generate snapshot for this member
      PERFORM generate_progress_snapshot(v_member.user_id, p_team_id, 'weekly');
      v_count := v_count + 1;
    EXCEPTION WHEN OTHERS THEN
      -- Log error but continue with other members
      RAISE WARNING 'Failed to generate snapshot for user %: %', v_member.user_id, SQLERRM;
    END;
  END LOOP;

  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION generate_progress_snapshot TO authenticated;
GRANT EXECUTE ON FUNCTION generate_weekly_progress_snapshots TO authenticated;

-- Add helpful comments
COMMENT ON FUNCTION generate_progress_snapshot IS
  'Generates a progress snapshot for a single user. Called manually or via the team-wide function.';

COMMENT ON FUNCTION generate_weekly_progress_snapshots IS
  'Generates weekly progress snapshots for all active members of a team. Can be scheduled via cron.';
