-- Migration: Seed Default System Templates
-- Description: Populates templates table with 5 default resume templates
-- Author: System
-- Date: 2025-11-18

-- Clear existing system templates (user_id IS NULL) to avoid duplicates
DELETE FROM public.templates WHERE user_id IS NULL;

-- Insert CHRONOLOGICAL_RESUME (default template)
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
  NULL, -- system template
  'Professional Chronological',
  'resume',
  'chronological',
  jsonb_build_object(
    'columns', 1,
    'pageSize', 'letter',
    'margins', jsonb_build_object('top', 0.75, 'right', 0.75, 'bottom', 0.75, 'left', 0.75),
    'sectionOrder', jsonb_build_array(
      jsonb_build_object('id', 'header', 'name', 'Header', 'type', 'header', 'required', true, 'defaultEnabled', true),
      jsonb_build_object('id', 'summary', 'name', 'Summary', 'type', 'summary', 'required', false, 'defaultEnabled', true),
      jsonb_build_object('id', 'experience', 'name', 'Experience', 'type', 'experience', 'required', true, 'defaultEnabled', true),
      jsonb_build_object('id', 'education', 'name', 'Education', 'type', 'education', 'required', true, 'defaultEnabled', true),
      jsonb_build_object('id', 'skills', 'name', 'Skills', 'type', 'skills', 'required', true, 'defaultEnabled', true),
      jsonb_build_object('id', 'certifications', 'name', 'Certifications', 'type', 'certifications', 'required', false, 'defaultEnabled', true)
    )
  ),
  jsonb_build_object(
    'requiredSections', jsonb_build_array('header', 'experience', 'education', 'skills'),
    'optionalSections', jsonb_build_array('summary', 'certifications', 'projects'),
    'customSections', false,
    'maxSections', 10
  ),
  jsonb_build_object(
    'atsOptimized', true,
    'customizable', true,
    'skillsHighlight', true,
    'portfolioSupport', false,
    'photoSupport', false,
    'multiLanguage', false
  ),
  jsonb_build_object(
    'thumbnail', '/templates/chronological.png',
    'description', 'Traditional timeline-based resume with maximum ATS compatibility.',
    'industry', jsonb_build_array('Technology', 'Finance', 'Healthcare'),
    'experienceLevel', jsonb_build_array('Mid-level', 'Senior'),
    'tags', jsonb_build_array('professional', 'traditional', 'ats-friendly'),
    'usageCount', 0,
    'rating', 4.8
  ),
  1,
  '2025-01-01T00:00:00Z',
  '2025-01-01T00:00:00Z',
  'system',
  true, -- is_default
  true  -- is_public
);

-- Insert HYBRID_RESUME
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
  'Modern Hybrid',
  'resume',
  'hybrid',
  jsonb_build_object(
    'columns', 1,
    'pageSize', 'letter',
    'margins', jsonb_build_object('top', 0.7, 'right', 0.7, 'bottom', 0.7, 'left', 0.7),
    'sectionOrder', jsonb_build_array(
      jsonb_build_object('id', 'header', 'name', 'Header', 'type', 'header', 'required', true, 'defaultEnabled', true),
      jsonb_build_object('id', 'summary', 'name', 'Summary', 'type', 'summary', 'required', true, 'defaultEnabled', true),
      jsonb_build_object('id', 'skills', 'name', 'Skills', 'type', 'skills', 'required', true, 'defaultEnabled', true),
      jsonb_build_object('id', 'experience', 'name', 'Experience', 'type', 'experience', 'required', true, 'defaultEnabled', true),
      jsonb_build_object('id', 'education', 'name', 'Education', 'type', 'education', 'required', true, 'defaultEnabled', true),
      jsonb_build_object('id', 'certifications', 'name', 'Certifications', 'type', 'certifications', 'required', false, 'defaultEnabled', true)
    )
  ),
  jsonb_build_object(
    'requiredSections', jsonb_build_array('header', 'summary', 'skills', 'experience', 'education'),
    'optionalSections', jsonb_build_array('certifications', 'projects'),
    'customSections', false,
    'maxSections', 10
  ),
  jsonb_build_object(
    'atsOptimized', true,
    'customizable', true,
    'skillsHighlight', true,
    'portfolioSupport', false,
    'photoSupport', false,
    'multiLanguage', false
  ),
  jsonb_build_object(
    'thumbnail', '/templates/hybrid.png',
    'description', 'Combines skills with chronological history. Balanced approach.',
    'industry', jsonb_build_array('Technology', 'Business', 'Marketing'),
    'experienceLevel', jsonb_build_array('Entry-level', 'Mid-level', 'Senior'),
    'tags', jsonb_build_array('balanced', 'modern', 'versatile', 'recommended'),
    'usageCount', 0,
    'rating', 4.7
  ),
  1,
  '2025-01-01T00:00:00Z',
  '2025-01-01T00:00:00Z',
  'system',
  false,
  true
);

-- Insert FUNCTIONAL_RESUME
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
  'Skills-Based Functional',
  'resume',
  'functional',
  jsonb_build_object(
    'columns', 1,
    'pageSize', 'letter',
    'margins', jsonb_build_object('top', 0.75, 'right', 0.75, 'bottom', 0.75, 'left', 0.75),
    'sectionOrder', jsonb_build_array(
      jsonb_build_object('id', 'header', 'name', 'Header', 'type', 'header', 'required', true, 'defaultEnabled', true),
      jsonb_build_object('id', 'summary', 'name', 'Summary', 'type', 'summary', 'required', true, 'defaultEnabled', true),
      jsonb_build_object('id', 'skills', 'name', 'Skills', 'type', 'skills', 'required', true, 'defaultEnabled', true),
      jsonb_build_object('id', 'projects', 'name', 'Projects', 'type', 'projects', 'required', false, 'defaultEnabled', true),
      jsonb_build_object('id', 'experience', 'name', 'Experience', 'type', 'experience', 'required', true, 'defaultEnabled', true),
      jsonb_build_object('id', 'education', 'name', 'Education', 'type', 'education', 'required', true, 'defaultEnabled', true)
    )
  ),
  jsonb_build_object(
    'requiredSections', jsonb_build_array('header', 'summary', 'skills', 'experience', 'education'),
    'optionalSections', jsonb_build_array('projects', 'certifications'),
    'customSections', false,
    'maxSections', 10
  ),
  jsonb_build_object(
    'atsOptimized', false,
    'customizable', true,
    'skillsHighlight', true,
    'portfolioSupport', true,
    'photoSupport', false,
    'multiLanguage', false
  ),
  jsonb_build_object(
    'thumbnail', '/templates/functional.png',
    'description', 'Focus on skills and competencies. Ideal for career changers.',
    'industry', jsonb_build_array('Technology', 'Creative', 'Consulting'),
    'experienceLevel', jsonb_build_array('Entry-level', 'Career-change'),
    'tags', jsonb_build_array('skills-focused', 'career-change', 'modern'),
    'usageCount', 0,
    'rating', 4.3
  ),
  1,
  '2025-01-01T00:00:00Z',
  '2025-01-01T00:00:00Z',
  'system',
  false,
  true
);

-- Insert CREATIVE_RESUME
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
  'Creative Professional',
  'resume',
  'creative',
  jsonb_build_object(
    'columns', 2,
    'pageSize', 'letter',
    'margins', jsonb_build_object('top', 0.5, 'right', 0.5, 'bottom', 0.5, 'left', 0.5),
    'sectionOrder', jsonb_build_array(
      jsonb_build_object('id', 'header', 'name', 'Header', 'type', 'header', 'required', true, 'defaultEnabled', true),
      jsonb_build_object('id', 'summary', 'name', 'Summary', 'type', 'summary', 'required', true, 'defaultEnabled', true),
      jsonb_build_object('id', 'experience', 'name', 'Experience', 'type', 'experience', 'required', true, 'defaultEnabled', true),
      jsonb_build_object('id', 'skills', 'name', 'Skills', 'type', 'skills', 'required', true, 'defaultEnabled', true),
      jsonb_build_object('id', 'projects', 'name', 'Portfolio', 'type', 'projects', 'required', false, 'defaultEnabled', true),
      jsonb_build_object('id', 'education', 'name', 'Education', 'type', 'education', 'required', true, 'defaultEnabled', true)
    )
  ),
  jsonb_build_object(
    'requiredSections', jsonb_build_array('header', 'summary', 'experience', 'skills', 'education'),
    'optionalSections', jsonb_build_array('projects', 'awards'),
    'customSections', true,
    'maxSections', 12
  ),
  jsonb_build_object(
    'atsOptimized', false,
    'customizable', true,
    'skillsHighlight', true,
    'portfolioSupport', true,
    'photoSupport', true,
    'multiLanguage', false
  ),
  jsonb_build_object(
    'thumbnail', '/templates/creative.png',
    'description', 'Modern, visually striking design for creative professionals.',
    'industry', jsonb_build_array('Design', 'Creative', 'Marketing', 'Media'),
    'experienceLevel', jsonb_build_array('Entry-level', 'Mid-level'),
    'tags', jsonb_build_array('creative', 'design', 'visual', 'portfolio', 'modern'),
    'usageCount', 0,
    'rating', 4.5
  ),
  1,
  '2025-01-01T00:00:00Z',
  '2025-01-01T00:00:00Z',
  'system',
  false,
  true
);

-- Insert ACADEMIC_RESUME
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
  'Academic & Research',
  'resume',
  'academic',
  jsonb_build_object(
    'columns', 1,
    'pageSize', 'letter',
    'margins', jsonb_build_object('top', 1.0, 'right', 1.0, 'bottom', 1.0, 'left', 1.0),
    'sectionOrder', jsonb_build_array(
      jsonb_build_object('id', 'header', 'name', 'Header', 'type', 'header', 'required', true, 'defaultEnabled', true),
      jsonb_build_object('id', 'education', 'name', 'Education', 'type', 'education', 'required', true, 'defaultEnabled', true),
      jsonb_build_object('id', 'publications', 'name', 'Publications', 'type', 'publications', 'required', true, 'defaultEnabled', true),
      jsonb_build_object('id', 'experience', 'name', 'Research', 'type', 'experience', 'required', true, 'defaultEnabled', true),
      jsonb_build_object('id', 'awards', 'name', 'Awards', 'type', 'awards', 'required', false, 'defaultEnabled', true),
      jsonb_build_object('id', 'skills', 'name', 'Skills', 'type', 'skills', 'required', false, 'defaultEnabled', true)
    )
  ),
  jsonb_build_object(
    'requiredSections', jsonb_build_array('header', 'education', 'publications', 'experience'),
    'optionalSections', jsonb_build_array('awards', 'skills', 'certifications'),
    'customSections', true,
    'maxSections', 12
  ),
  jsonb_build_object(
    'atsOptimized', false,
    'customizable', true,
    'skillsHighlight', false,
    'portfolioSupport', false,
    'photoSupport', false,
    'multiLanguage', true
  ),
  jsonb_build_object(
    'thumbnail', '/templates/academic.png',
    'description', 'For academic positions with publications and research focus.',
    'industry', jsonb_build_array('Academia', 'Research', 'Education'),
    'experienceLevel', jsonb_build_array('Graduate', 'Postdoc', 'Faculty'),
    'tags', jsonb_build_array('academic', 'research', 'publications', 'teaching'),
    'usageCount', 0,
    'rating', 4.6
  ),
  1,
  '2025-01-01T00:00:00Z',
  '2025-01-01T00:00:00Z',
  'system',
  false,
  true
);

-- Verify templates were inserted
SELECT
  id,
  name,
  category,
  subtype,
  author,
  is_default,
  is_public,
  (metadata->>'rating')::float as rating
FROM public.templates
WHERE user_id IS NULL
ORDER BY is_default DESC, (metadata->>'rating')::float DESC;
