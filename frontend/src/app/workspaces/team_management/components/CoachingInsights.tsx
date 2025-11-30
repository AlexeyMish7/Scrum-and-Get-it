/**
 * COACHING INSIGHTS COMPONENT (UC-109)
 *
 * Purpose:
 * - Display AI-generated coaching recommendations
 * - Analyze mentee activity patterns to suggest interventions
 * - Provide actionable tips for mentor engagement
 * - Highlight mentees who may need extra attention
 *
 * Used by:
 * - MentorDashboard for quick insights overview
 * - Detailed mentee views for specific recommendations
 */

import { useState } from "react";
import {
  Box,
  Stack,
  Typography,
  Paper,
  Card,
  CardContent,
  Chip,
  Button,
  Alert,
  CircularProgress,
  IconButton,
  Tooltip,
  Collapse,
  Divider,
  Avatar,
} from "@mui/material";
import {
  Lightbulb as InsightIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  Refresh as RefreshIcon,
  ExpandMore as ExpandMoreIcon,
  Person as PersonIcon,
  Flag as GoalIcon,
  Message as MessageIcon,
  Star as StarIcon,
} from "@mui/icons-material";
import type { MenteeWithProgress } from "../services/mentorService";

// ============================================================================
// TYPES
// ============================================================================

interface CoachingInsightsProps {
  mentees: MenteeWithProgress[];
  onRefresh?: () => void;
  loading?: boolean;
}

type InsightPriority = "high" | "medium" | "low";
type InsightCategory =
  | "engagement"
  | "progress"
  | "achievement"
  | "intervention";

interface CoachingInsight {
  id: string;
  title: string;
  description: string;
  priority: InsightPriority;
  category: InsightCategory;
  menteeId?: string;
  menteeName?: string;
  action?: string;
  actionLabel?: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const PRIORITY_CONFIG: Record<
  InsightPriority,
  { color: "error" | "warning" | "info"; label: string }
> = {
  high: { color: "error", label: "High Priority" },
  medium: { color: "warning", label: "Medium" },
  low: { color: "info", label: "Suggestion" },
};

const CATEGORY_CONFIG: Record<
  InsightCategory,
  { icon: React.ReactNode; label: string }
> = {
  engagement: { icon: <TrendingUpIcon />, label: "Engagement" },
  progress: { icon: <GoalIcon />, label: "Progress" },
  achievement: { icon: <StarIcon />, label: "Achievement" },
  intervention: { icon: <WarningIcon />, label: "Needs Attention" },
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Generate coaching insights based on mentee data
 * These would ideally come from an AI service, but we generate them locally for now
 */
function generateInsights(mentees: MenteeWithProgress[]): CoachingInsight[] {
  const insights: CoachingInsight[] = [];

  mentees.forEach((mentee) => {
    // Check for inactive mentees (low engagement)
    if (mentee.engagementLevel === "inactive") {
      insights.push({
        id: `inactive-${mentee.candidate_id}`,
        title: `${mentee.candidate_name} hasn't been active recently`,
        description:
          "Consider reaching out with a friendly check-in message to see if they need support or have any blockers.",
        priority: "high",
        category: "intervention",
        menteeId: mentee.candidate_id,
        menteeName: mentee.candidate_name,
        action: "send_message",
        actionLabel: "Send Check-in",
      });
    }

    // Check for mentees with low application activity
    if (mentee.jobStats.total < 3 && mentee.engagementLevel !== "inactive") {
      insights.push({
        id: `low-apps-${mentee.candidate_id}`,
        title: `${mentee.candidate_name} has only ${mentee.jobStats.total} job${
          mentee.jobStats.total === 1 ? "" : "s"
        } tracked`,
        description:
          "Help them identify more opportunities or review their job search strategy to increase applications.",
        priority: "medium",
        category: "progress",
        menteeId: mentee.candidate_id,
        menteeName: mentee.candidate_name,
        action: "set_goal",
        actionLabel: "Set Weekly Goal",
      });
    }

    // Check for interview success (positive insight)
    if (mentee.jobStats.interviewing > 0) {
      insights.push({
        id: `interview-${mentee.candidate_id}`,
        title: `${mentee.candidate_name} has ${
          mentee.jobStats.interviewing
        } active interview${mentee.jobStats.interviewing === 1 ? "" : "s"}!`,
        description:
          "Great progress! Consider offering interview prep tips or mock interview practice.",
        priority: "low",
        category: "achievement",
        menteeId: mentee.candidate_id,
        menteeName: mentee.candidate_name,
        action: "provide_tips",
        actionLabel: "Share Tips",
      });
    }

    // Check for rejected applications needing review
    const rejectionRate =
      mentee.jobStats.total > 0
        ? mentee.jobStats.rejected / mentee.jobStats.total
        : 0;
    if (rejectionRate > 0.5 && mentee.jobStats.total >= 5) {
      insights.push({
        id: `rejections-${mentee.candidate_id}`,
        title: `${mentee.candidate_name} has a high rejection rate`,
        description:
          "Review their resume and cover letter approach. They might benefit from targeted feedback on their application materials.",
        priority: "high",
        category: "intervention",
        menteeId: mentee.candidate_id,
        menteeName: mentee.candidate_name,
        action: "review_docs",
        actionLabel: "Review Documents",
      });
    }

    // Check for offer celebration
    if (mentee.jobStats.offers > 0) {
      insights.push({
        id: `offer-${mentee.candidate_id}`,
        title: `Congratulations! ${mentee.candidate_name} received ${
          mentee.jobStats.offers
        } offer${mentee.jobStats.offers === 1 ? "" : "s"}`,
        description:
          "Celebrate this achievement! Help them evaluate offers and negotiate if appropriate.",
        priority: "low",
        category: "achievement",
        menteeId: mentee.candidate_id,
        menteeName: mentee.candidate_name,
        action: "celebrate",
        actionLabel: "Send Congrats",
      });
    }
  });

  // Add general engagement insights based on overall patterns
  const activeMentees = mentees.filter((m) => m.engagementLevel === "high");
  const inactiveMentees = mentees.filter(
    (m) => m.engagementLevel === "inactive"
  );

  if (activeMentees.length === mentees.length && mentees.length > 0) {
    insights.push({
      id: "all-active",
      title: "All mentees are actively engaged!",
      description:
        "Great job! Your mentees are staying on track. Continue the momentum with weekly check-ins.",
      priority: "low",
      category: "engagement",
    });
  }

  if (inactiveMentees.length > mentees.length / 2 && mentees.length > 1) {
    insights.push({
      id: "many-inactive",
      title: `${inactiveMentees.length} of ${mentees.length} mentees need attention`,
      description:
        "Consider scheduling group coaching sessions or sending motivational reminders to re-engage your mentees.",
      priority: "high",
      category: "intervention",
      action: "group_message",
      actionLabel: "Send Group Message",
    });
  }

  // Sort by priority (high first, then medium, then low)
  const priorityOrder: InsightPriority[] = ["high", "medium", "low"];
  return insights.sort(
    (a, b) =>
      priorityOrder.indexOf(a.priority) - priorityOrder.indexOf(b.priority)
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function CoachingInsights({
  mentees,
  onRefresh,
  loading = false,
}: CoachingInsightsProps) {
  const [expandedInsights, setExpandedInsights] = useState<Set<string>>(
    new Set()
  );

  // Generate insights from mentee data
  const insights = generateInsights(mentees);

  // Categorize insights
  const highPriorityInsights = insights.filter((i) => i.priority === "high");
  const otherInsights = insights.filter((i) => i.priority !== "high");

  // Toggle insight expansion
  const toggleInsight = (id: string) => {
    setExpandedInsights((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Render a single insight card
  const renderInsightCard = (insight: CoachingInsight) => {
    const priorityConfig = PRIORITY_CONFIG[insight.priority];
    const categoryConfig = CATEGORY_CONFIG[insight.category];
    const isExpanded = expandedInsights.has(insight.id);

    return (
      <Card
        key={insight.id}
        variant="outlined"
        sx={{
          borderLeft: 4,
          borderLeftColor: `${priorityConfig.color}.main`,
        }}
      >
        <CardContent sx={{ py: 2, "&:last-child": { pb: 2 } }}>
          <Stack spacing={1.5}>
            {/* Header */}
            <Stack
              direction="row"
              alignItems="flex-start"
              justifyContent="space-between"
            >
              <Stack direction="row" alignItems="center" spacing={1.5} flex={1}>
                <Box
                  sx={{
                    p: 0.75,
                    borderRadius: 1,
                    bgcolor: `${priorityConfig.color}.50`,
                    color: `${priorityConfig.color}.main`,
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  {categoryConfig.icon}
                </Box>
                <Box flex={1}>
                  <Typography variant="subtitle2">{insight.title}</Typography>
                  <Stack direction="row" spacing={1} mt={0.5}>
                    <Chip
                      size="small"
                      label={categoryConfig.label}
                      variant="outlined"
                      sx={{ height: 20, fontSize: "0.7rem" }}
                    />
                    {insight.menteeName && (
                      <Chip
                        size="small"
                        icon={<PersonIcon sx={{ fontSize: 12 }} />}
                        label={insight.menteeName}
                        variant="outlined"
                        sx={{ height: 20, fontSize: "0.7rem" }}
                      />
                    )}
                  </Stack>
                </Box>
              </Stack>
              <IconButton
                size="small"
                onClick={() => toggleInsight(insight.id)}
                sx={{
                  transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)",
                  transition: "transform 0.2s",
                }}
              >
                <ExpandMoreIcon fontSize="small" />
              </IconButton>
            </Stack>

            {/* Expandable Details */}
            <Collapse in={isExpanded}>
              <Stack spacing={2} sx={{ pt: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  {insight.description}
                </Typography>

                {insight.actionLabel && (
                  <Stack direction="row" spacing={1}>
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<MessageIcon />}
                    >
                      {insight.actionLabel}
                    </Button>
                  </Stack>
                )}
              </Stack>
            </Collapse>
          </Stack>
        </CardContent>
      </Card>
    );
  };

  return (
    <Paper sx={{ p: 3 }}>
      <Stack spacing={3}>
        {/* Header */}
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
        >
          <Stack direction="row" alignItems="center" spacing={2}>
            <InsightIcon color="primary" />
            <Box>
              <Typography variant="h6">Coaching Insights</Typography>
              <Typography variant="body2" color="text.secondary">
                AI-powered recommendations based on mentee activity
              </Typography>
            </Box>
          </Stack>
          {onRefresh && (
            <Tooltip title="Refresh insights">
              <IconButton onClick={onRefresh} disabled={loading}>
                {loading ? <CircularProgress size={20} /> : <RefreshIcon />}
              </IconButton>
            </Tooltip>
          )}
        </Stack>

        {/* Loading State */}
        {loading && (
          <Box display="flex" justifyContent="center" py={4}>
            <CircularProgress />
          </Box>
        )}

        {/* No Mentees State */}
        {!loading && mentees.length === 0 && (
          <Box textAlign="center" py={4}>
            <InsightIcon sx={{ fontSize: 48, color: "text.disabled", mb: 1 }} />
            <Typography color="text.secondary">
              No mentees assigned yet
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Once you have mentees, coaching insights will appear here.
            </Typography>
          </Box>
        )}

        {/* No Insights State */}
        {!loading && mentees.length > 0 && insights.length === 0 && (
          <Alert severity="success" icon={<CheckCircleIcon />}>
            <Typography variant="subtitle2">All looking good!</Typography>
            <Typography variant="body2">
              Your mentees are on track and there are no urgent recommendations
              at this time.
            </Typography>
          </Alert>
        )}

        {/* High Priority Insights */}
        {!loading && highPriorityInsights.length > 0 && (
          <Box>
            <Stack direction="row" alignItems="center" spacing={1} mb={2}>
              <WarningIcon color="error" fontSize="small" />
              <Typography variant="subtitle2" color="error.main">
                Needs Attention ({highPriorityInsights.length})
              </Typography>
            </Stack>
            <Stack spacing={2}>
              {highPriorityInsights.map(renderInsightCard)}
            </Stack>
          </Box>
        )}

        {/* Other Insights */}
        {!loading && otherInsights.length > 0 && (
          <Box>
            {highPriorityInsights.length > 0 && <Divider sx={{ mb: 2 }} />}
            <Stack direction="row" alignItems="center" spacing={1} mb={2}>
              <InsightIcon color="info" fontSize="small" />
              <Typography variant="subtitle2" color="text.secondary">
                Other Insights ({otherInsights.length})
              </Typography>
            </Stack>
            <Stack spacing={2}>{otherInsights.map(renderInsightCard)}</Stack>
          </Box>
        )}

        {/* Summary Stats */}
        {!loading && mentees.length > 0 && (
          <>
            <Divider />
            <Stack direction="row" spacing={3} justifyContent="center">
              <Stack alignItems="center">
                <Avatar
                  sx={{
                    bgcolor: "success.light",
                    width: 40,
                    height: 40,
                    mb: 0.5,
                  }}
                >
                  <TrendingUpIcon fontSize="small" />
                </Avatar>
                <Typography variant="h6">
                  {mentees.filter((m) => m.engagementLevel === "high").length}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Active
                </Typography>
              </Stack>
              <Stack alignItems="center">
                <Avatar
                  sx={{
                    bgcolor: "warning.light",
                    width: 40,
                    height: 40,
                    mb: 0.5,
                  }}
                >
                  <ScheduleIcon fontSize="small" />
                </Avatar>
                <Typography variant="h6">
                  {
                    mentees.filter(
                      (m) =>
                        m.engagementLevel === "medium" ||
                        m.engagementLevel === "low"
                    ).length
                  }
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Moderate
                </Typography>
              </Stack>
              <Stack alignItems="center">
                <Avatar
                  sx={{
                    bgcolor: "error.light",
                    width: 40,
                    height: 40,
                    mb: 0.5,
                  }}
                >
                  <TrendingDownIcon fontSize="small" />
                </Avatar>
                <Typography variant="h6">
                  {
                    mentees.filter((m) => m.engagementLevel === "inactive")
                      .length
                  }
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Inactive
                </Typography>
              </Stack>
            </Stack>
          </>
        )}
      </Stack>
    </Paper>
  );
}

export default CoachingInsights;
