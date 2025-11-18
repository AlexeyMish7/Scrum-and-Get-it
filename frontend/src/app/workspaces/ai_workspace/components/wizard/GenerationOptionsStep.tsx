/**
 * GENERATION OPTIONS STEP
 * Step 4 of the generation wizard - configure AI generation settings.
 */

import React from "react";
import {
  Box,
  Typography,
  FormControl,
  FormLabel,
  FormGroup,
  FormControlLabel,
  Checkbox,
  RadioGroup,
  Radio,
  Paper,
  Stack,
  Divider,
  Alert,
} from "@mui/material";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import type {
  GenerationOptions,
  GenerationTone,
  GenerationLength,
} from "../../types/generation.types";

/**
 * GenerationOptionsStep Props
 */
interface GenerationOptionsStepProps {
  /** Current generation options */
  options: GenerationOptions;

  /** Options update handler */
  onUpdateOptions: (options: GenerationOptions) => void;

  /** Whether job context was provided (enables keyword matching) */
  hasJobContext?: boolean;
}

/**
 * GenerationOptionsStep Component
 *
 * Inputs:
 * - options: Current generation options (tone, length, ATS settings)
 * - onUpdateOptions: Callback to update options
 * - hasJobContext: Whether job context is available (enables keyword matching)
 *
 * Outputs:
 * - Form controls for all generation options
 * - Calls onUpdateOptions when any option changes
 */
export const GenerationOptionsStep: React.FC<GenerationOptionsStepProps> = ({
  options,
  onUpdateOptions,
  hasJobContext = false,
}) => {
  /**
   * Update a single option field
   */
  const updateOption = <K extends keyof GenerationOptions>(
    key: K,
    value: GenerationOptions[K]
  ) => {
    onUpdateOptions({ ...options, [key]: value });
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Generation Options
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Configure how the AI will generate your document.
      </Typography>

      <Stack spacing={3}>
        {/* AI Optimization Options */}
        <Paper variant="outlined" sx={{ p: 2 }}>
          <Typography variant="subtitle1" gutterBottom fontWeight={600}>
            <AutoAwesomeIcon
              sx={{ fontSize: 18, mr: 1, verticalAlign: "middle" }}
            />
            AI Optimization
          </Typography>
          <Divider sx={{ mb: 2 }} />

          <FormGroup>
            {/* ATS Optimization */}
            <FormControlLabel
              control={
                <Checkbox
                  checked={options.atsOptimized}
                  onChange={(e) =>
                    updateOption("atsOptimized", e.target.checked)
                  }
                />
              }
              label="ATS Optimized"
            />
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ ml: 4, mb: 1 }}
            >
              Optimize for Applicant Tracking Systems with keywords and
              formatting
            </Typography>

            {/* Keyword Matching */}
            <FormControlLabel
              control={
                <Checkbox
                  checked={options.keywordMatch}
                  onChange={(e) =>
                    updateOption("keywordMatch", e.target.checked)
                  }
                  disabled={!hasJobContext}
                />
              }
              label="Match Job Keywords"
            />
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ ml: 4, mb: 1 }}
            >
              {hasJobContext
                ? "Incorporate keywords from the job description"
                : "Requires job context to be provided"}
            </Typography>

            {/* Skills Highlighting */}
            <FormControlLabel
              control={
                <Checkbox
                  checked={options.skillsHighlight}
                  onChange={(e) =>
                    updateOption("skillsHighlight", e.target.checked)
                  }
                />
              }
              label="Highlight Relevant Skills"
            />
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ ml: 4, mb: 1 }}
            >
              Emphasize skills that match the position requirements
            </Typography>

            {/* Portfolio Links */}
            <FormControlLabel
              control={
                <Checkbox
                  checked={options.includePortfolio}
                  onChange={(e) =>
                    updateOption("includePortfolio", e.target.checked)
                  }
                />
              }
              label="Include Portfolio Links"
            />
            <Typography variant="caption" color="text.secondary" sx={{ ml: 4 }}>
              Add links to your portfolio, projects, and work samples
            </Typography>
          </FormGroup>
        </Paper>

        {/* Tone Selection */}
        <Paper variant="outlined" sx={{ p: 2 }}>
          <FormControl component="fieldset">
            <FormLabel component="legend">Content Tone</FormLabel>
            <RadioGroup
              value={options.tone}
              onChange={(e) =>
                updateOption("tone", e.target.value as GenerationTone)
              }
            >
              <FormControlLabel
                value="professional"
                control={<Radio />}
                label="Professional"
              />
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ ml: 4, mb: 1 }}
              >
                Formal and business-appropriate language
              </Typography>

              <FormControlLabel
                value="confident"
                control={<Radio />}
                label="Confident"
              />
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ ml: 4, mb: 1 }}
              >
                Assertive and achievement-focused
              </Typography>

              <FormControlLabel
                value="enthusiastic"
                control={<Radio />}
                label="Enthusiastic"
              />
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ ml: 4, mb: 1 }}
              >
                Energetic and passion-driven
              </Typography>

              <FormControlLabel
                value="analytical"
                control={<Radio />}
                label="Analytical"
              />
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ ml: 4 }}
              >
                Data-driven and detail-oriented
              </Typography>
            </RadioGroup>
          </FormControl>
        </Paper>

        {/* Length Selection */}
        <Paper variant="outlined" sx={{ p: 2 }}>
          <FormControl component="fieldset">
            <FormLabel component="legend">Content Length</FormLabel>
            <RadioGroup
              value={options.length}
              onChange={(e) =>
                updateOption("length", e.target.value as GenerationLength)
              }
            >
              <FormControlLabel
                value="concise"
                control={<Radio />}
                label="Concise"
              />
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ ml: 4, mb: 1 }}
              >
                Brief and to-the-point (1 page recommended)
              </Typography>

              <FormControlLabel
                value="standard"
                control={<Radio />}
                label="Standard"
              />
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ ml: 4, mb: 1 }}
              >
                Balanced detail and brevity (1-2 pages)
              </Typography>

              <FormControlLabel
                value="detailed"
                control={<Radio />}
                label="Detailed"
              />
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ ml: 4 }}
              >
                Comprehensive with full context (2+ pages)
              </Typography>
            </RadioGroup>
          </FormControl>
        </Paper>

        {/* ATS Warning */}
        {options.atsOptimized && options.length === "detailed" && (
          <Alert severity="warning">
            Detailed content may reduce ATS compatibility. Consider using
            standard length for better ATS scores.
          </Alert>
        )}
      </Stack>
    </Box>
  );
};
