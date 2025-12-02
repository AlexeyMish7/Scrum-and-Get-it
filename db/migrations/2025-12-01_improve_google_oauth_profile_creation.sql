-- Migration: Improve Google OAuth profile creation
-- Date: 2025-12-01
-- Purpose: Extract full_name, avatar_url from Google OAuth metadata when creating profiles
--          Google provides: full_name, name, picture, avatar_url in raw_user_meta_data
--          This ensures profiles are properly populated on first sign-in

-- =====================================================================
-- UPDATE TRIGGER FUNCTION
-- =====================================================================

-- Enhanced function to handle new user signup with better OAuth data extraction
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_first_name TEXT;
  v_last_name TEXT;
  v_full_name TEXT;
  v_avatar_url TEXT;
  v_metadata JSONB;
BEGIN
  -- Extract full_name from various OAuth provider formats
  -- Google: full_name, name
  -- LinkedIn: name, given_name + family_name
  -- Generic: first_name + last_name
  v_full_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'name',
    NULLIF(TRIM(CONCAT(
      COALESCE(NEW.raw_user_meta_data->>'given_name', NEW.raw_user_meta_data->>'first_name', ''),
      ' ',
      COALESCE(NEW.raw_user_meta_data->>'family_name', NEW.raw_user_meta_data->>'last_name', '')
    )), '')
  );

  -- Parse first_name and last_name from full_name if available
  IF v_full_name IS NOT NULL AND v_full_name != '' THEN
    -- Split on first space: everything before is first_name, rest is last_name
    v_first_name := SPLIT_PART(v_full_name, ' ', 1);
    v_last_name := TRIM(SUBSTRING(v_full_name FROM LENGTH(v_first_name) + 2));
  ELSE
    -- Fallback to individual fields or defaults
    v_first_name := COALESCE(
      NEW.raw_user_meta_data->>'first_name',
      NEW.raw_user_meta_data->>'given_name',
      'User'
    );
    v_last_name := COALESCE(
      NEW.raw_user_meta_data->>'last_name',
      NEW.raw_user_meta_data->>'family_name',
      ''
    );
  END IF;

  -- Extract avatar URL from OAuth metadata
  -- Google: picture, avatar_url
  -- LinkedIn: picture (from OIDC claims)
  -- Generic: image, profile_image_url
  v_avatar_url := COALESCE(
    NEW.raw_user_meta_data->>'picture',
    NEW.raw_user_meta_data->>'avatar_url',
    NEW.raw_user_meta_data->>'image',
    NEW.raw_user_meta_data->>'profile_image_url'
  );

  -- Build metadata JSON with avatar_path if we have an avatar URL
  IF v_avatar_url IS NOT NULL AND v_avatar_url != '' THEN
    v_metadata := jsonb_build_object('avatar_path', v_avatar_url);
  ELSE
    v_metadata := '{}'::jsonb;
  END IF;

  -- Create a profile record for the new user
  INSERT INTO public.profiles (
    id,
    first_name,
    last_name,
    email,
    metadata
  )
  VALUES (
    NEW.id,
    v_first_name,
    v_last_name,
    COALESCE(NEW.email, ''),
    v_metadata
  )
  ON CONFLICT (id) DO UPDATE SET
    -- Update only if current values are defaults/empty (don't overwrite user edits)
    first_name = CASE
      WHEN profiles.first_name IN ('User', '') THEN EXCLUDED.first_name
      ELSE profiles.first_name
    END,
    last_name = CASE
      WHEN profiles.last_name = '' THEN EXCLUDED.last_name
      ELSE profiles.last_name
    END,
    -- Merge metadata, preserving existing keys but adding avatar_path if missing
    metadata = CASE
      WHEN profiles.metadata IS NULL OR profiles.metadata = '{}'::jsonb THEN EXCLUDED.metadata
      WHEN profiles.metadata->>'avatar_path' IS NULL AND EXCLUDED.metadata->>'avatar_path' IS NOT NULL
        THEN profiles.metadata || EXCLUDED.metadata
      ELSE profiles.metadata
    END;

  RETURN NEW;
END;
$$;

-- =====================================================================
-- MIGRATION COMPLETE
-- =====================================================================

-- Summary:
--   ✅ Enhanced handle_new_user() to extract full_name from Google/LinkedIn OAuth
--   ✅ Extracts avatar/picture URL and stores in metadata.avatar_path
--   ✅ Uses ON CONFLICT DO UPDATE to fill missing data without overwriting user edits
--   ✅ Handles various OAuth provider metadata formats
--
-- Testing:
--   1. Sign in with Google as a new user
--   2. Check profiles table for correct first_name, last_name, and metadata.avatar_path
--   3. Verify avatar displays on profile page
--
-- Rollback (if needed):
--   -- Restore previous version from 2025-11-17_auto_create_profile_on_signup.sql
