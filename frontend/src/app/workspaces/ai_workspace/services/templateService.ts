/**
 * TEMPLATE SERVICE (Database Integration)
 *
 * Purpose:
 * - Load and manage system-defined templates (resume, cover letter)
 * - Support user custom templates from database
 * - Validate template structure and configuration
 * - Search and filter templates by category/subtype
 * - Provide default template selection
 *
 * Backend Connection:
 * - Database: templates table (via @shared/services/crud)
 * - RLS: User-scoped custom templates + global system templates
 * - Operations: getAllTemplates(), getUserTemplates(), getTemplateById()
 *
 * Usage:
 *   import { getAllTemplates, getTemplateById } from '@ai_workspace/services';
 *
 *   // Async - fetches from database
 *   const templates = await getAllTemplates(userId, 'resume');
 *   const template = await getTemplateById('modern-professional', userId);
 *
 *   // Sync - uses static fallback data
 *   const fallbackTemplates = getAllSystemTemplates();
 */

import { listRows, withUser } from "@shared/services/crud";
import type { TemplateRow } from "@shared/types/database";
import type {
  Template,
  TemplateCategory,
  TemplateSubtype,
  ColumnLayout,
  PageSize,
  SectionType,
} from "../types";

import {
  SYSTEM_RESUME_TEMPLATES,
  SYSTEM_COVER_LETTER_TEMPLATES,
} from "./templates/systemTemplates";

/**
 * Template validation result
 */
export interface TemplateValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Get all system templates
 */
export function getAllSystemTemplates(): Template[] {
  return [...SYSTEM_RESUME_TEMPLATES, ...SYSTEM_COVER_LETTER_TEMPLATES];
}

/**
 * Get templates by category
 */
export function getTemplatesByCategory(category: TemplateCategory): Template[] {
  return getAllSystemTemplates().filter((t) => t.category === category);
}

/**
 * Get templates by subtype
 */
export function getTemplatesBySubtype(subtype: TemplateSubtype): Template[] {
  return getAllSystemTemplates().filter((t) => t.subtype === subtype);
}

/**
 * Get template by ID
 */
export function getTemplateById(id: string): Template | undefined {
  return getAllSystemTemplates().find((t) => t.id === id);
}

/**
 * Get default template for category
 */
export function getDefaultTemplate(
  category: TemplateCategory
): Template | undefined {
  return getTemplatesByCategory(category).find((t) => t.isDefault);
}

/**
 * Validate template structure
 */
export function validateTemplate(template: Template): TemplateValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!template.id || template.id.trim() === "") {
    errors.push("Template ID is required");
  }

  if (!template.name || template.name.trim() === "") {
    errors.push("Template name is required");
  }

  if (!template.category) {
    errors.push("Template category is required");
  }

  if (!template.subtype) {
    errors.push("Template subtype is required");
  }

  if (!template.layout) {
    errors.push("Template layout is required");
  }

  if (
    template.layout &&
    (!template.layout.columns || template.layout.columns < 1)
  ) {
    errors.push("Layout must have at least 1 column");
  }

  if (template.layout && template.layout.columns > 2) {
    warnings.push(
      "Templates with more than 2 columns may have ATS compatibility issues"
    );
  }

  if (!template.schema) {
    errors.push("Template schema is required");
  }

  if (
    template.schema &&
    (!template.schema.requiredSections ||
      template.schema.requiredSections.length === 0)
  ) {
    errors.push("Template must have at least one required section");
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Search templates by name, description, or tags
 */
export function searchTemplates(
  query: string,
  templates?: Template[]
): Template[] {
  const searchIn = templates || getAllSystemTemplates();
  const lowerQuery = query.toLowerCase().trim();

  if (!lowerQuery) {
    return searchIn;
  }

  return searchIn.filter((template) => {
    const nameMatch = template.name.toLowerCase().includes(lowerQuery);
    const descMatch = template.metadata.description
      .toLowerCase()
      .includes(lowerQuery);
    const tagsMatch = template.metadata.tags.some((tag: string) =>
      tag.toLowerCase().includes(lowerQuery)
    );

    return nameMatch || descMatch || tagsMatch;
  });
}

/**
 * Filter templates by ATS optimization
 */
export function getATSOptimizedTemplates(
  category?: TemplateCategory
): Template[] {
  const templates = category
    ? getTemplatesByCategory(category)
    : getAllSystemTemplates();
  return templates.filter((t) => t.features.atsOptimized);
}

/**
 * Sort templates by popularity (usage count)
 */
export function sortByPopularity(templates: Template[]): Template[] {
  return [...templates].sort((a, b) => {
    const aUsage = a.metadata.usageCount || 0;
    const bUsage = b.metadata.usageCount || 0;
    return bUsage - aUsage;
  });
}

/**
 * Sort templates by rating
 */
export function sortByRating(templates: Template[]): Template[] {
  return [...templates].sort((a, b) => {
    const aRating = a.metadata.rating || 0;
    const bRating = b.metadata.rating || 0;
    return bRating - aRating;
  });
}

/**
 * Get recommended templates based on preferences
 */
export function getRecommendedTemplates(
  category: TemplateCategory,
  preferences?: {
    favorATS?: boolean;
    preferredSubtype?: TemplateSubtype;
    industryFocus?: string[];
  }
): Template[] {
  let templates = getTemplatesByCategory(category);

  // Filter by ATS preference
  if (preferences?.favorATS) {
    templates = templates.filter((t) => t.features.atsOptimized);
  }

  // Filter by subtype
  if (preferences?.preferredSubtype) {
    const preferred = templates.filter(
      (t) => t.subtype === preferences.preferredSubtype
    );
    if (preferred.length > 0) {
      templates = preferred;
    }
  }

  // Filter by industry
  if (preferences?.industryFocus && preferences.industryFocus.length > 0) {
    const industryMatch = templates.filter((t) =>
      t.metadata.industry.some((ind: string) =>
        preferences.industryFocus?.includes(ind)
      )
    );
    if (industryMatch.length > 0) {
      templates = industryMatch;
    }
  }

  // Sort by rating
  templates = sortByRating(templates);

  return templates.slice(0, 5);
}

/**
 * Clone template with new ID and name
 */
export function cloneTemplate(
  template: Template,
  newId: string,
  newName: string
): Template {
  return {
    ...template,
    id: newId,
    name: newName,
    author: "user",
    isDefault: false,
    metadata: {
      ...template.metadata,
      usageCount: 0,
      rating: undefined,
    },
    version: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

// ============================================================================
// DATABASE INTEGRATION
// ============================================================================

/**
 * Map TemplateRow from database to Template type for ai_workspace
 */
function mapTemplateRowToTemplate(row: TemplateRow): Template {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    subtype: row.subtype,
    layout: {
      columns: (row.layout.columns || 1) as ColumnLayout,
      pageSize: (row.layout.pageSize || "letter") as PageSize,
      margins: row.layout.margins || { top: 1, right: 1, bottom: 1, left: 1 },
      sectionOrder: (row.layout.sectionOrder || []).map((sectionId) => ({
        id: sectionId,
        name: sectionId,
        type: sectionId as SectionType,
        required: false,
        defaultEnabled: true,
      })),
      headerFooter: row.layout.headerFooter || {
        showHeader: true,
        showFooter: false,
      },
    },
    schema: {
      requiredSections: row.schema.requiredSections || [],
      optionalSections: row.schema.optionalSections || [],
      customSections: row.schema.customSections || false,
      maxSections: row.schema.maxSections ?? undefined,
    },
    features: {
      atsOptimized: row.features.atsOptimized || false,
      customizable: row.features.customizable || false,
      skillsHighlight: row.features.skillsHighlight || false,
      portfolioSupport: row.features.portfolioSupport || false,
      photoSupport: row.features.photoSupport || false,
      multiLanguage: false, // Not in database schema yet
    },
    metadata: {
      thumbnail: "", // Not in database schema yet
      description: row.metadata.description || "",
      tags: row.metadata.tags || [],
      industry: row.metadata.industryFocus || [],
      experienceLevel: row.metadata.experienceLevel || [],
      usageCount: 0,
      rating: undefined,
    },
    version: row.version,
    author: row.author,
    isDefault: row.is_default,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Get all templates for a user (system + custom)
 *
 * Inputs:
 * - userId: User UUID (optional - if null, returns only system templates)
 * - category: Filter by category (resume, cover-letter)
 *
 * Outputs:
 * - Array of Template objects (database + static fallback)
 *
 * Error modes:
 * - Database error: Falls back to static system templates
 * - Empty result: Returns static system templates
 */
export async function getAllTemplates(
  userId?: string | null,
  category?: TemplateCategory
): Promise<Template[]> {
  try {
    // Build query filters
    const filters: {
      eq?: Record<string, string | number | boolean | null>;
    } = {};

    if (category) {
      filters.eq = { category };
    }

    // Fetch system templates (user_id IS NULL)
    const systemResult = await listRows<TemplateRow>("templates", "*", {
      eq: { ...filters.eq, user_id: null },
      order: { column: "name", ascending: true },
    });

    let templates: Template[] = [];

    if (systemResult.data) {
      templates = systemResult.data.map(mapTemplateRowToTemplate);
    }

    // Fetch user custom templates if userId provided
    if (userId) {
      const userCrud = withUser(userId);
      const userResult = await userCrud.listRows<TemplateRow>(
        "templates",
        "*",
        {
          eq: filters.eq as
            | Record<string, string | number | boolean | null>
            | undefined,
          order: { column: "name", ascending: true },
        }
      );

      if (userResult.data) {
        templates = [
          ...templates,
          ...userResult.data.map(mapTemplateRowToTemplate),
        ];
      }
    }

    // Fallback to static templates if database is empty
    if (templates.length === 0) {
      console.warn("No templates in database, using static fallback");
      const fallback = category
        ? getTemplatesByCategory(category)
        : getAllSystemTemplates();
      return fallback;
    }

    return templates;
  } catch (error) {
    console.error("Failed to fetch templates from database:", error);
    // Fallback to static system templates
    const fallback = category
      ? getTemplatesByCategory(category)
      : getAllSystemTemplates();
    return fallback;
  }
}

/**
 * Get user's custom templates only
 *
 * Inputs:
 * - userId: User UUID
 * - category: Optional category filter
 *
 * Outputs:
 * - Array of user's custom Template objects
 */
export async function getUserTemplates(
  userId: string,
  category?: TemplateCategory
): Promise<Template[]> {
  try {
    const userCrud = withUser(userId);
    const filters: {
      eq?: Record<string, string | number | boolean | null>;
    } = {};

    if (category) {
      filters.eq = { category };
    }

    const result = await userCrud.listRows<TemplateRow>("templates", "*", {
      eq: filters.eq,
      order: { column: "created_at", ascending: false },
    });

    if (result.error || !result.data) {
      return [];
    }

    return result.data.map(mapTemplateRowToTemplate);
  } catch (error) {
    console.error("Failed to fetch user templates:", error);
    return [];
  }
}

/**
 * Get template by ID (checks both system and user templates)
 *
 * Inputs:
 * - templateId: Template UUID or string ID
 * - userId: Optional user UUID (needed to fetch user custom templates)
 *
 * Outputs:
 * - Template object or undefined if not found
 */
export async function getTemplateByIdAsync(
  templateId: string,
  userId?: string | null
): Promise<Template | undefined> {
  try {
    // Try database first
    const allTemplates = await getAllTemplates(userId);
    const found = allTemplates.find((t) => t.id === templateId);

    if (found) {
      return found;
    }

    // Fallback to static templates
    return getTemplateById(templateId);
  } catch (error) {
    console.error("Failed to fetch template by ID:", error);
    // Fallback to static templates
    return getTemplateById(templateId);
  }
}

/**
 * Template service object with all functions
 */
export const templateService = {
  // Static (sync) functions - use static data
  getAllSystemTemplates,
  getTemplatesByCategory,
  getTemplatesBySubtype,
  getTemplateById,
  getDefaultTemplate,
  validateTemplate,
  searchTemplates,
  getATSOptimizedTemplates,
  sortByPopularity,
  sortByRating,
  getRecommendedTemplates,
  cloneTemplate,

  // Database (async) functions - fetch from database
  getAllTemplates,
  getUserTemplates,
  getTemplateByIdAsync,
};
