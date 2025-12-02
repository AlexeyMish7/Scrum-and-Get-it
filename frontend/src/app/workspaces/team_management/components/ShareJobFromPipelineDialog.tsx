/**
 * SHARE JOB FROM PIPELINE DIALOG
 *
 * Purpose:
 * - Allow users to select a job from their pipeline to share with the team
 * - Accessed from Team Dashboard for easy job sharing
 *
 * Demo Script 4.2 Requirements:
 * - Share job posting with team members
 * - Add collaborative comments and recommendations
 *
 * Usage:
 *   <ShareJobFromPipelineDialog open={open} onClose={handleClose} />
 */

import { useState, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  ListItemSecondaryAction,
  Typography,
  Box,
  TextField,
  CircularProgress,
  Alert,
  Chip,
  Stack,
  Divider,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import {
  Search as SearchIcon,
  Work as WorkIcon,
  Share as ShareIcon,
  CheckCircle as CheckCircleIcon,
} from "@mui/icons-material";
import { useAuth } from "@shared/context/AuthContext";
import { useTeam } from "@shared/context/useTeam";
import { supabase } from "@shared/services/supabaseClient";
import type { JobRow } from "@shared/types/database";

interface ShareJobFromPipelineDialogProps {
  open: boolean;
  onClose: () => void;
  onShared?: () => void;
}

// Share type options for categorizing the share
type ShareType = "recommendation" | "help" | "discussion" | "fyi";

const SHARE_TYPES: Record<ShareType, { label: string; description: string }> = {
  recommendation: {
    label: "Recommendation",
    description: "I think this could be a good fit",
  },
  help: {
    label: "Need Help",
    description: "Looking for advice or referral",
  },
  discussion: {
    label: "Discussion",
    description: "Want to discuss this opportunity",
  },
  fyi: {
    label: "FYI",
    description: "Just sharing for awareness",
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

export function ShareJobFromPipelineDialog({
  open,
  onClose,
  onShared,
}: ShareJobFromPipelineDialogProps) {
  const { user } = useAuth();
  const { currentTeam } = useTeam();

  // State
  const [jobs, setJobs] = useState<JobRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedJob, setSelectedJob] = useState<JobRow | null>(null);
  const [shareType, setShareType] = useState<ShareType>("recommendation");
  const [comment, setComment] = useState("");
  const [sharing, setSharing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Load user's jobs - extracted as a function so it can be called for retry
  const loadJobs = useCallback(async () => {
    if (!user?.id) return;

    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from("jobs")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50);

      if (fetchError) {
        console.error("Failed to load jobs:", fetchError);
        setError("Failed to load your jobs. Please try again.");
        setJobs([]);
      } else {
        setJobs(data || []);
      }
    } catch (err) {
      console.error("Error loading jobs:", err);
      setError("An unexpected error occurred.");
      setJobs([]);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // Load jobs when dialog opens
  useEffect(() => {
    if (open && user?.id) {
      loadJobs();
    }
  }, [open, user?.id, loadJobs]);

  // Reset state when dialog closes
  useEffect(() => {
    if (!open) {
      setSelectedJob(null);
      setShareType("recommendation");
      setComment("");
      setError(null);
      setSuccess(false);
      setSearchQuery("");
    }
  }, [open]);

  // Filter jobs based on search query
  const filteredJobs = jobs.filter((job) => {
    const query = searchQuery.toLowerCase();
    return (
      job.job_title.toLowerCase().includes(query) ||
      (job.company_name?.toLowerCase() || "").includes(query)
    );
  });

  const handleSelectJob = (job: JobRow) => {
    setSelectedJob(job);
    setError(null);
  };

  const handleShare = async () => {
    if (!user?.id || !currentTeam?.id || !selectedJob) return;

    setSharing(true);
    setError(null);

    try {
      // Get user profile for the activity description
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, first_name")
        .eq("id", user.id)
        .single();

      const userName =
        profile?.full_name || profile?.first_name || "A team member";

      // Create activity log entry for the shared job
      const { error: activityError } = await supabase
        .from("team_activity_log")
        .insert({
          team_id: currentTeam.id,
          actor_id: user.id,
          activity_type: "settings_updated", // Using existing enum value
          description: `${userName} shared a job: ${selectedJob.job_title} at ${selectedJob.company_name}`,
          metadata: {
            type: "job_shared",
            share_type: shareType,
            comment: comment.trim() || null,
            job: {
              id: selectedJob.id,
              title: selectedJob.job_title,
              company: selectedJob.company_name,
              status: selectedJob.job_status,
              location: formatJobLocation(selectedJob),
              url: selectedJob.job_link,
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
        ? `[${shareTypeLabel}] ${selectedJob.job_title} at ${selectedJob.company_name}\n\n${comment}`
        : `[${shareTypeLabel}] ${selectedJob.job_title} at ${selectedJob.company_name}\n\nCheck out this opportunity!`;

      await supabase.from("team_messages").insert({
        team_id: currentTeam.id,
        sender_id: user.id,
        message_text: messageText,
        metadata: {
          type: "job_share",
          job_id: selectedJob.id,
          job_title: selectedJob.job_title,
          company_name: selectedJob.company_name,
          share_type: shareType,
        },
      });

      setSuccess(true);
      onShared?.();

      // Close dialog after short delay to show success
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err) {
      console.error("Error sharing job:", err);
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setSharing(false);
    }
  };

  const handleBack = () => {
    setSelectedJob(null);
    setError(null);
  };

  // Render job selection step
  const renderJobSelection = () => (
    <>
      <DialogContent dividers>
        {/* Search box */}
        <TextField
          fullWidth
          placeholder="Search your jobs..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon color="action" />
              </InputAdornment>
            ),
          }}
          sx={{ mb: 2 }}
        />

        {loading ? (
          <Box display="flex" justifyContent="center" py={4}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
            <Button size="small" onClick={loadJobs} sx={{ ml: 2 }}>
              Retry
            </Button>
          </Alert>
        ) : filteredJobs.length === 0 ? (
          <Box textAlign="center" py={4}>
            <WorkIcon sx={{ fontSize: 48, color: "text.secondary", mb: 1 }} />
            <Typography color="text.secondary">
              {searchQuery
                ? "No jobs match your search"
                : "No jobs in your pipeline yet"}
            </Typography>
          </Box>
        ) : (
          <List sx={{ maxHeight: 400, overflow: "auto" }}>
            {filteredJobs.map((job, index) => (
              <Box key={job.id}>
                {index > 0 && <Divider />}
                <ListItem disablePadding>
                  <ListItemButton onClick={() => handleSelectJob(job)}>
                    <ListItemText
                      primary={
                        <Typography fontWeight="medium">
                          {job.job_title}
                        </Typography>
                      }
                      secondary={
                        <Stack direction="row" spacing={1} mt={0.5}>
                          <Typography variant="body2" color="text.secondary">
                            {job.company_name || "Unknown Company"}
                          </Typography>
                          {formatJobLocation(job) && (
                            <Typography variant="body2" color="text.disabled">
                              • {formatJobLocation(job)}
                            </Typography>
                          )}
                        </Stack>
                      }
                    />
                    <ListItemSecondaryAction>
                      <Chip
                        label={job.job_status}
                        size="small"
                        color="primary"
                        variant="outlined"
                      />
                    </ListItemSecondaryAction>
                  </ListItemButton>
                </ListItem>
              </Box>
            ))}
          </List>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
      </DialogActions>
    </>
  );

  // Render share details step
  const renderShareDetails = () => (
    <>
      <DialogContent dividers>
        <Stack spacing={3}>
          {/* Success state */}
          {success && (
            <Alert severity="success" icon={<CheckCircleIcon />} sx={{ mb: 2 }}>
              Job shared with your team!
            </Alert>
          )}

          {/* Error state */}
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {/* Selected job preview */}
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
              {selectedJob?.job_title}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {selectedJob?.company_name}
            </Typography>
            <Stack direction="row" spacing={1} mt={1}>
              {selectedJob && formatJobLocation(selectedJob) && (
                <Chip
                  label={formatJobLocation(selectedJob)}
                  size="small"
                  variant="outlined"
                />
              )}
              <Chip
                label={selectedJob?.job_status}
                size="small"
                color="primary"
                variant="outlined"
              />
            </Stack>
          </Box>

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
                      <Typography>{label}</Typography>
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
            fullWidth
            multiline
            rows={3}
            label="Add a note (optional)"
            placeholder="Share your thoughts about this opportunity..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            disabled={sharing || success}
          />

          {/* Team indicator */}
          <Box
            sx={{
              p: 1.5,
              bgcolor: "primary.50",
              borderRadius: 1,
              display: "flex",
              alignItems: "center",
              gap: 1,
            }}
          >
            <ShareIcon color="primary" fontSize="small" />
            <Typography variant="body2" color="primary.main">
              Sharing to: <strong>{currentTeam?.name}</strong>
            </Typography>
          </Box>
        </Stack>
      </DialogContent>

      <DialogActions>
        <Button onClick={handleBack} disabled={sharing || success}>
          Back
        </Button>
        <Button
          variant="contained"
          onClick={handleShare}
          disabled={sharing || success}
          startIcon={
            sharing ? (
              <CircularProgress size={16} color="inherit" />
            ) : (
              <ShareIcon />
            )
          }
        >
          {sharing ? "Sharing..." : success ? "Shared!" : "Share with Team"}
        </Button>
      </DialogActions>
    </>
  );

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {selectedJob ? "Share Job Details" : "Share a Job with Your Team"}
      </DialogTitle>
      {selectedJob ? renderShareDetails() : renderJobSelection()}
    </Dialog>
  );
}

export default ShareJobFromPipelineDialog;
