/**
 * System Themes - Pre-built visual styling themes
 *
 * Contains 8 professional themes for document styling
 */

import type { Theme } from "../../types";

/**
 * PROFESSIONAL THEME
 * Conservative, corporate-friendly styling
 */
export const PROFESSIONAL_THEME: Theme = {
  id: "theme-professional",
  name: "Professional",
  category: "professional",

  typography: {
    headingFont: {
      family: "Georgia",
      weights: [400, 700],
      fallbacks: ["Times New Roman", "serif"],
    },
    bodyFont: {
      family: "Arial",
      weights: [400, 600],
      fallbacks: ["Helvetica", "sans-serif"],
    },
    sizes: {
      h1: 18,
      h2: 14,
      h3: 12,
      body: 11,
      small: 9,
    },
    lineHeight: {
      tight: 1.15,
      normal: 1.3,
      relaxed: 1.5,
    },
  },

  colors: {
    primary: "#1a1a1a",
    secondary: "#4a4a4a",
    accent: "#2563eb",
    text: {
      primary: "#000000",
      secondary: "#4a4a4a",
      muted: "#6b7280",
    },
    background: {
      paper: "#ffffff",
      section: "#f9fafb",
      subtle: "#f3f4f6",
    },
    border: "#d1d5db",
    link: "#2563eb",
  },

  spacing: {
    section: 1.5,
    subsection: 1.0,
    item: 0.5,
    baseUnit: 1,
  },

  elements: {
    sectionDivider: "line",
    bulletStyle: "circle",
    headerStyle: "underline",
    iconSet: "none",
  },

  metadata: {
    thumbnail: "/themes/professional.png",
    description:
      "Conservative, corporate-friendly styling with serif headings and clean layout.",
    tags: ["professional", "corporate", "traditional", "formal"],
    recommendedFor: ["resume", "cover-letter"],
    usageCount: 0,
    rating: 4.7,
  },

  version: 1,
  createdAt: "2025-01-01T00:00:00Z",
  updatedAt: "2025-01-01T00:00:00Z",
  author: "system",
  isDefault: true,
};

/**
 * MODERN THEME
 * Bold, contemporary design with sans-serif fonts
 */
export const MODERN_THEME: Theme = {
  id: "theme-modern",
  name: "Modern",
  category: "modern",

  typography: {
    headingFont: {
      family: "Inter",
      weights: [600, 700, 800],
      fallbacks: ["system-ui", "sans-serif"],
      googleFontsUrl:
        "https://fonts.googleapis.com/css2?family=Inter:wght@600;700;800&display=swap",
    },
    bodyFont: {
      family: "Inter",
      weights: [400, 500],
      fallbacks: ["system-ui", "sans-serif"],
      googleFontsUrl:
        "https://fonts.googleapis.com/css2?family=Inter:wght@400;500&display=swap",
    },
    sizes: {
      h1: 20,
      h2: 15,
      h3: 13,
      body: 11,
      small: 9,
    },
    lineHeight: {
      tight: 1.2,
      normal: 1.4,
      relaxed: 1.6,
    },
  },

  colors: {
    primary: "#0f172a",
    secondary: "#334155",
    accent: "#3b82f6",
    text: {
      primary: "#0f172a",
      secondary: "#475569",
      muted: "#64748b",
    },
    background: {
      paper: "#ffffff",
      section: "#f8fafc",
      subtle: "#f1f5f9",
    },
    border: "#cbd5e1",
    link: "#3b82f6",
  },

  spacing: {
    section: 1.75,
    subsection: 1.25,
    item: 0.6,
    baseUnit: 1,
  },

  elements: {
    sectionDivider: "space",
    bulletStyle: "square",
    headerStyle: "background",
    iconSet: "material",
  },

  metadata: {
    thumbnail: "/themes/modern.png",
    description:
      "Bold, contemporary design with strong typography and clean spacing.",
    tags: ["modern", "contemporary", "bold", "tech"],
    recommendedFor: ["resume", "cover-letter"],
    usageCount: 0,
    rating: 4.8,
  },

  version: 1,
  createdAt: "2025-01-01T00:00:00Z",
  updatedAt: "2025-01-01T00:00:00Z",
  author: "system",
  isDefault: false,
};

/**
 * CREATIVE THEME
 * Unique, personality-driven design
 */
export const CREATIVE_THEME: Theme = {
  id: "theme-creative",
  name: "Creative",
  category: "creative",

  typography: {
    headingFont: {
      family: "Playfair Display",
      weights: [600, 700],
      fallbacks: ["Georgia", "serif"],
      googleFontsUrl:
        "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&display=swap",
    },
    bodyFont: {
      family: "Lato",
      weights: [400, 600],
      fallbacks: ["Arial", "sans-serif"],
      googleFontsUrl:
        "https://fonts.googleapis.com/css2?family=Lato:wght@400;600&display=swap",
    },
    sizes: {
      h1: 22,
      h2: 16,
      h3: 13,
      body: 11,
      small: 9,
    },
    lineHeight: {
      tight: 1.25,
      normal: 1.45,
      relaxed: 1.65,
    },
  },

  colors: {
    primary: "#7c3aed",
    secondary: "#6366f1",
    accent: "#ec4899",
    text: {
      primary: "#1f2937",
      secondary: "#4b5563",
      muted: "#6b7280",
    },
    background: {
      paper: "#ffffff",
      section: "#faf5ff",
      subtle: "#f5f3ff",
    },
    border: "#ddd6fe",
    link: "#7c3aed",
  },

  spacing: {
    section: 2.0,
    subsection: 1.5,
    item: 0.75,
    baseUnit: 1,
  },

  elements: {
    sectionDivider: "icon",
    bulletStyle: "custom",
    headerStyle: "border",
    iconSet: "feather",
    decorative: {
      corners: true,
      headerAccent: true,
    },
  },

  metadata: {
    thumbnail: "/themes/creative.png",
    description:
      "Unique, personality-driven design with elegant typography and creative accents.",
    tags: ["creative", "unique", "artistic", "design"],
    recommendedFor: ["resume"],
    usageCount: 0,
    rating: 4.5,
  },

  version: 1,
  createdAt: "2025-01-01T00:00:00Z",
  updatedAt: "2025-01-01T00:00:00Z",
  author: "system",
  isDefault: false,
};

/**
 * MINIMAL THEME
 * Clean, black & white simplicity
 */
export const MINIMAL_THEME: Theme = {
  id: "theme-minimal",
  name: "Minimal",
  category: "minimal",

  typography: {
    headingFont: {
      family: "Helvetica",
      weights: [400, 700],
      fallbacks: ["Arial", "sans-serif"],
    },
    bodyFont: {
      family: "Helvetica",
      weights: [400],
      fallbacks: ["Arial", "sans-serif"],
    },
    sizes: {
      h1: 16,
      h2: 13,
      h3: 11,
      body: 10,
      small: 8,
    },
    lineHeight: {
      tight: 1.1,
      normal: 1.25,
      relaxed: 1.4,
    },
  },

  colors: {
    primary: "#000000",
    secondary: "#000000",
    accent: "#000000",
    text: {
      primary: "#000000",
      secondary: "#404040",
      muted: "#666666",
    },
    background: {
      paper: "#ffffff",
      section: "#ffffff",
      subtle: "#fafafa",
    },
    border: "#e5e5e5",
    link: "#000000",
  },

  spacing: {
    section: 1.25,
    subsection: 0.75,
    item: 0.4,
    baseUnit: 1,
  },

  elements: {
    sectionDivider: "space",
    bulletStyle: "dash",
    headerStyle: "none",
    iconSet: "none",
  },

  metadata: {
    thumbnail: "/themes/minimal.png",
    description:
      "Clean, black & white simplicity with maximum content density and minimal decoration.",
    tags: ["minimal", "simple", "clean", "monochrome"],
    recommendedFor: ["resume", "cover-letter"],
    usageCount: 0,
    rating: 4.6,
  },

  version: 1,
  createdAt: "2025-01-01T00:00:00Z",
  updatedAt: "2025-01-01T00:00:00Z",
  author: "system",
  isDefault: false,
};

/**
 * BOLD THEME
 * Strong colors and confident typography
 */
export const BOLD_THEME: Theme = {
  id: "theme-bold",
  name: "Bold",
  category: "bold",

  typography: {
    headingFont: {
      family: "Montserrat",
      weights: [700, 800, 900],
      fallbacks: ["Arial Black", "sans-serif"],
      googleFontsUrl:
        "https://fonts.googleapis.com/css2?family=Montserrat:wght@700;800;900&display=swap",
    },
    bodyFont: {
      family: "Open Sans",
      weights: [400, 600],
      fallbacks: ["Arial", "sans-serif"],
      googleFontsUrl:
        "https://fonts.googleapis.com/css2?family=Open+Sans:wght@400;600&display=swap",
    },
    sizes: {
      h1: 24,
      h2: 16,
      h3: 13,
      body: 11,
      small: 9,
    },
    lineHeight: {
      tight: 1.15,
      normal: 1.35,
      relaxed: 1.5,
    },
  },

  colors: {
    primary: "#dc2626",
    secondary: "#ea580c",
    accent: "#f59e0b",
    text: {
      primary: "#111827",
      secondary: "#374151",
      muted: "#6b7280",
    },
    background: {
      paper: "#ffffff",
      section: "#fef2f2",
      subtle: "#fee2e2",
    },
    border: "#fca5a5",
    link: "#dc2626",
  },

  spacing: {
    section: 2.0,
    subsection: 1.5,
    item: 0.75,
    baseUnit: 1,
  },

  elements: {
    sectionDivider: "line",
    bulletStyle: "chevron",
    headerStyle: "background",
    iconSet: "material",
    decorative: {
      headerAccent: true,
    },
  },

  metadata: {
    thumbnail: "/themes/bold.png",
    description:
      "Strong colors and confident typography that demands attention.",
    tags: ["bold", "strong", "confident", "standout"],
    recommendedFor: ["resume"],
    usageCount: 0,
    rating: 4.4,
  },

  version: 1,
  createdAt: "2025-01-01T00:00:00Z",
  updatedAt: "2025-01-01T00:00:00Z",
  author: "system",
  isDefault: false,
};

/**
 * EXECUTIVE THEME
 * Luxury, elegant styling for senior positions
 */
export const EXECUTIVE_THEME: Theme = {
  id: "theme-executive",
  name: "Executive",
  category: "professional",

  typography: {
    headingFont: {
      family: "Merriweather",
      weights: [700, 900],
      fallbacks: ["Georgia", "serif"],
      googleFontsUrl:
        "https://fonts.googleapis.com/css2?family=Merriweather:wght@700;900&display=swap",
    },
    bodyFont: {
      family: "Lora",
      weights: [400, 500],
      fallbacks: ["Georgia", "serif"],
      googleFontsUrl:
        "https://fonts.googleapis.com/css2?family=Lora:wght@400;500&display=swap",
    },
    sizes: {
      h1: 20,
      h2: 15,
      h3: 12,
      body: 11,
      small: 9,
    },
    lineHeight: {
      tight: 1.2,
      normal: 1.5,
      relaxed: 1.7,
    },
  },

  colors: {
    primary: "#1e293b",
    secondary: "#475569",
    accent: "#0891b2",
    text: {
      primary: "#0f172a",
      secondary: "#334155",
      muted: "#64748b",
    },
    background: {
      paper: "#ffffff",
      section: "#f8fafc",
      subtle: "#f1f5f9",
    },
    border: "#94a3b8",
    link: "#0891b2",
  },

  spacing: {
    section: 2.0,
    subsection: 1.5,
    item: 0.75,
    baseUnit: 1,
  },

  elements: {
    sectionDivider: "line",
    bulletStyle: "circle",
    headerStyle: "underline",
    iconSet: "none",
  },

  metadata: {
    thumbnail: "/themes/executive.png",
    description:
      "Luxury, elegant styling perfect for senior positions and executive roles.",
    tags: ["executive", "luxury", "elegant", "senior"],
    recommendedFor: ["resume", "cover-letter"],
    usageCount: 0,
    rating: 4.7,
  },

  version: 1,
  createdAt: "2025-01-01T00:00:00Z",
  updatedAt: "2025-01-01T00:00:00Z",
  author: "system",
  isDefault: false,
};

/**
 * TECH THEME
 * Technical, monospace styling
 */
export const TECH_THEME: Theme = {
  id: "theme-tech",
  name: "Tech",
  category: "modern",

  typography: {
    headingFont: {
      family: "JetBrains Mono",
      weights: [600, 700],
      fallbacks: ["Courier New", "monospace"],
      googleFontsUrl:
        "https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@600;700&display=swap",
    },
    bodyFont: {
      family: "Roboto",
      weights: [400, 500],
      fallbacks: ["Arial", "sans-serif"],
      googleFontsUrl:
        "https://fonts.googleapis.com/css2?family=Roboto:wght@400;500&display=swap",
    },
    sizes: {
      h1: 18,
      h2: 14,
      h3: 12,
      body: 10.5,
      small: 9,
    },
    lineHeight: {
      tight: 1.2,
      normal: 1.4,
      relaxed: 1.6,
    },
  },

  colors: {
    primary: "#0ea5e9",
    secondary: "#06b6d4",
    accent: "#10b981",
    text: {
      primary: "#0c4a6e",
      secondary: "#0e7490",
      muted: "#67e8f9",
    },
    background: {
      paper: "#ffffff",
      section: "#f0f9ff",
      subtle: "#e0f2fe",
    },
    border: "#7dd3fc",
    link: "#0ea5e9",
  },

  spacing: {
    section: 1.5,
    subsection: 1.0,
    item: 0.5,
    baseUnit: 1,
  },

  elements: {
    sectionDivider: "line",
    bulletStyle: "chevron",
    headerStyle: "border",
    iconSet: "material",
  },

  metadata: {
    thumbnail: "/themes/tech.png",
    description:
      "Technical styling with monospace headings, perfect for developer roles.",
    tags: ["tech", "developer", "monospace", "technical"],
    recommendedFor: ["resume"],
    usageCount: 0,
    rating: 4.6,
  },

  version: 1,
  createdAt: "2025-01-01T00:00:00Z",
  updatedAt: "2025-01-01T00:00:00Z",
  author: "system",
  isDefault: false,
};

/**
 * ACADEMIC THEME
 * Traditional, scholarly styling
 */
export const ACADEMIC_THEME: Theme = {
  id: "theme-academic",
  name: "Academic",
  category: "professional",

  typography: {
    headingFont: {
      family: "Times New Roman",
      weights: [400, 700],
      fallbacks: ["Georgia", "serif"],
    },
    bodyFont: {
      family: "Times New Roman",
      weights: [400],
      fallbacks: ["Georgia", "serif"],
    },
    sizes: {
      h1: 16,
      h2: 14,
      h3: 12,
      body: 12,
      small: 10,
    },
    lineHeight: {
      tight: 1.0,
      normal: 1.5,
      relaxed: 2.0,
    },
  },

  colors: {
    primary: "#000000",
    secondary: "#1a1a1a",
    accent: "#1e40af",
    text: {
      primary: "#000000",
      secondary: "#333333",
      muted: "#666666",
    },
    background: {
      paper: "#ffffff",
      section: "#ffffff",
      subtle: "#fafafa",
    },
    border: "#cccccc",
    link: "#1e40af",
  },

  spacing: {
    section: 1.5,
    subsection: 1.0,
    item: 0.5,
    baseUnit: 1,
  },

  elements: {
    sectionDivider: "space",
    bulletStyle: "circle",
    headerStyle: "none",
    iconSet: "none",
  },

  metadata: {
    thumbnail: "/themes/academic.png",
    description:
      "Traditional, scholarly styling following academic conventions.",
    tags: ["academic", "traditional", "scholarly", "research"],
    recommendedFor: ["resume", "cover-letter"],
    usageCount: 0,
    rating: 4.5,
  },

  version: 1,
  createdAt: "2025-01-01T00:00:00Z",
  updatedAt: "2025-01-01T00:00:00Z",
  author: "system",
  isDefault: false,
};

export const SYSTEM_THEMES: Theme[] = [
  PROFESSIONAL_THEME,
  MODERN_THEME,
  MINIMAL_THEME,
  CREATIVE_THEME,
  BOLD_THEME,
  EXECUTIVE_THEME,
  TECH_THEME,
  ACADEMIC_THEME,
];
