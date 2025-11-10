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

  // Separate system and custom templates
  const systemTemplates = templates.filter((t) => t.isSystem);
  const customTemplates = templates.filter((t) => !t.isSystem);

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
        sx={{ display: "block", mb: 3 }}
      >
        Select a resume template to apply formatting and styling
      </Typography>

      {/* System Templates Section */}
      <Typography
        variant="caption"
        fontWeight="bold"
        color="text.secondary"
        sx={{ mb: 1, display: "block" }}
      >
        SYSTEM TEMPLATES
      </Typography>
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", md: "1fr 1fr 1fr" },
          gap: 2,
          mb: 3,
        }}
      >
        {systemTemplates.map((template) => {
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

                      {/* Font and style preview */}
                      <Box
                        sx={{
                          p: 1.5,
                          bgcolor: "grey.50",
                          borderRadius: 1,
                          borderLeft: 3,
                          borderColor: template.style.colors.primary,
                        }}
                      >
                        <Typography
                          variant="caption"
                          sx={{
                            fontFamily: template.style.fontFamily,
                            color: template.style.colors.primary,
                            fontWeight: 600,
                          }}
                        >
                          {template.style.fontFamily}
                        </Typography>
                        <Typography
                          variant="caption"
                          display="block"
                          sx={{
                            fontFamily: template.style.fontFamily,
                            color: template.style.colors.text,
                            mt: 0.5,
                          }}
                        >
                          {template.formatting.bulletStyle} Sample bullet point
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

      {/* Custom Templates Section */}
      {customTemplates.length > 0 && (
        <>
          <Typography
            variant="caption"
            fontWeight="bold"
            color="text.secondary"
            sx={{ mb: 1, display: "block" }}
          >
            CUSTOM TEMPLATES
          </Typography>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                sm: "1fr 1fr",
                md: "1fr 1fr 1fr",
              },
              gap: 2,
            }}
          >
            {customTemplates.map((template) => {
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
                    <CardActionArea
                      onClick={() => onSelectTemplate(template.id)}
                    >
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
                              {/* System or Custom badge */}
                              <Chip
                                label={template.isSystem ? "System" : "Custom"}
                                size="small"
                                variant={
                                  template.isSystem ? "filled" : "outlined"
                                }
                                color={
                                  template.isSystem ? "default" : "secondary"
                                }
                                sx={{ fontSize: "0.7rem" }}
                              />
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

                          {/* Font and style preview */}
                          <Box
                            sx={{
                              p: 1.5,
                              bgcolor: "grey.50",
                              borderRadius: 1,
                              borderLeft: 3,
                              borderColor: template.style.colors.primary,
                            }}
                          >
                            <Typography
                              variant="caption"
                              sx={{
                                fontFamily: template.style.fontFamily,
                                color: template.style.colors.primary,
                                fontWeight: 600,
                              }}
                            >
                              {template.style.fontFamily}
                            </Typography>
                            <Typography
                              variant="caption"
                              display="block"
                              sx={{
                                fontFamily: template.style.fontFamily,
                                color: template.style.colors.text,
                                mt: 0.5,
                              }}
                            >
                              {template.formatting.bulletStyle} Sample bullet
                              point
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
        </>
      )}
    </Box>
  );
};
