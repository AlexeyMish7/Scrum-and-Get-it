-- =====================================================================
-- SALARY PROGRESSION ANALYTICS ENHANCEMENT
-- Sprint 3 - UC-100: Add structured salary offer and negotiation tracking
-- =====================================================================
-- Purpose: Extend job_notes table with structured salary tracking fields:
--   - Salary offer amounts (base salary offered vs negotiated)
--   - Offer timing and negotiation outcomes
--   - Total compensation breakdown (base + bonus + equity + benefits)
--   - Negotiation success tracking for analytics
-- This enables salary progression analysis, negotiation success rates,
-- and career advancement impact on compensation over time.
-- =====================================================================

-- Add salary tracking columns to existing job_notes table
ALTER TABLE public.job_notes
  ADD COLUMN IF NOT EXISTS offered_salary bigint,
  ADD COLUMN IF NOT EXISTS negotiated_salary bigint,
  ADD COLUMN IF NOT EXISTS offer_received_date date,
  ADD COLUMN IF NOT EXISTS negotiation_outcome text CHECK (negotiation_outcome IN ('accepted', 'declined', 'countered', 'pending', 'withdrawn')),
  ADD COLUMN IF NOT EXISTS total_compensation_breakdown jsonb DEFAULT '{}'::jsonb;

-- Add indexes for salary analytics queries
CREATE INDEX IF NOT EXISTS idx_job_notes_offers 
  ON public.job_notes(user_id, offer_received_date DESC) 
  WHERE offered_salary IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_job_notes_negotiation_outcome 
  ON public.job_notes(user_id, negotiation_outcome) 
  WHERE negotiation_outcome IS NOT NULL;

-- Add comments explaining the salary tracking schema
COMMENT ON COLUMN public.job_notes.offered_salary IS 
  'Base salary amount initially offered by employer (annual amount in dollars)';

COMMENT ON COLUMN public.job_notes.negotiated_salary IS 
  'Final negotiated base salary (annual amount in dollars). NULL if offer declined or pending.';

COMMENT ON COLUMN public.job_notes.offer_received_date IS 
  'Date when the offer was received';

COMMENT ON COLUMN public.job_notes.negotiation_outcome IS 
  'Outcome of salary negotiation: accepted/declined/countered/pending/withdrawn';

COMMENT ON COLUMN public.job_notes.total_compensation_breakdown IS 
  'Structured breakdown of total compensation package (JSONB):
   {
     "base_salary": number,
     "signing_bonus": number,
     "annual_bonus": number,
     "equity_value": number,
     "benefits_value": number,
     "total": number,
     "notes": string
   }';

-- Sample query to demonstrate salary progression analytics:
-- SELECT 
--   j.job_title,
--   j.company_name,
--   jn.offered_salary,
--   jn.negotiated_salary,
--   jn.offer_received_date,
--   jn.negotiation_outcome,
--   jn.total_compensation_breakdown->>'total' as total_comp
-- FROM job_notes jn
-- JOIN jobs j ON j.id = jn.job_id
-- WHERE jn.user_id = auth.uid()
--   AND jn.offered_salary IS NOT NULL
-- ORDER BY jn.offer_received_date DESC;
