/**
 * SUCCESS STORIES COMPONENT
 *
 * Displays inspiring success stories from peers who landed their dream jobs.
 * Users can share their own stories to motivate others.
 *
 * Features:
 * - Browse featured and recent success stories
 * - Share your own story with optional anonymity
 * - Filter by industry, role type
 * - Highlight helpful factors (peer support, referrals, etc.)
 */

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  Stack,
  Avatar,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControlLabel,
  Switch,
  Checkbox,
  FormGroup,
  Divider,
  Grid,
} from "@mui/material";
import {
  Celebration as CelebrationIcon,
  Star as StarIcon,
  Work as WorkIcon,
  Timer as TimerIcon,
  Lightbulb as LightbulbIcon,
  Add as AddIcon,
  VisibilityOff as AnonymousIcon,
  Person as PersonIcon,
} from "@mui/icons-material";
import { useAuth } from "@shared/context/AuthContext";
import { networkKeys } from "@shared/cache/networkQueryKeys";
import {
  getSuccessStories,
  createSuccessStory,
} from "../services/peerGroupsService";
import type {
  SuccessStoryWithAuthor,
  CreateSuccessStoryData,
} from "../types/peerGroups.types";

// ============================================================================
// PROPS AND TYPES
// ============================================================================

interface SuccessStoriesProps {
  groupId?: string; // Optional: filter to group's stories only
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function getTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const days = Math.floor(
    (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
  if (days < 365) return `${Math.floor(days / 30)} months ago`;
  return date.toLocaleDateString();
}

// ============================================================================
// STORY CARD COMPONENT
// ============================================================================

interface StoryCardProps {
  story: SuccessStoryWithAuthor;
}

function StoryCard({ story }: StoryCardProps) {
  const [expanded, setExpanded] = useState(false);

  // Determine which helpful factors to highlight
  const helpfulFactors = [];
  if (story.helpful_factors?.peer_support) helpfulFactors.push("Peer Support");
  if (story.helpful_factors?.group_challenges)
    helpfulFactors.push("Group Challenges");
  if (story.helpful_factors?.referrals) helpfulFactors.push("Referrals");
  if (story.helpful_factors?.networking) helpfulFactors.push("Networking");
  if (story.helpful_factors?.resume_help) helpfulFactors.push("Resume Help");
  if (story.helpful_factors?.interview_prep)
    helpfulFactors.push("Interview Prep");

  return (
    <Card
      sx={{
        mb: 2,
        border: story.is_featured ? "2px solid" : "none",
        borderColor: story.is_featured ? "warning.main" : undefined,
      }}
    >
      <CardContent>
        {/* Header */}
        <Box sx={{ display: "flex", alignItems: "flex-start", mb: 2 }}>
          <Avatar
            sx={{
              bgcolor: story.is_anonymous ? "grey.400" : "primary.main",
              width: 48,
              height: 48,
            }}
          >
            {story.is_anonymous ? (
              <AnonymousIcon />
            ) : (
              story.author?.display_name?.charAt(0) || <PersonIcon />
            )}
          </Avatar>
          <Box sx={{ ml: 2, flexGrow: 1 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Typography variant="h6">{story.title}</Typography>
              {story.is_featured && (
                <Chip
                  icon={<StarIcon sx={{ fontSize: "14px !important" }} />}
                  label="Featured"
                  size="small"
                  color="warning"
                />
              )}
            </Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Typography variant="body2" color="text.secondary">
                {story.author?.display_name || "Anonymous"} •{" "}
                {getTimeAgo(story.created_at)}
              </Typography>
            </Box>
          </Box>
          <CelebrationIcon sx={{ color: "warning.main", fontSize: 32 }} />
        </Box>

        {/* Industry/Role Tags */}
        <Box sx={{ display: "flex", gap: 1, mb: 2, flexWrap: "wrap" }}>
          {story.industry && (
            <Chip
              icon={<WorkIcon sx={{ fontSize: "14px !important" }} />}
              label={story.industry}
              size="small"
              variant="outlined"
            />
          )}
          {story.role_type && (
            <Chip label={story.role_type} size="small" variant="outlined" />
          )}
          {story.job_search_duration_weeks && (
            <Chip
              icon={<TimerIcon sx={{ fontSize: "14px !important" }} />}
              label={`${story.job_search_duration_weeks} weeks`}
              size="small"
              variant="outlined"
            />
          )}
        </Box>

        {/* Story Content */}
        <Typography
          variant="body1"
          sx={{
            mb: 2,
            whiteSpace: "pre-wrap",
            display: "-webkit-box",
            WebkitLineClamp: expanded ? undefined : 4,
            WebkitBoxOrient: "vertical",
            overflow: expanded ? "visible" : "hidden",
          }}
        >
          {story.story_content}
        </Typography>

        {story.story_content.length > 300 && (
          <Button
            size="small"
            onClick={() => setExpanded(!expanded)}
            sx={{ mb: 2 }}
          >
            {expanded ? "Show Less" : "Read More"}
          </Button>
        )}

        {/* Key Learnings */}
        {story.key_learnings && story.key_learnings.length > 0 && (
          <Box sx={{ mb: 2 }}>
            <Typography
              variant="subtitle2"
              sx={{ display: "flex", alignItems: "center", gap: 0.5, mb: 1 }}
            >
              <LightbulbIcon fontSize="small" color="warning" />
              Key Learnings
            </Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              {story.key_learnings.map((learning, index) => (
                <Chip
                  key={index}
                  label={learning}
                  size="small"
                  sx={{ mb: 0.5 }}
                />
              ))}
            </Stack>
          </Box>
        )}

        {/* Advice */}
        {story.advice_for_others && (
          <Box
            sx={{
              p: 2,
              bgcolor: "primary.light",
              borderRadius: 1,
              mb: 2,
            }}
          >
            <Typography variant="subtitle2" gutterBottom>
              💡 Advice for Others
            </Typography>
            <Typography variant="body2">{story.advice_for_others}</Typography>
          </Box>
        )}

        {/* Helpful Factors */}
        {helpfulFactors.length > 0 && (
          <Box>
            <Typography variant="caption" color="text.secondary">
              What helped:
            </Typography>
            <Stack
              direction="row"
              spacing={0.5}
              flexWrap="wrap"
              sx={{ mt: 0.5 }}
            >
              {helpfulFactors.map((factor) => (
                <Chip
                  key={factor}
                  label={factor}
                  size="small"
                  color="success"
                  variant="outlined"
                  sx={{ fontSize: "0.7rem" }}
                />
              ))}
            </Stack>
          </Box>
        )}
      </CardContent>
    </Card>
  );
}

// ============================================================================
// CREATE STORY DIALOG
// ============================================================================

interface CreateStoryDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: CreateSuccessStoryData) => void;
  submitting: boolean;
  groupId?: string;
}

function CreateStoryDialog({
  open,
  onClose,
  onSubmit,
  submitting,
  groupId,
}: CreateStoryDialogProps) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [industry, setIndustry] = useState("");
  const [roleType, setRoleType] = useState("");
  const [searchDuration, setSearchDuration] = useState("");
  const [keyLearnings, setKeyLearnings] = useState("");
  const [advice, setAdvice] = useState("");
  const [helpfulFactors, setHelpfulFactors] = useState({
    peer_support: false,
    group_challenges: false,
    referrals: false,
    networking: false,
    resume_help: false,
    interview_prep: false,
  });

  const handleSubmit = () => {
    if (!title || !content) return;

    const data: CreateSuccessStoryData = {
      group_id: groupId,
      title,
      story_content: content,
      is_anonymous: isAnonymous,
      industry: industry || undefined,
      role_type: roleType || undefined,
      job_search_duration_weeks: searchDuration
        ? parseInt(searchDuration)
        : undefined,
      key_learnings: keyLearnings
        ? keyLearnings.split(",").map((s) => s.trim())
        : undefined,
      advice_for_others: advice || undefined,
      helpful_factors: helpfulFactors,
    };

    onSubmit(data);
  };

  const handleClose = () => {
    // Reset form
    setTitle("");
    setContent("");
    setIsAnonymous(false);
    setIndustry("");
    setRoleType("");
    setSearchDuration("");
    setKeyLearnings("");
    setAdvice("");
    setHelpfulFactors({
      peer_support: false,
      group_challenges: false,
      referrals: false,
      networking: false,
      resume_help: false,
      interview_prep: false,
    });
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <CelebrationIcon color="warning" />
          Share Your Success Story
        </Box>
      </DialogTitle>
      <DialogContent>
        <Box sx={{ pt: 1 }}>
          {/* Title */}
          <TextField
            fullWidth
            label="Title"
            placeholder="e.g., From 100 rejections to dream job at Google"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            sx={{ mb: 2 }}
          />

          {/* Story content */}
          <TextField
            fullWidth
            multiline
            rows={5}
            label="Your Story"
            placeholder="Share your journey - the challenges, what worked, and how you landed your role..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            sx={{ mb: 2 }}
          />

          {/* Anonymous toggle */}
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
                Share Anonymously
              </Box>
            }
            sx={{ mb: 2 }}
          />

          <Divider sx={{ my: 2 }} />

          {/* Optional details */}
          <Typography variant="subtitle2" gutterBottom>
            Optional Details
          </Typography>

          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                fullWidth
                size="small"
                label="Industry"
                placeholder="e.g., Technology"
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                fullWidth
                size="small"
                label="Role Type"
                placeholder="e.g., Software Engineer"
                value={roleType}
                onChange={(e) => setRoleType(e.target.value)}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                fullWidth
                size="small"
                type="number"
                label="Search Duration (weeks)"
                value={searchDuration}
                onChange={(e) => setSearchDuration(e.target.value)}
              />
            </Grid>
          </Grid>

          <TextField
            fullWidth
            size="small"
            label="Key Learnings"
            placeholder="Comma-separated, e.g., Network early, Tailor resume, Practice interviews"
            value={keyLearnings}
            onChange={(e) => setKeyLearnings(e.target.value)}
            sx={{ mb: 2 }}
          />

          <TextField
            fullWidth
            multiline
            rows={2}
            size="small"
            label="Advice for Others"
            placeholder="What advice would you give to someone in your shoes?"
            value={advice}
            onChange={(e) => setAdvice(e.target.value)}
            sx={{ mb: 2 }}
          />

          {/* Helpful factors */}
          <Typography variant="subtitle2" gutterBottom>
            What Helped You? (check all that apply)
          </Typography>
          <FormGroup row>
            <FormControlLabel
              control={
                <Checkbox
                  checked={helpfulFactors.peer_support}
                  onChange={(e) =>
                    setHelpfulFactors((prev) => ({
                      ...prev,
                      peer_support: e.target.checked,
                    }))
                  }
                />
              }
              label="Peer Support"
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={helpfulFactors.group_challenges}
                  onChange={(e) =>
                    setHelpfulFactors((prev) => ({
                      ...prev,
                      group_challenges: e.target.checked,
                    }))
                  }
                />
              }
              label="Group Challenges"
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={helpfulFactors.referrals}
                  onChange={(e) =>
                    setHelpfulFactors((prev) => ({
                      ...prev,
                      referrals: e.target.checked,
                    }))
                  }
                />
              }
              label="Referrals"
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={helpfulFactors.networking}
                  onChange={(e) =>
                    setHelpfulFactors((prev) => ({
                      ...prev,
                      networking: e.target.checked,
                    }))
                  }
                />
              }
              label="Networking"
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={helpfulFactors.resume_help}
                  onChange={(e) =>
                    setHelpfulFactors((prev) => ({
                      ...prev,
                      resume_help: e.target.checked,
                    }))
                  }
                />
              }
              label="Resume Help"
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={helpfulFactors.interview_prep}
                  onChange={(e) =>
                    setHelpfulFactors((prev) => ({
                      ...prev,
                      interview_prep: e.target.checked,
                    }))
                  }
                />
              }
              label="Interview Prep"
            />
          </FormGroup>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Cancel</Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={!title || !content || submitting}
          startIcon={
            submitting ? <CircularProgress size={16} /> : <CelebrationIcon />
          }
        >
          {submitting ? "Sharing..." : "Share Story"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function SuccessStories({ groupId }: SuccessStoriesProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const userId = user?.id;

  const storiesQuery = useQuery({
    queryKey: networkKeys.peerSuccessStories(groupId),
    queryFn: async () => {
      const filters = groupId ? { group_id: groupId } : undefined;
      const result = await getSuccessStories(filters);
      if (result.error) throw result.error;
      return result.data ?? [];
    },
  });

  const stories = storiesQuery.data ?? [];
  const loading = storiesQuery.isLoading;
  const displayedError =
    error ??
    (storiesQuery.error as { message?: string } | null)?.message ??
    null;

  // Handle creating a story
  async function handleCreateStory(data: CreateSuccessStoryData) {
    if (!userId) return;

    setSubmitting(true);
    const result = await createSuccessStory(userId, data);

    if (result.error) {
      setError(result.error.message);
    } else {
      setCreateDialogOpen(false);
      await queryClient.invalidateQueries({
        queryKey: networkKeys.peerSuccessStories(groupId),
      });
    }
    setSubmitting(false);
  }

  // Separate featured stories
  const featuredStories = stories.filter((s) => s.is_featured);
  const regularStories = stories.filter((s) => !s.is_featured);

  return (
    <Box>
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
        }}
      >
        <Box>
          <Typography
            variant="h6"
            sx={{ display: "flex", alignItems: "center", gap: 1 }}
          >
            <CelebrationIcon color="warning" />
            Success Stories
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Inspiring stories from peers who landed their dream jobs
          </Typography>
        </Box>
        {userId && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setCreateDialogOpen(true)}
          >
            Share Your Story
          </Button>
        )}
      </Box>

      {/* Error alert */}
      {displayedError && (
        <Alert
          severity="error"
          sx={{ mb: 2 }}
          onClose={() => {
            setError(null);
            storiesQuery.refetch();
          }}
        >
          {displayedError}
        </Alert>
      )}

      {/* Stories list */}
      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
          <CircularProgress />
        </Box>
      ) : stories.length === 0 ? (
        <Card sx={{ p: 4, textAlign: "center" }}>
          <CelebrationIcon
            sx={{ fontSize: 64, color: "text.secondary", mb: 2 }}
          />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No success stories yet
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Be the first to inspire others by sharing your journey!
          </Typography>
          {userId && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setCreateDialogOpen(true)}
            >
              Share Your Story
            </Button>
          )}
        </Card>
      ) : (
        <>
          {/* Featured stories first */}
          {featuredStories.length > 0 && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="overline" color="text.secondary">
                ⭐ Featured Stories
              </Typography>
              <Stack spacing={2}>
                {featuredStories.map((story) => (
                  <StoryCard key={story.id} story={story} />
                ))}
              </Stack>
            </Box>
          )}

          {/* Regular stories */}
          {regularStories.length > 0 && (
            <Box>
              {featuredStories.length > 0 && (
                <Typography variant="overline" color="text.secondary">
                  Recent Stories
                </Typography>
              )}
              <Stack spacing={2}>
                {regularStories.map((story) => (
                  <StoryCard key={story.id} story={story} />
                ))}
              </Stack>
            </Box>
          )}
        </>
      )}

      {/* Create Story Dialog */}
      <CreateStoryDialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        onSubmit={handleCreateStory}
        submitting={submitting}
        groupId={groupId}
      />
    </Box>
  );
}
