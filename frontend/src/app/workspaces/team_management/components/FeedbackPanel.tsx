/**
 * FEEDBACK PANEL COMPONENT (UC-109)
 *
 * Purpose:
 * - Allow mentors to provide written feedback to mentees
 * - Support different feedback types (application, interview, general, etc.)
 * - Display feedback history for a mentee
 * - Enable feedback editing and deletion
 *
 * Used by:
 * - MentorDashboard for quick feedback
 * - Mentee detail views for full feedback history
 */

import { useState } from "react";
import {
  Box,
  Stack,
  Typography,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  IconButton,
  Chip,
  Divider,
  Alert,
  CircularProgress,
  Collapse,
  Tooltip,
} from "@mui/material";
import {
  Chat as ChatIcon,
  Send as SendIcon,
  Delete as DeleteIcon,
  ExpandMore as ExpandMoreIcon,
  Work as WorkIcon,
  Description as DescriptionIcon,
  Flag as FlagIcon,
  EmojiEvents as EmojiEventsIcon,
  School as SchoolIcon,
} from "@mui/icons-material";
import type {
  MentorFeedback,
  CreateFeedbackData,
} from "../services/mentorService";

// ============================================================================
// TYPES
// ============================================================================

interface FeedbackPanelProps {
  candidateId: string;
  candidateName: string;
  teamId: string;
  feedbackHistory: MentorFeedback[];
  onSubmitFeedback: (data: CreateFeedbackData) => Promise<void>;
  onDeleteFeedback?: (feedbackId: string) => Promise<void>;
  loading?: boolean;
  error?: string | null;
}

type FeedbackType = CreateFeedbackData["feedbackType"];

// ============================================================================
// CONSTANTS
// ============================================================================

const FEEDBACK_TYPES: {
  value: FeedbackType;
  label: string;
  icon: React.ReactNode;
  color: "primary" | "info" | "warning" | "success" | "secondary";
}[] = [
  {
    value: "general",
    label: "General Coaching",
    icon: <ChatIcon />,
    color: "primary",
  },
  {
    value: "application",
    label: "Application Feedback",
    icon: <WorkIcon />,
    color: "info",
  },
  {
    value: "interview",
    label: "Interview Prep",
    icon: <SchoolIcon />,
    color: "warning",
  },
  {
    value: "resume",
    label: "Resume Review",
    icon: <DescriptionIcon />,
    color: "secondary",
  },
  {
    value: "cover_letter",
    label: "Cover Letter Review",
    icon: <DescriptionIcon />,
    color: "secondary",
  },
  {
    value: "goal",
    label: "Goal Progress",
    icon: <FlagIcon />,
    color: "success",
  },
  {
    value: "milestone",
    label: "Milestone Achievement",
    icon: <EmojiEventsIcon />,
    color: "success",
  },
];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function getFeedbackConfig(type: string) {
  return (
    FEEDBACK_TYPES.find((t) => t.value === type) || {
      value: "general",
      label: "General",
      icon: <ChatIcon />,
      color: "primary" as const,
    }
  );
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffDays = Math.floor(
    (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (diffDays === 0) {
    return `Today at ${date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    })}`;
  } else if (diffDays === 1) {
    return "Yesterday";
  } else if (diffDays < 7) {
    return `${diffDays} days ago`;
  } else {
    return date.toLocaleDateString();
  }
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function FeedbackPanel({
  candidateId,
  candidateName,
  teamId,
  feedbackHistory,
  onSubmitFeedback,
  onDeleteFeedback,
  loading = false,
  error = null,
}: FeedbackPanelProps) {
  // Form state
  const [feedbackType, setFeedbackType] = useState<FeedbackType>("general");
  const [feedbackText, setFeedbackText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showHistory, setShowHistory] = useState(true);

  // Handle form submission
  const handleSubmit = async () => {
    if (!feedbackText.trim()) return;

    setSubmitting(true);
    try {
      await onSubmitFeedback({
        candidateId,
        teamId,
        feedbackType,
        feedbackText: feedbackText.trim(),
      });
      // Clear form on success
      setFeedbackText("");
      setFeedbackType("general");
    } catch (err) {
      console.error("Failed to submit feedback:", err);
    } finally {
      setSubmitting(false);
    }
  };

  // Handle delete
  const handleDelete = async (feedbackId: string) => {
    if (!onDeleteFeedback) return;
    if (!window.confirm("Are you sure you want to delete this feedback?"))
      return;

    try {
      await onDeleteFeedback(feedbackId);
    } catch (err) {
      console.error("Failed to delete feedback:", err);
    }
  };

  return (
    <Paper sx={{ p: 3 }}>
      <Stack spacing={3}>
        {/* Header */}
        <Stack direction="row" alignItems="center" spacing={2}>
          <Avatar sx={{ bgcolor: "primary.main" }}>
            <ChatIcon />
          </Avatar>
          <Box flex={1}>
            <Typography variant="h6">Feedback for {candidateName}</Typography>
            <Typography variant="body2" color="text.secondary">
              Provide coaching feedback and recommendations
            </Typography>
          </Box>
        </Stack>

        {/* Error Alert */}
        {error && (
          <Alert severity="error" onClose={() => {}}>
            {error}
          </Alert>
        )}

        {/* Feedback Form */}
        <Box>
          <Stack spacing={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Feedback Type</InputLabel>
              <Select
                value={feedbackType}
                label="Feedback Type"
                onChange={(e) =>
                  setFeedbackType(e.target.value as FeedbackType)
                }
              >
                {FEEDBACK_TYPES.map((type) => (
                  <MenuItem key={type.value} value={type.value}>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      {type.icon}
                      <span>{type.label}</span>
                    </Stack>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              label="Your Feedback"
              placeholder="Share your coaching insights, recommendations, or encouragement..."
              multiline
              rows={4}
              fullWidth
              value={feedbackText}
              onChange={(e) => setFeedbackText(e.target.value)}
              disabled={submitting}
            />

            <Stack direction="row" justifyContent="flex-end">
              <Button
                variant="contained"
                startIcon={
                  submitting ? <CircularProgress size={16} /> : <SendIcon />
                }
                onClick={handleSubmit}
                disabled={!feedbackText.trim() || submitting}
              >
                {submitting ? "Sending..." : "Send Feedback"}
              </Button>
            </Stack>
          </Stack>
        </Box>

        <Divider />

        {/* Feedback History */}
        <Box>
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            sx={{ cursor: "pointer" }}
            onClick={() => setShowHistory(!showHistory)}
          >
            <Typography variant="subtitle1">
              Feedback History ({feedbackHistory.length})
            </Typography>
            <IconButton size="small">
              <ExpandMoreIcon
                sx={{
                  transform: showHistory ? "rotate(180deg)" : "rotate(0deg)",
                  transition: "transform 0.2s",
                }}
              />
            </IconButton>
          </Stack>

          <Collapse in={showHistory}>
            {loading ? (
              <Box display="flex" justifyContent="center" py={3}>
                <CircularProgress size={24} />
              </Box>
            ) : feedbackHistory.length === 0 ? (
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ py: 2, textAlign: "center" }}
              >
                No feedback has been provided yet.
              </Typography>
            ) : (
              <List disablePadding>
                {feedbackHistory.map((fb, index) => {
                  const config = getFeedbackConfig(fb.feedbackType);
                  return (
                    <Box key={fb.id}>
                      {index > 0 && <Divider sx={{ my: 1 }} />}
                      <ListItem
                        alignItems="flex-start"
                        disableGutters
                        secondaryAction={
                          onDeleteFeedback && (
                            <Tooltip title="Delete feedback">
                              <IconButton
                                edge="end"
                                size="small"
                                onClick={() => handleDelete(fb.id)}
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )
                        }
                      >
                        <ListItemAvatar>
                          <Avatar
                            sx={{
                              bgcolor: `${config.color}.light`,
                              color: `${config.color}.main`,
                              width: 32,
                              height: 32,
                            }}
                          >
                            {config.icon}
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={
                            <Stack
                              direction="row"
                              alignItems="center"
                              spacing={1}
                              mb={0.5}
                            >
                              <Chip
                                label={config.label}
                                size="small"
                                color={config.color}
                                variant="outlined"
                              />
                              <Typography
                                variant="caption"
                                color="text.secondary"
                              >
                                {formatDate(fb.createdAt)}
                              </Typography>
                            </Stack>
                          }
                          secondary={
                            <Typography
                              variant="body2"
                              color="text.primary"
                              sx={{ whiteSpace: "pre-wrap" }}
                            >
                              {fb.feedbackText}
                            </Typography>
                          }
                        />
                      </ListItem>
                    </Box>
                  );
                })}
              </List>
            )}
          </Collapse>
        </Box>
      </Stack>
    </Paper>
  );
}

export default FeedbackPanel;
