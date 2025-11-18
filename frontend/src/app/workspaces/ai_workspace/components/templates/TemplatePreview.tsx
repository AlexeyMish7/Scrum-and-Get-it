/**
 * TemplatePreview - Visual preview of template layout
 */

import { Box, Stack } from "@mui/material";
import type { Template, SectionConfig } from "../../types/template.types";

export interface TemplatePreviewProps {
  template: Template;
  compact?: boolean;
}

/**
 * Generate visual preview of template structure
 * Shows simplified representation of header, sections, and layout
 */
export function TemplatePreview({
  template,
  compact = false,
}: TemplatePreviewProps) {
  const isMultiColumn = template.layout.columns === 2;
  const scale = compact ? 0.4 : 1;

  // Get sections from layout.sectionOrder
  const sections = template.layout.sectionOrder || [];

  return (
    <Box
      sx={{
        width: "100%",
        height: "100%",
        p: compact ? 1 : 2,
        bgcolor: "background.paper",
        transform: `scale(${scale})`,
        transformOrigin: "top left",
      }}
    >
      <Stack spacing={compact ? 0.5 : 1}>
        {/* Header section */}
        <Box
          sx={{
            height: compact ? 20 : 40,
            bgcolor: "primary.main",
            opacity: 0.2,
            borderRadius: 0.5,
          }}
        />

        {/* Main content layout */}
        {isMultiColumn ? (
          <Box sx={{ display: "flex", gap: compact ? 0.5 : 1 }}>
            {/* Left column (usually sidebar) */}
            <Stack spacing={compact ? 0.5 : 1} sx={{ width: "35%" }}>
              {sections
                .slice(0, compact ? 2 : 3)
                .map((section: SectionConfig, idx: number) => (
                  <Box
                    key={section.id || idx}
                    sx={{
                      height: compact ? 12 : 24,
                      bgcolor: "grey.300",
                      borderRadius: 0.5,
                    }}
                  />
                ))}
            </Stack>

            {/* Right column (main content) */}
            <Stack spacing={compact ? 0.5 : 1} sx={{ width: "65%" }}>
              {sections
                .slice(compact ? 2 : 3, compact ? 5 : 8)
                .map((section: SectionConfig, idx: number) => (
                  <Box
                    key={section.id || idx}
                    sx={{
                      height: compact ? 15 : 30,
                      bgcolor: "grey.300",
                      borderRadius: 0.5,
                    }}
                  />
                ))}
            </Stack>
          </Box>
        ) : (
          // Single column layout
          <Stack spacing={compact ? 0.5 : 1}>
            {sections
              .slice(0, compact ? 4 : 6)
              .map((section: SectionConfig, idx: number) => (
                <Box
                  key={section.id || idx}
                  sx={{
                    height: compact ? 12 : 24,
                    bgcolor: "grey.300",
                    borderRadius: 0.5,
                    // Vary width slightly for visual interest
                    width: idx === 0 ? "100%" : `${85 + idx * 5}%`,
                  }}
                />
              ))}
          </Stack>
        )}

        {/* Footer line */}
        <Box
          sx={{
            height: compact ? 6 : 12,
            bgcolor: "grey.200",
            borderRadius: 0.5,
            width: "60%",
            mt: "auto",
          }}
        />
      </Stack>
    </Box>
  );
}
