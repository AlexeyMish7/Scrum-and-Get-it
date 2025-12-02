/**
 * CREATE BOUNDARY DIALOG (UC-113)
 *
 * Dialog for setting support boundaries.
 * Boundaries help set healthy expectations with supporters.
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
  Chip,
  IconButton,
} from "@mui/material";
import {
  Shield as ShieldIcon,
  Save as SaveIcon,
  Add as AddIcon,
  Close as CloseIcon,
} from "@mui/icons-material";
import { createBoundary } from "../services/familySupportService";
import type { BoundaryType } from "../types/familySupport.types";

interface CreateBoundaryDialogProps {
  open: boolean;
  onClose: () => void;
  userId: string;
  onSuccess: () => void;
}

// Boundary types with examples - matching BoundaryType enum
const BOUNDARY_TYPES: Array<{
  value: BoundaryType;
  label: string;
  description: string;
  examples: string[];
}> = [
  {
    value: "topic_restriction",
    label: "Topic Boundary",
    description: "Topics I'd prefer not to discuss",
    examples: [
      "Salary discussions",
      "Specific rejections",
      "Timeline pressure",
    ],
  },
  {
    value: "support_style",
    label: "Communication Style",
    description: "How I prefer to receive support",
    examples: [
      "No unsolicited advice",
      "Listen first, suggest later",
      "Prefer text over calls",
    ],
  },
  {
    value: "timing_preference",
    label: "Time Boundary",
    description: "When I'm available for support conversations",
    examples: ["Not during work hours", "Weekends only", "After 6pm"],
  },
  {
    value: "advice_limitation",
    label: "Emotional Space",
    description: "What kind of emotional support I need",
    examples: [
      "Need encouragement not critique",
      "Space to vent without solutions",
      "Celebrate small wins with me",
    ],
  },
  {
    value: "communication_frequency",
    label: "Communication Frequency",
    description: "How often I want check-ins",
    examples: [
      "Weekly updates only",
      "Only when I reach out",
      "Daily texts are okay",
    ],
  },
  {
    value: "custom",
    label: "Custom Boundary",
    description: "A personal boundary",
    examples: [
      "Don't share with extended family",
      "Keep my applications confidential",
      "No social media posts about my search",
    ],
  },
];

export function CreateBoundaryDialog({
  open,
  onClose,
  userId,
  onSuccess,
}: CreateBoundaryDialogProps) {
  // Form state
  const [boundaryType, setBoundaryType] =
    useState<BoundaryType>("topic_restriction");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [positiveAlternatives, setPositiveAlternatives] = useState<string[]>(
    []
  );
  const [newAlternative, setNewAlternative] = useState("");
  const [showToSupporters, setShowToSupporters] = useState(true);

  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get selected boundary type info
  const selectedType = BOUNDARY_TYPES.find((t) => t.value === boundaryType);

  // Reset form when dialog opens
  function resetForm() {
    setBoundaryType("topic_restriction");
    setTitle("");
    setDescription("");
    setPositiveAlternatives([]);
    setNewAlternative("");
    setShowToSupporters(true);
    setError(null);
  }

  // Handle close
  function handleClose() {
    resetForm();
    onClose();
  }

  // Add alternative suggestion
  function addAlternative() {
    const trimmed = newAlternative.trim();
    if (trimmed && !positiveAlternatives.includes(trimmed)) {
      setPositiveAlternatives([...positiveAlternatives, trimmed]);
      setNewAlternative("");
    }
  }

  // Remove alternative
  function removeAlternative(alt: string) {
    setPositiveAlternatives(positiveAlternatives.filter((a) => a !== alt));
  }

  // Set example as title (renamed from useExample to avoid React hook name collision)
  function setExampleAsTitle(example: string) {
    setTitle(example);
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

    const result = await createBoundary(userId, {
      boundaryType: boundaryType,
      title: title.trim(),
      description: description.trim() || "",
      positiveAlternatives:
        positiveAlternatives.length > 0 ? positiveAlternatives : undefined,
      showToSupporters,
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
        <ShieldIcon color="primary" />
        Set a Boundary
      </DialogTitle>

      <DialogContent>
        <Stack spacing={3} sx={{ mt: 1 }}>
          {error && (
            <Alert severity="error" onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          <Alert severity="info" icon={false}>
            <Typography variant="body2">
              Boundaries help your supporters understand how to best support
              you. They're about setting healthy expectations, not pushing
              people away.
            </Typography>
          </Alert>

          {/* Boundary Type */}
          <FormControl fullWidth>
            <InputLabel>Boundary Type</InputLabel>
            <Select
              value={boundaryType}
              label="Boundary Type"
              onChange={(e) => setBoundaryType(e.target.value)}
            >
              {BOUNDARY_TYPES.map((type) => (
                <MenuItem key={type.value} value={type.value}>
                  {type.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Type Description & Examples */}
          {selectedType && (
            <Box>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                {selectedType.description}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Examples (click to use):
              </Typography>
              <Box
                sx={{ display: "flex", flexWrap: "wrap", gap: 0.5, mt: 0.5 }}
              >
                {selectedType.examples.map((example) => (
                  <Chip
                    key={example}
                    label={example}
                    size="small"
                    onClick={() => setExampleAsTitle(example)}
                    sx={{ cursor: "pointer" }}
                  />
                ))}
              </Box>
            </Box>
          )}

          {/* Title */}
          <TextField
            label="What's the boundary?"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            placeholder="e.g., Please don't ask about salary"
            helperText={`${title.length}/100 characters`}
            inputProps={{ maxLength: 100 }}
          />

          {/* Description */}
          <TextField
            label="More context (optional)"
            multiline
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Help your supporters understand why this matters..."
          />

          {/* Positive Alternatives */}
          <Box>
            <Typography variant="subtitle2" gutterBottom>
              What they CAN do instead (optional)
            </Typography>
            <Typography variant="caption" color="text.secondary" gutterBottom>
              Suggesting alternatives makes it easier for supporters to help in
              ways that work for you
            </Typography>

            <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
              <TextField
                size="small"
                value={newAlternative}
                onChange={(e) => setNewAlternative(e.target.value)}
                placeholder="e.g., Ask how the search is going"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addAlternative();
                  }
                }}
                sx={{ flex: 1 }}
              />
              <IconButton
                color="primary"
                onClick={addAlternative}
                disabled={!newAlternative.trim()}
              >
                <AddIcon />
              </IconButton>
            </Stack>

            {positiveAlternatives.length > 0 && (
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5, mt: 1 }}>
                {positiveAlternatives.map((alt) => (
                  <Chip
                    key={alt}
                    label={alt}
                    color="success"
                    size="small"
                    onDelete={() => removeAlternative(alt)}
                    deleteIcon={<CloseIcon />}
                  />
                ))}
              </Box>
            )}
          </Box>

          {/* Show to supporters */}
          <FormControlLabel
            control={
              <Switch
                checked={showToSupporters}
                onChange={(e) => setShowToSupporters(e.target.checked)}
              />
            }
            label="Show this boundary to supporters on their dashboard"
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
          {loading ? "Saving..." : "Set Boundary"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default CreateBoundaryDialog;
