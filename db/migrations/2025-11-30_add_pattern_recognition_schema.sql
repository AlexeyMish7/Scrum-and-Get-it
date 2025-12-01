-- ==========================================
-- Pattern Recognition Analysis Schema
-- ==========================================
-- Purpose: Track and analyze patterns in successful applications, interviews, and offers
-- to identify optimal strategies and predict future success

-- ==========================================
-- 1. Success Patterns Table
-- ==========================================

-- Store identified patterns from successful job applications
CREATE TABLE IF NOT EXISTS public.success_patterns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  
  -- Pattern classification
  pattern_type text NOT NULL CHECK (pattern_type IN (
    'application_success',
    'interview_success', 
    'offer_success',
    'timing_pattern',
    'preparation_correlation',
    'strategy_effectiveness',
    'market_condition'
  )),
  pattern_name text NOT NULL,
  pattern_description text,
  
  -- Pattern characteristics
  success_rate numeric CHECK (success_rate >= 0 AND success_rate <= 1),
  confidence_score numeric CHECK (confidence_score >= 0 AND confidence_score <= 1),
  sample_size integer DEFAULT 0,
  
  -- Pattern data and insights
  pattern_attributes jsonb DEFAULT '{}'::jsonb,
  -- {
  --   "company_size": "mid",
  --   "industry": "Software",
  --   "job_level": "senior",
  --   "application_method": "referral",
  --   "day_of_week": "Tuesday",
  --   "time_of_day": "morning"
  -- }
  
  correlation_factors jsonb DEFAULT '[]'::jsonb,
  -- [
  --   {"factor": "resume_tailoring", "correlation": 0.85, "impact": "high"},
  --   {"factor": "cover_letter", "correlation": 0.72, "impact": "medium"}
  -- ]
  
  success_metrics jsonb DEFAULT '{}'::jsonb,
  -- {
  --   "avg_time_to_response_days": 5.2,
  --   "avg_time_to_interview_days": 12.4,
  --   "avg_time_to_offer_days": 28.6,
  --   "response_rate": 0.45,
  --   "interview_rate": 0.32,
  --   "offer_rate": 0.18
  -- }
  
  -- Recommendations based on pattern
  recommendations jsonb DEFAULT '[]'::jsonb,
  -- [
  --   {
  --     "action": "Apply on Tuesday mornings",
  --     "reason": "35% higher response rate observed",
  --     "priority": "high",
  --     "expected_impact": 0.35
  --   }
  -- ]
  
  -- Temporal tracking
  first_observed_at timestamptz,
  last_observed_at timestamptz,
  observation_count integer DEFAULT 1,
  
  -- Pattern evolution
  trend_direction text CHECK (trend_direction IN ('improving', 'stable', 'declining', 'emerging')),
  historical_performance jsonb DEFAULT '[]'::jsonb,
  -- [
  --   {"period": "2025-Q1", "success_rate": 0.25},
  --   {"period": "2025-Q2", "success_rate": 0.30},
  --   {"period": "2025-Q3", "success_rate": 0.35}
  -- ]
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  CONSTRAINT unique_user_pattern UNIQUE (user_id, pattern_type, pattern_name)
);

CREATE INDEX IF NOT EXISTS idx_success_patterns_user 
  ON public.success_patterns(user_id, pattern_type);

CREATE INDEX IF NOT EXISTS idx_success_patterns_confidence 
  ON public.success_patterns(user_id, confidence_score DESC);

-- ==========================================
-- 2. Preparation Activities Table
-- ==========================================

-- Track preparation activities and their correlation with outcomes
CREATE TABLE IF NOT EXISTS public.preparation_activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  job_id bigint REFERENCES public.jobs(id) ON DELETE CASCADE,
  
  -- Activity details
  activity_type text NOT NULL CHECK (activity_type IN (
    'resume_tailoring',
    'cover_letter_writing',
    'company_research',
    'skills_practice',
    'interview_prep',
    'networking',
    'portfolio_update',
    'certification',
    'project_completion',
    'mock_interview',
    'salary_research'
  )),
  
  activity_description text,
  time_spent_minutes integer,
  completion_quality text CHECK (completion_quality IN ('basic', 'thorough', 'exceptional')),
  
  -- Timing relative to application
  days_before_application integer,
  activity_date timestamptz DEFAULT now(),
  
  -- Outcome correlation (filled after job outcome known)
  led_to_response boolean,
  led_to_interview boolean,
  led_to_offer boolean,
  
  -- Activity metadata
  tools_used text[],
  resources_consulted text[],
  notes text,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_prep_activities_user_job 
  ON public.preparation_activities(user_id, job_id);

CREATE INDEX IF NOT EXISTS idx_prep_activities_type 
  ON public.preparation_activities(user_id, activity_type);

CREATE INDEX IF NOT EXISTS idx_prep_activities_outcome 
  ON public.preparation_activities(user_id, led_to_offer);

-- ==========================================
-- 3. Timing Analysis Table
-- ==========================================

-- Track optimal timing patterns for career moves
CREATE TABLE IF NOT EXISTS public.timing_patterns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  
  -- Timing dimension
  timing_type text NOT NULL CHECK (timing_type IN (
    'day_of_week',
    'time_of_day',
    'month_of_year',
    'season',
    'market_cycle',
    'personal_cycle'
  )),
  timing_value text NOT NULL,
  
  -- Success metrics for this timing
  applications_count integer DEFAULT 0,
  response_count integer DEFAULT 0,
  interview_count integer DEFAULT 0,
  offer_count integer DEFAULT 0,
  
  response_rate numeric,
  interview_rate numeric,
  offer_rate numeric,
  
  avg_time_to_response_days numeric,
  avg_time_to_offer_days numeric,
  
  -- Comparison to user's overall average
  relative_performance numeric,  -- 1.0 = average, 1.5 = 50% better, 0.8 = 20% worse
  
  -- Statistical significance
  confidence_level numeric CHECK (confidence_level >= 0 AND confidence_level <= 1),
  sample_size integer DEFAULT 0,
  
  -- Recommendations
  is_optimal boolean DEFAULT false,
  recommendation_strength text CHECK (recommendation_strength IN ('strong', 'moderate', 'weak')),
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  CONSTRAINT unique_user_timing UNIQUE (user_id, timing_type, timing_value)
);

CREATE INDEX IF NOT EXISTS idx_timing_patterns_user 
  ON public.timing_patterns(user_id, is_optimal);

-- ==========================================
-- 4. Strategy Effectiveness Table
-- ==========================================

-- Track effectiveness of different strategies across market conditions
CREATE TABLE IF NOT EXISTS public.strategy_effectiveness (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  
  -- Strategy details
  strategy_name text NOT NULL,
  strategy_type text CHECK (strategy_type IN (
    'application_approach',
    'networking_method',
    'skill_highlighting',
    'company_targeting',
    'compensation_negotiation',
    'interview_technique',
    'follow_up_method'
  )),
  strategy_description text,
  
  -- Market conditions when applied
  market_condition text CHECK (market_condition IN (
    'strong_hiring',
    'moderate_hiring',
    'slow_hiring',
    'recession',
    'recovery',
    'boom'
  )),
  industry_condition text,
  date_range_start timestamptz,
  date_range_end timestamptz,
  
  -- Effectiveness metrics
  times_used integer DEFAULT 0,
  success_count integer DEFAULT 0,
  success_rate numeric,
  
  avg_time_to_success_days numeric,
  roi_score numeric,  -- Return on investment (success / effort)
  
  -- Performance by outcome stage
  response_rate numeric,
  interview_rate numeric,
  offer_rate numeric,
  acceptance_rate numeric,
  
  -- Comparison metrics
  vs_other_strategies numeric,  -- Performance relative to user's other strategies
  vs_market_average numeric,     -- Performance relative to market benchmarks
  
  -- Strategy evolution
  effectiveness_trend text CHECK (effectiveness_trend IN ('improving', 'stable', 'declining')),
  last_used_at timestamptz,
  
  -- Recommendations
  recommended_use_cases jsonb DEFAULT '[]'::jsonb,
  -- [
  --   "When targeting mid-size companies",
  --   "During Q1 hiring season",
  --   "For senior-level positions"
  -- ]
  
  optimization_suggestions jsonb DEFAULT '[]'::jsonb,
  -- [
  --   {
  --     "suggestion": "Combine with networking outreach",
  --     "expected_improvement": 0.25
  --   }
  -- ]
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  CONSTRAINT unique_user_strategy_market UNIQUE (user_id, strategy_name, market_condition)
);

CREATE INDEX IF NOT EXISTS idx_strategy_effectiveness_user 
  ON public.strategy_effectiveness(user_id, success_rate DESC);

CREATE INDEX IF NOT EXISTS idx_strategy_effectiveness_market 
  ON public.strategy_effectiveness(market_condition, success_rate DESC);

-- ==========================================
-- 5. Predictive Models Table
-- ==========================================

-- Store predictive models for future opportunity success
CREATE TABLE IF NOT EXISTS public.predictive_models (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  
  -- Model metadata
  model_type text NOT NULL CHECK (model_type IN (
    'success_probability',
    'time_to_offer',
    'optimal_timing',
    'strategy_recommendation',
    'skill_impact',
    'market_opportunity'
  )),
  model_version text DEFAULT '1.0',
  
  -- Model parameters and features
  features_used jsonb DEFAULT '[]'::jsonb,
  -- [
  --   "response_rate_history",
  --   "preparation_thoroughness",
  --   "company_size_match",
  --   "skill_alignment",
  --   "timing_optimization"
  -- ]
  
  feature_importance jsonb DEFAULT '{}'::jsonb,
  -- {
  --   "response_rate_history": 0.35,
  --   "skill_alignment": 0.28,
  --   "preparation_thoroughness": 0.20,
  --   "timing_optimization": 0.17
  -- }
  
  -- Model performance metrics
  accuracy_score numeric CHECK (accuracy_score >= 0 AND accuracy_score <= 1),
  precision_score numeric,
  recall_score numeric,
  f1_score numeric,
  
  training_sample_size integer DEFAULT 0,
  validation_sample_size integer DEFAULT 0,
  
  -- Model predictions
  predictions jsonb DEFAULT '{}'::jsonb,
  -- {
  --   "next_application_success_probability": 0.68,
  --   "estimated_time_to_offer_days": 32,
  --   "optimal_application_day": "Tuesday",
  --   "recommended_strategy": "targeted_networking"
  -- }
  
  -- Confidence and reliability
  confidence_intervals jsonb DEFAULT '{}'::jsonb,
  model_reliability_score numeric CHECK (model_reliability_score >= 0 AND model_reliability_score <= 1),
  
  -- Model lifecycle
  trained_at timestamptz DEFAULT now(),
  last_updated_at timestamptz DEFAULT now(),
  next_retrain_at timestamptz,
  
  is_active boolean DEFAULT true,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  CONSTRAINT unique_user_model UNIQUE (user_id, model_type)
);

CREATE INDEX IF NOT EXISTS idx_predictive_models_user 
  ON public.predictive_models(user_id, model_type, is_active);

-- ==========================================
-- 6. Pattern Evolution Tracking
-- ==========================================

-- Track how patterns evolve over time and strategy adaptation
CREATE TABLE IF NOT EXISTS public.pattern_evolution (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  pattern_id uuid REFERENCES public.success_patterns(id) ON DELETE CASCADE,
  
  -- Snapshot details
  snapshot_date timestamptz DEFAULT now(),
  period_label text,  -- "2025-Q1", "Jan 2025", etc
  
  -- Pattern metrics at this point in time
  success_rate numeric,
  confidence_score numeric,
  sample_size integer,
  
  -- Changes from previous period
  success_rate_change numeric,  -- Delta from previous snapshot
  confidence_change numeric,
  sample_size_change integer,
  
  -- Contextual factors
  market_conditions jsonb DEFAULT '{}'::jsonb,
  -- {
  --   "hiring_market": "strong",
  --   "industry_growth": "moderate",
  --   "competition_level": "high"
  -- }
  
  user_circumstances jsonb DEFAULT '{}'::jsonb,
  -- {
  --   "experience_level": "senior",
  --   "skills_count": 24,
  --   "active_applications": 15
  -- }
  
  -- Strategy adaptations made
  adaptations_applied jsonb DEFAULT '[]'::jsonb,
  -- [
  --   {
  --     "adaptation": "Increased networking focus",
  --     "reason": "Direct applications showing declining success",
  --     "expected_impact": "improve_response_rate"
  --   }
  -- ]
  
  -- Performance notes
  insights text,
  recommendations_at_time jsonb DEFAULT '[]'::jsonb,
  
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pattern_evolution_pattern 
  ON public.pattern_evolution(pattern_id, snapshot_date DESC);

CREATE INDEX IF NOT EXISTS idx_pattern_evolution_user 
  ON public.pattern_evolution(user_id, snapshot_date DESC);

-- ==========================================
-- RLS Policies
-- ==========================================

-- Success Patterns
ALTER TABLE public.success_patterns ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "success_patterns_select_own" ON public.success_patterns;
CREATE POLICY "success_patterns_select_own"
  ON public.success_patterns FOR SELECT
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "success_patterns_insert_own" ON public.success_patterns;
CREATE POLICY "success_patterns_insert_own"
  ON public.success_patterns FOR INSERT
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "success_patterns_update_own" ON public.success_patterns;
CREATE POLICY "success_patterns_update_own"
  ON public.success_patterns FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "success_patterns_delete_own" ON public.success_patterns;
CREATE POLICY "success_patterns_delete_own"
  ON public.success_patterns FOR DELETE
  USING (user_id = auth.uid());

-- Preparation Activities
ALTER TABLE public.preparation_activities ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "prep_activities_select_own" ON public.preparation_activities;
CREATE POLICY "prep_activities_select_own"
  ON public.preparation_activities FOR SELECT
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "prep_activities_insert_own" ON public.preparation_activities;
CREATE POLICY "prep_activities_insert_own"
  ON public.preparation_activities FOR INSERT
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "prep_activities_update_own" ON public.preparation_activities;
CREATE POLICY "prep_activities_update_own"
  ON public.preparation_activities FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "prep_activities_delete_own" ON public.preparation_activities;
CREATE POLICY "prep_activities_delete_own"
  ON public.preparation_activities FOR DELETE
  USING (user_id = auth.uid());

-- Timing Patterns
ALTER TABLE public.timing_patterns ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "timing_patterns_select_own" ON public.timing_patterns;
CREATE POLICY "timing_patterns_select_own"
  ON public.timing_patterns FOR SELECT
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "timing_patterns_insert_own" ON public.timing_patterns;
CREATE POLICY "timing_patterns_insert_own"
  ON public.timing_patterns FOR INSERT
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "timing_patterns_update_own" ON public.timing_patterns;
CREATE POLICY "timing_patterns_update_own"
  ON public.timing_patterns FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "timing_patterns_delete_own" ON public.timing_patterns;
CREATE POLICY "timing_patterns_delete_own"
  ON public.timing_patterns FOR DELETE
  USING (user_id = auth.uid());

-- Strategy Effectiveness
ALTER TABLE public.strategy_effectiveness ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "strategy_effectiveness_select_own" ON public.strategy_effectiveness;
CREATE POLICY "strategy_effectiveness_select_own"
  ON public.strategy_effectiveness FOR SELECT
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "strategy_effectiveness_insert_own" ON public.strategy_effectiveness;
CREATE POLICY "strategy_effectiveness_insert_own"
  ON public.strategy_effectiveness FOR INSERT
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "strategy_effectiveness_update_own" ON public.strategy_effectiveness;
CREATE POLICY "strategy_effectiveness_update_own"
  ON public.strategy_effectiveness FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "strategy_effectiveness_delete_own" ON public.strategy_effectiveness;
CREATE POLICY "strategy_effectiveness_delete_own"
  ON public.strategy_effectiveness FOR DELETE
  USING (user_id = auth.uid());

-- Predictive Models
ALTER TABLE public.predictive_models ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "predictive_models_select_own" ON public.predictive_models;
CREATE POLICY "predictive_models_select_own"
  ON public.predictive_models FOR SELECT
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "predictive_models_insert_own" ON public.predictive_models;
CREATE POLICY "predictive_models_insert_own"
  ON public.predictive_models FOR INSERT
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "predictive_models_update_own" ON public.predictive_models;
CREATE POLICY "predictive_models_update_own"
  ON public.predictive_models FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "predictive_models_delete_own" ON public.predictive_models;
CREATE POLICY "predictive_models_delete_own"
  ON public.predictive_models FOR DELETE
  USING (user_id = auth.uid());

-- Pattern Evolution
ALTER TABLE public.pattern_evolution ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "pattern_evolution_select_own" ON public.pattern_evolution;
CREATE POLICY "pattern_evolution_select_own"
  ON public.pattern_evolution FOR SELECT
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "pattern_evolution_insert_own" ON public.pattern_evolution;
CREATE POLICY "pattern_evolution_insert_own"
  ON public.pattern_evolution FOR INSERT
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "pattern_evolution_update_own" ON public.pattern_evolution;
CREATE POLICY "pattern_evolution_update_own"
  ON public.pattern_evolution FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "pattern_evolution_delete_own" ON public.pattern_evolution;
CREATE POLICY "pattern_evolution_delete_own"
  ON public.pattern_evolution FOR DELETE
  USING (user_id = auth.uid());

-- ==========================================
-- Auto-update Triggers
-- ==========================================

CREATE OR REPLACE FUNCTION update_pattern_recognition_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_success_patterns_timestamp ON public.success_patterns;
CREATE TRIGGER update_success_patterns_timestamp
  BEFORE UPDATE ON public.success_patterns
  FOR EACH ROW
  EXECUTE FUNCTION update_pattern_recognition_timestamp();

DROP TRIGGER IF EXISTS update_prep_activities_timestamp ON public.preparation_activities;
CREATE TRIGGER update_prep_activities_timestamp
  BEFORE UPDATE ON public.preparation_activities
  FOR EACH ROW
  EXECUTE FUNCTION update_pattern_recognition_timestamp();

DROP TRIGGER IF EXISTS update_timing_patterns_timestamp ON public.timing_patterns;
CREATE TRIGGER update_timing_patterns_timestamp
  BEFORE UPDATE ON public.timing_patterns
  FOR EACH ROW
  EXECUTE FUNCTION update_pattern_recognition_timestamp();

DROP TRIGGER IF EXISTS update_strategy_effectiveness_timestamp ON public.strategy_effectiveness;
CREATE TRIGGER update_strategy_effectiveness_timestamp
  BEFORE UPDATE ON public.strategy_effectiveness
  FOR EACH ROW
  EXECUTE FUNCTION update_pattern_recognition_timestamp();

DROP TRIGGER IF EXISTS update_predictive_models_timestamp ON public.predictive_models;
CREATE TRIGGER update_predictive_models_timestamp
  BEFORE UPDATE ON public.predictive_models
  FOR EACH ROW
  EXECUTE FUNCTION update_pattern_recognition_timestamp();

-- ==========================================
-- COMMENTS
-- ==========================================

-- ==========================================
-- Auto-update Preparation Activity Outcomes
-- ==========================================

-- Function to update prep activity outcomes when job status changes
CREATE OR REPLACE FUNCTION update_prep_activity_outcomes()
RETURNS TRIGGER AS $$
BEGIN
  -- When a job moves to Phone Screen, Interview, or Offer, update related prep activities
  IF NEW.job_status IN ('Phone Screen', 'Interview', 'Offer') AND 
     (OLD.job_status IS NULL OR OLD.job_status NOT IN ('Phone Screen', 'Interview', 'Offer')) THEN
    
    -- Update led_to_response when job gets any response
    UPDATE public.preparation_activities
    SET led_to_response = true
    WHERE job_id = NEW.id 
      AND user_id = NEW.user_id
      AND led_to_response IS NULL;
  END IF;

  -- When job moves to Interview or Offer
  IF NEW.job_status IN ('Interview', 'Offer') AND 
     (OLD.job_status IS NULL OR OLD.job_status NOT IN ('Interview', 'Offer')) THEN
    
    UPDATE public.preparation_activities
    SET led_to_interview = true
    WHERE job_id = NEW.id 
      AND user_id = NEW.user_id
      AND led_to_interview IS NULL;
  END IF;

  -- When job moves to Offer
  IF NEW.job_status = 'Offer' AND 
     (OLD.job_status IS NULL OR OLD.job_status != 'Offer') THEN
    
    UPDATE public.preparation_activities
    SET led_to_offer = true
    WHERE job_id = NEW.id 
      AND user_id = NEW.user_id
      AND led_to_offer IS NULL;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger on jobs table to auto-update prep activities
DROP TRIGGER IF EXISTS update_prep_outcomes_on_job_status ON public.jobs;
CREATE TRIGGER update_prep_outcomes_on_job_status
  AFTER UPDATE OF job_status ON public.jobs
  FOR EACH ROW
  WHEN (NEW.job_status IS DISTINCT FROM OLD.job_status)
  EXECUTE FUNCTION update_prep_activity_outcomes();

-- ==========================================
-- Auto-link Unlinked Activities to Recent Jobs
-- ==========================================

-- Function to automatically link prep activities to jobs based on timing
-- Links activities without job_id to jobs created within 7 days before the activity
CREATE OR REPLACE FUNCTION auto_link_prep_activities()
RETURNS TRIGGER AS $$
DECLARE
  nearby_job_id bigint;
BEGIN
  -- Only process activities without a job_id
  IF NEW.job_id IS NOT NULL THEN
    RETURN NEW;
  END IF;

  -- Find the most recent job created within 7 days before this activity
  SELECT id INTO nearby_job_id
  FROM public.jobs
  WHERE user_id = NEW.user_id
    AND created_at <= NEW.activity_date
    AND created_at >= NEW.activity_date - INTERVAL '7 days'
    AND job_status NOT IN ('Rejected', 'Declined', 'Withdrawn')
  ORDER BY created_at DESC
  LIMIT 1;

  -- If we found a nearby job, link this activity to it
  IF nearby_job_id IS NOT NULL THEN
    NEW.job_id := nearby_job_id;
    
    -- Calculate days_before_application
    NEW.days_before_application := EXTRACT(DAY FROM (
      SELECT created_at FROM public.jobs WHERE id = nearby_job_id
    ) - NEW.activity_date)::integer;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-link activities on insert
DROP TRIGGER IF EXISTS auto_link_prep_on_insert ON public.preparation_activities;
CREATE TRIGGER auto_link_prep_on_insert
  BEFORE INSERT ON public.preparation_activities
  FOR EACH ROW
  EXECUTE FUNCTION auto_link_prep_activities();

-- ==========================================
-- COMMENTS
-- ==========================================

COMMENT ON TABLE public.success_patterns IS 'Identified patterns from successful applications, interviews, and offers';
COMMENT ON TABLE public.preparation_activities IS 'Tracking preparation activities and correlation with outcomes';
COMMENT ON TABLE public.timing_patterns IS 'Optimal timing patterns for career move execution';
COMMENT ON TABLE public.strategy_effectiveness IS 'Strategy effectiveness tracking across market conditions';
COMMENT ON TABLE public.predictive_models IS 'Predictive models for future opportunity success';
COMMENT ON TABLE public.pattern_evolution IS 'Historical tracking of pattern changes and strategy adaptation';
