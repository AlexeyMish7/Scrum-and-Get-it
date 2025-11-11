/**
 * CoverLetterTemplateCreator.tsx
 * Form-based UI for creating custom cover letter templates.
 *
 * PURPOSE: Enable users to build custom templates without JSON editing
 *
 * Flow:
 * - User fills in template configuration form
 * - Real-time preview shows visual styling
 * - Saves to localStorage when complete
 * - Template appears in template lists immediately
 */

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Stack,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
  Alert,
  Box,
  Paper,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Grid,
} from "@mui/material";
import { useState } from "react";
import type { CoverLetterTemplate } from "@workspaces/ai/config/coverLetterTemplates";

interface CoverLetterTemplateCreatorProps {
  open: boolean;
  onClose: () => void;
  onSave: (template: CoverLetterTemplate) => void;
}

/**
 * Custom template creator dialog.
 * Inputs: template name, category, styling (fonts, colors), formatting, defaults
 * Output: Complete CoverLetterTemplate object saved to localStorage
 */
export default function CoverLetterTemplateCreator({
  open,
  onClose,
  onSave,
}: CoverLetterTemplateCreatorProps) {
  // Basic Info
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<
    "professional" | "creative" | "technical" | "modern"
  >("professional");

  // Style
  const [fontFamily, setFontFamily] = useState("Arial, sans-serif");
  const [fontSize, setFontSize] = useState(11);
  const [lineHeight, setLineHeight] = useState(1.6);
  const [primaryColor, setPrimaryColor] = useState("#2c3e50");
  const [textColor, setTextColor] = useState("#333333");
  const [accentColor, setAccentColor] = useState("#3498db");
  const [backgroundColor, setBackgroundColor] = useState("#ffffff");

  // Formatting
  const [headerStyle, setHeaderStyle] = useState<"left" | "center" | "right">(
    "left"
  );
  const [salutationStyle, setSalutationStyle] = useState<"formal" | "casual">(
    "formal"
  );
  const [closingStyle, setClosingStyle] = useState<"formal" | "casual">(
    "formal"
  );
  const [paragraphSpacing, setParagraphSpacing] = useState(12);
  const [includeDate, setIncludeDate] = useState(true);
  const [includeAddress, setIncludeAddress] = useState(false);

  // Defaults
  const [defaultTone, setDefaultTone] = useState<
    "formal" | "casual" | "enthusiastic" | "analytical"
  >("formal");
  const [defaultLength, setDefaultLength] = useState<
    "brief" | "standard" | "detailed"
  >("standard");
  const [defaultCulture, setDefaultCulture] = useState<
    "corporate" | "startup" | "creative"
  >("corporate");

  // Validation
  const [error, setError] = useState("");

  const handleSave = () => {
    // Validation
    if (!name.trim()) {
      setError("Template name is required");
      return;
    }
    if (name.length < 3) {
      setError("Template name must be at least 3 characters");
      return;
    }

    // Build template object
    const newTemplate: CoverLetterTemplate = {
      id: `custom-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: name.trim(),
      description: description.trim() || `Custom ${category} template`,
      category,
      isSystem: false,
      style: {
        fontFamily,
        fontSize,
        lineHeight,
        margins: {
          top: 72,
          right: 72,
          bottom: 72,
          left: 72,
        },
        colors: {
          primary: primaryColor,
          text: textColor,
          accent: accentColor,
          background: backgroundColor,
        },
      },
      formatting: {
        headerStyle,
        paragraphSpacing,
        salutationStyle,
        closingStyle,
        includeDate,
        includeAddress,
      },
      defaultTone,
      defaultLength,
      defaultCulture,
      structure: {
        opening: "Express interest and state the position",
        bodyParagraphs:
          defaultLength === "brief" ? 2 : defaultLength === "standard" ? 3 : 4,
        closing: "Thank the reader and request an interview",
      },
    };

    onSave(newTemplate);
    handleClose();
  };

  const handleClose = () => {
    // Reset form
    setName("");
    setDescription("");
    setCategory("professional");
    setFontFamily("Arial, sans-serif");
    setFontSize(11);
    setLineHeight(1.6);
    setPrimaryColor("#2c3e50");
    setTextColor("#333333");
    setAccentColor("#3498db");
    setBackgroundColor("#ffffff");
    setHeaderStyle("left");
    setSalutationStyle("formal");
    setClosingStyle("formal");
    setParagraphSpacing(12);
    setIncludeDate(true);
    setIncludeAddress(false);
    setDefaultTone("formal");
    setDefaultLength("standard");
    setDefaultCulture("corporate");
    setError("");
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>Create Custom Cover Letter Template</DialogTitle>
      <DialogContent>
        <Stack spacing={3} sx={{ mt: 1 }}>
          {error && <Alert severity="error">{error}</Alert>}

          {/* Basic Info Section */}
          <Box>
            <Typography variant="subtitle1" fontWeight={600} gutterBottom>
              Basic Information
            </Typography>
            <Stack spacing={2}>
              <TextField
                label="Template Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., My Professional Template"
                required
                fullWidth
              />
              <TextField
                label="Description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief description of this template"
                multiline
                rows={2}
                fullWidth
              />
              <FormControl fullWidth>
                <InputLabel>Category</InputLabel>
                <Select
                  value={category}
                  label="Category"
                  onChange={(e) =>
                    setCategory(
                      e.target.value as
                        | "professional"
                        | "creative"
                        | "technical"
                        | "modern"
                    )
                  }
                >
                  <MenuItem value="professional">Professional</MenuItem>
                  <MenuItem value="creative">Creative</MenuItem>
                  <MenuItem value="technical">Technical</MenuItem>
                  <MenuItem value="modern">Modern</MenuItem>
                </Select>
              </FormControl>
            </Stack>
          </Box>

          <Divider />

          {/* Style Section */}
          <Box>
            <Typography variant="subtitle1" fontWeight={600} gutterBottom>
              Visual Styling
            </Typography>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <FormControl fullWidth>
                  <InputLabel>Font Family</InputLabel>
                  <Select
                    value={fontFamily}
                    label="Font Family"
                    onChange={(e) => setFontFamily(e.target.value)}
                  >
                    <MenuItem value="Arial, sans-serif">Arial</MenuItem>
                    <MenuItem value="'Georgia', serif">Georgia</MenuItem>
                    <MenuItem value="'Times New Roman', serif">
                      Times New Roman
                    </MenuItem>
                    <MenuItem value="'Helvetica', sans-serif">
                      Helvetica
                    </MenuItem>
                    <MenuItem value="'Calibri', sans-serif">Calibri</MenuItem>
                    <MenuItem value="'Garamond', serif">Garamond</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="Font Size (pt)"
                  type="number"
                  value={fontSize}
                  onChange={(e) => setFontSize(Number(e.target.value))}
                  inputProps={{ min: 9, max: 14 }}
                  fullWidth
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="Line Height"
                  type="number"
                  value={lineHeight}
                  onChange={(e) => setLineHeight(Number(e.target.value))}
                  inputProps={{ min: 1.2, max: 2.0, step: 0.1 }}
                  fullWidth
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="Primary Color"
                  type="color"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  fullWidth
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="Text Color"
                  type="color"
                  value={textColor}
                  onChange={(e) => setTextColor(e.target.value)}
                  fullWidth
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="Accent Color"
                  type="color"
                  value={accentColor}
                  onChange={(e) => setAccentColor(e.target.value)}
                  fullWidth
                />
              </Grid>
            </Grid>
          </Box>

          <Divider />

          {/* Formatting Section */}
          <Box>
            <Typography variant="subtitle1" fontWeight={600} gutterBottom>
              Formatting Preferences
            </Typography>
            <Stack spacing={2}>
              <FormControl>
                <FormLabel>Header Style</FormLabel>
                <RadioGroup
                  row
                  value={headerStyle}
                  onChange={(e) =>
                    setHeaderStyle(
                      e.target.value as "left" | "center" | "right"
                    )
                  }
                >
                  <FormControlLabel
                    value="left"
                    control={<Radio />}
                    label="Left-aligned"
                  />
                  <FormControlLabel
                    value="center"
                    control={<Radio />}
                    label="Centered"
                  />
                  <FormControlLabel
                    value="right"
                    control={<Radio />}
                    label="Right-aligned"
                  />
                </RadioGroup>
              </FormControl>

              <FormControl>
                <FormLabel>Salutation Style</FormLabel>
                <RadioGroup
                  row
                  value={salutationStyle}
                  onChange={(e) =>
                    setSalutationStyle(e.target.value as "formal" | "casual")
                  }
                >
                  <FormControlLabel
                    value="formal"
                    control={<Radio />}
                    label="Formal (Dear Hiring Manager)"
                  />
                  <FormControlLabel
                    value="casual"
                    control={<Radio />}
                    label="Casual (Hello/Hi)"
                  />
                </RadioGroup>
              </FormControl>

              <FormControl>
                <FormLabel>Closing Style</FormLabel>
                <RadioGroup
                  row
                  value={closingStyle}
                  onChange={(e) =>
                    setClosingStyle(e.target.value as "formal" | "casual")
                  }
                >
                  <FormControlLabel
                    value="formal"
                    control={<Radio />}
                    label="Formal (Sincerely)"
                  />
                  <FormControlLabel
                    value="casual"
                    control={<Radio />}
                    label="Casual (Best regards)"
                  />
                </RadioGroup>
              </FormControl>

              <TextField
                label="Paragraph Spacing (px)"
                type="number"
                value={paragraphSpacing}
                onChange={(e) => setParagraphSpacing(Number(e.target.value))}
                inputProps={{ min: 6, max: 24 }}
                fullWidth
              />
            </Stack>
          </Box>

          <Divider />

          {/* Default Settings Section */}
          <Box>
            <Typography variant="subtitle1" fontWeight={600} gutterBottom>
              Default AI Settings
            </Typography>
            <Stack spacing={2}>
              <FormControl fullWidth>
                <InputLabel>Default Tone</InputLabel>
                <Select
                  value={defaultTone}
                  label="Default Tone"
                  onChange={(e) =>
                    setDefaultTone(
                      e.target.value as
                        | "formal"
                        | "casual"
                        | "enthusiastic"
                        | "analytical"
                    )
                  }
                >
                  <MenuItem value="formal">Formal</MenuItem>
                  <MenuItem value="casual">Casual</MenuItem>
                  <MenuItem value="enthusiastic">Enthusiastic</MenuItem>
                  <MenuItem value="analytical">Analytical</MenuItem>
                </Select>
              </FormControl>

              <FormControl fullWidth>
                <InputLabel>Default Length</InputLabel>
                <Select
                  value={defaultLength}
                  label="Default Length"
                  onChange={(e) =>
                    setDefaultLength(
                      e.target.value as "brief" | "standard" | "detailed"
                    )
                  }
                >
                  <MenuItem value="brief">Brief (2 paragraphs)</MenuItem>
                  <MenuItem value="standard">Standard (3 paragraphs)</MenuItem>
                  <MenuItem value="detailed">Detailed (4 paragraphs)</MenuItem>
                </Select>
              </FormControl>

              <FormControl fullWidth>
                <InputLabel>Default Culture</InputLabel>
                <Select
                  value={defaultCulture}
                  label="Default Culture"
                  onChange={(e) =>
                    setDefaultCulture(
                      e.target.value as "corporate" | "startup" | "creative"
                    )
                  }
                >
                  <MenuItem value="corporate">Corporate</MenuItem>
                  <MenuItem value="startup">Startup</MenuItem>
                  <MenuItem value="creative">Creative</MenuItem>
                </Select>
              </FormControl>
            </Stack>
          </Box>

          {/* Preview */}
          <Paper
            variant="outlined"
            sx={{
              p: 2,
              bgcolor: backgroundColor,
              color: textColor,
              fontFamily: fontFamily,
              fontSize: `${fontSize}pt`,
              lineHeight: lineHeight,
            }}
          >
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ mb: 1, display: "block" }}
            >
              Preview:
            </Typography>
            <Box sx={{ textAlign: headerStyle }}>
              <Typography
                variant="h6"
                sx={{ color: primaryColor, fontWeight: 600, mb: 1 }}
              >
                Your Name
              </Typography>
              <Typography variant="body2" sx={{ mb: 2 }}>
                your.email@example.com | (555) 123-4567
              </Typography>
            </Box>
            <Typography variant="body2" sx={{ mb: `${paragraphSpacing}px` }}>
              {salutationStyle === "formal" ? "Dear Hiring Manager," : "Hello,"}
            </Typography>
            <Typography variant="body2" sx={{ mb: `${paragraphSpacing}px` }}>
              This is a sample paragraph showing how your cover letter will look
              with this template. The font family, size, and colors are applied
              here.
            </Typography>
            <Typography variant="body2" sx={{ mb: `${paragraphSpacing}px` }}>
              {closingStyle === "formal" ? "Sincerely," : "Best regards,"}
            </Typography>
            <Typography variant="body2" sx={{ color: accentColor }}>
              [Your Name]
            </Typography>
          </Paper>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Cancel</Button>
        <Button onClick={handleSave} variant="contained">
          Create Template
        </Button>
      </DialogActions>
    </Dialog>
  );
}
