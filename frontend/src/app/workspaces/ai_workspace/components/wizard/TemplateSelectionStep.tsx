/**
 * TEMPLATE SELECTION STEP
 * Step 1 of the generation wizard - allows users to select a resume/cover letter template.
 */

import React from "react";
import { Box, Typography } from "@mui/material";
import { TemplateGallery } from "../templates/TemplateGallery";
import type { Template, TemplateCategory } from "../../types/template.types";

/**
 * TemplateSelectionStep Props
 */
interface TemplateSelectionStepProps {
  /** Type of template to show (resume or cover-letter) */
  category: TemplateCategory;

  /** Currently selected template */
  selectedTemplate: Template | null;

  /** Template selection handler */
  onSelectTemplate: (template: Template) => void;
}

/**
 * TemplateSelectionStep Component
 *
 * Inputs:
 * - category: Filter templates by category (resume | cover-letter)
 * - selectedTemplate: Currently selected template (if any)
 * - onSelectTemplate: Callback when user selects a template
 *
 * Outputs:
 * - TemplateGallery filtered by category
 * - Calls onSelectTemplate when user clicks a template card
 */
export const TemplateSelectionStep: React.FC<TemplateSelectionStepProps> = ({
  category,
  selectedTemplate,
  onSelectTemplate,
}) => {
  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Choose a Template
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Select a template that best fits your needs. You can customize it later.
      </Typography>

      <TemplateGallery
        category={category}
        selectedTemplateId={selectedTemplate?.id}
        onSelectTemplate={onSelectTemplate}
      />
    </Box>
  );
};
