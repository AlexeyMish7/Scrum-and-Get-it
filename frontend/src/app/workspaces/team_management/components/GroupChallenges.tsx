/**
 * GROUP CHALLENGES COMPONENT
 *
 * Purpose:
 * - View and participate in accountability challenges
 * - Track progress towards goals
 * - Create new challenges (moderators only)
 * - View leaderboard
 *
 * Usage:
 *   <GroupChallenges groupId="uuid" isModerator={true} />
 */

import { useState, useEffect } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Stack,
  Chip,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  CircularProgress,
  Alert,
  Grid,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
} from "@mui/material";
import {
  EmojiEvents as TrophyIcon,
  Add as AddIcon,
  Timer as TimerIcon,
  TrendingUp as TrendingUpIcon,
  CheckCircle as CheckIcon,
  RadioButtonUnchecked as UncheckedIcon,
} from "@mui/icons-material";
import { useAuth } from "@shared/context/AuthContext";
import * as peerNetworkingService from "../services/peerNetworkingService";
import type {
  GroupChallengeWithProgress,
  CreateChallengeData,
} from "../types";

interface GroupChallengesProps {
  groupId: string;
  isModerator?: boolean;
}

const GOAL_TYPES = [
  { value: "applications_count", label: "Job Applications" },
  { value: "interviews_count", label: "Interviews" },
  { value: "networking_events", label: "Networking Events" },
  { value: "skills_learned", label: "Skills Learned" },
  { value: "connections_made", label: "Connections Made" },
  { value: "resume_updates", label: "Resume Updates" },
  { value: "custom", label: "Custom Goal" },
];

const STATUS_COLORS: Record<string, "success" | "primary" | "warning" | "default"> = {
  active: "success",
  completed: "primary",
  draft: "warning",
  paused: "default",
  cancelled: "default",
};

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function getDaysRemaining(endDate: string): number {
  const end = new Date(endDate);
  const now = new Date();
  const diffInMs = end.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diffInMs / (1000 * 60 * 60 * 24)));
}

export function GroupChallenges({
  groupId,
  isModerator = false,
}: GroupChallengesProps) {
  const { user } = useAuth();

  // State
  const [challenges, setChallenges] = useState<GroupChallengeWithProgress[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Dialog state
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [creating, setCreating] = useState(false);

  // Form state
  const [formData, setFormData] = useState<Partial<CreateChallengeData>>({
    goal_type: "applications_count",
    goal_target: 10,
    goal_timeframe_days: 7,
  });

  // Joining/progress state
  const [joining, setJoining] = useState<string | null>(null);
  const [updatingProgress, setUpdatingProgress] = useState<string | null>(null);

  // Load challenges
  useEffect(() => {
    async function loadChallenges() {
      if (!user) return;

      setLoading(true);
      const result = await peerNetworkingService.getGroupChallenges(
        user.id,
        groupId
      );

      if (result.error) {
        setError(result.error.message);
      } else {
        setChallenges(result.data || []);
      }
      setLoading(false);
    }

    loadChallenges();
  }, [user, groupId]);

  // Handle creating a challenge
  const handleCreateChallenge = async () => {
    if (!user || !formData.title || !formData.goal_type || !formData.goal_target)
      return;

    setCreating(true);
    setError(null);

    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + (formData.goal_timeframe_days || 7));

    const data: CreateChallengeData = {
      group_id: groupId,
      title: formData.title || "",
      description: formData.description,
      goal_type: formData.goal_type || "applications_count",
      goal_target: formData.goal_target || 10,
      goal_timeframe_days: formData.goal_timeframe_days || 7,
      start_date: startDate.toISOString().split("T")[0],
      end_date: endDate.toISOString().split("T")[0],
    };

    const result = await peerNetworkingService.createChallenge(user.id, data);

    if (result.error) {
      setError(result.error.message);
    } else if (result.data) {
      setChallenges((prev) => [
        { ...result.data!, is_participant: false },
        ...prev,
      ]);
      setShowCreateDialog(false);
      setFormData({
        goal_type: "applications_count",
        goal_target: 10,
        goal_timeframe_days: 7,
      });
    }

    setCreating(false);
  };

  // Handle joining a challenge
  const handleJoinChallenge = async (challengeId: string) => {
    if (!user) return;

    setJoining(challengeId);

    const result = await peerNetworkingService.joinChallenge(
      user.id,
      challengeId
    );

    if (result.error) {
      setError(result.error.message);
    } else {
      setChallenges((prev) =>
        prev.map((c) =>
          c.id === challengeId
            ? {
                ...c,
                is_participant: true,
                my_progress: 0,
                my_goal_met: false,
                participant_count: c.participant_count + 1,
              }
            : c
        )
      );
    }

    setJoining(null);
  };

  // Handle updating progress
  const handleUpdateProgress = async (
    challengeId: string,
    currentProgress: number,
    goalTarget: number
  ) => {
    if (!user) return;

    // Prompt for new progress value
    const newProgressStr = window.prompt(
      `Update your progress (current: ${currentProgress}/${goalTarget}):`,
      String(currentProgress)
    );
    if (newProgressStr === null) return;

    const newProgress = parseInt(newProgressStr, 10);
    if (isNaN(newProgress) || newProgress < 0) {
      setError("Invalid progress value");
      return;
    }

    setUpdatingProgress(challengeId);

    const result = await peerNetworkingService.updateChallengeProgress(
      user.id,
      challengeId,
      newProgress
    );

    if (result.error) {
      setError(result.error.message);
    } else if (result.data) {
      setChallenges((prev) =>
        prev.map((c) =>
          c.id === challengeId
            ? {
                ...c,
                my_progress: newProgress,
                my_goal_met: newProgress >= goalTarget,
                completed_count:
                  newProgress >= goalTarget && !c.my_goal_met
                    ? c.completed_count + 1
                    : c.completed_count,
              }
            : c
        )
      );
    }

    setUpdatingProgress(null);
  };

  // Render a single challenge card
  const renderChallenge = (challenge: GroupChallengeWithProgress) => {
    const daysRemaining = getDaysRemaining(challenge.end_date);
    const progressPercent = challenge.is_participant
      ? Math.min(100, ((challenge.my_progress || 0) / challenge.goal_target) * 100)
      : 0;

    return (
      <Card key={challenge.id} sx={{ mb: 2 }}>
        <CardContent>
          {/* Header */}
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="flex-start"
            mb={2}
          >
            <Box>
              <Stack direction="row" spacing={1} alignItems="center" mb={0.5}>
                <TrophyIcon color="primary" />
                <Typography variant="h6">{challenge.title}</Typography>
              </Stack>
              <Stack direction="row" spacing={1}>
                <Chip
                  label={challenge.status}
                  size="small"
                  color={STATUS_COLORS[challenge.status] || "default"}
                />
                <Chip
                  icon={<TimerIcon />}
                  label={
                    daysRemaining > 0
                      ? `${daysRemaining} days left`
                      : "Ended"
                  }
                  size="small"
                  variant="outlined"
                />
              </Stack>
            </Box>
            <Stack alignItems="flex-end">
              <Typography variant="body2" color="text.secondary">
                {formatDate(challenge.start_date)} -{" "}
                {formatDate(challenge.end_date)}
              </Typography>
              <Chip
                label={`${challenge.participant_count} participants`}
                size="small"
              />
            </Stack>
          </Stack>

          {/* Description */}
          {challenge.description && (
            <Typography variant="body2" color="text.secondary" paragraph>
              {challenge.description}
            </Typography>
          )}

          {/* Goal */}
          <Box
            sx={{
              bgcolor: "background.default",
              p: 2,
              borderRadius: 1,
              mb: 2,
            }}
          >
            <Stack direction="row" spacing={2} alignItems="center">
              <TrendingUpIcon color="primary" />
              <Box flex={1}>
                <Typography variant="subtitle2">Challenge Goal</Typography>
                <Typography variant="body2" color="text.secondary">
                  {GOAL_TYPES.find((t) => t.value === challenge.goal_type)
                    ?.label || challenge.goal_type}
                  : <strong>{challenge.goal_target}</strong> in{" "}
                  {challenge.goal_timeframe_days} days
                </Typography>
              </Box>
              <Chip
                label={`${challenge.completed_count} completed`}
                color="success"
                variant="outlined"
                size="small"
              />
            </Stack>
          </Box>

          {/* User Progress (if participating) */}
          {challenge.is_participant && (
            <Box mb={2}>
              <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="center"
                mb={1}
              >
                <Typography variant="subtitle2">Your Progress</Typography>
                <Stack direction="row" alignItems="center" spacing={1}>
                  {challenge.my_goal_met ? (
                    <Chip
                      icon={<CheckIcon />}
                      label="Goal Met!"
                      color="success"
                      size="small"
                    />
                  ) : (
                    <Typography variant="body2">
                      {challenge.my_progress || 0} / {challenge.goal_target}
                    </Typography>
                  )}
                </Stack>
              </Stack>
              <LinearProgress
                variant="determinate"
                value={progressPercent}
                sx={{ height: 8, borderRadius: 4 }}
                color={challenge.my_goal_met ? "success" : "primary"}
              />
            </Box>
          )}

          {/* Actions */}
          <Stack direction="row" spacing={2} justifyContent="flex-end">
            {challenge.status === "active" && (
              <>
                {challenge.is_participant ? (
                  <Button
                    variant="contained"
                    onClick={() =>
                      handleUpdateProgress(
                        challenge.id,
                        challenge.my_progress || 0,
                        challenge.goal_target
                      )
                    }
                    disabled={
                      updatingProgress === challenge.id || challenge.my_goal_met
                    }
                    startIcon={
                      updatingProgress === challenge.id ? (
                        <CircularProgress size={16} />
                      ) : (
                        <TrendingUpIcon />
                      )
                    }
                  >
                    Update Progress
                  </Button>
                ) : (
                  <Button
                    variant="contained"
                    onClick={() => handleJoinChallenge(challenge.id)}
                    disabled={joining === challenge.id}
                    startIcon={
                      joining === challenge.id ? (
                        <CircularProgress size={16} />
                      ) : (
                        <AddIcon />
                      )
                    }
                  >
                    Join Challenge
                  </Button>
                )}
              </>
            )}
          </Stack>
        </CardContent>
      </Card>
    );
  };

  // Loading state
  if (loading) {
    return (
      <Box display="flex" justifyContent="center" py={4}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {/* Error Display */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Header */}
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        mb={3}
      >
        <Typography variant="h6">Group Challenges</Typography>
        {isModerator && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setShowCreateDialog(true)}
          >
            Create Challenge
          </Button>
        )}
      </Stack>

      {/* Challenges List */}
      {challenges.length === 0 ? (
        <Box textAlign="center" py={6}>
          <TrophyIcon sx={{ fontSize: 64, color: "text.secondary", mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No challenges yet
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            Challenges help the group stay accountable and motivated.
          </Typography>
          {isModerator && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setShowCreateDialog(true)}
            >
              Create the First Challenge
            </Button>
          )}
        </Box>
      ) : (
        challenges.map((challenge) => renderChallenge(challenge))
      )}

      {/* Create Challenge Dialog */}
      <Dialog
        open={showCreateDialog}
        onClose={() => setShowCreateDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Create New Challenge</DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            <TextField
              fullWidth
              label="Challenge Title"
              value={formData.title || ""}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, title: e.target.value }))
              }
              placeholder="e.g., 7-Day Application Sprint"
            />
            <TextField
              fullWidth
              multiline
              rows={2}
              label="Description (optional)"
              value={formData.description || ""}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  description: e.target.value,
                }))
              }
            />
            <FormControl fullWidth>
              <InputLabel>Goal Type</InputLabel>
              <Select
                value={formData.goal_type || "applications_count"}
                label="Goal Type"
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    goal_type: e.target.value,
                  }))
                }
              >
                {GOAL_TYPES.map((type) => (
                  <MenuItem key={type.value} value={type.value}>
                    {type.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  type="number"
                  label="Goal Target"
                  value={formData.goal_target || 10}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      goal_target: parseInt(e.target.value, 10),
                    }))
                  }
                  inputProps={{ min: 1 }}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  type="number"
                  label="Duration (days)"
                  value={formData.goal_timeframe_days || 7}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      goal_timeframe_days: parseInt(e.target.value, 10),
                    }))
                  }
                  inputProps={{ min: 1, max: 90 }}
                />
              </Grid>
            </Grid>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowCreateDialog(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleCreateChallenge}
            disabled={!formData.title || creating}
            startIcon={creating ? <CircularProgress size={20} /> : <AddIcon />}
          >
            Create Challenge
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
