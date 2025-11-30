/**
 * Navigation Types
 *
 * Defines types for AI workspace navigation, routes, and breadcrumbs.
 */

/**
 * AI workspace navigation tab
 */
export type AIWorkspaceTab =
  | "hub"
  | "library"
  | "templates"
  | "research"
  | "resume"
  | "cover-letter"
  | "reviews";

/**
 * AI workspace route paths
 */
export const AI_ROUTES = {
  /** Base AI workspace */
  BASE: "/ai",

  /** Central hub (default) */
  HUB: "/ai",

  /** Document library */
  LIBRARY: "/ai/library",

  /** Template manager */
  TEMPLATES: "/ai/templates",

  /** Company research */
  RESEARCH: "/ai/research",

  /** Generate resume */
  RESUME: "/ai/generate/resume",

  /** Generate cover letter */
  COVER_LETTER: "/ai/generate/cover-letter",

  /** Create new document */
  CREATE: "/ai/create",

  /** Edit document */
  DOCUMENT: (id: string) => `/ai/document/${id}`,

  /** Version history */
  VERSIONS: (id: string) => `/ai/document/${id}/versions`,

  /** Export document */
  EXPORT: (id: string) => `/ai/document/${id}/export`,

  /** Reviews dashboard */
  REVIEWS: "/ai/reviews",

  /** Single review */
  REVIEW: (id: string) => `/ai/reviews/${id}`,
} as const;

/**
 * Navigation tab configuration
 */
export interface NavigationTab {
  /** Tab identifier */
  id: AIWorkspaceTab;

  /** Display label */
  label: string;

  /** Icon name */
  icon: string;

  /** Route path */
  path: string;

  /** Is tab disabled */
  disabled?: boolean;

  /** Badge count */
  badgeCount?: number;
}

/**
 * Breadcrumb item
 */
export interface BreadcrumbItem {
  /** Display label */
  label: string;

  /** Route path */
  path?: string;

  /** Is current/active */
  isCurrent?: boolean;

  /** Icon */
  icon?: string;
}

/**
 * Navigation state
 */
export interface NavigationState {
  /** Current active tab */
  activeTab: AIWorkspaceTab;

  /** Current route */
  currentRoute: string;

  /** Breadcrumbs */
  breadcrumbs: BreadcrumbItem[];

  /** Can navigate back */
  canGoBack: boolean;

  /** Can navigate forward */
  canGoForward: boolean;
}

/**
 * Quick action configuration
 */
export interface QuickAction {
  /** Action identifier */
  id: string;

  /** Display label */
  label: string;

  /** Icon name */
  icon: string;

  /** Action handler or route */
  action: string | (() => void);

  /** Is action disabled */
  disabled?: boolean;

  /** Action color */
  color?: string;

  /** Tooltip */
  tooltip?: string;
}

/**
 * Recent document item
 */
export interface RecentDocument {
  /** Document ID */
  id: string;

  /** Document name */
  name: string;

  /** Document type */
  type: "resume" | "cover-letter";

  /** Last edited timestamp */
  lastEditedAt: string;

  /** Version number */
  versionNumber: number;

  /** Thumbnail URL */
  thumbnailUrl?: string;

  /** Status */
  status: string;
}
