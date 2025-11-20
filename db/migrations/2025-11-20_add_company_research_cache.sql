-- Migration: Add company_research_cache table
-- Purpose: Cache VOLATILE company research data (news, recent events, market updates)
--          that changes frequently. Static company info goes in companies table.
--
-- Design:
-- - One entry per company (identified by company_id FK to companies table)
-- - 7-day TTL for volatile data (news, funding rounds, product launches)
-- - Shared across all users (no user_id column)
-- - Automatic cleanup of expired entries
-- - Companies table stores: name, industry, size, location, mission, website, etc.
-- - This table stores: recent news, market updates, leadership changes, quarterly reports

-- Create company research cache table
CREATE TABLE IF NOT EXISTS public.company_research_cache (
  id uuid NOT NULL DEFAULT gen_random_uuid(),

  -- Link to companies table (persistent company info lives there)
  company_id uuid NOT NULL UNIQUE,

  -- Volatile research data (expires after 7 days)
  -- Structure: { news: [], recentEvents: [], fundingRounds: [], leadershipChanges: [], quarterlyHighlights: [] }
  research_data jsonb NOT NULL DEFAULT '{
    "news": [],
    "recentEvents": [],
    "fundingRounds": [],
    "leadershipChanges": [],
    "quarterlyHighlights": []
  }'::jsonb,

  -- Metadata
  metadata jsonb DEFAULT '{
    "model": "gpt-4",
    "source": "ai-generated",
    "confidence": "high"
  }'::jsonb,

  -- Cache management
  generated_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '7 days'),
  last_accessed_at timestamptz NOT NULL DEFAULT now(),
  access_count integer NOT NULL DEFAULT 0,

  -- Timestamps
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  -- Primary key
  CONSTRAINT company_research_cache_pkey PRIMARY KEY (id),

  -- Foreign key to companies table
  CONSTRAINT company_research_cache_company_id_fkey FOREIGN KEY (company_id)
    REFERENCES public.companies(id) ON DELETE CASCADE
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_company_research_cache_company_id
  ON public.company_research_cache(company_id);

CREATE INDEX IF NOT EXISTS idx_company_research_cache_expires_at
  ON public.company_research_cache(expires_at);

CREATE INDEX IF NOT EXISTS idx_company_research_cache_last_accessed
  ON public.company_research_cache(last_accessed_at);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_company_research_cache_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER company_research_cache_updated_at_trigger
  BEFORE UPDATE ON public.company_research_cache
  FOR EACH ROW
  EXECUTE FUNCTION update_company_research_cache_updated_at();

-- RLS Policies (shared data - everyone can read, only system can write)
ALTER TABLE public.company_research_cache ENABLE ROW LEVEL SECURITY;

-- Policy: All authenticated users can view company research
CREATE POLICY "All users can view company research"
  ON public.company_research_cache
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy: Only service role can insert (prevents users from poisoning cache)
CREATE POLICY "Service role can insert company research"
  ON public.company_research_cache
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Policy: Only service role can update
CREATE POLICY "Service role can update company research"
  ON public.company_research_cache
  FOR UPDATE
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Policy: Only service role can delete
CREATE POLICY "Service role can delete company research"
  ON public.company_research_cache
  FOR DELETE
  TO service_role
  USING (true);

-- Helper function to normalize company names for lookups
CREATE OR REPLACE FUNCTION normalize_company_name(name text)
RETURNS text AS $$
BEGIN
  -- Convert to lowercase, trim whitespace, remove common suffixes
  RETURN lower(
    trim(
      regexp_replace(
        name,
        '\s+(inc\.?|llc\.?|corp\.?|corporation|limited|ltd\.?|co\.?)$',
        '',
        'i'
      )
    )
  );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to upsert company base info into companies table
-- Returns company_id for linking to research cache
CREATE OR REPLACE FUNCTION upsert_company_info(
  p_company_name text,
  p_industry text DEFAULT NULL,
  p_size text DEFAULT NULL,
  p_location text DEFAULT NULL,
  p_founded_year integer DEFAULT NULL,
  p_website text DEFAULT NULL,
  p_mission text DEFAULT NULL,
  p_description text DEFAULT NULL,
  p_company_data jsonb DEFAULT '{}'::jsonb
)
RETURNS uuid AS $$
DECLARE
  v_normalized text;
  v_company_id uuid;
BEGIN
  -- Normalize the company name for lookup
  v_normalized := normalize_company_name(p_company_name);

  -- Try to find existing company by normalized name
  SELECT id INTO v_company_id
  FROM public.companies
  WHERE lower(trim(name)) = v_normalized
  LIMIT 1;

  IF v_company_id IS NULL THEN
    -- Company doesn't exist, create it
    INSERT INTO public.companies (
      name,
      industry,
      company_size,
      headquarters_location,
      founded_year,
      website,
      description,
      company_data
    )
    VALUES (
      p_company_name,
      p_industry,
      p_size,
      p_location,
      p_founded_year,
      p_website,
      p_description,
      p_company_data
    )
    RETURNING id INTO v_company_id;
  ELSE
    -- Company exists, update with any new info (only non-null values)
    UPDATE public.companies
    SET
      industry = COALESCE(p_industry, industry),
      company_size = COALESCE(p_size, company_size),
      headquarters_location = COALESCE(p_location, headquarters_location),
      founded_year = COALESCE(p_founded_year, founded_year),
      website = COALESCE(p_website, website),
      description = COALESCE(p_description, description),
      company_data = company_data || p_company_data,
      updated_at = now()
    WHERE id = v_company_id;
  END IF;

  RETURN v_company_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get company research (base info + volatile research)
-- Returns combined data from companies table + company_research_cache
CREATE OR REPLACE FUNCTION get_company_research(p_company_name text)
RETURNS jsonb AS $$
DECLARE
  v_normalized text;
  v_company_id uuid;
  v_company_info jsonb;
  v_research_data jsonb;
  v_cache_age interval;
BEGIN
  -- Normalize the company name
  v_normalized := normalize_company_name(p_company_name);

  -- Find company by normalized name
  SELECT id INTO v_company_id
  FROM public.companies
  WHERE lower(trim(name)) = v_normalized
  LIMIT 1;

  IF v_company_id IS NULL THEN
    -- Company not found
    RETURN NULL;
  END IF;

  -- Get base company info from companies table
  SELECT jsonb_build_object(
    'companyId', id,
    'companyName', name,
    'industry', industry,
    'size', company_size,
    'location', headquarters_location,
    'founded', founded_year,
    'website', website,
    'description', description,
    'companyData', company_data,
    'logoUrl', logo_url
  ) INTO v_company_info
  FROM public.companies
  WHERE id = v_company_id;

  -- Try to get volatile research data from cache
  SELECT
    research_data,
    now() - generated_at
  INTO
    v_research_data,
    v_cache_age
  FROM public.company_research_cache
  WHERE company_id = v_company_id
    AND expires_at > now()
  LIMIT 1;

  IF v_research_data IS NOT NULL THEN
    -- Update access stats
    UPDATE public.company_research_cache
    SET
      last_accessed_at = now(),
      access_count = access_count + 1
    WHERE company_id = v_company_id;

    -- Return combined data with cache info
    RETURN v_company_info || v_research_data || jsonb_build_object(
      'cacheHit', true,
      'cacheAge', extract(epoch from v_cache_age),
      'source', 'cached'
    );
  ELSE
    -- No cached research, return just base company info
    RETURN v_company_info || jsonb_build_object(
      'cacheHit', false,
      'source', 'base-only'
    );
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to save volatile research data to cache
-- Assumes company base info already saved via upsert_company_info
CREATE OR REPLACE FUNCTION save_company_research(
  p_company_id uuid,
  p_research_data jsonb,
  p_metadata jsonb DEFAULT NULL
)
RETURNS uuid AS $$
DECLARE
  v_cache_id uuid;
BEGIN
  -- Upsert: insert or update
  INSERT INTO public.company_research_cache (
    company_id,
    research_data,
    metadata,
    generated_at,
    expires_at,
    last_accessed_at,
    access_count
  )
  VALUES (
    p_company_id,
    p_research_data,
    COALESCE(p_metadata, '{"model": "gpt-4", "source": "ai-generated"}'::jsonb),
    now(),
    now() + interval '7 days',
    now(),
    1
  )
  ON CONFLICT (company_id) DO UPDATE SET
    research_data = EXCLUDED.research_data,
    metadata = EXCLUDED.metadata,
    generated_at = now(),
    expires_at = now() + interval '7 days',
    last_accessed_at = now(),
    access_count = company_research_cache.access_count + 1,
    updated_at = now()
  RETURNING id INTO v_cache_id;

  RETURN v_cache_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to clean up expired company research cache
CREATE OR REPLACE FUNCTION cleanup_expired_company_research()
RETURNS integer AS $$
DECLARE
  deleted_count integer;
BEGIN
  DELETE FROM public.company_research_cache
  WHERE expires_at <= now();

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT SELECT ON public.company_research_cache TO authenticated;
GRANT SELECT ON public.companies TO authenticated;
GRANT EXECUTE ON FUNCTION get_company_research(text) TO authenticated;
GRANT EXECUTE ON FUNCTION upsert_company_info(text, text, text, text, integer, text, text, text, jsonb) TO service_role;
GRANT EXECUTE ON FUNCTION save_company_research(uuid, jsonb, jsonb) TO service_role;
GRANT EXECUTE ON FUNCTION cleanup_expired_company_research() TO service_role;
GRANT EXECUTE ON FUNCTION normalize_company_name(text) TO authenticated;

-- Function to get user's companies from jobs they're interested in
-- Returns distinct company names from user's saved/interested jobs
CREATE OR REPLACE FUNCTION get_user_companies(p_user_id uuid)
RETURNS TABLE(company_name text) AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT j.company_name
  FROM public.jobs j
  WHERE j.user_id = p_user_id
    AND j.company_name IS NOT NULL
    AND trim(j.company_name) != ''
    AND j.is_archived = false
  ORDER BY j.company_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execution to authenticated users
GRANT EXECUTE ON FUNCTION get_user_companies(uuid) TO authenticated;

-- Comments for documentation
COMMENT ON TABLE public.company_research_cache IS 'Shared cache of VOLATILE company research data (news, events). Base company info in companies table. 7-day TTL, accessible to all users.';
COMMENT ON COLUMN public.company_research_cache.company_id IS 'FK to companies table - links volatile research to persistent company record';
COMMENT ON COLUMN public.company_research_cache.research_data IS 'Volatile data: news, recent events, funding rounds, leadership changes, quarterly highlights';
COMMENT ON COLUMN public.company_research_cache.expires_at IS 'Cache expires after 7 days from generation (volatile data becomes stale)';
COMMENT ON COLUMN public.company_research_cache.access_count IS 'Number of times this cache entry has been accessed (shows popular companies)';
COMMENT ON FUNCTION get_company_research(text) IS 'Gets company info from companies table + volatile research from cache. Returns combined JSON. Updates access stats.';
COMMENT ON FUNCTION upsert_company_info(text, text, text, text, integer, text, text, text, jsonb) IS 'Creates or updates company base info in companies table. Returns company_id for linking research.';
COMMENT ON FUNCTION save_company_research(uuid, jsonb, jsonb) IS 'Saves volatile research data to cache. Upserts on conflict. Returns cache entry ID.';
COMMENT ON FUNCTION cleanup_expired_company_research() IS 'Deletes expired research cache entries. Returns count of deleted rows.';
COMMENT ON FUNCTION normalize_company_name(text) IS 'Normalizes company name for consistent lookups (lowercase, trimmed, no suffixes)';
COMMENT ON FUNCTION get_user_companies(uuid) IS 'Returns distinct company names from user''s interested jobs (non-archived) for quick-select in company research.';
