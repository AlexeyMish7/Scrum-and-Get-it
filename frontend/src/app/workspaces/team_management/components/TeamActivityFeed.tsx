/**
 * TEAM ACTIVITY FEED COMPONENT (UC-108, Demo 4.2, Demo 4.3)
 *
 * Purpose:
 * - Display real-time team activity updates
 * - Show member joins, role changes, milestones, celebrations
 * - Display shared jobs with collaborative comments (Demo 4.2)
 * - Provide team engagement visibility
 *
 * Demo Script 4.2 Requirements:
 * - Display team activity feed with real-time updates
 * - Show shared job postings with comments
 * - Enable collaborative recommendations
 *
 * Demo Script 4.3 Requirements:
 * - Show milestone achievements and team celebrations
 *
 * Usage:
 *   <TeamActivityFeed teamId={teamId} limit={20} />
 */

import { useState, useEffect, useCallback } from "react";
import {
  Box,
  Stack,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Chip,
  CircularProgress,
  Alert,
  Button,
  Divider,
  IconButton,
  Tooltip,
  Tabs,
  Tab,
} from "@mui/material";
import {
  PersonAdd as PersonAddIcon,
  EmojiEvents as TrophyIcon,
  Assignment as ApplicationIcon,
  Work as OfferIcon,
  Chat as CommentIcon,
  Share as ShareIcon,
  Celebration as CelebrationIcon,
  TrendingUp as InterviewIcon,
  Star as StarIcon,
  Settings as SettingsIcon,
  Refresh as RefreshIcon,
  Group as GroupIcon,
} from "@mui/icons-material";
import { formatDistanceToNow } from "date-fns";
import { useAuth } from "@shared/context/AuthContext";
import * as teamService from "../services/teamService";
import type { AchievementCelebration } from "../services/progressSharingService";
import * as progressSharingService from "../services/progressSharingService";
import SharedJobCard, { type SharedJobData } from "./SharedJobCard";

// ============================================================================
// TYPES
// ============================================================================

interface ActivityItem {
  id: string;
  type:
    | "member_joined"
    | "member_invited"
    | "role_changed"
    | "milestone_reached"
    | "job_shared"
    | "comment_added"
    | "interview_scheduled"
    | "offer_received"
    | "goal_completed"
    | "celebration"
    | "settings_updated"
    | "team_created";
  actor_name: string;
  actor_avatar?: string;
  description: string;
  target_name?: string;
  metadata?: Record<string, unknown>;
  created_at: string;
}

interface TeamActivityFeedProps {
  teamId: string;
  limit?: number;
  showHeader?: boolean;
  compact?: boolean;
  /** Show only shared jobs */
  showSharedJobsOnly?: boolean;
}

// ============================================================================
// ACTIVITY ICON MAPPING
// ============================================================================

const getActivityIcon = (type: ActivityItem["type"]) => {
  const iconMap: Record<ActivityItem["type"], React.ReactNode> = {
    member_joined: <PersonAddIcon color="success" />,
    member_invited: <PersonAddIcon color="info" />,
    role_changed: <SettingsIcon color="warning" />,
    milestone_reached: <TrophyIcon sx={{ color: "#FFD700" }} />,
    job_shared: <ShareIcon color="primary" />,
    comment_added: <CommentIcon color="action" />,
    interview_scheduled: <InterviewIcon color="info" />,
    offer_received: <OfferIcon color="success" />,
    goal_completed: <StarIcon sx={{ color: "#FFD700" }} />,
    celebration: <CelebrationIcon sx={{ color: "#FF69B4" }} />,
    settings_updated: <SettingsIcon color="action" />,
    team_created: <GroupIcon color="primary" />,
  };
  return iconMap[type] || <ApplicationIcon />;
};

const getActivityChipColor = (
  type: ActivityItem["type"]
): "success" | "info" | "warning" | "error" | "default" | "primary" => {
  const colorMap: Record<
    ActivityItem["type"],
    "success" | "info" | "warning" | "error" | "default" | "primary"
  > = {
    member_joined: "success",
    member_invited: "info",
    role_changed: "warning",
    milestone_reached: "success",
    job_shared: "primary",
    comment_added: "default",
    interview_scheduled: "info",
    offer_received: "success",
    goal_completed: "success",
    celebration: "success",
    settings_updated: "default",
    team_created: "primary",
  };
  return colorMap[type] || "default";
};

const getActivityLabel = (type: ActivityItem["type"]): string => {
  const labelMap: Record<ActivityItem["type"], string> = {
    member_joined: "Joined",
    member_invited: "Invited",
    role_changed: "Role Update",
    milestone_reached: "Milestone",
    job_shared: "Shared",
    comment_added: "Comment",
    interview_scheduled: "Interview",
    offer_received: "Offer! 🎉",
    goal_completed: "Goal Met",
    celebration: "Celebration",
    settings_updated: "Settings",
    team_created: "Created",
  };
  return labelMap[type] || "Activity";
};

// Helper to convert celebration to activity item
const celebrationToActivity = (
  achievement: AchievementCelebration
): ActivityItem => ({
  id: `achievement-${achievement.id}`,
  type: "celebration" as const,
  actor_name: achievement.user?.fullName || "Team Member",
  description: achievement.title,
  metadata: {
    celebration_type: achievement.celebrationType,
    milestone: achievement.milestoneValue,
  },
  created_at: achievement.celebratedAt,
});

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function TeamActivityFeed({
  teamId,
  limit = 20,
  showHeader = true,
  compact = false,
  showSharedJobsOnly = false,
}: TeamActivityFeedProps) {
  const { user } = useAuth();
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [sharedJobs, setSharedJobs] = useState<SharedJobData[]>([]);
  const [milestones, setMilestones] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterTab, setFilterTab] = useState<"all" | "jobs" | "milestones">(
    showSharedJobsOnly ? "jobs" : "all"
  );
  const [celebrateLoading, setCelebrateLoading] = useState(false);

  // Create a test celebration for demo purposes
  const handleCreateCelebration = async () => {
    if (!user?.id || !teamId) return;

    setCelebrateLoading(true);
    try {
      const result = await progressSharingService.createCelebration(user.id, {
        teamId,
        userId: user.id,
        celebrationType: "custom",
        title: "🎉 Team Milestone Achieved!",
        description:
          "Our team is making great progress on the job search journey!",
      });

      if (result.data) {
        // Reload activity to show the new celebration
        await loadActivity();
      }
    } catch (err) {
      console.error("Failed to create celebration:", err);
    } finally {
      setCelebrateLoading(false);
    }
  };

  const loadActivity = useCallback(async () => {
    if (!user?.id || !teamId) return;

    setLoading(true);
    setError(null);

    try {
      // Fetch team activity log
      const activityResult = await teamService.getTeamActivity(
        user.id,
        teamId,
        limit
      );

      if (activityResult.error) {
        setError(activityResult.error.message);
        setActivities([]);
        return;
      }

      // Transform activity log to display format
      const activityItems: ActivityItem[] = (activityResult.data || []).map(
        (log) => ({
          id: log.id,
          type: log.activity_type as ActivityItem["type"],
          actor_name: "Team Member",
          description: log.description,
          metadata: log.metadata as Record<string, unknown>,
          created_at: log.created_at,
        })
      );

      // Extract shared jobs from activity items for the jobs tab
      const extractedJobs: SharedJobData[] = [];
      for (const item of activityItems) {
        // Check if this is a job share activity (stored as settings_updated with metadata.type = "job_shared")
        const metadata = item.metadata || {};
        if (metadata.type === "job_shared" && metadata.job) {
          const jobData = metadata.job as {
            id?: number;
            title?: string;
            company?: string;
            status?: string;
            location?: string | null;
            url?: string | null;
          };

          extractedJobs.push({
            id: item.id,
            title: jobData.title || "Unknown Job",
            company: jobData.company || "Unknown Company",
            status: jobData.status,
            location: jobData.location,
            url: jobData.url,
            shareType:
              (metadata.share_type as SharedJobData["shareType"]) || "fyi",
            comment: metadata.comment as string | null,
            sharedAt: item.created_at,
            sharedBy: {
              id: "", // Actor ID not available in current log format
              name: item.actor_name,
            },
          });
        }
      }
      setSharedJobs(extractedJobs);

      // Fetch team achievements for celebration activities
      try {
        const achievementsResult =
          await progressSharingService.getTeamAchievements(teamId, limit);

        // Add achievements as celebration activities
        if (achievementsResult.data) {
          const achievementActivities: ActivityItem[] =
            achievementsResult.data.map(celebrationToActivity);

          // Store milestones separately for the milestones tab
          setMilestones(achievementActivities);

          // Merge and sort by date
          activityItems.push(...achievementActivities);
          activityItems.sort(
            (a, b) =>
              new Date(b.created_at).getTime() -
              new Date(a.created_at).getTime()
          );
        }
      } catch {
        // Silently ignore achievement fetch errors - show activity log only
        console.log("Could not fetch achievements, showing activity log only");
        setMilestones([]);
      }

      setActivities(activityItems.slice(0, limit));
    } catch (err) {
      setError("Failed to load activity");
      console.error("Activity feed error:", err);
    } finally {
      setLoading(false);
    }
  }, [user?.id, teamId, limit]);

  // Load activity on mount and when dependencies change
  useEffect(() => {
    loadActivity();
  }, [loadActivity]);

  // Render loading state
  if (loading) {
    return (
      <Box display="flex" justifyContent="center" py={4}>
        <CircularProgress size={32} />
      </Box>
    );
  }

  // Render error state
  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        {error}
        <Button size="small" onClick={loadActivity} sx={{ ml: 2 }}>
          Retry
        </Button>
      </Alert>
    );
  }

  // Render empty state
  if (activities.length === 0) {
    return (
      <Paper sx={{ p: 3, textAlign: "center" }}>
        <GroupIcon sx={{ fontSize: 48, color: "text.secondary", mb: 1 }} />
        <Typography color="text.secondary">
          No team activity yet. Activity will appear here as team members take
          actions.
        </Typography>
      </Paper>
    );
  }

  return (
    <Paper sx={{ p: compact ? 2 : 3 }}>
      {showHeader && (
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
          mb={2}
        >
          <Typography variant="h6">Team Activity Feed</Typography>
          <Stack direction="row" spacing={1}>
            <Tooltip title="Celebrate a milestone">
              <IconButton
                size="small"
                onClick={handleCreateCelebration}
                disabled={celebrateLoading}
                color="warning"
              >
                <CelebrationIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Refresh">
              <IconButton size="small" onClick={loadActivity}>
                <RefreshIcon />
              </IconButton>
            </Tooltip>
          </Stack>
        </Stack>
      )}

      {/* Filter Tabs - Always show tabs to allow navigation between views */}
      {!compact && (
        <Tabs
          value={filterTab}
          onChange={(_, newValue) => setFilterTab(newValue)}
          sx={{ mb: 2, borderBottom: 1, borderColor: "divider" }}
        >
          <Tab label="All Activity" value="all" />
          <Tab
            label={`Shared Jobs${
              sharedJobs.length > 0 ? ` (${sharedJobs.length})` : ""
            }`}
            value="jobs"
            icon={<ShareIcon fontSize="small" />}
            iconPosition="start"
          />
          <Tab
            label={`Milestones${
              milestones.length > 0 ? ` (${milestones.length})` : ""
            }`}
            value="milestones"
            icon={<CelebrationIcon fontSize="small" />}
            iconPosition="start"
          />
        </Tabs>
      )}

      {/* Milestones & Celebrations View */}
      {filterTab === "milestones" ? (
        <Box>
          {milestones.length === 0 ? (
            <Box textAlign="center" py={4}>
              <CelebrationIcon
                sx={{ fontSize: 48, color: "text.secondary", mb: 1 }}
              />
              <Typography color="text.secondary">
                No milestones yet. Celebrations will appear here when team
                members hit their goals!
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                🎯 First application • 🎤 First interview • 🎉 Job offer
                received
              </Typography>
            </Box>
          ) : (
            <List disablePadding>
              {milestones.map((milestone, index) => (
                <Box key={milestone.id}>
                  {index > 0 && <Divider variant="inset" component="li" />}
                  <ListItem
                    alignItems="flex-start"
                    sx={{
                      py: 1.5,
                      bgcolor: "warning.50",
                      borderRadius: 1,
                      mb: 1,
                    }}
                  >
                    <ListItemAvatar>
                      <Avatar
                        sx={{
                          bgcolor: "warning.main",
                          width: 40,
                          height: 40,
                        }}
                      >
                        <TrophyIcon />
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Stack direction="row" spacing={1} alignItems="center">
                          <Typography variant="body1" fontWeight={600}>
                            {milestone.actor_name}
                          </Typography>
                          <Chip
                            label="🎉 Milestone"
                            size="small"
                            color="warning"
                            sx={{ height: 20, fontSize: "0.7rem" }}
                          />
                        </Stack>
                      }
                      primaryTypographyProps={{ component: "div" }}
                      secondary={
                        <Stack spacing={0.5}>
                          <Typography
                            variant="body2"
                            color="text.primary"
                            fontWeight={500}
                          >
                            {milestone.description}
                          </Typography>
                          <Typography variant="caption" color="text.disabled">
                            {formatDistanceToNow(
                              new Date(milestone.created_at),
                              {
                                addSuffix: true,
                              }
                            )}
                          </Typography>
                        </Stack>
                      }
                      secondaryTypographyProps={{ component: "div" }}
                    />
                  </ListItem>
                </Box>
              ))}
            </List>
          )}
        </Box>
      ) : filterTab === "jobs" ? (
        /* Shared Jobs View */
        <Box>
          {sharedJobs.length === 0 ? (
            <Box textAlign="center" py={4}>
              <ShareIcon
                sx={{ fontSize: 48, color: "text.secondary", mb: 1 }}
              />
              <Typography color="text.secondary">
                No jobs have been shared with the team yet.
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Share a job from your pipeline to start collaborating!
              </Typography>
            </Box>
          ) : (
            <Stack spacing={2}>
              {sharedJobs.map((job) => (
                <SharedJobCard
                  key={job.id}
                  job={job}
                  onCommentAdded={loadActivity}
                  compact={compact}
                />
              ))}
            </Stack>
          )}
        </Box>
      ) : (
        /* All Activity View */
        <List disablePadding>
          {activities.map((activity, index) => (
            <Box key={activity.id}>
              {index > 0 && <Divider variant="inset" component="li" />}
              <ListItem alignItems="flex-start" sx={{ py: compact ? 1 : 1.5 }}>
                <ListItemAvatar>
                  <Avatar
                    sx={{
                      bgcolor: "background.default",
                      width: compact ? 36 : 40,
                      height: compact ? 36 : 40,
                    }}
                  >
                    {getActivityIcon(activity.type)}
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={
                    <Stack
                      direction="row"
                      spacing={1}
                      alignItems="center"
                      flexWrap="wrap"
                    >
                      <Typography
                        variant={compact ? "body2" : "body1"}
                        fontWeight={500}
                      >
                        {activity.actor_name}
                      </Typography>
                      <Chip
                        label={getActivityLabel(activity.type)}
                        size="small"
                        color={getActivityChipColor(activity.type)}
                        sx={{ height: 20, fontSize: "0.7rem" }}
                      />
                    </Stack>
                  }
                  primaryTypographyProps={{ component: "div" }}
                  secondary={
                    <>
                      <Typography
                        component="span"
                        variant="body2"
                        color="text.secondary"
                        display="block"
                        sx={{
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden",
                        }}
                      >
                        {activity.description}
                      </Typography>
                      <Typography
                        component="span"
                        variant="caption"
                        color="text.disabled"
                      >
                        {formatDistanceToNow(new Date(activity.created_at), {
                          addSuffix: true,
                        })}
                      </Typography>
                    </>
                  }
                  secondaryTypographyProps={{ component: "div" }}
                />
              </ListItem>
            </Box>
          ))}
        </List>
      )}

      {filterTab === "all" && activities.length >= limit && (
        <Box textAlign="center" mt={2}>
          <Button size="small" onClick={loadActivity}>
            Load More
          </Button>
        </Box>
      )}
    </Paper>
  );
}

export default TeamActivityFeed;
