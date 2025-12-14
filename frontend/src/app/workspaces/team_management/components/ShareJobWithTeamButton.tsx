/**
 * SHARE JOB WITH TEAM BUTTON COMPONENT
 *
 * Purpose:
 * - Allow users to share a job posting with their team
 * - Add comments/recommendations when sharing
 * - Creates activity in team feed for visibility
 *
 * Demo Script 4.2 Requirements:
 * - Share job posting with team members
 * - Add collaborative comments and recommendations
 *
 * Usage:
 *   <ShareJobWithTeamButton job={job} />
 */

import { useState } from "react";
import {
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Stack,
  Typography,
  Alert,
  CircularProgress,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
} from "@mui/material";
import {
  Share as ShareIcon,
  Group as GroupIcon,
  CheckCircle as CheckCircleIcon,
} from "@mui/icons-material";
import { useAuth } from "@shared/context/AuthContext";
import { useTeam } from "@shared/context/useTeam";
import { supabase } from "@shared/services/supabaseClient";
import { getAppQueryClient } from "@shared/cache";
import { coreKeys } from "@shared/cache/coreQueryKeys";
import type { JobRow } from "@shared/types/database";

interface ShareJobWithTeamButtonProps {
  job: JobRow;
  variant?: "button" | "icon" | "menu";
  onShared?: () => void;
}

type ShareType =
  | "recommendation"
  | "discussion"
  | "opportunity"
  | "feedback_request";

const SHARE_TYPES: Record<ShareType, { label: string; description: string }> = {
  recommendation: {
    label: "Recommendation",
    description: "Recommend this job to team members",
  },
  discussion: {
    label: "Discussion",
    description: "Start a discussion about this opportunity",
  },
  opportunity: {
    label: "Opportunity Alert",
    description: "Alert team about this job opening",
  },
  feedback_request: {
    label: "Feedback Request",
    description: "Ask for feedback on this application",
  },
};

// Helper to format job location from address fields
const formatJobLocation = (job: JobRow): string | null => {
  const parts: string[] = [];
  if (job.city_name) parts.push(job.city_name);
  if (job.state_code) parts.push(job.state_code);
  if (parts.length === 0 && job.remote_type) {
    return job.remote_type.charAt(0).toUpperCase() + job.remote_type.slice(1);
  }
  return parts.length > 0 ? parts.join(", ") : null;
};

export function ShareJobWithTeamButton({
  job,
  variant = "button",
  onShared,
}: ShareJobWithTeamButtonProps) {
  const { user } = useAuth();
  const { currentTeam, userTeams } = useTeam();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [shareType, setShareType] = useState<ShareType>("recommendation");
  const [comment, setComment] = useState("");
  const [selectedTeamId, setSelectedTeamId] = useState<string>(
    currentTeam?.id || ""
  );
  const [sharing, setSharing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Don't show if user has no teams
  if (!userTeams || userTeams.length === 0) {
    return null;
  }

  const handleOpen = () => {
    setDialogOpen(true);
    setSelectedTeamId(currentTeam?.id || userTeams[0]?.team_id || "");
    setError(null);
    setSuccess(false);
  };

  const handleClose = () => {
    if (sharing) return;
    setDialogOpen(false);
    setComment("");
    setShareType("recommendation");
    setError(null);
    setSuccess(false);
  };

  const handleShare = async () => {
    if (!user?.id || !selectedTeamId) return;

    setSharing(true);
    setError(null);

    try {
      // Avoid an extra profiles lookup; best-effort name from auth metadata.
      const meta = user.user_metadata as unknown as Record<string, unknown>;
      const candidateName =
        (typeof meta?.full_name === "string" && meta.full_name.trim()) ||
        (typeof meta?.first_name === "string" && meta.first_name.trim()) ||
        null;
      const userName = candidateName || "A team member";

      // Create activity log entry for the shared job
      // Using 'settings_updated' as a generic activity type since 'job_shared' isn't in enum
      // The metadata will contain the actual share info
      const { error: activityError } = await supabase
        .from("team_activity_log")
        .insert({
          team_id: selectedTeamId,
          actor_id: user.id,
          activity_type: "settings_updated", // Using existing enum value
          description: `${userName} shared a job: ${job.job_title} at ${job.company_name}`,
          metadata: {
            type: "job_shared",
            share_type: shareType,
            comment: comment.trim() || null,
            job: {
              id: job.id,
              title: job.job_title,
              company: job.company_name,
              status: job.job_status,
              location: formatJobLocation(job),
              url: job.job_link,
            },
          },
        });

      if (activityError) {
        console.error("Failed to create activity:", activityError);
        setError("Failed to share job with team. Please try again.");
        setSharing(false);
        return;
      }

      // Also create a team message so it shows in conversations
      const shareTypeLabel = SHARE_TYPES[shareType].label;
      const messageText = comment.trim()
        ? `[${shareTypeLabel}] ${job.job_title} at ${job.company_name}\n\n${comment}`
        : `[${shareTypeLabel}] ${job.job_title} at ${job.company_name}\n\nCheck out this opportunity!`;

      await supabase.from("team_messages").insert({
        team_id: selectedTeamId,
        sender_id: user.id,
        message_text: messageText,
        metadata: {
          type: "job_share",
          job_id: job.id,
          job_title: job.job_title,
          company_name: job.company_name,
          share_type: shareType,
        },
      });

      getAppQueryClient().invalidateQueries({
        queryKey: coreKeys.teamMessages(user.id, selectedTeamId),
      });

      setSuccess(true);
      onShared?.();

      // Close dialog after short delay to show success
      setTimeout(() => {
        handleClose();
      }, 1500);
    } catch (err) {
      console.error("Share error:", err);
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setSharing(false);
    }
  };

  // Render button based on variant
  const renderTrigger = () => {
    switch (variant) {
      case "icon":
        return (
          <Button
            size="small"
            startIcon={<ShareIcon />}
            onClick={handleOpen}
            color="primary"
          >
            Share
          </Button>
        );
      case "menu":
        return (
          <MenuItem onClick={handleOpen}>
            <ShareIcon sx={{ mr: 1 }} />
            Share with Team
          </MenuItem>
        );
      default:
        return (
          <Button
            variant="outlined"
            startIcon={<ShareIcon />}
            onClick={handleOpen}
          >
            Share with Team
          </Button>
        );
    }
  };

  return (
    <>
      {renderTrigger()}

      <Dialog open={dialogOpen} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Stack direction="row" spacing={1} alignItems="center">
            <GroupIcon color="primary" />
            <Typography variant="h6">Share Job with Team</Typography>
          </Stack>
        </DialogTitle>

        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            {error && <Alert severity="error">{error}</Alert>}

            {success && (
              <Alert severity="success" icon={<CheckCircleIcon />}>
                Job shared successfully! Your team will see this in their
                activity feed.
              </Alert>
            )}

            {/* Job Preview */}
            <Box
              sx={{
                p: 2,
                bgcolor: "background.default",
                borderRadius: 1,
                border: 1,
                borderColor: "divider",
              }}
            >
              <Typography variant="subtitle1" fontWeight="medium">
                {job.job_title}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {job.company_name}
              </Typography>
              <Stack direction="row" spacing={1} mt={1}>
                {formatJobLocation(job) && (
                  <Chip
                    label={formatJobLocation(job)}
                    size="small"
                    variant="outlined"
                  />
                )}
                <Chip
                  label={job.job_status}
                  size="small"
                  color="primary"
                  variant="outlined"
                />
              </Stack>
            </Box>

            {/* Team Selection (if multiple teams) */}
            {userTeams.length > 1 && (
              <FormControl fullWidth>
                <InputLabel>Share to Team</InputLabel>
                <Select
                  value={selectedTeamId}
                  label="Share to Team"
                  onChange={(e) => setSelectedTeamId(e.target.value)}
                  disabled={sharing || success}
                >
                  {userTeams.map((team) => (
                    <MenuItem key={team.team_id} value={team.team_id}>
                      {team.team_name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}

            {/* Share Type */}
            <FormControl fullWidth>
              <InputLabel>Share Type</InputLabel>
              <Select
                value={shareType}
                label="Share Type"
                onChange={(e) => setShareType(e.target.value as ShareType)}
                disabled={sharing || success}
              >
                {Object.entries(SHARE_TYPES).map(
                  ([key, { label, description }]) => (
                    <MenuItem key={key} value={key}>
                      <Stack>
                        <Typography variant="body2">{label}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {description}
                        </Typography>
                      </Stack>
                    </MenuItem>
                  )
                )}
              </Select>
            </FormControl>

            {/* Comment */}
            <TextField
              label="Add a comment (optional)"
              multiline
              rows={3}
              fullWidth
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Share your thoughts, ask for feedback, or add context..."
              disabled={sharing || success}
            />

            <Alert severity="info">
              <Typography variant="body2">
                Your team members will see this in their activity feed and can
                view the job details.
              </Typography>
            </Alert>
          </Stack>
        </DialogContent>

        <DialogActions>
          <Button onClick={handleClose} disabled={sharing}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleShare}
            disabled={!selectedTeamId || sharing || success}
            startIcon={sharing ? <CircularProgress size={16} /> : <ShareIcon />}
          >
            {sharing ? "Sharing..." : success ? "Shared!" : "Share"}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

export default ShareJobWithTeamButton;
