/**
 * TemplateShowcaseDialog - Template Browser with Preview
 *
 * PURPOSE: Browse and preview resume templates before selection (Act 2.1)
 * FEATURES:
 * - Visual carousel of all available templates
 * - Live preview of template styling
 * - Category filtering (professional, creative, minimal, academic)
 * - Template customization preview (colors, fonts)
 * - Select and apply to current draft
 *
 * DEMO FLOW:
 * 1. User clicks "Browse Templates" → Dialog opens
 * 2. Carousel shows template cards with previews
 * 3. Click template → Show full preview with sample content
 * 4. Adjust customization → Preview updates in real-time
 * 5. Click "Use This Template" → Apply to draft
 */

import { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Stack,
  Chip,
  Card,
  CardContent,
  CardActionArea,
  IconButton,
  Tabs,
  Tab,
  Divider,
  Paper,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import {
  getTemplateList,
  type ResumeTemplate,
} from "../../config/resumeTemplates";

interface TemplateShowcaseDialogProps {
  open: boolean;
  onClose: () => void;
  currentTemplateId?: string;
  onSelectTemplate: (templateId: string) => void;
}

// Sample resume content for preview
const SAMPLE_CONTENT = {
  name: "Alex Johnson",
  title: "Senior Software Engineer",
  summary:
    "Passionate software engineer with 5+ years of experience building scalable web applications. Expert in React, TypeScript, and cloud architecture.",
  experience: [
    {
      role: "Senior Software Engineer",
      company: "TechCorp Inc.",
      dates: "2021 - Present",
      bullets: [
        "Led development of microservices architecture serving 2M+ users",
        "Reduced API response time by 40% through optimization",
        "Mentored team of 5 junior developers",
      ],
    },
  ],
  education: [
    {
      degree: "B.S. Computer Science",
      institution: "State University",
      graduation_date: "2019",
    },
  ],
  skills: [
    "React",
    "TypeScript",
    "Node.js",
    "AWS",
    "PostgreSQL",
    "Docker",
  ],
};

export default function TemplateShowcaseDialog({
  open,
  onClose,
  currentTemplateId,
  onSelectTemplate,
}: TemplateShowcaseDialogProps) {
  const templates = getTemplateList();
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(
    currentTemplateId || templates[0]?.id || "modern"
  );
  const [previewIndex, setPreviewIndex] = useState(0);

  // Filter templates by category
  const filteredTemplates =
    selectedCategory === "all"
      ? templates
      : templates.filter((t) => t.category === selectedCategory);

  const selectedTemplate = templates.find((t) => t.id === selectedTemplateId);

  const handlePrevious = () => {
    setPreviewIndex((prev) =>
      prev === 0 ? filteredTemplates.length - 1 : prev - 1
    );
    setSelectedTemplateId(filteredTemplates[previewIndex]?.id || "modern");
  };

  const handleNext = () => {
    setPreviewIndex((prev) =>
      prev === filteredTemplates.length - 1 ? 0 : prev + 1
    );
    setSelectedTemplateId(filteredTemplates[previewIndex]?.id || "modern");
  };

  const handleApply = () => {
    onSelectTemplate(selectedTemplateId);
    onClose();
  };

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
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: { height: "90vh" },
      }}
    >
      {/* Header */}
      <DialogTitle>
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
        >
          <Box>
            <Typography variant="h6">Resume Template Gallery</Typography>
            <Typography variant="caption" color="text.secondary">
              Browse professional resume templates and apply to your draft
            </Typography>
          </Box>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Stack>
      </DialogTitle>

      <Divider />

      {/* Content */}
      <DialogContent sx={{ p: 3 }}>
        <Stack spacing={3}>
          {/* Category Filter */}
          <Box>
            <Tabs
              value={selectedCategory}
              onChange={(_, v) => {
                setSelectedCategory(v);
                setPreviewIndex(0);
              }}
              variant="scrollable"
              scrollButtons="auto"
            >
              <Tab label="All Templates" value="all" />
              <Tab label="Professional" value="professional" />
              <Tab label="Creative" value="creative" />
              <Tab label="Minimal" value="minimal" />
              <Tab label="Academic" value="academic" />
            </Tabs>
          </Box>

          {/* Template Grid */}
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                sm: "repeat(2, 1fr)",
                md: "repeat(3, 1fr)",
              },
              gap: 2,
            }}
          >
            {filteredTemplates.map((template) => {
              const isSelected = selectedTemplateId === template.id;
              const isCurrent = currentTemplateId === template.id;

              return (
                <Card
                  key={template.id}
                  variant="outlined"
                  sx={{
                    position: "relative",
                    borderColor: isSelected ? "primary.main" : "divider",
                    borderWidth: isSelected ? 2 : 1,
                    transition: "all 0.2s",
                    "&:hover": {
                      borderColor: "primary.main",
                      boxShadow: 2,
                      transform: "translateY(-2px)",
                    },
                  }}
                >
                  <CardActionArea
                    onClick={() => {
                      setSelectedTemplateId(template.id);
                      setPreviewIndex(
                        filteredTemplates.findIndex((t) => t.id === template.id)
                      );
                    }}
                  >
                    <CardContent>
                      <Stack spacing={1.5}>
                        {/* Header */}
                        <Stack
                          direction="row"
                          alignItems="center"
                          justifyContent="space-between"
                        >
                          <Stack direction="row" spacing={0.5} flexWrap="wrap">
                            <Chip
                              label={template.category}
                              size="small"
                              color={getCategoryColor(template.category)}
                              sx={{
                                textTransform: "capitalize",
                                fontSize: "0.7rem",
                              }}
                            />
                            {template.isSystem && (
                              <Chip
                                label="System"
                                size="small"
                                variant="outlined"
                                sx={{ fontSize: "0.7rem" }}
                              />
                            )}
                          </Stack>
                          {isCurrent && (
                            <Chip
                              label="Current"
                              size="small"
                              color="success"
                              icon={<CheckCircleIcon />}
                              sx={{ fontSize: "0.7rem" }}
                            />
                          )}
                        </Stack>

                        {/* Template Name */}
                        <Typography variant="subtitle2" fontWeight="bold">
                          {template.name}
                        </Typography>

                        {/* Description */}
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{
                            minHeight: 36,
                            display: "-webkit-box",
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: "vertical",
                            overflow: "hidden",
                          }}
                        >
                          {template.description}
                        </Typography>

                        {/* Style Preview */}
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
                              display: "block",
                            }}
                          >
                            {template.style.fontFamily}
                          </Typography>
                          <Typography
                            variant="caption"
                            sx={{
                              fontFamily: template.style.fontFamily,
                              color: template.style.colors.text,
                              display: "block",
                              mt: 0.5,
                            }}
                          >
                            {template.formatting.bulletStyle} Sample text
                          </Typography>
                        </Box>

                        {/* Selection Indicator */}
                        {isSelected && (
                          <Box
                            sx={{
                              position: "absolute",
                              top: 8,
                              right: 8,
                              bgcolor: "primary.main",
                              color: "white",
                              borderRadius: "50%",
                              p: 0.5,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            <CheckCircleIcon sx={{ fontSize: 20 }} />
                          </Box>
                        )}
                      </Stack>
                    </CardContent>
                  </CardActionArea>
                </Card>
              );
            })}
          </Box>

          {/* Full Preview Section */}
          {selectedTemplate && (
            <Paper
              variant="outlined"
              sx={{ p: 3, mt: 3, bgcolor: "grey.50" }}
            >
              <Stack spacing={2}>
                <Stack
                  direction="row"
                  alignItems="center"
                  justifyContent="space-between"
                >
                  <Typography variant="subtitle1" fontWeight="bold">
                    Preview: {selectedTemplate.name}
                  </Typography>
                  <Stack direction="row" spacing={1}>
                    <IconButton size="small" onClick={handlePrevious}>
                      <ChevronLeftIcon />
                    </IconButton>
                    <IconButton size="small" onClick={handleNext}>
                      <ChevronRightIcon />
                    </IconButton>
                  </Stack>
                </Stack>

                {/* Sample Resume Preview */}
                <Box
                  sx={{
                    p: 3,
                    bgcolor: "white",
                    borderRadius: 1,
                    border: "1px solid",
                    borderColor: "divider",
                    fontFamily: selectedTemplate.style.fontFamily,
                  }}
                >
                  {/* Header */}
                  <Box sx={{ mb: 2, textAlign: "center" }}>
                    <Typography
                      variant="h5"
                      sx={{
                        fontFamily: selectedTemplate.style.fontFamily,
                        color: selectedTemplate.style.colors.primary,
                        fontWeight: 700,
                      }}
                    >
                      {SAMPLE_CONTENT.name}
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        fontFamily: selectedTemplate.style.fontFamily,
                        color: selectedTemplate.style.colors.secondary,
                        mt: 0.5,
                      }}
                    >
                      {SAMPLE_CONTENT.title}
                    </Typography>
                  </Box>

                  {/* Summary */}
                  <Box sx={{ mb: 2 }}>
                    <Typography
                      variant="subtitle2"
                      sx={{
                        fontFamily: selectedTemplate.style.fontFamily,
                        color: selectedTemplate.style.colors.primary,
                        fontWeight: 600,
                        mb: 0.5,
                      }}
                    >
                      PROFESSIONAL SUMMARY
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        fontFamily: selectedTemplate.style.fontFamily,
                        color: selectedTemplate.style.colors.text,
                        fontSize: selectedTemplate.style.fontSize,
                      }}
                    >
                      {SAMPLE_CONTENT.summary}
                    </Typography>
                  </Box>

                  {/* Experience */}
                  <Box sx={{ mb: 2 }}>
                    <Typography
                      variant="subtitle2"
                      sx={{
                        fontFamily: selectedTemplate.style.fontFamily,
                        color: selectedTemplate.style.colors.primary,
                        fontWeight: 600,
                        mb: 0.5,
                      }}
                    >
                      EXPERIENCE
                    </Typography>
                    {SAMPLE_CONTENT.experience.map((exp, i) => (
                      <Box key={i} sx={{ mb: 1.5 }}>
                        <Typography
                          variant="body2"
                          sx={{
                            fontFamily: selectedTemplate.style.fontFamily,
                            fontWeight: 600,
                          }}
                        >
                          {exp.role}
                        </Typography>
                        <Typography
                          variant="caption"
                          sx={{
                            fontFamily: selectedTemplate.style.fontFamily,
                            color: selectedTemplate.style.colors.secondary,
                          }}
                        >
                          {exp.company} | {exp.dates}
                        </Typography>
                        <Box component="ul" sx={{ mt: 0.5, pl: 2 }}>
                          {exp.bullets.map((bullet, j) => (
                            <Typography
                              key={j}
                              component="li"
                              variant="body2"
                              sx={{
                                fontFamily: selectedTemplate.style.fontFamily,
                                fontSize: selectedTemplate.style.fontSize,
                              }}
                            >
                              {bullet}
                            </Typography>
                          ))}
                        </Box>
                      </Box>
                    ))}
                  </Box>

                  {/* Skills */}
                  <Box>
                    <Typography
                      variant="subtitle2"
                      sx={{
                        fontFamily: selectedTemplate.style.fontFamily,
                        color: selectedTemplate.style.colors.primary,
                        fontWeight: 600,
                        mb: 0.5,
                      }}
                    >
                      SKILLS
                    </Typography>
                    <Stack direction="row" spacing={0.5} flexWrap="wrap">
                      {SAMPLE_CONTENT.skills.map((skill, i) => (
                        <Chip
                          key={i}
                          label={skill}
                          size="small"
                          sx={{
                            fontFamily: selectedTemplate.style.fontFamily,
                            bgcolor: selectedTemplate.style.colors.accent,
                            color: selectedTemplate.style.colors.primary,
                            mb: 0.5,
                          }}
                        />
                      ))}
                    </Stack>
                  </Box>
                </Box>
              </Stack>
            </Paper>
          )}
        </Stack>
      </DialogContent>

      <Divider />

      {/* Actions */}
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} variant="outlined">
          Cancel
        </Button>
        <Button
          onClick={handleApply}
          variant="contained"
          disabled={!selectedTemplateId}
        >
          Use This Template
        </Button>
      </DialogActions>
    </Dialog>
  );
}
