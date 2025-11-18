/**
 * MatchAnalysisPanel Component
 *
 * Displays comprehensive job match analysis within JobDetails drawer.
 * Shows overall score, category breakdown, skills gaps, strengths, and AI recommendations.
 *
 * Inputs: userId (UUID), jobId (number)
 * Outputs: Visual panel with match data or loading/error states
 *
 * Integration: Used in JobDetails component after job information section.
 */

import {
  Box,
  Stack,
  Typography,
  Divider,
  Chip,
  LinearProgress,
  Button,
  Alert,
  Collapse,
} from "@mui/material";
import { useState } from "react";
import {
  TrendingUp as StrengthIcon,
  TrendingDown as GapIcon,
  Lightbulb as RecommendationIcon,
  Psychology as ReasoningIcon,
  Refresh as RefreshIcon,
} from "@mui/icons-material";
import MatchScoreBadge from "../MatchScoreBadge/MatchScoreBadge";
import { useJobMatch } from "@job_pipeline/hooks/useJobMatch";
import { MatchAnalysisSkeleton } from "@shared/components/feedback";

interface Props {
  userId: string | undefined;
  jobId: number | null;
}

/**
 * Category progress bar with label and percentage.
 */
function CategoryScore({ label, score }: { label: string; score: number }) {
  const getColor = (s: number) => {
    if (s >= 70) return "success";
    if (s >= 40) return "warning";
    return "error";
  };

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
        <Typography variant="caption" color="text.secondary">
          {label}
        </Typography>
        <Typography variant="caption" sx={{ fontWeight: 600 }}>
          {score}%
        </Typography>
      </Stack>
      <LinearProgress
        variant="determinate"
        value={score}
        color={getColor(score)}
        sx={{ height: 6, borderRadius: 1 }}
      />
    </Box>
  );
}

export default function MatchAnalysisPanel({ userId, jobId }: Props) {
  const { data, loading, error, refetch } = useJobMatch(userId, jobId);
  const [showReasoning, setShowReasoning] = useState(false);

  // Don't render if no userId or jobId provided
  if (!userId || !jobId) {
    return null;
  }

  // Loading state with skeleton
  if (loading && !data) {
    return <MatchAnalysisSkeleton />;
  }

  // Error state with retry option
  if (error) {
    return (
      <Box sx={{ py: 2 }}>
        <Typography variant="subtitle1" sx={{ mb: 1 }}>
          Match Analysis
        </Typography>
        <Alert
          severity="error"
          action={
            <Button size="small" onClick={refetch} startIcon={<RefreshIcon />}>
              Retry
            </Button>
          }
        >
          {error}
        </Alert>
      </Box>
    );
  }

  // No data state (shouldn't happen if loading/error handled correctly)
  if (!data) {
    return (
      <Box sx={{ py: 2 }}>
        <Typography variant="subtitle1" sx={{ mb: 1 }}>
          Match Analysis
        </Typography>
        <Button variant="outlined" size="small" onClick={refetch}>
          Calculate Match Score
        </Button>
      </Box>
    );
  }

  const {
    matchScore,
    breakdown,
    skillsGaps,
    strengths,
    recommendations,
    reasoning,
    meta,
  } = data;

  return (
    <Box sx={{ py: 2 }} role="region" aria-label="Job Match Analysis">
      <Stack spacing={2}>
        {/* Header with overall score */}
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
        >
          <Typography variant="subtitle1" id="match-analysis-title">
            Match Analysis
          </Typography>
          <Stack direction="row" spacing={1} alignItems="center">
            <Button
              size="small"
              variant="text"
              onClick={() => refetch()}
              startIcon={<RefreshIcon />}
              disabled={loading}
              sx={{ minWidth: "auto", px: 1 }}
              aria-label="Regenerate match analysis with latest profile data"
            >
              {loading ? "Updating..." : "Refresh"}
            </Button>
            {meta.cached && (
              <Chip
                label="Cached"
                size="small"
                variant="outlined"
                aria-label="Using cached match result"
              />
            )}
            <MatchScoreBadge
              score={matchScore}
              breakdown={breakdown}
              size="large"
            />
          </Stack>
        </Stack>

        <Divider />

        {/* Category breakdown with progress bars */}
        <Box role="group" aria-labelledby="category-breakdown-label">
          <Typography
            variant="caption"
            sx={{ fontWeight: 600, mb: 1, display: "block" }}
            id="category-breakdown-label"
          >
            Category Breakdown
          </Typography>
          <Stack spacing={1.5}>
            <CategoryScore label="Skills Match" score={breakdown.skills} />
            <CategoryScore
              label="Experience Relevance"
              score={breakdown.experience}
            />
            <CategoryScore
              label="Education Alignment"
              score={breakdown.education}
            />
            <CategoryScore label="Cultural Fit" score={breakdown.culturalFit} />
          </Stack>
        </Box>

        <Divider />

        {/* Skills gaps (areas to improve) */}
        {skillsGaps.length > 0 && (
          <Box role="group" aria-labelledby="skills-gaps-label">
            <Stack
              direction="row"
              alignItems="center"
              spacing={0.5}
              sx={{ mb: 1 }}
            >
              <GapIcon fontSize="small" color="warning" aria-hidden="true" />
              <Typography
                variant="caption"
                sx={{ fontWeight: 600 }}
                id="skills-gaps-label"
              >
                Skills to Develop
              </Typography>
            </Stack>
            <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
              {skillsGaps.map((gap, idx) => (
                <Chip
                  key={idx}
                  label={gap}
                  size="small"
                  color="warning"
                  variant="outlined"
                  aria-label={`Skill gap: ${gap}`}
                />
              ))}
            </Stack>
          </Box>
        )}

        {/* Strengths (areas where user excels) */}
        {strengths.length > 0 && (
          <Box role="group" aria-labelledby="strengths-label">
            <Stack
              direction="row"
              alignItems="center"
              spacing={0.5}
              sx={{ mb: 1 }}
            >
              <StrengthIcon
                fontSize="small"
                color="success"
                aria-hidden="true"
              />
              <Typography
                variant="caption"
                sx={{ fontWeight: 600 }}
                id="strengths-label"
              >
                Your Strengths
              </Typography>
            </Stack>
            <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
              {strengths.map((strength, idx) => (
                <Chip
                  key={idx}
                  label={strength}
                  size="small"
                  color="success"
                  variant="outlined"
                  aria-label={`Strength: ${strength}`}
                />
              ))}
            </Stack>
          </Box>
        )}

        {/* Recommendations (actionable steps) */}
        {recommendations.length > 0 && (
          <Box role="group" aria-labelledby="recommendations-label">
            <Stack
              direction="row"
              alignItems="center"
              spacing={0.5}
              sx={{ mb: 1 }}
            >
              <RecommendationIcon
                fontSize="small"
                color="info"
                aria-hidden="true"
              />
              <Typography
                variant="caption"
                sx={{ fontWeight: 600 }}
                id="recommendations-label"
              >
                Recommendations
              </Typography>
            </Stack>
            <Stack
              spacing={0.5}
              component="ol"
              sx={{ listStyle: "none", pl: 0, m: 0 }}
            >
              {recommendations.map((rec, idx) => (
                <Box
                  key={idx}
                  component="li"
                  sx={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 1,
                  }}
                >
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ minWidth: 20 }}
                    aria-hidden="true"
                  >
                    {idx + 1}.
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {rec}
                  </Typography>
                </Box>
              ))}
            </Stack>
          </Box>
        )}

        <Divider />

        {/* AI reasoning (collapsible) */}
        <Box>
          <Button
            size="small"
            startIcon={<ReasoningIcon />}
            onClick={() => setShowReasoning(!showReasoning)}
            sx={{ mb: 1 }}
            aria-expanded={showReasoning}
            aria-controls="ai-reasoning-content"
          >
            {showReasoning ? "Hide" : "Show"} AI Reasoning
          </Button>
          <Collapse in={showReasoning}>
            <Typography
              variant="body2"
              color="text.secondary"
              id="ai-reasoning-content"
              sx={{
                p: 1.5,
                bgcolor: (theme) => theme.palette.grey[100],
                borderRadius: 1,
                fontStyle: "italic",
              }}
              role="article"
              aria-label="AI analysis reasoning"
            >
              {reasoning}
            </Typography>
          </Collapse>
        </Box>

        {/* Refresh button and metadata */}
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
        >
          <Typography
            variant="caption"
            color="text.secondary"
            aria-live="polite"
          >
            {meta.cached
              ? "Cached result"
              : `Generated in ${meta.latency_ms}ms`}
          </Typography>
          <Button
            size="small"
            onClick={refetch}
            startIcon={<RefreshIcon />}
            disabled={loading}
            aria-label="Recalculate match score"
          >
            Recalculate
          </Button>
        </Stack>
      </Stack>
    </Box>
  );
}
