-- Migration: Add interview analytics core tables
-- Creates core tables to store interviews, feedback, confidence logs and analytics cache

CREATE TABLE IF NOT EXISTS interviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  company text,
  industry text,
  role text,
  interview_date timestamptz NOT NULL,
  format text, -- e.g., 'onsite', 'phone', 'take-home', 'video', 'pair-programming'
  interview_type text, -- e.g., 'screening', 'technical', 'onsite', 'behavioral'
  stage text, -- e.g., 'applied', 'phone_screen', 'onsite', 'offer'
  result boolean, -- true if offer received
  score integer, -- optional interviewer score (0-100)
  company_culture text, -- e.g., 'startup', 'corporate', 'mid-size', 'remote-first', 'consulting'
  notes text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_interviews_user_id ON interviews(user_id);
CREATE INDEX IF NOT EXISTS idx_interviews_company ON interviews(company);
CREATE INDEX IF NOT EXISTS idx_interviews_industry ON interviews(industry);
CREATE INDEX IF NOT EXISTS idx_interviews_interview_date ON interviews(interview_date);

CREATE TABLE IF NOT EXISTS interview_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  interview_id uuid REFERENCES interviews(id) ON DELETE CASCADE,
  provider text, -- who left the feedback (recruiter, interviewer, mock-coach, self)
  feedback_text text,
  themes jsonb DEFAULT '[]'::jsonb, -- extracted themes/tags
  rating integer, -- optional numeric rating
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_feedback_interview_id ON interview_feedback(interview_id);
CREATE INDEX IF NOT EXISTS idx_feedback_themes ON interview_feedback USING gin (themes);

CREATE TABLE IF NOT EXISTS confidence_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  interview_id uuid REFERENCES interviews(id) ON DELETE SET NULL,
  logged_at timestamptz NOT NULL DEFAULT now(),
  confidence_level smallint, -- 1-10
  anxiety_level smallint, -- 1-10
  notes text
);

CREATE INDEX IF NOT EXISTS idx_confidence_user ON confidence_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_confidence_interview ON confidence_logs(interview_id);

-- cache for aggregated analytics (precomputed to support fast frontend loads)
CREATE TABLE IF NOT EXISTS analytics_cache (
  key text PRIMARY KEY,
  data jsonb,
  updated_at timestamptz DEFAULT now()
);

-- Note: Add retention/archival policy as appropriate for PII and privacy compliance.
