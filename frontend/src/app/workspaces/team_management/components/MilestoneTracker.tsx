/**
 * MILESTONE TRACKER COMPONENT (UC-111)
 *
 * Purpose:
 * - Display user's achieved milestones
 * - Show team milestones for celebration
 * - Create custom milestones
 * - Celebrate teammate achievements
 *
 * Used by:
 * - ProgressSharingPage for milestone display
 * - TeamDashboard for team achievements
 */

import { useState, useEffect } from "react";
import {
  Paper,
  Stack,
  Typography,
  Box,
  Card,
  CardContent,
  Chip,
  Avatar,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tooltip,
  LinearProgress,
  Grid,
} from "@mui/material";
import {
  EmojiEvents as TrophyIcon,
  Celebration as CelebrationIcon,
  Add as AddIcon,
  Work as WorkIcon,
  School as InterviewIcon,
  LocalOffer as OfferIcon,
  Flag as GoalIcon,
  Whatshot as StreakIcon,
  Person as ProfileIcon,
  Description as DocumentIcon,
  Star as CustomIcon,
} from "@mui/icons-material";
import { useTeam } from "@shared/context/useTeam";
import { useAuth } from "@shared/context/AuthContext";
import * as progressService from "../services/progressSharingService";
import type {
  MilestoneRow,
  MilestoneWithUser,
  MilestoneType,
  CreateMilestoneData,
} from "../types/progress.types";

// ============================================================================
// TYPES
// ============================================================================

interface MilestoneTrackerProps {
  showTeamMilestones?: boolean;
  limit?: number;
  onMilestoneCreated?: () => void;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const MILESTONE_ICONS: Record<string, React.ReactNode> = {
  first_application: <WorkIcon />,
  applications_5: <WorkIcon />,
  applications_10: <WorkIcon />,
  applications_25: <WorkIcon />,
  applications_50: <WorkIcon />,
  applications_100: <WorkIcon />,
  first_interview: <InterviewIcon />,
  interviews_5: <InterviewIcon />,
  interviews_10: <InterviewIcon />,
  first_offer: <OfferIcon />,
  goal_completed: <GoalIcon />,
  streak_7_days: <StreakIcon />,
  streak_14_days: <StreakIcon />,
  streak_30_days: <StreakIcon />,
  profile_complete: <ProfileIcon />,
  resume_created: <DocumentIcon />,
  cover_letter_created: <DocumentIcon />,
  custom: <CustomIcon />,
};

const MILESTONE_COLORS: Record<string, string> = {
  first_application: "primary.main",
  applications_5: "primary.light",
  applications_10: "info.main",
  applications_25: "info.light",
  applications_50: "secondary.main",
  applications_100: "warning.main",
  first_interview: "success.light",
  interviews_5: "success.main",
  interviews_10: "success.dark",
  first_offer: "warning.main",
  goal_completed: "info.main",
  streak_7_days: "error.light",
  streak_14_days: "error.main",
  streak_30_days: "error.dark",
  profile_complete: "grey.600",
  resume_created: "secondary.light",
  cover_letter_created: "secondary.main",
  custom: "primary.main",
};

const MILESTONE_TYPE_OPTIONS: { value: MilestoneType; label: string }[] = [
  { value: "goal_completed", label: "Goal Completed" },
  { value: "profile_complete", label: "Profile Complete" },
  { value: "resume_created", label: "Resume Created" },
  { value: "cover_letter_created", label: "Cover Letter Created" },
  { value: "custom", label: "Custom Achievement" },
];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function getMilestoneIcon(type: string): React.ReactNode {
  return MILESTONE_ICONS[type] || <CustomIcon />;
}

function getMilestoneColor(type: string): string {
  return MILESTONE_COLORS[type] || "primary.main";
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  return formatDate(dateStr);
}

// ============================================================================
// MILESTONE CARD COMPONENT
// ============================================================================

interface MilestoneCardProps {
  milestone: MilestoneRow | MilestoneWithUser;
  isTeamView?: boolean;
  onCelebrate?: (milestoneId: string) => void;
  currentUserId?: string;
}

function MilestoneCard({
  milestone,
  isTeamView = false,
  onCelebrate,
  currentUserId,
}: MilestoneCardProps) {
  const hasUser = "user" in milestone && milestone.user;
  const isCelebrated = milestone.celebrated_by?.includes(currentUserId || "");
  const celebrationCount = milestone.celebrated_by?.length || 0;

  return (
    <Card
      variant="outlined"
      sx={{
        transition: "all 0.2s",
        "&:hover": {
          boxShadow: 2,
          borderColor: getMilestoneColor(milestone.milestone_type),
        },
      }}
    >
      <CardContent sx={{ py: 2, "&:last-child": { pb: 2 } }}>
        <Stack direction="row" alignItems="flex-start" spacing={2}>
          <Avatar
            sx={{
              bgcolor: getMilestoneColor(milestone.milestone_type),
              width: 48,
              height: 48,
            }}
          >
            {getMilestoneIcon(milestone.milestone_type)}
          </Avatar>

          <Box flex={1}>
            <Stack
              direction="row"
              alignItems="center"
              justifyContent="space-between"
            >
              <Typography variant="subtitle1" fontWeight="medium">
                {milestone.title}
              </Typography>
              {celebrationCount > 0 && (
                <Chip
                  size="small"
                  icon={<CelebrationIcon />}
                  label={celebrationCount}
                  color="warning"
                  variant="outlined"
                />
              )}
            </Stack>

            {milestone.description && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                {milestone.description}
              </Typography>
            )}

            <Stack
              direction="row"
              alignItems="center"
              justifyContent="space-between"
              sx={{ mt: 1 }}
            >
              <Stack direction="row" alignItems="center" spacing={1}>
                {isTeamView && hasUser && (
                  <Chip
                    size="small"
                    label={(milestone as MilestoneWithUser).user?.full_name || "Unknown"}
                    variant="outlined"
                  />
                )}
                <Typography variant="caption" color="text.secondary">
                  {formatRelativeTime(milestone.achieved_at)}
                </Typography>
              </Stack>

              {isTeamView && onCelebrate && milestone.user_id !== currentUserId && (
                <Tooltip title={isCelebrated ? "Already celebrated!" : "Celebrate!"}>
                  <IconButton
                    size="small"
                    color={isCelebrated ? "warning" : "default"}
                    onClick={() => onCelebrate(milestone.id)}
                    disabled={isCelebrated}
                  >
                    <CelebrationIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              )}
            </Stack>
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function MilestoneTracker({
  showTeamMilestones = true,
  limit = 20,
  onMilestoneCreated,
}: MilestoneTrackerProps) {
  const { user } = useAuth();
  const { currentTeam } = useTeam();

  // State
  const [loading, setLoading] = useState(true);
  const [userMilestones, setUserMilestones] = useState<MilestoneRow[]>([]);
  const [teamMilestones, setTeamMilestones] = useState<MilestoneWithUser[]>([]);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newMilestoneData, setNewMilestoneData] = useState<
    Partial<CreateMilestoneData>
  >({
    milestone_type: "custom",
    title: "",
    description: "",
    is_shared: true,
  });
  const [submitting, setSubmitting] = useState(false);

  // Load milestones
  useEffect(() => {
    async function loadMilestones() {
      if (!user || !currentTeam) return;

      setLoading(true);

      // Load user's milestones
      const userResult = await progressService.getUserMilestones(
        user.id,
        currentTeam.id,
        limit
      );
      if (userResult.data) {
        setUserMilestones(userResult.data);
      }

      // Load team milestones
      if (showTeamMilestones) {
        const teamResult = await progressService.getTeamMilestones(
          currentTeam.id,
          limit
        );
        if (teamResult.data) {
          setTeamMilestones(teamResult.data);
        }
      }

      // Check for new automatic milestones
      await progressService.checkAndCreateMilestones(user.id, currentTeam.id);

      setLoading(false);
    }

    loadMilestones();
  }, [user, currentTeam, showTeamMilestones, limit]);

  // Handle create milestone
  const handleCreateMilestone = async () => {
    if (!user || !currentTeam || !newMilestoneData.title) return;

    setSubmitting(true);

    const result = await progressService.createMilestone(user.id, {
      milestone_type: newMilestoneData.milestone_type || "custom",
      title: newMilestoneData.title,
      description: newMilestoneData.description,
      team_id: currentTeam.id,
      is_shared: newMilestoneData.is_shared,
    });

    if (result.data) {
      setUserMilestones((prev) => [result.data!, ...prev]);
      if (newMilestoneData.is_shared) {
        setTeamMilestones((prev) => [
          { ...result.data!, user: { full_name: "You", email: user.email || "" } },
          ...prev,
        ]);
      }
      setShowAddDialog(false);
      setNewMilestoneData({
        milestone_type: "custom",
        title: "",
        description: "",
        is_shared: true,
      });
      onMilestoneCreated?.();
    }

    setSubmitting(false);
  };

  // Handle celebrate
  const handleCelebrate = async (milestoneId: string) => {
    if (!user) return;

    const result = await progressService.celebrateMilestone(user.id, milestoneId);

    if (result.data) {
      // Update team milestones to reflect celebration
      setTeamMilestones((prev) =>
        prev.map((m) =>
          m.id === milestoneId
            ? {
                ...m,
                is_celebrated: true,
                celebrated_by: [...(m.celebrated_by || []), user.id],
              }
            : m
        )
      );
    }
  };

  // Loading state
  if (loading) {
    return (
      <Paper sx={{ p: 3 }}>
        <Stack spacing={2}>
          <Typography variant="h6">Milestones</Typography>
          <LinearProgress />
        </Stack>
      </Paper>
    );
  }

  // No team selected
  if (!currentTeam) {
    return (
      <Paper sx={{ p: 3 }}>
        <Typography color="text.secondary">
          Please select a team to view milestones.
        </Typography>
      </Paper>
    );
  }

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
            <TrophyIcon color="warning" />
            <Box>
              <Typography variant="h6">Milestones & Achievements</Typography>
              <Typography variant="body2" color="text.secondary">
                Track your progress and celebrate achievements
              </Typography>
            </Box>
          </Stack>
          <Button
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={() => setShowAddDialog(true)}
          >
            Add Milestone
          </Button>
        </Stack>

        {/* My Milestones */}
        <Box>
          <Typography variant="subtitle1" gutterBottom>
            My Achievements ({userMilestones.length})
          </Typography>
          {userMilestones.length === 0 ? (
            <Box
              sx={{
                textAlign: "center",
                py: 4,
                bgcolor: "action.hover",
                borderRadius: 1,
              }}
            >
              <TrophyIcon
                sx={{ fontSize: 48, color: "text.disabled", mb: 1 }}
              />
              <Typography color="text.secondary">
                No milestones yet. Keep applying and you'll earn achievements!
              </Typography>
            </Box>
          ) : (
            <Grid container spacing={2}>
              {userMilestones.slice(0, 6).map((milestone) => (
                <Grid key={milestone.id} size={{ xs: 12, sm: 6, md: 4 }}>
                  <MilestoneCard
                    milestone={milestone}
                    currentUserId={user?.id}
                  />
                </Grid>
              ))}
            </Grid>
          )}
        </Box>

        {/* Team Milestones */}
        {showTeamMilestones && teamMilestones.length > 0 && (
          <Box>
            <Typography variant="subtitle1" gutterBottom>
              Team Achievements
            </Typography>
            <Grid container spacing={2}>
              {teamMilestones
                .filter((m) => m.user_id !== user?.id)
                .slice(0, 6)
                .map((milestone) => (
                  <Grid key={milestone.id} size={{ xs: 12, sm: 6, md: 4 }}>
                    <MilestoneCard
                      milestone={milestone}
                      isTeamView
                      onCelebrate={handleCelebrate}
                      currentUserId={user?.id}
                    />
                  </Grid>
                ))}
            </Grid>
          </Box>
        )}
      </Stack>

      {/* Add Milestone Dialog */}
      <Dialog
        open={showAddDialog}
        onClose={() => setShowAddDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Add Custom Milestone</DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            <FormControl fullWidth>
              <InputLabel>Milestone Type</InputLabel>
              <Select
                value={newMilestoneData.milestone_type || "custom"}
                label="Milestone Type"
                onChange={(e) =>
                  setNewMilestoneData((prev) => ({
                    ...prev,
                    milestone_type: e.target.value as MilestoneType,
                  }))
                }
              >
                {MILESTONE_TYPE_OPTIONS.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      {getMilestoneIcon(option.value)}
                      <span>{option.label}</span>
                    </Stack>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              label="Title"
              fullWidth
              value={newMilestoneData.title || ""}
              onChange={(e) =>
                setNewMilestoneData((prev) => ({ ...prev, title: e.target.value }))
              }
              placeholder="e.g., Landed my dream job!"
            />

            <TextField
              label="Description (optional)"
              multiline
              rows={2}
              fullWidth
              value={newMilestoneData.description || ""}
              onChange={(e) =>
                setNewMilestoneData((prev) => ({
                  ...prev,
                  description: e.target.value,
                }))
              }
              placeholder="Add some details about this achievement..."
            />

            <Box>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Share with team?
              </Typography>
              <Stack direction="row" spacing={1}>
                <Chip
                  label="Share"
                  color={newMilestoneData.is_shared ? "primary" : "default"}
                  onClick={() =>
                    setNewMilestoneData((prev) => ({ ...prev, is_shared: true }))
                  }
                  variant={newMilestoneData.is_shared ? "filled" : "outlined"}
                />
                <Chip
                  label="Keep Private"
                  color={!newMilestoneData.is_shared ? "primary" : "default"}
                  onClick={() =>
                    setNewMilestoneData((prev) => ({ ...prev, is_shared: false }))
                  }
                  variant={!newMilestoneData.is_shared ? "filled" : "outlined"}
                />
              </Stack>
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowAddDialog(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleCreateMilestone}
            disabled={!newMilestoneData.title || submitting}
            startIcon={<TrophyIcon />}
          >
            {submitting ? "Creating..." : "Add Milestone"}
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
}

export default MilestoneTracker;
