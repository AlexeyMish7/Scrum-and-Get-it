/**
 * Template & Theme Types
 *
 * Defines the template system for document structure and theme system
 * for visual styling. Templates and themes are independent and can be
 * mixed freely.
 */

/**
 * Template category
 */
export type TemplateCategory = "resume" | "cover-letter";

/**
 * Template subtype/style
 */
export type TemplateSubtype =
  | "chronological"
  | "functional"
  | "hybrid"
  | "creative"
  | "academic"
  | "executive"
  | "simple";

/**
 * Page size options
 */
export type PageSize = "letter" | "a4";

/**
 * Column layout options
 */
export type ColumnLayout = 1 | 2;

/**
 * Template definition
 * Templates define structure, layout, and content schema
 */
export interface Template {
  /** Unique template identifier */
  id: string;

  /** Display name */
  name: string;

  /** Template category */
  category: TemplateCategory;

  /** Template style/subtype */
  subtype: TemplateSubtype;

  /** Layout configuration */
  layout: TemplateLayout;

  /** Content schema definition */
  schema: TemplateSchema;

  /** Template features and capabilities */
  features: TemplateFeatures;

  /** Metadata */
  metadata: TemplateMetadata;

  /** Versioning info */
  version: number;
  createdAt: string;
  updatedAt: string;

  /** Template source */
  author: "system" | "user";

  /** Is default template for category */
  isDefault: boolean;
}

/**
 * Template layout configuration
 */
export interface TemplateLayout {
  /** Number of columns */
  columns: ColumnLayout;

  /** Page size */
  pageSize: PageSize;

  /** Page margins (in inches or mm) */
  margins: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };

  /** Section order and configuration */
  sectionOrder: SectionConfig[];

  /** Header/footer configuration */
  headerFooter?: {
    showHeader: boolean;
    showFooter: boolean;
    headerContent?: string;
    footerContent?: string;
  };
}

/**
 * Section configuration in template
 */
export interface SectionConfig {
  /** Section identifier */
  id: string;

  /** Display name */
  name: string;

  /** Section type */
  type: SectionType;

  /** Is section required */
  required: boolean;

  /** Default enabled state */
  defaultEnabled: boolean;

  /** Section-specific layout */
  layout?: {
    /** Full width or column-specific */
    width: "full" | "half" | "third";

    /** Spacing before section */
    spacingBefore?: number;

    /** Spacing after section */
    spacingAfter?: number;
  };
}

/**
 * Section type
 */
export type SectionType =
  | "header"
  | "summary"
  | "experience"
  | "education"
  | "skills"
  | "projects"
  | "certifications"
  | "publications"
  | "awards"
  | "languages"
  | "custom";

/**
 * Template content schema
 */
export interface TemplateSchema {
  /** Required sections */
  requiredSections: string[];

  /** Optional sections */
  optionalSections: string[];

  /** Allow custom sections */
  customSections: boolean;

  /** Maximum sections allowed */
  maxSections?: number;
}

/**
 * Template features and capabilities
 */
export interface TemplateFeatures {
  /** Optimized for ATS parsing */
  atsOptimized: boolean;

  /** User can customize structure */
  customizable: boolean;

  /** Supports skills highlighting */
  skillsHighlight: boolean;

  /** Supports portfolio/project links */
  portfolioSupport: boolean;

  /** Supports profile photo */
  photoSupport: boolean;

  /** Supports multiple languages */
  multiLanguage: boolean;
}

/**
 * Template metadata
 */
export interface TemplateMetadata {
  /** Preview thumbnail URL */
  thumbnail: string;

  /** Template description */
  description: string;

  /** Recommended industries */
  industry: string[];

  /** Recommended experience levels */
  experienceLevel: string[];

  /** Searchable tags */
  tags: string[];

  /** Usage count (for system templates) */
  usageCount?: number;

  /** Average user rating */
  rating?: number;
}

/**
 * Theme category/style
 */
export type ThemeCategory =
  | "professional"
  | "modern"
  | "creative"
  | "minimal"
  | "bold";

/**
 * Theme definition
 * Themes define visual styling: colors, fonts, spacing, decorative elements
 */
export interface Theme {
  /** Unique theme identifier */
  id: string;

  /** Display name */
  name: string;

  /** Theme category/style */
  category: ThemeCategory;

  /** Typography configuration */
  typography: ThemeTypography;

  /** Color palette */
  colors: ThemeColors;

  /** Spacing configuration */
  spacing: ThemeSpacing;

  /** Visual elements */
  elements: ThemeElements;

  /** Metadata */
  metadata: ThemeMetadata;

  /** Versioning */
  version: number;
  createdAt: string;
  updatedAt: string;

  /** Theme source */
  author: "system" | "user";

  /** Is default theme */
  isDefault: boolean;
}

/**
 * Typography configuration
 */
export interface ThemeTypography {
  /** Heading font configuration */
  headingFont: FontConfig;

  /** Body text font configuration */
  bodyFont: FontConfig;

  /** Font sizes (in points) */
  sizes: {
    h1: number;
    h2: number;
    h3: number;
    body: number;
    small: number;
  };

  /** Line height multipliers */
  lineHeight: {
    tight: number;
    normal: number;
    relaxed: number;
  };

  /** Letter spacing */
  letterSpacing?: {
    tight: number;
    normal: number;
    wide: number;
  };
}

/**
 * Font configuration
 */
export interface FontConfig {
  /** Font family name */
  family: string;

  /** Font weights used */
  weights: number[];

  /** Fallback fonts */
  fallbacks: string[];

  /** Google Fonts URL (if applicable) */
  googleFontsUrl?: string;
}

/**
 * Color palette
 */
export interface ThemeColors {
  /** Primary brand color */
  primary: string;

  /** Secondary color */
  secondary: string;

  /** Accent color */
  accent: string;

  /** Text colors */
  text: {
    primary: string;
    secondary: string;
    muted: string;
  };

  /** Background colors */
  background: {
    paper: string;
    section: string;
    subtle: string;
  };

  /** Border color */
  border: string;

  /** Link color */
  link?: string;
}

/**
 * Spacing configuration
 */
export interface ThemeSpacing {
  /** Space between sections (in em/rem) */
  section: number;

  /** Space between subsections */
  subsection: number;

  /** Space between items */
  item: number;

  /** Base unit (multiplier) */
  baseUnit?: number;
}

/**
 * Visual elements configuration
 */
export interface ThemeElements {
  /** Section divider style */
  sectionDivider: "line" | "space" | "icon" | "none";

  /** Bullet point style */
  bulletStyle: "circle" | "square" | "dash" | "chevron" | "custom";

  /** Section header style */
  headerStyle: "underline" | "background" | "icon" | "border" | "none";

  /** Icon set to use */
  iconSet: "material" | "feather" | "heroicons" | "none";

  /** Custom decorative elements */
  decorative?: {
    /** Show corner decorations */
    corners?: boolean;

    /** Header accent line */
    headerAccent?: boolean;

    /** Custom shapes */
    shapes?: string[];
  };
}

/**
 * Theme metadata
 */
export interface ThemeMetadata {
  /** Preview thumbnail URL */
  thumbnail: string;

  /** Theme description */
  description: string;

  /** Searchable tags */
  tags: string[];

  /** Recommended for categories */
  recommendedFor?: TemplateCategory[];

  /** Usage count */
  usageCount?: number;

  /** Average rating */
  rating?: number;
}

/**
 * Document configuration (template + theme combo)
 */
export interface DocumentConfig {
  /** Template ID */
  templateId: string;

  /** Theme ID */
  themeId: string;

  /** Custom overrides */
  customOverrides?: {
    /** Template layout overrides */
    template?: Partial<TemplateLayout>;

    /** Theme style overrides */
    theme?: Partial<ThemeColors | ThemeTypography>;
  };
}

/**
 * Template-theme preview combination
 */
export interface TemplateThemePreview {
  /** Template being previewed */
  template: Template;

  /** Theme being previewed */
  theme: Theme;

  /** Combined preview URL */
  previewUrl: string;

  /** Is this combination recommended */
  recommended?: boolean;
}
