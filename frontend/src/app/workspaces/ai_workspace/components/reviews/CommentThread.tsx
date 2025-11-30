/**
 * CommentThread (UC-110: Collaborative Document Review)
 *
 * Threaded comment display with reply support.
 * Shows a single comment with all its nested replies.
 *
 * Features:
 * - Display comment with user info and timestamp
 * - Show comment type icon and color
 * - Nested replies with visual hierarchy
 * - Reply and resolve actions
 * - Collapse/expand replies
 */

import { useState } from "react";
import {
  Box,
  Stack,
  Typography,
  Button,
  TextField,
  Paper,
  Chip,
  Collapse,
  Avatar,
  Tooltip,
  CircularProgress,
} from "@mui/material";
import {
  Reply as ReplyIcon,
  CheckCircle as ResolveIcon,
  ExpandMore as ExpandIcon,
  ExpandLess as CollapseIcon,
  Comment as CommentIcon,
  Lightbulb as SuggestionIcon,
  ThumbUp as PraiseIcon,
  Help as QuestionIcon,
  Edit as ChangeRequestIcon,
} from "@mui/icons-material";
import type { ReviewComment, CommentType } from "../../services/reviewService";

// Helper to format relative time
function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

// Comment type configurations
const COMMENT_TYPE_CONFIG: Record<
  CommentType,
  { icon: React.ReactNode; color: string; bgColor: string }
> = {
  comment: {
    icon: <CommentIcon fontSize="small" />,
    color: "#64748b",
    bgColor: "#f1f5f9",
  },
  suggestion: {
    icon: <SuggestionIcon fontSize="small" />,
    color: "#f59e0b",
    bgColor: "#fef3c7",
  },
  praise: {
    icon: <PraiseIcon fontSize="small" />,
    color: "#22c55e",
    bgColor: "#dcfce7",
  },
  change_request: {
    icon: <ChangeRequestIcon fontSize="small" />,
    color: "#ef4444",
    bgColor: "#fee2e2",
  },
  question: {
    icon: <QuestionIcon fontSize="small" />,
    color: "#3b82f6",
    bgColor: "#dbeafe",
  },
  approval: {
    icon: <ResolveIcon fontSize="small" />,
    color: "#22c55e",
    bgColor: "#dcfce7",
  },
  rejection: {
    icon: <ChangeRequestIcon fontSize="small" />,
    color: "#ef4444",
    bgColor: "#fee2e2",
  },
};

interface CommentThreadProps {
  comment: ReviewComment;
  canComment: boolean;
  depth?: number;
  maxDepth?: number;
  onReply: (commentId: string, text: string) => Promise<void>;
  onResolve: (commentId: string, note?: string) => Promise<void>;
  onUnresolve?: (commentId: string) => Promise<void>;
}

export function CommentThread({
  comment,
  canComment,
  depth = 0,
  maxDepth = 3,
  onReply,
  onResolve,
  onUnresolve,
}: CommentThreadProps) {
  const [showReply, setShowReply] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [expanded, setExpanded] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const typeConfig =
    COMMENT_TYPE_CONFIG[comment.comment_type] || COMMENT_TYPE_CONFIG.comment;
  const hasReplies = comment.replies && comment.replies.length > 0;
  const canNest = depth < maxDepth;

  const handleSubmitReply = async () => {
    if (!replyText.trim()) return;

    setSubmitting(true);
    try {
      await onReply(comment.id, replyText.trim());
      setReplyText("");
      setShowReply(false);
    } finally {
      setSubmitting(false);
    }
  };

  const handleResolve = async () => {
    setSubmitting(true);
    try {
      await onResolve(comment.id);
    } finally {
      setSubmitting(false);
    }
  };

  const handleUnresolve = async () => {
    if (!onUnresolve) return;
    setSubmitting(true);
    try {
      await onUnresolve(comment.id);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box
      sx={{
        pl: depth > 0 ? 2 : 0,
        borderLeft: depth > 0 ? 2 : 0,
        borderColor: "divider",
      }}
    >
      <Paper
        elevation={0}
        sx={{
          p: 1.5,
          mb: 1,
          bgcolor: comment.is_resolved
            ? "action.disabledBackground"
            : typeConfig.bgColor,
          opacity: comment.is_resolved ? 0.7 : 1,
          border: 1,
          borderColor: comment.is_resolved ? "divider" : typeConfig.color,
          borderRadius: 1,
        }}
      >
        <Stack spacing={1}>
          {/* Header: User info and type */}
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
          >
            <Stack direction="row" spacing={1} alignItems="center">
              <Avatar
                sx={{
                  width: 28,
                  height: 28,
                  fontSize: "0.875rem",
                  bgcolor: typeConfig.color,
                }}
              >
                {comment.user?.full_name?.charAt(0) || "?"}
              </Avatar>
              <Box>
                <Typography variant="subtitle2" component="span">
                  {comment.user?.full_name || "Unknown User"}
                </Typography>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ ml: 1 }}
                >
                  {formatRelativeTime(comment.created_at)}
                </Typography>
              </Box>
            </Stack>

            <Stack direction="row" spacing={0.5} alignItems="center">
              <Tooltip title={comment.comment_type.replace("_", " ")}>
                <Box sx={{ color: typeConfig.color }}>{typeConfig.icon}</Box>
              </Tooltip>
              {comment.is_resolved && (
                <Chip
                  label="Resolved"
                  size="small"
                  color="success"
                  sx={{ height: 20, fontSize: "0.7rem" }}
                />
              )}
            </Stack>
          </Stack>

          {/* Comment text */}
          <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>
            {comment.comment_text}
          </Typography>

          {/* Edit indicator */}
          {comment.is_edited && (
            <Typography
              variant="caption"
              color="text.secondary"
              fontStyle="italic"
            >
              (edited{" "}
              {formatRelativeTime(comment.edited_at || comment.updated_at)})
            </Typography>
          )}

          {/* Resolution note */}
          {comment.is_resolved && comment.resolution_note && (
            <Box
              sx={{
                bgcolor: "success.main",
                color: "success.contrastText",
                p: 1,
                borderRadius: 1,
                mt: 1,
              }}
            >
              <Typography variant="caption">
                <strong>Resolution:</strong> {comment.resolution_note}
              </Typography>
              {comment.resolver && (
                <Typography variant="caption" display="block">
                  — {comment.resolver.full_name}
                </Typography>
              )}
            </Box>
          )}

          {/* Actions */}
          <Stack direction="row" spacing={1} sx={{ pt: 0.5 }}>
            {/* Reply button */}
            {canComment && canNest && !comment.is_resolved && (
              <Button
                size="small"
                startIcon={<ReplyIcon fontSize="small" />}
                onClick={() => setShowReply(!showReply)}
                sx={{ minWidth: "auto" }}
              >
                Reply
              </Button>
            )}

            {/* Resolve/Unresolve button */}
            {canComment && !comment.is_resolved && (
              <Button
                size="small"
                startIcon={<ResolveIcon fontSize="small" />}
                onClick={handleResolve}
                disabled={submitting}
                color="success"
                sx={{ minWidth: "auto" }}
              >
                Resolve
              </Button>
            )}
            {canComment && comment.is_resolved && onUnresolve && (
              <Button
                size="small"
                onClick={handleUnresolve}
                disabled={submitting}
                sx={{ minWidth: "auto" }}
              >
                Reopen
              </Button>
            )}

            {/* Expand/Collapse replies */}
            {hasReplies && (
              <Button
                size="small"
                onClick={() => setExpanded(!expanded)}
                endIcon={expanded ? <CollapseIcon /> : <ExpandIcon />}
                sx={{ minWidth: "auto", ml: "auto" }}
              >
                {comment.replies?.length}{" "}
                {comment.replies?.length === 1 ? "reply" : "replies"}
              </Button>
            )}
          </Stack>

          {/* Reply form */}
          <Collapse in={showReply}>
            <Stack spacing={1} sx={{ pt: 1 }}>
              <TextField
                size="small"
                multiline
                rows={2}
                placeholder="Write a reply..."
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                fullWidth
                autoFocus
              />
              <Stack direction="row" spacing={1} justifyContent="flex-end">
                <Button
                  size="small"
                  onClick={() => {
                    setShowReply(false);
                    setReplyText("");
                  }}
                >
                  Cancel
                </Button>
                <Button
                  size="small"
                  variant="contained"
                  onClick={handleSubmitReply}
                  disabled={!replyText.trim() || submitting}
                  startIcon={
                    submitting ? <CircularProgress size={14} /> : undefined
                  }
                >
                  Reply
                </Button>
              </Stack>
            </Stack>
          </Collapse>
        </Stack>
      </Paper>

      {/* Nested replies */}
      <Collapse in={expanded}>
        <Stack spacing={0}>
          {comment.replies?.map((reply) => (
            <CommentThread
              key={reply.id}
              comment={reply}
              canComment={canComment}
              depth={depth + 1}
              maxDepth={maxDepth}
              onReply={onReply}
              onResolve={onResolve}
              onUnresolve={onUnresolve}
            />
          ))}
        </Stack>
      </Collapse>
    </Box>
  );
}

export default CommentThread;
