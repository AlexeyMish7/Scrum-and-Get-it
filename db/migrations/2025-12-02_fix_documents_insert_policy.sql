-- Migration: Fix documents INSERT RLS policy
-- Description: Recreates the INSERT policy for documents table to ensure
--              authenticated users can insert documents with their own user_id.
-- Author: System
-- Date: 2025-12-02
--
-- Problem:
-- The INSERT policy "Users can create documents" may have issues or conflicts
-- that prevent valid inserts even when auth.uid() matches the user_id.
--
-- Solution:
-- Drop and recreate the policy with explicit permissive setting.

-- =====================================================================
-- STEP 1: Check current policies (for debugging)
-- =====================================================================
SELECT 'Current documents policies:' as info;
SELECT policyname, cmd, permissive, qual::text, with_check::text
FROM pg_policies
WHERE tablename = 'documents';

-- =====================================================================
-- STEP 2: Drop existing INSERT policy
-- =====================================================================
DROP POLICY IF EXISTS "Users can create documents" ON public.documents;

-- =====================================================================
-- STEP 3: Recreate INSERT policy with explicit settings
-- =====================================================================
-- The policy allows users to insert documents where:
-- 1. The user_id in the new row matches auth.uid()
-- 2. Policy is PERMISSIVE (allows the action if condition is true)

CREATE POLICY "Users can create documents"
  ON public.documents
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- =====================================================================
-- STEP 4: Verify the policy was created correctly
-- =====================================================================
SELECT 'Updated documents policies:' as info;
SELECT policyname, cmd, permissive, roles, with_check::text
FROM pg_policies
WHERE tablename = 'documents' AND cmd = 'INSERT';

-- =====================================================================
-- STEP 5: Grant necessary permissions
-- =====================================================================
-- Ensure authenticated users have INSERT permission on the table
GRANT INSERT ON public.documents TO authenticated;

-- Also ensure they can use the sequence for UUID generation
GRANT USAGE ON SCHEMA public TO authenticated;
