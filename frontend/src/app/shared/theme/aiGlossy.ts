/**
 * AI Glossy Styles
 *
 * Glossy, metallic gradient styles for AI-generated content.
 * Each color preset has its own unique AI aesthetic to make
 * AI-powered features easily distinguishable.
 *
 * Usage:
 *   const aiStyles = useAIGlossyStyles();
 *   <Typography sx={aiStyles.text}>AI Generated</Typography>
 */

import type { ColorPresetId } from "./colorPresets/types";

/**
 * AI glossy gradient configuration for a single preset
 */
export interface AIGlossyConfig {
  /** Gradient for text (use with WebkitBackgroundClip) */
  textGradient: {
    light: string;
    dark: string;
  };
  /** Gradient for backgrounds */
  backgroundGradient: {
    light: string;
    dark: string;
  };
  /** Border/accent colors */
  accentColor: {
    light: string;
    dark: string;
  };
  /** Shimmer/shine overlay gradient (subtle animation) */
  shimmer: {
    light: string;
    dark: string;
  };
}

/**
 * AI Glossy Styles for all color presets
 */
export const aiGlossyStyles: Record<ColorPresetId, AIGlossyConfig> = {
  // DEFAULT - Electric Blue & Neon
  default: {
    textGradient: {
      light: "linear-gradient(135deg, #1e40af 0%, #2563eb 50%, #3b82f6 100%)",
      dark: "linear-gradient(135deg, #3b82f6 0%, #60a5fa 50%, #93c5fd 100%)",
    },
    backgroundGradient: {
      light:
        "linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(147, 197, 253, 0.2) 100%)",
      dark: "linear-gradient(135deg, rgba(59, 130, 246, 0.25) 0%, rgba(147, 197, 253, 0.15) 100%)",
    },
    accentColor: {
      light: "rgba(59, 130, 246, 0.5)",
      dark: "rgba(96, 165, 250, 0.6)",
    },
    shimmer: {
      light:
        "linear-gradient(110deg, transparent 0%, rgba(255, 255, 255, 0.6) 50%, transparent 100%)",
      dark: "linear-gradient(110deg, transparent 0%, rgba(255, 255, 255, 0.15) 50%, transparent 100%)",
    },
  },

  // OCEAN - Aqua & Turquoise Shimmer
  ocean: {
    textGradient: {
      light: "linear-gradient(135deg, #164e63 0%, #0e7490 50%, #0891b2 100%)",
      dark: "linear-gradient(135deg, #06b6d4 0%, #22d3ee 50%, #67e8f9 100%)",
    },
    backgroundGradient: {
      light: "linear-gradient(135deg, #0e7490 0%, #0891b2 100%)",
      dark: "linear-gradient(135deg, #164e63 0%, #0e7490 100%)",
    },
    accentColor: {
      light: "#0891b2",
      dark: "#06b6d4",
    },
    shimmer: {
      light:
        "linear-gradient(110deg, transparent 0%, rgba(103, 232, 249, 0.5) 50%, transparent 100%)",
      dark: "linear-gradient(110deg, transparent 0%, rgba(207, 250, 254, 0.2) 50%, transparent 100%)",
    },
  },

  // FOREST - Emerald & Lime Glow
  forest: {
    textGradient: {
      light: "linear-gradient(135deg, #14532d 0%, #166534 50%, #15803d 100%)",
      dark: "linear-gradient(135deg, #22c55e 0%, #4ade80 50%, #86efac 100%)",
    },
    backgroundGradient: {
      light: "linear-gradient(135deg, #15803d 0%, #16a34a 100%)",
      dark: "linear-gradient(135deg, #14532d 0%, #15803d 100%)",
    },
    accentColor: {
      light: "#16a34a",
      dark: "#22c55e",
    },
    shimmer: {
      light:
        "linear-gradient(110deg, transparent 0%, rgba(134, 239, 172, 0.5) 50%, transparent 100%)",
      dark: "linear-gradient(110deg, transparent 0%, rgba(187, 247, 208, 0.2) 50%, transparent 100%)",
    },
  },

  // SUNSET - Coral & Amber Fire
  sunset: {
    textGradient: {
      light: "linear-gradient(135deg, #9a3412 0%, #c2410c 50%, #ea580c 100%)",
      dark: "linear-gradient(135deg, #f97316 0%, #fb923c 50%, #fdba74 100%)",
    },
    backgroundGradient: {
      light: "linear-gradient(135deg, #c2410c 0%, #ea580c 100%)",
      dark: "linear-gradient(135deg, #9a3412 0%, #c2410c 100%)",
    },
    accentColor: {
      light: "#ea580c",
      dark: "#f97316",
    },
    shimmer: {
      light:
        "linear-gradient(110deg, transparent 0%, rgba(254, 215, 170, 0.6) 50%, transparent 100%)",
      dark: "linear-gradient(110deg, transparent 0%, rgba(255, 237, 213, 0.25) 50%, transparent 100%)",
    },
  },

  // ROSE - Pink & Magenta Shine
  rose: {
    textGradient: {
      light: "linear-gradient(135deg, #881337 0%, #9f1239 50%, #be185d 100%)",
      dark: "linear-gradient(135deg, #ec4899 0%, #f472b6 50%, #f9a8d4 100%)",
    },
    backgroundGradient: {
      light: "linear-gradient(135deg, #9f1239 0%, #be185d 100%)",
      dark: "linear-gradient(135deg, #881337 0%, #9f1239 100%)",
    },
    accentColor: {
      light: "#be185d",
      dark: "#ec4899",
    },
    shimmer: {
      light:
        "linear-gradient(110deg, transparent 0%, rgba(249, 168, 212, 0.5) 50%, transparent 100%)",
      dark: "linear-gradient(110deg, transparent 0%, rgba(252, 231, 243, 0.2) 50%, transparent 100%)",
    },
  },

  // LAVENDER - Purple & Violet Iridescent
  lavender: {
    textGradient: {
      light: "linear-gradient(135deg, #5b21b6 0%, #6d28d9 50%, #7c3aed 100%)",
      dark: "linear-gradient(135deg, #a855f7 0%, #c084fc 50%, #e9d5ff 100%)",
    },
    backgroundGradient: {
      light: "linear-gradient(135deg, #6d28d9 0%, #7c3aed 100%)",
      dark: "linear-gradient(135deg, #5b21b6 0%, #6d28d9 100%)",
    },
    accentColor: {
      light: "#7c3aed",
      dark: "#a855f7",
    },
    shimmer: {
      light:
        "linear-gradient(110deg, transparent 0%, rgba(233, 213, 255, 0.5) 50%, transparent 100%)",
      dark: "linear-gradient(110deg, transparent 0%, rgba(243, 232, 255, 0.2) 50%, transparent 100%)",
    },
  },

  // SLATE - Chrome & Steel Metallic
  slate: {
    textGradient: {
      light: "linear-gradient(135deg, #1e293b 0%, #334155 50%, #475569 100%)",
      dark: "linear-gradient(135deg, #94a3b8 0%, #cbd5e1 50%, #e2e8f0 100%)",
    },
    backgroundGradient: {
      light: "linear-gradient(135deg, #334155 0%, #475569 100%)",
      dark: "linear-gradient(135deg, #1e293b 0%, #334155 100%)",
    },
    accentColor: {
      light: "#475569",
      dark: "#94a3b8",
    },
    shimmer: {
      light:
        "linear-gradient(110deg, transparent 0%, rgba(203, 213, 225, 0.6) 50%, transparent 100%)",
      dark: "linear-gradient(110deg, transparent 0%, rgba(241, 245, 249, 0.25) 50%, transparent 100%)",
    },
  },

  // MINT - Mint & Seafoam Fresh
  mint: {
    textGradient: {
      light: "linear-gradient(135deg, #115e59 0%, #0f766e 50%, #14b8a6 100%)",
      dark: "linear-gradient(135deg, #14b8a6 0%, #2dd4bf 50%, #5eead4 100%)",
    },
    backgroundGradient: {
      light: "linear-gradient(135deg, #0f766e 0%, #14b8a6 100%)",
      dark: "linear-gradient(135deg, #115e59 0%, #0f766e 100%)",
    },
    accentColor: {
      light: "#14b8a6",
      dark: "#14b8a6",
    },
    shimmer: {
      light:
        "linear-gradient(110deg, transparent 0%, rgba(167, 243, 208, 0.5) 50%, transparent 100%)",
      dark: "linear-gradient(110deg, transparent 0%, rgba(209, 250, 229, 0.2) 50%, transparent 100%)",
    },
  },
};

/**
 * Get AI glossy config for a specific preset
 */
export function getAIGlossyConfig(presetId: ColorPresetId): AIGlossyConfig {
  return aiGlossyStyles[presetId] ?? aiGlossyStyles.default;
}
