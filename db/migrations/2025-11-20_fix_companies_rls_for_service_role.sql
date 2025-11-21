-- ============================================================================
-- Fix companies table RLS to allow service_role to insert/update
-- ============================================================================
-- Issue: Company research not saving when searched standalone (not from jobs)
-- Cause: RLS policies block service_role from creating companies
-- Solution: Functions use SECURITY DEFINER which should bypass RLS, but we need
--           to ensure the policies don't interfere with the functions

-- WHY THIS IS NEEDED:
-- 1. User searches for "Amazon" in Company Research page
-- 2. Backend generates AI research
-- 3. Backend calls upsert_company_info() function with service_role
-- 4. Function has SECURITY DEFINER so it should bypass RLS
-- 5. But RLS is still blocking the INSERT
-- 6. Migration adds explicit service_role permission to policies

-- ============================================================================
-- Step 1: Drop old restrictive policies
-- ============================================================================
DROP POLICY IF EXISTS "Authenticated users can create companies" ON public.companies;
DROP POLICY IF EXISTS "Authenticated users can update companies" ON public.companies;

-- ============================================================================
-- Step 2: Create new permissive policies for authenticated users
-- ============================================================================
-- Anyone authenticated can INSERT companies (shared resource)
CREATE POLICY "Anyone can create companies"
  ON public.companies
  FOR INSERT
  TO authenticated, service_role
  WITH CHECK (true);

-- Anyone authenticated can UPDATE companies (to keep data fresh)
CREATE POLICY "Anyone can update companies"
  ON public.companies
  FOR UPDATE
  TO authenticated, service_role
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- Step 3: Verify the policies are working
-- ============================================================================
-- Test: Insert a dummy company as service_role
-- This should succeed after migration
DO $$
DECLARE
  test_company_id uuid;
BEGIN
  -- Try to call the function (which uses service_role internally)
  SELECT upsert_company_info(
    'Test Company Migration Check',
    'Technology',
    '51-200',
    'San Francisco, CA',
    2020,
    'https://testcompany.com',
    'Testing migration',
    'This is a test company to verify the migration worked',
    '{"test": true}'::jsonb
  ) INTO test_company_id;

  IF test_company_id IS NULL THEN
    RAISE EXCEPTION 'Migration test failed - upsert_company_info returned NULL';
  END IF;

  -- Clean up test data
  DELETE FROM public.companies WHERE id = test_company_id;

  RAISE NOTICE 'Migration successful - company RLS policies now allow service_role operations';
END $$;

-- ============================================================================
-- Comments for documentation
-- ============================================================================
COMMENT ON POLICY "Anyone can create companies" ON public.companies IS
  'Allows authenticated users and service_role to create companies. Companies are shared resources across all users, so anyone can add new companies to the database.';

COMMENT ON POLICY "Anyone can update companies" ON public.companies IS
  'Allows authenticated users and service_role to update companies. Ensures company data stays fresh when new research is generated.';
