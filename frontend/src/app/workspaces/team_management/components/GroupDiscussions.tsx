/**
 * GROUP DISCUSSIONS COMPONENT
 *
 * Purpose:
 * - View and participate in peer group discussions
 * - Post anonymously or with identity
 * - Reply to discussions
 * - Like and interact with posts
 *
 * Usage:
 *   <GroupDiscussions groupId="uuid" />
 */

import { useState, useEffect } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Stack,
  Avatar,
  IconButton,
  Chip,
  Divider,
  CircularProgress,
  Alert,
  FormControlLabel,
  Switch,
  Collapse,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from "@mui/material";
import {
  Send as SendIcon,
  ThumbUp as ThumbUpIcon,
  ThumbUpOutlined as ThumbUpOutlinedIcon,
  Comment as CommentIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Visibility as VisibilityIcon,
  PushPin as PushPinIcon,
} from "@mui/icons-material";
import { useAuth } from "@shared/context/AuthContext";
import * as peerNetworkingService from "../services/peerNetworkingService";
import type {
  PeerDiscussionWithAuthor,
  CreateDiscussionData,
} from "../types";

interface GroupDiscussionsProps {
  groupId: string;
}

const CATEGORY_OPTIONS = [
  { value: "question", label: "Question" },
  { value: "tip", label: "Tip / Advice" },
  { value: "success_story", label: "Success Story" },
  { value: "referral", label: "Referral" },
  { value: "vent", label: "Vent / Support" },
  { value: "general", label: "General Discussion" },
];

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return "just now";
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 604800)
    return `${Math.floor(diffInSeconds / 86400)}d ago`;

  return date.toLocaleDateString();
}

export function GroupDiscussions({ groupId }: GroupDiscussionsProps) {
  const { user } = useAuth();

  // State
  const [discussions, setDiscussions] = useState<PeerDiscussionWithAuthor[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // New post state
  const [showNewPost, setShowNewPost] = useState(false);
  const [newPostTitle, setNewPostTitle] = useState("");
  const [newPostContent, setNewPostContent] = useState("");
  const [newPostCategory, setNewPostCategory] = useState("general");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [posting, setPosting] = useState(false);

  // Reply state
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [replyAnonymous, setReplyAnonymous] = useState(false);
  const [submittingReply, setSubmittingReply] = useState(false);

  // Expanded replies state
  const [expandedReplies, setExpandedReplies] = useState<Set<string>>(
    new Set()
  );
  const [repliesCache, setRepliesCache] = useState<
    Record<string, PeerDiscussionWithAuthor[]>
  >({});
  const [loadingReplies, setLoadingReplies] = useState<Set<string>>(new Set());

  // Load discussions
  useEffect(() => {
    async function loadDiscussions() {
      if (!user) return;

      setLoading(true);
      const result = await peerNetworkingService.getGroupDiscussions(
        user.id,
        groupId,
        { limit: 50 }
      );

      if (result.error) {
        setError(result.error.message);
      } else {
        setDiscussions(result.data || []);
      }
      setLoading(false);
    }

    loadDiscussions();
  }, [user, groupId]);

  // Handle creating a new post
  const handleCreatePost = async () => {
    if (!user || !newPostContent.trim()) return;

    setPosting(true);
    setError(null);

    const data: CreateDiscussionData = {
      group_id: groupId,
      title: newPostTitle.trim() || undefined,
      content: newPostContent.trim(),
      is_anonymous: isAnonymous,
      category: newPostCategory,
    };

    const result = await peerNetworkingService.createDiscussion(user.id, data);

    if (result.error) {
      setError(result.error.message);
    } else if (result.data) {
      // Add new post to the list
      setDiscussions((prev) => [
        {
          ...result.data!,
          author: isAnonymous
            ? {
                full_name: "Anonymous",
                first_name: null,
                last_name: null,
                email: null,
                professional_title: null,
              }
            : undefined,
          has_liked: false,
        },
        ...prev,
      ]);
      setNewPostTitle("");
      setNewPostContent("");
      setNewPostCategory("general");
      setIsAnonymous(false);
      setShowNewPost(false);
    }

    setPosting(false);
  };

  // Handle liking/unliking a post
  const handleToggleLike = async (discussion: PeerDiscussionWithAuthor) => {
    if (!user) return;

    const wasLiked = discussion.has_liked;

    // Optimistic update
    setDiscussions((prev) =>
      prev.map((d) =>
        d.id === discussion.id
          ? {
              ...d,
              has_liked: !wasLiked,
              likes_count: wasLiked ? d.likes_count - 1 : d.likes_count + 1,
            }
          : d
      )
    );

    // Also update replies cache if applicable
    Object.keys(repliesCache).forEach((parentId) => {
      setRepliesCache((prev) => ({
        ...prev,
        [parentId]: prev[parentId].map((r) =>
          r.id === discussion.id
            ? {
                ...r,
                has_liked: !wasLiked,
                likes_count: wasLiked ? r.likes_count - 1 : r.likes_count + 1,
              }
            : r
        ),
      }));
    });

    // Make API call
    if (wasLiked) {
      await peerNetworkingService.unlikeDiscussion(user.id, discussion.id);
    } else {
      await peerNetworkingService.likeDiscussion(user.id, discussion.id);
    }
  };

  // Handle loading replies
  const handleToggleReplies = async (discussionId: string) => {
    if (expandedReplies.has(discussionId)) {
      setExpandedReplies((prev) => {
        const next = new Set(prev);
        next.delete(discussionId);
        return next;
      });
      return;
    }

    // Load replies if not cached
    if (!repliesCache[discussionId] && user) {
      setLoadingReplies((prev) => new Set(prev).add(discussionId));

      const result = await peerNetworkingService.getDiscussionReplies(
        user.id,
        discussionId
      );

      if (result.data) {
        setRepliesCache((prev) => ({
          ...prev,
          [discussionId]: result.data!,
        }));
      }

      setLoadingReplies((prev) => {
        const next = new Set(prev);
        next.delete(discussionId);
        return next;
      });
    }

    setExpandedReplies((prev) => new Set(prev).add(discussionId));
  };

  // Handle submitting a reply
  const handleSubmitReply = async (parentId: string) => {
    if (!user || !replyContent.trim()) return;

    setSubmittingReply(true);

    const data: CreateDiscussionData = {
      group_id: groupId,
      content: replyContent.trim(),
      parent_id: parentId,
      is_anonymous: replyAnonymous,
    };

    const result = await peerNetworkingService.createDiscussion(user.id, data);

    if (result.error) {
      setError(result.error.message);
    } else if (result.data) {
      // Add reply to cache
      setRepliesCache((prev) => ({
        ...prev,
        [parentId]: [
          ...(prev[parentId] || []),
          {
            ...result.data!,
            author: replyAnonymous
              ? {
                  full_name: "Anonymous",
                  first_name: null,
                  last_name: null,
                  email: null,
                  professional_title: null,
                }
              : undefined,
            has_liked: false,
          },
        ],
      }));

      // Update reply count
      setDiscussions((prev) =>
        prev.map((d) =>
          d.id === parentId ? { ...d, replies_count: d.replies_count + 1 } : d
        )
      );

      setReplyContent("");
      setReplyAnonymous(false);
      setReplyingTo(null);
    }

    setSubmittingReply(false);
  };

  // Render a single discussion post
  const renderDiscussion = (
    discussion: PeerDiscussionWithAuthor,
    isReply = false
  ) => (
    <Card
      key={discussion.id}
      sx={{ mb: isReply ? 1 : 2, ml: isReply ? 4 : 0 }}
      variant={isReply ? "outlined" : "elevation"}
    >
      <CardContent>
        {/* Header */}
        <Stack direction="row" spacing={2} alignItems="flex-start" mb={1}>
          <Avatar sx={{ width: 32, height: 32 }}>
            {(discussion.author?.full_name || "A")[0].toUpperCase()}
          </Avatar>
          <Box flex={1}>
            <Stack direction="row" spacing={1} alignItems="center">
              <Typography variant="subtitle2">
                {discussion.author?.full_name || "Unknown"}
              </Typography>
              {discussion.is_anonymous && (
                <Chip label="Anonymous" size="small" variant="outlined" />
              )}
              {discussion.is_pinned && (
                <PushPinIcon sx={{ fontSize: 16, color: "primary.main" }} />
              )}
              <Typography variant="caption" color="text.secondary">
                {formatTimeAgo(discussion.created_at)}
              </Typography>
            </Stack>
            {!isReply && discussion.category && (
              <Chip
                label={
                  CATEGORY_OPTIONS.find((c) => c.value === discussion.category)
                    ?.label || discussion.category
                }
                size="small"
                sx={{ mt: 0.5 }}
              />
            )}
          </Box>
        </Stack>

        {/* Title (if present) */}
        {discussion.title && (
          <Typography variant="h6" gutterBottom>
            {discussion.title}
          </Typography>
        )}

        {/* Content */}
        <Typography variant="body1" sx={{ whiteSpace: "pre-wrap", mb: 2 }}>
          {discussion.content}
        </Typography>

        {/* Tags */}
        {discussion.tags && discussion.tags.length > 0 && (
          <Stack direction="row" spacing={0.5} mb={1} flexWrap="wrap">
            {discussion.tags.map((tag) => (
              <Chip key={tag} label={`#${tag}`} size="small" variant="outlined" />
            ))}
          </Stack>
        )}

        {/* Actions */}
        <Stack direction="row" spacing={2} alignItems="center">
          <Button
            size="small"
            startIcon={
              discussion.has_liked ? <ThumbUpIcon /> : <ThumbUpOutlinedIcon />
            }
            onClick={() => handleToggleLike(discussion)}
            color={discussion.has_liked ? "primary" : "inherit"}
          >
            {discussion.likes_count}
          </Button>

          {!isReply && (
            <>
              <Button
                size="small"
                startIcon={<CommentIcon />}
                onClick={() =>
                  setReplyingTo(
                    replyingTo === discussion.id ? null : discussion.id
                  )
                }
              >
                Reply
              </Button>

              {discussion.replies_count > 0 && (
                <Button
                  size="small"
                  endIcon={
                    expandedReplies.has(discussion.id) ? (
                      <ExpandLessIcon />
                    ) : (
                      <ExpandMoreIcon />
                    )
                  }
                  onClick={() => handleToggleReplies(discussion.id)}
                  disabled={loadingReplies.has(discussion.id)}
                >
                  {loadingReplies.has(discussion.id) ? (
                    <CircularProgress size={16} />
                  ) : (
                    `${discussion.replies_count} ${
                      discussion.replies_count === 1 ? "reply" : "replies"
                    }`
                  )}
                </Button>
              )}
            </>
          )}

          <Box flex={1} />

          <Stack direction="row" spacing={0.5} alignItems="center">
            <VisibilityIcon sx={{ fontSize: 16, color: "text.secondary" }} />
            <Typography variant="caption" color="text.secondary">
              {discussion.views_count}
            </Typography>
          </Stack>
        </Stack>

        {/* Reply Form */}
        {!isReply && replyingTo === discussion.id && (
          <Box mt={2} pl={4}>
            <Stack spacing={1}>
              <TextField
                fullWidth
                multiline
                rows={2}
                placeholder="Write a reply..."
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                size="small"
              />
              <Stack direction="row" spacing={1} alignItems="center">
                <FormControlLabel
                  control={
                    <Switch
                      checked={replyAnonymous}
                      onChange={(e) => setReplyAnonymous(e.target.checked)}
                      size="small"
                    />
                  }
                  label="Anonymous"
                />
                <Box flex={1} />
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => setReplyingTo(null)}
                >
                  Cancel
                </Button>
                <Button
                  variant="contained"
                  size="small"
                  onClick={() => handleSubmitReply(discussion.id)}
                  disabled={!replyContent.trim() || submittingReply}
                  startIcon={
                    submittingReply ? (
                      <CircularProgress size={16} />
                    ) : (
                      <SendIcon />
                    )
                  }
                >
                  Reply
                </Button>
              </Stack>
            </Stack>
          </Box>
        )}
      </CardContent>

      {/* Replies */}
      {!isReply && expandedReplies.has(discussion.id) && (
        <Box px={2} pb={2}>
          <Divider sx={{ mb: 2 }} />
          {repliesCache[discussion.id]?.map((reply) =>
            renderDiscussion(reply, true)
          )}
        </Box>
      )}
    </Card>
  );

  // Loading state
  if (loading) {
    return (
      <Box display="flex" justifyContent="center" py={4}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {/* Error Display */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* New Post Button/Form */}
      <Box mb={3}>
        {!showNewPost ? (
          <Card
            sx={{ cursor: "pointer", "&:hover": { bgcolor: "action.hover" } }}
            onClick={() => setShowNewPost(true)}
          >
            <CardContent>
              <Stack direction="row" spacing={2} alignItems="center">
                <Avatar />
                <Typography color="text.secondary">
                  Share something with the group...
                </Typography>
              </Stack>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent>
              <Stack spacing={2}>
                <TextField
                  fullWidth
                  placeholder="Title (optional)"
                  value={newPostTitle}
                  onChange={(e) => setNewPostTitle(e.target.value)}
                />
                <TextField
                  fullWidth
                  multiline
                  rows={4}
                  placeholder="What's on your mind?"
                  value={newPostContent}
                  onChange={(e) => setNewPostContent(e.target.value)}
                />
                <Stack direction="row" spacing={2} alignItems="center">
                  <FormControl size="small" sx={{ minWidth: 150 }}>
                    <InputLabel>Category</InputLabel>
                    <Select
                      value={newPostCategory}
                      label="Category"
                      onChange={(e) => setNewPostCategory(e.target.value)}
                    >
                      {CATEGORY_OPTIONS.map((opt) => (
                        <MenuItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={isAnonymous}
                        onChange={(e) => setIsAnonymous(e.target.checked)}
                      />
                    }
                    label="Post anonymously"
                  />
                  <Box flex={1} />
                  <Button onClick={() => setShowNewPost(false)}>Cancel</Button>
                  <Button
                    variant="contained"
                    onClick={handleCreatePost}
                    disabled={!newPostContent.trim() || posting}
                    startIcon={
                      posting ? <CircularProgress size={20} /> : <SendIcon />
                    }
                  >
                    Post
                  </Button>
                </Stack>
              </Stack>
            </CardContent>
          </Card>
        )}
      </Box>

      {/* Discussions List */}
      {discussions.length === 0 ? (
        <Box textAlign="center" py={6}>
          <CommentIcon sx={{ fontSize: 64, color: "text.secondary", mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No discussions yet
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            Be the first to start a conversation!
          </Typography>
          <Button
            variant="contained"
            onClick={() => setShowNewPost(true)}
            startIcon={<SendIcon />}
          >
            Start a Discussion
          </Button>
        </Box>
      ) : (
        discussions.map((discussion) => renderDiscussion(discussion))
      )}
    </Box>
  );
}
