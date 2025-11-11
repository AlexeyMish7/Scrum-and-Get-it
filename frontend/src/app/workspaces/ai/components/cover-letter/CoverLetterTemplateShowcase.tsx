/**
 * CoverLetterTemplateShowcase - Template Browser with Preview
 *
 * PURPOSE: Browse and preview cover letter templates before selection
 * FEATURES:
 * - Visual carousel of all available templates
 * - Live preview of template styling
 * - Category filtering (professional, creative, technical, modern)
 * - Tone and style preview
 * - Select and apply to current draft
 *
 * FLOW:
 * 1. User clicks "Browse Templates" → Dialog opens
 * 2. Carousel shows template cards with previews
 * 3. Click template → Show full preview with sample content
 * 4. Click "Use This Template" → Apply to draft and close
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
  Radio,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import { getCoverLetterTemplateList } from "../../config/coverLetterTemplates";

interface CoverLetterTemplateShowcaseProps {
  open: boolean;
  onClose: () => void;
  currentTemplateId?: string;
  onSelectTemplate: (templateId: string) => void;
}

// Sample cover letter content for preview
const SAMPLE_CONTENT = {
  companyName: "TechCorp Inc.",
  position: "Senior Software Engineer",
  opening:
    "I am writing to express my strong interest in the Senior Software Engineer position at TechCorp Inc. With over 5 years of experience building scalable web applications, I am excited about the opportunity to contribute to your innovative team.",
  body: [
    "Throughout my career, I have developed expertise in React, TypeScript, and cloud-native architectures. My recent work at Digital Solutions involved leading the development of a microservices platform that serves over 2 million users daily.",
    "I am particularly drawn to TechCorp Inc. because of your commitment to cutting-edge technology and your collaborative engineering culture. I believe my skills in full-stack development and team leadership would make me a valuable addition to your organization.",
  ],
  closing:
    "Thank you for considering my application. I look forward to the opportunity to discuss how my experience and passion for technology can contribute to TechCorp Inc.'s continued success.",
};

export default function CoverLetterTemplateShowcase({
  open,
  onClose,
  currentTemplateId,
  onSelectTemplate,
}: CoverLetterTemplateShowcaseProps) {
  const templates = getCoverLetterTemplateList();
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(
    currentTemplateId || templates[0]?.id || "formal"
  );
  const [previewIndex, setPreviewIndex] = useState(0);

  // Filter templates by category
  const filteredTemplates =
    selectedCategory === "all"
      ? templates
      : templates.filter((t) => t.category === selectedCategory);

  const selectedTemplate = templates.find((t) => t.id === selectedTemplateId);

  const handleCategoryChange = (
    _event: React.SyntheticEvent,
    newValue: string
  ) => {
    setSelectedCategory(newValue);
    // Reset to first template in new category
    const firstInCategory =
      newValue === "all"
        ? templates[0]
        : templates.find((t) => t.category === newValue);
    if (firstInCategory) {
      setSelectedTemplateId(firstInCategory.id);
      setPreviewIndex(0);
    }
  };

  const handlePrevious = () => {
    const currentIndex = filteredTemplates.findIndex(
      (t) => t.id === selectedTemplateId
    );
    const prevIndex =
      currentIndex > 0 ? currentIndex - 1 : filteredTemplates.length - 1;
    setSelectedTemplateId(filteredTemplates[prevIndex].id);
    setPreviewIndex(prevIndex);
  };

  const handleNext = () => {
    const currentIndex = filteredTemplates.findIndex(
      (t) => t.id === selectedTemplateId
    );
    const nextIndex =
      currentIndex < filteredTemplates.length - 1 ? currentIndex + 1 : 0;
    setSelectedTemplateId(filteredTemplates[nextIndex].id);
    setPreviewIndex(nextIndex);
  };

  const handleUseTemplate = () => {
    onSelectTemplate(selectedTemplateId);
    onClose();
  };

  // Render template preview with sample content
  const renderPreview = () => {
    if (!selectedTemplate) return null;

    const style = selectedTemplate.style;

    return (
      <Paper
        elevation={0}
        sx={{
          p: 4,
          backgroundColor: "background.paper",
          border: "1px solid",
          borderColor: "divider",
          fontFamily: style.fontFamily,
          fontSize: style.fontSize,
          lineHeight: style.lineHeight,
          minHeight: 500,
        }}
      >
        {/* Header */}
        <Box sx={{ mb: 3, textAlign: "left" }}>
          <Typography
            sx={{
              fontWeight: 600,
              fontSize: "1.1rem",
              color: style.colors.primary,
            }}
          >
            Your Name
          </Typography>
          <Typography sx={{ fontSize: "0.9rem", color: style.colors.text }}>
            your.email@example.com • (555) 123-4567 • City, State
          </Typography>
        </Box>

        <Divider sx={{ mb: 3 }} />

        {/* Date and Company Address */}
        <Box sx={{ mb: 3 }}>
          <Typography sx={{ fontSize: "0.9rem", color: style.colors.text }}>
            {new Date().toLocaleDateString()}
          </Typography>
          <Typography
            sx={{ fontSize: "0.9rem", color: style.colors.text, mt: 1 }}
          >
            Hiring Manager
            <br />
            {SAMPLE_CONTENT.companyName}
            <br />
            123 Business St.
            <br />
            City, State 12345
          </Typography>
        </Box>

        {/* Salutation */}
        <Typography sx={{ mb: 2, color: style.colors.text }}>
          Dear Hiring Manager,
        </Typography>

        {/* Opening Paragraph */}
        <Typography
          sx={{
            mb: 2,
            color: style.colors.text,
            textAlign: "justify",
          }}
        >
          {SAMPLE_CONTENT.opening}
        </Typography>

        {/* Body Paragraphs */}
        {SAMPLE_CONTENT.body.map((paragraph, idx) => (
          <Typography
            key={idx}
            sx={{
              mb: 2,
              color: style.colors.text,
              textAlign: "justify",
            }}
          >
            {paragraph}
          </Typography>
        ))}

        {/* Closing Paragraph */}
        <Typography
          sx={{
            mb: 2,
            color: style.colors.text,
            textAlign: "justify",
          }}
        >
          {SAMPLE_CONTENT.closing}
        </Typography>

        {/* Signature */}
        <Box sx={{ mt: 3 }}>
          <Typography sx={{ color: style.colors.text }}>Sincerely,</Typography>
          <Typography sx={{ color: style.colors.text, mt: 1 }}>
            Your Name
          </Typography>
        </Box>
      </Paper>
    );
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: {
          height: "90vh",
          maxHeight: 900,
        },
      }}
    >
      <DialogTitle>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Typography variant="h5" fontWeight={600}>
            Browse Cover Letter Templates
          </Typography>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          Choose a template that matches your style and industry
        </Typography>
      </DialogTitle>

      <Divider />

      <DialogContent sx={{ p: 3 }}>
        {/* Category Tabs */}
        <Box sx={{ mb: 3 }}>
          <Tabs
            value={selectedCategory}
            onChange={handleCategoryChange}
            variant="scrollable"
            scrollButtons="auto"
          >
            <Tab label="All Templates" value="all" />
            <Tab label="Professional" value="professional" />
            <Tab label="Creative" value="creative" />
            <Tab label="Technical" value="technical" />
            <Tab label="Modern" value="modern" />
          </Tabs>
        </Box>

        <Box display="flex" gap={3}>
          {/* Left: Template Cards */}
          <Box sx={{ width: "40%", maxHeight: 550, overflowY: "auto", pr: 1 }}>
            <Stack spacing={2}>
              {filteredTemplates.map((template) => (
                <Card
                  key={template.id}
                  variant={
                    selectedTemplateId === template.id
                      ? "outlined"
                      : "elevation"
                  }
                  sx={{
                    border:
                      selectedTemplateId === template.id
                        ? "2px solid"
                        : "1px solid",
                    borderColor:
                      selectedTemplateId === template.id
                        ? "primary.main"
                        : "divider",
                    transition: "all 0.2s",
                    "&:hover": {
                      boxShadow: 4,
                      borderColor: "primary.light",
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
                      <Box
                        display="flex"
                        alignItems="center"
                        justifyContent="space-between"
                        mb={1}
                      >
                        <Typography variant="h6" fontWeight={600}>
                          {template.name}
                        </Typography>
                        {selectedTemplateId === template.id && (
                          <Radio checked color="primary" />
                        )}
                      </Box>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ mb: 1.5 }}
                      >
                        {template.description}
                      </Typography>
                      <Stack direction="row" spacing={1} flexWrap="wrap">
                        <Chip
                          label={template.category}
                          size="small"
                          color="primary"
                          variant="outlined"
                        />
                        <Chip
                          label={template.style.fontFamily}
                          size="small"
                          variant="outlined"
                        />
                      </Stack>

                      {/* Font and Color Preview */}
                      <Box sx={{ mt: 2, display: "flex", gap: 1 }}>
                        <Box
                          sx={{
                            width: 32,
                            height: 32,
                            borderRadius: 1,
                            bgcolor: template.style.colors.primary,
                            border: "1px solid",
                            borderColor: "divider",
                          }}
                        />
                        <Box
                          sx={{
                            flex: 1,
                            p: 1,
                            borderRadius: 1,
                            border: "1px solid",
                            borderColor: "divider",
                            fontFamily: template.style.fontFamily,
                            fontSize: "0.75rem",
                          }}
                        >
                          The quick brown fox
                        </Box>
                      </Box>
                    </CardContent>
                  </CardActionArea>
                </Card>
              ))}
            </Stack>
          </Box>

          {/* Right: Template Preview */}
          <Box sx={{ width: "60%" }}>
            <Box position="relative">
              {/* Navigation Arrows */}
              <Box
                display="flex"
                alignItems="center"
                justifyContent="space-between"
                mb={2}
              >
                <IconButton onClick={handlePrevious} size="small">
                  <ChevronLeftIcon />
                </IconButton>
                <Typography variant="body2" color="text.secondary">
                  {previewIndex + 1} of {filteredTemplates.length}
                </Typography>
                <IconButton onClick={handleNext} size="small">
                  <ChevronRightIcon />
                </IconButton>
              </Box>

              {/* Template Preview */}
              <Box
                sx={{
                  maxHeight: 500,
                  overflowY: "auto",
                  border: "1px solid",
                  borderColor: "divider",
                  borderRadius: 1,
                }}
              >
                {renderPreview()}
              </Box>
            </Box>
          </Box>
        </Box>
      </DialogContent>

      <Divider />

      <DialogActions sx={{ p: 2.5 }}>
        <Button onClick={onClose} variant="outlined">
          Cancel
        </Button>
        <Button
          onClick={handleUseTemplate}
          variant="contained"
          startIcon={<CheckCircleIcon />}
        >
          Use This Template
        </Button>
      </DialogActions>
    </Dialog>
  );
}
