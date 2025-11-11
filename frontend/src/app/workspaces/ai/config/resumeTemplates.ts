/**
 * Resume Templates Configuration
 *
 * Defines available resume templates with their styling and formatting options.
 * Each template specifies visual appearance, section ordering preferences, and export formatting.
 *
 * Templates can be:
 * - System defaults (isSystem: true) - read-only, always available
 * - User custom templates (isSystem: false) - created in TemplatesHub, editable
 */

export interface ResumeTemplate {
  id: string;
  name: string;
  description: string;
  preview?: string; // URL to preview image
  category: "professional" | "creative" | "minimal" | "academic";
  isSystem: boolean; // true = system default (read-only), false = user custom

  // Visual styling
  style: {
    fontFamily: string;
    fontSize: number; // base font size in pt
    lineHeight: number;
    sectionSpacing: number; // spacing between sections in pt
    margins: {
      top: number;
      right: number;
      bottom: number;
      left: number;
    };
    colors: {
      primary: string; // hex color for headings
      secondary: string; // hex color for subheadings
      text: string; // hex color for body text
      accent?: string; // optional accent color
    };
  };

  // Formatting preferences
  formatting: {
    sectionHeaderStyle: "uppercase" | "capitalize" | "lowercase";
    sectionHeaderUnderline: boolean;
    bulletStyle: "•" | "◦" | "–" | "→";
    dateFormat: "MM/YYYY" | "Month YYYY" | "YYYY";
    nameSize: "large" | "xlarge" | "xxlarge";
    showSectionIcons: boolean;
  };

  // Recommended section order (user can override)
  recommendedSectionOrder: string[];
}

export const RESUME_TEMPLATES: Record<string, ResumeTemplate> = {
  classic: {
    id: "classic",
    name: "Classic Professional",
    description:
      "Traditional format perfect for corporate and established industries",
    category: "professional",
    isSystem: true,
    style: {
      fontFamily: "Times New Roman",
      fontSize: 11,
      lineHeight: 1.15,
      sectionSpacing: 12,
      margins: { top: 0.5, right: 0.5, bottom: 0.5, left: 0.5 },
      colors: {
        primary: "#000000",
        secondary: "#333333",
        text: "#000000",
      },
    },
    formatting: {
      sectionHeaderStyle: "uppercase",
      sectionHeaderUnderline: true,
      bulletStyle: "•",
      dateFormat: "MM/YYYY",
      nameSize: "xlarge",
      showSectionIcons: false,
    },
    recommendedSectionOrder: [
      "summary",
      "experience",
      "education",
      "skills",
      "projects",
    ],
  },

  modern: {
    id: "modern",
    name: "Modern Tech",
    description: "Clean, contemporary design for tech and startup roles",
    category: "professional",
    isSystem: true,
    style: {
      fontFamily: "Calibri",
      fontSize: 11,
      lineHeight: 1.2,
      sectionSpacing: 14,
      margins: { top: 0.75, right: 0.75, bottom: 0.75, left: 0.75 },
      colors: {
        primary: "#2563eb", // Blue
        secondary: "#475569",
        text: "#1e293b",
        accent: "#2563eb",
      },
    },
    formatting: {
      sectionHeaderStyle: "uppercase",
      sectionHeaderUnderline: false,
      bulletStyle: "→",
      dateFormat: "Month YYYY",
      nameSize: "xxlarge",
      showSectionIcons: true,
    },
    recommendedSectionOrder: [
      "summary",
      "skills",
      "experience",
      "projects",
      "education",
    ],
  },

  minimal: {
    id: "minimal",
    name: "Minimal Clean",
    description: "Minimalist design focusing on content over decoration",
    category: "minimal",
    isSystem: true,
    style: {
      fontFamily: "Arial",
      fontSize: 10.5,
      lineHeight: 1.3,
      sectionSpacing: 16,
      margins: { top: 1, right: 1, bottom: 1, left: 1 },
      colors: {
        primary: "#000000",
        secondary: "#666666",
        text: "#333333",
      },
    },
    formatting: {
      sectionHeaderStyle: "capitalize",
      sectionHeaderUnderline: false,
      bulletStyle: "–",
      dateFormat: "YYYY",
      nameSize: "large",
      showSectionIcons: false,
    },
    recommendedSectionOrder: [
      "summary",
      "experience",
      "skills",
      "education",
      "projects",
    ],
  },

  creative: {
    id: "creative",
    name: "Creative Bold",
    description: "Eye-catching design for creative and design roles",
    category: "creative",
    isSystem: true,
    style: {
      fontFamily: "Georgia",
      fontSize: 11,
      lineHeight: 1.25,
      sectionSpacing: 18,
      margins: { top: 0.6, right: 0.6, bottom: 0.6, left: 0.6 },
      colors: {
        primary: "#7c3aed", // Purple
        secondary: "#4c1d95",
        text: "#1f2937",
        accent: "#a78bfa",
      },
    },
    formatting: {
      sectionHeaderStyle: "capitalize",
      sectionHeaderUnderline: false,
      bulletStyle: "◦",
      dateFormat: "Month YYYY",
      nameSize: "xxlarge",
      showSectionIcons: true,
    },
    recommendedSectionOrder: [
      "summary",
      "skills",
      "projects",
      "experience",
      "education",
    ],
  },

  academic: {
    id: "academic",
    name: "Academic CV",
    description: "Formal CV format for academic and research positions",
    category: "academic",
    isSystem: true,
    style: {
      fontFamily: "Times New Roman",
      fontSize: 11,
      lineHeight: 1.15,
      sectionSpacing: 10,
      margins: { top: 1, right: 1, bottom: 1, left: 1 },
      colors: {
        primary: "#000000",
        secondary: "#000000",
        text: "#000000",
      },
    },
    formatting: {
      sectionHeaderStyle: "uppercase",
      sectionHeaderUnderline: true,
      bulletStyle: "•",
      dateFormat: "Month YYYY",
      nameSize: "large",
      showSectionIcons: false,
    },
    recommendedSectionOrder: [
      "education",
      "experience",
      "projects",
      "skills",
      "summary",
    ],
  },
};

export const DEFAULT_TEMPLATE_ID = "modern";

// Storage key for user custom templates (from TemplatesHub)
const STORAGE_KEY = "sgt:resume_templates";

/**
 * User custom template from TemplatesHub (localStorage format)
 */
interface StoredTemplate {
  id: string;
  name: string;
  type: "chronological" | "functional" | "hybrid" | "custom";
  colors: {
    primary: string;
    accent: string;
    bg: string;
  };
  font: string;
  layout: "single" | "two-column" | "modern";
  createdAt: string;
  sharedWith?: string[];
  master?: boolean;
}

/**
 * Convert TemplatesHub stored template to ResumeTemplate format
 */
function convertStoredTemplate(stored: StoredTemplate): ResumeTemplate {
  return {
    id: stored.id,
    name: stored.name,
    description: `Custom ${stored.type} template`,
    category: stored.type === "hybrid" ? "professional" : "professional", // Map types to categories
    isSystem: false, // User custom templates are not system templates
    style: {
      fontFamily: stored.font,
      fontSize: 11,
      lineHeight: 1.2,
      sectionSpacing: 14,
      margins: { top: 0.75, right: 0.75, bottom: 0.75, left: 0.75 },
      colors: {
        primary: stored.colors.primary,
        secondary: stored.colors.accent,
        text: "#000000",
        accent: stored.colors.accent,
      },
    },
    formatting: {
      sectionHeaderStyle: "uppercase",
      sectionHeaderUnderline: false,
      bulletStyle: "•",
      dateFormat: "MM/YYYY",
      nameSize: "large",
      showSectionIcons: false,
    },
    recommendedSectionOrder: [
      "summary",
      "experience",
      "education",
      "skills",
      "projects",
    ],
  };
}

/**
 * Load user custom templates from TemplatesHub localStorage
 */
function getUserCustomTemplates(): ResumeTemplate[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];

    const templates = JSON.parse(stored) as StoredTemplate[];
    return templates.map(convertStoredTemplate);
  } catch (error) {
    console.error("Failed to load custom templates:", error);
    return [];
  }
}

export function getTemplate(templateId?: string): ResumeTemplate {
  // Check system templates first
  if (RESUME_TEMPLATES[templateId || DEFAULT_TEMPLATE_ID]) {
    return RESUME_TEMPLATES[templateId || DEFAULT_TEMPLATE_ID];
  }

  // Check user custom templates
  const customTemplates = getUserCustomTemplates();
  const customTemplate = customTemplates.find((t) => t.id === templateId);
  if (customTemplate) {
    return customTemplate;
  }

  // Fallback to default
  return RESUME_TEMPLATES[DEFAULT_TEMPLATE_ID];
}

export function getTemplateList(): ResumeTemplate[] {
  // Merge system templates with user custom templates
  const systemTemplates = Object.values(RESUME_TEMPLATES);
  const customTemplates = getUserCustomTemplates();

  // System templates first, then custom templates
  return [...systemTemplates, ...customTemplates];
}
