-- Quick fix for upsert_company_info function
-- Problem: Function wasn't storing p_mission in company_data JSONB
-- Solution: Merge mission into company_data when inserting/updating

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
    -- Note: mission is stored in company_data JSONB, not as separate column
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
      jsonb_build_object('mission', p_mission) || p_company_data
    )
    RETURNING id INTO v_company_id;
  ELSE
    -- Company exists, update with any new info (only non-null values)
    -- Mission is merged into company_data JSONB
    UPDATE public.companies
    SET
      industry = COALESCE(p_industry, industry),
      company_size = COALESCE(p_size, company_size),
      headquarters_location = COALESCE(p_location, headquarters_location),
      founded_year = COALESCE(p_founded_year, founded_year),
      website = COALESCE(p_website, website),
      description = COALESCE(p_description, description),
      company_data = CASE
        WHEN p_mission IS NOT NULL
        THEN company_data || jsonb_build_object('mission', p_mission) || p_company_data
        ELSE company_data || p_company_data
      END,
      updated_at = now()
    WHERE id = v_company_id;
  END IF;

  RETURN v_company_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
