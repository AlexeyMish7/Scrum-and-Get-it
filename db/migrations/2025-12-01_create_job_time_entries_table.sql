-- Create job_time_entries table for time tracking analytics
-- This table stores focused work sessions that users log for their job search activities

CREATE TABLE IF NOT EXISTS job_time_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Activity classification
  activity_type text NOT NULL, -- e.g., "applications", "networking", "research", "interview_prep", "skill_building", "other"
  
  -- Time tracking
  duration_minutes integer NOT NULL CHECK (duration_minutes > 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  
  -- Optional metadata
  energy_level integer CHECK (energy_level >= 1 AND energy_level <= 5), -- 1=very low, 5=very high
  outcome_type text, -- e.g., "application_submitted", "interview", "offer", "referral", "networking_connection"
  notes text, -- Optional user notes about the session
  
  -- Indexes for performance
  CONSTRAINT valid_activity_type CHECK (
    activity_type IN (
      'applications',
      'networking', 
      'research',
      'interview_prep',
      'skill_building',
      'other'
    )
  )
);

-- Index for efficient user queries
CREATE INDEX idx_job_time_entries_user_id ON job_time_entries(user_id);

-- Index for date-range queries
CREATE INDEX idx_job_time_entries_created_at ON job_time_entries(created_at);

-- Composite index for user + date queries (most common pattern)
CREATE INDEX idx_job_time_entries_user_date ON job_time_entries(user_id, created_at DESC);

-- Row Level Security
ALTER TABLE job_time_entries ENABLE ROW LEVEL SECURITY;

-- Users can only see their own time entries
CREATE POLICY "Users can view own time entries"
  ON job_time_entries
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own time entries
CREATE POLICY "Users can insert own time entries"
  ON job_time_entries
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own time entries
CREATE POLICY "Users can update own time entries"
  ON job_time_entries
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own time entries
CREATE POLICY "Users can delete own time entries"
  ON job_time_entries
  FOR DELETE
  USING (auth.uid() = user_id);

-- Seed some sample data for testing (optional - comment out for production)
-- This will be removed after initial testing
INSERT INTO job_time_entries (user_id, activity_type, duration_minutes, energy_level, outcome_type, created_at)
SELECT 
  auth.uid() as user_id,
  activity,
  duration,
  energy,
  outcome,
  timestamp
FROM (
  VALUES
    -- Week 1 (recent)
    ('applications', 45, 4, 'application_submitted', now() - interval '1 day'),
    ('applications', 60, 3, 'application_submitted', now() - interval '2 days'),
    ('networking', 30, 5, 'networking_connection', now() - interval '3 days'),
    ('research', 90, 4, null, now() - interval '4 days'),
    ('interview_prep', 120, 3, null, now() - interval '5 days'),
    
    -- Week 2
    ('applications', 50, 4, 'application_submitted', now() - interval '8 days'),
    ('applications', 55, 3, 'application_submitted', now() - interval '9 days'),
    ('networking', 40, 4, 'referral', now() - interval '10 days'),
    ('skill_building', 180, 2, null, now() - interval '11 days'),
    ('research', 75, 3, null, now() - interval '12 days'),
    
    -- Week 3
    ('applications', 40, 5, 'application_submitted', now() - interval '15 days'),
    ('interview_prep', 90, 4, 'interview', now() - interval '16 days'),
    ('networking', 35, 4, 'networking_connection', now() - interval '17 days'),
    ('applications', 65, 3, 'application_submitted', now() - interval '18 days'),
    ('research', 60, 3, null, now() - interval '19 days'),
    
    -- Week 4
    ('applications', 45, 2, 'application_submitted', now() - interval '22 days'),
    ('skill_building', 150, 2, null, now() - interval '23 days'),
    ('networking', 45, 3, 'networking_connection', now() - interval '24 days'),
    ('applications', 70, 4, 'application_submitted', now() - interval '25 days'),
    ('interview_prep', 100, 3, 'interview', now() - interval '26 days')
) AS sample_data(activity, duration, energy, outcome, timestamp)
WHERE auth.uid() IS NOT NULL; -- Only insert if user is authenticated

COMMENT ON TABLE job_time_entries IS 'Tracks focused work sessions for job search activities to enable productivity analytics';
COMMENT ON COLUMN job_time_entries.activity_type IS 'Type of job search activity: applications, networking, research, interview_prep, skill_building, other';
COMMENT ON COLUMN job_time_entries.duration_minutes IS 'Duration of focused work session in minutes';
COMMENT ON COLUMN job_time_entries.energy_level IS 'Self-reported energy level during session (1=very low, 5=very high)';
COMMENT ON COLUMN job_time_entries.outcome_type IS 'Optional outcome from the session: application_submitted, interview, offer, referral, networking_connection';
