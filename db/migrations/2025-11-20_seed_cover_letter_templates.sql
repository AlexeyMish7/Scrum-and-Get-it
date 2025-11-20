-- Migration: Seed Default Cover Letter Templates and Themes
-- Description: Adds cover letter templates and themes to the database
-- Author: System
-- Date: 2025-11-20

-- First, update the templates table to allow cover letter subtypes
ALTER TABLE public.templates
  DROP CONSTRAINT IF EXISTS templates_subtype_check;

ALTER TABLE public.templates
  ADD CONSTRAINT templates_subtype_check
  CHECK (subtype IN ('chronological', 'functional', 'hybrid', 'creative', 'academic', 'executive', 'simple', 'professional', 'modern'));

-- Clear existing cover letter templates
DELETE FROM public.templates WHERE category = 'cover-letter' AND user_id IS NULL;

-- Insert PROFESSIONAL_COVER_LETTER (default)
INSERT INTO public.templates (
  user_id,
  name,
  category,
  subtype,
  layout,
  schema,
  features,
  metadata,
  version,
  created_at,
  updated_at,
  author,
  is_default,
  is_public
) VALUES (
  NULL,
  'Professional Cover Letter',
  'cover-letter',
  'professional',
  jsonb_build_object(
    'columns', 1,
    'pageSize', 'letter',
    'margins', jsonb_build_object('top', 1.0, 'right', 1.0, 'bottom', 1.0, 'left', 1.0),
    'sectionOrder', jsonb_build_array(
      jsonb_build_object('id', 'header', 'name', 'Header', 'type', 'header', 'required', true, 'defaultEnabled', true),
      jsonb_build_object('id', 'recipient', 'name', 'Recipient', 'type', 'recipient', 'required', true, 'defaultEnabled', true),
      jsonb_build_object('id', 'opening', 'name', 'Opening', 'type', 'paragraph', 'required', true, 'defaultEnabled', true),
      jsonb_build_object('id', 'body', 'name', 'Body', 'type', 'paragraph', 'required', true, 'defaultEnabled', true),
      jsonb_build_object('id', 'closing', 'name', 'Closing', 'type', 'paragraph', 'required', true, 'defaultEnabled', true),
      jsonb_build_object('id', 'signature', 'name', 'Signature', 'type', 'signature', 'required', true, 'defaultEnabled', true)
    )
  ),
  jsonb_build_object(
    'requiredSections', jsonb_build_array('header', 'recipient', 'opening', 'body', 'closing', 'signature'),
    'optionalSections', jsonb_build_array(),
    'customSections', false,
    'maxSections', 6
  ),
  jsonb_build_object(
    'atsOptimized', true,
    'customizable', true,
    'skillsHighlight', false,
    'portfolioSupport', false,
    'photoSupport', false,
    'multiLanguage', false
  ),
  jsonb_build_object(
    'thumbnail', '/templates/cover-letter-professional.png',
    'description', 'Classic professional cover letter format.',
    'industry', jsonb_build_array('Technology', 'Finance', 'Healthcare', 'Business'),
    'experienceLevel', jsonb_build_array('Entry-level', 'Mid-level', 'Senior'),
    'tags', jsonb_build_array('professional', 'traditional', 'formal'),
    'usageCount', 0,
    'rating', 4.7
  ),
  1,
  NOW(),
  NOW(),
  'system',
  true,
  true
);

-- Insert MODERN_COVER_LETTER
INSERT INTO public.templates (
  user_id,
  name,
  category,
  subtype,
  layout,
  schema,
  features,
  metadata,
  version,
  created_at,
  updated_at,
  author,
  is_default,
  is_public
) VALUES (
  NULL,
  'Modern Cover Letter',
  'cover-letter',
  'modern',
  jsonb_build_object(
    'columns', 1,
    'pageSize', 'letter',
    'margins', jsonb_build_object('top', 0.75, 'right', 0.75, 'bottom', 0.75, 'left', 0.75),
    'sectionOrder', jsonb_build_array(
      jsonb_build_object('id', 'header', 'name', 'Header', 'type', 'header', 'required', true, 'defaultEnabled', true),
      jsonb_build_object('id', 'recipient', 'name', 'Recipient', 'type', 'recipient', 'required', true, 'defaultEnabled', true),
      jsonb_build_object('id', 'opening', 'name', 'Opening', 'type', 'paragraph', 'required', true, 'defaultEnabled', true),
      jsonb_build_object('id', 'body', 'name', 'Body', 'type', 'paragraph', 'required', true, 'defaultEnabled', true),
      jsonb_build_object('id', 'closing', 'name', 'Closing', 'type', 'paragraph', 'required', true, 'defaultEnabled', true),
      jsonb_build_object('id', 'signature', 'name', 'Signature', 'type', 'signature', 'required', true, 'defaultEnabled', true)
    )
  ),
  jsonb_build_object(
    'requiredSections', jsonb_build_array('header', 'recipient', 'opening', 'body', 'closing', 'signature'),
    'optionalSections', jsonb_build_array(),
    'customSections', false,
    'maxSections', 6
  ),
  jsonb_build_object(
    'atsOptimized', true,
    'customizable', true,
    'skillsHighlight', false,
    'portfolioSupport', false,
    'photoSupport', false,
    'multiLanguage', false
  ),
  jsonb_build_object(
    'thumbnail', '/templates/cover-letter-modern.png',
    'description', 'Contemporary cover letter with clean design.',
    'industry', jsonb_build_array('Technology', 'Startups', 'Creative', 'Marketing'),
    'experienceLevel', jsonb_build_array('Entry-level', 'Mid-level'),
    'tags', jsonb_build_array('modern', 'clean', 'minimal'),
    'usageCount', 0,
    'rating', 4.6
  ),
  1,
  NOW(),
  NOW(),
  'system',
  false,
  true
);

-- Insert SIMPLE_COVER_LETTER
INSERT INTO public.templates (
  user_id,
  name,
  category,
  subtype,
  layout,
  schema,
  features,
  metadata,
  version,
  created_at,
  updated_at,
  author,
  is_default,
  is_public
) VALUES (
  NULL,
  'Simple Cover Letter',
  'cover-letter',
  'simple',
  jsonb_build_object(
    'columns', 1,
    'pageSize', 'letter',
    'margins', jsonb_build_object('top', 1.0, 'right', 1.0, 'bottom', 1.0, 'left', 1.0),
    'sectionOrder', jsonb_build_array(
      jsonb_build_object('id', 'header', 'name', 'Header', 'type', 'header', 'required', true, 'defaultEnabled', true),
      jsonb_build_object('id', 'recipient', 'name', 'Recipient', 'type', 'recipient', 'required', true, 'defaultEnabled', true),
      jsonb_build_object('id', 'opening', 'name', 'Opening', 'type', 'paragraph', 'required', true, 'defaultEnabled', true),
      jsonb_build_object('id', 'body', 'name', 'Body', 'type', 'paragraph', 'required', true, 'defaultEnabled', true),
      jsonb_build_object('id', 'closing', 'name', 'Closing', 'type', 'paragraph', 'required', true, 'defaultEnabled', true),
      jsonb_build_object('id', 'signature', 'name', 'Signature', 'type', 'signature', 'required', true, 'defaultEnabled', true)
    )
  ),
  jsonb_build_object(
    'requiredSections', jsonb_build_array('header', 'recipient', 'opening', 'body', 'closing', 'signature'),
    'optionalSections', jsonb_build_array(),
    'customSections', false,
    'maxSections', 6
  ),
  jsonb_build_object(
    'atsOptimized', true,
    'customizable', true,
    'skillsHighlight', false,
    'portfolioSupport', false,
    'photoSupport', false,
    'multiLanguage', false
  ),
  jsonb_build_object(
    'thumbnail', '/templates/cover-letter-simple.png',
    'description', 'Straightforward cover letter with no frills.',
    'industry', jsonb_build_array('All Industries'),
    'experienceLevel', jsonb_build_array('Entry-level', 'Mid-level', 'Senior'),
    'tags', jsonb_build_array('simple', 'basic', 'universal'),
    'usageCount', 0,
    'rating', 4.5
  ),
  1,
  NOW(),
  NOW(),
  'system',
  false,
  true
);

-- Add cover letter-specific themes
DELETE FROM public.themes WHERE user_id IS NULL AND name LIKE '%Cover Letter%';

-- Professional Cover Letter Theme
INSERT INTO public.themes (
  user_id,
  name,
  category,
  colors,
  typography,
  spacing,
  metadata,
  created_at,
  updated_at,
  author,
  is_default,
  is_public
) VALUES (
  NULL,
  'Professional Cover Letter',
  'professional',
  jsonb_build_object(
    'primary', '#1a1a1a',
    'secondary', '#4a4a4a',
    'accent', '#2563eb',
    'background', jsonb_build_object('paper', '#ffffff', 'section', '#f9fafb', 'subtle', '#f3f4f6'),
    'text', jsonb_build_object('primary', '#1a1a1a', 'secondary', '#4a4a4a', 'muted', '#6b7280'),
    'border', '#e5e7eb'
  ),
  jsonb_build_object(
    'headingFont', jsonb_build_object('family', 'Georgia', 'variants', jsonb_build_array('400', '700'), 'source', 'system'),
    'bodyFont', jsonb_build_object('family', 'Times New Roman', 'variants', jsonb_build_array('400'), 'source', 'system'),
    'sizes', jsonb_build_object('h1', 18, 'h2', 14, 'h3', 12, 'body', 11, 'small', 10),
    'weights', jsonb_build_object('normal', 400, 'medium', 500, 'bold', 700),
    'lineHeight', jsonb_build_object('tight', 1.3, 'normal', 1.6, 'relaxed', 1.8)
  ),
  jsonb_build_object(
    'section', 16,
    'subsection', 12,
    'item', 8,
    'baseUnit', 4
  ),
  jsonb_build_object(
    'thumbnail', '/themes/cover-letter-professional.png',
    'description', 'Classic professional styling for cover letters.',
    'tags', jsonb_build_array('professional', 'traditional', 'formal'),
    'usageCount', 0,
    'rating', 4.8,
    'elements', jsonb_build_object(
      'paragraphIndent', false,
      'dateFormat', 'MMMM D, YYYY',
      'signatureStyle', 'handwritten'
    )
  ),
  NOW(),
  NOW(),
  'system',
  true,
  true
);

-- Modern Cover Letter Theme
INSERT INTO public.themes (
  user_id,
  name,
  category,
  colors,
  typography,
  spacing,
  metadata,
  created_at,
  updated_at,
  author,
  is_default,
  is_public
) VALUES (
  NULL,
  'Modern Cover Letter',
  'modern',
  jsonb_build_object(
    'primary', '#0f172a',
    'secondary', '#475569',
    'accent', '#3b82f6',
    'background', jsonb_build_object('paper', '#ffffff', 'section', '#f8fafc', 'subtle', '#f1f5f9'),
    'text', jsonb_build_object('primary', '#0f172a', 'secondary', '#475569', 'muted', '#94a3b8'),
    'border', '#e2e8f0'
  ),
  jsonb_build_object(
    'headingFont', jsonb_build_object('family', 'Inter', 'variants', jsonb_build_array('400', '600', '700'), 'source', 'google'),
    'bodyFont', jsonb_build_object('family', 'Inter', 'variants', jsonb_build_array('400'), 'source', 'google'),
    'sizes', jsonb_build_object('h1', 16, 'h2', 13, 'h3', 11, 'body', 10, 'small', 9),
    'weights', jsonb_build_object('normal', 400, 'medium', 600, 'bold', 700),
    'lineHeight', jsonb_build_object('tight', 1.3, 'normal', 1.5, 'relaxed', 1.7)
  ),
  jsonb_build_object(
    'section', 14,
    'subsection', 10,
    'item', 6,
    'baseUnit', 4
  ),
  jsonb_build_object(
    'thumbnail', '/themes/cover-letter-modern.png',
    'description', 'Contemporary cover letter styling.',
    'tags', jsonb_build_array('modern', 'clean', 'minimal'),
    'usageCount', 0,
    'rating', 4.7,
    'elements', jsonb_build_object(
      'paragraphIndent', false,
      'dateFormat', 'MMMM D, YYYY',
      'signatureStyle', 'typed'
    )
  ),
  NOW(),
  NOW(),
  'system',
  false,
  true
);

-- Clean Cover Letter Theme
INSERT INTO public.themes (
  user_id,
  name,
  category,
  colors,
  typography,
  spacing,
  metadata,
  created_at,
  updated_at,
  author,
  is_default,
  is_public
) VALUES (
  NULL,
  'Clean Cover Letter',
  'minimal',
  jsonb_build_object(
    'primary', '#000000',
    'secondary', '#666666',
    'accent', '#0066cc',
    'background', jsonb_build_object('paper', '#ffffff', 'section', '#fafafa', 'subtle', '#f5f5f5'),
    'text', jsonb_build_object('primary', '#000000', 'secondary', '#666666', 'muted', '#999999'),
    'border', '#dddddd'
  ),
  jsonb_build_object(
    'headingFont', jsonb_build_object('family', 'Arial', 'variants', jsonb_build_array('400', '700'), 'source', 'system'),
    'bodyFont', jsonb_build_object('family', 'Arial', 'variants', jsonb_build_array('400'), 'source', 'system'),
    'sizes', jsonb_build_object('h1', 16, 'h2', 13, 'h3', 11, 'body', 10, 'small', 9),
    'weights', jsonb_build_object('normal', 400, 'medium', 500, 'bold', 700),
    'lineHeight', jsonb_build_object('tight', 1.3, 'normal', 1.5, 'relaxed', 1.7)
  ),
  jsonb_build_object(
    'section', 12,
    'subsection', 8,
    'item', 6,
    'baseUnit', 4
  ),
  jsonb_build_object(
    'thumbnail', '/themes/cover-letter-clean.png',
    'description', 'Minimalist cover letter styling.',
    'tags', jsonb_build_array('clean', 'simple', 'minimal'),
    'usageCount', 0,
    'rating', 4.6,
    'elements', jsonb_build_object(
      'paragraphIndent', false,
      'dateFormat', 'MMMM D, YYYY',
      'signatureStyle', 'typed'
    )
  ),
  NOW(),
  NOW(),
  'system',
  false,
  true
);
