-- ============================================================================
-- UC-114: Corporate Career Services Integration
-- Enterprise features for career services providers to support large groups
-- ============================================================================

-- ============================================================================
-- ENUM TYPES
-- ============================================================================

-- Cohort status for tracking program lifecycle
DO $$ BEGIN
  CREATE TYPE cohort_status_enum AS ENUM (
    'draft',        -- Cohort created but not active
    'active',       -- Currently running program
    'completed',    -- Program finished
    'archived'      -- No longer shown in active lists
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Onboarding job status for bulk user imports
DO $$ BEGIN
  CREATE TYPE onboarding_job_status_enum AS ENUM (
    'pending',      -- Job queued
    'processing',   -- Currently running
    'completed',    -- All users processed
    'failed',       -- Job failed
    'partial'       -- Some users processed, some failed
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Integration type for external platform connections
DO $$ BEGIN
  CREATE TYPE integration_type_enum AS ENUM (
    'lms',              -- Learning Management System
    'sis',              -- Student Information System
    'crm',              -- Customer Relationship Management
    'calendar',         -- Calendar integration
    'sso',              -- Single Sign-On
    'analytics',        -- External analytics platforms
    'job_board',        -- External job boards
    'ats',              -- External ATS systems
    'custom_webhook'    -- Custom webhook integrations
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Compliance event types for audit logging
DO $$ BEGIN
  CREATE TYPE compliance_event_enum AS ENUM (
    'user_data_access',       -- Someone accessed user data
    'user_data_export',       -- Data exported
    'user_data_delete',       -- Data deletion request
    'settings_change',        -- Enterprise settings modified
    'role_change',            -- User role modified
    'bulk_operation',         -- Bulk action performed
    'integration_access',     -- External integration accessed data
    'report_generated',       -- Report was generated
    'login_attempt',          -- Login attempt (success/fail)
    'permission_change'       -- Permission modification
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================================
-- TABLES
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Cohorts: Groups of job seekers in a program (e.g., "Spring 2025 Graduates")
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS cohorts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,

  -- Basic info
  name VARCHAR(255) NOT NULL,
  description TEXT,

  -- Program details
  program_type VARCHAR(100),              -- e.g., "Career Bootcamp", "Alumni Services"
  status cohort_status_enum NOT NULL DEFAULT 'draft',
  start_date DATE,
  end_date DATE,

  -- Capacity and enrollment
  max_capacity INTEGER,                   -- NULL means unlimited
  current_enrollment INTEGER NOT NULL DEFAULT 0,

  -- Goals and targets
  target_placement_rate DECIMAL(5,2),     -- e.g., 85.00 for 85%
  target_avg_salary INTEGER,              -- Target average starting salary
  target_time_to_placement INTEGER,       -- Target days to placement

  -- Settings
  settings JSONB NOT NULL DEFAULT '{
    "auto_assign_mentors": false,
    "require_weekly_checkin": true,
    "enable_peer_networking": true,
    "share_aggregate_progress": true
  }'::jsonb,

  -- Metadata
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ----------------------------------------------------------------------------
-- Cohort Members: Links users to cohorts with additional tracking
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS cohort_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cohort_id UUID NOT NULL REFERENCES cohorts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  -- Enrollment details
  enrolled_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  enrolled_by UUID REFERENCES profiles(id) ON DELETE SET NULL,

  -- Status tracking
  is_active BOOLEAN NOT NULL DEFAULT true,
  completion_status VARCHAR(50) DEFAULT 'in_progress',  -- in_progress, completed, withdrawn, placed

  -- Outcome tracking
  placed_at TIMESTAMPTZ,                  -- When they got a job
  placement_company VARCHAR(255),          -- Where they got placed
  placement_role VARCHAR(255),             -- Role they got
  placement_salary INTEGER,                -- Starting salary

  -- Progress tracking
  progress_score INTEGER DEFAULT 0,        -- 0-100 progress metric
  last_activity_at TIMESTAMPTZ,

  -- Notes
  notes TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Prevent duplicate enrollments
  UNIQUE(cohort_id, user_id)
);

-- ----------------------------------------------------------------------------
-- Program Analytics: Aggregate metrics for cohorts and programs
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS program_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  cohort_id UUID REFERENCES cohorts(id) ON DELETE CASCADE,  -- NULL for team-wide analytics

  -- Time period
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  granularity VARCHAR(20) NOT NULL DEFAULT 'weekly',  -- daily, weekly, monthly, quarterly

  -- Enrollment metrics
  total_enrolled INTEGER NOT NULL DEFAULT 0,
  active_users INTEGER NOT NULL DEFAULT 0,
  new_enrollments INTEGER NOT NULL DEFAULT 0,
  withdrawals INTEGER NOT NULL DEFAULT 0,

  -- Activity metrics
  total_applications INTEGER NOT NULL DEFAULT 0,
  total_interviews INTEGER NOT NULL DEFAULT 0,
  total_offers INTEGER NOT NULL DEFAULT 0,
  total_placements INTEGER NOT NULL DEFAULT 0,

  -- Conversion rates (stored as percentages, e.g., 45.5 for 45.5%)
  application_to_interview_rate DECIMAL(5,2),
  interview_to_offer_rate DECIMAL(5,2),
  offer_acceptance_rate DECIMAL(5,2),
  overall_placement_rate DECIMAL(5,2),

  -- Time metrics (in days)
  avg_time_to_first_interview DECIMAL(10,2),
  avg_time_to_offer DECIMAL(10,2),
  avg_time_to_placement DECIMAL(10,2),

  -- Salary metrics
  avg_starting_salary INTEGER,
  median_starting_salary INTEGER,
  min_salary INTEGER,
  max_salary INTEGER,

  -- Engagement metrics
  avg_weekly_applications DECIMAL(10,2),
  avg_profile_completeness DECIMAL(5,2),
  active_user_rate DECIMAL(5,2),

  -- Detailed breakdowns (JSONB for flexibility)
  industry_breakdown JSONB DEFAULT '{}'::jsonb,       -- { "Tech": 45, "Finance": 30 }
  role_breakdown JSONB DEFAULT '{}'::jsonb,           -- { "Software Engineer": 20 }
  company_size_breakdown JSONB DEFAULT '{}'::jsonb,   -- { "startup": 15, "enterprise": 25 }

  -- Cache metadata
  calculated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  is_final BOOLEAN NOT NULL DEFAULT false,  -- True if period is complete

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Unique constraint for period + granularity
  UNIQUE(team_id, cohort_id, period_start, period_end, granularity)
);

-- ----------------------------------------------------------------------------
-- ROI Reports: Program return on investment tracking
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS roi_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  cohort_id UUID REFERENCES cohorts(id) ON DELETE CASCADE,  -- NULL for organization-wide

  -- Report details
  report_name VARCHAR(255) NOT NULL,
  report_type VARCHAR(50) NOT NULL DEFAULT 'program',  -- program, cohort, quarterly, annual
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,

  -- Investment metrics
  total_program_cost INTEGER,              -- Total cost in cents
  cost_per_participant INTEGER,            -- Per-person cost
  staff_hours_invested DECIMAL(10,2),
  technology_costs INTEGER,

  -- Outcome metrics
  total_placements INTEGER NOT NULL DEFAULT 0,
  placement_rate DECIMAL(5,2),
  avg_salary_increase INTEGER,             -- Average salary gain for participants
  total_salary_value INTEGER,              -- Sum of all placement salaries

  -- ROI calculations
  cost_per_placement INTEGER,              -- Investment per successful placement
  roi_percentage DECIMAL(10,2),            -- Return on investment percentage
  payback_period_months DECIMAL(10,2),     -- Months to recoup investment

  -- Comparison metrics
  industry_benchmark_placement_rate DECIMAL(5,2),
  performance_vs_benchmark DECIMAL(10,2),  -- % above/below benchmark

  -- Detailed data
  metrics_breakdown JSONB NOT NULL DEFAULT '{}'::jsonb,
  recommendations JSONB NOT NULL DEFAULT '[]'::jsonb,

  -- Report status
  status VARCHAR(20) NOT NULL DEFAULT 'draft',  -- draft, published, archived
  generated_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  published_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ----------------------------------------------------------------------------
-- Branding Settings: White-label customization for institutions
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS enterprise_branding (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,

  -- Basic branding
  organization_name VARCHAR(255),
  tagline VARCHAR(255),

  -- Visual branding
  logo_url TEXT,
  favicon_url TEXT,
  primary_color VARCHAR(7) DEFAULT '#1976d2',       -- Hex color
  secondary_color VARCHAR(7) DEFAULT '#dc004e',
  accent_color VARCHAR(7) DEFAULT '#ff9800',
  background_color VARCHAR(7) DEFAULT '#ffffff',
  text_color VARCHAR(7) DEFAULT '#333333',

  -- Typography
  font_family VARCHAR(100) DEFAULT 'Roboto',
  heading_font_family VARCHAR(100),

  -- Custom domain
  custom_domain VARCHAR(255),
  custom_domain_verified BOOLEAN NOT NULL DEFAULT false,
  ssl_certificate_expires_at TIMESTAMPTZ,

  -- Email customization
  email_from_name VARCHAR(255),
  email_from_address VARCHAR(255),
  email_footer_text TEXT,
  email_logo_url TEXT,

  -- Login page customization
  login_background_url TEXT,
  login_welcome_text TEXT,

  -- Legal/compliance
  privacy_policy_url TEXT,
  terms_of_service_url TEXT,
  custom_legal_text TEXT,

  -- Feature toggles
  feature_flags JSONB NOT NULL DEFAULT '{
    "show_powered_by": true,
    "allow_social_login": true,
    "enable_custom_css": false,
    "enable_custom_js": false
  }'::jsonb,

  -- Custom CSS/JS (for advanced customization)
  custom_css TEXT,
  custom_js TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE(team_id)
);

-- ----------------------------------------------------------------------------
-- Compliance Logs: Audit trail for data access and changes
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS compliance_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,

  -- Event details
  event_type compliance_event_enum NOT NULL,
  event_description TEXT NOT NULL,

  -- Actor information
  actor_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  actor_email VARCHAR(255),
  actor_ip_address INET,
  actor_user_agent TEXT,

  -- Target information
  target_user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  target_resource_type VARCHAR(100),        -- e.g., "profile", "cohort", "report"
  target_resource_id UUID,

  -- Change details
  old_value JSONB,
  new_value JSONB,

  -- Compliance metadata
  data_classification VARCHAR(50),          -- public, internal, confidential, restricted
  compliance_framework VARCHAR(50),         -- GDPR, FERPA, SOC2, etc.
  retention_required_until DATE,

  -- Additional context
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ----------------------------------------------------------------------------
-- External Integrations: Connections to third-party platforms
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS external_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,

  -- Integration identity
  name VARCHAR(255) NOT NULL,
  integration_type integration_type_enum NOT NULL,
  provider VARCHAR(100),                    -- e.g., "Salesforce", "Canvas", "Workday"

  -- Connection details
  api_endpoint TEXT,
  webhook_url TEXT,

  -- Authentication (encrypted storage recommended)
  auth_type VARCHAR(50) NOT NULL DEFAULT 'api_key',  -- api_key, oauth2, basic, jwt
  credentials_encrypted JSONB,              -- Encrypted credentials storage

  -- Status
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_sync_at TIMESTAMPTZ,
  last_sync_status VARCHAR(50),             -- success, failed, partial
  last_error_message TEXT,

  -- Sync configuration
  sync_frequency VARCHAR(50) DEFAULT 'daily',  -- realtime, hourly, daily, weekly, manual
  sync_direction VARCHAR(20) DEFAULT 'bidirectional',  -- inbound, outbound, bidirectional

  -- Data mapping
  field_mappings JSONB NOT NULL DEFAULT '{}'::jsonb,
  sync_settings JSONB NOT NULL DEFAULT '{
    "auto_create_users": false,
    "update_existing": true,
    "sync_placements": true
  }'::jsonb,

  -- Metadata
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ----------------------------------------------------------------------------
-- Bulk Onboarding Jobs: Track mass user imports
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS bulk_onboarding_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  cohort_id UUID REFERENCES cohorts(id) ON DELETE SET NULL,  -- Optional cohort assignment

  -- Job details
  job_name VARCHAR(255),
  status onboarding_job_status_enum NOT NULL DEFAULT 'pending',

  -- Source information
  source_type VARCHAR(50) NOT NULL,         -- csv_upload, api_import, integration_sync
  source_file_url TEXT,
  source_integration_id UUID REFERENCES external_integrations(id) ON DELETE SET NULL,

  -- Processing stats
  total_records INTEGER NOT NULL DEFAULT 0,
  processed_records INTEGER NOT NULL DEFAULT 0,
  successful_records INTEGER NOT NULL DEFAULT 0,
  failed_records INTEGER NOT NULL DEFAULT 0,
  skipped_records INTEGER NOT NULL DEFAULT 0,

  -- Error tracking
  error_log JSONB NOT NULL DEFAULT '[]'::jsonb,  -- Array of { row, error, data }

  -- Options
  options JSONB NOT NULL DEFAULT '{
    "send_welcome_email": true,
    "skip_duplicates": true,
    "auto_assign_mentor": false,
    "default_role": "candidate"
  }'::jsonb,

  -- Timing
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,

  -- Actor
  initiated_by UUID REFERENCES profiles(id) ON DELETE SET NULL,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Cohorts
CREATE INDEX IF NOT EXISTS idx_cohorts_team ON cohorts(team_id);
CREATE INDEX IF NOT EXISTS idx_cohorts_status ON cohorts(team_id, status) WHERE status != 'archived';
CREATE INDEX IF NOT EXISTS idx_cohorts_dates ON cohorts(start_date, end_date);

-- Cohort Members
CREATE INDEX IF NOT EXISTS idx_cohort_members_cohort ON cohort_members(cohort_id);
CREATE INDEX IF NOT EXISTS idx_cohort_members_user ON cohort_members(user_id);
CREATE INDEX IF NOT EXISTS idx_cohort_members_active ON cohort_members(cohort_id, is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_cohort_members_placed ON cohort_members(cohort_id, placed_at) WHERE placed_at IS NOT NULL;

-- Program Analytics
CREATE INDEX IF NOT EXISTS idx_program_analytics_team ON program_analytics(team_id);
CREATE INDEX IF NOT EXISTS idx_program_analytics_cohort ON program_analytics(cohort_id);
CREATE INDEX IF NOT EXISTS idx_program_analytics_period ON program_analytics(period_start, period_end);
CREATE INDEX IF NOT EXISTS idx_program_analytics_lookup ON program_analytics(team_id, cohort_id, granularity, period_start);

-- ROI Reports
CREATE INDEX IF NOT EXISTS idx_roi_reports_team ON roi_reports(team_id);
CREATE INDEX IF NOT EXISTS idx_roi_reports_cohort ON roi_reports(cohort_id);
CREATE INDEX IF NOT EXISTS idx_roi_reports_status ON roi_reports(team_id, status);

-- Enterprise Branding
CREATE INDEX IF NOT EXISTS idx_enterprise_branding_domain ON enterprise_branding(custom_domain) WHERE custom_domain IS NOT NULL;

-- Compliance Logs
CREATE INDEX IF NOT EXISTS idx_compliance_logs_team ON compliance_logs(team_id);
CREATE INDEX IF NOT EXISTS idx_compliance_logs_actor ON compliance_logs(actor_id);
CREATE INDEX IF NOT EXISTS idx_compliance_logs_target ON compliance_logs(target_user_id);
CREATE INDEX IF NOT EXISTS idx_compliance_logs_event ON compliance_logs(team_id, event_type, created_at);
CREATE INDEX IF NOT EXISTS idx_compliance_logs_time ON compliance_logs(created_at);

-- External Integrations
CREATE INDEX IF NOT EXISTS idx_external_integrations_team ON external_integrations(team_id);
CREATE INDEX IF NOT EXISTS idx_external_integrations_type ON external_integrations(team_id, integration_type);
CREATE INDEX IF NOT EXISTS idx_external_integrations_active ON external_integrations(team_id, is_active) WHERE is_active = true;

-- Bulk Onboarding Jobs
CREATE INDEX IF NOT EXISTS idx_bulk_onboarding_team ON bulk_onboarding_jobs(team_id);
CREATE INDEX IF NOT EXISTS idx_bulk_onboarding_status ON bulk_onboarding_jobs(team_id, status);
CREATE INDEX IF NOT EXISTS idx_bulk_onboarding_cohort ON bulk_onboarding_jobs(cohort_id);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE cohorts ENABLE ROW LEVEL SECURITY;
ALTER TABLE cohort_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE program_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE roi_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE enterprise_branding ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE external_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE bulk_onboarding_jobs ENABLE ROW LEVEL SECURITY;

-- Helper function to check team admin status
CREATE OR REPLACE FUNCTION is_team_admin(p_team_id UUID, p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM team_members
    WHERE team_id = p_team_id
      AND user_id = p_user_id
      AND role = 'admin'
      AND is_active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to check enterprise subscription
CREATE OR REPLACE FUNCTION has_enterprise_subscription(p_team_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM team_subscriptions
    WHERE team_id = p_team_id
      AND tier = 'enterprise'
      AND status = 'active'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Cohorts: Team admins can manage, all team members can view
CREATE POLICY cohorts_select ON cohorts
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.team_id = cohorts.team_id
        AND team_members.user_id = auth.uid()
        AND team_members.is_active = true
    )
  );

CREATE POLICY cohorts_insert ON cohorts
  FOR INSERT WITH CHECK (is_team_admin(team_id, auth.uid()));

CREATE POLICY cohorts_update ON cohorts
  FOR UPDATE USING (is_team_admin(team_id, auth.uid()));

CREATE POLICY cohorts_delete ON cohorts
  FOR DELETE USING (is_team_admin(team_id, auth.uid()));

-- Cohort Members: Team admins can manage, mentors can view assigned, members can view own
CREATE POLICY cohort_members_select ON cohort_members
  FOR SELECT USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM cohorts c
      JOIN team_members tm ON tm.team_id = c.team_id
      WHERE c.id = cohort_members.cohort_id
        AND tm.user_id = auth.uid()
        AND tm.is_active = true
        AND tm.role IN ('admin', 'mentor')
    )
  );

CREATE POLICY cohort_members_insert ON cohort_members
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM cohorts c
      WHERE c.id = cohort_id
        AND is_team_admin(c.team_id, auth.uid())
    )
  );

CREATE POLICY cohort_members_update ON cohort_members
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM cohorts c
      WHERE c.id = cohort_members.cohort_id
        AND is_team_admin(c.team_id, auth.uid())
    )
  );

CREATE POLICY cohort_members_delete ON cohort_members
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM cohorts c
      WHERE c.id = cohort_members.cohort_id
        AND is_team_admin(c.team_id, auth.uid())
    )
  );

-- Program Analytics: Team members can view, admins can manage
CREATE POLICY program_analytics_select ON program_analytics
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.team_id = program_analytics.team_id
        AND team_members.user_id = auth.uid()
        AND team_members.is_active = true
    )
  );

CREATE POLICY program_analytics_insert ON program_analytics
  FOR INSERT WITH CHECK (is_team_admin(team_id, auth.uid()));

CREATE POLICY program_analytics_update ON program_analytics
  FOR UPDATE USING (is_team_admin(team_id, auth.uid()));

CREATE POLICY program_analytics_delete ON program_analytics
  FOR DELETE USING (is_team_admin(team_id, auth.uid()));

-- ROI Reports: Team admins can manage, members can view published
CREATE POLICY roi_reports_select ON roi_reports
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.team_id = roi_reports.team_id
        AND team_members.user_id = auth.uid()
        AND team_members.is_active = true
    )
    AND (status = 'published' OR is_team_admin(team_id, auth.uid()))
  );

CREATE POLICY roi_reports_insert ON roi_reports
  FOR INSERT WITH CHECK (is_team_admin(team_id, auth.uid()));

CREATE POLICY roi_reports_update ON roi_reports
  FOR UPDATE USING (is_team_admin(team_id, auth.uid()));

CREATE POLICY roi_reports_delete ON roi_reports
  FOR DELETE USING (is_team_admin(team_id, auth.uid()));

-- Enterprise Branding: Team admins only
CREATE POLICY enterprise_branding_select ON enterprise_branding
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.team_id = enterprise_branding.team_id
        AND team_members.user_id = auth.uid()
        AND team_members.is_active = true
    )
  );

CREATE POLICY enterprise_branding_insert ON enterprise_branding
  FOR INSERT WITH CHECK (is_team_admin(team_id, auth.uid()));

CREATE POLICY enterprise_branding_update ON enterprise_branding
  FOR UPDATE USING (is_team_admin(team_id, auth.uid()));

CREATE POLICY enterprise_branding_delete ON enterprise_branding
  FOR DELETE USING (is_team_admin(team_id, auth.uid()));

-- Compliance Logs: Team admins can view, system can insert
CREATE POLICY compliance_logs_select ON compliance_logs
  FOR SELECT USING (is_team_admin(team_id, auth.uid()));

CREATE POLICY compliance_logs_insert ON compliance_logs
  FOR INSERT WITH CHECK (
    is_team_admin(team_id, auth.uid())
    OR EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.team_id = compliance_logs.team_id
        AND team_members.user_id = auth.uid()
        AND team_members.is_active = true
    )
  );

-- External Integrations: Team admins only
CREATE POLICY external_integrations_select ON external_integrations
  FOR SELECT USING (is_team_admin(team_id, auth.uid()));

CREATE POLICY external_integrations_insert ON external_integrations
  FOR INSERT WITH CHECK (is_team_admin(team_id, auth.uid()));

CREATE POLICY external_integrations_update ON external_integrations
  FOR UPDATE USING (is_team_admin(team_id, auth.uid()));

CREATE POLICY external_integrations_delete ON external_integrations
  FOR DELETE USING (is_team_admin(team_id, auth.uid()));

-- Bulk Onboarding Jobs: Team admins only
CREATE POLICY bulk_onboarding_jobs_select ON bulk_onboarding_jobs
  FOR SELECT USING (is_team_admin(team_id, auth.uid()));

CREATE POLICY bulk_onboarding_jobs_insert ON bulk_onboarding_jobs
  FOR INSERT WITH CHECK (is_team_admin(team_id, auth.uid()));

CREATE POLICY bulk_onboarding_jobs_update ON bulk_onboarding_jobs
  FOR UPDATE USING (is_team_admin(team_id, auth.uid()));

CREATE POLICY bulk_onboarding_jobs_delete ON bulk_onboarding_jobs
  FOR DELETE USING (is_team_admin(team_id, auth.uid()));

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Auto-update updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_cohorts_updated_at ON cohorts;
CREATE TRIGGER update_cohorts_updated_at
  BEFORE UPDATE ON cohorts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_cohort_members_updated_at ON cohort_members;
CREATE TRIGGER update_cohort_members_updated_at
  BEFORE UPDATE ON cohort_members
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_program_analytics_updated_at ON program_analytics;
CREATE TRIGGER update_program_analytics_updated_at
  BEFORE UPDATE ON program_analytics
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_roi_reports_updated_at ON roi_reports;
CREATE TRIGGER update_roi_reports_updated_at
  BEFORE UPDATE ON roi_reports
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_enterprise_branding_updated_at ON enterprise_branding;
CREATE TRIGGER update_enterprise_branding_updated_at
  BEFORE UPDATE ON enterprise_branding
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_external_integrations_updated_at ON external_integrations;
CREATE TRIGGER update_external_integrations_updated_at
  BEFORE UPDATE ON external_integrations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_bulk_onboarding_jobs_updated_at ON bulk_onboarding_jobs;
CREATE TRIGGER update_bulk_onboarding_jobs_updated_at
  BEFORE UPDATE ON bulk_onboarding_jobs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Update cohort enrollment count when members change
CREATE OR REPLACE FUNCTION update_cohort_enrollment_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE cohorts
    SET current_enrollment = current_enrollment + 1
    WHERE id = NEW.cohort_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE cohorts
    SET current_enrollment = current_enrollment - 1
    WHERE id = OLD.cohort_id;
    RETURN OLD;
  ELSIF TG_OP = 'UPDATE' AND OLD.is_active != NEW.is_active THEN
    IF NEW.is_active THEN
      UPDATE cohorts
      SET current_enrollment = current_enrollment + 1
      WHERE id = NEW.cohort_id;
    ELSE
      UPDATE cohorts
      SET current_enrollment = current_enrollment - 1
      WHERE id = NEW.cohort_id;
    END IF;
    RETURN NEW;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_cohort_enrollment ON cohort_members;
CREATE TRIGGER update_cohort_enrollment
  AFTER INSERT OR DELETE OR UPDATE OF is_active ON cohort_members
  FOR EACH ROW
  EXECUTE FUNCTION update_cohort_enrollment_count();

-- ============================================================================
-- DATABASE FUNCTIONS
-- ============================================================================

-- Get cohort statistics for a team
CREATE OR REPLACE FUNCTION get_cohort_stats(p_team_id UUID)
RETURNS TABLE (
  total_cohorts BIGINT,
  active_cohorts BIGINT,
  total_enrolled BIGINT,
  total_placed BIGINT,
  avg_placement_rate DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(DISTINCT c.id) as total_cohorts,
    COUNT(DISTINCT c.id) FILTER (WHERE c.status = 'active') as active_cohorts,
    COUNT(DISTINCT cm.id) FILTER (WHERE cm.is_active = true) as total_enrolled,
    COUNT(DISTINCT cm.id) FILTER (WHERE cm.placed_at IS NOT NULL) as total_placed,
    CASE
      WHEN COUNT(DISTINCT cm.id) FILTER (WHERE cm.is_active = true) > 0
      THEN ROUND(
        COUNT(DISTINCT cm.id) FILTER (WHERE cm.placed_at IS NOT NULL)::DECIMAL /
        COUNT(DISTINCT cm.id) FILTER (WHERE cm.is_active = true)::DECIMAL * 100, 2
      )
      ELSE 0
    END as avg_placement_rate
  FROM cohorts c
  LEFT JOIN cohort_members cm ON c.id = cm.cohort_id
  WHERE c.team_id = p_team_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get detailed cohort analytics
CREATE OR REPLACE FUNCTION get_cohort_analytics(p_cohort_id UUID)
RETURNS TABLE (
  enrolled_count BIGINT,
  active_count BIGINT,
  placed_count BIGINT,
  placement_rate DECIMAL,
  avg_salary INTEGER,
  avg_time_to_placement DECIMAL,
  industry_breakdown JSONB,
  completion_breakdown JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*) as enrolled_count,
    COUNT(*) FILTER (WHERE is_active = true) as active_count,
    COUNT(*) FILTER (WHERE placed_at IS NOT NULL) as placed_count,
    CASE
      WHEN COUNT(*) > 0
      THEN ROUND(COUNT(*) FILTER (WHERE placed_at IS NOT NULL)::DECIMAL / COUNT(*)::DECIMAL * 100, 2)
      ELSE 0
    END as placement_rate,
    AVG(placement_salary)::INTEGER as avg_salary,
    AVG(EXTRACT(EPOCH FROM (placed_at - enrolled_at)) / 86400) as avg_time_to_placement,
    COALESCE(
      jsonb_object_agg(
        COALESCE(placement_company, 'Unknown'),
        company_count
      ) FILTER (WHERE placement_company IS NOT NULL),
      '{}'::jsonb
    ) as industry_breakdown,
    jsonb_build_object(
      'in_progress', COUNT(*) FILTER (WHERE completion_status = 'in_progress'),
      'completed', COUNT(*) FILTER (WHERE completion_status = 'completed'),
      'withdrawn', COUNT(*) FILTER (WHERE completion_status = 'withdrawn'),
      'placed', COUNT(*) FILTER (WHERE completion_status = 'placed')
    ) as completion_breakdown
  FROM cohort_members
  LEFT JOIN LATERAL (
    SELECT placement_company, COUNT(*) as company_count
    FROM cohort_members cm2
    WHERE cm2.cohort_id = p_cohort_id
    GROUP BY placement_company
  ) company_stats ON true
  WHERE cohort_id = p_cohort_id
  GROUP BY company_stats.placement_company, company_stats.company_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- SEED DATA (Sample data for development/testing)
-- ============================================================================

-- Note: This seed data will only work if you have existing teams
-- In production, this would be run as part of team setup

-- Sample integration types for reference
COMMENT ON TYPE integration_type_enum IS 'Supported external integration types:
- lms: Canvas, Blackboard, Moodle
- sis: Banner, PeopleSoft, Ellucian
- crm: Salesforce, HubSpot
- calendar: Google Calendar, Outlook
- sso: Okta, Auth0, SAML
- analytics: Tableau, Power BI
- job_board: LinkedIn, Indeed, Handshake
- ats: Workday, Greenhouse, Lever
- custom_webhook: Custom API integrations';

-- Sample cohort settings reference
COMMENT ON TABLE cohorts IS 'Cohorts represent groups of job seekers in a program.
Settings JSONB structure:
{
  "auto_assign_mentors": boolean,
  "require_weekly_checkin": boolean,
  "enable_peer_networking": boolean,
  "share_aggregate_progress": boolean,
  "notification_preferences": {
    "milestone_alerts": boolean,
    "weekly_digest": boolean
  }
}';
