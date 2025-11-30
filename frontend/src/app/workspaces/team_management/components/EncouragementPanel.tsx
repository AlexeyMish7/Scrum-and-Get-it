/**
 * ENCOURAGEMENT PANEL COMPONENT (UC-111)
 *
 * Purpose:
 * - Display received encouragements
 * - Send encouragement messages to teammates
 * - Celebrate milestones and achievements
 * - Check-in with accountability partners
 *
 * Used by:
 * - ProgressSharingPage for encouragement display
 * - TeamDashboard for quick encouragement actions
 */

import { useState, useEffect } from "react";
import {
  Paper,
  Stack,
  Typography,
  Box,
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
  Chip,
  Badge,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Tooltip,
  Alert,
} from "@mui/material";
import {
  Favorite as HeartIcon,
  Send as SendIcon,
  Celebration as CelebrationIcon,
  ThumbUp as ThumbUpIcon,
  EmojiEmotions as EmojiIcon,
  Chat as ChatIcon,
  MarkEmailRead as ReadIcon,
  MarkEmailUnread as UnreadIcon,
  Person as PersonIcon,
} from "@mui/icons-material";
import { useTeam } from "@shared/context/useTeam";
import { useAuth } from "@shared/context/AuthContext";
import * as progressService from "../services/progressSharingService";
import type {
  EncouragementWithSender,
  EncouragementType,
  SendEncouragementData,
} from "../types/progress.types";

// ============================================================================
// TYPES
// ============================================================================

interface EncouragementPanelProps {
  limit?: number;
  onEncouragementSent?: () => void;
}

// ============================================================================
// CONSTANTS
// ============================================================================

// Maximum quick messages to display
const MAX_QUICK_MESSAGES = 3;

const ENCOURAGEMENT_TYPES: {
  value: EncouragementType;
  label: string;
  icon: React.ReactNode;
  color: string;
}[] = [
  {
    value: "encouragement",
    label: "Encouragement",
    icon: <HeartIcon />,
    color: "error.main",
  },
  {
    value: "congratulation",
    label: "Congratulations",
    icon: <CelebrationIcon />,
    color: "warning.main",
  },
  {
    value: "milestone_celebration",
    label: "Milestone Celebration",
    icon: <CelebrationIcon />,
    color: "success.main",
  },
  {
    value: "goal_cheer",
    label: "Goal Cheer",
    icon: <ThumbUpIcon />,
    color: "primary.main",
  },
  {
    value: "motivation",
    label: "Motivation",
    icon: <EmojiIcon />,
    color: "info.main",
  },
  {
    value: "check_in",
    label: "Check-in",
    icon: <ChatIcon />,
    color: "secondary.main",
  },
];

const QUICK_MESSAGES: Record<EncouragementType, string[]> = {
  encouragement: [
    "Keep going, you're doing great!",
    "Believe in yourself - you've got this!",
    "Every application gets you closer to your goal!",
    "Don't give up, your persistence will pay off!",
  ],
  congratulation: [
    "Congratulations on your achievement!",
    "Amazing work! So proud of you!",
    "You earned this! Well done!",
    "Incredible accomplishment! 🎉",
  ],
  milestone_celebration: [
    "What an amazing milestone! Celebrate this win!",
    "You've reached a new level! Keep climbing!",
    "This milestone shows your dedication!",
  ],
  goal_cheer: [
    "You're crushing your goals!",
    "Goal achieved! What's next?",
    "One goal down, many successes ahead!",
  ],
  motivation: [
    "Your dream job is out there waiting for you!",
    "Stay positive and keep pushing forward!",
    "Every 'no' brings you closer to a 'yes'!",
    "You have what it takes to succeed!",
  ],
  check_in: [
    "Just checking in - how's the job search going?",
    "Thinking of you! How can I support you?",
    "Haven't heard from you in a while - everything okay?",
  ],
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function getEncouragementConfig(type: EncouragementType) {
  return (
    ENCOURAGEMENT_TYPES.find((t) => t.value === type) || ENCOURAGEMENT_TYPES[0]
  );
}

function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 60) {
    return diffMins <= 1 ? "just now" : `${diffMins}m ago`;
  } else if (diffHours < 24) {
    return `${diffHours}h ago`;
  } else if (diffDays < 7) {
    return `${diffDays}d ago`;
  } else {
    return date.toLocaleDateString();
  }
}

// ============================================================================
// ENCOURAGEMENT ITEM COMPONENT
// ============================================================================

interface EncouragementItemProps {
  encouragement: EncouragementWithSender;
  onMarkRead?: (id: string) => void;
}

function EncouragementItem({
  encouragement,
  onMarkRead,
}: EncouragementItemProps) {
  const config = getEncouragementConfig(encouragement.message_type);

  return (
    <ListItem
      alignItems="flex-start"
      sx={{
        bgcolor: encouragement.is_read ? "transparent" : "action.hover",
        borderRadius: 1,
        mb: 1,
      }}
    >
      <ListItemAvatar>
        <Badge
          overlap="circular"
          anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
          badgeContent={
            !encouragement.is_read ? (
              <UnreadIcon
                sx={{ fontSize: 12, color: "primary.main" }}
              />
            ) : null
          }
        >
          <Avatar sx={{ bgcolor: config.color }}>
            {encouragement.sender?.full_name?.[0]?.toUpperCase() || "?"}
          </Avatar>
        </Badge>
      </ListItemAvatar>
      <ListItemText
        primary={
          <Stack direction="row" alignItems="center" spacing={1}>
            <Typography variant="subtitle2">
              {encouragement.sender?.full_name || "Unknown"}
            </Typography>
            <Chip
              size="small"
              icon={config.icon as React.ReactElement}
              label={config.label}
              sx={{ height: 20, "& .MuiChip-label": { px: 1, fontSize: 11 } }}
            />
          </Stack>
        }
        secondary={
          <>
            <Typography
              variant="body2"
              color="text.primary"
              sx={{ display: "block", my: 0.5 }}
            >
              {encouragement.message_text}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {formatRelativeTime(encouragement.created_at)}
            </Typography>
          </>
        }
      />
      {!encouragement.is_read && onMarkRead && (
        <Tooltip title="Mark as read">
          <IconButton
            size="small"
            onClick={() => onMarkRead(encouragement.id)}
          >
            <ReadIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      )}
    </ListItem>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function EncouragementPanel({
  limit = 10,
  onEncouragementSent,
}: EncouragementPanelProps) {
  const { user } = useAuth();
  const { currentTeam } = useTeam();

  // State
  const [loading, setLoading] = useState(true);
  const [encouragements, setEncouragements] = useState<EncouragementWithSender[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showSendDialog, setShowSendDialog] = useState(false);
  const [selectedRecipient, setSelectedRecipient] = useState<string>("");
  const [messageType, setMessageType] = useState<EncouragementType>("encouragement");
  const [messageText, setMessageText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Get team members for recipient selection
  const teamMembers =
    currentTeam?.members.filter((m) => m.user_id !== user?.id) || [];

  // Load encouragements
  useEffect(() => {
    async function loadEncouragements() {
      if (!user || !currentTeam) return;

      setLoading(true);

      const result = await progressService.getReceivedEncouragements(
        user.id,
        currentTeam.id,
        limit
      );

      if (result.data) {
        setEncouragements(result.data);
      }

      const countResult = await progressService.getUnreadEncouragementCount(user.id);
      if (countResult.data !== null) {
        setUnreadCount(countResult.data);
      }

      setLoading(false);
    }

    loadEncouragements();
  }, [user, currentTeam, limit]);

  // Handle send encouragement
  const handleSendEncouragement = async () => {
    if (!user || !currentTeam || !selectedRecipient || !messageText.trim()) {
      return;
    }

    setSubmitting(true);
    setError(null);

    const data: SendEncouragementData = {
      team_id: currentTeam.id,
      recipient_id: selectedRecipient,
      message_type: messageType,
      message_text: messageText.trim(),
    };

    const result = await progressService.sendEncouragement(user.id, data);

    if (result.error) {
      setError(result.error.message);
    } else {
      setSuccess(true);
      setShowSendDialog(false);
      setSelectedRecipient("");
      setMessageText("");
      setMessageType("encouragement");
      onEncouragementSent?.();
      setTimeout(() => setSuccess(false), 3000);
    }

    setSubmitting(false);
  };

  // Handle mark as read
  const handleMarkRead = async (encouragementId: string) => {
    await progressService.markEncouragementRead(encouragementId);
    setEncouragements((prev) =>
      prev.map((e) =>
        e.id === encouragementId
          ? { ...e, is_read: true, read_at: new Date().toISOString() }
          : e
      )
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
  };

  // Handle mark all as read
  const handleMarkAllRead = async () => {
    if (!user) return;
    await progressService.markAllEncouragementRead(user.id);
    setEncouragements((prev) =>
      prev.map((e) => ({ ...e, is_read: true, read_at: new Date().toISOString() }))
    );
    setUnreadCount(0);
  };

  // Handle quick message selection
  const handleQuickMessage = (message: string) => {
    setMessageText(message);
  };

  // No team selected
  if (!currentTeam) {
    return (
      <Paper sx={{ p: 3 }}>
        <Typography color="text.secondary">
          Please select a team to view encouragements.
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
            <Badge badgeContent={unreadCount} color="error">
              <HeartIcon color="error" />
            </Badge>
            <Box>
              <Typography variant="h6">Encouragements</Typography>
              <Typography variant="body2" color="text.secondary">
                Support and celebrate with your team
              </Typography>
            </Box>
          </Stack>
          <Stack direction="row" spacing={1}>
            {unreadCount > 0 && (
              <Button size="small" onClick={handleMarkAllRead}>
                Mark All Read
              </Button>
            )}
            <Button
              variant="contained"
              startIcon={<SendIcon />}
              onClick={() => setShowSendDialog(true)}
              disabled={teamMembers.length === 0}
            >
              Send
            </Button>
          </Stack>
        </Stack>

        {/* Success Alert */}
        {success && (
          <Alert severity="success" onClose={() => setSuccess(false)}>
            Encouragement sent successfully!
          </Alert>
        )}

        {/* Encouragements List */}
        {loading ? (
          <Typography color="text.secondary">Loading...</Typography>
        ) : encouragements.length === 0 ? (
          <Box
            sx={{
              textAlign: "center",
              py: 4,
              bgcolor: "action.hover",
              borderRadius: 1,
            }}
          >
            <HeartIcon sx={{ fontSize: 48, color: "text.disabled", mb: 1 }} />
            <Typography color="text.secondary">
              No encouragements yet
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Be the first to send some encouragement to your team!
            </Typography>
          </Box>
        ) : (
          <List disablePadding>
            {encouragements.map((encouragement) => (
              <EncouragementItem
                key={encouragement.id}
                encouragement={encouragement}
                onMarkRead={handleMarkRead}
              />
            ))}
          </List>
        )}
      </Stack>

      {/* Send Encouragement Dialog */}
      <Dialog
        open={showSendDialog}
        onClose={() => setShowSendDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Send Encouragement</DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            {error && (
              <Alert severity="error" onClose={() => setError(null)}>
                {error}
              </Alert>
            )}

            <FormControl fullWidth>
              <InputLabel>Send to</InputLabel>
              <Select
                value={selectedRecipient}
                label="Send to"
                onChange={(e) => setSelectedRecipient(e.target.value)}
              >
                {teamMembers.map((member) => (
                  <MenuItem key={member.user_id} value={member.user_id}>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <Avatar sx={{ width: 24, height: 24 }}>
                        <PersonIcon sx={{ fontSize: 16 }} />
                      </Avatar>
                      <span>
                        {member.profile?.full_name || member.profile?.email}
                      </span>
                      <Chip size="small" label={member.role} variant="outlined" />
                    </Stack>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel>Message Type</InputLabel>
              <Select
                value={messageType}
                label="Message Type"
                onChange={(e) =>
                  setMessageType(e.target.value as EncouragementType)
                }
              >
                {ENCOURAGEMENT_TYPES.map((type) => (
                  <MenuItem key={type.value} value={type.value}>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      {type.icon}
                      <span>{type.label}</span>
                    </Stack>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Box>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Quick messages:
              </Typography>
              <Stack direction="row" flexWrap="wrap" gap={1}>
                {QUICK_MESSAGES[messageType]?.slice(0, MAX_QUICK_MESSAGES).map((msg, idx) => (
                  <Chip
                    key={idx}
                    label={msg.length > 30 ? msg.slice(0, 30) + "..." : msg}
                    size="small"
                    onClick={() => handleQuickMessage(msg)}
                    variant={messageText === msg ? "filled" : "outlined"}
                    color={messageText === msg ? "primary" : "default"}
                  />
                ))}
              </Stack>
            </Box>

            <TextField
              label="Your message"
              multiline
              rows={3}
              fullWidth
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              placeholder="Write something encouraging..."
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowSendDialog(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleSendEncouragement}
            disabled={!selectedRecipient || !messageText.trim() || submitting}
            startIcon={<SendIcon />}
          >
            {submitting ? "Sending..." : "Send"}
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
}

export default EncouragementPanel;
