/**
 * GlowBorder Component
 *
 * Wraps any content with a subtle glowing border effect.
 * The glow fades in opacity from the edges outward, creating a radiating effect.
 * Works with theme colors automatically.
 */

import { Box } from "@mui/material";
import type { SxProps, Theme } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import React from "react";

interface GlowBorderProps {
  children: React.ReactNode;
  /** Intensity of the glow (0-1, default: 0.3) */
  intensity?: number;
  /** Size of the glow spread in pixels (default: 20) */
  spread?: number;
  /** Override glow color (defaults to primary theme color) */
  glowColor?: string;
  /** Border radius (default: 1 for MUI default) */
  borderRadius?: number;
  /** Additional sx props */
  sx?: SxProps<Theme>;
}

export const GlowBorder: React.FC<GlowBorderProps> = ({
  children,
  intensity = 0.3,
  spread = 20,
  glowColor,
  borderRadius = 1,
  sx = {},
}) => {
  const theme = useTheme();

  // Use theme primary color if not specified
  const effectiveColor = glowColor || theme.palette.primary.main;

  // Convert hex to rgba for opacity support
  const hexToRgba = (hex: string, alpha: number) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (result) {
      return `rgba(${parseInt(result[1], 16)}, ${parseInt(
        result[2],
        16
      )}, ${parseInt(result[3], 16)}, ${alpha})`;
    }
    return `rgba(0, 0, 0, ${alpha})`;
  };

  return (
    <Box
      sx={{
        position: "relative",
        borderRadius,
        ...sx,
        // Multiple box shadows create the radiating fade effect
        // Each layer gets progressively more transparent and spread out
        boxShadow: `
          0 0 ${spread * 0.3}px ${spread * 0.1}px ${hexToRgba(
          effectiveColor,
          intensity
        )},
          0 0 ${spread * 0.6}px ${spread * 0.2}px ${hexToRgba(
          effectiveColor,
          intensity * 0.6
        )},
          0 0 ${spread}px ${spread * 0.3}px ${hexToRgba(
          effectiveColor,
          intensity * 0.3
        )},
          0 0 ${spread * 1.5}px ${spread * 0.4}px ${hexToRgba(
          effectiveColor,
          intensity * 0.15
        )}
        `,
      }}
    >
      {children}
    </Box>
  );
};

export default GlowBorder;
