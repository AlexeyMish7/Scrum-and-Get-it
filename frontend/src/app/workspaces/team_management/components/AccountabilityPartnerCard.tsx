/**
 * ACCOUNTABILITY PARTNER CARD COMPONENT (UC-111)
 *
 * Purpose:
 * - Display accountability partner information
 * - Show engagement metrics and interaction history
 * - Provide quick actions for messaging and feedback
 * - Display effectiveness score and support stats
 *
 * Used by:
 * - CandidateProgressPage for viewing partners
 * - AccountabilityPartnersPage for managing partnerships
 */

import { useState, useCallback } from "react";
import {
  Box,
  Stack,
  Typography,
  Paper,
  Avatar,
  Chip,
  Button,
  IconButton,
  Tooltip,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Menu,
  MenuItem,
  Divider,
  Skeleton,
} from "@mui/material";
import {
  Message as MessageIcon,
  ThumbUp as ThumbUpIcon,
  Schedule as ScheduleIcon,
  MoreVert as MoreVertIcon,
  PauseCircle as PauseIcon,
  Cancel as EndIcon,
  Handshake as HandshakeIcon,
  Star as StarIcon,
  Celebration as CelebrationIcon,
} from "@mui/icons-material";
import * as progressService from "../services/progressSharingService";
import type {
  AccountabilityPartnership,
  PartnershipStatus,
} from "../services/progressSharingService";

// ============================================================================
// TYPES
// ============================================================================

interface AccountabilityPartnerCardProps {
  partnership: AccountabilityPartnership;
  // Compact mode for lists
  compact?: boolean;
  // Show as the current user's partner (vs showing as a partner viewing them)
  isMyPartner?: boolean;
  // Callback when partnership is updated
  onPartnershipUpdate?: (partnership: AccountabilityPartnership) => void;
  // Callback when user wants to send encouragement
  onSendEncouragement?: (partnerId: string) => void;
}

// Status configuration for visual styling
interface StatusConfig {
  label: string;
  color: "success" | "warning" | "error" | "default" | "info";
  description: string;
}

// ============================================================================
// HELPERS
// ============================================================================

const STATUS_CONFIGS: Record<PartnershipStatus, StatusConfig> = {
  pending: {
    label: "Pending",
    color: "warning",
    description: "Waiting for partner to accept",
  },
  active: {
    label: "Active",
    color: "success",
    description: "Partnership is active",
  },
  paused: {
    label: "Paused",
    color: "default",
    description: "Partnership temporarily paused",
  },
  ended: {
    label: "Ended",
    color: "error",
    description: "Partnership has ended",
  },
};

/**
 * Format relative time (e.g., "2 days ago")
 */
function formatRelativeTime(dateString: string | undefined): string {
  if (!dateString) return "Never";

  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 14) return "Last week";
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  return `${Math.floor(diffDays / 30)} months ago`;
}

/**
 * Get effectiveness rating label
 */
function getEffectivenessLabel(score: number): string {
  if (score >= 80) return "Excellent";
  if (score >= 60) return "Good";
  if (score >= 40) return "Fair";
  if (score >= 20) return "Needs Improvement";
  return "New Partnership";
}

/**
 * Get effectiveness color
 */
function getEffectivenessColor(
  score: number
): "success" | "warning" | "error" | "info" {
  if (score >= 80) return "success";
  if (score >= 60) return "info";
  if (score >= 40) return "warning";
  return "error";
}

// ============================================================================
// ENCOURAGEMENT DIALOG
// ============================================================================

function EncouragementDialog({
  open,
  onClose,
  partnerName,
  onSend,
}: {
  open: boolean;
  onClose: () => void;
  partnerName: string;
  onSend: (message: string) => void;
}) {
  const [message, setMessage] = useState("");

  const quickMessages = [
    "You've got this! 💪",
    "Keep pushing forward! 🚀",
    "Proud of your progress! 🌟",
    "One step at a time! 🎯",
    "Believe in yourself! ✨",
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
      <DialogTitle>Send Encouragement to {partnerName}</DialogTitle>
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
          startIcon={<CelebrationIcon />}
        >
          Send Encouragement
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ============================================================================
// STAT ITEM SUBCOMPONENT
// ============================================================================

function StatItem({
  icon,
  label,
  value,
  color = "text.secondary",
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  color?: string;
}) {
  return (
    <Stack direction="row" alignItems="center" spacing={1}>
      <Box sx={{ color }}>{icon}</Box>
      <Box>
        <Typography variant="caption" color="text.secondary" display="block">
          {label}
        </Typography>
        <Typography variant="body2" fontWeight="medium">
          {value}
        </Typography>
      </Box>
    </Stack>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function AccountabilityPartnerCard({
  partnership,
  compact = false,
  isMyPartner = true,
  onPartnershipUpdate,
  onSendEncouragement,
}: AccountabilityPartnerCardProps) {
  // State
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [showEncouragementDialog, setShowEncouragementDialog] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Determine which partner info to display
  // If viewing as "my partner", show the partner's info
  // If viewing as "partner viewing me", show the user's info
  const displayedPerson = isMyPartner ? partnership.partner : partnership.user;
  const personName = displayedPerson?.fullName || "Unknown User";
  const personTitle = displayedPerson?.professionalTitle;

  const statusConfig = STATUS_CONFIGS[partnership.status];
  const isActive = partnership.status === "active";
  const isPending = partnership.status === "pending";
  const canSendEncouragement = isActive && isMyPartner;

  // Handle menu open/close
  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  // Handle pause partnership
  const handlePause = useCallback(async () => {
    handleMenuClose();
    setActionLoading(true);
    // API call would go here - pause is not implemented yet
    setActionLoading(false);
  }, []);

  // Handle end partnership
  const handleEnd = useCallback(async () => {
    handleMenuClose();
    setActionLoading(true);

    const result = await progressService.endPartnership(partnership.id);

    // If successful, update the local partnership with ended status
    if (result.data) {
      const updatedPartnership: AccountabilityPartnership = {
        ...partnership,
        status: "ended",
        endedAt: new Date().toISOString(),
      };
      onPartnershipUpdate?.(updatedPartnership);
    }

    setActionLoading(false);
  }, [partnership, onPartnershipUpdate]);

  // Handle accept partnership (for pending requests)
  const handleAccept = useCallback(async () => {
    setActionLoading(true);

    const result = await progressService.acceptPartnership(partnership.id);

    // If successful, update the local partnership with active status
    if (result.data) {
      const updatedPartnership: AccountabilityPartnership = {
        ...partnership,
        status: "active",
        acceptedAt: new Date().toISOString(),
      };
      onPartnershipUpdate?.(updatedPartnership);
    }

    setActionLoading(false);
  }, [partnership, onPartnershipUpdate]);

  // Handle send encouragement
  const handleSendEncouragement = useCallback(() => {
    if (partnership.partnerId) {
      onSendEncouragement?.(partnership.partnerId);
      // Record the interaction as encouragement (true = isEncouragement)
      progressService.recordPartnerInteraction(partnership.id, true);
    }
  }, [partnership.id, partnership.partnerId, onSendEncouragement]);

  // Compact view for lists
  if (compact) {
    return (
      <Paper
        variant="outlined"
        sx={{
          p: 2,
          transition: "all 0.2s ease",
          opacity: isActive ? 1 : 0.7,
          "&:hover": {
            boxShadow: isActive ? 1 : 0,
          },
        }}
      >
        <Stack direction="row" spacing={2} alignItems="center">
          <Avatar sx={{ bgcolor: isActive ? "primary.main" : "grey.400" }}>
            {personName[0]}
          </Avatar>

          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Stack direction="row" alignItems="center" spacing={1}>
              <Typography variant="body2" fontWeight="medium" noWrap>
                {personName}
              </Typography>
              <Chip
                label={statusConfig.label}
                size="small"
                color={statusConfig.color}
              />
            </Stack>
            {personTitle && (
              <Typography variant="caption" color="text.secondary" noWrap>
                {personTitle}
              </Typography>
            )}
          </Box>

          {/* Quick actions */}
          {canSendEncouragement && (
            <Tooltip title="Send encouragement">
              <IconButton
                size="small"
                color="primary"
                onClick={() => setShowEncouragementDialog(true)}
              >
                <ThumbUpIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}

          {isPending && !isMyPartner && (
            <Button
              size="small"
              variant="contained"
              onClick={handleAccept}
              disabled={actionLoading}
            >
              Accept
            </Button>
          )}
        </Stack>

        {/* Encouragement dialog */}
        <EncouragementDialog
          open={showEncouragementDialog}
          onClose={() => setShowEncouragementDialog(false)}
          partnerName={personName}
          onSend={handleSendEncouragement}
        />
      </Paper>
    );
  }

  // Full view
  return (
    <Paper
      elevation={isActive ? 2 : 0}
      variant={isActive ? "elevation" : "outlined"}
      sx={{
        p: 3,
        opacity: isActive ? 1 : 0.8,
        borderLeft: isActive ? `4px solid` : undefined,
        borderLeftColor: isActive ? "primary.main" : undefined,
      }}
    >
      <Stack spacing={3}>
        {/* Header with avatar and basic info */}
        <Stack direction="row" alignItems="flex-start" spacing={2}>
          <Avatar
            sx={{
              width: 64,
              height: 64,
              bgcolor: isActive ? "primary.main" : "grey.400",
              fontSize: "1.5rem",
            }}
          >
            {personName[0]}
          </Avatar>

          <Box sx={{ flex: 1 }}>
            <Stack direction="row" alignItems="center" spacing={1}>
              <Typography variant="h6">{personName}</Typography>
              <Chip
                label={statusConfig.label}
                size="small"
                color={statusConfig.color}
              />
            </Stack>
            {personTitle && (
              <Typography variant="body2" color="text.secondary">
                {personTitle}
              </Typography>
            )}
            <Typography variant="caption" color="text.secondary">
              <HandshakeIcon
                sx={{ fontSize: 14, mr: 0.5, verticalAlign: "middle" }}
              />
              Partners since{" "}
              {new Date(partnership.createdAt).toLocaleDateString()}
            </Typography>
          </Box>

          {/* Actions menu */}
          {isActive && (
            <>
              <IconButton onClick={handleMenuOpen}>
                <MoreVertIcon />
              </IconButton>
              <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleMenuClose}
              >
                <MenuItem onClick={handlePause}>
                  <PauseIcon sx={{ mr: 1 }} fontSize="small" />
                  Pause Partnership
                </MenuItem>
                <MenuItem onClick={handleEnd} sx={{ color: "error.main" }}>
                  <EndIcon sx={{ mr: 1 }} fontSize="small" />
                  End Partnership
                </MenuItem>
              </Menu>
            </>
          )}

          {/* Accept button for pending requests */}
          {isPending && !isMyPartner && (
            <Button
              variant="contained"
              onClick={handleAccept}
              disabled={actionLoading}
              startIcon={<HandshakeIcon />}
            >
              Accept Request
            </Button>
          )}
        </Stack>

        {/* Stats grid */}
        {isActive && (
          <>
            <Divider />
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
                gap: 2,
              }}
            >
              <StatItem
                icon={<ScheduleIcon fontSize="small" />}
                label="Last Interaction"
                value={formatRelativeTime(partnership.lastInteractionAt)}
              />
              <StatItem
                icon={<MessageIcon fontSize="small" />}
                label="Total Interactions"
                value={partnership.interactionCount}
              />
              <StatItem
                icon={<ThumbUpIcon fontSize="small" />}
                label="Encouragement Sent"
                value={partnership.encouragementSent}
                color="success.main"
              />
              <StatItem
                icon={<CelebrationIcon fontSize="small" />}
                label="Encouragement Received"
                value={partnership.encouragementReceived}
                color="primary.main"
              />
            </Box>
          </>
        )}

        {/* Effectiveness score */}
        {isActive && partnership.effectivenessScore > 0 && (
          <>
            <Divider />
            <Box>
              <Stack
                direction="row"
                alignItems="center"
                justifyContent="space-between"
                sx={{ mb: 1 }}
              >
                <Stack direction="row" alignItems="center" spacing={1}>
                  <StarIcon fontSize="small" color="warning" />
                  <Typography variant="body2">
                    Partnership Effectiveness
                  </Typography>
                </Stack>
                <Chip
                  label={getEffectivenessLabel(partnership.effectivenessScore)}
                  size="small"
                  color={getEffectivenessColor(partnership.effectivenessScore)}
                />
              </Stack>
              <LinearProgress
                variant="determinate"
                value={partnership.effectivenessScore}
                color={getEffectivenessColor(partnership.effectivenessScore)}
                sx={{
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: "grey.200",
                  "& .MuiLinearProgress-bar": {
                    borderRadius: 4,
                  },
                }}
              />
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ mt: 0.5 }}
              >
                Based on interaction frequency and engagement quality
              </Typography>
            </Box>
          </>
        )}

        {/* Action buttons */}
        {isActive && (
          <>
            <Divider />
            <Stack direction="row" spacing={2} justifyContent="flex-end">
              <Button
                variant="outlined"
                startIcon={<MessageIcon />}
                onClick={() => {
                  // Would open messaging - for now just record interaction (not encouragement)
                  progressService.recordPartnerInteraction(
                    partnership.id,
                    false
                  );
                }}
              >
                Message
              </Button>
              {canSendEncouragement && (
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<ThumbUpIcon />}
                  onClick={() => setShowEncouragementDialog(true)}
                >
                  Send Encouragement
                </Button>
              )}
            </Stack>
          </>
        )}

        {/* Invitation message for pending partnerships */}
        {isPending && partnership.invitationMessage && (
          <Paper variant="outlined" sx={{ p: 2, bgcolor: "grey.50" }}>
            <Typography variant="body2" sx={{ fontStyle: "italic" }}>
              "{partnership.invitationMessage}"
            </Typography>
          </Paper>
        )}
      </Stack>

      {/* Encouragement dialog */}
      <EncouragementDialog
        open={showEncouragementDialog}
        onClose={() => setShowEncouragementDialog(false)}
        partnerName={personName}
        onSend={handleSendEncouragement}
      />
    </Paper>
  );
}

// ============================================================================
// SKELETON LOADING STATE
// ============================================================================

export function AccountabilityPartnerCardSkeleton({
  compact = false,
}: {
  compact?: boolean;
}) {
  if (compact) {
    return (
      <Paper variant="outlined" sx={{ p: 2 }}>
        <Stack direction="row" spacing={2} alignItems="center">
          <Skeleton variant="circular" width={40} height={40} />
          <Box sx={{ flex: 1 }}>
            <Skeleton variant="text" width="60%" />
            <Skeleton variant="text" width="40%" />
          </Box>
        </Stack>
      </Paper>
    );
  }

  return (
    <Paper sx={{ p: 3 }}>
      <Stack spacing={3}>
        <Stack direction="row" spacing={2}>
          <Skeleton variant="circular" width={64} height={64} />
          <Box sx={{ flex: 1 }}>
            <Skeleton variant="text" width="50%" />
            <Skeleton variant="text" width="30%" />
          </Box>
        </Stack>
        <Skeleton variant="rectangular" height={80} />
        <Skeleton variant="rectangular" height={40} />
      </Stack>
    </Paper>
  );
}

export default AccountabilityPartnerCard;
