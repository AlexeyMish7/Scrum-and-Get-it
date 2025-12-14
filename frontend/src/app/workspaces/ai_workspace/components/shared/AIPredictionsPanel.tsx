/**
 * AIPredictionsPanel - Shared AI Predictions Component
 *
 * Professional, card-based rendering of AI predictions with:
 * - Compact metric cards (responsive grid)
 * - Clear visual hierarchy
 * - Collapsible scenario planning
 * - Top 2 recommendations only
 * - Confidence mapped to Low/Medium/High
 *
 * Used in: Generation Hub, Dashboard
 */

import { useState } from "react";
import {
  Box,
  Typography,
  Stack,
  Grid,
  Card,
  CardContent,
  Chip,
  Button,
  Collapse,
} from "@mui/material";
import {
  ExpandMore as ExpandIcon,
  ExpandLess as CollapseIcon,
} from "@mui/icons-material";
import { useAIGlossyStyles } from "@shared/theme";
import type { Prediction } from "../../hooks/useJobPredictions";

interface AIPredictionsPanelProps {
  /** Array of predictions to display */
  predictions: Prediction[];
  /** Loading state */
  isLoading?: boolean;
  /** Error message */
  error?: string | null;
}

/**
 * Map confidence percentage to human-readable label
 */
function confidenceLabel(confidence?: number): {
  label: string;
  color: "error" | "warning" | "success";
} {
  if (confidence === undefined || confidence === null) {
    return { label: "Unknown", color: "warning" };
  }
  if (confidence >= 0.7) {
    return { label: "High", color: "success" };
  }
  if (confidence >= 0.4) {
    return { label: "Medium", color: "warning" };
  }
  return { label: "Low", color: "error" };
}

/**
 * Format the primary metric value based on prediction kind
 */
function formatValue(
  kind: string,
  score?: number | Record<string, number>
): string {
  if (score === undefined || score === null) return "N/A";

  // Handle object scores (e.g., multi-class predictions)
  if (typeof score === "object") {
    const entries = Object.entries(score);
    if (entries.length === 0) return "N/A";
    // Show the highest scoring category
    const [maxKey, maxVal] = entries.reduce((a, b) => (b[1] > a[1] ? b : a));
    return `${maxKey}: ${(maxVal * 100).toFixed(0)}%`;
  }

  // Probability metrics (0-1 range) → percentage
  if (kind.toLowerCase().includes("probability")) {
    return `${(score * 100).toFixed(0)}%`;
  }

  // Week-based timeline metric
  if (kind.toLowerCase().includes("weeks")) {
    return `${score.toFixed(0)} weeks`;
  }

  // Time-based metrics
  if (
    kind.toLowerCase().includes("time") ||
    kind.toLowerCase().includes("duration") ||
    kind.toLowerCase().includes("timeline")
  ) {
    if (score < 1) return `${(score * 52).toFixed(0)} weeks`;
    if (score < 12) return `${score.toFixed(1)} months`;
    return `${score.toFixed(0)} months`;
  }

  // Count metrics
  if (
    kind.toLowerCase().includes("interview") &&
    !kind.toLowerCase().includes("probability")
  ) {
    return `${score.toFixed(0)} interviews`;
  }

  // Default: show as percentage if 0-1, otherwise raw number
  if (score >= 0 && score <= 1) {
    return `${(score * 100).toFixed(0)}%`;
  }

  return score.toFixed(1);
}

/**
 * Get a human-friendly metric title from prediction kind
 */
function getMetricTitle(kind: string): string {
  return kind
    .replace(/_/g, " ")
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

/**
 * MetricCard - Individual prediction card
 */
interface MetricCardProps {
  prediction: Prediction;
}

function MetricCard({ prediction }: MetricCardProps) {
  const aiStyles = useAIGlossyStyles();
  const [showScenarios, setShowScenarios] = useState(false);
  const { label: confLabel, color: confColor } = confidenceLabel(
    prediction.confidence
  );
  const hasScenarios =
    prediction.scenarioAnalysis &&
    Object.keys(prediction.scenarioAnalysis).length > 0;
  const topRecommendations = prediction.recommendations?.slice(0, 2) ?? [];
  const hasMoreRecommendations = (prediction.recommendations?.length ?? 0) > 2;

  return (
    <Card
      elevation={0}
      sx={{
        height: "100%",
        ...aiStyles.background,
        ...aiStyles.accent,
        transition: "all 0.2s",
        position: "relative",
        overflow: "hidden",
        "&:hover": {
          borderWidth: 2,
          boxShadow: (theme) =>
            theme.palette.mode === "dark"
              ? "0 4px 16px rgba(0, 0, 0, 0.3)"
              : "0 4px 16px rgba(0, 0, 0, 0.08)",
        },
      }}
    >
      <CardContent sx={{ p: 3 }}>
        {/* Metric Title - Uses AI glossy text gradient */}
        <Typography
          variant="h6"
          sx={{
            ...aiStyles.text,
            mb: 1,
            fontSize: "1rem",
          }}
        >
          {getMetricTitle(prediction.kind)}
        </Typography>

        {/* Primary Value - Big and Bold with glossy effect */}
        <Typography
          variant="h3"
          sx={{
            ...aiStyles.text,
            fontWeight: 800,
            mb: 1.5,
            fontSize: "2.5rem",
            lineHeight: 1,
          }}
        >
          {formatValue(prediction.kind, prediction.score)}
        </Typography>

        {/* Confidence Badge - Subtle */}
        <Box sx={{ mb: 2 }}>
          <Chip
            label={`${confLabel} Confidence`}
            size="small"
            color={confColor}
            sx={{
              fontSize: "0.6875rem",
              fontWeight: 600,
              opacity: 0.85,
            }}
          />
        </Box>

        {/* Top 2 Recommendations */}
        {topRecommendations.length > 0 && (
          <Box sx={{ mb: hasScenarios ? 2 : 0 }}>
            <Typography
              variant="caption"
              sx={{
                fontWeight: 600,
                color: "text.secondary",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                fontSize: "0.6875rem",
                mb: 1,
                display: "block",
              }}
            >
              Top Actions
            </Typography>
            <Stack spacing={0.75}>
              {topRecommendations.map((rec, idx) => (
                <Typography
                  key={idx}
                  variant="body2"
                  sx={{
                    fontSize: "0.875rem",
                    color: "text.primary",
                    pl: 1.5,
                    position: "relative",
                    "&::before": {
                      content: '"•"',
                      position: "absolute",
                      left: 0,
                      color: "primary.main",
                      fontWeight: 700,
                    },
                  }}
                >
                  {rec}
                </Typography>
              ))}
              {hasMoreRecommendations && (
                <Typography
                  variant="caption"
                  sx={{
                    color: "primary.main",
                    fontSize: "0.75rem",
                    fontStyle: "italic",
                    pl: 1.5,
                  }}
                >
                  + {(prediction.recommendations?.length ?? 0) - 2} more
                </Typography>
              )}
            </Stack>
          </Box>
        )}

        {/* Scenario Planning - Collapsible */}
        {hasScenarios && (
          <Box sx={{ mt: 2, pt: 2, borderTop: 1, borderColor: "divider" }}>
            <Button
              size="small"
              onClick={() => setShowScenarios(!showScenarios)}
              endIcon={showScenarios ? <CollapseIcon /> : <ExpandIcon />}
              sx={{
                fontSize: "0.75rem",
                fontWeight: 600,
                textTransform: "none",
                p: 0,
                minWidth: "auto",
                color: "text.secondary",
                "&:hover": {
                  backgroundColor: "transparent",
                  color: "primary.main",
                },
              }}
            >
              {showScenarios ? "Hide" : "Show"} scenarios
            </Button>

            <Collapse in={showScenarios}>
              <Stack spacing={0.75} sx={{ mt: 1.5 }}>
                {Object.entries(prediction.scenarioAnalysis!).map(
                  ([scenario, outcome]) => (
                    <Box
                      key={scenario}
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        p: 1,
                        borderRadius: 1,
                        backgroundColor: "action.hover",
                      }}
                    >
                      <Typography
                        variant="caption"
                        sx={{
                          fontSize: "0.75rem",
                          color: "text.primary",
                          fontWeight: 500,
                        }}
                      >
                        {scenario.replace(/_/g, " ")}
                      </Typography>
                      <Typography
                        variant="caption"
                        sx={{
                          fontSize: "0.75rem",
                          color: "primary.main",
                          fontWeight: 700,
                        }}
                      >
                        {typeof outcome === "number"
                          ? `${(outcome * 100).toFixed(0)}%`
                          : outcome}
                      </Typography>
                    </Box>
                  )
                )}
              </Stack>
            </Collapse>
          </Box>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * AIPredictionsPanel - Main Component
 *
 * Renders predictions as a responsive grid of metric cards.
 */
export default function AIPredictionsPanel({
  predictions,
  isLoading = false,
  error = null,
}: AIPredictionsPanelProps) {
  // Loading state
  if (isLoading) {
    return (
      <Box sx={{ p: 4, textAlign: "center" }}>
        <Typography
          variant="body1"
          sx={{
            color: "text.primary",
            fontSize: "1rem",
          }}
        >
          Loading predictions...
        </Typography>
      </Box>
    );
  }

  // Error state - show a helpful message instead of hiding the error
  if (error) {
    return (
      <Box
        sx={{
          p: 4,
          textAlign: "center",
          backgroundColor: "action.hover",
          borderRadius: 2,
          border: 1,
          borderColor: "warning.main",
        }}
      >
        <Typography
          variant="h6"
          sx={{
            color: "warning.main",
            fontWeight: 600,
            mb: 1,
          }}
        >
          Predictions Currently Unavailable
        </Typography>
        <Typography
          variant="body2"
          sx={{
            color: "text.primary",
            mb: 2,
          }}
        >
          We're having trouble generating predictions right now. This could be
          due to:
        </Typography>
        <Box
          component="ul"
          sx={{
            textAlign: "left",
            maxWidth: 500,
            mx: "auto",
            color: "text.secondary",
            fontSize: "0.875rem",
          }}
        >
          <li>AI service temporarily unavailable</li>
          <li>Insufficient job data in your pipeline</li>
          <li>Network connectivity issues</li>
        </Box>
        <Typography
          variant="caption"
          sx={{
            color: "text.disabled",
            display: "block",
            mt: 2,
            fontStyle: "italic",
          }}
        >
          Try refreshing the page or adding more jobs to your pipeline.
        </Typography>
      </Box>
    );
  }

  // Empty state
  if (!predictions || predictions.length === 0) {
    return (
      <Box
        sx={{
          p: 4,
          textAlign: "center",
          backgroundColor: "action.hover",
          borderRadius: 2,
        }}
      >
        <Typography
          variant="body1"
          sx={{
            color: "text.primary",
            mb: 1,
            fontWeight: 500,
          }}
        >
          No Predictions Yet
        </Typography>
        <Typography
          variant="body2"
          sx={{
            color: "text.secondary",
          }}
        >
          Add jobs to your pipeline to see AI-powered insights about your job
          search.
        </Typography>
      </Box>
    );
  }

  // Render metric cards in responsive grid
  return (
    <Grid container spacing={3}>
      {predictions.map((prediction, index) => (
        <Grid size={{ xs: 12, sm: 6, md: 4 }} key={prediction.id ?? index}>
          <MetricCard prediction={prediction} />
        </Grid>
      ))}
    </Grid>
  );
}
