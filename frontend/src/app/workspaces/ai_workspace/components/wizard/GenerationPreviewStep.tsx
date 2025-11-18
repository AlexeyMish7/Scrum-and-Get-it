/**
 * GENERATION PREVIEW STEP
 * Step 5 of the generation wizard - review configuration and generate document.
 */

import React from "react";
import {
  Box,
  Typography,
  Paper,
  Stack,
  Chip,
  Divider,
  Alert,
  LinearProgress,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from "@mui/material";
import DescriptionIcon from "@mui/icons-material/Description";
import PaletteIcon from "@mui/icons-material/Palette";
import WorkIcon from "@mui/icons-material/Work";
import SettingsIcon from "@mui/icons-material/Settings";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import type { Template, Theme } from "../../types/template.types";
import type {
  GenerationOptions,
  GenerationProgress,
} from "../../types/generation.types";
import type { JobContext } from "./JobContextStep";

/**
 * GenerationPreviewStep Props
 */
interface GenerationPreviewStepProps {
  /** Selected template */
  template: Template;

  /** Selected theme */
  theme: Theme;

  /** Job context (optional) */
  jobContext?: JobContext;

  /** Generation options */
  options: GenerationOptions;

  /** Generation progress (when generating) */
  progress?: GenerationProgress;

  /** Whether generation is in progress */
  isGenerating?: boolean;
}

/**
 * GenerationPreviewStep Component
 *
 * Inputs:
 * - template: Selected template configuration
 * - theme: Selected theme configuration
 * - jobContext: Optional job context data
 * - options: AI generation options
 * - progress: Current generation progress (if generating)
 * - isGenerating: Whether generation is currently running
 *
 * Outputs:
 * - Summary of all configuration choices
 * - Progress indicator during generation
 * - Success/error messages
 */
export const GenerationPreviewStep: React.FC<GenerationPreviewStepProps> = ({
  template,
  theme,
  jobContext,
  options,
  progress,
  isGenerating = false,
}) => {
  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Review & Generate
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Review your selections before generating the document.
      </Typography>

      <Stack spacing={3}>
        {/* Template Summary */}
        <Paper variant="outlined" sx={{ p: 2 }}>
          <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
            <DescriptionIcon sx={{ mr: 1, color: "primary.main" }} />
            <Typography variant="subtitle1" fontWeight={600}>
              Template
            </Typography>
          </Box>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            {template.name}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {template.metadata.description}
          </Typography>
          <Box sx={{ mt: 1 }}>
            <Chip
              label={
                template.features.atsOptimized ? "ATS Optimized" : "Standard"
              }
              size="small"
              color={template.features.atsOptimized ? "success" : "default"}
            />
          </Box>
        </Paper>

        {/* Theme Summary */}
        <Paper variant="outlined" sx={{ p: 2 }}>
          <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
            <PaletteIcon sx={{ mr: 1, color: "secondary.main" }} />
            <Typography variant="subtitle1" fontWeight={600}>
              Theme
            </Typography>
          </Box>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            {theme.name}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {theme.metadata.description}
          </Typography>
          <Box sx={{ display: "flex", gap: 0.5, mt: 1 }}>
            <Box
              sx={{
                width: 40,
                height: 20,
                bgcolor: theme.colors.primary,
                borderRadius: 0.5,
              }}
            />
            <Box
              sx={{
                width: 40,
                height: 20,
                bgcolor: theme.colors.secondary,
                borderRadius: 0.5,
              }}
            />
            <Box
              sx={{
                width: 40,
                height: 20,
                bgcolor: theme.colors.accent,
                borderRadius: 0.5,
              }}
            />
          </Box>
        </Paper>

        {/* Job Context Summary (if provided) */}
        {jobContext && (jobContext.companyName || jobContext.jobTitle) && (
          <Paper variant="outlined" sx={{ p: 2 }}>
            <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
              <WorkIcon sx={{ mr: 1, color: "success.main" }} />
              <Typography variant="subtitle1" fontWeight={600}>
                Job Context
              </Typography>
            </Box>
            {jobContext.jobTitle && (
              <Typography variant="body2">
                <strong>Position:</strong> {jobContext.jobTitle}
              </Typography>
            )}
            {jobContext.companyName && (
              <Typography variant="body2">
                <strong>Company:</strong> {jobContext.companyName}
              </Typography>
            )}
            {jobContext.keyRequirements &&
              jobContext.keyRequirements.length > 0 && (
                <Typography variant="caption" color="text.secondary">
                  {jobContext.keyRequirements.length} key requirements detected
                </Typography>
              )}
          </Paper>
        )}

        {/* Options Summary */}
        <Paper variant="outlined" sx={{ p: 2 }}>
          <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
            <SettingsIcon sx={{ mr: 1, color: "info.main" }} />
            <Typography variant="subtitle1" fontWeight={600}>
              Generation Options
            </Typography>
          </Box>
          <List dense disablePadding>
            {options.atsOptimized && (
              <ListItem disablePadding>
                <ListItemIcon sx={{ minWidth: 32 }}>
                  <CheckCircleIcon fontSize="small" color="success" />
                </ListItemIcon>
                <ListItemText primary="ATS Optimized" />
              </ListItem>
            )}
            {options.keywordMatch && (
              <ListItem disablePadding>
                <ListItemIcon sx={{ minWidth: 32 }}>
                  <CheckCircleIcon fontSize="small" color="success" />
                </ListItemIcon>
                <ListItemText primary="Keyword Matching" />
              </ListItem>
            )}
            {options.skillsHighlight && (
              <ListItem disablePadding>
                <ListItemIcon sx={{ minWidth: 32 }}>
                  <CheckCircleIcon fontSize="small" color="success" />
                </ListItemIcon>
                <ListItemText primary="Skills Highlighting" />
              </ListItem>
            )}
            {options.includePortfolio && (
              <ListItem disablePadding>
                <ListItemIcon sx={{ minWidth: 32 }}>
                  <CheckCircleIcon fontSize="small" color="success" />
                </ListItemIcon>
                <ListItemText primary="Portfolio Links" />
              </ListItem>
            )}
          </List>
          <Divider sx={{ my: 1 }} />
          <Typography variant="body2">
            <strong>Tone:</strong>{" "}
            {options.tone.charAt(0).toUpperCase() + options.tone.slice(1)}
          </Typography>
          <Typography variant="body2">
            <strong>Length:</strong>{" "}
            {options.length.charAt(0).toUpperCase() + options.length.slice(1)}
          </Typography>
        </Paper>

        {/* Generation Progress */}
        {isGenerating && progress && (
          <Paper variant="outlined" sx={{ p: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              Generating Document...
            </Typography>
            <LinearProgress
              variant="determinate"
              value={progress.progress}
              sx={{ mb: 1 }}
            />
            <Typography variant="caption" color="text.secondary">
              {progress.message}
            </Typography>
          </Paper>
        )}

        {/* Success/Error Messages */}
        {progress?.complete && !progress.error && (
          <Alert severity="success">
            Document generated successfully! You can now edit and export it.
          </Alert>
        )}
        {progress?.error && (
          <Alert severity="error">
            <strong>Generation failed:</strong> {progress.error}
          </Alert>
        )}
      </Stack>
    </Box>
  );
};
