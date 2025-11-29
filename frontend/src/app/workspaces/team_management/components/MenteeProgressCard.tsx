/**
 * MENTEE PROGRESS CARD COMPONENT (UC-109)
 *
 * Purpose:
 * - Display detailed progress metrics for an individual mentee
 * - Show job application stats (applied/interview/offer counts)
 * - Display recent activity timeline
 * - Show goal progress indicators
 * - Display engagement level badge
 *
 * Used by:
 * - MentorDashboard for mentee overview
 * - Standalone mentee detail views
 */

import { useState } from "react";
import {
  Card,
  CardContent,
  CardActions,
  Stack,
  Typography,
  Box,
  Avatar,
  Chip,
  IconButton,
  Collapse,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Button,
  Tooltip,
  LinearProgress,
  Grid,
} from "@mui/material";
import {
  ExpandMore as ExpandMoreIcon,
  TrendingUp as TrendingUpIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Timer as TimerIcon,
  Work as WorkIcon,
  Description as DescriptionIcon,
  Flag as FlagIcon,
  Chat as ChatIcon,
  Update as UpdateIcon,
  EmojiEvents as EmojiEventsIcon,
} from "@mui/icons-material";
import type {
  MenteeWithProgress,
  ActivityItem,
} from "../services/mentorService";

// ============================================================================
// TYPES
// ============================================================================

interface MenteeProgressCardProps {
  mentee: MenteeWithProgress;
  onViewDocuments?: (mentee: MenteeWithProgress) => void;
  onAddGoal?: (mentee: MenteeWithProgress) => void;
  onGiveFeedback?: (mentee: MenteeWithProgress) => void;
  expanded?: boolean;
}

// ============================================================================
// HELPER COMPONENTS
// ============================================================================

/**
 * Engagement level indicator with color and icon
 */
function EngagementBadge({
  level,
  showLabel = true,
}: {
  level: "high" | "medium" | "low" | "inactive";
  showLabel?: boolean;
}) {
  const config = {
    high: {
      color: "success" as const,
      label: "Highly Active",
      icon: <TrendingUpIcon fontSize="small" />,
    },
    medium: {
      color: "info" as const,
      label: "Active",
      icon: <CheckCircleIcon fontSize="small" />,
    },
    low: {
      color: "warning" as const,
      label: "Low Activity",
      icon: <WarningIcon fontSize="small" />,
    },
    inactive: {
      color: "error" as const,
      label: "Inactive",
      icon: <TimerIcon fontSize="small" />,
    },
  };

  const { color, label, icon } = config[level];

  return (
    <Chip
      icon={icon}
      label={showLabel ? label : undefined}
      color={color}
      size="small"
      variant="outlined"
    />
  );
}

/**
 * Activity icon based on type
 */
function getActivityIcon(type: ActivityItem["type"]) {
  const icons = {
    job_applied: <WorkIcon fontSize="small" color="primary" />,
    status_change: <UpdateIcon fontSize="small" color="info" />,
    document_updated: <DescriptionIcon fontSize="small" color="secondary" />,
    goal_completed: <EmojiEventsIcon fontSize="small" color="success" />,
    feedback_received: <ChatIcon fontSize="small" color="warning" />,
  };
  return icons[type] || <UpdateIcon fontSize="small" />;
}

/**
 * Format relative time (e.g., "2 hours ago", "3 days ago")
 */
function formatRelativeTime(timestamp: string): string {
  const now = new Date();
  const date = new Date(timestamp);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 60) {
    return diffMins <= 1 ? "just now" : `${diffMins} minutes ago`;
  } else if (diffHours < 24) {
    return diffHours === 1 ? "1 hour ago" : `${diffHours} hours ago`;
  } else if (diffDays < 7) {
    return diffDays === 1 ? "1 day ago" : `${diffDays} days ago`;
  } else {
    return date.toLocaleDateString();
  }
}

/**
 * Stat card for displaying a single metric
 */
function StatCard({
  label,
  value,
  color = "text.primary",
}: {
  label: string;
  value: number | string;
  color?: string;
}) {
  return (
    <Box textAlign="center">
      <Typography variant="h5" fontWeight="bold" color={color}>
        {value}
      </Typography>
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
    </Box>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function MenteeProgressCard({
  mentee,
  onViewDocuments,
  onAddGoal,
  onGiveFeedback,
  expanded: initialExpanded = false,
}: MenteeProgressCardProps) {
  const [expanded, setExpanded] = useState(initialExpanded);

  // Calculate conversion rate (interviews / total applications)
  const conversionRate =
    mentee.jobStats.total > 0
      ? Math.round((mentee.jobStats.interviewing / mentee.jobStats.total) * 100)
      : 0;

  // Calculate success rate (offers / interviews)
  const successRate =
    mentee.jobStats.interviewing > 0
      ? Math.round(
          (mentee.jobStats.offers / mentee.jobStats.interviewing) * 100
        )
      : 0;

  return (
    <Card
      variant="outlined"
      sx={{
        transition: "all 0.2s ease",
        "&:hover": {
          boxShadow: 2,
          borderColor: "primary.light",
        },
      }}
    >
      <CardContent>
        {/* Header: Avatar, Name, Engagement Badge */}
        <Stack direction="row" alignItems="center" spacing={2} mb={2}>
          <Avatar
            sx={{
              bgcolor: "primary.main",
              width: 48,
              height: 48,
            }}
          >
            {mentee.candidate_name?.[0]?.toUpperCase() || "?"}
          </Avatar>
          <Box flex={1}>
            <Stack direction="row" alignItems="center" spacing={1}>
              <Typography variant="h6">{mentee.candidate_name}</Typography>
              <EngagementBadge level={mentee.engagementLevel} />
            </Stack>
            <Typography variant="body2" color="text.secondary">
              {mentee.candidate_email}
            </Typography>
          </Box>
          <IconButton
            onClick={() => setExpanded(!expanded)}
            size="small"
            sx={{
              transform: expanded ? "rotate(180deg)" : "rotate(0deg)",
              transition: "transform 0.2s",
            }}
          >
            <ExpandMoreIcon />
          </IconButton>
        </Stack>

        {/* Job Stats Summary */}
        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid size={{ xs: 3 }}>
            <StatCard label="Total Apps" value={mentee.jobStats.total} />
          </Grid>
          <Grid size={{ xs: 3 }}>
            <StatCard
              label="Interviewing"
              value={mentee.jobStats.interviewing}
              color="info.main"
            />
          </Grid>
          <Grid size={{ xs: 3 }}>
            <StatCard
              label="Offers"
              value={mentee.jobStats.offers}
              color="success.main"
            />
          </Grid>
          <Grid size={{ xs: 3 }}>
            <StatCard
              label="Rejected"
              value={mentee.jobStats.rejected}
              color="error.main"
            />
          </Grid>
        </Grid>

        {/* Conversion Rates */}
        <Stack spacing={1} mb={2}>
          <Box>
            <Stack direction="row" justifyContent="space-between" mb={0.5}>
              <Typography variant="caption" color="text.secondary">
                Interview Conversion Rate
              </Typography>
              <Typography variant="caption" fontWeight="bold">
                {conversionRate}%
              </Typography>
            </Stack>
            <LinearProgress
              variant="determinate"
              value={conversionRate}
              color={conversionRate >= 20 ? "success" : "warning"}
              sx={{ height: 6, borderRadius: 1 }}
            />
          </Box>
          {mentee.jobStats.interviewing > 0 && (
            <Box>
              <Stack direction="row" justifyContent="space-between" mb={0.5}>
                <Typography variant="caption" color="text.secondary">
                  Offer Success Rate
                </Typography>
                <Typography variant="caption" fontWeight="bold">
                  {successRate}%
                </Typography>
              </Stack>
              <LinearProgress
                variant="determinate"
                value={successRate}
                color={successRate >= 30 ? "success" : "info"}
                sx={{ height: 6, borderRadius: 1 }}
              />
            </Box>
          )}
        </Stack>

        {/* Last Active */}
        <Typography variant="caption" color="text.secondary">
          Last active:{" "}
          {mentee.lastActiveAt
            ? formatRelativeTime(mentee.lastActiveAt)
            : "Never"}
        </Typography>

        {/* Expanded Content: Recent Activity */}
        <Collapse in={expanded}>
          <Divider sx={{ my: 2 }} />

          <Typography variant="subtitle2" gutterBottom>
            Recent Activity
          </Typography>

          {mentee.recentActivity.length === 0 ? (
            <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
              No recent activity recorded.
            </Typography>
          ) : (
            <List dense disablePadding>
              {mentee.recentActivity.slice(0, 5).map((activity, index) => (
                <ListItem key={activity.id || index} disableGutters>
                  <ListItemIcon sx={{ minWidth: 32 }}>
                    {getActivityIcon(activity.type)}
                  </ListItemIcon>
                  <ListItemText
                    primary={activity.description}
                    secondary={formatRelativeTime(activity.timestamp)}
                    primaryTypographyProps={{ variant: "body2" }}
                    secondaryTypographyProps={{ variant: "caption" }}
                  />
                </ListItem>
              ))}
            </List>
          )}
        </Collapse>
      </CardContent>

      {/* Action Buttons */}
      <CardActions sx={{ px: 2, pb: 2 }}>
        <Tooltip title="View Documents">
          <Button
            size="small"
            startIcon={<DescriptionIcon />}
            onClick={() => onViewDocuments?.(mentee)}
          >
            Documents
          </Button>
        </Tooltip>
        <Tooltip title="Set Goal">
          <Button
            size="small"
            startIcon={<FlagIcon />}
            onClick={() => onAddGoal?.(mentee)}
          >
            Add Goal
          </Button>
        </Tooltip>
        <Tooltip title="Give Feedback">
          <Button
            size="small"
            color="primary"
            startIcon={<ChatIcon />}
            onClick={() => onGiveFeedback?.(mentee)}
          >
            Feedback
          </Button>
        </Tooltip>
      </CardActions>
    </Card>
  );
}

export default MenteeProgressCard;
