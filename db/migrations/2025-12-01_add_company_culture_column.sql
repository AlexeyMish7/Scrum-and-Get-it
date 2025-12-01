-- Migration: Add company_culture column to interviews table
-- Allows tracking performance across different company types (startup, corporate, etc.)

ALTER TABLE interviews 
ADD COLUMN IF NOT EXISTS company_culture text;

-- Add index for company culture queries
CREATE INDEX IF NOT EXISTS idx_interviews_company_culture ON interviews(company_culture);

-- Add comment for documentation
COMMENT ON COLUMN interviews.company_culture IS 'Type of company culture: startup, corporate, mid-size, remote-first, consulting, agency, non-profit';
