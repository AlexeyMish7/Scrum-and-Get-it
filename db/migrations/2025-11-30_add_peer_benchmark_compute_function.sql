-- ==========================================
-- Peer Benchmark Computation Function
-- ==========================================
-- Purpose: Compute anonymized peer benchmarks from real user data
-- This aggregates metrics across users while maintaining privacy

-- Function to compute peer benchmarks for a specific segment
CREATE OR REPLACE FUNCTION compute_peer_benchmarks(
  target_industry text,
  target_experience_level text,
  target_title_category text DEFAULT NULL,
  target_region text DEFAULT NULL
)
RETURNS void AS $$
DECLARE
  user_count integer;
  agg_data record;
BEGIN
  -- Aggregate metrics from all users in this segment
  SELECT
    COUNT(DISTINCT p.id) as total_users,
    AVG(user_metrics.apps_per_month) as avg_apps,
    AVG(user_metrics.response_rate) as avg_response,
    AVG(user_metrics.interview_rate) as avg_interview,
    AVG(user_metrics.offer_rate) as avg_offer,
    AVG(user_metrics.time_to_interview) as avg_time_interview,
    AVG(user_metrics.time_to_offer) as avg_time_offer,
    AVG(user_metrics.total_skills) as avg_skills,
    AVG(user_metrics.median_salary) as avg_salary_median
  INTO agg_data
  FROM profiles p
  CROSS JOIN LATERAL (
    SELECT
      -- Applications per month (last 3 months)
      (SELECT COUNT(*) FROM jobs 
       WHERE user_id = p.id 
         AND created_at >= NOW() - INTERVAL '3 months'
      ) / 3.0 as apps_per_month,
      
      -- Response rate
      CASE 
        WHEN (SELECT COUNT(*) FROM jobs WHERE user_id = p.id AND job_status IN ('Applied', 'Phone Screen', 'Interview', 'Offer', 'Rejected')) > 0
        THEN (
          SELECT COUNT(*)::float / NULLIF(
            (SELECT COUNT(*) FROM jobs WHERE user_id = p.id AND job_status IN ('Applied', 'Phone Screen', 'Interview', 'Offer', 'Rejected')),
            0
          )
          FROM jobs 
          WHERE user_id = p.id 
            AND job_status IN ('Phone Screen', 'Interview', 'Offer')
        )
        ELSE 0
      END as response_rate,
      
      -- Interview rate
      CASE 
        WHEN (SELECT COUNT(*) FROM jobs WHERE user_id = p.id AND job_status IN ('Applied', 'Phone Screen', 'Interview', 'Offer', 'Rejected')) > 0
        THEN (
          SELECT COUNT(*)::float / NULLIF(
            (SELECT COUNT(*) FROM jobs WHERE user_id = p.id AND job_status IN ('Applied', 'Phone Screen', 'Interview', 'Offer', 'Rejected')),
            0
          )
          FROM jobs 
          WHERE user_id = p.id 
            AND job_status IN ('Interview', 'Offer')
        )
        ELSE 0
      END as interview_rate,
      
      -- Offer rate
      CASE 
        WHEN (SELECT COUNT(*) FROM jobs WHERE user_id = p.id AND job_status IN ('Applied', 'Phone Screen', 'Interview', 'Offer', 'Rejected')) > 0
        THEN (
          SELECT COUNT(*)::float / NULLIF(
            (SELECT COUNT(*) FROM jobs WHERE user_id = p.id AND job_status IN ('Applied', 'Phone Screen', 'Interview', 'Offer', 'Rejected')),
            0
          )
          FROM jobs 
          WHERE user_id = p.id 
            AND job_status = 'Offer'
        )
        ELSE 0
      END as offer_rate,
      
      -- Time to first interview (days)
      (SELECT AVG(EXTRACT(EPOCH FROM (status_changed_at - created_at)) / 86400)
       FROM jobs 
       WHERE user_id = p.id 
         AND job_status IN ('Interview', 'Offer')
         AND status_changed_at IS NOT NULL
      ) as time_to_interview,
      
      -- Time to offer (days)
      (SELECT AVG(EXTRACT(EPOCH FROM (status_changed_at - created_at)) / 86400)
       FROM jobs 
       WHERE user_id = p.id 
         AND job_status = 'Offer'
         AND status_changed_at IS NOT NULL
      ) as time_to_offer,
      
      -- Total skills
      (SELECT COUNT(*) FROM skills WHERE user_id = p.id) as total_skills,
      
      -- Median salary from jobs
      (SELECT PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY (start_salary_range + end_salary_range) / 2)
       FROM jobs 
       WHERE user_id = p.id 
         AND start_salary_range IS NOT NULL 
         AND end_salary_range IS NOT NULL
      ) as median_salary
      
  ) as user_metrics
  WHERE p.industry = target_industry
    AND (p.experience_level::text = target_experience_level OR target_experience_level IS NULL)
    AND (target_region IS NULL OR p.state = target_region)
    AND EXISTS (SELECT 1 FROM jobs WHERE user_id = p.id LIMIT 1) -- Only users with jobs
  ;

  -- Get count of users in segment
  user_count := agg_data.total_users;

  -- Only create benchmark if we have at least 5 users (privacy threshold)
  IF user_count >= 5 THEN
    -- Aggregate top required skills
    WITH skill_freq AS (
      SELECT 
        UNNEST(j.required_skills) as skill,
        COUNT(*) as frequency
      FROM jobs j
      JOIN profiles p ON j.user_id = p.id
      WHERE p.industry = target_industry
        AND (p.experience_level::text = target_experience_level OR target_experience_level IS NULL)
      GROUP BY skill
      ORDER BY frequency DESC
      LIMIT 20
    )
    SELECT jsonb_agg(jsonb_build_object('skill', skill, 'frequency', frequency))
    INTO agg_data.top_skills
    FROM skill_freq;

    -- Aggregate top missing skills (from analytics cache)
    WITH missing_skills AS (
      SELECT 
        jsonb_array_elements_text(
          COALESCE(ac.data->'skillsGaps', ac.data->'missingSkills', '[]'::jsonb)
        ) as skill,
        COUNT(*) as frequency
      FROM analytics_cache ac
      JOIN profiles p ON ac.user_id = p.id
      WHERE ac.analytics_type = 'document-match-score'
        AND p.industry = target_industry
        AND (p.experience_level::text = target_experience_level OR target_experience_level IS NULL)
      GROUP BY skill
      ORDER BY frequency DESC
      LIMIT 20
    )
    SELECT jsonb_agg(jsonb_build_object('skill', skill, 'frequency', frequency))
    INTO agg_data.top_missing
    FROM missing_skills;

    -- Upsert peer benchmark
    INSERT INTO peer_benchmarks (
      industry,
      experience_level,
      job_title_category,
      region,
      avg_applications_per_month,
      avg_response_rate,
      avg_interview_rate,
      avg_offer_rate,
      avg_time_to_first_interview_days,
      avg_time_to_offer_days,
      top_required_skills,
      top_missing_skills,
      avg_skills_per_profile,
      median_salary,
      sample_size,
      last_computed_at,
      data_quality_score
    ) VALUES (
      target_industry,
      target_experience_level,
      target_title_category,
      target_region,
      COALESCE(agg_data.avg_apps, 0),
      COALESCE(agg_data.avg_response, 0),
      COALESCE(agg_data.avg_interview, 0),
      COALESCE(agg_data.avg_offer, 0),
      COALESCE(agg_data.avg_time_interview, 0),
      COALESCE(agg_data.avg_time_offer, 0),
      COALESCE(agg_data.top_skills, '[]'::jsonb),
      COALESCE(agg_data.top_missing, '[]'::jsonb),
      COALESCE(agg_data.avg_skills, 0),
      COALESCE(agg_data.avg_salary_median, 0),
      user_count,
      NOW(),
      CASE 
        WHEN user_count >= 50 THEN 1.0
        WHEN user_count >= 20 THEN 0.8
        WHEN user_count >= 10 THEN 0.6
        ELSE 0.4
      END
    )
    ON CONFLICT (industry, experience_level, job_title_category, region)
    DO UPDATE SET
      avg_applications_per_month = EXCLUDED.avg_applications_per_month,
      avg_response_rate = EXCLUDED.avg_response_rate,
      avg_interview_rate = EXCLUDED.avg_interview_rate,
      avg_offer_rate = EXCLUDED.avg_offer_rate,
      avg_time_to_first_interview_days = EXCLUDED.avg_time_to_first_interview_days,
      avg_time_to_offer_days = EXCLUDED.avg_time_to_offer_days,
      top_required_skills = EXCLUDED.top_required_skills,
      top_missing_skills = EXCLUDED.top_missing_skills,
      avg_skills_per_profile = EXCLUDED.avg_skills_per_profile,
      median_salary = EXCLUDED.median_salary,
      sample_size = EXCLUDED.sample_size,
      last_computed_at = EXCLUDED.last_computed_at,
      data_quality_score = EXCLUDED.data_quality_score;

    RAISE NOTICE 'Computed peer benchmark for % / % with % users', 
      target_industry, target_experience_level, user_count;
  ELSE
    RAISE NOTICE 'Insufficient users (%) for % / % - need at least 5 for privacy', 
      user_count, target_industry, target_experience_level;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to compute all peer benchmarks (run nightly via cron)
CREATE OR REPLACE FUNCTION compute_all_peer_benchmarks()
RETURNS void AS $$
DECLARE
  segment record;
BEGIN
  -- Compute benchmarks for each industry/experience_level combination
  FOR segment IN 
    SELECT DISTINCT 
      p.industry,
      p.experience_level::text as experience_level
    FROM profiles p
    WHERE p.industry IS NOT NULL
      AND p.experience_level IS NOT NULL
      AND EXISTS (SELECT 1 FROM jobs WHERE user_id = p.id LIMIT 1)
  LOOP
    PERFORM compute_peer_benchmarks(
      segment.industry,
      segment.experience_level,
      NULL,
      NULL
    );
  END LOOP;

  RAISE NOTICE 'Completed computing all peer benchmarks';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION compute_peer_benchmarks(text, text, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION compute_all_peer_benchmarks() TO authenticated;

-- Example usage:
-- SELECT compute_peer_benchmarks('Software', 'mid', NULL, NULL);
-- SELECT compute_all_peer_benchmarks();

COMMENT ON FUNCTION compute_peer_benchmarks IS 'Compute anonymized peer benchmarks for a specific segment (requires 5+ users for privacy)';
COMMENT ON FUNCTION compute_all_peer_benchmarks IS 'Compute benchmarks for all industry/experience combinations - run nightly via cron';
