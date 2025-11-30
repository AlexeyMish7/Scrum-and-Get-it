/**
 * PROGRESS REPORT CARD COMPONENT (UC-111)
 *
 * Purpose:
 * - Display a summary of user's job search progress
 * - Show key metrics: applications, interviews, goals completed
 * - Include trend indicators (up/down arrows for week-over-week changes)
 * - Highlight recent achievements and milestones
 *
 * Used by:
 * - CandidateProgressPage for self-view
 * - MentorDashboard for viewing mentee progress
 * - TeamProgressOverview for team summaries
 */

import { useState, useEffect } from "react";
import {
  Box,
  Stack,
  Typography,
  Paper,
  Grid,
  Chip,
  Skeleton,
  Tooltip,
  LinearProgress,
  Divider,
  Avatar,
  IconButton,
} from "@mui/material";
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  TrendingFlat as TrendingFlatIcon,
  Work as WorkIcon,
  Event as EventIcon,
  CheckCircle as CheckCircleIcon,
  EmojiEvents as EmojiEventsIcon,
  Refresh as RefreshIcon,
  Schedule as ScheduleIcon,
  Assessment as AssessmentIcon,
} from "@mui/icons-material";
import * as progressService from "../services/progressSharingService";
import type { ProgressSnapshot } from "../services/progressSharingService";

// ============================================================================
// TYPES
// ============================================================================

interface ProgressReportCardProps {
  // If userId is provided, show that user's progress (for mentors viewing mentees)
  // If not provided, show the current user's progress
  userId?: string;
  teamId?: string;
  // Optional snapshot data (if already loaded by parent)
  snapshot?: ProgressSnapshot | null;
  // Compact mode for dashboard tiles
  compact?: boolean;
  // Show profile info at top of card
  showProfile?: boolean;
  // Profile info for displaying user name/avatar
  profileInfo?: {
    firstName: string;
    lastName: string;
    avatarUrl?: string;
  };
  // Callback when card is refreshed
  onRefresh?: () => void;
}

// Metric item for displaying individual stats
interface MetricItem {
  label: string;
  value: number;
  trend?: number;
  icon: React.ReactNode;
  color: string;
  suffix?: string;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get trend icon based on trend value
 */
function getTrendIcon(trend: number) {
  if (trend > 0) {
    return <TrendingUpIcon sx={{ fontSize: 16, color: "success.main" }} />;
  } else if (trend < 0) {
    return <TrendingDownIcon sx={{ fontSize: 16, color: "error.main" }} />;
  }
  return <TrendingFlatIcon sx={{ fontSize: 16, color: "text.secondary" }} />;
}

/**
 * Format relative time (e.g., "2 days ago")
 */
function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 14) return "Last week";
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  return `${Math.floor(diffDays / 30)} months ago`;
}

// ============================================================================
// METRIC CARD SUBCOMPONENT
// ============================================================================

function MetricCard({
  metric,
  compact,
}: {
  metric: MetricItem;
  compact: boolean;
}) {
  return (
    <Paper
      variant="outlined"
      sx={{
        p: compact ? 1.5 : 2,
        height: "100%",
        display: "flex",
        flexDirection: "column",
        transition: "all 0.2s ease",
        "&:hover": {
          borderColor: metric.color,
          boxShadow: 1,
        },
      }}
    >
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
        <Box sx={{ color: metric.color }}>{metric.icon}</Box>
        <Typography variant="caption" color="text.secondary" noWrap>
          {metric.label}
        </Typography>
      </Stack>

      <Stack direction="row" alignItems="baseline" spacing={1}>
        <Typography
          variant={compact ? "h5" : "h4"}
          fontWeight="bold"
          sx={{ color: metric.color }}
        >
          {metric.value}
        </Typography>
        {metric.suffix && (
          <Typography variant="caption" color="text.secondary">
            {metric.suffix}
          </Typography>
        )}
      </Stack>

      {/* Trend indicator */}
      {metric.trend !== undefined && metric.trend !== 0 && (
        <Stack
          direction="row"
          alignItems="center"
          spacing={0.5}
          sx={{ mt: 0.5 }}
        >
          {getTrendIcon(metric.trend)}
          <Typography
            variant="caption"
            sx={{
              color:
                metric.trend > 0
                  ? "success.main"
                  : metric.trend < 0
                  ? "error.main"
                  : "text.secondary",
            }}
          >
            {metric.trend > 0 ? "+" : ""}
            {Math.round(metric.trend)}% from last period
          </Typography>
        </Stack>
      )}
    </Paper>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function ProgressReportCard({
  userId,
  teamId,
  snapshot: providedSnapshot,
  compact = false,
  showProfile = false,
  profileInfo,
  onRefresh,
}: ProgressReportCardProps) {
  // State
  const [snapshot, setSnapshot] = useState<ProgressSnapshot | null>(
    providedSnapshot || null
  );
  const [loading, setLoading] = useState(!providedSnapshot);
  const [error, setError] = useState<string | null>(null);

  // Load snapshot if not provided - fetch latest from snapshots list
  useEffect(() => {
    async function loadSnapshot() {
      if (providedSnapshot || !userId || !teamId) return;

      setLoading(true);
      setError(null);

      // Get the most recent snapshot by fetching list with limit 1
      const result = await progressService.getProgressSnapshots(
        userId,
        teamId,
        { limit: 1 }
      );

      if (result.error) {
        setError(result.error.message);
      } else if (result.data && result.data.length > 0) {
        setSnapshot(result.data[0]);
      }

      setLoading(false);
    }

    loadSnapshot();
  }, [userId, teamId, providedSnapshot]);

  // Update local state when provided snapshot changes
  useEffect(() => {
    if (providedSnapshot) {
      setSnapshot(providedSnapshot);
    }
  }, [providedSnapshot]);

  // Handle refresh
  const handleRefresh = async () => {
    if (!userId || !teamId) return;

    setLoading(true);
    setError(null);

    const result = await progressService.getProgressSnapshots(userId, teamId, {
      limit: 1,
    });

    if (result.error) {
      setError(result.error.message);
    } else if (result.data && result.data.length > 0) {
      setSnapshot(result.data[0]);
    }

    setLoading(false);
    onRefresh?.();
  };

  // Build metrics from snapshot data using correct ProgressSnapshot fields
  const metrics: MetricItem[] = snapshot
    ? [
        {
          label: "Applications",
          value: snapshot.applicationsTotal,
          trend: snapshot.applicationsTrend,
          icon: <WorkIcon sx={{ fontSize: 20 }} />,
          color: "#1976d2", // Primary blue
          suffix: "total",
        },
        {
          label: "Interviews",
          value: snapshot.interviewsCompleted,
          trend: snapshot.interviewsTrend,
          icon: <EventIcon sx={{ fontSize: 20 }} />,
          color: "#9c27b0", // Purple
          suffix: "completed",
        },
        {
          label: "Goals Completed",
          value: snapshot.goalsCompleted,
          icon: <CheckCircleIcon sx={{ fontSize: 20 }} />,
          color: "#2e7d32", // Green
        },
        {
          label: "Offers",
          value: snapshot.offersReceived,
          icon: <EmojiEventsIcon sx={{ fontSize: 20 }} />,
          color: "#ed6c02", // Orange
        },
      ]
    : [];

  // Calculate overall progress percentage (based on goals)
  const goalProgress =
    snapshot?.goalsTotal && snapshot.goalsTotal > 0
      ? Math.round((snapshot.goalsCompleted / snapshot.goalsTotal) * 100)
      : 0;

  // Render loading skeleton
  if (loading) {
    return (
      <Paper sx={{ p: compact ? 2 : 3 }}>
        <Stack spacing={2}>
          <Skeleton variant="text" width="60%" />
          <Grid container spacing={2}>
            {[1, 2, 3, 4].map((n) => (
              <Grid size={{ xs: 6, md: 3 }} key={n}>
                <Skeleton variant="rounded" height={100} />
              </Grid>
            ))}
          </Grid>
        </Stack>
      </Paper>
    );
  }

  // Render error state
  if (error) {
    return (
      <Paper sx={{ p: compact ? 2 : 3 }}>
        <Typography color="error" textAlign="center">
          {error}
        </Typography>
      </Paper>
    );
  }

  // Render empty state
  if (!snapshot) {
    return (
      <Paper sx={{ p: compact ? 2 : 3 }}>
        <Stack alignItems="center" spacing={2} sx={{ py: 4 }}>
          <AssessmentIcon sx={{ fontSize: 48, color: "text.disabled" }} />
          <Typography color="text.secondary" textAlign="center">
            No progress data available yet.
            <br />
            Start tracking your job search to see progress reports.
          </Typography>
        </Stack>
      </Paper>
    );
  }

  return (
    <Paper sx={{ p: compact ? 2 : 3 }}>
      <Stack spacing={compact ? 2 : 3}>
        {/* Header with profile info */}
        {showProfile && profileInfo && (
          <>
            <Stack direction="row" alignItems="center" spacing={2}>
              <Avatar
                src={profileInfo.avatarUrl}
                sx={{ width: 48, height: 48 }}
              >
                {profileInfo.firstName[0]}
                {profileInfo.lastName[0]}
              </Avatar>
              <Box sx={{ flex: 1 }}>
                <Typography variant="h6">
                  {profileInfo.firstName} {profileInfo.lastName}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Progress Report
                </Typography>
              </Box>
              {onRefresh && (
                <Tooltip title="Refresh">
                  <IconButton onClick={handleRefresh} size="small">
                    <RefreshIcon />
                  </IconButton>
                </Tooltip>
              )}
            </Stack>
            <Divider />
          </>
        )}

        {/* Header without profile */}
        {!showProfile && (
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
          >
            <Stack direction="row" alignItems="center" spacing={1}>
              <AssessmentIcon color="primary" />
              <Typography variant="h6">Progress Report</Typography>
            </Stack>
            <Stack direction="row" alignItems="center" spacing={1}>
              <Tooltip title="Last updated">
                <Chip
                  icon={<ScheduleIcon sx={{ fontSize: 16 }} />}
                  label={formatRelativeTime(snapshot.createdAt)}
                  size="small"
                  variant="outlined"
                />
              </Tooltip>
              {onRefresh && (
                <Tooltip title="Refresh">
                  <IconButton onClick={handleRefresh} size="small">
                    <RefreshIcon />
                  </IconButton>
                </Tooltip>
              )}
            </Stack>
          </Stack>
        )}

        {/* Overall goal progress */}
        {snapshot.goalsTotal > 0 && (
          <Box>
            <Stack
              direction="row"
              alignItems="center"
              justifyContent="space-between"
              sx={{ mb: 1 }}
            >
              <Typography variant="body2" color="text.secondary">
                Goals Progress
              </Typography>
              <Typography variant="body2" fontWeight="medium">
                {goalProgress}%
              </Typography>
            </Stack>
            <LinearProgress
              variant="determinate"
              value={goalProgress}
              sx={{
                height: 8,
                borderRadius: 4,
                backgroundColor: "grey.200",
                "& .MuiLinearProgress-bar": {
                  borderRadius: 4,
                  backgroundColor:
                    goalProgress >= 80
                      ? "success.main"
                      : goalProgress >= 50
                      ? "warning.main"
                      : "primary.main",
                },
              }}
            />
          </Box>
        )}

        {/* Metrics Grid */}
        <Grid container spacing={2}>
          {metrics.map((metric) => (
            <Grid size={{ xs: 6, md: compact ? 6 : 3 }} key={metric.label}>
              <MetricCard metric={metric} compact={compact} />
            </Grid>
          ))}
        </Grid>

        {/* Activity score and streak */}
        {(snapshot.activityScore > 0 || snapshot.streakDays > 0) && (
          <>
            <Divider />
            <Stack direction="row" spacing={2} justifyContent="center">
              {snapshot.activityScore > 0 && (
                <Chip
                  label={`Activity Score: ${snapshot.activityScore}`}
                  color={
                    snapshot.activityScore >= 70
                      ? "success"
                      : snapshot.activityScore >= 40
                      ? "warning"
                      : "default"
                  }
                  variant="outlined"
                />
              )}
              {snapshot.streakDays > 0 && (
                <Chip
                  icon={<EmojiEventsIcon sx={{ fontSize: 16 }} />}
                  label={`${snapshot.streakDays} day streak`}
                  color="warning"
                  variant="outlined"
                />
              )}
            </Stack>
          </>
        )}
      </Stack>
    </Paper>
  );
}

export default ProgressReportCard;
