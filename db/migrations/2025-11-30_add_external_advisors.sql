-- ============================================================================
-- UC-115: External Advisor and Coach Integration
-- Centralize external career advisor relationships with secure access
-- ============================================================================

-- ============================================================================
-- ENUM TYPES
-- ============================================================================

-- Types of external advisors
DO $$ BEGIN
  CREATE TYPE advisor_type_enum AS ENUM (
    'career_coach',       -- Professional career coaching
    'resume_writer',      -- Resume/CV specialist
    'interview_coach',    -- Interview preparation specialist
    'industry_mentor',    -- Industry-specific mentor
    'executive_coach',    -- Executive/leadership coaching
    'recruiter',          -- External recruiter relationship
    'counselor',          -- Career counselor
    'consultant',         -- Career consultant
    'other'               -- Other advisor type
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Advisor relationship status
DO $$ BEGIN
  CREATE TYPE advisor_status_enum AS ENUM (
    'pending',            -- Invitation sent, awaiting response
    'active',             -- Active advisory relationship
    'paused',             -- Temporarily paused
    'ended',              -- Relationship ended
    'declined'            -- Invitation declined
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Coaching session status
DO $$ BEGIN
  CREATE TYPE session_status_enum AS ENUM (
    'scheduled',          -- Session booked
    'confirmed',          -- Both parties confirmed
    'in_progress',        -- Currently happening
    'completed',          -- Session finished
    'cancelled',          -- Session cancelled
    'no_show',            -- One party didn't attend
    'rescheduled'         -- Session rescheduled
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Recommendation implementation status
DO $$ BEGIN
  CREATE TYPE recommendation_status_enum AS ENUM (
    'pending',            -- Not yet addressed
    'in_progress',        -- Currently implementing
    'implemented',        -- Successfully implemented
    'partially_done',     -- Partially implemented
    'declined',           -- Decided not to implement
    'not_applicable'      -- No longer relevant
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Billing/payment status for paid coaching
DO $$ BEGIN
  CREATE TYPE billing_status_enum AS ENUM (
    'free',               -- No payment required
    'pending',            -- Payment pending
    'paid',               -- Payment completed
    'overdue',            -- Payment overdue
    'refunded',           -- Payment refunded
    'cancelled'           -- Billing cancelled
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================================
-- TABLES
-- ============================================================================

-- ----------------------------------------------------------------------------
-- External Advisors: Core advisor relationship table
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS external_advisors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  -- Advisor identity
  advisor_email VARCHAR(255) NOT NULL,
  advisor_name VARCHAR(255) NOT NULL,
  advisor_user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,  -- If advisor has account
  advisor_type advisor_type_enum NOT NULL DEFAULT 'career_coach',
  custom_type_name VARCHAR(100),           -- For 'other' type

  -- Organization info
  organization_name VARCHAR(255),
  organization_website TEXT,
  advisor_title VARCHAR(255),              -- e.g., "Senior Career Coach"

  -- Relationship details
  status advisor_status_enum NOT NULL DEFAULT 'pending',
  relationship_started_at TIMESTAMPTZ,
  relationship_ended_at TIMESTAMPTZ,
  end_reason TEXT,

  -- Access permissions (what advisor can see)
  can_view_profile BOOLEAN NOT NULL DEFAULT true,
  can_view_jobs BOOLEAN NOT NULL DEFAULT true,
  can_view_documents BOOLEAN NOT NULL DEFAULT false,
  can_view_analytics BOOLEAN NOT NULL DEFAULT false,
  can_view_interviews BOOLEAN NOT NULL DEFAULT false,
  can_add_recommendations BOOLEAN NOT NULL DEFAULT true,
  can_schedule_sessions BOOLEAN NOT NULL DEFAULT true,
  can_send_messages BOOLEAN NOT NULL DEFAULT true,

  -- Notification preferences
  notify_on_milestones BOOLEAN NOT NULL DEFAULT true,
  notify_on_updates BOOLEAN NOT NULL DEFAULT false,
  update_frequency VARCHAR(20) DEFAULT 'weekly',  -- daily, weekly, monthly

  -- Engagement tracking
  last_accessed_at TIMESTAMPTZ,
  access_count INTEGER NOT NULL DEFAULT 0,
  total_sessions INTEGER NOT NULL DEFAULT 0,
  total_recommendations INTEGER NOT NULL DEFAULT 0,

  -- Notes
  user_notes TEXT,                         -- User's private notes about advisor
  advisor_notes TEXT,                      -- Advisor's notes (if they have account)

  -- Metadata
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Unique constraint: one active relationship per advisor email per user
  UNIQUE(user_id, advisor_email)
);

-- ----------------------------------------------------------------------------
-- Advisor Invitations: Track pending and historical invitations
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS advisor_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  advisor_id UUID NOT NULL REFERENCES external_advisors(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  -- Invitation details
  invitation_token VARCHAR(255) NOT NULL UNIQUE,
  invitation_message TEXT,

  -- Status
  status VARCHAR(20) NOT NULL DEFAULT 'pending',  -- pending, accepted, declined, expired
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '14 days'),

  -- Response tracking
  sent_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  viewed_at TIMESTAMPTZ,
  responded_at TIMESTAMPTZ,
  response_message TEXT,

  -- Reminder tracking
  reminder_sent_at TIMESTAMPTZ,
  reminder_count INTEGER NOT NULL DEFAULT 0,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ----------------------------------------------------------------------------
-- Advisor Sessions: Coaching session scheduling and tracking
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS advisor_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  advisor_id UUID NOT NULL REFERENCES external_advisors(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  -- Session details
  title VARCHAR(255) NOT NULL,
  description TEXT,
  session_type VARCHAR(50) NOT NULL DEFAULT 'coaching',  -- coaching, review, planning, check_in, other

  -- Scheduling
  scheduled_start TIMESTAMPTZ NOT NULL,
  scheduled_end TIMESTAMPTZ NOT NULL,
  timezone VARCHAR(50) DEFAULT 'America/New_York',

  -- Location/meeting details
  location_type VARCHAR(20) NOT NULL DEFAULT 'video',  -- video, phone, in_person
  meeting_url TEXT,                        -- Zoom/Meet/Teams link
  meeting_id VARCHAR(100),
  phone_number VARCHAR(50),
  physical_location TEXT,

  -- Status
  status session_status_enum NOT NULL DEFAULT 'scheduled',
  cancelled_by UUID REFERENCES profiles(id),
  cancellation_reason TEXT,

  -- Session execution
  actual_start TIMESTAMPTZ,
  actual_end TIMESTAMPTZ,
  duration_minutes INTEGER,

  -- Session content
  agenda JSONB DEFAULT '[]'::jsonb,        -- Array of agenda items
  session_notes TEXT,                      -- Notes taken during session
  action_items JSONB DEFAULT '[]'::jsonb,  -- Array of action items

  -- Follow-up
  follow_up_scheduled BOOLEAN NOT NULL DEFAULT false,
  follow_up_date DATE,
  follow_up_notes TEXT,

  -- Feedback
  user_rating INTEGER CHECK (user_rating IS NULL OR user_rating BETWEEN 1 AND 5),
  user_feedback TEXT,
  advisor_feedback TEXT,

  -- Related items
  related_job_id BIGINT REFERENCES jobs(id) ON DELETE SET NULL,
  related_document_id UUID REFERENCES documents(id) ON DELETE SET NULL,

  -- Calendar integration
  calendar_event_id VARCHAR(255),          -- Google Calendar event ID
  calendar_sync_status VARCHAR(20),        -- synced, pending, failed

  -- Metadata
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ----------------------------------------------------------------------------
-- Advisor Recommendations: Track advice and implementation
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS advisor_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  advisor_id UUID NOT NULL REFERENCES external_advisors(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  session_id UUID REFERENCES advisor_sessions(id) ON DELETE SET NULL,

  -- Recommendation details
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  category VARCHAR(50) NOT NULL,           -- resume, interview, networking, skills, strategy, other
  priority VARCHAR(20) NOT NULL DEFAULT 'medium',  -- high, medium, low

  -- Implementation tracking
  status recommendation_status_enum NOT NULL DEFAULT 'pending',
  target_date DATE,
  completed_at TIMESTAMPTZ,

  -- Progress tracking
  progress_notes TEXT,
  implementation_steps JSONB DEFAULT '[]'::jsonb,  -- Array of steps with completion status

  -- Impact assessment
  expected_impact TEXT,
  actual_impact TEXT,
  impact_rating INTEGER CHECK (impact_rating IS NULL OR impact_rating BETWEEN 1 AND 5),

  -- Related items
  related_job_id BIGINT REFERENCES jobs(id) ON DELETE SET NULL,
  related_document_id UUID REFERENCES documents(id) ON DELETE SET NULL,
  related_skill VARCHAR(255),

  -- Metadata
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ----------------------------------------------------------------------------
-- Advisor Shared Materials: Documents and materials shared with advisors
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS advisor_shared_materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  advisor_id UUID NOT NULL REFERENCES external_advisors(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  -- Material reference
  material_type VARCHAR(50) NOT NULL,      -- document, job, profile_section, progress_report
  document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
  document_version_id UUID REFERENCES document_versions(id) ON DELETE SET NULL,
  job_id BIGINT REFERENCES jobs(id) ON DELETE CASCADE,

  -- Sharing details
  share_message TEXT,
  shared_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ,                  -- Optional expiration

  -- Access tracking
  is_active BOOLEAN NOT NULL DEFAULT true,
  accessed_at TIMESTAMPTZ,
  access_count INTEGER NOT NULL DEFAULT 0,

  -- Feedback from advisor
  advisor_feedback TEXT,
  feedback_received_at TIMESTAMPTZ,

  -- Metadata
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Prevent duplicate shares (partial unique indexes)
CREATE UNIQUE INDEX IF NOT EXISTS idx_advisor_shared_materials_unique_document
  ON advisor_shared_materials(advisor_id, document_id)
  WHERE document_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_advisor_shared_materials_unique_job
  ON advisor_shared_materials(advisor_id, job_id)
  WHERE job_id IS NOT NULL;

-- ----------------------------------------------------------------------------
-- Advisor Billing: Payment tracking for paid coaching services
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS advisor_billing (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  advisor_id UUID NOT NULL REFERENCES external_advisors(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  session_id UUID REFERENCES advisor_sessions(id) ON DELETE SET NULL,

  -- Billing details
  billing_type VARCHAR(50) NOT NULL,       -- session, package, subscription, one_time
  description TEXT,
  amount_cents INTEGER NOT NULL,           -- Amount in cents
  currency VARCHAR(3) NOT NULL DEFAULT 'USD',

  -- Status
  status billing_status_enum NOT NULL DEFAULT 'pending',

  -- Payment details
  payment_method VARCHAR(50),              -- card, bank, paypal, venmo, cash, other
  payment_reference VARCHAR(255),          -- External payment ID (Stripe, etc.)

  -- Dates
  invoice_date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE,
  paid_at TIMESTAMPTZ,

  -- Stripe integration fields (for future use)
  stripe_payment_intent_id VARCHAR(255),
  stripe_invoice_id VARCHAR(255),
  stripe_customer_id VARCHAR(255),

  -- Notes
  notes TEXT,
  receipt_url TEXT,

  -- Metadata
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ----------------------------------------------------------------------------
-- Advisor Messages: Secure communication channel
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS advisor_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  advisor_id UUID NOT NULL REFERENCES external_advisors(id) ON DELETE CASCADE,

  -- Message details
  sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  sender_type VARCHAR(20) NOT NULL,        -- user, advisor
  message_text TEXT NOT NULL,

  -- Attachments
  attachments JSONB DEFAULT '[]'::jsonb,   -- Array of { filename, url, type }

  -- Status
  is_read BOOLEAN NOT NULL DEFAULT false,
  read_at TIMESTAMPTZ,

  -- Threading
  parent_message_id UUID REFERENCES advisor_messages(id) ON DELETE SET NULL,

  -- Metadata
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- External Advisors
CREATE INDEX IF NOT EXISTS idx_external_advisors_user ON external_advisors(user_id);
CREATE INDEX IF NOT EXISTS idx_external_advisors_advisor_user ON external_advisors(advisor_user_id) WHERE advisor_user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_external_advisors_status ON external_advisors(user_id, status) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_external_advisors_email ON external_advisors(advisor_email);

-- Advisor Invitations
CREATE INDEX IF NOT EXISTS idx_advisor_invitations_advisor ON advisor_invitations(advisor_id);
CREATE INDEX IF NOT EXISTS idx_advisor_invitations_token ON advisor_invitations(invitation_token);
CREATE INDEX IF NOT EXISTS idx_advisor_invitations_status ON advisor_invitations(status, expires_at);

-- Advisor Sessions
CREATE INDEX IF NOT EXISTS idx_advisor_sessions_advisor ON advisor_sessions(advisor_id);
CREATE INDEX IF NOT EXISTS idx_advisor_sessions_user ON advisor_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_advisor_sessions_scheduled ON advisor_sessions(scheduled_start, status);
CREATE INDEX IF NOT EXISTS idx_advisor_sessions_upcoming ON advisor_sessions(user_id, scheduled_start)
  WHERE status IN ('scheduled', 'confirmed');

-- Advisor Recommendations
CREATE INDEX IF NOT EXISTS idx_advisor_recommendations_advisor ON advisor_recommendations(advisor_id);
CREATE INDEX IF NOT EXISTS idx_advisor_recommendations_user ON advisor_recommendations(user_id);
CREATE INDEX IF NOT EXISTS idx_advisor_recommendations_status ON advisor_recommendations(user_id, status);
CREATE INDEX IF NOT EXISTS idx_advisor_recommendations_session ON advisor_recommendations(session_id);

-- Advisor Shared Materials
CREATE INDEX IF NOT EXISTS idx_advisor_shared_materials_advisor ON advisor_shared_materials(advisor_id);
CREATE INDEX IF NOT EXISTS idx_advisor_shared_materials_user ON advisor_shared_materials(user_id);
CREATE INDEX IF NOT EXISTS idx_advisor_shared_materials_active ON advisor_shared_materials(advisor_id, is_active) WHERE is_active = true;

-- Advisor Billing
CREATE INDEX IF NOT EXISTS idx_advisor_billing_advisor ON advisor_billing(advisor_id);
CREATE INDEX IF NOT EXISTS idx_advisor_billing_user ON advisor_billing(user_id);
CREATE INDEX IF NOT EXISTS idx_advisor_billing_status ON advisor_billing(status);
CREATE INDEX IF NOT EXISTS idx_advisor_billing_session ON advisor_billing(session_id);

-- Advisor Messages
CREATE INDEX IF NOT EXISTS idx_advisor_messages_advisor ON advisor_messages(advisor_id);
CREATE INDEX IF NOT EXISTS idx_advisor_messages_sender ON advisor_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_advisor_messages_unread ON advisor_messages(advisor_id, is_read) WHERE is_read = false;
CREATE INDEX IF NOT EXISTS idx_advisor_messages_thread ON advisor_messages(parent_message_id);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE external_advisors ENABLE ROW LEVEL SECURITY;
ALTER TABLE advisor_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE advisor_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE advisor_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE advisor_shared_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE advisor_billing ENABLE ROW LEVEL SECURITY;
ALTER TABLE advisor_messages ENABLE ROW LEVEL SECURITY;

-- Helper function: Check if user is the advisor for a relationship
CREATE OR REPLACE FUNCTION is_advisor_for_user(p_advisor_id UUID, p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM external_advisors
    WHERE id = p_advisor_id
      AND (user_id = p_user_id OR advisor_user_id = p_user_id)
      AND status = 'active'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- External Advisors: User can manage their advisors, advisors can view their relationships
CREATE POLICY external_advisors_user_select ON external_advisors
  FOR SELECT USING (
    user_id = auth.uid()
    OR advisor_user_id = auth.uid()
  );

CREATE POLICY external_advisors_user_insert ON external_advisors
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY external_advisors_user_update ON external_advisors
  FOR UPDATE USING (user_id = auth.uid() OR advisor_user_id = auth.uid());

CREATE POLICY external_advisors_user_delete ON external_advisors
  FOR DELETE USING (user_id = auth.uid());

-- Advisor Invitations: User can manage, advisors can view/respond
CREATE POLICY advisor_invitations_select ON advisor_invitations
  FOR SELECT USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM external_advisors ea
      WHERE ea.id = advisor_invitations.advisor_id
        AND ea.advisor_user_id = auth.uid()
    )
  );

CREATE POLICY advisor_invitations_insert ON advisor_invitations
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY advisor_invitations_update ON advisor_invitations
  FOR UPDATE USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM external_advisors ea
      WHERE ea.id = advisor_invitations.advisor_id
        AND ea.advisor_user_id = auth.uid()
    )
  );

-- Advisor Sessions: Both parties can view and manage
CREATE POLICY advisor_sessions_select ON advisor_sessions
  FOR SELECT USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM external_advisors ea
      WHERE ea.id = advisor_sessions.advisor_id
        AND ea.advisor_user_id = auth.uid()
    )
  );

CREATE POLICY advisor_sessions_insert ON advisor_sessions
  FOR INSERT WITH CHECK (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM external_advisors ea
      WHERE ea.id = advisor_id
        AND ea.advisor_user_id = auth.uid()
        AND ea.can_schedule_sessions = true
    )
  );

CREATE POLICY advisor_sessions_update ON advisor_sessions
  FOR UPDATE USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM external_advisors ea
      WHERE ea.id = advisor_sessions.advisor_id
        AND ea.advisor_user_id = auth.uid()
    )
  );

CREATE POLICY advisor_sessions_delete ON advisor_sessions
  FOR DELETE USING (user_id = auth.uid());

-- Advisor Recommendations: User can view all, advisors can manage their own
CREATE POLICY advisor_recommendations_select ON advisor_recommendations
  FOR SELECT USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM external_advisors ea
      WHERE ea.id = advisor_recommendations.advisor_id
        AND ea.advisor_user_id = auth.uid()
    )
  );

CREATE POLICY advisor_recommendations_insert ON advisor_recommendations
  FOR INSERT WITH CHECK (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM external_advisors ea
      WHERE ea.id = advisor_id
        AND ea.advisor_user_id = auth.uid()
        AND ea.can_add_recommendations = true
    )
  );

CREATE POLICY advisor_recommendations_update ON advisor_recommendations
  FOR UPDATE USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM external_advisors ea
      WHERE ea.id = advisor_recommendations.advisor_id
        AND ea.advisor_user_id = auth.uid()
    )
  );

CREATE POLICY advisor_recommendations_delete ON advisor_recommendations
  FOR DELETE USING (user_id = auth.uid());

-- Advisor Shared Materials: User controls sharing
CREATE POLICY advisor_shared_materials_select ON advisor_shared_materials
  FOR SELECT USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM external_advisors ea
      WHERE ea.id = advisor_shared_materials.advisor_id
        AND ea.advisor_user_id = auth.uid()
        AND advisor_shared_materials.is_active = true
    )
  );

CREATE POLICY advisor_shared_materials_insert ON advisor_shared_materials
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY advisor_shared_materials_update ON advisor_shared_materials
  FOR UPDATE USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM external_advisors ea
      WHERE ea.id = advisor_shared_materials.advisor_id
        AND ea.advisor_user_id = auth.uid()
    )
  );

CREATE POLICY advisor_shared_materials_delete ON advisor_shared_materials
  FOR DELETE USING (user_id = auth.uid());

-- Advisor Billing: User and advisor can view
CREATE POLICY advisor_billing_select ON advisor_billing
  FOR SELECT USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM external_advisors ea
      WHERE ea.id = advisor_billing.advisor_id
        AND ea.advisor_user_id = auth.uid()
    )
  );

CREATE POLICY advisor_billing_insert ON advisor_billing
  FOR INSERT WITH CHECK (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM external_advisors ea
      WHERE ea.id = advisor_id
        AND ea.advisor_user_id = auth.uid()
    )
  );

CREATE POLICY advisor_billing_update ON advisor_billing
  FOR UPDATE USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM external_advisors ea
      WHERE ea.id = advisor_billing.advisor_id
        AND ea.advisor_user_id = auth.uid()
    )
  );

-- Advisor Messages: Both parties can view and send
CREATE POLICY advisor_messages_select ON advisor_messages
  FOR SELECT USING (
    sender_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM external_advisors ea
      WHERE ea.id = advisor_messages.advisor_id
        AND (ea.user_id = auth.uid() OR ea.advisor_user_id = auth.uid())
    )
  );

CREATE POLICY advisor_messages_insert ON advisor_messages
  FOR INSERT WITH CHECK (
    sender_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM external_advisors ea
      WHERE ea.id = advisor_id
        AND (ea.user_id = auth.uid() OR ea.advisor_user_id = auth.uid())
        AND ea.can_send_messages = true
    )
  );

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Auto-update updated_at timestamps
DROP TRIGGER IF EXISTS update_external_advisors_updated_at ON external_advisors;
CREATE TRIGGER update_external_advisors_updated_at
  BEFORE UPDATE ON external_advisors
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_advisor_invitations_updated_at ON advisor_invitations;
CREATE TRIGGER update_advisor_invitations_updated_at
  BEFORE UPDATE ON advisor_invitations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_advisor_sessions_updated_at ON advisor_sessions;
CREATE TRIGGER update_advisor_sessions_updated_at
  BEFORE UPDATE ON advisor_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_advisor_recommendations_updated_at ON advisor_recommendations;
CREATE TRIGGER update_advisor_recommendations_updated_at
  BEFORE UPDATE ON advisor_recommendations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_advisor_shared_materials_updated_at ON advisor_shared_materials;
CREATE TRIGGER update_advisor_shared_materials_updated_at
  BEFORE UPDATE ON advisor_shared_materials
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_advisor_billing_updated_at ON advisor_billing;
CREATE TRIGGER update_advisor_billing_updated_at
  BEFORE UPDATE ON advisor_billing
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Update advisor stats when session is completed
CREATE OR REPLACE FUNCTION update_advisor_session_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
    UPDATE external_advisors
    SET total_sessions = total_sessions + 1,
        updated_at = now()
    WHERE id = NEW.advisor_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_advisor_session_stats_trigger ON advisor_sessions;
CREATE TRIGGER update_advisor_session_stats_trigger
  AFTER INSERT OR UPDATE OF status ON advisor_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_advisor_session_stats();

-- Update advisor stats when recommendation is added
CREATE OR REPLACE FUNCTION update_advisor_recommendation_stats()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE external_advisors
  SET total_recommendations = total_recommendations + 1,
      updated_at = now()
  WHERE id = NEW.advisor_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_advisor_recommendation_stats_trigger ON advisor_recommendations;
CREATE TRIGGER update_advisor_recommendation_stats_trigger
  AFTER INSERT ON advisor_recommendations
  FOR EACH ROW
  EXECUTE FUNCTION update_advisor_recommendation_stats();

-- ============================================================================
-- DATABASE FUNCTIONS
-- ============================================================================

-- Get advisor impact metrics for a user
CREATE OR REPLACE FUNCTION get_advisor_impact(p_user_id UUID, p_advisor_id UUID DEFAULT NULL)
RETURNS TABLE (
  advisor_id UUID,
  advisor_name VARCHAR,
  total_sessions BIGINT,
  completed_sessions BIGINT,
  total_recommendations BIGINT,
  implemented_recommendations BIGINT,
  implementation_rate DECIMAL,
  average_session_rating DECIMAL,
  total_hours DECIMAL,
  active_since DATE
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    ea.id as advisor_id,
    ea.advisor_name,
    COUNT(DISTINCT s.id) as total_sessions,
    COUNT(DISTINCT s.id) FILTER (WHERE s.status = 'completed') as completed_sessions,
    COUNT(DISTINCT r.id) as total_recommendations,
    COUNT(DISTINCT r.id) FILTER (WHERE r.status = 'implemented') as implemented_recommendations,
    CASE
      WHEN COUNT(DISTINCT r.id) > 0
      THEN ROUND(COUNT(DISTINCT r.id) FILTER (WHERE r.status = 'implemented')::DECIMAL / COUNT(DISTINCT r.id)::DECIMAL * 100, 1)
      ELSE 0
    END as implementation_rate,
    ROUND(AVG(s.user_rating)::DECIMAL, 1) as average_session_rating,
    ROUND(COALESCE(SUM(s.duration_minutes), 0)::DECIMAL / 60, 1) as total_hours,
    ea.relationship_started_at::DATE as active_since
  FROM external_advisors ea
  LEFT JOIN advisor_sessions s ON ea.id = s.advisor_id
  LEFT JOIN advisor_recommendations r ON ea.id = r.advisor_id
  WHERE ea.user_id = p_user_id
    AND ea.status = 'active'
    AND (p_advisor_id IS NULL OR ea.id = p_advisor_id)
  GROUP BY ea.id, ea.advisor_name, ea.relationship_started_at
  ORDER BY total_sessions DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get upcoming sessions for a user
CREATE OR REPLACE FUNCTION get_upcoming_advisor_sessions(p_user_id UUID, p_limit INTEGER DEFAULT 10)
RETURNS TABLE (
  session_id UUID,
  advisor_id UUID,
  advisor_name VARCHAR,
  title VARCHAR,
  scheduled_start TIMESTAMPTZ,
  scheduled_end TIMESTAMPTZ,
  status session_status_enum,
  location_type VARCHAR,
  meeting_url TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    s.id as session_id,
    s.advisor_id,
    ea.advisor_name,
    s.title,
    s.scheduled_start,
    s.scheduled_end,
    s.status,
    s.location_type,
    s.meeting_url
  FROM advisor_sessions s
  JOIN external_advisors ea ON s.advisor_id = ea.id
  WHERE s.user_id = p_user_id
    AND s.scheduled_start > now()
    AND s.status IN ('scheduled', 'confirmed')
  ORDER BY s.scheduled_start ASC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get pending recommendations for a user
CREATE OR REPLACE FUNCTION get_pending_recommendations(p_user_id UUID)
RETURNS TABLE (
  recommendation_id UUID,
  advisor_id UUID,
  advisor_name VARCHAR,
  title VARCHAR,
  description TEXT,
  category VARCHAR,
  priority VARCHAR,
  target_date DATE,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    r.id as recommendation_id,
    r.advisor_id,
    ea.advisor_name,
    r.title,
    r.description,
    r.category,
    r.priority,
    r.target_date,
    r.created_at
  FROM advisor_recommendations r
  JOIN external_advisors ea ON r.advisor_id = ea.id
  WHERE r.user_id = p_user_id
    AND r.status IN ('pending', 'in_progress')
  ORDER BY
    CASE r.priority
      WHEN 'high' THEN 1
      WHEN 'medium' THEN 2
      ELSE 3
    END,
    r.target_date ASC NULLS LAST,
    r.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE external_advisors IS 'External career advisors and coaches invited by users.
Supports both users with accounts (advisor_user_id) and external email-only advisors.
Tracks relationship status, permissions, and engagement metrics.';

COMMENT ON TABLE advisor_sessions IS 'Coaching sessions between users and their external advisors.
Supports video, phone, and in-person meetings with calendar integration.
Tracks session outcomes, feedback, and follow-up items.';

COMMENT ON TABLE advisor_recommendations IS 'Recommendations and advice from advisors.
Tracks implementation status and impact assessment.
Links to related jobs, documents, and skills.';

COMMENT ON TABLE advisor_billing IS 'Payment tracking for paid coaching services.
Supports multiple billing types (session, package, subscription).
Includes Stripe integration fields for future payment processing.';
