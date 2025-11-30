-- ==========================================
-- Competitive Benchmarking & Market Positioning Schema
-- ==========================================
-- Purpose: Store anonymized peer data, industry benchmarks, skill comparisons,
-- and career progression patterns for competitive analysis

-- ==========================================
-- 1. Peer Benchmarks (Anonymized Aggregate Data)
-- ==========================================

-- Store aggregated metrics across users for benchmarking
CREATE TABLE IF NOT EXISTS public.peer_benchmarks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Segmentation dimensions
  industry text NOT NULL,
  experience_level text CHECK (experience_level IN ('entry', 'mid', 'senior', 'executive')),
  job_title_category text,  -- "Software Engineer", "Product Manager", etc (normalized titles)
  region text,  -- Geographic region for localized benchmarks
  
  -- Job search metrics (aggregated across peers)
  avg_applications_per_month numeric,
  avg_response_rate numeric,  -- percentage (0-1)
  avg_interview_rate numeric,  -- percentage (0-1)
  avg_offer_rate numeric,  -- percentage (0-1)
  avg_time_to_first_interview_days numeric,
  avg_time_to_offer_days numeric,
  
  -- Skill metrics
  top_required_skills jsonb DEFAULT '[]'::jsonb,  -- [{skill: string, frequency: number}]
  top_missing_skills jsonb DEFAULT '[]'::jsonb,  -- Most common gaps
  avg_skills_per_profile numeric,
  
  -- Compensation data
  avg_salary_min numeric,
  avg_salary_max numeric,
  median_salary numeric,
  
  -- Sample size and data quality
  sample_size integer NOT NULL DEFAULT 0,  -- How many users in this segment
  last_computed_at timestamptz DEFAULT now(),
  data_quality_score numeric CHECK (data_quality_score >= 0 AND data_quality_score <= 1),
  
  -- Metadata
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  -- Unique constraint: one benchmark per segment
  CONSTRAINT unique_peer_benchmark UNIQUE (industry, experience_level, job_title_category, region)
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_peer_benchmarks_lookup 
  ON public.peer_benchmarks(industry, experience_level, job_title_category, region);

-- RLS: Peer benchmarks are readable by all authenticated users (anonymized data)
ALTER TABLE public.peer_benchmarks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "peer_benchmarks_read_all" ON public.peer_benchmarks;
CREATE POLICY "peer_benchmarks_read_all"
  ON public.peer_benchmarks
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Only system/admin can insert/update (computed by backend job)
DROP POLICY IF EXISTS "peer_benchmarks_admin_only" ON public.peer_benchmarks;
CREATE POLICY "peer_benchmarks_admin_only"
  ON public.peer_benchmarks
  FOR ALL
  USING (false)  -- No direct user modifications
  WITH CHECK (false);

-- ==========================================
-- 2. Industry Standards (Curated Reference Data)
-- ==========================================

-- Store curated industry standard metrics from external sources
CREATE TABLE IF NOT EXISTS public.industry_standards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Industry classification
  industry text NOT NULL UNIQUE,
  
  -- Standard metrics (from labor statistics, reports, etc)
  standard_applications_per_month numeric,  -- Industry average application volume
  standard_response_rate numeric,
  standard_interview_rate numeric,
  standard_offer_rate numeric,
  standard_time_to_hire_days numeric,
  
  -- Salary benchmarks by level
  salary_benchmarks jsonb DEFAULT '{}'::jsonb,  
  -- {
  --   "entry": {"min": 50000, "max": 70000, "median": 60000},
  --   "mid": {"min": 70000, "max": 100000, "median": 85000},
  --   "senior": {"min": 100000, "max": 150000, "median": 125000}
  -- }
  
  -- Common skills by level
  required_skills_by_level jsonb DEFAULT '{}'::jsonb,
  -- {
  --   "entry": ["JavaScript", "React", "Git"],
  --   "mid": ["JavaScript", "React", "Node.js", "AWS", "Team Leadership"],
  --   "senior": ["Architecture", "System Design", "Team Management", "Strategic Planning"]
  -- }
  
  -- Career progression data
  typical_promotion_timeline jsonb DEFAULT '{}'::jsonb,
  -- {
  --   "entry_to_mid": {"months": 24, "variance": 6},
  --   "mid_to_senior": {"months": 36, "variance": 12}
  -- }
  
  -- Data source and confidence
  data_source text,  -- "Bureau of Labor Statistics", "Glassdoor", "LinkedIn", etc
  confidence_level text CHECK (confidence_level IN ('high', 'medium', 'low')),
  last_updated_at timestamptz DEFAULT now(),
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- RLS: Industry standards readable by all authenticated users
ALTER TABLE public.industry_standards ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "industry_standards_read_all" ON public.industry_standards;
CREATE POLICY "industry_standards_read_all"
  ON public.industry_standards
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "industry_standards_admin_only" ON public.industry_standards;
CREATE POLICY "industry_standards_admin_only"
  ON public.industry_standards
  FOR ALL
  USING (false)
  WITH CHECK (false);

-- ==========================================
-- 3. Career Progression Patterns
-- ==========================================

-- Track common career paths and progression patterns
CREATE TABLE IF NOT EXISTS public.career_progression_patterns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Pattern definition
  from_title text NOT NULL,
  to_title text NOT NULL,
  industry text NOT NULL,
  
  -- Typical timeline
  avg_months_to_transition numeric,
  min_months numeric,
  max_months numeric,
  
  -- Skills typically acquired during transition
  skills_acquired jsonb DEFAULT '[]'::jsonb,  -- [string]
  
  -- Common intermediary steps
  intermediary_roles jsonb DEFAULT '[]'::jsonb,  -- [string]
  
  -- Success factors
  success_factors jsonb DEFAULT '[]'::jsonb,  
  -- [
  --   "Led team of 5+",
  --   "Delivered 3+ major projects",
  --   "Acquired cloud certifications"
  -- ]
  
  -- Statistics
  sample_size integer DEFAULT 0,
  success_rate numeric,  -- percentage who successfully made this transition
  
  -- Metadata
  data_source text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  CONSTRAINT unique_career_path UNIQUE (from_title, to_title, industry)
);

CREATE INDEX IF NOT EXISTS idx_career_progression_from 
  ON public.career_progression_patterns(from_title, industry);

-- RLS: Career patterns readable by all authenticated users
ALTER TABLE public.career_progression_patterns ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "career_patterns_read_all" ON public.career_progression_patterns;
CREATE POLICY "career_patterns_read_all"
  ON public.career_progression_patterns
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "career_patterns_admin_only" ON public.career_progression_patterns;
CREATE POLICY "career_patterns_admin_only"
  ON public.career_progression_patterns
  FOR ALL
  USING (false)
  WITH CHECK (false);

-- ==========================================
-- 4. User Competitive Positioning (Cached)
-- ==========================================

-- Cache user's competitive positioning analysis
CREATE TABLE IF NOT EXISTS public.user_competitive_position (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  
  -- User's segment
  industry text NOT NULL,
  experience_level text,
  job_title_category text,
  
  -- Percentile rankings (0-100)
  application_volume_percentile numeric,
  response_rate_percentile numeric,
  interview_rate_percentile numeric,
  offer_rate_percentile numeric,
  skills_depth_percentile numeric,  -- Number of skills relative to peers
  skills_relevance_percentile numeric,  -- How relevant skills are to target roles
  
  -- Comparison to peer benchmark
  vs_peer_application_rate numeric,  -- User rate vs peer avg (ratio)
  vs_peer_response_rate numeric,
  vs_peer_interview_rate numeric,
  vs_peer_offer_rate numeric,
  
  -- Comparison to industry standard
  vs_industry_standard jsonb DEFAULT '{}'::jsonb,
  -- {
  --   "response_rate": {"user": 0.25, "standard": 0.20, "delta": 0.05},
  --   "interview_rate": {"user": 0.15, "standard": 0.12, "delta": 0.03}
  -- }
  
  -- Competitive strengths and gaps
  competitive_strengths jsonb DEFAULT '[]'::jsonb,  -- [string]
  competitive_gaps jsonb DEFAULT '[]'::jsonb,  -- [string]
  differentiation_factors jsonb DEFAULT '[]'::jsonb,  -- [string]
  
  -- Recommendations
  positioning_recommendations jsonb DEFAULT '[]'::jsonb,
  -- [
  --   {"type": "skill", "action": "Learn AWS", "impact": "high", "reason": "Required by 80% of target roles"},
  --   {"type": "strategy", "action": "Apply to mid-sized companies", "impact": "medium", "reason": "Higher success rate in this segment"}
  -- ]
  
  -- Cache metadata
  generated_at timestamptz DEFAULT now(),
  expires_at timestamptz DEFAULT (now() + interval '7 days'),
  profile_version text,  -- Invalidate when profile changes
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  -- One active analysis per user
  CONSTRAINT unique_user_position UNIQUE (user_id)
);

CREATE INDEX IF NOT EXISTS idx_user_position_expiry 
  ON public.user_competitive_position(user_id, expires_at);

-- RLS: Users can only see their own positioning
ALTER TABLE public.user_competitive_position ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_position_select_own" ON public.user_competitive_position;
CREATE POLICY "user_position_select_own"
  ON public.user_competitive_position
  FOR SELECT
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "user_position_insert_own" ON public.user_competitive_position;
CREATE POLICY "user_position_insert_own"
  ON public.user_competitive_position
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "user_position_update_own" ON public.user_competitive_position;
CREATE POLICY "user_position_update_own"
  ON public.user_competitive_position
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "user_position_delete_own" ON public.user_competitive_position;
CREATE POLICY "user_position_delete_own"
  ON public.user_competitive_position
  FOR DELETE
  USING (user_id = auth.uid());

-- ==========================================
-- 5. Auto-update triggers
-- ==========================================

CREATE OR REPLACE FUNCTION update_competitive_benchmarking_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_peer_benchmarks_timestamp ON public.peer_benchmarks;
CREATE TRIGGER update_peer_benchmarks_timestamp
  BEFORE UPDATE ON public.peer_benchmarks
  FOR EACH ROW
  EXECUTE FUNCTION update_competitive_benchmarking_timestamp();

DROP TRIGGER IF EXISTS update_industry_standards_timestamp ON public.industry_standards;
CREATE TRIGGER update_industry_standards_timestamp
  BEFORE UPDATE ON public.industry_standards
  FOR EACH ROW
  EXECUTE FUNCTION update_competitive_benchmarking_timestamp();

DROP TRIGGER IF EXISTS update_career_patterns_timestamp ON public.career_progression_patterns;
CREATE TRIGGER update_career_patterns_timestamp
  BEFORE UPDATE ON public.career_progression_patterns
  FOR EACH ROW
  EXECUTE FUNCTION update_competitive_benchmarking_timestamp();

DROP TRIGGER IF EXISTS update_user_position_timestamp ON public.user_competitive_position;
CREATE TRIGGER update_user_position_timestamp
  BEFORE UPDATE ON public.user_competitive_position
  FOR EACH ROW
  EXECUTE FUNCTION update_competitive_benchmarking_timestamp();

-- ==========================================
-- 6. Add missing column if needed
-- ==========================================

-- Add standard_applications_per_month column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'industry_standards' 
      AND column_name = 'standard_applications_per_month'
  ) THEN
    ALTER TABLE public.industry_standards 
    ADD COLUMN standard_applications_per_month numeric;
  END IF;
END $$;

-- ==========================================
-- 7. Seed initial industry standards
-- ==========================================

-- Clear existing data and insert fresh
DELETE FROM public.industry_standards WHERE industry IN ('Software', 'Finance', 'Healthcare', 'Education', 'Marketing');

INSERT INTO public.industry_standards (industry, standard_applications_per_month, standard_response_rate, standard_interview_rate, standard_offer_rate, standard_time_to_hire_days, salary_benchmarks, required_skills_by_level, data_source, confidence_level)
VALUES 
  (
    'Software',
    12.5,  -- Average 12-13 applications per month
    0.22,
    0.15,
    0.08,
    45,
    '{"entry": {"min": 60000, "max": 90000, "median": 75000}, "mid": {"min": 90000, "max": 130000, "median": 110000}, "senior": {"min": 130000, "max": 180000, "median": 155000}, "executive": {"min": 180000, "max": 300000, "median": 240000}}'::jsonb,
    '{"entry": ["JavaScript", "React", "Git", "SQL", "REST APIs"], "mid": ["JavaScript", "React", "Node.js", "AWS", "System Design", "Team Collaboration"], "senior": ["Architecture", "System Design", "Team Leadership", "Strategic Planning", "Microservices", "Cloud Infrastructure"], "executive": ["C-Suite Communication", "Strategic Vision", "Product Strategy", "Team Building", "Budget Management"]}'::jsonb,
    'Aggregated Labor Data',
    'high'
  ),
  (
    'Finance',
    9.0,  -- Average 8-10 applications per month
    0.18,
    0.12,
    0.06,
    60,
    '{"entry": {"min": 55000, "max": 75000, "median": 65000}, "mid": {"min": 75000, "max": 110000, "median": 92000}, "senior": {"min": 110000, "max": 160000, "median": 135000}, "executive": {"min": 160000, "max": 350000, "median": 255000}}'::jsonb,
    '{"entry": ["Excel", "Financial Modeling", "Accounting", "Analysis"], "mid": ["Financial Analysis", "Risk Management", "Compliance", "Team Leadership"], "senior": ["Strategic Planning", "Portfolio Management", "Regulatory Knowledge", "Stakeholder Management"], "executive": ["Corporate Strategy", "M&A", "Board Relations", "Capital Markets"]}'::jsonb,
    'Aggregated Labor Data',
    'high'
  ),
  (
    'Healthcare',
    10.5,  -- Average 10-11 applications per month
    0.20,
    0.14,
    0.07,
    50,
    '{"entry": {"min": 45000, "max": 65000, "median": 55000}, "mid": {"min": 65000, "max": 95000, "median": 80000}, "senior": {"min": 95000, "max": 140000, "median": 117000}, "executive": {"min": 140000, "max": 280000, "median": 210000}}'::jsonb,
    '{"entry": ["Patient Care", "Medical Terminology", "EMR Systems", "Communication"], "mid": ["Clinical Management", "Quality Assurance", "Team Coordination", "Compliance"], "senior": ["Operations Management", "Healthcare Policy", "Strategic Planning", "Budget Management"], "executive": ["Healthcare Strategy", "P&L Management", "Regulatory Affairs", "Board Governance"]}'::jsonb,
    'Aggregated Labor Data',
    'high'
  ),
  (
    'Education',
    7.0,  -- Average 6-8 applications per month
    0.16,
    0.10,
    0.05,
    70,
    '{"entry": {"min": 40000, "max": 55000, "median": 47500}, "mid": {"min": 55000, "max": 75000, "median": 65000}, "senior": {"min": 75000, "max": 110000, "median": 92500}, "executive": {"min": 110000, "max": 180000, "median": 145000}}'::jsonb,
    '{"entry": ["Curriculum Development", "Classroom Management", "Assessment", "Communication"], "mid": ["Leadership", "Program Development", "Mentoring", "Technology Integration"], "senior": ["Strategic Planning", "Budget Management", "Policy Development", "Stakeholder Relations"], "executive": ["District Strategy", "Board Relations", "Community Engagement", "Fundraising"]}'::jsonb,
    'Aggregated Labor Data',
    'medium'
  ),
  (
    'Marketing',
    11.0,  -- Average 10-12 applications per month
    0.20,
    0.13,
    0.07,
    55,
    '{"entry": {"min": 45000, "max": 65000, "median": 55000}, "mid": {"min": 65000, "max": 95000, "median": 80000}, "senior": {"min": 95000, "max": 145000, "median": 120000}, "executive": {"min": 145000, "max": 280000, "median": 212000}}'::jsonb,
    '{"entry": ["Social Media", "Content Creation", "Analytics", "SEO"], "mid": ["Campaign Management", "Data Analysis", "Team Leadership", "Budget Management"], "senior": ["Strategic Planning", "Brand Management", "Multi-channel Marketing", "Stakeholder Management"], "executive": ["Growth Strategy", "Brand Vision", "P&L Management", "Executive Leadership"]}'::jsonb,
    'Aggregated Labor Data',
    'high'
  );

-- ==========================================
-- 8. Seed career progression patterns
-- ==========================================

-- Clear existing patterns and insert fresh
DELETE FROM public.career_progression_patterns;

INSERT INTO public.career_progression_patterns (from_title, to_title, industry, avg_months_to_transition, min_months, max_months, skills_acquired, success_factors, sample_size, success_rate, data_source)
VALUES
  (
    'Junior Software Engineer',
    'Software Engineer',
    'Software',
    18,
    12,
    24,
    '["Advanced JavaScript", "System Design Basics", "Code Review", "Mentoring Junior Developers"]'::jsonb,
    '["Delivered 3+ production features", "Led 1+ small projects", "Received positive performance reviews", "Demonstrated technical ownership"]'::jsonb,
    1250,
    0.85,
    'Aggregated Career Data'
  ),
  (
    'Software Engineer',
    'Senior Software Engineer',
    'Software',
    36,
    24,
    48,
    '["Architecture Patterns", "Team Leadership", "System Design", "Performance Optimization", "Cloud Infrastructure"]'::jsonb,
    '["Led major project initiatives", "Mentored 2+ junior engineers", "Drove technical decisions", "Improved system performance metrics"]'::jsonb,
    980,
    0.72,
    'Aggregated Career Data'
  ),
  (
    'Senior Software Engineer',
    'Staff Software Engineer',
    'Software',
    48,
    36,
    72,
    '["Cross-team Collaboration", "Technical Strategy", "Architecture Design", "Stakeholder Management"]'::jsonb,
    '["Influenced org-wide technical decisions", "Led cross-functional initiatives", "Established technical standards", "Mentored senior engineers"]'::jsonb,
    420,
    0.58,
    'Aggregated Career Data'
  ),
  (
    'Financial Analyst',
    'Senior Financial Analyst',
    'Finance',
    30,
    24,
    42,
    '["Advanced Financial Modeling", "Risk Assessment", "Presentation Skills", "Team Leadership"]'::jsonb,
    '["Managed complex financial models", "Led quarterly reporting", "Presented to senior leadership", "Improved forecasting accuracy"]'::jsonb,
    680,
    0.78,
    'Aggregated Career Data'
  ),
  (
    'Marketing Coordinator',
    'Marketing Manager',
    'Marketing',
    30,
    24,
    42,
    '["Campaign Strategy", "Budget Management", "Team Leadership", "Data Analytics"]'::jsonb,
    '["Led successful campaigns", "Managed marketing budget", "Built team of 2-3", "Improved conversion metrics"]'::jsonb,
    550,
    0.70,
    'Aggregated Career Data'
  );

-- ==========================================
-- 9. Helper function to get user's competitive position
-- ==========================================

CREATE OR REPLACE FUNCTION get_user_competitive_position(target_user_id uuid)
RETURNS TABLE (
  percentile_data jsonb,
  peer_comparison jsonb,
  industry_comparison jsonb,
  strengths jsonb,
  gaps jsonb,
  recommendations jsonb
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    jsonb_build_object(
      'application_volume', ucp.application_volume_percentile,
      'response_rate', ucp.response_rate_percentile,
      'interview_rate', ucp.interview_rate_percentile,
      'offer_rate', ucp.offer_rate_percentile,
      'skills_depth', ucp.skills_depth_percentile,
      'skills_relevance', ucp.skills_relevance_percentile
    ) as percentile_data,
    jsonb_build_object(
      'application_rate', ucp.vs_peer_application_rate,
      'response_rate', ucp.vs_peer_response_rate,
      'interview_rate', ucp.vs_peer_interview_rate,
      'offer_rate', ucp.vs_peer_offer_rate
    ) as peer_comparison,
    ucp.vs_industry_standard as industry_comparison,
    ucp.competitive_strengths as strengths,
    ucp.competitive_gaps as gaps,
    ucp.positioning_recommendations as recommendations
  FROM public.user_competitive_position ucp
  WHERE ucp.user_id = target_user_id
    AND ucp.expires_at > now()
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION get_user_competitive_position(uuid) TO authenticated;

-- ==========================================
-- COMMENTS
-- ==========================================

COMMENT ON TABLE public.peer_benchmarks IS 'Anonymized aggregate metrics across user segments for peer comparison';
COMMENT ON TABLE public.industry_standards IS 'Curated industry benchmark data from external sources (labor stats, reports)';
COMMENT ON TABLE public.career_progression_patterns IS 'Common career paths and typical progression timelines';
COMMENT ON TABLE public.user_competitive_position IS 'Cached competitive positioning analysis for individual users';

COMMENT ON FUNCTION get_user_competitive_position(uuid) IS 'Retrieve user''s competitive positioning analysis with percentiles, comparisons, and recommendations';
