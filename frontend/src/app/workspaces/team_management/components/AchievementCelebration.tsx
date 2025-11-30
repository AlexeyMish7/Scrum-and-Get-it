/**
 * ACHIEVEMENT CELEBRATION COMPONENT (UC-111)
 *
 * Purpose:
 * - Display celebratory UI when users hit milestones
 * - Show achievement badges and encouragement messages
 * - Provide optional confetti animation for major achievements
 * - Allow team members to send congratulations
 *
 * Celebration Types:
 * - first_application: First job application submitted
 * - interview_milestone: Reached interview stage
 * - offer_received: Received a job offer
 * - goal_streak: Completed weekly goals X weeks in a row
 * - team_support: Received support from accountability partners
 *
 * Used by:
 * - CandidateProgressPage for personal celebrations
 * - TeamProgressOverview for team-wide celebrations
 * - Notification system for real-time celebration alerts
 */

import { useState, useEffect, useCallback } from "react";
import {
  Box,
  Stack,
  Typography,
  Paper,
  IconButton,
  Button,
  Avatar,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  TextField,
  Skeleton,
  Fade,
  Zoom,
} from "@mui/material";
import {
  EmojiEvents as TrophyIcon,
  Celebration as CelebrationIcon,
  ThumbUp as ThumbUpIcon,
  Comment as CommentIcon,
  Close as CloseIcon,
  Star as StarIcon,
  WorkOutline as ApplicationIcon,
  EventAvailable as InterviewIcon,
  LocalOffer as OfferIcon,
  TrendingUp as StreakIcon,
  Favorite as SupportIcon,
} from "@mui/icons-material";
import { useAuth } from "@shared/context/AuthContext";
import * as progressService from "../services/progressSharingService";
import type { AchievementCelebration as CelebrationData } from "../services/progressSharingService";

// ============================================================================
// TYPES
// ============================================================================

interface AchievementCelebrationProps {
  // Celebration data
  celebration?: CelebrationData;
  // User who achieved (for team view)
  achieverInfo?: {
    userId: string;
    firstName: string;
    lastName: string;
    avatarUrl?: string;
  };
  // Whether this is the current user's own achievement
  isOwnAchievement?: boolean;
  // Compact mode for lists
  compact?: boolean;
  // Show confetti animation
  showConfetti?: boolean;
  // Callback when celebration is acknowledged
  onAcknowledge?: () => void;
  // Callback when user sends congratulations
  onCongratulate?: (message: string) => void;
}

// Configuration for different celebration types
interface CelebrationConfig {
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  title: string;
  defaultMessage: string;
  confettiColors?: string[];
}

// ============================================================================
// CELEBRATION CONFIGURATIONS
// ============================================================================

const CELEBRATION_CONFIGS: Record<string, CelebrationConfig> = {
  first_application: {
    icon: <ApplicationIcon sx={{ fontSize: 32 }} />,
    color: "#1976d2",
    bgColor: "#e3f2fd",
    title: "First Application Submitted!",
    defaultMessage:
      "You've taken the first step in your job search journey. Keep the momentum going!",
    confettiColors: ["#1976d2", "#42a5f5", "#90caf9"],
  },
  interview_milestone: {
    icon: <InterviewIcon sx={{ fontSize: 32 }} />,
    color: "#9c27b0",
    bgColor: "#f3e5f5",
    title: "Interview Scheduled!",
    defaultMessage:
      "Your hard work is paying off! An employer wants to learn more about you.",
    confettiColors: ["#9c27b0", "#ba68c8", "#ce93d8"],
  },
  offer_received: {
    icon: <OfferIcon sx={{ fontSize: 32 }} />,
    color: "#2e7d32",
    bgColor: "#e8f5e9",
    title: "Offer Received! 🎉",
    defaultMessage:
      "Congratulations! All your preparation and effort have led to this amazing moment!",
    confettiColors: ["#2e7d32", "#66bb6a", "#a5d6a7", "#ffd700"],
  },
  goal_streak: {
    icon: <StreakIcon sx={{ fontSize: 32 }} />,
    color: "#ed6c02",
    bgColor: "#fff3e0",
    title: "Goal Streak Achieved!",
    defaultMessage:
      "You're on fire! Consistency is key to success in your job search.",
    confettiColors: ["#ed6c02", "#ff9800", "#ffb74d"],
  },
  team_support: {
    icon: <SupportIcon sx={{ fontSize: 32 }} />,
    color: "#d32f2f",
    bgColor: "#ffebee",
    title: "Team Support Received!",
    defaultMessage:
      "Your team is cheering you on! You're not alone in this journey.",
    confettiColors: ["#d32f2f", "#ef5350", "#e57373"],
  },
  custom: {
    icon: <StarIcon sx={{ fontSize: 32 }} />,
    color: "#ffc107",
    bgColor: "#fffde7",
    title: "Achievement Unlocked!",
    defaultMessage: "Great job! Every step forward counts.",
    confettiColors: ["#ffc107", "#ffca28", "#ffd54f"],
  },
};

// ============================================================================
// CONFETTI COMPONENT (Simple CSS-based confetti)
// ============================================================================

function ConfettiAnimation({ colors }: { colors: string[] }) {
  // Generate random confetti pieces
  const pieces = Array.from({ length: 50 }, (_, i) => ({
    id: i,
    color: colors[Math.floor(Math.random() * colors.length)],
    left: Math.random() * 100,
    delay: Math.random() * 2,
    duration: 2 + Math.random() * 2,
    size: 5 + Math.random() * 10,
    rotation: Math.random() * 360,
  }));

  return (
    <Box
      sx={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        pointerEvents: "none",
        zIndex: 9999,
        overflow: "hidden",
      }}
    >
      {pieces.map((piece) => (
        <Box
          key={piece.id}
          sx={{
            position: "absolute",
            left: `${piece.left}%`,
            top: -20,
            width: piece.size,
            height: piece.size * 1.5,
            backgroundColor: piece.color,
            transform: `rotate(${piece.rotation}deg)`,
            animation: `confettiFall ${piece.duration}s ease-out ${piece.delay}s forwards`,
            "@keyframes confettiFall": {
              "0%": {
                transform: `translateY(0) rotate(${piece.rotation}deg)`,
                opacity: 1,
              },
              "100%": {
                transform: `translateY(100vh) rotate(${
                  piece.rotation + 720
                }deg)`,
                opacity: 0,
              },
            },
          }}
        />
      ))}
    </Box>
  );
}

// ============================================================================
// CONGRATULATIONS DIALOG
// ============================================================================

function CongratulationsDialog({
  open,
  onClose,
  achieverName,
  onSend,
}: {
  open: boolean;
  onClose: () => void;
  achieverName: string;
  onSend: (message: string) => void;
}) {
  const [message, setMessage] = useState("");

  const quickMessages = [
    "Congratulations! 🎉",
    "Amazing work! Keep it up! 💪",
    "So proud of you! 🌟",
    "You're crushing it! 🔥",
    "Well deserved! 👏",
  ];

  const handleSend = () => {
    if (message.trim()) {
      onSend(message);
      setMessage("");
      onClose();
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        Send Congratulations to {achieverName}
        <IconButton
          onClick={onClose}
          sx={{ position: "absolute", right: 8, top: 8 }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <Typography variant="body2" color="text.secondary">
            Quick messages:
          </Typography>
          <Stack direction="row" flexWrap="wrap" gap={1}>
            {quickMessages.map((msg) => (
              <Chip
                key={msg}
                label={msg}
                onClick={() => setMessage(msg)}
                variant={message === msg ? "filled" : "outlined"}
                color="primary"
                size="small"
                sx={{ cursor: "pointer" }}
              />
            ))}
          </Stack>
          <TextField
            label="Or write your own message"
            multiline
            rows={3}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Share your encouragement..."
            fullWidth
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          onClick={handleSend}
          variant="contained"
          disabled={!message.trim()}
          startIcon={<ThumbUpIcon />}
        >
          Send
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function AchievementCelebration({
  celebration,
  achieverInfo,
  isOwnAchievement = true,
  compact = false,
  showConfetti = false,
  onAcknowledge,
  onCongratulate,
}: AchievementCelebrationProps) {
  // State
  const [showCongratulationsDialog, setShowCongratulationsDialog] =
    useState(false);
  const [isConfettiActive, setIsConfettiActive] = useState(showConfetti);
  const [liked, setLiked] = useState(false);

  // Get config based on celebration type (using correct property name)
  const config =
    CELEBRATION_CONFIGS[celebration?.celebrationType || "custom"] ||
    CELEBRATION_CONFIGS.custom;

  // Auto-stop confetti after animation
  useEffect(() => {
    if (isConfettiActive) {
      const timer = setTimeout(() => {
        setIsConfettiActive(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [isConfettiActive]);

  // Handle like/thumbs up
  const handleLike = useCallback(() => {
    setLiked(true);
    // Could call API to record the like
  }, []);

  // Handle congratulate
  const handleCongratulate = useCallback(
    (message: string) => {
      onCongratulate?.(message);
    },
    [onCongratulate]
  );

  // Render loading skeleton
  if (!celebration) {
    return (
      <Paper sx={{ p: compact ? 2 : 3 }}>
        <Stack direction="row" spacing={2} alignItems="center">
          <Skeleton variant="circular" width={48} height={48} />
          <Box sx={{ flex: 1 }}>
            <Skeleton variant="text" width="60%" />
            <Skeleton variant="text" width="80%" />
          </Box>
        </Stack>
      </Paper>
    );
  }

  // Compact view for lists
  if (compact) {
    return (
      <Paper
        variant="outlined"
        sx={{
          p: 2,
          bgcolor: config.bgColor,
          borderColor: config.color,
          transition: "all 0.2s ease",
          "&:hover": {
            boxShadow: 2,
          },
        }}
      >
        <Stack direction="row" spacing={2} alignItems="center">
          {/* Achievement icon */}
          <Avatar
            sx={{
              bgcolor: config.color,
              width: 40,
              height: 40,
            }}
          >
            {config.icon}
          </Avatar>

          {/* Content */}
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Stack direction="row" alignItems="center" spacing={1}>
              {achieverInfo && !isOwnAchievement && (
                <Typography variant="body2" fontWeight="medium">
                  {achieverInfo.firstName} {achieverInfo.lastName}
                </Typography>
              )}
              <Typography variant="body2" color="text.secondary">
                {config.title}
              </Typography>
            </Stack>
            {celebration.description && (
              <Typography variant="caption" color="text.secondary" noWrap>
                {celebration.description}
              </Typography>
            )}
          </Box>

          {/* Quick actions */}
          {!isOwnAchievement && (
            <IconButton
              size="small"
              color={liked ? "primary" : "default"}
              onClick={handleLike}
            >
              <ThumbUpIcon fontSize="small" />
            </IconButton>
          )}
        </Stack>
      </Paper>
    );
  }

  // Full view
  return (
    <>
      {/* Confetti animation */}
      {isConfettiActive && config.confettiColors && (
        <ConfettiAnimation colors={config.confettiColors} />
      )}

      <Zoom in timeout={500}>
        <Paper
          elevation={3}
          sx={{
            p: 3,
            bgcolor: config.bgColor,
            borderLeft: `4px solid ${config.color}`,
            position: "relative",
            overflow: "hidden",
          }}
        >
          <Stack spacing={3}>
            {/* Header with icon and title */}
            <Stack direction="row" alignItems="center" spacing={2}>
              <Fade in timeout={800}>
                <Avatar
                  sx={{
                    bgcolor: config.color,
                    width: 64,
                    height: 64,
                    animation: "pulse 2s infinite",
                    "@keyframes pulse": {
                      "0%": { boxShadow: `0 0 0 0 ${config.color}40` },
                      "70%": { boxShadow: `0 0 0 15px ${config.color}00` },
                      "100%": { boxShadow: `0 0 0 0 ${config.color}00` },
                    },
                  }}
                >
                  {config.icon}
                </Avatar>
              </Fade>

              <Box sx={{ flex: 1 }}>
                <Stack direction="row" alignItems="center" spacing={1}>
                  <CelebrationIcon sx={{ color: config.color, fontSize: 20 }} />
                  <Typography
                    variant="h5"
                    fontWeight="bold"
                    sx={{ color: config.color }}
                  >
                    {config.title}
                  </Typography>
                </Stack>

                {achieverInfo && !isOwnAchievement && (
                  <Stack
                    direction="row"
                    alignItems="center"
                    spacing={1}
                    sx={{ mt: 0.5 }}
                  >
                    <Avatar
                      src={achieverInfo.avatarUrl}
                      sx={{ width: 24, height: 24 }}
                    >
                      {achieverInfo.firstName[0]}
                    </Avatar>
                    <Typography variant="body2" color="text.secondary">
                      {achieverInfo.firstName} {achieverInfo.lastName}
                    </Typography>
                  </Stack>
                )}
              </Box>

              {/* Close/acknowledge button for own achievements */}
              {isOwnAchievement && onAcknowledge && (
                <IconButton onClick={onAcknowledge}>
                  <CloseIcon />
                </IconButton>
              )}
            </Stack>

            {/* Message - using description or title from celebration */}
            <Typography variant="body1" sx={{ color: "text.primary" }}>
              {celebration.description || config.defaultMessage}
            </Typography>

            {/* Achievement details - show milestone value if present */}
            {celebration.milestoneValue && (
              <Paper
                variant="outlined"
                sx={{ p: 2, bgcolor: "background.paper" }}
              >
                <Stack direction="row" spacing={3} flexWrap="wrap">
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Milestone Reached
                    </Typography>
                    <Typography variant="h6" fontWeight="medium">
                      {celebration.milestoneValue}
                    </Typography>
                  </Box>
                </Stack>
              </Paper>
            )}

            {/* Action buttons */}
            <Stack direction="row" spacing={2} justifyContent="flex-end">
              {/* Like button for team view */}
              {!isOwnAchievement && (
                <>
                  <Button
                    variant={liked ? "contained" : "outlined"}
                    color="primary"
                    startIcon={<ThumbUpIcon />}
                    onClick={handleLike}
                    disabled={liked}
                  >
                    {liked ? "Liked!" : "Like"}
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<CommentIcon />}
                    onClick={() => setShowCongratulationsDialog(true)}
                  >
                    Congratulate
                  </Button>
                </>
              )}

              {/* Replay confetti for own achievements */}
              {isOwnAchievement && config.confettiColors && (
                <Button
                  variant="outlined"
                  startIcon={<CelebrationIcon />}
                  onClick={() => setIsConfettiActive(true)}
                  disabled={isConfettiActive}
                >
                  Celebrate Again!
                </Button>
              )}

              {/* Acknowledge button */}
              {isOwnAchievement && onAcknowledge && (
                <Button variant="contained" onClick={onAcknowledge}>
                  Awesome!
                </Button>
              )}
            </Stack>
          </Stack>

          {/* Decorative trophy in corner */}
          <TrophyIcon
            sx={{
              position: "absolute",
              right: -20,
              bottom: -20,
              fontSize: 120,
              color: config.color,
              opacity: 0.1,
              transform: "rotate(-15deg)",
            }}
          />
        </Paper>
      </Zoom>

      {/* Congratulations dialog */}
      {achieverInfo && (
        <CongratulationsDialog
          open={showCongratulationsDialog}
          onClose={() => setShowCongratulationsDialog(false)}
          achieverName={`${achieverInfo.firstName} ${achieverInfo.lastName}`}
          onSend={handleCongratulate}
        />
      )}
    </>
  );
}

// ============================================================================
// ACHIEVEMENT LIST COMPONENT
// ============================================================================

interface AchievementListProps {
  teamId: string;
  limit?: number;
  showOwnOnly?: boolean;
}

export function AchievementList({
  teamId,
  limit = 10,
  showOwnOnly = false,
}: AchievementListProps) {
  const { user } = useAuth();
  const [celebrations, setCelebrations] = useState<CelebrationData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadCelebrations() {
      if (!teamId) return;

      setLoading(true);
      setError(null);

      // Use getTeamAchievements from progressService (correct function name)
      const result = await progressService.getTeamAchievements(teamId, limit);

      if (result.error) {
        setError(result.error.message);
      } else if (result.data) {
        // Filter to own only if requested (use userId, not user_id)
        const filtered = showOwnOnly
          ? result.data.filter((c: CelebrationData) => c.userId === user?.id)
          : result.data;
        setCelebrations(filtered);
      }

      setLoading(false);
    }

    loadCelebrations();
  }, [teamId, limit, showOwnOnly, user?.id]);

  if (loading) {
    return (
      <Stack spacing={2}>
        {[1, 2, 3].map((n) => (
          <Skeleton key={n} variant="rounded" height={80} />
        ))}
      </Stack>
    );
  }

  if (error) {
    return (
      <Typography color="error" textAlign="center">
        {error}
      </Typography>
    );
  }

  if (celebrations.length === 0) {
    return (
      <Paper sx={{ p: 4, textAlign: "center" }}>
        <TrophyIcon sx={{ fontSize: 48, color: "text.disabled", mb: 2 }} />
        <Typography color="text.secondary">
          No celebrations yet. Keep working towards your goals!
        </Typography>
      </Paper>
    );
  }

  return (
    <List disablePadding>
      {celebrations.map((celebration) => (
        <ListItem key={celebration.id} disablePadding sx={{ mb: 2 }}>
          <AchievementCelebration
            celebration={celebration}
            isOwnAchievement={celebration.userId === user?.id}
            compact
          />
        </ListItem>
      ))}
    </List>
  );
}

export default AchievementCelebration;
