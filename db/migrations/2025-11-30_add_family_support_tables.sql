-- ============================================================================
-- UC-113: Family and Personal Support Integration
-- Migration: Create tables for family supporters, progress summaries,
-- milestones, resources, stress tracking, boundaries, and communications
-- ============================================================================

-- ============================================================================
-- ROLLBACK: Drop existing objects if re-running migration
-- Uses DO block to handle case where tables don't exist yet
-- ============================================================================

-- Drop helper functions first (they don't depend on tables existing)
DROP FUNCTION IF EXISTS is_family_supporter(uuid, uuid);
DROP FUNCTION IF EXISTS can_supporter_view(uuid, uuid, text);
DROP FUNCTION IF EXISTS update_family_updated_at();

-- Drop tables with CASCADE (this automatically drops policies, triggers, etc.)
DROP TABLE IF EXISTS family_communications CASCADE;
DROP TABLE IF EXISTS support_boundaries CASCADE;
DROP TABLE IF EXISTS stress_metrics CASCADE;
DROP TABLE IF EXISTS family_resources CASCADE;
DROP TABLE IF EXISTS family_milestones CASCADE;
DROP TABLE IF EXISTS family_progress_summaries CASCADE;
DROP TABLE IF EXISTS family_support_settings CASCADE;
DROP TABLE IF EXISTS family_supporters CASCADE;

-- Drop enum types
DROP TYPE IF EXISTS supporter_role_enum CASCADE;
DROP TYPE IF EXISTS supporter_status_enum CASCADE;
DROP TYPE IF EXISTS milestone_type_enum CASCADE;
DROP TYPE IF EXISTS stress_level_enum CASCADE;
DROP TYPE IF EXISTS mood_type_enum CASCADE;
DROP TYPE IF EXISTS boundary_type_enum CASCADE;
DROP TYPE IF EXISTS resource_category_enum CASCADE;
DROP TYPE IF EXISTS communication_type_enum CASCADE;

-- ============================================================================
-- CUSTOM ENUM TYPES
-- ============================================================================

-- Supporter relationship types
CREATE TYPE supporter_role_enum AS ENUM (
  'spouse',
  'partner',
  'parent',
  'sibling',
  'child',
  'friend',
  'mentor',
  'therapist',
  'other'
);

-- Supporter invitation status
CREATE TYPE supporter_status_enum AS ENUM (
  'pending',
  'active',
  'declined',
  'removed'
);

-- Milestone types for celebrations
CREATE TYPE milestone_type_enum AS ENUM (
  'first_application',
  'application_milestone',
  'first_interview',
  'interview_milestone',
  'offer_received',
  'offer_accepted',
  'skill_learned',
  'certification_earned',
  'networking_milestone',
  'goal_achieved',
  'streak_achieved',
  'custom'
);

-- Stress level tracking
CREATE TYPE stress_level_enum AS ENUM (
  'very_low',
  'low',
  'moderate',
  'high',
  'very_high'
);

-- Mood types for check-ins
CREATE TYPE mood_type_enum AS ENUM (
  'great',
  'good',
  'okay',
  'struggling',
  'overwhelmed'
);

-- Boundary types
CREATE TYPE boundary_type_enum AS ENUM (
  'communication_frequency',
  'topic_restriction',
  'advice_limitation',
  'timing_preference',
  'support_style',
  'custom'
);

-- Resource categories
CREATE TYPE resource_category_enum AS ENUM (
  'understanding_process',
  'effective_support',
  'what_not_to_say',
  'emotional_support',
  'practical_help',
  'celebrating_wins',
  'handling_rejection',
  'stress_management'
);

-- Communication types
CREATE TYPE communication_type_enum AS ENUM (
  'progress_update',
  'milestone_share',
  'general_update',
  'thank_you',
  'boundary_reminder',
  'custom'
);

-- ============================================================================
-- FAMILY SUPPORTERS TABLE
-- People invited to support the job seeker
-- ============================================================================

CREATE TABLE public.family_supporters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- User who invited the supporter
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  -- Supporter identity (may or may not have an account)
  supporter_email text NOT NULL,
  supporter_name text NOT NULL,
  supporter_user_id uuid REFERENCES profiles(id) ON DELETE SET NULL,

  -- Relationship info
  role supporter_role_enum NOT NULL DEFAULT 'other',
  custom_role_name text,

  -- Invitation status
  status supporter_status_enum NOT NULL DEFAULT 'pending',
  invitation_token text UNIQUE,
  invitation_message text,
  invited_at timestamptz NOT NULL DEFAULT now(),
  accepted_at timestamptz,
  declined_at timestamptz,

  -- Access permissions (what they can see)
  can_view_applications boolean NOT NULL DEFAULT true,
  can_view_interviews boolean NOT NULL DEFAULT true,
  can_view_progress boolean NOT NULL DEFAULT true,
  can_view_milestones boolean NOT NULL DEFAULT true,
  can_view_stress boolean NOT NULL DEFAULT false,
  can_send_encouragement boolean NOT NULL DEFAULT true,

  -- Activity tracking
  last_viewed_at timestamptz,
  view_count integer NOT NULL DEFAULT 0,
  encouragements_sent integer NOT NULL DEFAULT 0,

  -- Notification preferences
  notify_on_milestones boolean NOT NULL DEFAULT true,
  notify_on_updates boolean NOT NULL DEFAULT false,
  notify_frequency text DEFAULT 'weekly',

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  -- Ensure unique supporter per user
  CONSTRAINT unique_supporter_per_user UNIQUE (user_id, supporter_email)
);

-- Indexes
CREATE INDEX idx_family_supporters_user ON family_supporters(user_id) WHERE status = 'active';
CREATE INDEX idx_family_supporters_email ON family_supporters(supporter_email);
CREATE INDEX idx_family_supporters_token ON family_supporters(invitation_token) WHERE invitation_token IS NOT NULL;

-- ============================================================================
-- FAMILY SUPPORT SETTINGS TABLE
-- Global settings for family support feature
-- ============================================================================

CREATE TABLE public.family_support_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,

  -- Feature toggles
  family_support_enabled boolean NOT NULL DEFAULT true,
  auto_share_milestones boolean NOT NULL DEFAULT false,

  -- Default permissions for new supporters
  default_view_applications boolean NOT NULL DEFAULT true,
  default_view_interviews boolean NOT NULL DEFAULT true,
  default_view_progress boolean NOT NULL DEFAULT true,
  default_view_milestones boolean NOT NULL DEFAULT true,
  default_view_stress boolean NOT NULL DEFAULT false,

  -- Privacy settings
  hide_salary_info boolean NOT NULL DEFAULT true,
  hide_rejection_details boolean NOT NULL DEFAULT true,
  hide_company_names boolean NOT NULL DEFAULT false,

  -- Notification settings
  digest_frequency text DEFAULT 'weekly',

  -- Well-being settings
  stress_tracking_enabled boolean NOT NULL DEFAULT true,
  stress_alert_threshold stress_level_enum DEFAULT 'high',

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================================
-- FAMILY PROGRESS SUMMARIES TABLE
-- Family-friendly progress summaries (no sensitive details)
-- ============================================================================

CREATE TABLE public.family_progress_summaries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  -- Summary period
  period_start date NOT NULL,
  period_end date NOT NULL,
  period_type text NOT NULL DEFAULT 'weekly' CHECK (period_type IN ('daily', 'weekly', 'monthly')),

  -- Summary content (family-friendly)
  title text NOT NULL,
  summary_text text NOT NULL,

  -- Metrics (sanitized - no salary, no rejection details)
  applications_sent integer NOT NULL DEFAULT 0,
  interviews_scheduled integer NOT NULL DEFAULT 0,
  interviews_completed integer NOT NULL DEFAULT 0,
  skills_practiced integer NOT NULL DEFAULT 0,
  networking_activities integer NOT NULL DEFAULT 0,

  -- Mood/well-being summary
  overall_mood mood_type_enum,
  mood_trend text CHECK (mood_trend IN ('improving', 'stable', 'declining')),

  -- Highlights (positive focus)
  highlights jsonb DEFAULT '[]'::jsonb,

  -- What's coming up
  upcoming_events jsonb DEFAULT '[]'::jsonb,

  -- Sharing
  is_shared boolean NOT NULL DEFAULT false,
  shared_at timestamptz,
  shared_with_all boolean NOT NULL DEFAULT true,
  shared_with_supporters uuid[] DEFAULT ARRAY[]::uuid[],

  -- Engagement
  view_count integer NOT NULL DEFAULT 0,
  encouragement_count integer NOT NULL DEFAULT 0,

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_family_summaries_user ON family_progress_summaries(user_id, period_end DESC);
CREATE INDEX idx_family_summaries_shared ON family_progress_summaries(user_id) WHERE is_shared = true;

-- ============================================================================
-- FAMILY MILESTONES TABLE
-- Shareable achievements and celebrations
-- ============================================================================

CREATE TABLE public.family_milestones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  -- Milestone details
  milestone_type milestone_type_enum NOT NULL,
  title text NOT NULL,
  description text,

  -- Achievement value (e.g., "10" for 10 applications)
  milestone_value integer,

  -- Related entities (optional)
  related_job_id bigint REFERENCES jobs(id) ON DELETE SET NULL,

  -- Celebration content
  celebration_message text,
  celebration_emoji text DEFAULT '🎉',

  -- Sharing settings
  is_shared boolean NOT NULL DEFAULT false,
  shared_at timestamptz,
  shared_with_all boolean NOT NULL DEFAULT true,
  shared_with_supporters uuid[] DEFAULT ARRAY[]::uuid[],

  -- Engagement
  view_count integer NOT NULL DEFAULT 0,
  reactions jsonb DEFAULT '[]'::jsonb,

  -- Auto-generated or manual
  is_auto_generated boolean NOT NULL DEFAULT false,

  achieved_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_family_milestones_user ON family_milestones(user_id, achieved_at DESC);
CREATE INDEX idx_family_milestones_shared ON family_milestones(user_id) WHERE is_shared = true;

-- ============================================================================
-- FAMILY RESOURCES TABLE
-- Educational resources for family members
-- ============================================================================

CREATE TABLE public.family_resources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Resource content
  title text NOT NULL,
  description text,
  category resource_category_enum NOT NULL,

  -- Content
  content_type text NOT NULL CHECK (content_type IN ('article', 'video', 'guide', 'checklist', 'tip')),
  content_url text,
  content_body text,

  -- Metadata
  estimated_read_time integer, -- in minutes
  author text,
  source text,

  -- Targeting
  target_audience text[] DEFAULT ARRAY['all']::text[], -- ['spouse', 'parent', 'friend']

  -- Display
  display_order integer NOT NULL DEFAULT 0,
  is_featured boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,

  -- Engagement tracking
  view_count integer NOT NULL DEFAULT 0,
  helpful_count integer NOT NULL DEFAULT 0,

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Index for resource discovery
CREATE INDEX idx_family_resources_category ON family_resources(category) WHERE is_active = true;
CREATE INDEX idx_family_resources_featured ON family_resources(is_featured, display_order) WHERE is_active = true;

-- ============================================================================
-- STRESS METRICS TABLE
-- Well-being and stress tracking
-- ============================================================================

CREATE TABLE public.stress_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  -- Date of check-in
  check_in_date date NOT NULL,
  check_in_time timestamptz NOT NULL DEFAULT now(),

  -- Stress and mood levels
  stress_level stress_level_enum NOT NULL,
  mood mood_type_enum NOT NULL,

  -- Numeric scale (1-10)
  stress_score integer NOT NULL CHECK (stress_score >= 1 AND stress_score <= 10),
  energy_level integer CHECK (energy_level >= 1 AND energy_level <= 10),
  motivation_level integer CHECK (motivation_level >= 1 AND motivation_level <= 10),

  -- Notes
  notes text,

  -- Triggers/factors
  stress_factors text[] DEFAULT ARRAY[]::text[],
  positive_factors text[] DEFAULT ARRAY[]::text[],

  -- Self-care activities
  self_care_activities text[] DEFAULT ARRAY[]::text[],

  -- Sleep quality (1-10)
  sleep_quality integer CHECK (sleep_quality >= 1 AND sleep_quality <= 10),

  -- Job search specific
  job_search_hours numeric(4,2),
  applications_today integer DEFAULT 0,

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  -- One check-in per day
  CONSTRAINT unique_daily_checkin UNIQUE (user_id, check_in_date)
);

-- Indexes
CREATE INDEX idx_stress_metrics_user ON stress_metrics(user_id, check_in_date DESC);
CREATE INDEX idx_stress_high ON stress_metrics(user_id, stress_level)
  WHERE stress_level IN ('high', 'very_high');

-- ============================================================================
-- SUPPORT BOUNDARIES TABLE
-- Healthy support dynamics and communication preferences
-- ============================================================================

CREATE TABLE public.support_boundaries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  -- Boundary details
  boundary_type boundary_type_enum NOT NULL,
  title text NOT NULL,
  description text NOT NULL,

  -- For specific supporters or all
  applies_to_all boolean NOT NULL DEFAULT true,
  applies_to_supporters uuid[] DEFAULT ARRAY[]::uuid[],

  -- Example phrases (what TO say instead)
  positive_alternatives text[] DEFAULT ARRAY[]::text[],

  -- Visibility
  is_active boolean NOT NULL DEFAULT true,
  show_to_supporters boolean NOT NULL DEFAULT true,

  -- Display order
  display_order integer NOT NULL DEFAULT 0,

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Index
CREATE INDEX idx_support_boundaries_user ON support_boundaries(user_id) WHERE is_active = true;

-- ============================================================================
-- FAMILY COMMUNICATIONS TABLE
-- Update messages to family supporters
-- ============================================================================

CREATE TABLE public.family_communications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  -- Communication type
  communication_type communication_type_enum NOT NULL,

  -- Content
  subject text,
  message_body text NOT NULL,

  -- Recipients
  sent_to_all boolean NOT NULL DEFAULT true,
  recipient_ids uuid[] DEFAULT ARRAY[]::uuid[],

  -- Related content (optional)
  related_milestone_id uuid REFERENCES family_milestones(id) ON DELETE SET NULL,
  related_summary_id uuid REFERENCES family_progress_summaries(id) ON DELETE SET NULL,

  -- Status
  is_sent boolean NOT NULL DEFAULT false,
  sent_at timestamptz,

  -- Engagement
  read_by jsonb DEFAULT '[]'::jsonb, -- [{supporter_id, read_at}]
  read_count integer NOT NULL DEFAULT 0,

  -- Template used (if any)
  template_name text,

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Index
CREATE INDEX idx_family_communications_user ON family_communications(user_id, sent_at DESC);

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Auto-update updated_at timestamps
CREATE OR REPLACE FUNCTION update_family_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_family_supporters_updated_at
  BEFORE UPDATE ON family_supporters
  FOR EACH ROW EXECUTE FUNCTION update_family_updated_at();

CREATE TRIGGER update_family_support_settings_updated_at
  BEFORE UPDATE ON family_support_settings
  FOR EACH ROW EXECUTE FUNCTION update_family_updated_at();

CREATE TRIGGER update_family_progress_summaries_updated_at
  BEFORE UPDATE ON family_progress_summaries
  FOR EACH ROW EXECUTE FUNCTION update_family_updated_at();

CREATE TRIGGER update_family_milestones_updated_at
  BEFORE UPDATE ON family_milestones
  FOR EACH ROW EXECUTE FUNCTION update_family_updated_at();

CREATE TRIGGER update_stress_metrics_updated_at
  BEFORE UPDATE ON stress_metrics
  FOR EACH ROW EXECUTE FUNCTION update_family_updated_at();

CREATE TRIGGER update_support_boundaries_updated_at
  BEFORE UPDATE ON support_boundaries
  FOR EACH ROW EXECUTE FUNCTION update_family_updated_at();

CREATE TRIGGER update_family_communications_updated_at
  BEFORE UPDATE ON family_communications
  FOR EACH ROW EXECUTE FUNCTION update_family_updated_at();

-- ============================================================================
-- SECURITY DEFINER HELPER FUNCTIONS
-- ============================================================================

-- Check if a user is a supporter for another user
CREATE OR REPLACE FUNCTION is_family_supporter(p_user_id uuid, p_supporter_user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM family_supporters
    WHERE user_id = p_user_id
    AND supporter_user_id = p_supporter_user_id
    AND status = 'active'
  );
$$;

-- Check if supporter can view specific content type
CREATE OR REPLACE FUNCTION can_supporter_view(p_user_id uuid, p_supporter_user_id uuid, p_content_type text)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM family_supporters
    WHERE user_id = p_user_id
    AND supporter_user_id = p_supporter_user_id
    AND status = 'active'
    AND (
      (p_content_type = 'applications' AND can_view_applications = true) OR
      (p_content_type = 'interviews' AND can_view_interviews = true) OR
      (p_content_type = 'progress' AND can_view_progress = true) OR
      (p_content_type = 'milestones' AND can_view_milestones = true) OR
      (p_content_type = 'stress' AND can_view_stress = true)
    )
  );
$$;

-- ============================================================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE family_supporters ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_support_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_progress_summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE stress_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_boundaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_communications ENABLE ROW LEVEL SECURITY;

-- FAMILY SUPPORTERS POLICIES
CREATE POLICY "Users can view their own supporters"
  ON family_supporters FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can invite supporters"
  ON family_supporters FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their supporters"
  ON family_supporters FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can remove supporters"
  ON family_supporters FOR DELETE
  USING (user_id = auth.uid());

CREATE POLICY "Supporters can view their invitations"
  ON family_supporters FOR SELECT
  USING (supporter_user_id = auth.uid());

-- FAMILY SUPPORT SETTINGS POLICIES
CREATE POLICY "Users can view their settings"
  ON family_support_settings FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can create their settings"
  ON family_support_settings FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their settings"
  ON family_support_settings FOR UPDATE
  USING (user_id = auth.uid());

-- FAMILY PROGRESS SUMMARIES POLICIES
CREATE POLICY "Users can view their summaries"
  ON family_progress_summaries FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can create summaries"
  ON family_progress_summaries FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Supporters can view shared summaries"
  ON family_progress_summaries FOR SELECT
  USING (
    is_shared = true
    AND is_family_supporter(user_id, auth.uid())
    AND (shared_with_all = true OR auth.uid() = ANY(shared_with_supporters))
  );

-- FAMILY MILESTONES POLICIES
CREATE POLICY "Users can view their milestones"
  ON family_milestones FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can create milestones"
  ON family_milestones FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update milestones"
  ON family_milestones FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Supporters can view shared milestones"
  ON family_milestones FOR SELECT
  USING (
    is_shared = true
    AND is_family_supporter(user_id, auth.uid())
    AND (shared_with_all = true OR auth.uid() = ANY(shared_with_supporters))
  );

-- FAMILY RESOURCES POLICIES (public read)
CREATE POLICY "Anyone can view resources"
  ON family_resources FOR SELECT
  USING (is_active = true);

-- STRESS METRICS POLICIES (private - only user)
CREATE POLICY "Users can view their stress metrics"
  ON stress_metrics FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can create stress metrics"
  ON stress_metrics FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update stress metrics"
  ON stress_metrics FOR UPDATE
  USING (user_id = auth.uid());

-- SUPPORT BOUNDARIES POLICIES
CREATE POLICY "Users can view their boundaries"
  ON support_boundaries FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can create boundaries"
  ON support_boundaries FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update boundaries"
  ON support_boundaries FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete boundaries"
  ON support_boundaries FOR DELETE
  USING (user_id = auth.uid());

CREATE POLICY "Supporters can view boundaries"
  ON support_boundaries FOR SELECT
  USING (
    show_to_supporters = true
    AND is_active = true
    AND is_family_supporter(user_id, auth.uid())
    AND (applies_to_all = true OR auth.uid() = ANY(applies_to_supporters))
  );

-- FAMILY COMMUNICATIONS POLICIES
CREATE POLICY "Users can view their communications"
  ON family_communications FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can create communications"
  ON family_communications FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Supporters can view their communications"
  ON family_communications FOR SELECT
  USING (
    is_sent = true
    AND is_family_supporter(user_id, auth.uid())
    AND (sent_to_all = true OR auth.uid() = ANY(recipient_ids))
  );

-- ============================================================================
-- SEED DATA: Default Resources
-- ============================================================================

INSERT INTO family_resources (title, description, category, content_type, content_body, target_audience, display_order, is_featured)
VALUES
  -- Understanding the Process
  ('What a Job Search Really Looks Like',
   'A realistic overview of the modern job search process',
   'understanding_process',
   'article',
   'The job search process has evolved significantly. Today''s job seekers navigate online applications, automated screening systems, multiple interview rounds, and competitive markets. A typical search can take 3-6 months, with many applications needed for each interview opportunity. Understanding this helps set realistic expectations.',
   ARRAY['all'],
   1,
   true),

  ('The Hidden Challenges of Job Searching',
   'What your loved one might not tell you',
   'understanding_process',
   'article',
   'Job searching is emotionally exhausting. Rejection is common and impersonal. The uncertainty can be overwhelming. Your family member may struggle with confidence, isolation, and frustration while maintaining a brave face. Understanding these hidden challenges helps you provide better support.',
   ARRAY['all'],
   2,
   false),

  -- Effective Support
  ('How to Be a Supportive Partner During Job Search',
   'Practical ways to support without overwhelming',
   'effective_support',
   'guide',
   '1. Listen more than advise\n2. Ask how you can help specifically\n3. Celebrate small wins\n4. Maintain normalcy in daily life\n5. Be patient with mood fluctuations\n6. Offer practical help (meals, errands)\n7. Respect their process and timing\n8. Express confidence in their abilities',
   ARRAY['spouse', 'partner'],
   1,
   true),

  ('Supporting an Adult Child''s Job Search',
   'How parents can help without hovering',
   'effective_support',
   'guide',
   'Your adult child is capable and learning valuable skills through this process. Here''s how to help:\n\n1. Trust their approach\n2. Share connections thoughtfully, not constantly\n3. Avoid comparing to others\n4. Let them set the update frequency\n5. Offer financial support if possible without strings\n6. Remember: unsolicited advice often backfires',
   ARRAY['parent'],
   2,
   false),

  -- What NOT to Say
  ('10 Things NOT to Say to Someone Job Searching',
   'Well-meaning phrases that actually hurt',
   'what_not_to_say',
   'checklist',
   '❌ "Have you tried looking on Indeed?"\n❌ "My friend''s cousin got a job in 2 weeks"\n❌ "Are you being too picky?"\n❌ "Back in my day..."\n❌ "Any news?" (daily)\n❌ "What about that company I mentioned?"\n❌ "You should lower your expectations"\n❌ "At least you have free time"\n❌ "Why don''t you just take any job?"\n❌ "Is your resume good enough?"',
   ARRAY['all'],
   1,
   true),

  ('What TO Say Instead',
   'Supportive phrases that actually help',
   'what_not_to_say',
   'checklist',
   '✅ "I believe in you"\n✅ "How can I support you today?"\n✅ "Would you like to talk about it or take a break from the topic?"\n✅ "I''m proud of how hard you''re working"\n✅ "Let me know when you have news you want to share"\n✅ "Want to do something fun together?"\n✅ "Your skills are valuable"\n✅ "This is a difficult market for everyone"',
   ARRAY['all'],
   2,
   true),

  -- Emotional Support
  ('Recognizing Job Search Burnout',
   'Signs your loved one needs extra support',
   'emotional_support',
   'article',
   'Watch for these signs:\n- Withdrawal from activities they enjoy\n- Changes in sleep or appetite\n- Increased irritability or sadness\n- Loss of motivation to continue searching\n- Negative self-talk\n- Physical symptoms like headaches\n\nIf you notice these, gently suggest taking breaks and consider encouraging professional support.',
   ARRAY['all'],
   1,
   false),

  -- Celebrating Wins
  ('Celebrating Small Wins Matters',
   'Why every step forward deserves recognition',
   'celebrating_wins',
   'tip',
   'In a long job search, small wins keep motivation alive. Celebrate:\n- Every application submitted\n- Every interview scheduled\n- New skills learned\n- Networking connections made\n- Positive feedback received\n- Getting past screening rounds\n\nYour acknowledgment of these wins provides crucial emotional support.',
   ARRAY['all'],
   1,
   true),

  -- Handling Rejection
  ('When They Don''t Get the Job',
   'How to respond to rejection news',
   'handling_rejection',
   'guide',
   'When they share rejection news:\n\n1. Acknowledge their disappointment\n2. Avoid immediately jumping to solutions\n3. Let them process the emotion\n4. Remind them it''s not personal\n5. Don''t ask for details they don''t offer\n6. Suggest a comfort activity\n7. Wait for them to bring up next steps\n8. Express continued confidence in them',
   ARRAY['all'],
   1,
   true),

  -- Stress Management
  ('Encouraging Self-Care',
   'How to gently promote well-being',
   'stress_management',
   'guide',
   'Job searching is stressful. You can help by:\n\n1. Suggesting activities together (walks, movies)\n2. Respecting their need for alone time\n3. Not adding to their stress with pressure\n4. Helping maintain healthy routines\n5. Encouraging breaks from job searching\n6. Being a calm presence\n7. Modeling good self-care yourself',
   ARRAY['all'],
   1,
   false);

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================

GRANT ALL ON family_supporters TO authenticated;
GRANT ALL ON family_support_settings TO authenticated;
GRANT ALL ON family_progress_summaries TO authenticated;
GRANT ALL ON family_milestones TO authenticated;
GRANT SELECT ON family_resources TO authenticated;
GRANT ALL ON stress_metrics TO authenticated;
GRANT ALL ON support_boundaries TO authenticated;
GRANT ALL ON family_communications TO authenticated;
