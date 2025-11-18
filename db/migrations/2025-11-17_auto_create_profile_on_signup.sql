-- Migration: Auto-create profile on user signup
-- Date: 2025-11-17
-- Purpose: Automatically create a profile record when a new user signs up
--          This prevents FK constraint errors when users try to add skills,
--          education, employment, etc. before completing their profile.

-- =====================================================================
-- CREATE TRIGGER FUNCTION
-- =====================================================================

-- Function to handle new user signup and create profile
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- Create a profile record for the new user
  -- Use COALESCE to provide defaults if metadata is missing
  INSERT INTO public.profiles (
    id,
    first_name,
    last_name,
    email
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'first_name', 'User'),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    COALESCE(NEW.email, '')
  )
  ON CONFLICT (id) DO NOTHING; -- In case profile already exists

  RETURN NEW;
END;
$$;

-- =====================================================================
-- CREATE TRIGGER ON auth.users
-- =====================================================================

-- Drop trigger if it exists (for idempotent migrations)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger that fires after a new user is inserted
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- =====================================================================
-- GRANT PERMISSIONS
-- =====================================================================

-- Grant necessary permissions for the trigger function
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, anon, authenticated, service_role;

-- =====================================================================
-- MIGRATION COMPLETE
-- =====================================================================

-- Summary:
--   ✅ Created handle_new_user() function to auto-create profile records
--   ✅ Created trigger on auth.users table that fires on INSERT
--   ✅ Profile will be created automatically with user's email and metadata
--   ✅ Uses ON CONFLICT DO NOTHING to prevent duplicate profile errors
--   ✅ SECURITY DEFINER ensures trigger runs with necessary permissions
--
-- Testing:
--   1. Sign up a new user via the app
--   2. Check that a profile record was created in public.profiles
--   3. Verify you can add skills/education/employment without FK errors
--
-- Rollback (if needed):
--   DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
--   DROP FUNCTION IF EXISTS public.handle_new_user();
