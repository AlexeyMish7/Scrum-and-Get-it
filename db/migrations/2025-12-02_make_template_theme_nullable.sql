-- Migration: Make template_id and theme_id nullable
-- Description: Allows documents and document_versions to be created without
--              template/theme references when using fallback templates.
-- Author: System
-- Date: 2025-12-02
--
-- Context:
-- When database templates/themes fail to load (empty database, network issues, etc.),
-- the frontend uses static fallback templates with string IDs like "resume-chronological"
-- instead of actual UUIDs. These can't be stored as foreign keys.
--
-- This migration makes template_id and theme_id nullable so documents can still be
-- created and saved even when template/theme references aren't available.

-- =====================================================================
-- PRE-CHECK: Show current state before changes
-- =====================================================================
SELECT 'BEFORE MIGRATION - Current column constraints:' as status;
SELECT
  table_name,
  column_name,
  is_nullable,
  data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN ('documents', 'document_versions')
  AND column_name IN ('template_id', 'theme_id')
ORDER BY table_name, column_name;

-- =====================================================================
-- STEP 1: Make template_id and theme_id nullable in documents table
-- =====================================================================

-- Drop the NOT NULL constraints (idempotent - won't error if already nullable)
ALTER TABLE public.documents
  ALTER COLUMN template_id DROP NOT NULL;

ALTER TABLE public.documents
  ALTER COLUMN theme_id DROP NOT NULL;

-- Add comment explaining why these are nullable
COMMENT ON COLUMN public.documents.template_id IS
  'Reference to template used. Nullable when using fallback templates that are not in database.';

COMMENT ON COLUMN public.documents.theme_id IS
  'Reference to theme used. Nullable when using fallback themes that are not in database.';


-- =====================================================================
-- STEP 2: Make template_id and theme_id nullable in document_versions table
-- =====================================================================

ALTER TABLE public.document_versions
  ALTER COLUMN template_id DROP NOT NULL;

ALTER TABLE public.document_versions
  ALTER COLUMN theme_id DROP NOT NULL;

COMMENT ON COLUMN public.document_versions.template_id IS
  'Reference to template used for this version. Nullable when using fallback templates.';

COMMENT ON COLUMN public.document_versions.theme_id IS
  'Reference to theme used for this version. Nullable when using fallback themes.';


-- =====================================================================
-- STEP 3: Verify changes
-- =====================================================================

-- Show current column definitions
SELECT
  table_name,
  column_name,
  is_nullable,
  data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN ('documents', 'document_versions')
  AND column_name IN ('template_id', 'theme_id')
ORDER BY table_name, column_name;
