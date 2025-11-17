/**
 * MatchScoreBadge Component
 *
 * Displays a job match score (0-100) with color-coded styling and breakdown tooltip.
 * Color coding: Green (70-100 excellent), Yellow (40-69 fair), Red (0-39 poor).
 *
 * Used on job cards to show quick match assessment at a glance.
 */

import { Box, Tooltip, Typography, Stack } from "@mui/material";
import { useTheme, type Theme } from "@mui/material/styles";

interface MatchBreakdown {
  skills: number;
  experience: number;
  education: number;
  culturalFit: number;
}

interface Props {
  score: number; // 0-100
  breakdown?: MatchBreakdown;
  loading?: boolean;
  size?: "small" | "medium" | "large";
}

/**
 * Get color based on match score thresholds.
 * 70-100: Excellent (green)
 * 40-69: Fair (yellow/warning)
 * 0-39: Poor (red/error)
 */
function getScoreColor(score: number, theme: Theme): string {
  if (score >= 70) return String(theme.palette.success.main);
  if (score >= 40) return String(theme.palette.warning.main);
  return String(theme.palette.error.main);
}

/**
 * Get size-specific styling (px padding, font size).
 * Responsive: reduces size slightly on mobile devices.
 */
function getSizeStyles(size: "small" | "medium" | "large") {
  const baseStyles = {
    small: { px: 0.75, py: 0.25, fontSize: 11, fontWeight: 600 },
    medium: { px: 1.25, py: 0.5, fontSize: 13, fontWeight: 600 },
    large: { px: 2, py: 0.75, fontSize: 16, fontWeight: 700 },
  };

  return {
    ...baseStyles[size],
    // Responsive scaling for mobile
    "@media (max-width: 600px)": {
      px: baseStyles[size].px * 0.85,
      py: baseStyles[size].py * 0.85,
      fontSize: baseStyles[size].fontSize * 0.9,
    },
  };
}

export default function MatchScoreBadge({
  score,
  breakdown,
  loading = false,
  size = "medium",
}: Props) {
  const theme = useTheme();
  const color = getScoreColor(score, theme);
  const contrastText = theme.palette.getContrastText(color);
  const sizeStyles = getSizeStyles(size);

  if (loading) {
    return (
      <Box
        sx={{
          bgcolor: theme.palette.grey[300],
          color: theme.palette.text.secondary,
          ...sizeStyles,
          borderRadius: 1,
          display: "inline-flex",
          alignItems: "center",
          gap: 0.5,
        }}
      >
        <Typography
          sx={{
            fontSize: sizeStyles.fontSize,
            fontWeight: sizeStyles.fontWeight,
          }}
        >
          Calculating...
        </Typography>
      </Box>
    );
  }

  const badgeContent = (
    <Box
      sx={{
        bgcolor: color,
        color: contrastText,
        ...sizeStyles,
        borderRadius: 1,
        display: "inline-flex",
        alignItems: "center",
        gap: 0.5,
        boxShadow: 1,
        cursor: breakdown ? "help" : "default",
      }}
    >
      <Typography
        sx={{
          fontSize: sizeStyles.fontSize,
          fontWeight: sizeStyles.fontWeight,
        }}
      >
        {score}% Match
      </Typography>
    </Box>
  );

  // If breakdown data exists, wrap badge in tooltip showing category scores
  if (breakdown) {
    return (
      <Tooltip
        title={
          <Stack spacing={0.5} sx={{ py: 0.5 }}>
            <Typography variant="caption" sx={{ fontWeight: 600 }}>
              Match Breakdown
            </Typography>
            <Stack direction="row" justifyContent="space-between" spacing={2}>
              <Typography variant="caption">Skills:</Typography>
              <Typography variant="caption" sx={{ fontWeight: 600 }}>
                {breakdown.skills}%
              </Typography>
            </Stack>
            <Stack direction="row" justifyContent="space-between" spacing={2}>
              <Typography variant="caption">Experience:</Typography>
              <Typography variant="caption" sx={{ fontWeight: 600 }}>
                {breakdown.experience}%
              </Typography>
            </Stack>
            <Stack direction="row" justifyContent="space-between" spacing={2}>
              <Typography variant="caption">Education:</Typography>
              <Typography variant="caption" sx={{ fontWeight: 600 }}>
                {breakdown.education}%
              </Typography>
            </Stack>
            <Stack direction="row" justifyContent="space-between" spacing={2}>
              <Typography variant="caption">Cultural Fit:</Typography>
              <Typography variant="caption" sx={{ fontWeight: 600 }}>
                {breakdown.culturalFit}%
              </Typography>
            </Stack>
          </Stack>
        }
        arrow
        placement="top"
      >
        {badgeContent}
      </Tooltip>
    );
  }

  return badgeContent;
}
