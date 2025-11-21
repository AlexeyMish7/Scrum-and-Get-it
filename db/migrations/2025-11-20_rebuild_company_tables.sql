-- =============================================
-- REBUILD COMPANY TABLES FROM SCRATCH
-- =============================================
-- This migration drops and recreates the companies and company_research_cache tables
-- with proper constraints, functions, and RLS policies that actually work.
--
-- Run this in Supabase SQL Editor to fix the company research save bug.
-- =============================================

-- Drop existing objects (in correct order to avoid dependency errors)
DROP TRIGGER IF EXISTS update_companies_updated_at ON companies;
DROP TRIGGER IF EXISTS update_company_research_cache_updated_at ON company_research_cache;

-- Drop all overloaded versions of functions (use CASCADE to drop all signatures)
DROP FUNCTION IF EXISTS save_company_research CASCADE;
DROP FUNCTION IF EXISTS get_company_research CASCADE;
DROP FUNCTION IF EXISTS upsert_company_info CASCADE;
DROP FUNCTION IF EXISTS normalize_company_name CASCADE;

DROP TABLE IF EXISTS company_research_cache CASCADE;
DROP TABLE IF EXISTS companies CASCADE;

-- =============================================
-- TABLE: companies
-- =============================================
-- Stores persistent company data that rarely changes
-- (name, industry, size, location, mission, culture, leadership, products)
CREATE TABLE companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  normalized_name TEXT GENERATED ALWAYS AS (LOWER(TRIM(name))) STORED,
  description TEXT,
  industry TEXT NOT NULL DEFAULT 'Unknown',

  -- Employee count ranges (exactly matching valid values)
  size TEXT CHECK (size IN (
    '1-10',
    '11-50',
    '51-200',
    '201-500',
    '501-1000',
    '1001-5000',
    '5001-10000',
    '10000+'
  )),

  founded_year TEXT,
  location TEXT,
  website TEXT,
  logo_url TEXT,
  stock_symbol TEXT,

  -- Structured data stored as JSONB for flexibility
  company_data JSONB DEFAULT '{}'::jsonb,
  -- Expected structure:
  -- {
  --   "mission": "text",
  --   "culture": { "type": "string", "perks": ["array"], "values": ["array"] },
  --   "leadership": [{ "name": "string", "title": "string", "bio": "string" }],
  --   "products": [{ "name": "string", "description": "string", "category": "string" }]
  -- }

  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  source TEXT DEFAULT 'ai',
  is_verified BOOLEAN DEFAULT false,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for fast lookups
CREATE INDEX idx_companies_normalized_name ON companies(normalized_name);
CREATE INDEX idx_companies_industry ON companies(industry);
CREATE INDEX idx_companies_size ON companies(size);

COMMENT ON TABLE companies IS 'Persistent company information that rarely changes';
COMMENT ON COLUMN companies.company_data IS 'JSONB field containing mission, culture, leadership, products';
COMMENT ON COLUMN companies.normalized_name IS 'Auto-generated lowercase normalized name for matching';

-- =============================================
-- TABLE: company_research_cache
-- =============================================
-- Stores volatile company data that changes frequently
-- (news, events, funding rounds, recent updates)
-- Has 7-day TTL to keep data fresh
CREATE TABLE company_research_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,

  -- Volatile research data
  research_data JSONB NOT NULL,
  -- Expected structure:
  -- {
  --   "news": [{ "title": "string", "date": "string", "source": "string", "url": "string" }],
  --   "events": [{ "name": "string", "date": "string", "type": "string" }],
  --   "funding": [{ "round": "string", "amount": "string", "date": "string", "investors": ["array"] }],
  --   "recent_updates": "text"
  -- }

  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  source TEXT DEFAULT 'ai',

  -- TTL: Auto-expires after 7 days
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days'),

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_company_research_cache_company_id ON company_research_cache(company_id);
CREATE INDEX idx_company_research_cache_expires_at ON company_research_cache(expires_at);

COMMENT ON TABLE company_research_cache IS 'Time-sensitive company data with 7-day cache expiry';
COMMENT ON COLUMN company_research_cache.expires_at IS 'Auto-set to NOW() + 7 days, can be refreshed';

-- =============================================
-- FUNCTION: upsert_company_info
-- =============================================
-- Inserts or updates company base info in companies table
-- Returns the company_id (UUID) for linking to cache table
--
-- Usage:
--   SELECT upsert_company_info('Apple', 'Technology', '10000+', 'Cupertino, CA', ...);
CREATE OR REPLACE FUNCTION upsert_company_info(
  p_company_name TEXT,
  p_industry TEXT DEFAULT 'Unknown',
  p_size TEXT DEFAULT NULL,
  p_location TEXT DEFAULT NULL,
  p_founded_year TEXT DEFAULT NULL,
  p_website TEXT DEFAULT NULL,
  p_description TEXT DEFAULT NULL,
  p_company_data JSONB DEFAULT '{}'::jsonb,
  p_source TEXT DEFAULT 'ai'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_company_id UUID;
  v_normalized_name TEXT;
BEGIN
  -- Normalize company name for matching (lowercase, trimmed)
  v_normalized_name := LOWER(TRIM(p_company_name));

  -- Upsert: Insert new or update existing company
  INSERT INTO companies (
    name,
    industry,
    size,
    location,
    founded_year,
    website,
    description,
    company_data,
    source,
    updated_at
  ) VALUES (
    p_company_name,
    COALESCE(p_industry, 'Unknown'),
    p_size, -- Can be NULL, will be validated by CHECK constraint if provided
    p_location,
    p_founded_year,
    p_website,
    p_description,
    COALESCE(p_company_data, '{}'::jsonb),
    COALESCE(p_source, 'ai'),
    NOW()
  )
  ON CONFLICT (name) DO UPDATE SET
    industry = COALESCE(EXCLUDED.industry, companies.industry),
    size = COALESCE(EXCLUDED.size, companies.size),
    location = COALESCE(EXCLUDED.location, companies.location),
    founded_year = COALESCE(EXCLUDED.founded_year, companies.founded_year),
    website = COALESCE(EXCLUDED.website, companies.website),
    description = COALESCE(EXCLUDED.description, companies.description),
    company_data = companies.company_data || EXCLUDED.company_data, -- Merge JSONB
    updated_at = NOW()
  RETURNING id INTO v_company_id;

  RETURN v_company_id;
END;
$$;

COMMENT ON FUNCTION upsert_company_info IS 'Upsert company base info, returns company_id UUID';

-- =============================================
-- FUNCTION: save_company_research
-- =============================================
-- Saves or refreshes company research cache data
-- Links to companies table via company_id
--
-- Usage:
--   SELECT save_company_research(
--     '123e4567-e89b-12d3-a456-426614174000',
--     '{"news": [...], "events": [...]}'::jsonb,
--     '{"source": "openai", "model": "gpt-4o-mini"}'::jsonb
--   );
CREATE OR REPLACE FUNCTION save_company_research(
  p_company_id UUID,
  p_research_data JSONB,
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_cache_id UUID;
BEGIN
  -- Delete old cache entries for this company (if any)
  DELETE FROM company_research_cache WHERE company_id = p_company_id;

  -- Insert new fresh cache entry with 7-day TTL
  INSERT INTO company_research_cache (
    company_id,
    research_data,
    metadata,
    source,
    expires_at,
    created_at,
    updated_at
  ) VALUES (
    p_company_id,
    p_research_data,
    COALESCE(p_metadata, '{}'::jsonb),
    COALESCE(p_metadata->>'source', 'ai'),
    NOW() + INTERVAL '7 days',
    NOW(),
    NOW()
  )
  RETURNING id INTO v_cache_id;

  RETURN v_cache_id;
END;
$$;

COMMENT ON FUNCTION save_company_research IS 'Save/refresh company research cache with 7-day TTL';

-- =============================================
-- FUNCTION: get_company_research
-- =============================================
-- Retrieves company info + research cache (if not expired)
-- Returns combined JSONB object or NULL if not found
--
-- Usage:
--   SELECT get_company_research('Apple', 'Technology');
CREATE OR REPLACE FUNCTION get_company_research(
  p_company_name TEXT,
  p_industry TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result JSONB;
  v_normalized_name TEXT;
BEGIN
  v_normalized_name := LOWER(TRIM(p_company_name));

  -- Query companies table joined with cache (only non-expired)
  SELECT jsonb_build_object(
    'company_id', c.id,
    'name', c.name,
    'industry', c.industry,
    'size', c.size,
    'location', c.location,
    'founded_year', c.founded_year,
    'website', c.website,
    'description', c.description,
    'company_data', c.company_data,
    'research_data', crc.research_data,
    'cached_at', crc.created_at,
    'expires_at', crc.expires_at,
    'is_cached', (crc.id IS NOT NULL AND crc.expires_at > NOW())
  )
  INTO v_result
  FROM companies c
  LEFT JOIN company_research_cache crc ON crc.company_id = c.id AND crc.expires_at > NOW()
  WHERE c.normalized_name = v_normalized_name
    AND (p_industry IS NULL OR c.industry = p_industry);

  RETURN v_result;
END;
$$;

COMMENT ON FUNCTION get_company_research IS 'Get company info + research cache (if fresh)';

-- =============================================
-- RLS POLICIES
-- =============================================
-- Enable Row Level Security
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_research_cache ENABLE ROW LEVEL SECURITY;

-- Policy: service_role can do everything (used by backend)
CREATE POLICY companies_service_role_all ON companies
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY company_research_cache_service_role_all ON company_research_cache
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Policy: authenticated users can read all companies
CREATE POLICY companies_authenticated_read ON companies
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY company_research_cache_authenticated_read ON company_research_cache
  FOR SELECT
  TO authenticated
  USING (true);

-- =============================================
-- TRIGGERS: Auto-update updated_at
-- =============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_companies_updated_at
  BEFORE UPDATE ON companies
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_company_research_cache_updated_at
  BEFORE UPDATE ON company_research_cache
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- GRANT PERMISSIONS
-- =============================================
-- Grant execute permissions on functions to service_role
GRANT EXECUTE ON FUNCTION upsert_company_info TO service_role;
GRANT EXECUTE ON FUNCTION save_company_research TO service_role;
GRANT EXECUTE ON FUNCTION get_company_research TO service_role;

-- Grant table access to service_role (belt and suspenders)
GRANT ALL ON companies TO service_role;
GRANT ALL ON company_research_cache TO service_role;

-- =============================================
-- VERIFICATION QUERIES
-- =============================================
-- Run these to verify the migration worked:

-- Check tables exist
-- SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('companies', 'company_research_cache');

-- Check functions exist
-- SELECT routine_name FROM information_schema.routines WHERE routine_schema = 'public' AND routine_name IN ('upsert_company_info', 'save_company_research', 'get_company_research');

-- Test insert (should work now)
-- SELECT upsert_company_info('Test Company', 'Technology', '10000+', 'San Francisco', '2020', 'https://test.com', 'A test company', '{"mission": "Test mission"}'::jsonb);

-- =============================================
-- DONE!
-- =============================================
-- Tables rebuilt with proper constraints
-- Functions fixed with correct JSONB handling
-- RLS policies set up for service_role access
-- =============================================
