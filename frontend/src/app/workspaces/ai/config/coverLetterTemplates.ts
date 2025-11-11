/**
 * COVER LETTER TEMPLATES CONFIGURATION
 *
 * WHAT: System and custom cover letter templates with tone, style, and formatting settings
 * WHY: Provide professional, industry-specific templates with consistent structure
 *
 * Template Structure:
 * - System templates: 5 pre-built professional templates (read-only, isSystem: true)
 * - Custom templates: User-created templates loaded from localStorage (isSystem: false)
 *
 * Tone Options:
 * - formal: Traditional corporate language, professional tone
 * - casual: Approachable, conversational while maintaining professionalism
 * - enthusiastic: Energetic, passionate, shows excitement
 * - analytical: Data-driven, logical, technical focus
 *
 * Length Options:
 * - brief: 200-300 words, concise and to the point
 * - standard: 300-400 words, comprehensive coverage
 * - detailed: 400-500 words, in-depth explanation
 *
 * Company Culture:
 * - corporate: Traditional, hierarchical, formal
 * - startup: Fast-paced, innovative, casual
 * - creative: Design-focused, artistic, expressive
 */

// ========== INTERFACES ==========

export interface CoverLetterTemplate {
  id: string;
  name: string;
  description: string;
  preview?: string; // Preview image path
  category: "professional" | "creative" | "minimal" | "technical" | "modern";
  isSystem: boolean; // true = system default (read-only), false = user custom

  // Style configuration
  style: {
    fontFamily: string; // Primary font
    fontSize: number; // Base font size (px)
    lineHeight: number; // Line height multiplier
    margins: {
      top: number;
      right: number;
      bottom: number;
      left: number;
    };
    colors: {
      primary: string; // Header/emphasis color
      text: string; // Body text color
      accent: string; // Links/highlights
      background: string; // Page background
    };
  };

  // Formatting preferences
  formatting: {
    headerStyle: "left" | "center" | "right"; // Name/contact alignment
    paragraphSpacing: number; // Space between paragraphs (px)
    salutationStyle: "formal" | "casual"; // "Dear Hiring Manager" vs "Hello Team"
    closingStyle: "formal" | "casual"; // "Sincerely" vs "Best regards"
    includeDate: boolean; // Show date in header
    includeAddress: boolean; // Show company address
  };

  // Default tone and settings
  defaultTone: "formal" | "casual" | "enthusiastic" | "analytical";
  defaultLength: "brief" | "standard" | "detailed";
  defaultCulture: "corporate" | "startup" | "creative";

  // Structure template
  structure: {
    opening: string; // Template for opening paragraph
    bodyParagraphs: number; // Recommended number of body paragraphs
    closing: string; // Template for closing paragraph
  };
}

// ========== TYPE EXPORTS ==========

export type Tone = "formal" | "casual" | "enthusiastic" | "analytical";
export type Length = "brief" | "standard" | "detailed";
export type CompanyCulture = "corporate" | "startup" | "creative";

// ========== SYSTEM TEMPLATES ==========
// NOTE: Only 3 system templates (formal, creative, technical) are included by default.
//       Modern and Minimal are available as example custom templates to demonstrate import functionality.

export const COVER_LETTER_TEMPLATES: Record<string, CoverLetterTemplate> = {
  formal: {
    id: "formal",
    name: "Formal Corporate",
    description:
      "Traditional corporate template for established companies and formal industries like finance, law, consulting",
    category: "professional",
    isSystem: true,
    style: {
      fontFamily: "'Times New Roman', Times, serif",
      fontSize: 12,
      lineHeight: 1.6,
      margins: { top: 72, right: 72, bottom: 72, left: 72 },
      colors: {
        primary: "#000000",
        text: "#000000",
        accent: "#003366",
        background: "#ffffff",
      },
    },
    formatting: {
      headerStyle: "left",
      paragraphSpacing: 16,
      salutationStyle: "formal",
      closingStyle: "formal",
      includeDate: true,
      includeAddress: true,
    },
    defaultTone: "formal",
    defaultLength: "standard",
    defaultCulture: "corporate",
    structure: {
      opening:
        "I am writing to express my strong interest in the [POSITION] role at [COMPANY]. With [X] years of experience in [FIELD], I am confident in my ability to contribute effectively to your team.",
      bodyParagraphs: 2,
      closing:
        "I would welcome the opportunity to discuss how my background and skills would be an asset to [COMPANY]. Thank you for your consideration.",
    },
  },

  creative: {
    id: "creative",
    name: "Creative Design",
    description:
      "Modern, visually appealing template for creative industries like design, marketing, media",
    category: "creative",
    isSystem: true,
    style: {
      fontFamily: "'Montserrat', 'Helvetica Neue', Arial, sans-serif",
      fontSize: 11,
      lineHeight: 1.7,
      margins: { top: 60, right: 60, bottom: 60, left: 60 },
      colors: {
        primary: "#6B46C1", // Purple
        text: "#2D3748",
        accent: "#805AD5",
        background: "#F7FAFC",
      },
    },
    formatting: {
      headerStyle: "center",
      paragraphSpacing: 20,
      salutationStyle: "casual",
      closingStyle: "casual",
      includeDate: false,
      includeAddress: false,
    },
    defaultTone: "enthusiastic",
    defaultLength: "standard",
    defaultCulture: "creative",
    structure: {
      opening:
        "I'm thrilled by the opportunity to bring my creative vision and innovative approach to the [POSITION] role at [COMPANY].",
      bodyParagraphs: 3,
      closing:
        "I'd love to discuss how my passion for design and storytelling can help [COMPANY] achieve its goals. Looking forward to connecting!",
    },
  },

  technical: {
    id: "technical",
    name: "Technical Professional",
    description:
      "Clean, data-focused template for engineering, IT, and technical roles",
    category: "technical",
    isSystem: true,
    style: {
      fontFamily: "'Roboto Mono', 'Courier New', monospace",
      fontSize: 11,
      lineHeight: 1.6,
      margins: { top: 64, right: 64, bottom: 64, left: 64 },
      colors: {
        primary: "#1A202C",
        text: "#2D3748",
        accent: "#3182CE", // Blue
        background: "#FFFFFF",
      },
    },
    formatting: {
      headerStyle: "left",
      paragraphSpacing: 14,
      salutationStyle: "formal",
      closingStyle: "formal",
      includeDate: true,
      includeAddress: false,
    },
    defaultTone: "analytical",
    defaultLength: "standard",
    defaultCulture: "corporate",
    structure: {
      opening:
        "As a software engineer with expertise in [TECH_STACK], I am eager to contribute to [COMPANY]'s mission of building scalable, high-performing solutions.",
      bodyParagraphs: 2,
      closing:
        "I look forward to discussing how my technical skills and problem-solving approach can support [COMPANY]'s engineering goals.",
    },
  },
};

// ========== EXAMPLE CUSTOM TEMPLATES ==========
// These templates demonstrate the custom template import functionality.
// Users can import these JSON files to add them to their template library.

export const EXAMPLE_CUSTOM_TEMPLATES: CoverLetterTemplate[] = [
  {
    id: "modern",
    name: "Modern Startup",
    description:
      "Contemporary template for startups, tech companies, and fast-paced environments",
    category: "modern",
    isSystem: false, // This is a custom template
    style: {
      fontFamily: "'Inter', 'Segoe UI', Tahoma, sans-serif",
      fontSize: 11,
      lineHeight: 1.7,
      margins: { top: 56, right: 56, bottom: 56, left: 56 },
      colors: {
        primary: "#2B6CB0", // Blue
        text: "#1A202C",
        accent: "#3182CE",
        background: "#FFFFFF",
      },
    },
    formatting: {
      headerStyle: "left",
      paragraphSpacing: 18,
      salutationStyle: "casual",
      closingStyle: "casual",
      includeDate: false,
      includeAddress: false,
    },
    defaultTone: "enthusiastic",
    defaultLength: "brief",
    defaultCulture: "startup",
    structure: {
      opening:
        "I'm excited about the [POSITION] opportunity at [COMPANY] and the chance to help scale your innovative solutions.",
      bodyParagraphs: 2,
      closing:
        "Let's connect to explore how I can contribute to [COMPANY]'s growth and success!",
    },
  },

  {
    id: "minimal",
    name: "Minimal Clean",
    description: "Simple, elegant template focusing on content over design",
    category: "minimal",
    isSystem: false, // This is a custom template
    style: {
      fontFamily: "'Helvetica Neue', Arial, sans-serif",
      fontSize: 11,
      lineHeight: 1.6,
      margins: { top: 72, right: 72, bottom: 72, left: 72 },
      colors: {
        primary: "#000000",
        text: "#333333",
        accent: "#666666",
        background: "#FFFFFF",
      },
    },
    formatting: {
      headerStyle: "left",
      paragraphSpacing: 16,
      salutationStyle: "formal",
      closingStyle: "formal",
      includeDate: true,
      includeAddress: false,
    },
    defaultTone: "formal",
    defaultLength: "brief",
    defaultCulture: "corporate",
    structure: {
      opening:
        "I am interested in the [POSITION] role at [COMPANY] and believe my skills align well with your requirements.",
      bodyParagraphs: 2,
      closing:
        "Thank you for considering my application. I look forward to the opportunity to discuss this position further.",
    },
  },
];

// ========== CUSTOM TEMPLATES ==========

const STORAGE_KEY = "sgt:cover_letter_templates";

/**
 * STORED TEMPLATE FORMAT (localStorage)
 * Matches format from TemplatesHub for custom templates
 */
interface StoredCoverLetterTemplate {
  id: string;
  name: string;
  description?: string;
  category: string;
  style: {
    fontFamily: string;
    fontSize: number;
    colors: {
      primary: string;
      accent: string;
      background: string;
    };
  };
  formatting: {
    headerStyle: string;
    salutationStyle: string;
    closingStyle: string;
  };
  // Additional fields as needed
}

/**
 * CONVERT STORED TEMPLATE TO COVER LETTER TEMPLATE
 * Maps localStorage format → CoverLetterTemplate interface
 */
function convertStoredTemplate(
  stored: StoredCoverLetterTemplate
): CoverLetterTemplate {
  return {
    id: stored.id,
    name: stored.name,
    description: stored.description || "Custom template",
    category: (stored.category?.toLowerCase() ||
      "professional") as CoverLetterTemplate["category"],
    isSystem: false, // Custom templates are not system templates

    style: {
      fontFamily: stored.style?.fontFamily || "'Arial', sans-serif",
      fontSize: stored.style?.fontSize || 11,
      lineHeight: 1.6,
      margins: { top: 72, right: 72, bottom: 72, left: 72 },
      colors: {
        primary: stored.style?.colors?.primary || "#000000",
        text: "#333333",
        accent: stored.style?.colors?.accent || "#666666",
        background: stored.style?.colors?.background || "#FFFFFF",
      },
    },

    formatting: {
      headerStyle: (stored.formatting?.headerStyle || "left") as
        | "left"
        | "center"
        | "right",
      paragraphSpacing: 16,
      salutationStyle: (stored.formatting?.salutationStyle || "formal") as
        | "formal"
        | "casual",
      closingStyle: (stored.formatting?.closingStyle || "formal") as
        | "formal"
        | "casual",
      includeDate: true,
      includeAddress: false,
    },

    defaultTone: "formal",
    defaultLength: "standard",
    defaultCulture: "corporate",

    structure: {
      opening:
        "I am writing to express my interest in the [POSITION] role at [COMPANY].",
      bodyParagraphs: 2,
      closing:
        "Thank you for your consideration. I look forward to discussing this opportunity further.",
    },
  };
}

/**
 * GET USER CUSTOM TEMPLATES
 * Loads custom templates from localStorage (created in TemplatesHub or imported)
 */
function getUserCustomTemplates(): CoverLetterTemplate[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];

    const templates: StoredCoverLetterTemplate[] = JSON.parse(stored);
    return templates.map(convertStoredTemplate);
  } catch (error) {
    console.error("Error loading custom cover letter templates:", error);
    return [];
  }
}

// ========== PUBLIC API ==========

/**
 * GET TEMPLATE BY ID
 * Checks system templates first, then custom templates
 */
export function getCoverLetterTemplate(
  templateId?: string
): CoverLetterTemplate {
  if (!templateId) return COVER_LETTER_TEMPLATES.formal;

  // Check system templates
  if (COVER_LETTER_TEMPLATES[templateId]) {
    return COVER_LETTER_TEMPLATES[templateId];
  }

  // Check custom templates
  const customTemplates = getUserCustomTemplates();
  const customTemplate = customTemplates.find((t) => t.id === templateId);
  if (customTemplate) return customTemplate;

  // Default fallback
  return COVER_LETTER_TEMPLATES.formal;
}

/**
 * GET ALL TEMPLATES (SYSTEM + CUSTOM)
 * Returns merged list: system templates first, then custom templates
 */
export function getCoverLetterTemplateList(): CoverLetterTemplate[] {
  const systemTemplates = Object.values(COVER_LETTER_TEMPLATES);
  const customTemplates = getUserCustomTemplates();
  return [...systemTemplates, ...customTemplates];
}

/**
 * GET SYSTEM TEMPLATES ONLY
 */
export function getSystemCoverLetterTemplates(): CoverLetterTemplate[] {
  return Object.values(COVER_LETTER_TEMPLATES);
}

/**
 * GET CUSTOM TEMPLATES ONLY
 */
export function getCustomCoverLetterTemplates(): CoverLetterTemplate[] {
  return getUserCustomTemplates();
}

/**
 * EXPORT EXAMPLE TEMPLATE AS JSON
 * Generates downloadable JSON file for template import demonstration
 */
export function exportExampleTemplate(templateId: "modern" | "minimal"): void {
  const template = EXAMPLE_CUSTOM_TEMPLATES.find((t) => t.id === templateId);
  if (!template) return;

  const json = JSON.stringify(template, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `cover-letter-template-${templateId}.json`;
  link.click();
  URL.revokeObjectURL(url);
}

/**
 * IMPORT CUSTOM TEMPLATE FROM JSON
 * Validates and saves imported template to localStorage
 */
export function importCustomTemplate(
  jsonFile: File
): Promise<CoverLetterTemplate> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const template = JSON.parse(
          e.target?.result as string
        ) as CoverLetterTemplate;

        // Validate required fields
        if (
          !template.id ||
          !template.name ||
          !template.style ||
          !template.formatting
        ) {
          throw new Error("Invalid template structure");
        }

        // Ensure isSystem is false for imported templates
        template.isSystem = false;

        // Get existing custom templates
        const existing = getUserCustomTemplates();

        // Check for duplicate ID
        if (existing.some((t) => t.id === template.id)) {
          template.id = `${template.id}-${Date.now()}`;
        }

        // Save to localStorage
        const updated = [...existing, template];
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

        resolve(template);
      } catch {
        reject(new Error("Failed to parse template JSON"));
      }
    };

    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsText(jsonFile);
  });
}

/**
 * TONE DESCRIPTIONS
 * Help text for tone selection
 */
export const TONE_DESCRIPTIONS = {
  formal:
    "Professional, traditional corporate language. Best for finance, law, consulting.",
  casual:
    "Approachable and conversational while maintaining professionalism. Good for tech, creative industries.",
  enthusiastic:
    "Energetic and passionate tone showing genuine excitement. Great for startups, sales, marketing.",
  analytical:
    "Data-driven, logical, technical focus. Ideal for engineering, data science, research.",
};

/**
 * LENGTH DESCRIPTIONS
 * Help text for length selection
 */
export const LENGTH_DESCRIPTIONS = {
  brief:
    "200-300 words. Concise and to the point. Best when word limit specified or for follow-up applications.",
  standard:
    "300-400 words. Comprehensive coverage of key qualifications. Most common length.",
  detailed:
    "400-500 words. In-depth explanation of experience and fit. Use when you have highly relevant background.",
};

/**
 * CULTURE DESCRIPTIONS
 * Help text for company culture matching
 */
export const CULTURE_DESCRIPTIONS = {
  corporate:
    "Traditional, hierarchical, formal. Large established companies, finance, law.",
  startup:
    "Fast-paced, innovative, casual. Tech startups, small companies, agile environments.",
  creative:
    "Design-focused, artistic, expressive. Agencies, media, entertainment, design firms.",
};
