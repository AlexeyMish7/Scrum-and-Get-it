-- ============================================================================
-- Migration: Add Mentee Job Data Functions
-- Purpose: Enable mentors to view their assigned candidates' job data
-- Why: RLS on jobs table prevents mentors from accessing candidate job data
--      These SECURITY DEFINER functions bypass RLS after verifying assignment
-- Date: 2025-11-26
-- ============================================================================

-- Function: get_mentee_job_stats
-- Get job application statistics for an assigned mentee
-- Only returns data if the caller is the mentor for this candidate
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION get_mentee_job_stats(
  p_mentor_id uuid,
  p_candidate_id uuid
)
RETURNS TABLE (
  total_jobs integer,
  applied_count integer,
  interviewing_count integer,
  offer_count integer,
  rejected_count integer
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Verify the mentor-candidate relationship exists and is active
  IF NOT EXISTS (
    SELECT 1 FROM public.team_member_assignments
    WHERE mentor_id = p_mentor_id
      AND candidate_id = p_candidate_id
      AND is_active = true
  ) THEN
    -- Return zeros if no valid assignment
    RETURN QUERY SELECT 0::integer, 0::integer, 0::integer, 0::integer, 0::integer;
    RETURN;
  END IF;

  -- Return job statistics for the candidate
  RETURN QUERY
  SELECT
    COUNT(*)::integer AS total_jobs,
    COUNT(*) FILTER (WHERE job_status IN ('Applied', 'Interested'))::integer AS applied_count,
    COUNT(*) FILTER (WHERE job_status IN ('Interview', 'Phone Screen'))::integer AS interviewing_count,
    COUNT(*) FILTER (WHERE job_status IN ('Offer', 'Accepted'))::integer AS offer_count,
    COUNT(*) FILTER (WHERE job_status IN ('Rejected', 'Declined'))::integer AS rejected_count
  FROM public.jobs
  WHERE user_id = p_candidate_id;
END;
$$;

COMMENT ON FUNCTION get_mentee_job_stats IS 'Get job statistics for a mentee - mentor only';


-- Function: get_mentee_recent_jobs
-- Get recent job applications for an assigned mentee
-- Only returns data if the caller is the mentor for this candidate
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION get_mentee_recent_jobs(
  p_mentor_id uuid,
  p_candidate_id uuid,
  p_limit integer DEFAULT 15
)
RETURNS TABLE (
  job_id bigint,
  title text,
  company_name text,
  job_status text,
  created_at timestamp with time zone,
  updated_at timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Verify the mentor-candidate relationship exists and is active
  IF NOT EXISTS (
    SELECT 1 FROM public.team_member_assignments
    WHERE mentor_id = p_mentor_id
      AND candidate_id = p_candidate_id
      AND is_active = true
  ) THEN
    -- Return empty if no valid assignment
    RETURN;
  END IF;

  -- Return recent jobs for the candidate
  -- Note: jobs table uses job_title column, not title
  RETURN QUERY
  SELECT
    j.id AS job_id,
    j.job_title AS title,
    j.company_name,
    j.job_status::text,
    j.created_at,
    j.updated_at
  FROM public.jobs j
  WHERE j.user_id = p_candidate_id
  ORDER BY j.updated_at DESC
  LIMIT p_limit;
END;
$$;

COMMENT ON FUNCTION get_mentee_recent_jobs IS 'Get recent job applications for a mentee - mentor only';


-- Function: get_mentee_activity_summary
-- Get activity summary for an assigned mentee (last 7 days)
-- Combines jobs, documents, and goals data
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION get_mentee_activity_summary(
  p_mentor_id uuid,
  p_candidate_id uuid
)
RETURNS TABLE (
  jobs_created_7d integer,
  jobs_updated_7d integer,
  documents_updated_7d integer,
  goals_completed_7d integer,
  last_activity_at timestamp with time zone,
  engagement_level text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_jobs_created integer;
  v_jobs_updated integer;
  v_docs_updated integer;
  v_goals_completed integer;
  v_last_activity timestamp with time zone;
  v_engagement text;
  v_seven_days_ago timestamp with time zone := now() - interval '7 days';
BEGIN
  -- Verify the mentor-candidate relationship exists and is active
  IF NOT EXISTS (
    SELECT 1 FROM public.team_member_assignments
    WHERE mentor_id = p_mentor_id
      AND candidate_id = p_candidate_id
      AND is_active = true
  ) THEN
    RETURN QUERY SELECT 0::integer, 0::integer, 0::integer, 0::integer, NULL::timestamp with time zone, 'unknown'::text;
    RETURN;
  END IF;

  -- Count jobs created in last 7 days
  SELECT COUNT(*)::integer INTO v_jobs_created
  FROM public.jobs
  WHERE user_id = p_candidate_id
    AND created_at >= v_seven_days_ago;

  -- Count jobs updated (but not created) in last 7 days
  SELECT COUNT(*)::integer INTO v_jobs_updated
  FROM public.jobs
  WHERE user_id = p_candidate_id
    AND updated_at >= v_seven_days_ago
    AND updated_at != created_at;

  -- Count documents updated in last 7 days
  SELECT COUNT(*)::integer INTO v_docs_updated
  FROM public.document_versions
  WHERE user_id = p_candidate_id
    AND created_at >= v_seven_days_ago;

  -- Count goals completed in last 7 days
  SELECT COUNT(*)::integer INTO v_goals_completed
  FROM public.mentee_goals
  WHERE candidate_id = p_candidate_id
    AND completed_at >= v_seven_days_ago;

  -- Find most recent activity
  SELECT MAX(activity_time) INTO v_last_activity
  FROM (
    SELECT MAX(updated_at) AS activity_time FROM public.jobs WHERE user_id = p_candidate_id
    UNION ALL
    SELECT MAX(created_at) FROM public.document_versions WHERE user_id = p_candidate_id
    UNION ALL
    SELECT MAX(completed_at) FROM public.mentee_goals WHERE candidate_id = p_candidate_id
  ) activities;

  -- Calculate engagement level based on 7-day activity
  DECLARE
    v_total_activities integer := v_jobs_created + v_jobs_updated + v_docs_updated + v_goals_completed;
  BEGIN
    IF v_total_activities >= 10 THEN
      v_engagement := 'high';
    ELSIF v_total_activities >= 4 THEN
      v_engagement := 'moderate';
    ELSIF v_total_activities >= 1 THEN
      v_engagement := 'low';
    ELSE
      v_engagement := 'inactive';
    END IF;
  END;

  RETURN QUERY SELECT v_jobs_created, v_jobs_updated, v_docs_updated, v_goals_completed, v_last_activity, v_engagement;
END;
$$;

COMMENT ON FUNCTION get_mentee_activity_summary IS 'Get 7-day activity summary for a mentee - mentor only';


-- Function: get_mentee_documents
-- Get document versions (resumes, cover letters) for an assigned mentee
-- Only returns data if the caller is the mentor for this candidate
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION get_mentee_documents(
  p_mentor_id uuid,
  p_candidate_id uuid,
  p_team_id uuid
)
RETURNS TABLE (
  document_id uuid,
  title text,
  document_type text,
  version_number integer,
  created_at timestamp with time zone,
  updated_at timestamp with time zone,
  job_id bigint,
  job_title text,
  company_name text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Verify the mentor-candidate relationship exists and is active
  IF NOT EXISTS (
    SELECT 1 FROM public.team_member_assignments
    WHERE mentor_id = p_mentor_id
      AND candidate_id = p_candidate_id
      AND team_id = p_team_id
      AND is_active = true
  ) THEN
    -- Return empty if no valid assignment
    RETURN;
  END IF;

  -- Return document versions for the candidate
  RETURN QUERY
  SELECT
    dv.id AS document_id,
    dv.name AS title,
    d.type AS document_type,
    dv.version_number,
    dv.created_at,
    dv.created_at AS updated_at,
    dv.job_id,
    j.job_title AS job_title,
    j.company_name
  FROM public.document_versions dv
  JOIN public.documents d ON d.id = dv.document_id
  LEFT JOIN public.jobs j ON dv.job_id = j.id
  WHERE dv.user_id = p_candidate_id
    AND d.type IN ('resume', 'cover-letter')
  ORDER BY dv.created_at DESC
  LIMIT 50;
END;
$$;

COMMENT ON FUNCTION get_mentee_documents IS 'Get resume and cover letter documents for a mentee - mentor only';


-- Function: get_mentee_profile_summary
-- Get a summary of a mentee's profile for mentor viewing
-- Only returns data if the caller is the mentor for this candidate
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION get_mentee_profile_summary(
  p_mentor_id uuid,
  p_candidate_id uuid
)
RETURNS TABLE (
  candidate_id uuid,
  full_name text,
  email text,
  professional_title text,
  experience_level text,
  industry text,
  city text,
  state text,
  skill_count integer,
  employment_count integer,
  education_count integer,
  project_count integer,
  certification_count integer
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Verify the mentor-candidate relationship exists and is active
  IF NOT EXISTS (
    SELECT 1 FROM public.team_member_assignments
    WHERE mentor_id = p_mentor_id
      AND candidate_id = p_candidate_id
      AND is_active = true
  ) THEN
    -- Return empty if no valid assignment
    RETURN;
  END IF;

  -- Return profile summary for the candidate
  RETURN QUERY
  SELECT
    p.id AS candidate_id,
    p.full_name,
    p.email,
    p.professional_title,
    p.experience_level::text,
    p.industry,
    p.city,
    p.state,
    (SELECT COUNT(*)::integer FROM public.skills WHERE user_id = p_candidate_id) AS skill_count,
    (SELECT COUNT(*)::integer FROM public.employment WHERE user_id = p_candidate_id) AS employment_count,
    (SELECT COUNT(*)::integer FROM public.education WHERE user_id = p_candidate_id) AS education_count,
    (SELECT COUNT(*)::integer FROM public.projects WHERE user_id = p_candidate_id) AS project_count,
    (SELECT COUNT(*)::integer FROM public.certifications WHERE user_id = p_candidate_id) AS certification_count
  FROM public.profiles p
  WHERE p.id = p_candidate_id;
END;
$$;

COMMENT ON FUNCTION get_mentee_profile_summary IS 'Get profile summary for a mentee - mentor only';


-- Function: get_mentee_skills
-- Get all skills for an assigned mentee
-- Only returns data if the caller is the mentor for this candidate
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION get_mentee_skills(
  p_mentor_id uuid,
  p_candidate_id uuid
)
RETURNS TABLE (
  skill_id uuid,
  skill_name text,
  proficiency_level text,
  skill_category text,
  years_of_experience numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Verify the mentor-candidate relationship exists and is active
  IF NOT EXISTS (
    SELECT 1 FROM public.team_member_assignments
    WHERE mentor_id = p_mentor_id
      AND candidate_id = p_candidate_id
      AND is_active = true
  ) THEN
    RETURN;
  END IF;

  -- Return skills for the candidate
  RETURN QUERY
  SELECT
    s.id AS skill_id,
    s.skill_name,
    s.proficiency_level::text,
    s.skill_category,
    s.years_of_experience
  FROM public.skills s
  WHERE s.user_id = p_candidate_id
  ORDER BY s.proficiency_level DESC, s.skill_name;
END;
$$;

COMMENT ON FUNCTION get_mentee_skills IS 'Get skills for a mentee - mentor only';


-- Function: get_mentee_employment
-- Get employment history for an assigned mentee
-- Only returns data if the caller is the mentor for this candidate
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION get_mentee_employment(
  p_mentor_id uuid,
  p_candidate_id uuid
)
RETURNS TABLE (
  employment_id uuid,
  job_title text,
  company_name text,
  location text,
  start_date date,
  end_date date,
  current_position boolean,
  job_description text,
  achievements text[]
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Verify the mentor-candidate relationship exists and is active
  IF NOT EXISTS (
    SELECT 1 FROM public.team_member_assignments
    WHERE mentor_id = p_mentor_id
      AND candidate_id = p_candidate_id
      AND is_active = true
  ) THEN
    RETURN;
  END IF;

  -- Return employment history for the candidate
  RETURN QUERY
  SELECT
    e.id AS employment_id,
    e.job_title,
    e.company_name,
    e.location,
    e.start_date,
    e.end_date,
    e.current_position,
    e.job_description,
    e.achievements
  FROM public.employment e
  WHERE e.user_id = p_candidate_id
  ORDER BY e.start_date DESC;
END;
$$;

COMMENT ON FUNCTION get_mentee_employment IS 'Get employment history for a mentee - mentor only';
