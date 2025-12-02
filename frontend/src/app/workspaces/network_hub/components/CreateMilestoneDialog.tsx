/**
 * CREATE MILESTONE DIALOG (UC-113)
 *
 * Dialog for creating job search milestones to share with supporters.
 * Milestones help track progress and celebrate achievements.
 */

import { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Stack,
  Typography,
  TextField,
  Alert,
  CircularProgress,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Switch,
} from "@mui/material";
import {
  EmojiEvents as TrophyIcon,
  Save as SaveIcon,
} from "@mui/icons-material";
import { createMilestone } from "../services/familySupportService";
import type { MilestoneType } from "../types/familySupport.types";

interface CreateMilestoneDialogProps {
  open: boolean;
  onClose: () => void;
  userId: string;
  onSuccess: () => void;
}

// Milestone types with descriptions
const MILESTONE_TYPES: Array<{
  value: MilestoneType;
  label: string;
  emoji: string;
  description: string;
}> = [
  {
    value: "first_application",
    label: "First Application Sent",
    emoji: "🚀",
    description: "Submitted your first job application",
  },
  {
    value: "first_interview",
    label: "Interview Scheduled",
    emoji: "📅",
    description: "Got an interview invitation",
  },
  {
    value: "interview_milestone",
    label: "Interview Completed",
    emoji: "✅",
    description: "Finished an interview",
  },
  {
    value: "offer_received",
    label: "Offer Received",
    emoji: "🎉",
    description: "Received a job offer",
  },
  {
    value: "offer_accepted",
    label: "Offer Accepted",
    emoji: "🎊",
    description: "Accepted a job offer",
  },
  {
    value: "application_milestone",
    label: "Applications Milestone",
    emoji: "📊",
    description: "Reached an application count goal",
  },
  {
    value: "skill_learned",
    label: "New Skill Learned",
    emoji: "📚",
    description: "Learned a new skill or completed training",
  },
  {
    value: "networking_milestone",
    label: "Networking Win",
    emoji: "🤝",
    description: "Made a valuable connection",
  },
  {
    value: "goal_achieved",
    label: "Goal Achieved",
    emoji: "📝",
    description: "Reached a personal job search goal",
  },
  {
    value: "custom",
    label: "Custom Milestone",
    emoji: "⭐",
    description: "A personal achievement",
  },
];

// Celebration emojis for selection
const CELEBRATION_EMOJIS = [
  "🎉",
  "🎊",
  "🏆",
  "⭐",
  "🚀",
  "💪",
  "🔥",
  "✨",
  "🥳",
  "👏",
  "🙌",
  "💯",
];

export function CreateMilestoneDialog({
  open,
  onClose,
  userId,
  onSuccess,
}: CreateMilestoneDialogProps) {
  // Form state
  const [milestoneType, setMilestoneType] = useState<MilestoneType>("custom");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [celebrationEmoji, setCelebrationEmoji] = useState("🎉");
  const [shareWithSupporters, setShareWithSupporters] = useState(true);

  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get selected milestone type info
  const selectedType = MILESTONE_TYPES.find((t) => t.value === milestoneType);

  // Reset form when dialog opens
  function resetForm() {
    setMilestoneType("custom");
    setTitle("");
    setDescription("");
    setCelebrationEmoji("🎉");
    setShareWithSupporters(true);
    setError(null);
  }

  // Handle close
  function handleClose() {
    resetForm();
    onClose();
  }

  // Handle milestone type change - auto-fill title and description
  function handleTypeChange(type: MilestoneType) {
    setMilestoneType(type);
    const typeInfo = MILESTONE_TYPES.find((t) => t.value === type);
    if (typeInfo && type !== "custom") {
      setTitle(typeInfo.label);
      setDescription(typeInfo.description);
      setCelebrationEmoji(typeInfo.emoji);
    }
  }

  // Validate form
  function isValid(): boolean {
    return title.trim().length >= 3;
  }

  // Handle submit
  async function handleSubmit() {
    if (!isValid()) {
      setError("Please enter a title with at least 3 characters");
      return;
    }

    setLoading(true);
    setError(null);

    const result = await createMilestone(userId, {
      milestoneType: milestoneType,
      title: title.trim(),
      description: description.trim() || undefined,
      celebrationEmoji: celebrationEmoji,
      isShared: shareWithSupporters,
    });

    setLoading(false);

    if (result.error) {
      setError(result.error.message);
      return;
    }

    onSuccess();
    handleClose();
  }

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <TrophyIcon color="warning" />
        Add Milestone
      </DialogTitle>

      <DialogContent>
        <Stack spacing={3} sx={{ mt: 1 }}>
          {error && (
            <Alert severity="error" onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          {/* Milestone Type */}
          <FormControl fullWidth>
            <InputLabel>Milestone Type</InputLabel>
            <Select
              value={milestoneType}
              label="Milestone Type"
              onChange={(e) =>
                handleTypeChange(e.target.value as MilestoneType)
              }
            >
              {MILESTONE_TYPES.map((type) => (
                <MenuItem key={type.value} value={type.value}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <span>{type.emoji}</span>
                    <span>{type.label}</span>
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Title */}
          <TextField
            label="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            placeholder="What did you achieve?"
            helperText={`${title.length}/100 characters`}
            inputProps={{ maxLength: 100 }}
          />

          {/* Description */}
          <TextField
            label="Description (optional)"
            multiline
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Add more details about this achievement..."
            helperText={selectedType?.description || "Describe your milestone"}
          />

          {/* Celebration Emoji */}
          <Box>
            <Typography variant="subtitle2" gutterBottom>
              Celebration Emoji
            </Typography>
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
              {CELEBRATION_EMOJIS.map((emoji) => (
                <Button
                  key={emoji}
                  variant={
                    celebrationEmoji === emoji ? "contained" : "outlined"
                  }
                  size="small"
                  onClick={() => setCelebrationEmoji(emoji)}
                  sx={{ minWidth: 40, fontSize: "1.2rem" }}
                >
                  {emoji}
                </Button>
              ))}
            </Box>
          </Box>

          {/* Preview */}
          <Box
            sx={{
              p: 2,
              bgcolor: "background.paper",
              borderRadius: 2,
              border: "1px solid",
              borderColor: "divider",
            }}
          >
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Preview
            </Typography>
            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <Typography variant="h4">{celebrationEmoji}</Typography>
              <Box>
                <Typography variant="h6">
                  {title || "Your milestone title"}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {description || "Your description will appear here"}
                </Typography>
              </Box>
            </Box>
          </Box>

          {/* Share with supporters */}
          <FormControlLabel
            control={
              <Switch
                checked={shareWithSupporters}
                onChange={(e) => setShareWithSupporters(e.target.checked)}
              />
            }
            label="Share this milestone with supporters"
          />
        </Stack>
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={loading || !isValid()}
          startIcon={loading ? <CircularProgress size={20} /> : <SaveIcon />}
        >
          {loading ? "Saving..." : "Add Milestone"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default CreateMilestoneDialog;
