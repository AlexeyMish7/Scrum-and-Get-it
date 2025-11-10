/**
 * CoverLetterAIResultsPanel
 *
 * WHAT: Middle panel for AI-generated cover letter content preview
 * WHY: User reviews AI-generated opening, body, closing before applying
 *
 * Features:
 * - Displays AI-generated content sections (opening, body paragraphs, closing)
 * - Shows generation metadata (tone, length, culture, word count)
 * - Apply button to insert content into active draft
 * - Regenerate button to create new variation
 * - Dismiss button to clear pending content
 *
 * Inputs:
 * - pendingContent: { opening, body, closing, metadata }
 * - onApply: Callback to apply content to draft
 * - onRegenerate: Callback to generate new variation
 * - onDismiss: Callback to clear pending content
 * - isRegenerating: Loading state for regeneration
 */

import {
  Box,
  Button,
  Typography,
  Paper,
  Stack,
  Chip,
  Divider,
  Alert,
  CircularProgress,
} from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import RefreshIcon from "@mui/icons-material/Refresh";
import CloseIcon from "@mui/icons-material/Close";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import type { CoverLetterArtifactContent } from "../../hooks/useCoverLetterDrafts";

interface AIResultsPanelProps {
  pendingContent: CoverLetterArtifactContent | null;
  onApply: () => void;
  onRegenerate: () => void;
  onDismiss: () => void;
  isRegenerating?: boolean;
}

/**
 * Display AI-generated cover letter content with apply controls
 */
export default function CoverLetterAIResultsPanel({
  pendingContent,
  onApply,
  onRegenerate,
  onDismiss,
  isRegenerating = false,
}: AIResultsPanelProps) {
  if (!pendingContent) {
    return (
      <Paper
        elevation={2}
        sx={{
          p: 3,
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Stack
          spacing={2}
          alignItems="center"
          sx={{ textAlign: "center", maxWidth: 400 }}
        >
          <AutoAwesomeIcon
            sx={{ fontSize: 64, color: "text.secondary", opacity: 0.3 }}
          />
          <Typography variant="h6" color="text.secondary">
            No AI Content Yet
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Select a target job and click "Generate Cover Letter" to create
            AI-powered content.
          </Typography>
        </Stack>
      </Paper>
    );
  }

  const { opening, body, closing, tone, companyResearch } = pendingContent;

  // Calculate word count
  const openingWords = opening.split(/\s+/).filter(Boolean).length;
  const bodyWords = body.reduce(
    (sum, p) => sum + p.split(/\s+/).filter(Boolean).length,
    0
  );
  const closingWords = closing.split(/\s+/).filter(Boolean).length;
  const totalWordCount = openingWords + bodyWords + closingWords;

  return (
    <Paper elevation={2} sx={{ p: 3, height: "100%", overflowY: "auto" }}>
      <Stack spacing={3}>
        {/* Header with metadata */}
        <Box>
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
            <AutoAwesomeIcon color="primary" />
            <Typography variant="h6">AI-Generated Content</Typography>
          </Stack>
          <Stack direction="row" spacing={1} flexWrap="wrap">
            <Chip
              label={`Tone: ${tone}`}
              size="small"
              color="primary"
              variant="outlined"
            />
            <Chip
              label={`${totalWordCount} words`}
              size="small"
              color="success"
              variant="outlined"
            />
            {companyResearch?.companyName && (
              <Chip
                label={`Company: ${companyResearch.companyName}`}
                size="small"
                variant="outlined"
              />
            )}
          </Stack>
        </Box>

        <Divider />

        {/* Opening Section */}
        <Box>
          <Typography
            variant="subtitle2"
            fontWeight={600}
            color="primary"
            sx={{ mb: 1 }}
          >
            Opening Paragraph
          </Typography>
          <Paper variant="outlined" sx={{ p: 2, bgcolor: "grey.50" }}>
            <Typography
              variant="body2"
              sx={{ whiteSpace: "pre-wrap", lineHeight: 1.6 }}
            >
              {opening}
            </Typography>
          </Paper>
        </Box>

        {/* Body Paragraphs */}
        <Box>
          <Typography
            variant="subtitle2"
            fontWeight={600}
            color="primary"
            sx={{ mb: 1 }}
          >
            Body Paragraphs ({body.length})
          </Typography>
          <Stack spacing={2}>
            {body.map((paragraph, idx) => (
              <Paper
                key={idx}
                variant="outlined"
                sx={{ p: 2, bgcolor: "grey.50" }}
              >
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ mb: 0.5, display: "block" }}
                >
                  Paragraph {idx + 1}
                </Typography>
                <Typography
                  variant="body2"
                  sx={{ whiteSpace: "pre-wrap", lineHeight: 1.6 }}
                >
                  {paragraph}
                </Typography>
              </Paper>
            ))}
          </Stack>
        </Box>

        {/* Closing Section */}
        <Box>
          <Typography
            variant="subtitle2"
            fontWeight={600}
            color="primary"
            sx={{ mb: 1 }}
          >
            Closing Paragraph
          </Typography>
          <Paper variant="outlined" sx={{ p: 2, bgcolor: "grey.50" }}>
            <Typography
              variant="body2"
              sx={{ whiteSpace: "pre-wrap", lineHeight: 1.6 }}
            >
              {closing}
            </Typography>
          </Paper>
        </Box>

        <Divider />

        {/* Action Buttons */}
        <Stack spacing={2}>
          <Alert severity="info" icon={<CheckCircleIcon />}>
            <Typography variant="body2">
              Review the AI-generated content above. Click{" "}
              <strong>Apply to Draft</strong> to insert this content into your
              active cover letter.
            </Typography>
          </Alert>

          <Button
            variant="contained"
            fullWidth
            startIcon={<CheckCircleIcon />}
            onClick={onApply}
            disabled={isRegenerating}
            size="large"
          >
            Apply to Draft
          </Button>

          <Stack direction="row" spacing={2}>
            <Button
              variant="outlined"
              fullWidth
              startIcon={
                isRegenerating ? (
                  <CircularProgress size={16} />
                ) : (
                  <RefreshIcon />
                )
              }
              onClick={onRegenerate}
              disabled={isRegenerating}
            >
              {isRegenerating ? "Regenerating..." : "Regenerate"}
            </Button>
            <Button
              variant="outlined"
              fullWidth
              startIcon={<CloseIcon />}
              onClick={onDismiss}
              disabled={isRegenerating}
              color="error"
            >
              Dismiss
            </Button>
          </Stack>
        </Stack>
      </Stack>
    </Paper>
  );
}
