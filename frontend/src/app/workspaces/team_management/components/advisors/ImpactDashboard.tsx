/**
 * UC-115: External Advisor and Coach Integration
 * Component for displaying advisor impact metrics and analytics
 */

import {
  Box,
  Card,
  CardContent,
  Typography,
  Stack,
  Chip,
  LinearProgress,
  Divider,
  Avatar,
} from "@mui/material";
import {
  TrendingUp as TrendingUpIcon,
  Schedule as ScheduleIcon,
  CheckCircle as CheckCircleIcon,
  Lightbulb as LightbulbIcon,
  Star as StarIcon,
} from "@mui/icons-material";

import type { AdvisorImpactMetrics } from "../../types/advisor.types";

interface ImpactDashboardProps {
  metrics: AdvisorImpactMetrics[];
  loading?: boolean;
}

interface MetricCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  subtitle?: string;
  color?: "primary" | "success" | "warning" | "info";
}

/**
 * Simple metric card for dashboard display
 */
function MetricCard({
  icon,
  label,
  value,
  subtitle,
  color = "primary",
}: MetricCardProps) {
  return (
    <Card variant="outlined">
      <CardContent>
        <Stack direction="row" spacing={2} alignItems="center">
          <Avatar
            sx={{
              bgcolor: `${color}.light`,
              color: `${color}.main`,
            }}
          >
            {icon}
          </Avatar>
          <Box>
            <Typography variant="h5" fontWeight="bold">
              {value}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {label}
            </Typography>
            {subtitle && (
              <Typography variant="caption" color="text.secondary">
                {subtitle}
              </Typography>
            )}
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
}

/**
 * Dashboard showing advisor impact metrics and effectiveness
 */
export function ImpactDashboard({
  metrics,
  loading = false,
}: ImpactDashboardProps) {
  // Calculate aggregate metrics from all advisors
  const totalSessions = metrics.reduce((sum, m) => sum + m.total_sessions, 0);
  const completedSessions = metrics.reduce(
    (sum, m) => sum + m.completed_sessions,
    0
  );
  const totalRecommendations = metrics.reduce(
    (sum, m) => sum + m.total_recommendations,
    0
  );
  const implementedRecommendations = metrics.reduce(
    (sum, m) => sum + m.implemented_recommendations,
    0
  );
  const totalHours = metrics.reduce((sum, m) => sum + m.total_hours, 0);

  // Calculate average rating (only from advisors with ratings)
  const advisorsWithRatings = metrics.filter(
    (m) => m.average_session_rating !== null
  );
  const averageRating =
    advisorsWithRatings.length > 0
      ? advisorsWithRatings.reduce(
          (sum, m) => sum + (m.average_session_rating ?? 0),
          0
        ) / advisorsWithRatings.length
      : null;

  // Implementation rate
  const implementationRate =
    totalRecommendations > 0
      ? Math.round((implementedRecommendations / totalRecommendations) * 100)
      : 0;

  // Session completion rate
  const sessionCompletionRate =
    totalSessions > 0
      ? Math.round((completedSessions / totalSessions) * 100)
      : 0;

  if (loading) {
    return (
      <Box textAlign="center" py={4}>
        <Typography color="text.secondary">
          Loading impact metrics...
        </Typography>
      </Box>
    );
  }

  if (metrics.length === 0) {
    return (
      <Box textAlign="center" py={4}>
        <TrendingUpIcon sx={{ fontSize: 64, color: "text.disabled", mb: 2 }} />
        <Typography variant="h6" gutterBottom>
          No Impact Data Yet
        </Typography>
        <Typography color="text.secondary">
          Complete coaching sessions and implement recommendations to track
          impact
        </Typography>
      </Box>
    );
  }

  return (
    <Stack spacing={3}>
      {/* Aggregate Metrics */}
      <Box>
        <Typography variant="h6" gutterBottom>
          Overall Impact
        </Typography>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: 2,
          }}
        >
          <MetricCard
            icon={<ScheduleIcon />}
            label="Coaching Hours"
            value={`${totalHours.toFixed(1)}h`}
            subtitle={`${completedSessions} sessions completed`}
            color="primary"
          />
          <MetricCard
            icon={<LightbulbIcon />}
            label="Recommendations"
            value={totalRecommendations}
            subtitle={`${implementedRecommendations} implemented`}
            color="warning"
          />
          <MetricCard
            icon={<CheckCircleIcon />}
            label="Implementation Rate"
            value={`${implementationRate}%`}
            color="success"
          />
          {averageRating && (
            <MetricCard
              icon={<StarIcon />}
              label="Average Rating"
              value={averageRating.toFixed(1)}
              subtitle="out of 5"
              color="info"
            />
          )}
        </Box>
      </Box>

      {/* Progress Bars */}
      <Card variant="outlined">
        <CardContent>
          <Typography variant="subtitle1" gutterBottom>
            Progress Overview
          </Typography>
          <Stack spacing={2}>
            <Box>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  mb: 0.5,
                }}
              >
                <Typography variant="body2">Session Completion</Typography>
                <Typography variant="body2" fontWeight="bold">
                  {sessionCompletionRate}%
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={sessionCompletionRate}
                color="primary"
              />
            </Box>
            <Box>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  mb: 0.5,
                }}
              >
                <Typography variant="body2">
                  Recommendation Implementation
                </Typography>
                <Typography variant="body2" fontWeight="bold">
                  {implementationRate}%
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={implementationRate}
                color="success"
              />
            </Box>
          </Stack>
        </CardContent>
      </Card>

      {/* Per-Advisor Breakdown */}
      <Card variant="outlined">
        <CardContent>
          <Typography variant="subtitle1" gutterBottom>
            Advisor Breakdown
          </Typography>
          <Stack spacing={2} divider={<Divider />}>
            {metrics.map((advisor) => (
              <Box key={advisor.advisor_id}>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    mb: 1,
                  }}
                >
                  <Box>
                    <Typography variant="subtitle2">
                      {advisor.advisor_name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {advisor.completed_sessions} sessions completed
                    </Typography>
                  </Box>
                  <Stack direction="row" spacing={1}>
                    <Chip
                      label={`${advisor.total_hours.toFixed(1)}h`}
                      size="small"
                      icon={<ScheduleIcon />}
                    />
                    <Chip
                      label={`${advisor.implemented_recommendations}/${advisor.total_recommendations}`}
                      size="small"
                      icon={<CheckCircleIcon />}
                      color={
                        advisor.implemented_recommendations ===
                        advisor.total_recommendations
                          ? "success"
                          : "default"
                      }
                    />
                    {advisor.average_session_rating && (
                      <Chip
                        label={`★ ${advisor.average_session_rating.toFixed(1)}`}
                        size="small"
                        color="warning"
                      />
                    )}
                  </Stack>
                </Box>
              </Box>
            ))}
          </Stack>
        </CardContent>
      </Card>
    </Stack>
  );
}

export default ImpactDashboard;
