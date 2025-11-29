/**
 * ACCOUNTABILITY TRACKER COMPONENT (UC-109)
 *
 * Purpose:
 * - Track goal completion rates across mentees
 * - Display follow-through metrics
 * - Show milestone achievements
 * - Provide accountability scoring
 *
 * Used by:
 * - MentorDashboard for quick accountability overview
 * - Individual mentee views for detailed metrics
 */

import {
  Box,
  Stack,
  Typography,
  Paper,
  Grid,
  LinearProgress,
  Avatar,
  Card,
  CardContent,
  Chip,
  Tooltip,
} from "@mui/material";
import {
  Flag as GoalIcon,
  CheckCircle as CompletedIcon,
  Cancel as MissedIcon,
  Schedule as PendingIcon,
  TrendingUp as TrendingUpIcon,
  EmojiEvents as TrophyIcon,
} from "@mui/icons-material";
import type { MenteeGoal } from "../services/mentorService";

// ============================================================================
// TYPES
// ============================================================================

interface AccountabilityTrackerProps {
  goals: MenteeGoal[];
  menteeName?: string;
  showDetails?: boolean;
}

interface AccountabilityMetrics {
  totalGoals: number;
  completed: number;
  active: number;
  missed: number;
  completionRate: number;
  streakCount: number;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function calculateMetrics(goals: MenteeGoal[]): AccountabilityMetrics {
  const completed = goals.filter((g) => g.status === "completed").length;
  const active = goals.filter((g) => g.status === "active").length;
  const missed = goals.filter((g) => g.status === "missed").length;
  const totalGoals = goals.length;

  // Calculate completion rate (excluding active goals)
  const settledGoals = completed + missed;
  const completionRate =
    settledGoals > 0 ? Math.round((completed / settledGoals) * 100) : 0;

  // Calculate streak (consecutive completed goals, most recent first)
  let streakCount = 0;
  const sortedGoals = [...goals]
    .filter((g) => g.status !== "active")
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

  for (const goal of sortedGoals) {
    if (goal.status === "completed") {
      streakCount++;
    } else {
      break;
    }
  }

  return {
    totalGoals,
    completed,
    active,
    missed,
    completionRate,
    streakCount,
  };
}

function getCompletionColor(rate: number): "success" | "warning" | "error" {
  if (rate >= 75) return "success";
  if (rate >= 50) return "warning";
  return "error";
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function AccountabilityTracker({
  goals,
  menteeName,
  showDetails = true,
}: AccountabilityTrackerProps) {
  const metrics = calculateMetrics(goals);

  return (
    <Paper sx={{ p: 3 }}>
      <Stack spacing={3}>
        {/* Header */}
        <Stack direction="row" alignItems="center" spacing={2}>
          <GoalIcon color="primary" />
          <Box>
            <Typography variant="h6">
              {menteeName
                ? `Accountability: ${menteeName}`
                : "Goal Accountability"}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Track goal completion and follow-through
            </Typography>
          </Box>
        </Stack>

        {/* Summary Cards */}
        <Grid container spacing={2}>
          <Grid size={{ xs: 6, md: 3 }}>
            <Card variant="outlined">
              <CardContent sx={{ py: 2, "&:last-child": { pb: 2 } }}>
                <Stack alignItems="center" spacing={1}>
                  <Avatar
                    sx={{
                      bgcolor: `${getCompletionColor(
                        metrics.completionRate
                      )}.light`,
                      width: 48,
                      height: 48,
                    }}
                  >
                    <Typography
                      variant="h6"
                      color={`${getCompletionColor(
                        metrics.completionRate
                      )}.main`}
                    >
                      {metrics.completionRate}%
                    </Typography>
                  </Avatar>
                  <Typography variant="caption" color="text.secondary">
                    Completion Rate
                  </Typography>
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 6, md: 3 }}>
            <Card variant="outlined">
              <CardContent sx={{ py: 2, "&:last-child": { pb: 2 } }}>
                <Stack alignItems="center" spacing={1}>
                  <Avatar sx={{ bgcolor: "success.light" }}>
                    <CompletedIcon fontSize="small" color="success" />
                  </Avatar>
                  <Typography variant="h5">{metrics.completed}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    Completed
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
                    <PendingIcon fontSize="small" color="warning" />
                  </Avatar>
                  <Typography variant="h5">{metrics.active}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    In Progress
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
                      bgcolor:
                        metrics.streakCount > 0 ? "primary.light" : "grey.200",
                    }}
                  >
                    <TrophyIcon
                      fontSize="small"
                      color={metrics.streakCount > 0 ? "primary" : "disabled"}
                    />
                  </Avatar>
                  <Typography variant="h5">{metrics.streakCount}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    Current Streak
                  </Typography>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Progress Bar */}
        {metrics.totalGoals > 0 && (
          <Box>
            <Stack direction="row" justifyContent="space-between" mb={1}>
              <Typography variant="subtitle2" color="text.secondary">
                Overall Progress
              </Typography>
              <Typography variant="subtitle2">
                {metrics.completed + metrics.active} of {metrics.totalGoals}{" "}
                goals
              </Typography>
            </Stack>
            <LinearProgress
              variant="determinate"
              value={metrics.completionRate}
              color={getCompletionColor(metrics.completionRate)}
              sx={{ height: 10, borderRadius: 1 }}
            />
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
                    Completed ({metrics.completed})
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
                    Active ({metrics.active})
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
                    Missed ({metrics.missed})
                  </Typography>
                </Stack>
              </Stack>
            </Stack>
          </Box>
        )}

        {/* Detailed Goal List */}
        {showDetails && goals.length > 0 && (
          <Box>
            <Typography variant="subtitle2" color="text.secondary" mb={2}>
              Recent Goals
            </Typography>
            <Stack spacing={1}>
              {goals.slice(0, 5).map((goal) => (
                <Stack
                  key={goal.id}
                  direction="row"
                  alignItems="center"
                  spacing={2}
                  sx={{
                    p: 1.5,
                    borderRadius: 1,
                    bgcolor: "action.hover",
                  }}
                >
                  {goal.status === "completed" && (
                    <CompletedIcon color="success" fontSize="small" />
                  )}
                  {goal.status === "active" && (
                    <PendingIcon color="warning" fontSize="small" />
                  )}
                  {goal.status === "missed" && (
                    <MissedIcon color="error" fontSize="small" />
                  )}
                  {goal.status === "cancelled" && (
                    <MissedIcon color="disabled" fontSize="small" />
                  )}

                  <Box flex={1}>
                    <Typography variant="body2">{goal.title}</Typography>
                    {goal.dueDate && (
                      <Typography variant="caption" color="text.secondary">
                        Due: {new Date(goal.dueDate).toLocaleDateString()}
                      </Typography>
                    )}
                  </Box>

                  {goal.targetValue && goal.status === "active" && (
                    <Tooltip
                      title={`${goal.currentValue} / ${goal.targetValue}`}
                    >
                      <Chip
                        size="small"
                        label={`${Math.round(
                          (goal.currentValue / goal.targetValue) * 100
                        )}%`}
                        color="primary"
                        variant="outlined"
                      />
                    </Tooltip>
                  )}
                </Stack>
              ))}
            </Stack>
          </Box>
        )}

        {/* Empty State */}
        {goals.length === 0 && (
          <Box textAlign="center" py={4}>
            <GoalIcon sx={{ fontSize: 48, color: "text.disabled", mb: 1 }} />
            <Typography color="text.secondary">No goals set yet</Typography>
            <Typography variant="body2" color="text.secondary">
              Start by setting goals to track accountability.
            </Typography>
          </Box>
        )}

        {/* Motivation Message */}
        {metrics.completionRate >= 75 && metrics.totalGoals >= 3 && (
          <Stack
            direction="row"
            alignItems="center"
            spacing={2}
            sx={{
              p: 2,
              borderRadius: 1,
              bgcolor: "success.50",
              border: 1,
              borderColor: "success.200",
            }}
          >
            <TrendingUpIcon color="success" />
            <Typography variant="body2" color="success.main">
              Great job! Maintaining a {metrics.completionRate}% completion rate
              shows strong commitment to goals.
            </Typography>
          </Stack>
        )}
      </Stack>
    </Paper>
  );
}

export default AccountabilityTracker;
