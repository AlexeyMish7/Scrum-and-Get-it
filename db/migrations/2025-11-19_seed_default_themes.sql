-- Migration: Seed Default System Themes
-- Description: Populates themes table with 8 default visual themes
-- Author: System
-- Date: 2025-11-19

-- Clear existing system themes (user_id IS NULL) to avoid duplicates
DELETE FROM public.themes WHERE user_id IS NULL;

-- ============================================================================
-- PROFESSIONAL THEME (Default)
-- Conservative, corporate-friendly styling
-- ============================================================================
INSERT INTO public.themes (
  user_id,
  name,
  category,
  colors,
  typography,
  spacing,
  effects,
  metadata,
  author,
  is_default,
  is_public,
  created_at,
  updated_at
) VALUES (
  NULL, -- system theme
  'Professional',
  'professional',
  jsonb_build_object(
    'primary', '#1a1a1a',
    'secondary', '#4a4a4a',
    'accent', '#2563eb',
    'text', jsonb_build_object(
      'primary', '#000000',
      'secondary', '#4a4a4a',
      'muted', '#6b7280'
    ),
    'background', jsonb_build_object(
      'paper', '#ffffff',
      'section', '#f9fafb',
      'subtle', '#f3f4f6'
    ),
    'border', '#d1d5db',
    'link', '#2563eb'
  ),
  jsonb_build_object(
    'fontFamily', jsonb_build_object(
      'heading', 'Georgia',
      'body', 'Arial',
      'mono', 'Courier New'
    ),
    'fontSize', jsonb_build_object(
      'name', 24,
      'heading', 16,
      'subheading', 14,
      'body', 11,
      'caption', 9
    ),
    'fontWeight', jsonb_build_object(
      'heading', 700,
      'subheading', 600,
      'emphasis', 500,
      'body', 400
    ),
    'lineHeight', jsonb_build_object(
      'tight', 1.2,
      'normal', 1.5,
      'relaxed', 1.75
    )
  ),
  jsonb_build_object(
    'section', 16,
    'subsection', 12,
    'item', 8,
    'compact', 4
  ),
  jsonb_build_object(
    'borderRadius', 0,
    'dividerStyle', 'line',
    'dividerWidth', 1,
    'shadowEnabled', false
  ),
  jsonb_build_object(
    'description', 'Conservative, corporate-friendly styling with serif headings and clean layout.',
    'tags', jsonb_build_array('professional', 'corporate', 'traditional', 'formal'),
    'previewImage', null
  ),
  'system',
  true, -- is_default
  true, -- is_public
  '2025-01-01T00:00:00Z',
  '2025-01-01T00:00:00Z'
);

-- ============================================================================
-- MODERN THEME
-- Bold, contemporary design with sans-serif fonts
-- ============================================================================
INSERT INTO public.themes (
  user_id, name, category, colors, typography, spacing, effects, metadata,
  author, is_default, is_public, created_at, updated_at
) VALUES (
  NULL,
  'Modern',
  'modern',
  jsonb_build_object(
    'primary', '#0f172a',
    'secondary', '#334155',
    'accent', '#3b82f6',
    'text', jsonb_build_object(
      'primary', '#0f172a',
      'secondary', '#475569',
      'muted', '#64748b'
    ),
    'background', jsonb_build_object(
      'paper', '#ffffff',
      'section', '#f8fafc',
      'subtle', '#f1f5f9'
    ),
    'border', '#cbd5e1',
    'link', '#3b82f6'
  ),
  jsonb_build_object(
    'fontFamily', jsonb_build_object(
      'heading', 'Inter',
      'body', 'Inter',
      'mono', 'JetBrains Mono'
    ),
    'fontSize', jsonb_build_object(
      'name', 26,
      'heading', 17,
      'subheading', 15,
      'body', 11,
      'caption', 9
    ),
    'fontWeight', jsonb_build_object(
      'heading', 700,
      'subheading', 600,
      'emphasis', 500,
      'body', 400
    ),
    'lineHeight', jsonb_build_object(
      'tight', 1.2,
      'normal', 1.4,
      'relaxed', 1.6
    )
  ),
  jsonb_build_object(
    'section', 18,
    'subsection', 14,
    'item', 9,
    'compact', 5
  ),
  jsonb_build_object(
    'borderRadius', 4,
    'dividerStyle', 'space',
    'dividerWidth', 0,
    'shadowEnabled', true
  ),
  jsonb_build_object(
    'description', 'Bold, contemporary design with strong typography and clean spacing.',
    'tags', jsonb_build_array('modern', 'contemporary', 'bold', 'tech'),
    'previewImage', null
  ),
  'system',
  false,
  true,
  '2025-01-01T00:00:00Z',
  '2025-01-01T00:00:00Z'
);

-- ============================================================================
-- CREATIVE THEME
-- Unique, personality-driven design
-- ============================================================================
INSERT INTO public.themes (
  user_id, name, category, colors, typography, spacing, effects, metadata,
  author, is_default, is_public, created_at, updated_at
) VALUES (
  NULL,
  'Creative',
  'creative',
  jsonb_build_object(
    'primary', '#7c3aed',
    'secondary', '#6366f1',
    'accent', '#ec4899',
    'text', jsonb_build_object(
      'primary', '#1f2937',
      'secondary', '#4b5563',
      'muted', '#6b7280'
    ),
    'background', jsonb_build_object(
      'paper', '#ffffff',
      'section', '#faf5ff',
      'subtle', '#f5f3ff'
    ),
    'border', '#ddd6fe',
    'link', '#7c3aed'
  ),
  jsonb_build_object(
    'fontFamily', jsonb_build_object(
      'heading', 'Playfair Display',
      'body', 'Lato',
      'mono', 'Courier New'
    ),
    'fontSize', jsonb_build_object(
      'name', 28,
      'heading', 18,
      'subheading', 15,
      'body', 11,
      'caption', 9
    ),
    'fontWeight', jsonb_build_object(
      'heading', 700,
      'subheading', 600,
      'emphasis', 500,
      'body', 400
    ),
    'lineHeight', jsonb_build_object(
      'tight', 1.25,
      'normal', 1.45,
      'relaxed', 1.65
    )
  ),
  jsonb_build_object(
    'section', 20,
    'subsection', 15,
    'item', 10,
    'compact', 6
  ),
  jsonb_build_object(
    'borderRadius', 8,
    'dividerStyle', 'icon',
    'dividerWidth', 2,
    'shadowEnabled', true
  ),
  jsonb_build_object(
    'description', 'Unique, personality-driven design with elegant typography and creative accents.',
    'tags', jsonb_build_array('creative', 'unique', 'artistic', 'design'),
    'previewImage', null
  ),
  'system',
  false,
  true,
  '2025-01-01T00:00:00Z',
  '2025-01-01T00:00:00Z'
);

-- ============================================================================
-- MINIMAL THEME
-- Clean, black & white simplicity
-- ============================================================================
INSERT INTO public.themes (
  user_id, name, category, colors, typography, spacing, effects, metadata,
  author, is_default, is_public, created_at, updated_at
) VALUES (
  NULL,
  'Minimal',
  'minimal',
  jsonb_build_object(
    'primary', '#000000',
    'secondary', '#000000',
    'accent', '#000000',
    'text', jsonb_build_object(
      'primary', '#000000',
      'secondary', '#404040',
      'muted', '#666666'
    ),
    'background', jsonb_build_object(
      'paper', '#ffffff',
      'section', '#ffffff',
      'subtle', '#fafafa'
    ),
    'border', '#e5e5e5',
    'link', '#000000'
  ),
  jsonb_build_object(
    'fontFamily', jsonb_build_object(
      'heading', 'Helvetica',
      'body', 'Helvetica',
      'mono', 'Courier New'
    ),
    'fontSize', jsonb_build_object(
      'name', 22,
      'heading', 15,
      'subheading', 13,
      'body', 10,
      'caption', 8
    ),
    'fontWeight', jsonb_build_object(
      'heading', 700,
      'subheading', 400,
      'emphasis', 400,
      'body', 400
    ),
    'lineHeight', jsonb_build_object(
      'tight', 1.1,
      'normal', 1.25,
      'relaxed', 1.4
    )
  ),
  jsonb_build_object(
    'section', 14,
    'subsection', 10,
    'item', 6,
    'compact', 4
  ),
  jsonb_build_object(
    'borderRadius', 0,
    'dividerStyle', 'space',
    'dividerWidth', 0,
    'shadowEnabled', false
  ),
  jsonb_build_object(
    'description', 'Clean, black & white simplicity with maximum content density and minimal decoration.',
    'tags', jsonb_build_array('minimal', 'simple', 'clean', 'monochrome'),
    'previewImage', null
  ),
  'system',
  false,
  true,
  '2025-01-01T00:00:00Z',
  '2025-01-01T00:00:00Z'
);

-- ============================================================================
-- BOLD THEME
-- Strong colors and confident typography
-- ============================================================================
INSERT INTO public.themes (
  user_id, name, category, colors, typography, spacing, effects, metadata,
  author, is_default, is_public, created_at, updated_at
) VALUES (
  NULL,
  'Bold',
  'modern',
  jsonb_build_object(
    'primary', '#dc2626',
    'secondary', '#ea580c',
    'accent', '#f59e0b',
    'text', jsonb_build_object(
      'primary', '#111827',
      'secondary', '#374151',
      'muted', '#6b7280'
    ),
    'background', jsonb_build_object(
      'paper', '#ffffff',
      'section', '#fef2f2',
      'subtle', '#fee2e2'
    ),
    'border', '#fca5a5',
    'link', '#dc2626'
  ),
  jsonb_build_object(
    'fontFamily', jsonb_build_object(
      'heading', 'Montserrat',
      'body', 'Open Sans',
      'mono', 'Courier New'
    ),
    'fontSize', jsonb_build_object(
      'name', 30,
      'heading', 18,
      'subheading', 15,
      'body', 11,
      'caption', 9
    ),
    'fontWeight', jsonb_build_object(
      'heading', 800,
      'subheading', 700,
      'emphasis', 600,
      'body', 400
    ),
    'lineHeight', jsonb_build_object(
      'tight', 1.15,
      'normal', 1.35,
      'relaxed', 1.5
    )
  ),
  jsonb_build_object(
    'section', 20,
    'subsection', 15,
    'item', 10,
    'compact', 6
  ),
  jsonb_build_object(
    'borderRadius', 4,
    'dividerStyle', 'line',
    'dividerWidth', 3,
    'shadowEnabled', true
  ),
  jsonb_build_object(
    'description', 'Strong colors and confident typography that demands attention.',
    'tags', jsonb_build_array('bold', 'strong', 'confident', 'standout'),
    'previewImage', null
  ),
  'system',
  false,
  true,
  '2025-01-01T00:00:00Z',
  '2025-01-01T00:00:00Z'
);

-- ============================================================================
-- EXECUTIVE THEME
-- Luxury, elegant styling for senior positions
-- ============================================================================
INSERT INTO public.themes (
  user_id, name, category, colors, typography, spacing, effects, metadata,
  author, is_default, is_public, created_at, updated_at
) VALUES (
  NULL,
  'Executive',
  'professional',
  jsonb_build_object(
    'primary', '#1e293b',
    'secondary', '#475569',
    'accent', '#0891b2',
    'text', jsonb_build_object(
      'primary', '#0f172a',
      'secondary', '#334155',
      'muted', '#64748b'
    ),
    'background', jsonb_build_object(
      'paper', '#ffffff',
      'section', '#f8fafc',
      'subtle', '#f1f5f9'
    ),
    'border', '#94a3b8',
    'link', '#0891b2'
  ),
  jsonb_build_object(
    'fontFamily', jsonb_build_object(
      'heading', 'Merriweather',
      'body', 'Lora',
      'mono', 'Courier New'
    ),
    'fontSize', jsonb_build_object(
      'name', 26,
      'heading', 17,
      'subheading', 14,
      'body', 11,
      'caption', 9
    ),
    'fontWeight', jsonb_build_object(
      'heading', 900,
      'subheading', 700,
      'emphasis', 500,
      'body', 400
    ),
    'lineHeight', jsonb_build_object(
      'tight', 1.2,
      'normal', 1.5,
      'relaxed', 1.7
    )
  ),
  jsonb_build_object(
    'section', 20,
    'subsection', 15,
    'item', 10,
    'compact', 6
  ),
  jsonb_build_object(
    'borderRadius', 2,
    'dividerStyle', 'line',
    'dividerWidth', 1,
    'shadowEnabled', false
  ),
  jsonb_build_object(
    'description', 'Luxury, elegant styling perfect for senior positions and executive roles.',
    'tags', jsonb_build_array('executive', 'luxury', 'elegant', 'senior'),
    'previewImage', null
  ),
  'system',
  false,
  true,
  '2025-01-01T00:00:00Z',
  '2025-01-01T00:00:00Z'
);

-- ============================================================================
-- TECH THEME
-- Technical, monospace styling
-- ============================================================================
INSERT INTO public.themes (
  user_id, name, category, colors, typography, spacing, effects, metadata,
  author, is_default, is_public, created_at, updated_at
) VALUES (
  NULL,
  'Tech',
  'modern',
  jsonb_build_object(
    'primary', '#0ea5e9',
    'secondary', '#06b6d4',
    'accent', '#10b981',
    'text', jsonb_build_object(
      'primary', '#0c4a6e',
      'secondary', '#0e7490',
      'muted', '#67e8f9'
    ),
    'background', jsonb_build_object(
      'paper', '#ffffff',
      'section', '#f0f9ff',
      'subtle', '#e0f2fe'
    ),
    'border', '#7dd3fc',
    'link', '#0ea5e9'
  ),
  jsonb_build_object(
    'fontFamily', jsonb_build_object(
      'heading', 'JetBrains Mono',
      'body', 'Roboto',
      'mono', 'JetBrains Mono'
    ),
    'fontSize', jsonb_build_object(
      'name', 24,
      'heading', 16,
      'subheading', 14,
      'body', 10.5,
      'caption', 9
    ),
    'fontWeight', jsonb_build_object(
      'heading', 700,
      'subheading', 600,
      'emphasis', 500,
      'body', 400
    ),
    'lineHeight', jsonb_build_object(
      'tight', 1.2,
      'normal', 1.4,
      'relaxed', 1.6
    )
  ),
  jsonb_build_object(
    'section', 16,
    'subsection', 12,
    'item', 8,
    'compact', 5
  ),
  jsonb_build_object(
    'borderRadius', 6,
    'dividerStyle', 'line',
    'dividerWidth', 2,
    'shadowEnabled', true
  ),
  jsonb_build_object(
    'description', 'Technical styling with monospace headings, perfect for developer roles.',
    'tags', jsonb_build_array('tech', 'developer', 'monospace', 'technical'),
    'previewImage', null
  ),
  'system',
  false,
  true,
  '2025-01-01T00:00:00Z',
  '2025-01-01T00:00:00Z'
);

-- ============================================================================
-- ACADEMIC THEME
-- Traditional, scholarly styling
-- ============================================================================
INSERT INTO public.themes (
  user_id, name, category, colors, typography, spacing, effects, metadata,
  author, is_default, is_public, created_at, updated_at
) VALUES (
  NULL,
  'Academic',
  'professional',
  jsonb_build_object(
    'primary', '#000000',
    'secondary', '#1a1a1a',
    'accent', '#1e40af',
    'text', jsonb_build_object(
      'primary', '#000000',
      'secondary', '#333333',
      'muted', '#666666'
    ),
    'background', jsonb_build_object(
      'paper', '#ffffff',
      'section', '#ffffff',
      'subtle', '#fafafa'
    ),
    'border', '#cccccc',
    'link', '#1e40af'
  ),
  jsonb_build_object(
    'fontFamily', jsonb_build_object(
      'heading', 'Times New Roman',
      'body', 'Times New Roman',
      'mono', 'Courier New'
    ),
    'fontSize', jsonb_build_object(
      'name', 22,
      'heading', 16,
      'subheading', 14,
      'body', 12,
      'caption', 10
    ),
    'fontWeight', jsonb_build_object(
      'heading', 700,
      'subheading', 700,
      'emphasis', 400,
      'body', 400
    ),
    'lineHeight', jsonb_build_object(
      'tight', 1.0,
      'normal', 1.5,
      'relaxed', 2.0
    )
  ),
  jsonb_build_object(
    'section', 16,
    'subsection', 12,
    'item', 8,
    'compact', 5
  ),
  jsonb_build_object(
    'borderRadius', 0,
    'dividerStyle', 'space',
    'dividerWidth', 0,
    'shadowEnabled', false
  ),
  jsonb_build_object(
    'description', 'Traditional, scholarly styling following academic conventions.',
    'tags', jsonb_build_array('academic', 'traditional', 'scholarly', 'research'),
    'previewImage', null
  ),
  'system',
  false,
  true,
  '2025-01-01T00:00:00Z',
  '2025-01-01T00:00:00Z'
);

-- Verify themes were inserted
SELECT
  id,
  name,
  category,
  author,
  is_default,
  is_public
FROM public.themes
WHERE user_id IS NULL
ORDER BY is_default DESC, name ASC;
