/**
 * ReviewSidebar (UC-110: Collaborative Document Review)
 *
 * Sidebar component displaying all comments for a document review.
 * Supports threaded comments, filtering, and adding new comments.
 *
 * Features:
 * - List all comments (resolved and unresolved)
 * - Filter by status, type, or section
 * - Add new comments
 * - Reply to existing comments
 * - Resolve/unresolve comments
 */

import { useState } from "react";
import {
  Box,
  Stack,
  Typography,
  Button,
  TextField,
  IconButton,
  Paper,
  Chip,
  Collapse,
  Divider,
  ToggleButton,
  ToggleButtonGroup,
  CircularProgress,
  Tooltip,
  Menu,
  MenuItem,
} from "@mui/material";
import {
  Add as AddIcon,
  Send as SendIcon,
  CheckCircle as ResolveIcon,
  Comment as CommentIcon,
  Lightbulb as SuggestionIcon,
  ThumbUp as PraiseIcon,
  Help as QuestionIcon,
  ExpandMore as ExpandIcon,
  ExpandLess as CollapseIcon,
  FilterList as FilterIcon,
  Refresh as RefreshIcon,
} from "@mui/icons-material";
import type { ReviewComment, CommentType } from "../../services/reviewService";

// Comment type icons and colors
const COMMENT_TYPE_CONFIG: Record<
  CommentType,
  { icon: React.ReactNode; color: string; label: string }
> = {
  comment: {
    icon: <CommentIcon fontSize="small" />,
    color: "#64748b",
    label: "Comment",
  },
  suggestion: {
    icon: <SuggestionIcon fontSize="small" />,
    color: "#f59e0b",
    label: "Suggestion",
  },
  praise: {
    icon: <PraiseIcon fontSize="small" />,
    color: "#22c55e",
    label: "Praise",
  },
  change_request: {
    icon: <CommentIcon fontSize="small" />,
    color: "#ef4444",
    label: "Change Request",
  },
  question: {
    icon: <QuestionIcon fontSize="small" />,
    color: "#3b82f6",
    label: "Question",
  },
  approval: {
    icon: <ResolveIcon fontSize="small" />,
    color: "#22c55e",
    label: "Approval",
  },
  rejection: {
    icon: <CommentIcon fontSize="small" />,
    color: "#ef4444",
    label: "Rejection",
  },
};

interface ReviewSidebarProps {
  comments: ReviewComment[];
  loading: boolean;
  canComment: boolean;
  onAddComment: (
    text: string,
    type: CommentType,
    parentId?: string
  ) => Promise<void>;
  onResolveComment: (commentId: string, note?: string) => Promise<void>;
  onRefresh: () => void;
}

export function ReviewSidebar({
  comments,
  loading,
  canComment,
  onAddComment,
  onResolveComment,
  onRefresh,
}: ReviewSidebarProps) {
  // State for new comment form
  const [showNewComment, setShowNewComment] = useState(false);
  const [newCommentText, setNewCommentText] = useState("");
  const [newCommentType, setNewCommentType] = useState<CommentType>("comment");
  const [submitting, setSubmitting] = useState(false);

  // State for filtering
  const [filter, setFilter] = useState<"all" | "unresolved" | "resolved">(
    "unresolved"
  );
  const [filterAnchor, setFilterAnchor] = useState<null | HTMLElement>(null);

  // State for expanded comment threads
  const [expandedThreads, setExpandedThreads] = useState<Set<string>>(
    new Set()
  );

  // Filter comments based on current filter
  const filteredComments = comments.filter((comment) => {
    if (filter === "all") return true;
    if (filter === "unresolved") return !comment.is_resolved;
    if (filter === "resolved") return comment.is_resolved;
    return true;
  });

  // Count stats
  const unresolvedCount = comments.filter((c) => !c.is_resolved).length;
  const resolvedCount = comments.filter((c) => c.is_resolved).length;

  /**
   * Handle submitting a new comment
   */
  const handleSubmitComment = async () => {
    if (!newCommentText.trim()) return;

    setSubmitting(true);
    try {
      await onAddComment(newCommentText.trim(), newCommentType);
      setNewCommentText("");
      setShowNewComment(false);
    } finally {
      setSubmitting(false);
    }
  };

  /**
   * Toggle thread expansion
   */
  const toggleThread = (commentId: string) => {
    setExpandedThreads((prev) => {
      const next = new Set(prev);
      if (next.has(commentId)) {
        next.delete(commentId);
      } else {
        next.add(commentId);
      }
      return next;
    });
  };

  return (
    <Paper sx={{ p: 2 }}>
      <Stack spacing={2}>
        {/* Header with filters */}
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
        >
          <Typography variant="h6">
            Comments ({unresolvedCount} open)
          </Typography>
          <Stack direction="row" spacing={1}>
            <IconButton size="small" onClick={onRefresh} disabled={loading}>
              <RefreshIcon fontSize="small" />
            </IconButton>
            <IconButton
              size="small"
              onClick={(e) => setFilterAnchor(e.currentTarget)}
            >
              <FilterIcon fontSize="small" />
            </IconButton>
          </Stack>
        </Stack>

        {/* Filter menu */}
        <Menu
          anchorEl={filterAnchor}
          open={Boolean(filterAnchor)}
          onClose={() => setFilterAnchor(null)}
        >
          <MenuItem
            selected={filter === "all"}
            onClick={() => {
              setFilter("all");
              setFilterAnchor(null);
            }}
          >
            All ({comments.length})
          </MenuItem>
          <MenuItem
            selected={filter === "unresolved"}
            onClick={() => {
              setFilter("unresolved");
              setFilterAnchor(null);
            }}
          >
            Unresolved ({unresolvedCount})
          </MenuItem>
          <MenuItem
            selected={filter === "resolved"}
            onClick={() => {
              setFilter("resolved");
              setFilterAnchor(null);
            }}
          >
            Resolved ({resolvedCount})
          </MenuItem>
        </Menu>

        {/* Filter chips */}
        <Stack direction="row" spacing={1}>
          <Chip
            label={`All (${comments.length})`}
            size="small"
            variant={filter === "all" ? "filled" : "outlined"}
            onClick={() => setFilter("all")}
          />
          <Chip
            label={`Open (${unresolvedCount})`}
            size="small"
            color="warning"
            variant={filter === "unresolved" ? "filled" : "outlined"}
            onClick={() => setFilter("unresolved")}
          />
          <Chip
            label={`Done (${resolvedCount})`}
            size="small"
            color="success"
            variant={filter === "resolved" ? "filled" : "outlined"}
            onClick={() => setFilter("resolved")}
          />
        </Stack>

        <Divider />

        {/* Add comment button/form */}
        {canComment && (
          <Box>
            {!showNewComment ? (
              <Button
                startIcon={<AddIcon />}
                onClick={() => setShowNewComment(true)}
                variant="outlined"
                fullWidth
              >
                Add Comment
              </Button>
            ) : (
              <Stack spacing={1}>
                {/* Comment type selector */}
                <ToggleButtonGroup
                  value={newCommentType}
                  exclusive
                  onChange={(_, value) => value && setNewCommentType(value)}
                  size="small"
                  fullWidth
                >
                  <ToggleButton value="comment">
                    <Tooltip title="Comment">
                      <CommentIcon fontSize="small" />
                    </Tooltip>
                  </ToggleButton>
                  <ToggleButton value="suggestion">
                    <Tooltip title="Suggestion">
                      <SuggestionIcon fontSize="small" />
                    </Tooltip>
                  </ToggleButton>
                  <ToggleButton value="question">
                    <Tooltip title="Question">
                      <QuestionIcon fontSize="small" />
                    </Tooltip>
                  </ToggleButton>
                  <ToggleButton value="praise">
                    <Tooltip title="Praise">
                      <PraiseIcon fontSize="small" />
                    </Tooltip>
                  </ToggleButton>
                </ToggleButtonGroup>

                <TextField
                  multiline
                  rows={3}
                  placeholder="Write your comment..."
                  value={newCommentText}
                  onChange={(e) => setNewCommentText(e.target.value)}
                  fullWidth
                  autoFocus
                />

                <Stack direction="row" spacing={1} justifyContent="flex-end">
                  <Button
                    size="small"
                    onClick={() => {
                      setShowNewComment(false);
                      setNewCommentText("");
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    size="small"
                    variant="contained"
                    startIcon={
                      submitting ? <CircularProgress size={16} /> : <SendIcon />
                    }
                    onClick={handleSubmitComment}
                    disabled={!newCommentText.trim() || submitting}
                  >
                    Post
                  </Button>
                </Stack>
              </Stack>
            )}
          </Box>
        )}

        {/* Loading state */}
        {loading && (
          <Box display="flex" justifyContent="center" py={3}>
            <CircularProgress size={24} />
          </Box>
        )}

        {/* Empty state */}
        {!loading && filteredComments.length === 0 && (
          <Box textAlign="center" py={3}>
            <Typography color="text.secondary">
              {filter === "unresolved"
                ? "No unresolved comments"
                : filter === "resolved"
                ? "No resolved comments"
                : "No comments yet"}
            </Typography>
          </Box>
        )}

        {/* Comments list */}
        <Stack spacing={1}>
          {filteredComments.map((comment) => (
            <CommentCard
              key={comment.id}
              comment={comment}
              canComment={canComment}
              expanded={expandedThreads.has(comment.id)}
              onToggle={() => toggleThread(comment.id)}
              onReply={(text) => onAddComment(text, "comment", comment.id)}
              onResolve={(note) => onResolveComment(comment.id, note)}
            />
          ))}
        </Stack>
      </Stack>
    </Paper>
  );
}

// Individual comment card component
interface CommentCardProps {
  comment: ReviewComment;
  canComment: boolean;
  expanded: boolean;
  onToggle: () => void;
  onReply: (text: string) => Promise<void>;
  onResolve: (note?: string) => Promise<void>;
}

function CommentCard({
  comment,
  canComment,
  expanded,
  onToggle,
  onReply,
  onResolve,
}: CommentCardProps) {
  const [showReply, setShowReply] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const typeConfig =
    COMMENT_TYPE_CONFIG[comment.comment_type] || COMMENT_TYPE_CONFIG.comment;
  const hasReplies = comment.replies && comment.replies.length > 0;

  const handleSubmitReply = async () => {
    if (!replyText.trim()) return;
    setSubmitting(true);
    try {
      await onReply(replyText.trim());
      setReplyText("");
      setShowReply(false);
    } finally {
      setSubmitting(false);
    }
  };

  const handleResolve = async () => {
    await onResolve();
  };

  return (
    <Paper
      variant="outlined"
      sx={{
        p: 1.5,
        bgcolor: comment.is_resolved
          ? "action.disabledBackground"
          : "background.paper",
        opacity: comment.is_resolved ? 0.7 : 1,
      }}
    >
      <Stack spacing={1}>
        {/* Comment header */}
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
        >
          <Stack direction="row" spacing={1} alignItems="center">
            <Box sx={{ color: typeConfig.color }}>{typeConfig.icon}</Box>
            <Typography variant="subtitle2">
              {comment.user?.full_name || "Unknown"}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {new Date(comment.created_at).toLocaleDateString()}
            </Typography>
          </Stack>

          <Stack direction="row" spacing={0.5}>
            {comment.is_resolved ? (
              <Chip label="Resolved" size="small" color="success" />
            ) : (
              canComment && (
                <Tooltip title="Mark as resolved">
                  <IconButton size="small" onClick={handleResolve}>
                    <ResolveIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              )
            )}
          </Stack>
        </Stack>

        {/* Comment text */}
        <Typography variant="body2">{comment.comment_text}</Typography>

        {/* Edit indicator */}
        {comment.is_edited && (
          <Typography
            variant="caption"
            color="text.secondary"
            fontStyle="italic"
          >
            (edited)
          </Typography>
        )}

        {/* Resolution note */}
        {comment.is_resolved && comment.resolution_note && (
          <Box
            sx={{
              bgcolor: "success.light",
              p: 1,
              borderRadius: 1,
              opacity: 0.8,
            }}
          >
            <Typography variant="caption">
              <strong>Resolution:</strong> {comment.resolution_note}
            </Typography>
          </Box>
        )}

        {/* Actions */}
        <Stack direction="row" spacing={1}>
          {canComment && !comment.is_resolved && (
            <Button size="small" onClick={() => setShowReply(!showReply)}>
              Reply
            </Button>
          )}
          {hasReplies && (
            <Button size="small" onClick={onToggle}>
              {expanded ? <CollapseIcon /> : <ExpandIcon />}
              {comment.replies?.length}{" "}
              {comment.replies?.length === 1 ? "reply" : "replies"}
            </Button>
          )}
        </Stack>

        {/* Reply form */}
        <Collapse in={showReply}>
          <Stack spacing={1} sx={{ pl: 2, pt: 1 }}>
            <TextField
              size="small"
              multiline
              rows={2}
              placeholder="Write a reply..."
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              fullWidth
            />
            <Stack direction="row" spacing={1} justifyContent="flex-end">
              <Button size="small" onClick={() => setShowReply(false)}>
                Cancel
              </Button>
              <Button
                size="small"
                variant="contained"
                onClick={handleSubmitReply}
                disabled={!replyText.trim() || submitting}
              >
                {submitting ? <CircularProgress size={16} /> : "Reply"}
              </Button>
            </Stack>
          </Stack>
        </Collapse>

        {/* Nested replies */}
        <Collapse in={expanded}>
          <Stack
            spacing={1}
            sx={{ pl: 2, pt: 1, borderLeft: 2, borderColor: "divider" }}
          >
            {comment.replies?.map((reply) => (
              <CommentCard
                key={reply.id}
                comment={reply}
                canComment={canComment}
                expanded={false}
                onToggle={() => {}}
                onReply={onReply}
                onResolve={(note) => onResolve(note)}
              />
            ))}
          </Stack>
        </Collapse>
      </Stack>
    </Paper>
  );
}

export default ReviewSidebar;
