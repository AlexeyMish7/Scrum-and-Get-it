/**
 * Design Preset Definitions
 *
 * Each design preset defines shapes, shadows, and effects.
 * These are completely color-agnostic and work with any color preset.
 */

import type {
  DesignPreset,
  DesignPresetId,
  DesignPresetCollection,
} from "./types";

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// MODERN - Clean, balanced, professional
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const modernDesign: DesignPreset = {
  id: "modern",
  name: "Modern",
  description: "Clean design with balanced corners and subtle shadows",
  borderRadius: {
    none: 0,
    sm: 6,
    md: 8,
    lg: 12,
    xl: 16,
    full: 9999,
  },
  elevation: {
    none: "none",
    level1: "0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.06)",
    level2: "0 4px 6px rgba(0,0,0,0.07), 0 2px 4px rgba(0,0,0,0.06)",
    level3: "0 10px 15px rgba(0,0,0,0.08), 0 4px 6px rgba(0,0,0,0.05)",
    level4: "0 20px 25px rgba(0,0,0,0.08), 0 8px 10px rgba(0,0,0,0.04)",
    level5: "0 25px 50px rgba(0,0,0,0.12), 0 12px 24px rgba(0,0,0,0.06)",
  },
  depth: "subtle",
  glow: {
    enabled: true,
    spread: "0 0 12px",
    strength: 0.8,
    appliesTo: {
      button: true,
      card: false,
      input: true,
      link: false,
    },
  },
  glass: {
    enabled: false,
    blur: 12,
    opacity: 0.85,
    saturation: 1,
  },
  focusRing: {
    width: 2,
    offset: 2,
    style: "solid",
  },
  motion: {
    duration: {
      fast: 100,
      medium: 200,
      slow: 350,
    },
    easing: {
      standard: "cubic-bezier(0.4, 0, 0.2, 1)",
      emphasized: "cubic-bezier(0.2, 0, 0, 1)",
      decelerate: "cubic-bezier(0, 0, 0.2, 1)",
      accelerate: "cubic-bezier(0.4, 0, 1, 1)",
    },
  },
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// SOFT - Rounded, gentle, friendly
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const softDesign: DesignPreset = {
  id: "soft",
  name: "Soft",
  description: "Rounded corners with soft, diffused shadows",
  borderRadius: {
    none: 0,
    sm: 10,
    md: 14,
    lg: 20,
    xl: 28,
    full: 9999,
  },
  elevation: {
    none: "none",
    level1: "0 2px 8px rgba(0,0,0,0.06), 0 1px 4px rgba(0,0,0,0.04)",
    level2: "0 6px 16px rgba(0,0,0,0.06), 0 3px 8px rgba(0,0,0,0.04)",
    level3: "0 12px 28px rgba(0,0,0,0.08), 0 6px 12px rgba(0,0,0,0.04)",
    level4: "0 20px 40px rgba(0,0,0,0.08), 0 10px 20px rgba(0,0,0,0.04)",
    level5: "0 32px 64px rgba(0,0,0,0.10), 0 16px 32px rgba(0,0,0,0.05)",
  },
  depth: "subtle",
  glow: {
    enabled: true,
    spread: "0 0 20px",
    strength: 0.6,
    appliesTo: {
      button: true,
      card: true,
      input: true,
      link: false,
    },
  },
  glass: {
    enabled: false,
    blur: 16,
    opacity: 0.9,
    saturation: 1.1,
  },
  focusRing: {
    width: 3,
    offset: 3,
    style: "solid",
  },
  motion: {
    duration: {
      fast: 120,
      medium: 250,
      slow: 400,
    },
    easing: {
      standard: "cubic-bezier(0.4, 0, 0.2, 1)",
      emphasized: "cubic-bezier(0.2, 0, 0, 1)",
      decelerate: "cubic-bezier(0, 0, 0.2, 1)",
      accelerate: "cubic-bezier(0.4, 0, 1, 1)",
    },
  },
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// SHARP - Crisp edges, minimal radius
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const sharpDesign: DesignPreset = {
  id: "sharp",
  name: "Sharp",
  description: "Minimal corners with crisp, defined edges",
  borderRadius: {
    none: 0,
    sm: 2,
    md: 4,
    lg: 6,
    xl: 8,
    full: 9999,
  },
  elevation: {
    none: "none",
    level1: "0 1px 2px rgba(0,0,0,0.10), 0 1px 1px rgba(0,0,0,0.08)",
    level2: "0 3px 6px rgba(0,0,0,0.10), 0 2px 4px rgba(0,0,0,0.08)",
    level3: "0 6px 12px rgba(0,0,0,0.12), 0 4px 8px rgba(0,0,0,0.08)",
    level4: "0 12px 24px rgba(0,0,0,0.12), 0 6px 12px rgba(0,0,0,0.08)",
    level5: "0 20px 40px rgba(0,0,0,0.14), 0 10px 20px rgba(0,0,0,0.10)",
  },
  depth: "normal",
  glow: {
    enabled: false,
    spread: "0 0 8px",
    strength: 0.5,
    appliesTo: {
      button: false,
      card: false,
      input: true,
      link: false,
    },
  },
  glass: {
    enabled: false,
    blur: 8,
    opacity: 0.95,
    saturation: 1,
  },
  focusRing: {
    width: 2,
    offset: 1,
    style: "solid",
  },
  motion: {
    duration: {
      fast: 80,
      medium: 150,
      slow: 250,
    },
    easing: {
      standard: "cubic-bezier(0.4, 0, 0.2, 1)",
      emphasized: "cubic-bezier(0.2, 0, 0, 1)",
      decelerate: "cubic-bezier(0, 0, 0.2, 1)",
      accelerate: "cubic-bezier(0.4, 0, 1, 1)",
    },
  },
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// GLASS - Glassmorphism, blur effects
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const glassDesign: DesignPreset = {
  id: "glass",
  name: "Glass",
  description: "Translucent surfaces with blur effects",
  borderRadius: {
    none: 0,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    full: 9999,
  },
  elevation: {
    none: "none",
    level1: "0 2px 8px rgba(0,0,0,0.04), 0 1px 3px rgba(0,0,0,0.03)",
    level2: "0 4px 12px rgba(0,0,0,0.05), 0 2px 6px rgba(0,0,0,0.04)",
    level3: "0 8px 20px rgba(0,0,0,0.06), 0 4px 10px rgba(0,0,0,0.04)",
    level4: "0 16px 32px rgba(0,0,0,0.07), 0 8px 16px rgba(0,0,0,0.04)",
    level5: "0 24px 48px rgba(0,0,0,0.08), 0 12px 24px rgba(0,0,0,0.04)",
  },
  depth: "subtle",
  glow: {
    enabled: true,
    spread: "0 0 16px",
    strength: 0.7,
    appliesTo: {
      button: true,
      card: false,
      input: true,
      link: true,
    },
  },
  glass: {
    enabled: true,
    blur: 20,
    opacity: 0.75,
    saturation: 1.2,
  },
  focusRing: {
    width: 2,
    offset: 2,
    style: "solid",
  },
  motion: {
    duration: {
      fast: 100,
      medium: 220,
      slow: 380,
    },
    easing: {
      standard: "cubic-bezier(0.4, 0, 0.2, 1)",
      emphasized: "cubic-bezier(0.2, 0, 0, 1)",
      decelerate: "cubic-bezier(0, 0, 0.2, 1)",
      accelerate: "cubic-bezier(0.4, 0, 1, 1)",
    },
  },
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// BOLD - Strong shadows, prominent effects
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const boldDesign: DesignPreset = {
  id: "bold",
  name: "Bold",
  description: "Strong shadows and prominent glow effects",
  borderRadius: {
    none: 0,
    sm: 8,
    md: 10,
    lg: 14,
    xl: 20,
    full: 9999,
  },
  elevation: {
    none: "none",
    level1: "0 2px 4px rgba(0,0,0,0.12), 0 1px 3px rgba(0,0,0,0.10)",
    level2: "0 6px 12px rgba(0,0,0,0.14), 0 3px 6px rgba(0,0,0,0.10)",
    level3: "0 14px 28px rgba(0,0,0,0.16), 0 6px 12px rgba(0,0,0,0.10)",
    level4: "0 24px 48px rgba(0,0,0,0.18), 0 10px 20px rgba(0,0,0,0.10)",
    level5: "0 36px 72px rgba(0,0,0,0.20), 0 16px 32px rgba(0,0,0,0.12)",
  },
  depth: "strong",
  glow: {
    enabled: true,
    spread: "0 0 24px",
    strength: 1.2,
    appliesTo: {
      button: true,
      card: true,
      input: true,
      link: true,
    },
  },
  glass: {
    enabled: false,
    blur: 16,
    opacity: 0.85,
    saturation: 1.1,
  },
  focusRing: {
    width: 3,
    offset: 2,
    style: "solid",
  },
  motion: {
    duration: {
      fast: 100,
      medium: 200,
      slow: 350,
    },
    easing: {
      standard: "cubic-bezier(0.4, 0, 0.2, 1)",
      emphasized: "cubic-bezier(0.2, 0, 0, 1)",
      decelerate: "cubic-bezier(0, 0, 0.2, 1)",
      accelerate: "cubic-bezier(0.4, 0, 1, 1)",
    },
  },
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// MINIMAL - Flat, clean, distraction-free
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const minimalDesign: DesignPreset = {
  id: "minimal",
  name: "Minimal",
  description: "Flat design with minimal shadows and effects",
  borderRadius: {
    none: 0,
    sm: 4,
    md: 6,
    lg: 8,
    xl: 12,
    full: 9999,
  },
  elevation: {
    none: "none",
    level1: "0 1px 2px rgba(0,0,0,0.04)",
    level2: "0 2px 4px rgba(0,0,0,0.05)",
    level3: "0 4px 8px rgba(0,0,0,0.06)",
    level4: "0 8px 16px rgba(0,0,0,0.07)",
    level5: "0 12px 24px rgba(0,0,0,0.08)",
  },
  depth: "flat",
  glow: {
    enabled: false,
    spread: "0 0 6px",
    strength: 0.4,
    appliesTo: {
      button: false,
      card: false,
      input: false,
      link: false,
    },
  },
  glass: {
    enabled: false,
    blur: 8,
    opacity: 0.95,
    saturation: 1,
  },
  focusRing: {
    width: 2,
    offset: 2,
    style: "solid",
  },
  motion: {
    duration: {
      fast: 80,
      medium: 150,
      slow: 250,
    },
    easing: {
      standard: "cubic-bezier(0.4, 0, 0.2, 1)",
      emphasized: "cubic-bezier(0.2, 0, 0, 1)",
      decelerate: "cubic-bezier(0, 0, 0.2, 1)",
      accelerate: "cubic-bezier(0.4, 0, 1, 1)",
    },
  },
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// EXPORTS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/** All design presets as an array */
export const allDesignPresets: DesignPreset[] = [
  modernDesign,
  softDesign,
  sharpDesign,
  glassDesign,
  boldDesign,
  minimalDesign,
];

/** Design presets indexed by ID */
export const designPresetsById: DesignPresetCollection = {
  modern: modernDesign,
  soft: softDesign,
  sharp: sharpDesign,
  glass: glassDesign,
  bold: boldDesign,
  minimal: minimalDesign,
};

/** Get a design preset by ID */
export function getDesignPreset(id: DesignPresetId): DesignPreset {
  return designPresetsById[id];
}

/** Check if a string is a valid design preset ID */
export function isValidDesignPreset(id: string): id is DesignPresetId {
  return id in designPresetsById;
}
