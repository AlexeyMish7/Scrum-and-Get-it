/**
 * GROUP DISCUSSION COMPONENT
 *
 * Displays and manages discussion posts within a peer group.
 * Supports anonymous posting, replies, likes, and different post types.
 *
 * Features:
 * - Create new posts with optional anonymity
 * - View posts by type (discussion, question, insight, etc.)
 * - Like and reply to posts
 * - Anonymous insights from peers
 */

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Avatar,
  IconButton,
  Button,
  TextField,
  Chip,
  Stack,
  Divider,
  CircularProgress,
  Alert,
  Menu,
  MenuItem,
  FormControlLabel,
  Switch,
  Collapse,
  Paper,
  Tooltip,
  Select,
  FormControl,
  InputLabel,
} from "@mui/material";
import {
  ThumbUp as ThumbUpIcon,
  ThumbUpOutlined as ThumbUpOutlinedIcon,
  ChatBubbleOutline as CommentIcon,
  MoreVert as MoreVertIcon,
  Send as SendIcon,
  VisibilityOff as AnonymousIcon,
  Person as PersonIcon,
  PushPin as PinIcon,
  Delete as DeleteIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
} from "@mui/icons-material";
import { useAuth } from "@shared/context/AuthContext";
import { networkKeys } from "@shared/cache/networkQueryKeys";
import {
  getGroupPosts,
  createPost,
  likePost,
  unlikePost,
  deletePost,
  getPostReplies,
} from "../services/peerGroupsService";
import type {
  PeerPostWithAuthor,
  PeerPostType,
  CreatePostData,
} from "../types/peerGroups.types";
import { POST_TYPE_INFO } from "../types/peerGroups.types";

// ============================================================================
// PROPS AND TYPES
// ============================================================================

interface GroupDiscussionProps {
  groupId: string;
  canPost?: boolean;
}

interface PostCardProps {
  post: PeerPostWithAuthor;
  onLike: (postId: string, isLiked: boolean) => Promise<void>;
  onReply: (
    postId: string,
    content: string,
    isAnonymous: boolean
  ) => Promise<void>;
  onDelete: (postId: string) => Promise<void>;
  isDeleting: boolean;
  currentUserId: string;
}

// ============================================================================
// POST CARD COMPONENT
// ============================================================================

function PostCard({
  post,
  onLike,
  onReply,
  onDelete,
  isDeleting,
  currentUserId,
}: PostCardProps) {
  const queryClient = useQueryClient();
  const [showReplies, setShowReplies] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [isAnonymousReply, setIsAnonymousReply] = useState(false);
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [submittingReply, setSubmittingReply] = useState(false);

  const postTypeInfo = POST_TYPE_INFO[post.post_type] || {
    label: post.post_type,
    icon: "💬",
  };

  const isOwnPost = post.author_id === currentUserId;
  const timeAgo = getTimeAgo(post.created_at);

  function toggleReplies() {
    setShowReplies((prev) => !prev);
  }

  const repliesQuery = useQuery({
    queryKey: networkKeys.peerPostReplies(currentUserId, post.id),
    enabled: showReplies,
    queryFn: async () => {
      const result = await getPostReplies(currentUserId, post.id);
      if (result.error) throw result.error;
      return result.data ?? [];
    },
  });

  async function handleSubmitReply() {
    if (!replyText.trim()) return;

    setSubmittingReply(true);
    await onReply(post.id, replyText, isAnonymousReply);
    setReplyText("");
    setIsAnonymousReply(false);

    // Refresh replies (and reply counts if parent invalidates posts)
    await queryClient.invalidateQueries({
      queryKey: networkKeys.peerPostReplies(currentUserId, post.id),
    });
    setSubmittingReply(false);
  }

  return (
    <Card sx={{ mb: 2 }}>
      <CardContent>
        {/* Post Header */}
        <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
          <Avatar
            sx={{
              bgcolor: post.is_anonymous ? "grey.500" : "primary.main",
              width: 40,
              height: 40,
            }}
          >
            {post.is_anonymous ? (
              <AnonymousIcon />
            ) : (
              post.author?.display_name?.charAt(0) || <PersonIcon />
            )}
          </Avatar>
          <Box sx={{ ml: 1.5, flexGrow: 1 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Typography variant="subtitle2">
                {post.author?.display_name || "Anonymous"}
              </Typography>
              {post.is_pinned && (
                <Tooltip title="Pinned post">
                  <PinIcon sx={{ fontSize: 14, color: "warning.main" }} />
                </Tooltip>
              )}
            </Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Chip
                label={`${postTypeInfo.icon} ${postTypeInfo.label}`}
                size="small"
                sx={{ height: 20, fontSize: "0.7rem" }}
              />
              <Typography variant="caption" color="text.secondary">
                {timeAgo}
              </Typography>
            </Box>
          </Box>
          {isOwnPost && (
            <IconButton
              size="small"
              onClick={(e) => setMenuAnchor(e.currentTarget)}
            >
              <MoreVertIcon />
            </IconButton>
          )}
        </Box>

        {/* Post Content */}
        {post.title && (
          <Typography variant="h6" gutterBottom>
            {post.title}
          </Typography>
        )}
        <Typography variant="body1" sx={{ mb: 2, whiteSpace: "pre-wrap" }}>
          {post.content}
        </Typography>

        {/* Post Actions */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Button
            size="small"
            startIcon={
              post.is_liked_by_user ? (
                <ThumbUpIcon color="primary" />
              ) : (
                <ThumbUpOutlinedIcon />
              )
            }
            onClick={() => onLike(post.id, post.is_liked_by_user || false)}
            color={post.is_liked_by_user ? "primary" : "inherit"}
          >
            {post.like_count || 0}
          </Button>
          <Button
            size="small"
            startIcon={<CommentIcon />}
            onClick={toggleReplies}
            endIcon={showReplies ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          >
            {post.reply_count || 0} Replies
          </Button>
        </Box>

        {/* Replies Section */}
        <Collapse in={showReplies}>
          <Divider sx={{ my: 2 }} />

          {repliesQuery.isLoading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 2 }}>
              <CircularProgress size={24} />
            </Box>
          ) : (
            <>
              {/* Reply input */}
              <Box sx={{ display: "flex", gap: 1, mb: 2 }}>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="Write a reply..."
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  multiline
                  maxRows={3}
                />
                <Box
                  sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}
                >
                  <Tooltip title="Post anonymously">
                    <IconButton
                      size="small"
                      color={isAnonymousReply ? "primary" : "default"}
                      onClick={() => setIsAnonymousReply(!isAnonymousReply)}
                    >
                      <AnonymousIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <IconButton
                    size="small"
                    color="primary"
                    onClick={handleSubmitReply}
                    disabled={!replyText.trim() || submittingReply}
                  >
                    {submittingReply ? (
                      <CircularProgress size={18} />
                    ) : (
                      <SendIcon fontSize="small" />
                    )}
                  </IconButton>
                </Box>
              </Box>

              {/* Replies list */}
              <Stack spacing={1}>
                {(repliesQuery.data ?? []).map((reply) => (
                  <Paper
                    key={reply.id}
                    variant="outlined"
                    sx={{ p: 1.5, bgcolor: "grey.50" }}
                  >
                    <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                      <Avatar
                        sx={{
                          width: 28,
                          height: 28,
                          bgcolor: reply.is_anonymous
                            ? "grey.400"
                            : "primary.light",
                          fontSize: "0.8rem",
                        }}
                      >
                        {reply.is_anonymous ? (
                          <AnonymousIcon sx={{ fontSize: 16 }} />
                        ) : (
                          reply.author?.display_name?.charAt(0)
                        )}
                      </Avatar>
                      <Typography variant="caption" sx={{ ml: 1 }}>
                        {reply.author?.display_name || "Anonymous"}
                      </Typography>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ ml: 1 }}
                      >
                        {getTimeAgo(reply.created_at)}
                      </Typography>
                    </Box>
                    <Typography variant="body2">{reply.content}</Typography>
                  </Paper>
                ))}
              </Stack>
            </>
          )}
        </Collapse>
      </CardContent>

      {/* Post Menu */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={() => setMenuAnchor(null)}
      >
        <MenuItem
          onClick={() => {
            setMenuAnchor(null);
            onDelete(post.id);
          }}
          disabled={isDeleting}
        >
          <DeleteIcon sx={{ mr: 1 }} fontSize="small" />
          {isDeleting ? "Deleting..." : "Delete Post"}
        </MenuItem>
      </Menu>
    </Card>
  );
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function getTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return date.toLocaleDateString();
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function GroupDiscussion({
  groupId,
  canPost = true,
}: GroupDiscussionProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);

  // New post form
  const [showNewPost, setShowNewPost] = useState(false);
  const [newPostContent, setNewPostContent] = useState("");
  const [newPostTitle, setNewPostTitle] = useState("");
  const [newPostType, setNewPostType] = useState<PeerPostType>("discussion");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Post filter
  const [filterType, setFilterType] = useState<PeerPostType | "">("");

  // Deleting state
  const [deletingPostId, setDeletingPostId] = useState<string | null>(null);

  const userId = user?.id;

  const postsQuery = useQuery({
    queryKey: networkKeys.peerGroupPosts(userId ?? "", groupId),
    enabled: Boolean(userId),
    queryFn: async () => {
      if (!userId) return [];
      const result = await getGroupPosts(userId, groupId);
      if (result.error) throw result.error;
      return result.data ?? [];
    },
  });

  const allPosts = postsQuery.data ?? [];
  const visiblePosts = filterType
    ? allPosts.filter((post) => post.post_type === filterType)
    : allPosts;

  const posts = visiblePosts;
  const loading = postsQuery.isLoading;
  const displayedError =
    error ?? (postsQuery.error as { message?: string } | null)?.message ?? null;

  // Handle creating a new post
  async function handleCreatePost() {
    if (!userId || !newPostContent.trim()) return;

    setSubmitting(true);
    const postData: CreatePostData = {
      group_id: groupId,
      post_type: newPostType,
      title: newPostTitle.trim() || undefined,
      content: newPostContent.trim(),
      is_anonymous: isAnonymous,
    };

    const result = await createPost(userId, postData);

    if (result.error) {
      setError(result.error.message);
    } else {
      // Reset form and refresh posts
      setNewPostContent("");
      setNewPostTitle("");
      setNewPostType("discussion");
      setIsAnonymous(false);
      setShowNewPost(false);
      await queryClient.invalidateQueries({
        queryKey: networkKeys.peerGroupPosts(userId, groupId),
      });
    }
    setSubmitting(false);
  }

  // Handle liking/unliking a post
  async function handleLike(postId: string, isLiked: boolean) {
    if (!userId) return;

    if (isLiked) {
      await unlikePost(userId, postId);
    } else {
      await likePost(userId, postId);
    }

    // Update cached posts so the UI reflects immediately without refetching
    queryClient.setQueryData<PeerPostWithAuthor[]>(
      networkKeys.peerGroupPosts(userId, groupId),
      (prev) =>
        (prev ?? []).map((p) =>
          p.id === postId
            ? {
                ...p,
                is_liked_by_user: !isLiked,
                like_count: (p.like_count || 0) + (isLiked ? -1 : 1),
              }
            : p
        )
    );
  }

  // Handle replying to a post
  async function handleReply(
    parentPostId: string,
    content: string,
    isAnonymousReply: boolean
  ) {
    if (!userId) return;

    const replyData: CreatePostData = {
      group_id: groupId,
      post_type: "discussion",
      content,
      is_anonymous: isAnonymousReply,
      parent_post_id: parentPostId,
    };

    const result = await createPost(userId, replyData);

    if (result.data) {
      // Update reply count in cached posts and refresh the replies list
      queryClient.setQueryData<PeerPostWithAuthor[]>(
        networkKeys.peerGroupPosts(userId, groupId),
        (prev) =>
          (prev ?? []).map((p) =>
            p.id === parentPostId
              ? { ...p, reply_count: (p.reply_count || 0) + 1 }
              : p
          )
      );

      await queryClient.invalidateQueries({
        queryKey: networkKeys.peerPostReplies(userId, parentPostId),
      });
    }
  }

  // Handle deleting a post
  async function handleDelete(postId: string) {
    if (!userId) return;

    setDeletingPostId(postId);
    const result = await deletePost(userId, postId);

    if (result.data) {
      queryClient.setQueryData<PeerPostWithAuthor[]>(
        networkKeys.peerGroupPosts(userId, groupId),
        (prev) => (prev ?? []).filter((p) => p.id !== postId)
      );
    }
    setDeletingPostId(null);
  }

  if (!userId) {
    return (
      <Alert severity="warning">Please log in to view group discussions.</Alert>
    );
  }

  return (
    <Box>
      {/* Header with create post button and filters */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
        }}
      >
        <Typography variant="h6">Discussions</Typography>
        <Box sx={{ display: "flex", gap: 2 }}>
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Filter by Type</InputLabel>
            <Select
              value={filterType}
              onChange={(e) =>
                setFilterType(e.target.value as PeerPostType | "")
              }
              label="Filter by Type"
            >
              <MenuItem value="">All Types</MenuItem>
              {Object.entries(POST_TYPE_INFO).map(([type, info]) => (
                <MenuItem key={type} value={type}>
                  {info.icon} {info.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          {canPost && (
            <Button
              variant="contained"
              onClick={() => setShowNewPost(true)}
              disabled={showNewPost}
            >
              New Post
            </Button>
          )}
        </Box>
      </Box>

      {/* Error alert */}
      {displayedError && (
        <Alert
          severity="error"
          sx={{ mb: 2 }}
          onClose={() => {
            setError(null);
            postsQuery.refetch();
          }}
        >
          {displayedError}
        </Alert>
      )}

      {/* New Post Form */}
      <Collapse in={showNewPost}>
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="subtitle1" gutterBottom>
              Create a New Post
            </Typography>

            <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
              <FormControl size="small" sx={{ minWidth: 150 }}>
                <InputLabel>Post Type</InputLabel>
                <Select
                  value={newPostType}
                  onChange={(e) =>
                    setNewPostType(e.target.value as PeerPostType)
                  }
                  label="Post Type"
                >
                  {Object.entries(POST_TYPE_INFO).map(([type, info]) => (
                    <MenuItem key={type} value={type}>
                      {info.icon} {info.label}
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
                label={
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                    <AnonymousIcon fontSize="small" />
                    Post Anonymously
                  </Box>
                }
              />
            </Box>

            <TextField
              fullWidth
              size="small"
              placeholder="Title (optional)"
              value={newPostTitle}
              onChange={(e) => setNewPostTitle(e.target.value)}
              sx={{ mb: 2 }}
            />

            <TextField
              fullWidth
              multiline
              rows={4}
              placeholder="Share your thoughts, ask a question, or celebrate a win..."
              value={newPostContent}
              onChange={(e) => setNewPostContent(e.target.value)}
              sx={{ mb: 2 }}
            />

            <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1 }}>
              <Button
                variant="outlined"
                onClick={() => {
                  setShowNewPost(false);
                  setNewPostContent("");
                  setNewPostTitle("");
                }}
              >
                Cancel
              </Button>
              <Button
                variant="contained"
                onClick={handleCreatePost}
                disabled={!newPostContent.trim() || submitting}
                startIcon={
                  submitting ? <CircularProgress size={16} /> : <SendIcon />
                }
              >
                {submitting ? "Posting..." : "Post"}
              </Button>
            </Box>
          </CardContent>
        </Card>
      </Collapse>

      {/* Posts list */}
      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
          <CircularProgress />
        </Box>
      ) : posts.length === 0 ? (
        <Card sx={{ p: 4, textAlign: "center" }}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No discussions yet
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Be the first to start a conversation in this group!
          </Typography>
        </Card>
      ) : (
        <Stack spacing={2}>
          {posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              onLike={handleLike}
              onReply={handleReply}
              onDelete={handleDelete}
              isDeleting={deletingPostId === post.id}
              currentUserId={userId}
            />
          ))}
        </Stack>
      )}
    </Box>
  );
}
