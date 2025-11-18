/**
 * THEME SELECTION STEP
 * Step 2 of the generation wizard - allows users to select a visual theme.
 */

import React from "react";
import { Box, Typography } from "@mui/material";
import { ThemeGallery } from "../themes/ThemeGallery";
import type { Theme } from "../../types/template.types";

/**
 * ThemeSelectionStep Props
 */
interface ThemeSelectionStepProps {
  /** Currently selected theme */
  selectedTheme: Theme | null;

  /** Theme selection handler */
  onSelectTheme: (theme: Theme) => void;
}

/**
 * ThemeSelectionStep Component
 *
 * Inputs:
 * - selectedTheme: Currently selected theme (if any)
 * - onSelectTheme: Callback when user selects a theme
 *
 * Outputs:
 * - ThemeGallery with all available themes
 * - Calls onSelectTheme when user clicks a theme card
 */
export const ThemeSelectionStep: React.FC<ThemeSelectionStepProps> = ({
  selectedTheme,
  onSelectTheme,
}) => {
  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Choose a Theme
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Select a visual theme for your document. This controls colors, fonts,
        and styling.
      </Typography>

      <ThemeGallery
        selectedThemeId={selectedTheme?.id}
        onSelectTheme={onSelectTheme}
      />
    </Box>
  );
};
