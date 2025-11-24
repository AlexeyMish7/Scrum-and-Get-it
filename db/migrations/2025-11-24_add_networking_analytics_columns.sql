-- =====================================================================
-- NETWORKING ANALYTICS ENHANCEMENT
-- Sprint 3: Add analytics tracking to existing contact_interactions
-- =====================================================================
-- Purpose: Extend contact_interactions table with analytics fields for:
--   - Referral tracking (did this interaction lead to a referral?)
--   - Job opportunity tracking (did this create a job lead?)
--   - Event ROI tracking (event name, outcome, value metrics)
--   - Value exchange tracking (mutual benefit assessment)
--   - Outcome measurement (quality metrics for each interaction)
-- =====================================================================

-- Add networking analytics columns to existing contact_interactions table
ALTER TABLE public.contact_interactions
  ADD COLUMN IF NOT EXISTS referral_generated boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS job_opportunity_created boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS event_name text,
  ADD COLUMN IF NOT EXISTS event_outcome text CHECK (event_outcome IN ('positive', 'neutral', 'negative', 'pending')),
  ADD COLUMN IF NOT EXISTS value_provided text,
  ADD COLUMN IF NOT EXISTS value_received text,
  ADD COLUMN IF NOT EXISTS follow_up_scheduled boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS interaction_quality integer CHECK (interaction_quality >= 1 AND interaction_quality <= 5),
  ADD COLUMN IF NOT EXISTS tags text[] DEFAULT ARRAY[]::text[];

-- Add indexes for analytics queries
CREATE INDEX IF NOT EXISTS idx_contact_interactions_referrals 
  ON public.contact_interactions(user_id, referral_generated) 
  WHERE referral_generated = true;

CREATE INDEX IF NOT EXISTS idx_contact_interactions_job_opportunities 
  ON public.contact_interactions(user_id, job_opportunity_created) 
  WHERE job_opportunity_created = true;

CREATE INDEX IF NOT EXISTS idx_contact_interactions_events 
  ON public.contact_interactions(user_id, event_name) 
  WHERE event_name IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_contact_interactions_quality 
  ON public.contact_interactions(user_id, interaction_quality) 
  WHERE interaction_quality IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_contact_interactions_occurred_at 
  ON public.contact_interactions(user_id, occurred_at DESC);

-- Add comment explaining the analytics schema
COMMENT ON COLUMN public.contact_interactions.referral_generated IS 
  'True if this interaction resulted in a referral to a job opportunity';

COMMENT ON COLUMN public.contact_interactions.job_opportunity_created IS 
  'True if this interaction led to a job opportunity or lead';

COMMENT ON COLUMN public.contact_interactions.event_name IS 
  'Name of networking event if this interaction occurred at an event';

COMMENT ON COLUMN public.contact_interactions.event_outcome IS 
  'Outcome quality of the networking event: positive/neutral/negative/pending';

COMMENT ON COLUMN public.contact_interactions.value_provided IS 
  'Brief description of value/help provided to contact (for reciprocity tracking)';

COMMENT ON COLUMN public.contact_interactions.value_received IS 
  'Brief description of value/help received from contact (for reciprocity tracking)';

COMMENT ON COLUMN public.contact_interactions.interaction_quality IS 
  'User-rated quality of interaction on 1-5 scale for ROI analysis';

COMMENT ON COLUMN public.contact_interactions.tags IS 
  'Flexible tags for categorizing interactions (e.g., coffee-chat, informational-interview)';
