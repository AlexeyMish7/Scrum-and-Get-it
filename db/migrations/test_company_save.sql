-- Test script to verify company research saving works
-- Run this in Supabase SQL Editor to diagnose the issue

-- Step 1: Test if upsert_company_info function exists and works
DO $$
DECLARE
  test_company_id uuid;
BEGIN
  RAISE NOTICE '=== Testing upsert_company_info function ===';

  -- Try to call the function
  SELECT upsert_company_info(
    'Apple Inc',                     -- company_name
    'Technology',                    -- industry
    '10000+',                        -- size
    'Cupertino, CA',                 -- location
    1976,                            -- founded_year
    'https://apple.com',             -- website
    'Think Different',               -- mission
    'Consumer electronics company',  -- description
    '{"test": true}'::jsonb          -- company_data
  ) INTO test_company_id;

  IF test_company_id IS NULL THEN
    RAISE EXCEPTION 'upsert_company_info returned NULL - this is the problem!';
  ELSE
    RAISE NOTICE 'Success! Company ID: %', test_company_id;

    -- Verify the data was actually inserted
    IF EXISTS (SELECT 1 FROM public.companies WHERE id = test_company_id) THEN
      RAISE NOTICE 'Data verified in companies table';
    ELSE
      RAISE EXCEPTION 'Company ID returned but no data in table!';
    END IF;

    -- Step 2: Test save_company_research function
    DECLARE
      cache_id uuid;
    BEGIN
      RAISE NOTICE '=== Testing save_company_research function ===';

      SELECT save_company_research(
        test_company_id,                -- company_id
        '{"news": [{"title": "Test"}]}'::jsonb,  -- research_data
        '{"model": "test"}'::jsonb      -- metadata
      ) INTO cache_id;

      IF cache_id IS NULL THEN
        RAISE EXCEPTION 'save_company_research returned NULL!';
      ELSE
        RAISE NOTICE 'Success! Cache ID: %', cache_id;
      END IF;
    END;

    -- Clean up test data
    RAISE NOTICE '=== Cleaning up test data ===';
    DELETE FROM public.company_research_cache WHERE company_id = test_company_id;
    DELETE FROM public.companies WHERE id = test_company_id;
    RAISE NOTICE 'Test complete - all data cleaned up';
  END IF;
END $$;

-- Step 3: Check current policies on companies table
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'companies'
ORDER BY policyname;

-- Step 4: Check if functions have proper permissions
SELECT
  routine_name,
  grantee,
  privilege_type
FROM information_schema.routine_privileges
WHERE routine_name IN ('upsert_company_info', 'save_company_research', 'get_company_research')
ORDER BY routine_name, grantee;

-- Step 5: Check function security settings
SELECT
  p.proname AS function_name,
  CASE p.prosecdef
    WHEN true THEN 'SECURITY DEFINER'
    ELSE 'SECURITY INVOKER'
  END AS security_type,
  pg_get_userbyid(p.proowner) AS owner
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.proname IN ('upsert_company_info', 'save_company_research', 'get_company_research')
ORDER BY p.proname;
