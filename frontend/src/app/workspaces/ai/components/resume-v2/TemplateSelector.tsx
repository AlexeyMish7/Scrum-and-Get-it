/**
 * Template Selector Component
 *
 * Allows users to choose a resume template when creating or editing drafts.
 * Displays template cards with preview, name, description, and category badge.
 */

import React from "react";
import {
  Box,
  Card,
  CardActionArea,
  CardContent,
  Chip,
  Typography,
  Stack,
  Radio,
} from "@mui/material";
import {
  getTemplateList,
  type ResumeTemplate,
} from "../../config/resumeTemplates";

interface TemplateSelectorProps {
  selectedTemplateId?: string;
  onSelectTemplate: (templateId: string) => void;
}

export const TemplateSelector: React.FC<TemplateSelectorProps> = ({
  selectedTemplateId,
  onSelectTemplate,
}) => {
  const templates = getTemplateList();

  const getCategoryColor = (
    category: ResumeTemplate["category"]
  ): "primary" | "secondary" | "success" | "info" => {
    switch (category) {
      case "professional":
        return "primary";
      case "creative":
        return "secondary";
      case "minimal":
        return "success";
      case "academic":
        return "info";
      default:
        return "primary";
    }
  };

  return (
    <Box>
      <Typography variant="subtitle2" gutterBottom>
        Choose Template
      </Typography>
      <Typography
        variant="caption"
        color="text.secondary"
        sx={{ display: "block", mb: 1 }}
      >
        Templates control HOW the AI writes: tone, emphasis, and industry
        language.
      </Typography>
      <Typography
        variant="caption"
        color="primary.main"
        sx={{ display: "block", mb: 3, fontWeight: 500 }}
      >
        💡 Visual styling (fonts, colors, layout) is chosen later when you
        export your resume.
      </Typography>

      {/* Templates Grid - All system templates */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", md: "1fr 1fr 1fr" },
          gap: 2,
          mb: 3,
        }}
      >
        {templates.map((template) => {
          const isSelected = selectedTemplateId === template.id;

          return (
            <Box key={template.id}>
              <Card
                variant="outlined"
                sx={{
                  position: "relative",
                  borderColor: isSelected ? "primary.main" : "divider",
                  borderWidth: isSelected ? 2 : 1,
                  transition: "all 0.2s",
                  "&:hover": {
                    borderColor: "primary.main",
                    boxShadow: 1,
                  },
                }}
              >
                <CardActionArea onClick={() => onSelectTemplate(template.id)}>
                  <CardContent>
                    <Stack spacing={1.5}>
                      {/* Header with radio and badges */}
                      <Stack
                        direction="row"
                        spacing={1}
                        alignItems="center"
                        justifyContent="space-between"
                      >
                        <Radio
                          checked={isSelected}
                          size="small"
                          sx={{ p: 0 }}
                        />
                        <Stack direction="row" spacing={0.5}>
                          {/* Category badge */}
                          <Chip
                            label={template.category}
                            size="small"
                            color={getCategoryColor(template.category)}
                            sx={{
                              textTransform: "capitalize",
                              fontSize: "0.7rem",
                            }}
                          />
                        </Stack>
                      </Stack>

                      {/* Template name */}
                      <Typography variant="subtitle2" fontWeight="bold">
                        {template.name}
                      </Typography>

                      {/* Description */}
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ minHeight: 40 }}
                      >
                        {template.description}
                      </Typography>

                      {/* AI Behavior Indicator */}
                      <Box
                        sx={{
                          p: 1.5,
                          bgcolor: "primary.50",
                          borderRadius: 1,
                          borderLeft: 3,
                          borderColor: "primary.main",
                        }}
                      >
                        <Typography
                          variant="caption"
                          sx={{
                            color: "primary.dark",
                            fontWeight: 600,
                            display: "block",
                          }}
                        >
                          🤖 AI Behavior: {template.category}
                        </Typography>
                        <Typography
                          variant="caption"
                          sx={{
                            color: "text.secondary",
                            fontSize: "0.7rem",
                          }}
                        >
                          Guides content tone and emphasis
                        </Typography>
                      </Box>
                    </Stack>
                  </CardContent>
                </CardActionArea>
              </Card>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
};
