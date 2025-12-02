-- Migration: Add interview scheduling fields
-- Extends the interviews table to support scheduling (upcoming interviews)
-- Previously it was only used for analytics (past interviews)

-- Add scheduling-related columns to interviews table
ALTER TABLE interviews
  ADD COLUMN IF NOT EXISTS title text,
  ADD COLUMN IF NOT EXISTS interviewer text,
  ADD COLUMN IF NOT EXISTS duration_minutes integer DEFAULT 45,
  ADD COLUMN IF NOT EXISTS reminder_minutes integer DEFAULT 30,
  ADD COLUMN IF NOT EXISTS location text,
  ADD COLUMN IF NOT EXISTS linked_job_id bigint REFERENCES jobs(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS status text DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled')),
  ADD COLUMN IF NOT EXISTS outcome text,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- Index for filtering by status (scheduled vs completed)
CREATE INDEX IF NOT EXISTS idx_interviews_status ON interviews(user_id, status);

-- Index for upcoming interviews sorted by date
CREATE INDEX IF NOT EXISTS idx_interviews_upcoming ON interviews(user_id, interview_date)
  WHERE status = 'scheduled';

-- Update trigger for updated_at
CREATE OR REPLACE FUNCTION update_interviews_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS interviews_updated_at ON interviews;
CREATE TRIGGER interviews_updated_at
  BEFORE UPDATE ON interviews
  FOR EACH ROW
  EXECUTE FUNCTION update_interviews_updated_at();

-- Add RLS policies for interviews if not already present
ALTER TABLE interviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own interviews" ON interviews;
CREATE POLICY "Users can view their own interviews"
  ON interviews FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own interviews" ON interviews;
CREATE POLICY "Users can insert their own interviews"
  ON interviews FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own interviews" ON interviews;
CREATE POLICY "Users can update their own interviews"
  ON interviews FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own interviews" ON interviews;
CREATE POLICY "Users can delete their own interviews"
  ON interviews FOR DELETE
  USING (auth.uid() = user_id);

COMMENT ON COLUMN interviews.title IS 'Interview title/description for scheduling';
COMMENT ON COLUMN interviews.interviewer IS 'Name of the interviewer';
COMMENT ON COLUMN interviews.duration_minutes IS 'Expected duration in minutes';
COMMENT ON COLUMN interviews.reminder_minutes IS 'Reminder time before interview in minutes';
COMMENT ON COLUMN interviews.location IS 'Physical address or video call link';
COMMENT ON COLUMN interviews.linked_job_id IS 'Reference to the job application this interview is for';
COMMENT ON COLUMN interviews.status IS 'scheduled, completed, or cancelled';
COMMENT ON COLUMN interviews.outcome IS 'Notes about the outcome after completion';
