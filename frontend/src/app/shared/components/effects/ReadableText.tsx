/**
 * ReadableText Component
 *
 * Wraps text content with a subtle backdrop to ensure readability
 * on any background (especially animated backgrounds like FlickeringGrid).
 *
 * Usage:
 *   <ReadableText variant="inline">Your text</ReadableText>
 *   <ReadableText variant="block">Longer content</ReadableText>
 */

import { Box } from "@mui/material";
import type { SxProps, Theme } from "@mui/material";
import React from "react";

interface ReadableTextProps {
  children: React.ReactNode;
  /**
   * Variant determines the backdrop style:
   * - inline: Minimal backdrop, good for short text like breadcrumbs
   * - block: Full backdrop, good for paragraphs and larger content
   * - none: No backdrop, just text shadow for subtle enhancement
   */
  variant?: "inline" | "block" | "none";
  /** Additional sx props */
  sx?: SxProps<Theme>;
}

export const ReadableText: React.FC<ReadableTextProps> = ({
  children,
  variant = "inline",
  sx = {},
}) => {
  // Variant-specific styles
  const variantStyles = {
    inline: {
      display: "inline-block",
      backgroundColor: (theme: Theme) =>
        theme.palette.mode === "dark"
          ? "rgba(18, 18, 18, 0.6)"
          : "rgba(255, 255, 255, 0.6)",
      backdropFilter: "blur(6px)",
      WebkitBackdropFilter: "blur(6px)",
      padding: "4px 8px",
      borderRadius: 1,
      border: (theme: Theme) =>
        `1px solid ${
          theme.palette.mode === "dark"
            ? "rgba(255, 255, 255, 0.05)"
            : "rgba(0, 0, 0, 0.05)"
        }`,
    },
    block: {
      display: "block",
      backgroundColor: (theme: Theme) =>
        theme.palette.mode === "dark"
          ? "rgba(18, 18, 18, 0.75)"
          : "rgba(255, 255, 255, 0.75)",
      backdropFilter: "blur(10px)",
      WebkitBackdropFilter: "blur(10px)",
      padding: "12px 16px",
      borderRadius: 2,
      border: (theme: Theme) =>
        `1px solid ${
          theme.palette.mode === "dark"
            ? "rgba(255, 255, 255, 0.08)"
            : "rgba(0, 0, 0, 0.08)"
        }`,
      boxShadow: (theme: Theme) =>
        theme.palette.mode === "dark"
          ? "0 2px 8px rgba(0, 0, 0, 0.3)"
          : "0 2px 8px rgba(0, 0, 0, 0.1)",
    },
    none: {
      textShadow: (theme: Theme) =>
        theme.palette.mode === "dark"
          ? "0 1px 3px rgba(0, 0, 0, 0.8), 0 0 8px rgba(0, 0, 0, 0.4)"
          : "0 1px 3px rgba(255, 255, 255, 0.9), 0 0 8px rgba(255, 255, 255, 0.6)",
    },
  };

  return (
    <Box
      sx={{
        ...variantStyles[variant],
        ...sx,
      }}
    >
      {children}
    </Box>
  );
};

export default ReadableText;
