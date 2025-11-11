/**
 * COVER LETTER TEMPLATE MANAGER
 *
 * WHAT: Template library management interface (view, import, export, create templates)
 * WHY: Centralized template management for TemplatesHub page
 *
 * PURPOSE: Template administration ONLY (not for creating cover letters)
 * - Browse system templates (formal, creative, technical)
 * - Create custom templates with visual builder
 * - Import custom templates from JSON
 * - Export templates to share
 * - View template details and analytics
 *
 * NOTE: Template SELECTION for creating cover letters happens in CoverLetterEditor,
 * not here. This is purely for managing the template library.
 */

import { useState, useEffect } from "react";
import {
  Box,
  Stack,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import DownloadIcon from "@mui/icons-material/Download";
import InfoIcon from "@mui/icons-material/Info";
import AddIcon from "@mui/icons-material/Add";
import {
  getCoverLetterTemplateList,
  type CoverLetterTemplate,
  importCustomTemplate,
  exportExampleTemplate,
  saveCustomTemplate,
} from "@workspaces/ai/config/coverLetterTemplates";
import CoverLetterTemplateCreator from "./CoverLetterTemplateCreator";

export default function CoverLetterTemplateManager() {
  const [templates, setTemplates] = useState<CoverLetterTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] =
    useState<CoverLetterTemplate | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [creatorOpen, setCreatorOpen] = useState(false);

  // Load templates and analytics
  useEffect(() => {
    const allTemplates = getCoverLetterTemplateList();
    setTemplates(allTemplates);
  }, []);

  // Handle template import
  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const imported = await importCustomTemplate(file);
      setTemplates(getCoverLetterTemplateList()); // Refresh list
      alert(`Template "${imported.name}" imported successfully!`);
    } catch (error) {
      alert(
        `Import failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  };

  // Handle custom template creation
  const handleSaveTemplate = (template: CoverLetterTemplate) => {
    saveCustomTemplate(template);
    setTemplates(getCoverLetterTemplateList()); // Refresh list
    alert(`Template "${template.name}" created successfully!`);
  };

  // Handle example template download
  const handleDownloadExample = (templateId: "modern" | "minimal") => {
    exportExampleTemplate(templateId);
  };

  // View template details
  const handleViewTemplate = (template: CoverLetterTemplate) => {
    setSelectedTemplate(template);
    setPreviewOpen(true);
  };

  const systemTemplates = templates.filter((t) => t.isSystem);
  const customTemplates = templates.filter((t) => !t.isSystem);

  return (
    <Box>
      {/* Header Actions */}
      <Stack direction="row" spacing={2} sx={{ mb: 3 }} flexWrap="wrap">
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setCreatorOpen(true)}
        >
          Create Custom Template
        </Button>
        <Button
          variant="outlined"
          component="label"
          startIcon={<CloudUploadIcon />}
        >
          Import Template
          <input
            type="file"
            hidden
            accept="application/json"
            onChange={handleImport}
          />
        </Button>
        <Button
          variant="outlined"
          startIcon={<DownloadIcon />}
          onClick={() => handleDownloadExample("modern")}
        >
          Download Modern Example
        </Button>
        <Button
          variant="outlined"
          startIcon={<DownloadIcon />}
          onClick={() => handleDownloadExample("minimal")}
        >
          Download Minimal Example
        </Button>
      </Stack>
      {/* Info Alert */}
      <Alert severity="info" icon={<InfoIcon />} sx={{ mb: 3 }}>
        <Typography variant="body2">
          <strong>How to use templates:</strong> Create custom templates using
          the visual builder, import from JSON, or download examples. When
          creating a new cover letter, go to the{" "}
          <strong>Cover Letter Editor</strong> where you'll select a template as
          part of the creation flow.
        </Typography>
        <Typography variant="caption" display="block" sx={{ mt: 1 }}>
          💡 The custom template builder lets you configure fonts, colors,
          formatting, and default AI settings without editing JSON files.
        </Typography>
      </Alert>
      {/* System Templates */}
      <Typography variant="h6" sx={{ mb: 2 }}>
        System Templates ({systemTemplates.length})
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Built-in professional templates (read-only)
      </Typography>
      <Stack direction="row" spacing={2} flexWrap="wrap" sx={{ mb: 4 }}>
        {systemTemplates.map((template) => (
          <Card variant="outlined" key={template.id} sx={{ width: 300 }}>
            <CardContent>
              <Stack spacing={1}>
                <Typography variant="h6">{template.name}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {template.description}
                </Typography>
                <Stack direction="row" spacing={1}>
                  <Chip label={template.category} size="small" />
                  <Chip
                    label={`Tone: ${template.defaultTone}`}
                    size="small"
                    variant="outlined"
                  />
                </Stack>
                <Button
                  size="small"
                  onClick={() => handleViewTemplate(template)}
                >
                  View Details
                </Button>
              </Stack>
            </CardContent>
          </Card>
        ))}
      </Stack>
      {/* Custom Templates */}
      <Typography variant="h6" sx={{ mb: 2 }}>
        Custom Templates ({customTemplates.length})
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        User-imported templates (can be edited or deleted)
      </Typography>
      {customTemplates.length === 0 ? (
        <Alert severity="info">
          No custom templates yet. Import example templates using the buttons
          above or create your own JSON files.
        </Alert>
      ) : (
        <Stack direction="row" spacing={2} flexWrap="wrap">
          {customTemplates.map((template) => (
            <Card variant="outlined" key={template.id} sx={{ width: 300 }}>
              <CardContent>
                <Stack spacing={1}>
                  <Typography variant="h6">{template.name}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {template.description}
                  </Typography>
                  <Stack direction="row" spacing={1}>
                    <Chip label={template.category} size="small" />
                    <Chip
                      label={`Tone: ${template.defaultTone}`}
                      size="small"
                      variant="outlined"
                    />
                  </Stack>
                  <Button
                    size="small"
                    onClick={() => handleViewTemplate(template)}
                  >
                    View Details
                  </Button>
                </Stack>
              </CardContent>
            </Card>
          ))}
        </Stack>
      )}{" "}
      {/* Template Preview Dialog */}
      <Dialog
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>{selectedTemplate?.name}</DialogTitle>
        <DialogContent>
          {selectedTemplate && (
            <Stack spacing={2}>
              <Typography variant="body2">
                {selectedTemplate.description}
              </Typography>
              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  Style Configuration
                </Typography>
                <Typography variant="body2">
                  • Font: {selectedTemplate.style.fontFamily}
                </Typography>
                <Typography variant="body2">
                  • Font Size: {selectedTemplate.style.fontSize}px
                </Typography>
                <Typography variant="body2">
                  • Line Height: {selectedTemplate.style.lineHeight}
                </Typography>
              </Box>
              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  Formatting
                </Typography>
                <Typography variant="body2">
                  • Header: {selectedTemplate.formatting.headerStyle}
                </Typography>
                <Typography variant="body2">
                  • Salutation: {selectedTemplate.formatting.salutationStyle}
                </Typography>
                <Typography variant="body2">
                  • Closing: {selectedTemplate.formatting.closingStyle}
                </Typography>
              </Box>
              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  Default Settings
                </Typography>
                <Typography variant="body2">
                  • Tone: {selectedTemplate.defaultTone}
                </Typography>
                <Typography variant="body2">
                  • Length: {selectedTemplate.defaultLength}
                </Typography>
                <Typography variant="body2">
                  • Culture: {selectedTemplate.defaultCulture}
                </Typography>
              </Box>
              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  Template Structure
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Opening:
                </Typography>
                <Typography variant="body2" sx={{ fontStyle: "italic", mb: 1 }}>
                  "{selectedTemplate.structure.opening}"
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Closing:
                </Typography>
                <Typography variant="body2" sx={{ fontStyle: "italic" }}>
                  "{selectedTemplate.structure.closing}"
                </Typography>
              </Box>
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPreviewOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
      {/* Template Creator Dialog */}
      <CoverLetterTemplateCreator
        open={creatorOpen}
        onClose={() => setCreatorOpen(false)}
        onSave={handleSaveTemplate}
      />
    </Box>
  );
}
