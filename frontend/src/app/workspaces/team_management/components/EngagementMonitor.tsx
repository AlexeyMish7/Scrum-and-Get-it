/**
 * ENGAGEMENT MONITOR COMPONENT (UC-109)
 *
 * Purpose:
 * - Track and display mentee engagement metrics
 * - Show login frequency and activity patterns
 * - Visualize application trends over time
 * - Alert mentors to engagement drops
 *
 * Used by:
 * - MentorDashboard Analytics tab
 * - Individual mentee detail views
 */

import {
  Box,
  Stack,
  Typography,
  Paper,
  Grid,
  LinearProgress,
  Chip,
  Avatar,
  Tooltip,
  Card,
  CardContent,
  Divider,
} from "@mui/material";
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  TrendingFlat as TrendingFlatIcon,
  AccessTime as TimeIcon,
  CalendarToday as CalendarIcon,
  Work as WorkIcon,
  Timer as ActiveIcon,
} from "@mui/icons-material";
import type { MenteeWithProgress } from "../services/mentorService";

// ============================================================================
// TYPES
// ============================================================================

interface EngagementMonitorProps {
  mentees: MenteeWithProgress[];
  showDetails?: boolean;
}

type EngagementTrend = "up" | "down" | "stable";
type EngagementLevel = "high" | "medium" | "low" | "inactive";

interface MenteeEngagementMetrics {
  candidateId: string;
  name: string;
  level: EngagementLevel;
  lastActive: string;
  applicationsThisWeek: number;
  applicationsLastWeek: number;
  trend: EngagementTrend;
  activityScore: number; // 0-100
}

// ============================================================================
// CONSTANTS
// ============================================================================

const ENGAGEMENT_LEVELS: Record<
  EngagementLevel,
  {
    color: "success" | "warning" | "error" | "default";
    label: string;
    description: string;
    icon: React.ReactNode;
  }
> = {
  high: {
    color: "success",
    label: "Active",
    description: "Regularly applying and updating materials",
    icon: <TrendingUpIcon />,
  },
  medium: {
    color: "warning",
    label: "Moderate",
    description: "Some activity but could be more consistent",
    icon: <TrendingFlatIcon />,
  },
  low: {
    color: "warning",
    label: "Low",
    description: "Limited activity - may need encouragement",
    icon: <TrendingDownIcon />,
  },
  inactive: {
    color: "error",
    label: "Inactive",
    description: "No recent activity - may need a check-in",
    icon: <TrendingDownIcon />,
  },
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Calculate engagement metrics for each mentee
 * In a real app, this would use actual activity data from the database
 */
function calculateEngagementMetrics(
  mentees: MenteeWithProgress[]
): MenteeEngagementMetrics[] {
  return mentees.map((mentee) => {
    // Simulate last active time based on engagement level
    const now = new Date();
    let lastActive: Date;
    switch (mentee.engagementLevel) {
      case "high":
        lastActive = new Date(
          now.getTime() - Math.random() * 24 * 60 * 60 * 1000
        ); // Within 24h
        break;
      case "medium":
        lastActive = new Date(
          now.getTime() - Math.random() * 3 * 24 * 60 * 60 * 1000
        ); // Within 3 days
        break;
      case "low":
        lastActive = new Date(
          now.getTime() - Math.random() * 7 * 24 * 60 * 60 * 1000
        ); // Within week
        break;
      default:
        lastActive = new Date(
          now.getTime() - (7 + Math.random() * 14) * 24 * 60 * 60 * 1000
        ); // 1-3 weeks ago
    }

    // Calculate activity score based on job stats
    const totalActivity =
      mentee.jobStats.total +
      mentee.jobStats.interviewing * 2 +
      mentee.jobStats.offers * 5;
    const activityScore = Math.min(100, totalActivity * 10);

    // Simulate weekly application counts
    const applicationsThisWeek =
      mentee.engagementLevel === "high"
        ? 3 + Math.floor(Math.random() * 5)
        : mentee.engagementLevel === "medium"
        ? 2 + Math.floor(Math.random() * 3)
        : mentee.engagementLevel === "low"
        ? 1 + Math.floor(Math.random() * 2)
        : 0;
    const applicationsLastWeek =
      mentee.engagementLevel === "high"
        ? 2 + Math.floor(Math.random() * 4)
        : mentee.engagementLevel === "medium"
        ? 1 + Math.floor(Math.random() * 3)
        : Math.floor(Math.random() * 2);

    // Determine trend
    let trend: EngagementTrend = "stable";
    if (applicationsThisWeek > applicationsLastWeek + 1) trend = "up";
    else if (applicationsThisWeek < applicationsLastWeek - 1) trend = "down";

    return {
      candidateId: mentee.candidate_id,
      name: mentee.candidate_name,
      level: mentee.engagementLevel,
      lastActive: lastActive.toISOString(),
      applicationsThisWeek,
      applicationsLastWeek,
      trend,
      activityScore,
    };
  });
}

function getRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffHours = Math.floor(
    (now.getTime() - date.getTime()) / (1000 * 60 * 60)
  );

  if (diffHours < 1) return "Just now";
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  return `${Math.floor(diffDays / 7)} weeks ago`;
}

function getTrendIcon(trend: EngagementTrend) {
  switch (trend) {
    case "up":
      return <TrendingUpIcon fontSize="small" color="success" />;
    case "down":
      return <TrendingDownIcon fontSize="small" color="error" />;
    default:
      return <TrendingFlatIcon fontSize="small" color="action" />;
  }
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function EngagementMonitor({
  mentees,
  showDetails = true,
}: EngagementMonitorProps) {
  const metrics = calculateEngagementMetrics(mentees);

  // Calculate summary stats
  const totalMentees = mentees.length;
  const activeCount = mentees.filter(
    (m) => m.engagementLevel === "high"
  ).length;
  const moderateCount = mentees.filter(
    (m) => m.engagementLevel === "medium" || m.engagementLevel === "low"
  ).length;
  const inactiveCount = mentees.filter(
    (m) => m.engagementLevel === "inactive"
  ).length;

  const averageActivityScore =
    totalMentees > 0
      ? Math.round(
          metrics.reduce((sum, m) => sum + m.activityScore, 0) / totalMentees
        )
      : 0;

  const totalApplicationsThisWeek = metrics.reduce(
    (sum, m) => sum + m.applicationsThisWeek,
    0
  );
  const totalApplicationsLastWeek = metrics.reduce(
    (sum, m) => sum + m.applicationsLastWeek,
    0
  );
  const weeklyTrend: EngagementTrend =
    totalApplicationsThisWeek > totalApplicationsLastWeek
      ? "up"
      : totalApplicationsThisWeek < totalApplicationsLastWeek
      ? "down"
      : "stable";

  // Sort by activity score (lowest first for intervention priority)
  const sortedMetrics = [...metrics].sort(
    (a, b) => a.activityScore - b.activityScore
  );

  return (
    <Paper sx={{ p: 3 }}>
      <Stack spacing={3}>
        {/* Header */}
        <Stack direction="row" alignItems="center" spacing={2}>
          <ActiveIcon color="primary" />
          <Box>
            <Typography variant="h6">Engagement Monitor</Typography>
            <Typography variant="body2" color="text.secondary">
              Track mentee activity and engagement levels
            </Typography>
          </Box>
        </Stack>

        {/* Summary Cards */}
        <Grid container spacing={2}>
          <Grid size={{ xs: 6, md: 3 }}>
            <Card variant="outlined">
              <CardContent sx={{ py: 2, "&:last-child": { pb: 2 } }}>
                <Stack alignItems="center" spacing={1}>
                  <Avatar sx={{ bgcolor: "primary.light" }}>
                    <WorkIcon fontSize="small" />
                  </Avatar>
                  <Typography variant="h5">
                    {totalApplicationsThisWeek}
                  </Typography>
                  <Stack direction="row" alignItems="center" spacing={0.5}>
                    {getTrendIcon(weeklyTrend)}
                    <Typography variant="caption" color="text.secondary">
                      Apps this week
                    </Typography>
                  </Stack>
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 6, md: 3 }}>
            <Card variant="outlined">
              <CardContent sx={{ py: 2, "&:last-child": { pb: 2 } }}>
                <Stack alignItems="center" spacing={1}>
                  <Avatar sx={{ bgcolor: "success.light" }}>
                    <TrendingUpIcon fontSize="small" />
                  </Avatar>
                  <Typography variant="h5">{averageActivityScore}%</Typography>
                  <Typography variant="caption" color="text.secondary">
                    Avg Activity Score
                  </Typography>
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 6, md: 3 }}>
            <Card variant="outlined">
              <CardContent sx={{ py: 2, "&:last-child": { pb: 2 } }}>
                <Stack alignItems="center" spacing={1}>
                  <Avatar sx={{ bgcolor: "warning.light" }}>
                    <CalendarIcon fontSize="small" />
                  </Avatar>
                  <Typography variant="h5">
                    {activeCount}/{totalMentees}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Active Mentees
                  </Typography>
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 6, md: 3 }}>
            <Card variant="outlined">
              <CardContent sx={{ py: 2, "&:last-child": { pb: 2 } }}>
                <Stack alignItems="center" spacing={1}>
                  <Avatar
                    sx={{
                      bgcolor: inactiveCount > 0 ? "error.light" : "grey.200",
                    }}
                  >
                    <TimeIcon fontSize="small" />
                  </Avatar>
                  <Typography
                    variant="h5"
                    color={inactiveCount > 0 ? "error.main" : "text.primary"}
                  >
                    {inactiveCount}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Need Follow-up
                  </Typography>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Engagement Distribution */}
        <Box>
          <Typography variant="subtitle2" color="text.secondary" mb={1}>
            Engagement Distribution
          </Typography>
          <Stack
            direction="row"
            spacing={0.5}
            sx={{ height: 8, borderRadius: 1, overflow: "hidden" }}
          >
            {activeCount > 0 && (
              <Tooltip title={`${activeCount} Active`}>
                <Box
                  sx={{
                    flex: activeCount,
                    bgcolor: "success.main",
                  }}
                />
              </Tooltip>
            )}
            {moderateCount > 0 && (
              <Tooltip title={`${moderateCount} Moderate`}>
                <Box
                  sx={{
                    flex: moderateCount,
                    bgcolor: "warning.main",
                  }}
                />
              </Tooltip>
            )}
            {inactiveCount > 0 && (
              <Tooltip title={`${inactiveCount} Inactive`}>
                <Box
                  sx={{
                    flex: inactiveCount,
                    bgcolor: "error.main",
                  }}
                />
              </Tooltip>
            )}
          </Stack>
          <Stack direction="row" justifyContent="space-between" mt={1}>
            <Stack direction="row" spacing={2}>
              <Stack direction="row" alignItems="center" spacing={0.5}>
                <Box
                  sx={{
                    width: 12,
                    height: 12,
                    borderRadius: 0.5,
                    bgcolor: "success.main",
                  }}
                />
                <Typography variant="caption">
                  Active ({activeCount})
                </Typography>
              </Stack>
              <Stack direction="row" alignItems="center" spacing={0.5}>
                <Box
                  sx={{
                    width: 12,
                    height: 12,
                    borderRadius: 0.5,
                    bgcolor: "warning.main",
                  }}
                />
                <Typography variant="caption">
                  Moderate ({moderateCount})
                </Typography>
              </Stack>
              <Stack direction="row" alignItems="center" spacing={0.5}>
                <Box
                  sx={{
                    width: 12,
                    height: 12,
                    borderRadius: 0.5,
                    bgcolor: "error.main",
                  }}
                />
                <Typography variant="caption">
                  Inactive ({inactiveCount})
                </Typography>
              </Stack>
            </Stack>
          </Stack>
        </Box>

        {/* Detailed Mentee List */}
        {showDetails && sortedMetrics.length > 0 && (
          <>
            <Divider />
            <Box>
              <Typography variant="subtitle2" color="text.secondary" mb={2}>
                Individual Engagement (Sorted by Priority)
              </Typography>
              <Stack spacing={2}>
                {sortedMetrics.map((metric) => {
                  const levelConfig = ENGAGEMENT_LEVELS[metric.level];

                  return (
                    <Card key={metric.candidateId} variant="outlined">
                      <CardContent
                        sx={{ py: 1.5, "&:last-child": { pb: 1.5 } }}
                      >
                        <Stack direction="row" alignItems="center" spacing={2}>
                          <Avatar sx={{ width: 36, height: 36 }}>
                            {metric.name.charAt(0)}
                          </Avatar>

                          <Box flex={1}>
                            <Stack
                              direction="row"
                              alignItems="center"
                              spacing={1}
                            >
                              <Typography variant="subtitle2">
                                {metric.name}
                              </Typography>
                              <Chip
                                size="small"
                                label={levelConfig.label}
                                color={levelConfig.color}
                                variant="outlined"
                                sx={{ height: 20, fontSize: "0.7rem" }}
                              />
                            </Stack>
                            <Stack
                              direction="row"
                              alignItems="center"
                              spacing={2}
                              mt={0.5}
                            >
                              <Typography
                                variant="caption"
                                color="text.secondary"
                              >
                                Last active:{" "}
                                {getRelativeTime(metric.lastActive)}
                              </Typography>
                              <Stack
                                direction="row"
                                alignItems="center"
                                spacing={0.5}
                              >
                                {getTrendIcon(metric.trend)}
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                >
                                  {metric.applicationsThisWeek} apps this week
                                </Typography>
                              </Stack>
                            </Stack>
                          </Box>

                          <Box sx={{ width: 100 }}>
                            <Stack
                              direction="row"
                              justifyContent="space-between"
                              mb={0.5}
                            >
                              <Typography
                                variant="caption"
                                color="text.secondary"
                              >
                                Activity
                              </Typography>
                              <Typography variant="caption" fontWeight="bold">
                                {metric.activityScore}%
                              </Typography>
                            </Stack>
                            <LinearProgress
                              variant="determinate"
                              value={metric.activityScore}
                              color={
                                metric.activityScore >= 70
                                  ? "success"
                                  : metric.activityScore >= 40
                                  ? "warning"
                                  : "error"
                              }
                              sx={{ height: 6, borderRadius: 1 }}
                            />
                          </Box>
                        </Stack>
                      </CardContent>
                    </Card>
                  );
                })}
              </Stack>
            </Box>
          </>
        )}

        {/* Empty State */}
        {mentees.length === 0 && (
          <Box textAlign="center" py={4}>
            <ActiveIcon sx={{ fontSize: 48, color: "text.disabled", mb: 1 }} />
            <Typography color="text.secondary">
              No mentees to monitor
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Engagement data will appear once you have assigned mentees.
            </Typography>
          </Box>
        )}
      </Stack>
    </Paper>
  );
}

export default EngagementMonitor;
