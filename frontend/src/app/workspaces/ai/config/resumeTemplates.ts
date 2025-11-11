/**
 * Resume Templates Configuration
 *
 * CRITICAL DISTINCTION:
 * - TEMPLATE = AI behavior/content generation strategy (classic, modern, creative, etc.)
 *   Controls HOW the AI writes: tone, emphasis, industry language, achievement framing
 *   Example: "Modern Tech" template tells AI to emphasize innovation, quantifiable impact, cutting-edge skills
 *
 * - VISUAL STYLE = Export appearance (fonts, colors, layout)
 *   Controls HOW the resume LOOKS when exported to PDF/DOCX
 *   Example: "Modern" visual style uses Calibri font, blue accents, arrow bullets
 *
 * Templates include both: AI generation guidance + default visual styling
 * Users can override visual style at export time while keeping the template's AI behavior
 *
 * Each template specifies:
 * - AI generation behavior (described in template description)
 * - Visual appearance (style object with fonts, colors, formatting)
 * - Section ordering preferences
 * - Target industries/roles
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
      "Traditional format perfect for corporate and established industries. AI emphasizes formal tone, proven results, and industry-standard terminology. Best for: Finance, Law, Government, Healthcare.",
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
    description:
      "Clean, contemporary design for tech and startup roles. AI emphasizes innovation, technical achievements, and quantifiable impact. Highlights cutting-edge skills and modern methodologies. Best for: Software Engineering, Product Management, Data Science.",
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
    description:
      "Minimalist design focusing on content over decoration. AI emphasizes clarity, conciseness, and essential information. Creates streamlined, distraction-free content. Best for: Consulting, Operations, General Management.",
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
    description:
      "Eye-catching design for creative and design roles. AI emphasizes creativity, storytelling, and unique achievements. Highlights portfolio work, design thinking, and innovative solutions. Best for: Design, Marketing, Creative Direction, UX/UI.",
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
    description:
      "Formal CV format for academic and research positions. AI emphasizes publications, research contributions, grants, and teaching experience. Focuses on scholarly achievements and detailed methodology. Best for: Research, Academia, Science, PhD roles.",
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

/**
 * Get template by ID
 * Only returns system templates (AI behavior templates)
 * Custom visual styles are handled at export time, not as templates
 */
export function getTemplate(templateId?: string): ResumeTemplate {
  const id = templateId || DEFAULT_TEMPLATE_ID;
  return RESUME_TEMPLATES[id] || RESUME_TEMPLATES[DEFAULT_TEMPLATE_ID];
}

/**
 * Get list of all available templates
 * Only returns system templates (AI behavior templates)
 * Custom templates removed - use 5 system templates for AI behavior,
 * customize visual styling at export time instead
 */
export function getTemplateList(): ResumeTemplate[] {
  return Object.values(RESUME_TEMPLATES);
}
