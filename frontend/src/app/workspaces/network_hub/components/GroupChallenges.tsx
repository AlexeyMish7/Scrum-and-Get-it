/**
 * GROUP CHALLENGES COMPONENT
 *
 * Displays and manages group challenges with progress tracking and leaderboards.
 * Supports different challenge types (applications, networking, interviews, learning).
 *
 * Features:
 * - View active and upcoming challenges
 * - Join challenges and track progress
 * - Real-time leaderboard updates
 * - Celebrate completions with badges
 */

import { useState, useEffect, useCallback } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  Stack,
  LinearProgress,
  Avatar,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Tabs,
  Tab,
  Paper,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
} from "@mui/material";
import {
  EmojiEvents as TrophyIcon,
  Flag as FlagIcon,
  Timer as TimerIcon,
  Add as AddIcon,
  Check as CheckIcon,
  PlayArrow as PlayIcon,
  Schedule as ScheduleIcon,
  Leaderboard as LeaderboardIcon,
} from "@mui/icons-material";
import { useAuth } from "@shared/context/AuthContext";
import {
  getGroupChallenges,
  joinChallenge,
  updateChallengeProgress,
  getChallengeLeaderboard,
} from "../services/peerGroupsService";
import type {
  ChallengeWithParticipation,
  PeerChallengeStatus,
  ChallengeLeaderboardEntry,
} from "../types/peerGroups.types";
import { CHALLENGE_TYPE_INFO } from "../types/peerGroups.types";

// ============================================================================
// PROPS AND TYPES
// ============================================================================

interface GroupChallengesProps {
  groupId: string;
}

interface ChallengeCardProps {
  challenge: ChallengeWithParticipation;
  onJoin: (challengeId: string) => void;
  onUpdateProgress: (challengeId: string) => void;
  onViewLeaderboard: (challengeId: string) => void;
  isJoining: boolean;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function getDaysRemaining(endDate: string): number {
  const end = new Date(endDate);
  const now = new Date();
  const diff = end.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function getProgressPercentage(current: number, target: number): number {
  return Math.min(100, Math.round((current / target) * 100));
}

function getStatusColor(
  status: PeerChallengeStatus
): "success" | "primary" | "warning" | "default" {
  switch (status) {
    case "active":
      return "success";
    case "upcoming":
      return "primary";
    case "completed":
      return "default";
    case "cancelled":
      return "warning";
    default:
      return "default";
  }
}

// ============================================================================
// CHALLENGE CARD COMPONENT
// ============================================================================

function ChallengeCard({
  challenge,
  onJoin,
  onUpdateProgress,
  onViewLeaderboard,
  isJoining,
}: ChallengeCardProps) {
  const typeInfo = CHALLENGE_TYPE_INFO[challenge.challenge_type] || {
    label: challenge.challenge_type,
    icon: "🎯",
    unit: "count",
  };

  const daysRemaining = getDaysRemaining(challenge.end_date);
  const isActive = challenge.status === "active";
  const isUpcoming = challenge.status === "upcoming";
  const isCompleted = challenge.status === "completed";

  // Calculate progress if participating
  const currentValue = challenge.participation?.current_value || 0;
  const progressPercent = getProgressPercentage(
    currentValue,
    challenge.target_value
  );
  const hasCompletedChallenge = challenge.participation?.status === "completed";

  return (
    <Card
      sx={{
        mb: 2,
        border: hasCompletedChallenge ? "2px solid" : "none",
        borderColor: hasCompletedChallenge ? "success.main" : undefined,
      }}
    >
      <CardContent>
        {/* Challenge header */}
        <Box sx={{ display: "flex", alignItems: "flex-start", mb: 2 }}>
          <Avatar
            sx={{
              bgcolor: isCompleted
                ? "grey.300"
                : isActive
                ? "success.light"
                : "primary.light",
              width: 48,
              height: 48,
              fontSize: "1.5rem",
            }}
          >
            {typeInfo.icon}
          </Avatar>
          <Box sx={{ ml: 2, flexGrow: 1 }}>
            <Typography variant="h6">{challenge.title}</Typography>
            <Box
              sx={{ display: "flex", alignItems: "center", gap: 1, mt: 0.5 }}
            >
              <Chip
                label={typeInfo.label}
                size="small"
                sx={{ fontSize: "0.7rem" }}
              />
              <Chip
                label={challenge.status}
                size="small"
                color={getStatusColor(challenge.status)}
                sx={{ fontSize: "0.7rem" }}
              />
              {hasCompletedChallenge && (
                <Chip
                  icon={<TrophyIcon sx={{ fontSize: "14px !important" }} />}
                  label="Completed!"
                  size="small"
                  color="success"
                  sx={{ fontSize: "0.7rem" }}
                />
              )}
            </Box>
          </Box>
          <Box sx={{ textAlign: "right" }}>
            <Typography
              variant="caption"
              color="text.secondary"
              display="block"
            >
              {formatDate(challenge.start_date)} -{" "}
              {formatDate(challenge.end_date)}
            </Typography>
            {isActive && (
              <Chip
                icon={<TimerIcon sx={{ fontSize: "14px !important" }} />}
                label={`${daysRemaining} days left`}
                size="small"
                variant="outlined"
                color={daysRemaining <= 3 ? "warning" : "default"}
              />
            )}
          </Box>
        </Box>

        {/* Description */}
        {challenge.description && (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {challenge.description}
          </Typography>
        )}

        {/* Target info */}
        <Paper variant="outlined" sx={{ p: 2, mb: 2, bgcolor: "grey.50" }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
            <Typography variant="body2">
              <FlagIcon
                sx={{ fontSize: 16, mr: 0.5, verticalAlign: "middle" }}
              />
              Target:{" "}
              <strong>
                {challenge.target_value} {typeInfo.unit}
              </strong>
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {challenge.participant_count} participants
            </Typography>
          </Box>

          {/* Progress bar (if participating) */}
          {challenge.is_participating && (
            <>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  mb: 0.5,
                }}
              >
                <Typography variant="caption">
                  Your progress: {currentValue} / {challenge.target_value}{" "}
                  {typeInfo.unit}
                </Typography>
                <Typography variant="caption" color="primary">
                  {progressPercent}%
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={progressPercent}
                color={hasCompletedChallenge ? "success" : "primary"}
                sx={{ height: 8, borderRadius: 4 }}
              />
            </>
          )}
        </Paper>

        {/* Badge info */}
        {challenge.badge_name && (
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
              mb: 2,
              p: 1,
              bgcolor: "warning.light",
              borderRadius: 1,
            }}
          >
            <TrophyIcon sx={{ color: "warning.dark" }} />
            <Typography variant="body2">
              Complete to earn: <strong>{challenge.badge_name}</strong>
              {challenge.badge_icon && ` ${challenge.badge_icon}`}
            </Typography>
          </Box>
        )}

        {/* Actions */}
        <Box sx={{ display: "flex", gap: 1, justifyContent: "flex-end" }}>
          <Button
            size="small"
            startIcon={<LeaderboardIcon />}
            onClick={() => onViewLeaderboard(challenge.id)}
          >
            Leaderboard
          </Button>

          {isActive && challenge.is_participating && !hasCompletedChallenge && (
            <Button
              variant="contained"
              size="small"
              startIcon={<AddIcon />}
              onClick={() => onUpdateProgress(challenge.id)}
            >
              Log Progress
            </Button>
          )}

          {(isActive || isUpcoming) && !challenge.is_participating && (
            <Button
              variant="contained"
              size="small"
              startIcon={
                isJoining ? (
                  <CircularProgress size={16} color="inherit" />
                ) : (
                  <PlayIcon />
                )
              }
              onClick={() => onJoin(challenge.id)}
              disabled={isJoining}
            >
              {isUpcoming ? "Pre-register" : "Join Challenge"}
            </Button>
          )}
        </Box>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// LEADERBOARD DIALOG
// ============================================================================

interface LeaderboardDialogProps {
  open: boolean;
  onClose: () => void;
  challengeId: string | null;
  challengeTitle: string;
}

function LeaderboardDialog({
  open,
  onClose,
  challengeId,
  challengeTitle,
}: LeaderboardDialogProps) {
  const [leaderboard, setLeaderboard] = useState<ChallengeLeaderboardEntry[]>(
    []
  );
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !challengeId) return;

    async function fetchLeaderboard() {
      setLoading(true);
      const result = await getChallengeLeaderboard(challengeId!, 10);
      if (result.data) {
        setLeaderboard(result.data);
      }
      setLoading(false);
    }

    fetchLeaderboard();
  }, [open, challengeId]);

  const getMedalEmoji = (rank: number) => {
    switch (rank) {
      case 1:
        return "🥇";
      case 2:
        return "🥈";
      case 3:
        return "🥉";
      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <LeaderboardIcon color="primary" />
          Leaderboard - {challengeTitle}
        </Box>
      </DialogTitle>
      <DialogContent>
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
            <CircularProgress />
          </Box>
        ) : leaderboard.length === 0 ? (
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ textAlign: "center", py: 4 }}
          >
            No participants yet. Be the first to join!
          </Typography>
        ) : (
          <List>
            {leaderboard.map((entry) => (
              <ListItem
                key={entry.user_id}
                sx={{
                  bgcolor: entry.rank <= 3 ? "primary.light" : undefined,
                  borderRadius: 1,
                  mb: 0.5,
                }}
              >
                <ListItemAvatar>
                  <Avatar
                    sx={{
                      bgcolor:
                        entry.rank === 1
                          ? "warning.main"
                          : entry.rank === 2
                          ? "grey.400"
                          : entry.rank === 3
                          ? "#cd7f32"
                          : "primary.main",
                    }}
                  >
                    {getMedalEmoji(entry.rank) || `#${entry.rank}`}
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={entry.display_name}
                  secondary={`${entry.current_value} completed`}
                />
                <Typography variant="h6" color="primary">
                  #{entry.rank}
                </Typography>
              </ListItem>
            ))}
          </List>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}

// ============================================================================
// PROGRESS DIALOG
// ============================================================================

interface ProgressDialogProps {
  open: boolean;
  onClose: () => void;
  challengeId: string | null;
  challengeTitle: string;
  targetUnit: string;
  onSubmit: (challengeId: string, value: number, note?: string) => void;
}

function ProgressDialog({
  open,
  onClose,
  challengeId,
  challengeTitle,
  targetUnit,
  onSubmit,
}: ProgressDialogProps) {
  const [value, setValue] = useState("");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!challengeId || !value) return;

    setSubmitting(true);
    await onSubmit(challengeId, parseInt(value), note.trim() || undefined);
    setValue("");
    setNote("");
    setSubmitting(false);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Log Progress - {challengeTitle}</DialogTitle>
      <DialogContent>
        <Box sx={{ pt: 1 }}>
          <TextField
            fullWidth
            type="number"
            label={`How many ${targetUnit} did you complete?`}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            inputProps={{ min: 1 }}
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            multiline
            rows={2}
            label="Notes (optional)"
            placeholder="Add any context about your progress..."
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={!value || submitting}
          startIcon={
            submitting ? <CircularProgress size={16} /> : <CheckIcon />
          }
        >
          {submitting ? "Saving..." : "Log Progress"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function GroupChallenges({ groupId }: GroupChallengesProps) {
  const { user } = useAuth();
  const [challenges, setChallenges] = useState<ChallengeWithParticipation[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState(0);
  const [joiningChallengeId, setJoiningChallengeId] = useState<string | null>(
    null
  );

  // Dialog states
  const [leaderboardDialog, setLeaderboardDialog] = useState<{
    open: boolean;
    challengeId: string | null;
    title: string;
  }>({ open: false, challengeId: null, title: "" });

  const [progressDialog, setProgressDialog] = useState<{
    open: boolean;
    challengeId: string | null;
    title: string;
    unit: string;
  }>({ open: false, challengeId: null, title: "", unit: "" });

  const userId = user?.id;

  // Fetch challenges
  const fetchChallenges = useCallback(async () => {
    if (!userId) return;

    setLoading(true);
    setError(null);

    const result = await getGroupChallenges(userId, groupId);

    if (result.error) {
      setError(result.error.message);
    } else {
      setChallenges(result.data || []);
    }
    setLoading(false);
  }, [userId, groupId]);

  useEffect(() => {
    fetchChallenges();
  }, [fetchChallenges]);

  // Filter challenges by status
  const activeChallenges = challenges.filter((c) => c.status === "active");
  const upcomingChallenges = challenges.filter((c) => c.status === "upcoming");
  const completedChallenges = challenges.filter(
    (c) => c.status === "completed"
  );
  const myChallenges = challenges.filter((c) => c.is_participating);

  // Handle joining a challenge
  async function handleJoinChallenge(challengeId: string) {
    if (!userId) return;

    setJoiningChallengeId(challengeId);
    const result = await joinChallenge(userId, challengeId);

    if (result.error) {
      setError(result.error.message);
    } else {
      // Refresh to update participation status
      fetchChallenges();
    }
    setJoiningChallengeId(null);
  }

  // Handle updating progress
  async function handleUpdateProgress(
    challengeId: string,
    value: number,
    note?: string
  ) {
    if (!userId) return;

    const result = await updateChallengeProgress(userId, {
      challenge_id: challengeId,
      value,
      note,
    });

    if (result.error) {
      setError(result.error.message);
    } else {
      // Refresh to update progress
      fetchChallenges();
    }
  }

  // Open progress dialog
  function openProgressDialog(challengeId: string) {
    const challenge = challenges.find((c) => c.id === challengeId);
    if (!challenge) return;

    const typeInfo = CHALLENGE_TYPE_INFO[challenge.challenge_type];
    setProgressDialog({
      open: true,
      challengeId,
      title: challenge.title,
      unit: typeInfo?.unit || "count",
    });
  }

  // Open leaderboard dialog
  function openLeaderboardDialog(challengeId: string) {
    const challenge = challenges.find((c) => c.id === challengeId);
    if (!challenge) return;

    setLeaderboardDialog({
      open: true,
      challengeId,
      title: challenge.title,
    });
  }

  if (!userId) {
    return (
      <Alert severity="warning">Please log in to view group challenges.</Alert>
    );
  }

  const getChallengesForTab = () => {
    switch (activeTab) {
      case 0:
        return activeChallenges;
      case 1:
        return upcomingChallenges;
      case 2:
        return completedChallenges;
      case 3:
        return myChallenges;
      default:
        return [];
    }
  };

  const tabChallenges = getChallengesForTab();

  return (
    <Box>
      {/* Error alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Tabs */}
      <Tabs
        value={activeTab}
        onChange={(_, newValue) => setActiveTab(newValue)}
        sx={{ mb: 3 }}
      >
        <Tab
          icon={<PlayIcon />}
          iconPosition="start"
          label={`Active (${activeChallenges.length})`}
        />
        <Tab
          icon={<ScheduleIcon />}
          iconPosition="start"
          label={`Upcoming (${upcomingChallenges.length})`}
        />
        <Tab
          icon={<CheckIcon />}
          iconPosition="start"
          label={`Completed (${completedChallenges.length})`}
        />
        <Tab
          icon={<TrophyIcon />}
          iconPosition="start"
          label={`My Challenges (${myChallenges.length})`}
        />
      </Tabs>

      {/* Challenge list */}
      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
          <CircularProgress />
        </Box>
      ) : tabChallenges.length === 0 ? (
        <Card sx={{ p: 4, textAlign: "center" }}>
          <TrophyIcon sx={{ fontSize: 64, color: "text.secondary", mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            {activeTab === 0
              ? "No active challenges"
              : activeTab === 1
              ? "No upcoming challenges"
              : activeTab === 2
              ? "No completed challenges yet"
              : "You haven't joined any challenges"}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {activeTab === 3
              ? "Join a challenge to track your progress and compete with peers!"
              : "Check back soon for new challenges."}
          </Typography>
        </Card>
      ) : (
        <Stack spacing={2}>
          {tabChallenges.map((challenge) => (
            <ChallengeCard
              key={challenge.id}
              challenge={challenge}
              onJoin={handleJoinChallenge}
              onUpdateProgress={openProgressDialog}
              onViewLeaderboard={openLeaderboardDialog}
              isJoining={joiningChallengeId === challenge.id}
            />
          ))}
        </Stack>
      )}

      {/* Leaderboard Dialog */}
      <LeaderboardDialog
        open={leaderboardDialog.open}
        onClose={() =>
          setLeaderboardDialog({ open: false, challengeId: null, title: "" })
        }
        challengeId={leaderboardDialog.challengeId}
        challengeTitle={leaderboardDialog.title}
      />

      {/* Progress Dialog */}
      <ProgressDialog
        open={progressDialog.open}
        onClose={() =>
          setProgressDialog({
            open: false,
            challengeId: null,
            title: "",
            unit: "",
          })
        }
        challengeId={progressDialog.challengeId}
        challengeTitle={progressDialog.title}
        targetUnit={progressDialog.unit}
        onSubmit={handleUpdateProgress}
      />
    </Box>
  );
}
