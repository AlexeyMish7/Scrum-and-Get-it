/**
 * THEME SERVICE (Database Integration)
 *
 * Purpose:
 * - Load and manage system-defined visual themes
 * - Support user custom themes from database
 * - Validate theme structure (colors, typography, spacing)
 * - Search and filter themes by category
 * - Provide default theme selection
 *
 * Backend Connection:
 * - Database: themes table (via @shared/services/crud)
 * - RLS: User-scoped custom themes + global system themes
 * - Operations: getAllThemes(), getUserThemes(), getThemeByIdAsync()
 *
 * Usage:
 *   import { getAllThemes, getThemeById } from '@ai_workspace/services';
 *
 *   // Async - fetches from database
 *   const themes = await getAllThemes(userId);
 *   const theme = await getThemeByIdAsync('modern-blue', userId);
 *
 *   // Sync - uses static fallback data
 *   const fallbackThemes = getAllSystemThemes();
 */

import { listRows, withUser } from "@shared/services/crud";
import type { ThemeRow } from "@shared/types/database";
import type { Theme, ThemeCategory, TemplateCategory } from "../types";
import { SYSTEM_THEMES } from "./themes/systemThemes";

/**
 * Theme validation result
 */
export interface ThemeValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Get all system themes
 */
export function getAllSystemThemes(): Theme[] {
  return [...SYSTEM_THEMES];
}

/**
 * Get themes by category
 */
export function getThemesByCategory(category: ThemeCategory): Theme[] {
  return getAllSystemThemes().filter((t) => t.category === category);
}

/**
 * Get theme by ID
 */
export function getThemeById(id: string): Theme | undefined {
  return getAllSystemThemes().find((t) => t.id === id);
}

/**
 * Get default theme
 */
export function getDefaultTheme(): Theme | undefined {
  return getAllSystemThemes().find((t) => t.isDefault);
}

/**
 * Validate theme structure
 */
export function validateTheme(theme: Theme): ThemeValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!theme.id || theme.id.trim() === "") {
    errors.push("Theme ID is required");
  }

  if (!theme.name || theme.name.trim() === "") {
    errors.push("Theme name is required");
  }

  if (!theme.category) {
    errors.push("Theme category is required");
  }

  if (!theme.typography) {
    errors.push("Typography configuration is required");
  }

  if (!theme.colors) {
    errors.push("Color palette is required");
  }

  if (theme.typography) {
    if (!theme.typography.headingFont || !theme.typography.bodyFont) {
      errors.push("Both heading and body fonts are required");
    }

    if (!theme.typography.sizes) {
      errors.push("Font sizes are required");
    }
  }

  if (theme.colors) {
    if (!theme.colors.primary) {
      errors.push("Primary color is required");
    }

    if (!theme.colors.text || !theme.colors.text.primary) {
      errors.push("Primary text color is required");
    }

    if (!theme.colors.background || !theme.colors.background.paper) {
      errors.push("Paper background color is required");
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Search themes by name, description, or tags
 */
export function searchThemes(query: string, themes?: Theme[]): Theme[] {
  const searchIn = themes || getAllSystemThemes();
  const lowerQuery = query.toLowerCase().trim();

  if (!lowerQuery) {
    return searchIn;
  }

  return searchIn.filter((theme) => {
    const nameMatch = theme.name.toLowerCase().includes(lowerQuery);
    const descMatch = theme.metadata.description
      .toLowerCase()
      .includes(lowerQuery);
    const tagsMatch = theme.metadata.tags.some((tag: string) =>
      tag.toLowerCase().includes(lowerQuery)
    );

    return nameMatch || descMatch || tagsMatch;
  });
}

/**
 * Filter themes by recommended template category
 */
export function getThemesForTemplateCategory(
  category: TemplateCategory
): Theme[] {
  return getAllSystemThemes().filter((theme) => {
    if (!theme.metadata.recommendedFor) {
      return true; // Include themes without recommendations
    }
    return theme.metadata.recommendedFor.includes(category);
  });
}

/**
 * Sort themes by popularity (usage count)
 */
export function sortByPopularity(themes: Theme[]): Theme[] {
  return [...themes].sort((a, b) => {
    const aUsage = a.metadata.usageCount || 0;
    const bUsage = b.metadata.usageCount || 0;
    return bUsage - aUsage;
  });
}

/**
 * Sort themes by rating
 */
export function sortByRating(themes: Theme[]): Theme[] {
  return [...themes].sort((a, b) => {
    const aRating = a.metadata.rating || 0;
    const bRating = b.metadata.rating || 0;
    return bRating - aRating;
  });
}

/**
 * Get recommended themes
 */
export function getRecommendedThemes(preferences?: {
  templateCategory?: TemplateCategory;
  preferredCategory?: ThemeCategory;
}): Theme[] {
  let themes = getAllSystemThemes();

  // Filter by template category compatibility
  if (preferences?.templateCategory) {
    themes = getThemesForTemplateCategory(preferences.templateCategory);
  }

  // Filter by theme category
  if (preferences?.preferredCategory) {
    const preferred = themes.filter(
      (t) => t.category === preferences.preferredCategory
    );
    if (preferred.length > 0) {
      themes = preferred;
    }
  }

  // Sort by rating
  themes = sortByRating(themes);

  return themes.slice(0, 5);
}

/**
 * Clone theme with new ID and name
 */
export function cloneTheme(
  theme: Theme,
  newId: string,
  newName: string
): Theme {
  return {
    ...theme,
    id: newId,
    name: newName,
    author: "user",
    isDefault: false,
    metadata: {
      ...theme.metadata,
      usageCount: 0,
      rating: undefined,
    },
    version: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Get theme color preview (for cards/swatches)
 */
export function getThemeColorPreview(theme: Theme): {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
} {
  return {
    primary: theme.colors.primary,
    secondary: theme.colors.secondary,
    accent: theme.colors.accent,
    background: theme.colors.background.paper,
  };
}

// ============================================================================
// DATABASE INTEGRATION
// ============================================================================

/**
 * Map ThemeRow from database to Theme type for ai_workspace
 *
 * Database structure uses nested JSONB objects that match our migration:
 * - colors.text.primary/secondary/muted
 * - colors.background.paper/section/subtle
 * - typography.fontFamily.heading/body/mono
 * - typography.fontSize.name/heading/subheading/body/caption
 * - spacing.section/subsection/item/compact
 */
function mapThemeRowToTheme(row: ThemeRow): Theme {
  // Access nested properties safely from JSONB structure
  const colors = row.colors as any;
  const typography = row.typography as any;
  const spacing = row.spacing as any;
  const effects = row.effects as any;

  return {
    id: row.id,
    name: row.name,
    category: (row.category || "modern") as ThemeCategory,
    typography: {
      headingFont: {
        family: typography?.fontFamily?.heading || "Arial",
        weights: [
          typography?.fontWeight?.heading || 700,
          typography?.fontWeight?.subheading || 600,
        ],
        fallbacks: ["sans-serif"],
      },
      bodyFont: {
        family: typography?.fontFamily?.body || "Arial",
        weights: [
          typography?.fontWeight?.body || 400,
          typography?.fontWeight?.emphasis || 500,
        ],
        fallbacks: ["sans-serif"],
      },
      sizes: {
        h1: typography?.fontSize?.name || 24,
        h2: typography?.fontSize?.heading || 18,
        h3: typography?.fontSize?.subheading || 14,
        body: typography?.fontSize?.body || 11,
        small: typography?.fontSize?.caption || 9,
      },
      lineHeight: {
        tight: typography?.lineHeight?.tight || 1.2,
        normal: typography?.lineHeight?.normal || 1.5,
        relaxed: typography?.lineHeight?.relaxed || 1.8,
      },
    },
    colors: {
      primary: colors?.primary || "#000000",
      secondary: colors?.secondary || "#666666",
      accent: colors?.accent || "#0066cc",
      text: {
        primary: colors?.text?.primary || "#000000",
        secondary: colors?.text?.secondary || "#666666",
        muted: colors?.text?.muted || "#999999",
      },
      background: {
        paper: colors?.background?.paper || "#ffffff",
        section: colors?.background?.section || "#f5f5f5",
        subtle: colors?.background?.subtle || "#fafafa",
      },
      border: colors?.border || "#e0e0e0",
    },
    spacing: {
      section: spacing?.section || 1.5,
      subsection: spacing?.subsection || 1,
      item: spacing?.item || 0.5,
    },
    elements: {
      sectionDivider: effects?.dividerStyle || "line",
      bulletStyle: "circle",
      headerStyle: "underline",
      iconSet: "material",
    },
    metadata: {
      thumbnail: "", // Not in database schema yet
      description: row.metadata?.description || "",
      tags: row.metadata?.tags || [],
      usageCount: 0,
      rating: undefined,
    },
    version: 1,
    author: row.author,
    isDefault: row.is_default,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Get all themes for a user (system + custom)
 */
export async function getAllThemes(
  userId?: string | null,
  category?: ThemeCategory
): Promise<Theme[]> {
  try {
    const filters: {
      eq?: Record<string, string | number | boolean | null>;
      is_?: Record<string, null>;
    } = {};

    if (category) {
      filters.eq = { category };
    }

    // Fetch system themes (user_id IS NULL)
    // Note: Supabase requires 'is' operator for null checks, not 'eq'
    const systemResult = await listRows<ThemeRow>("themes", "*", {
      eq: filters.eq,
      is_: { user_id: null },
      order: { column: "name", ascending: true },
    });

    let themes: Theme[] = [];

    if (systemResult.data) {
      themes = systemResult.data.map(mapThemeRowToTheme);
    }

    if (userId) {
      const userCrud = withUser(userId);
      const userResult = await userCrud.listRows<ThemeRow>("themes", "*", {
        eq: filters.eq as
          | Record<string, string | number | boolean | null>
          | undefined,
        order: { column: "name", ascending: true },
      });

      if (userResult.data) {
        themes = [...themes, ...userResult.data.map(mapThemeRowToTheme)];
      }
    }

    if (themes.length === 0) {
      console.warn("No themes in database, using static fallback");
      return category ? getThemesByCategory(category) : getAllSystemThemes();
    }

    return themes;
  } catch (error) {
    console.error("Failed to fetch themes from database:", error);
    return category ? getThemesByCategory(category) : getAllSystemThemes();
  }
}

/**
 * Get user's custom themes only
 */
export async function getUserThemes(
  userId: string,
  category?: ThemeCategory
): Promise<Theme[]> {
  try {
    const userCrud = withUser(userId);
    const filters: {
      eq?: Record<string, string | number | boolean | null>;
    } = {};

    if (category) {
      filters.eq = { category };
    }

    const result = await userCrud.listRows<ThemeRow>("themes", "*", {
      eq: filters.eq,
      order: { column: "created_at", ascending: false },
    });

    if (result.error || !result.data) {
      return [];
    }

    return result.data.map(mapThemeRowToTheme);
  } catch (error) {
    console.error("Failed to fetch user themes:", error);
    return [];
  }
}

/**
 * Get theme by ID (checks both system and user themes)
 */
export async function getThemeByIdAsync(
  themeId: string,
  userId?: string | null
): Promise<Theme | undefined> {
  try {
    const allThemes = await getAllThemes(userId);
    const found = allThemes.find((t) => t.id === themeId);

    if (found) {
      return found;
    }

    return getThemeById(themeId);
  } catch (error) {
    console.error("Failed to fetch theme by ID:", error);
    return getThemeById(themeId);
  }
}

/**
 * Theme service object
 */
export const themeService = {
  // Static (sync) functions
  getAllSystemThemes,
  getThemesByCategory,
  getThemeById,
  getDefaultTheme,
  validateTheme,
  searchThemes,
  getThemesForTemplateCategory,
  sortByPopularity,
  sortByRating,
  getRecommendedThemes,
  cloneTheme,
  getThemeColorPreview,

  // Database (async) functions
  getAllThemes,
  getUserThemes,
  getThemeByIdAsync,
};
