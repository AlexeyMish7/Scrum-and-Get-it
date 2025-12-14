/**
 * SHARED JOB CARD COMPONENT
 *
 * Purpose:
 * - Display a job that was shared with the team
 * - Show job details, share type, and comments
 * - Allow team members to add comments/recommendations
 *
 * Demo Script 4.2 Requirements:
 * - Share job posting with team members
 * - Add collaborative comments and recommendations
 *
 * Usage:
 *   <SharedJobCard job={sharedJobData} onCommentAdded={handleRefresh} />
 */

import { useState } from "react";
import {
  Card,
  CardContent,
  CardActions,
  Typography,
  Stack,
  Chip,
  Box,
  Button,
  IconButton,
  TextField,
  Avatar,
  Divider,
  Collapse,
  Link,
  Tooltip,
  CircularProgress,
  Alert,
} from "@mui/material";
import {
  Work as WorkIcon,
  LocationOn as LocationIcon,
  OpenInNew as OpenInNewIcon,
  Comment as CommentIcon,
  Send as SendIcon,
  ThumbUp as ThumbUpIcon,
  Help as HelpIcon,
  Forum as ForumIcon,
  Info as InfoIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
} from "@mui/icons-material";
import { formatDistanceToNow } from "date-fns";
import { useAuth } from "@shared/context/AuthContext";
import { useTeam } from "@shared/context/useTeam";
import { supabase } from "@shared/services/supabaseClient";
import { getAppQueryClient } from "@shared/cache";
import { coreKeys } from "@shared/cache/coreQueryKeys";
import { fetchTeamMessagesWithProfiles } from "@shared/cache/coreFetchers";

// ============================================================================
// TYPES
// ============================================================================

export interface SharedJobData {
  id: string;
  title: string;
  company: string;
  status?: string;
  location?: string | null;
  url?: string | null;
  shareType: "recommendation" | "help" | "discussion" | "fyi";
  comment?: string | null;
  sharedAt: string;
  sharedBy: {
    id: string;
    name: string;
  };
}

export interface JobComment {
  id: string;
  userId: string;
  userName: string;
  text: string;
  createdAt: string;
}

interface SharedJobCardProps {
  job: SharedJobData;
  comments?: JobComment[];
  onCommentAdded?: () => void;
  compact?: boolean;
}

// Share type configuration with icons and colors
const SHARE_TYPE_CONFIG: Record<
  string,
  {
    label: string;
    icon: React.ReactElement;
    color: "success" | "warning" | "info" | "default";
  }
> = {
  recommendation: {
    label: "Recommendation",
    icon: <ThumbUpIcon fontSize="small" />,
    color: "success",
  },
  help: {
    label: "Need Help",
    icon: <HelpIcon fontSize="small" />,
    color: "warning",
  },
  discussion: {
    label: "Discussion",
    icon: <ForumIcon fontSize="small" />,
    color: "info",
  },
  fyi: {
    label: "FYI",
    icon: <InfoIcon fontSize="small" />,
    color: "default",
  },
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function SharedJobCard({
  job,
  comments: initialComments = [],
  onCommentAdded,
  compact = false,
}: SharedJobCardProps) {
  const { user } = useAuth();
  const { currentTeam } = useTeam();

  // State
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<JobComment[]>(initialComments);
  const [newComment, setNewComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [loadingComments, setLoadingComments] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get share type configuration
  const shareConfig = SHARE_TYPE_CONFIG[job.shareType] || SHARE_TYPE_CONFIG.fyi;

  // Load comments when expanded
  const handleToggleComments = async () => {
    if (!showComments && comments.length === 0) {
      await loadComments();
    }
    setShowComments(!showComments);
  };

  // Load comments for this shared job from team_messages
  const loadComments = async () => {
    if (!currentTeam?.id) return;

    setLoadingComments(true);
    setError(null);

    try {
      if (!user?.id) {
        setError("You must be signed in to view comments");
        return;
      }

      // Load team messages through cache so expanding multiple cards doesn't requery Supabase.
      const qc = getAppQueryClient();
      type MessageRow = {
        id: string;
        sender_id: string;
        message_text: string;
        created_at: string;
        metadata?:
          | ({ parent_share_id?: string } & Record<string, unknown>)
          | null;
        sender?: {
          full_name?: string | null;
          first_name?: string | null;
          last_name?: string | null;
        };
      };
      const data = await qc.ensureQueryData({
        queryKey: coreKeys.teamMessages(user.id, currentTeam.id),
        queryFn: () =>
          fetchTeamMessagesWithProfiles<MessageRow>(user.id, currentTeam.id),
        staleTime: 60 * 60 * 1000,
      });

      // Filter in JS for comments that reference this shared job
      const filtered = (Array.isArray(data) ? data : []).filter((msg) => {
        return msg.metadata?.parent_share_id === job.id;
      });

      const mappedComments: JobComment[] = filtered.map((msg) => ({
        id: msg.id,
        userId: msg.sender_id,
        userName:
          msg.sender?.full_name ||
          `${msg.sender?.first_name || ""} ${
            msg.sender?.last_name || ""
          }`.trim() ||
          "Team Member",
        text: msg.message_text,
        createdAt: msg.created_at,
      }));

      setComments(mappedComments);
    } catch (err) {
      console.error("Error loading comments:", err);
      setError("Failed to load comments");
    } finally {
      setLoadingComments(false);
    }
  };

  // Submit a new comment
  const handleSubmitComment = async () => {
    if (!newComment.trim() || !user?.id || !currentTeam?.id) return;

    setSubmitting(true);
    setError(null);

    try {
      // Get user profile for the comment
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, first_name, last_name")
        .eq("id", user.id)
        .single();

      const userName =
        profile?.full_name ||
        `${profile?.first_name || ""} ${profile?.last_name || ""}`.trim() ||
        "Team Member";

      // Insert comment as a team message with reference to the shared job
      const { data: newMsg, error: insertError } = await supabase
        .from("team_messages")
        .insert({
          team_id: currentTeam.id,
          sender_id: user.id,
          message_text: newComment.trim(),
          metadata: {
            type: "job_comment",
            parent_share_id: job.id,
            job_title: job.title,
            company_name: job.company,
          },
        })
        .select()
        .single();

      if (insertError) {
        console.error("Failed to add comment:", insertError);
        setError("Failed to add comment");
        return;
      }

      // Add to local state
      setComments((prev) => [
        ...prev,
        {
          id: newMsg.id,
          userId: user.id,
          userName,
          text: newComment.trim(),
          createdAt: new Date().toISOString(),
        },
      ]);

      // Keep cached lists consistent for other views.
      getAppQueryClient().invalidateQueries({
        queryKey: coreKeys.teamMessages(user.id, currentTeam.id),
      });

      setNewComment("");
      onCommentAdded?.();
    } catch (err) {
      console.error("Error adding comment:", err);
      setError("Failed to add comment");
    } finally {
      setSubmitting(false);
    }
  };

  // Handle enter key to submit
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmitComment();
    }
  };

  return (
    <Card variant="outlined" sx={{ mb: 2 }}>
      <CardContent sx={{ pb: 1 }}>
        {/* Header: Share type and sharer info */}
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="flex-start"
          sx={{ mb: 1.5 }}
        >
          <Stack direction="row" spacing={1} alignItems="center">
            <Avatar
              sx={{
                width: 32,
                height: 32,
                bgcolor: "primary.main",
                fontSize: 14,
              }}
            >
              {job.sharedBy.name[0]?.toUpperCase() || "?"}
            </Avatar>
            <Box>
              <Typography variant="body2" fontWeight="medium">
                {job.sharedBy.name}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {formatDistanceToNow(new Date(job.sharedAt), {
                  addSuffix: true,
                })}
              </Typography>
            </Box>
          </Stack>
          <Chip
            icon={shareConfig.icon}
            label={shareConfig.label}
            size="small"
            color={shareConfig.color}
            variant="outlined"
          />
        </Stack>

        {/* Job Details Card */}
        <Box
          sx={{
            p: 2,
            bgcolor: "background.default",
            borderRadius: 1,
            border: 1,
            borderColor: "divider",
          }}
        >
          <Stack direction="row" alignItems="flex-start" spacing={2}>
            <Avatar sx={{ bgcolor: "primary.light" }}>
              <WorkIcon />
            </Avatar>
            <Box sx={{ flex: 1 }}>
              <Stack direction="row" alignItems="center" spacing={1}>
                <Typography variant="subtitle1" fontWeight="medium">
                  {job.title}
                </Typography>
                {job.url && (
                  <Tooltip title="Open job posting">
                    <IconButton
                      size="small"
                      component={Link}
                      href={job.url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <OpenInNewIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                )}
              </Stack>
              <Typography variant="body2" color="text.secondary">
                {job.company}
              </Typography>
              <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                {job.location && (
                  <Chip
                    icon={<LocationIcon />}
                    label={job.location}
                    size="small"
                    variant="outlined"
                  />
                )}
                {job.status && (
                  <Chip
                    label={job.status}
                    size="small"
                    color="primary"
                    variant="outlined"
                  />
                )}
              </Stack>
            </Box>
          </Stack>
        </Box>

        {/* Sharer's Comment */}
        {job.comment && (
          <Box sx={{ mt: 2, p: 1.5, bgcolor: "action.hover", borderRadius: 1 }}>
            <Typography variant="body2">{job.comment}</Typography>
          </Box>
        )}
      </CardContent>

      {/* Actions and Comments */}
      {!compact && (
        <>
          <Divider />
          <CardActions sx={{ justifyContent: "space-between", px: 2 }}>
            <Button
              size="small"
              startIcon={<CommentIcon />}
              endIcon={showComments ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              onClick={handleToggleComments}
            >
              {comments.length > 0
                ? `${comments.length} Comments`
                : "Add Comment"}
            </Button>
          </CardActions>

          {/* Comments Section */}
          <Collapse in={showComments}>
            <Box sx={{ px: 2, pb: 2 }}>
              {error && (
                <Alert
                  severity="error"
                  sx={{ mb: 2 }}
                  onClose={() => setError(null)}
                >
                  {error}
                </Alert>
              )}

              {loadingComments ? (
                <Box display="flex" justifyContent="center" py={2}>
                  <CircularProgress size={24} />
                </Box>
              ) : (
                <>
                  {/* Existing Comments */}
                  {comments.length > 0 && (
                    <Stack spacing={1.5} sx={{ mb: 2 }}>
                      {comments.map((comment) => (
                        <Box
                          key={comment.id}
                          sx={{
                            display: "flex",
                            gap: 1.5,
                          }}
                        >
                          <Avatar sx={{ width: 28, height: 28, fontSize: 12 }}>
                            {comment.userName[0]?.toUpperCase() || "?"}
                          </Avatar>
                          <Box sx={{ flex: 1 }}>
                            <Stack
                              direction="row"
                              spacing={1}
                              alignItems="center"
                            >
                              <Typography variant="body2" fontWeight="medium">
                                {comment.userName}
                              </Typography>
                              <Typography
                                variant="caption"
                                color="text.secondary"
                              >
                                {formatDistanceToNow(
                                  new Date(comment.createdAt),
                                  {
                                    addSuffix: true,
                                  }
                                )}
                              </Typography>
                            </Stack>
                            <Typography variant="body2" color="text.secondary">
                              {comment.text}
                            </Typography>
                          </Box>
                        </Box>
                      ))}
                    </Stack>
                  )}

                  {/* New Comment Input */}
                  <Stack direction="row" spacing={1}>
                    <TextField
                      fullWidth
                      size="small"
                      placeholder="Add a comment or recommendation..."
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      onKeyPress={handleKeyPress}
                      disabled={submitting}
                      multiline
                      maxRows={3}
                    />
                    <IconButton
                      color="primary"
                      onClick={handleSubmitComment}
                      disabled={!newComment.trim() || submitting}
                    >
                      {submitting ? (
                        <CircularProgress size={20} />
                      ) : (
                        <SendIcon />
                      )}
                    </IconButton>
                  </Stack>
                </>
              )}
            </Box>
          </Collapse>
        </>
      )}
    </Card>
  );
}

export default SharedJobCard;
