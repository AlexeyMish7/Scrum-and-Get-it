/**
 * FeedbackSummaryReport (UC-110: Collaborative Document Review)
 *
 * Analytics component showing feedback implementation rates and patterns.
 * Displays statistics about review feedback and how it's been addressed.
 *
 * Features:
 * - Overall implementation rate
 * - Breakdown by comment type
 * - Feedback trends over time
 * - Top feedback categories
 */

import {
  Box,
  Stack,
  Typography,
  Paper,
  LinearProgress,
  Chip,
  Divider,
  Grid,
} from "@mui/material";
import {
  CheckCircle as ResolvedIcon,
  Comment as CommentIcon,
  Lightbulb as SuggestionIcon,
  ThumbUp as PraiseIcon,
  Help as QuestionIcon,
  TrendingUp as TrendIcon,
} from "@mui/icons-material";
import type {
  FeedbackSummary,
  CommentType,
} from "../../services/reviewService";

interface FeedbackSummaryReportProps {
  summary: FeedbackSummary | null;
  loading?: boolean;
  documentName?: string;
}

// Comment type display config
const COMMENT_TYPE_CONFIG: Record<
  CommentType,
  { icon: React.ReactNode; label: string; color: string }
> = {
  comment: {
    icon: <CommentIcon fontSize="small" />,
    label: "Comments",
    color: "#64748b",
  },
  suggestion: {
    icon: <SuggestionIcon fontSize="small" />,
    label: "Suggestions",
    color: "#f59e0b",
  },
  praise: {
    icon: <PraiseIcon fontSize="small" />,
    label: "Praise",
    color: "#22c55e",
  },
  change_request: {
    icon: <CommentIcon fontSize="small" />,
    label: "Change Requests",
    color: "#ef4444",
  },
  question: {
    icon: <QuestionIcon fontSize="small" />,
    label: "Questions",
    color: "#3b82f6",
  },
  approval: {
    icon: <ResolvedIcon fontSize="small" />,
    label: "Approvals",
    color: "#22c55e",
  },
  rejection: {
    icon: <CommentIcon fontSize="small" />,
    label: "Rejections",
    color: "#ef4444",
  },
};

// Get implementation rate color
function getImplementationColor(rate: number): "success" | "warning" | "error" {
  if (rate >= 80) return "success";
  if (rate >= 50) return "warning";
  return "error";
}

export function FeedbackSummaryReport({
  summary,
  loading = false,
  documentName,
}: FeedbackSummaryReportProps) {
  // Loading state
  if (loading) {
    return (
      <Paper sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom>
          Feedback Summary
        </Typography>
        <Box sx={{ width: "100%" }}>
          <LinearProgress />
        </Box>
      </Paper>
    );
  }

  // No data state
  if (!summary || summary.totalComments === 0) {
    return (
      <Paper sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom>
          Feedback Summary
        </Typography>
        <Box textAlign="center" py={3}>
          <CommentIcon sx={{ fontSize: 40, color: "text.disabled", mb: 1 }} />
          <Typography color="text.secondary">
            No feedback received yet
          </Typography>
        </Box>
      </Paper>
    );
  }

  const implementationColor = getImplementationColor(
    summary.implementationRate
  );

  return (
    <Paper sx={{ p: 2 }}>
      <Stack spacing={2}>
        <Box>
          <Typography variant="h6" gutterBottom>
            Feedback Summary
          </Typography>
          {documentName && (
            <Typography variant="body2" color="text.secondary">
              {documentName}
            </Typography>
          )}
        </Box>

        <Divider />

        {/* Overview stats */}
        <Grid container spacing={2}>
          <Grid size={{ xs: 6, md: 3 }}>
            <Box textAlign="center">
              <Typography variant="h4" color="primary">
                {summary.totalComments}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Comments
              </Typography>
            </Box>
          </Grid>
          <Grid size={{ xs: 6, md: 3 }}>
            <Box textAlign="center">
              <Typography variant="h4" color="success.main">
                {summary.resolvedCount}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Resolved
              </Typography>
            </Box>
          </Grid>
          <Grid size={{ xs: 6, md: 3 }}>
            <Box textAlign="center">
              <Typography variant="h4" color="warning.main">
                {summary.unresolvedCount}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Unresolved
              </Typography>
            </Box>
          </Grid>
          <Grid size={{ xs: 6, md: 3 }}>
            <Box textAlign="center">
              <Stack
                direction="row"
                spacing={0.5}
                justifyContent="center"
                alignItems="baseline"
              >
                <Typography variant="h4" color={`${implementationColor}.main`}>
                  {Math.round(summary.implementationRate)}%
                </Typography>
                <TrendIcon color={implementationColor} fontSize="small" />
              </Stack>
              <Typography variant="body2" color="text.secondary">
                Implementation Rate
              </Typography>
            </Box>
          </Grid>
        </Grid>

        {/* Implementation progress bar */}
        <Box>
          <Stack
            direction="row"
            justifyContent="space-between"
            sx={{ mb: 0.5 }}
          >
            <Typography variant="body2">Feedback Implementation</Typography>
            <Typography variant="body2" color={`${implementationColor}.main`}>
              {summary.resolvedCount} / {summary.totalComments}
            </Typography>
          </Stack>
          <LinearProgress
            variant="determinate"
            value={summary.implementationRate}
            color={implementationColor}
            sx={{ height: 8, borderRadius: 1 }}
          />
        </Box>

        <Divider />

        {/* Breakdown by comment type */}
        <Box>
          <Typography variant="subtitle2" gutterBottom>
            By Comment Type
          </Typography>
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            {Object.entries(summary.byType).map(([type, count]) => {
              const config = COMMENT_TYPE_CONFIG[type as CommentType];
              if (!config || count === 0) return null;

              return (
                <Chip
                  key={type}
                  icon={config.icon as React.ReactElement}
                  label={`${config.label}: ${count}`}
                  size="small"
                  sx={{
                    bgcolor: `${config.color}20`,
                    color: config.color,
                    "& .MuiChip-icon": { color: config.color },
                  }}
                />
              );
            })}
          </Stack>
        </Box>

        {/* Breakdown by section (if available) */}
        {summary.bySection && Object.keys(summary.bySection).length > 0 && (
          <Box>
            <Typography variant="subtitle2" gutterBottom>
              By Section
            </Typography>
            <Stack spacing={1}>
              {Object.entries(summary.bySection)
                .sort(([, a], [, b]) => (b as number) - (a as number))
                .slice(0, 5)
                .map(([section, count]) => (
                  <Stack
                    key={section}
                    direction="row"
                    justifyContent="space-between"
                    alignItems="center"
                  >
                    <Typography
                      variant="body2"
                      sx={{ textTransform: "capitalize" }}
                    >
                      {section.replace(/_/g, " ")}
                    </Typography>
                    <Chip label={count} size="small" variant="outlined" />
                  </Stack>
                ))}
            </Stack>
          </Box>
        )}

        {/* Improvement suggestion */}
        {summary.implementationRate < 80 && summary.unresolvedCount > 0 && (
          <Box
            sx={{
              bgcolor: "info.50",
              p: 1.5,
              borderRadius: 1,
              border: 1,
              borderColor: "info.200",
            }}
          >
            <Typography variant="body2" color="info.dark">
              💡 You have {summary.unresolvedCount} unresolved comments. Address
              these to improve your document and implementation rate.
            </Typography>
          </Box>
        )}

        {summary.implementationRate >= 80 && (
          <Box
            sx={{
              bgcolor: "success.50",
              p: 1.5,
              borderRadius: 1,
              border: 1,
              borderColor: "success.200",
            }}
          >
            <Typography variant="body2" color="success.dark">
              🎉 Great job! You've addressed most of the feedback on this
              document.
            </Typography>
          </Box>
        )}
      </Stack>
    </Paper>
  );
}

export default FeedbackSummaryReport;
