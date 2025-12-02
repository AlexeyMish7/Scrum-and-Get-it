/**
 * STRESS CHECK-IN DIALOG (UC-113)
 *
 * Dialog for logging daily stress levels and mood.
 * Helps track well-being over time and can share with supporters.
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
  Slider,
  Alert,
  CircularProgress,
  Box,
  Chip,
  TextField,
  FormControlLabel,
  Switch,
} from "@mui/material";
import { Favorite as HeartIcon, Save as SaveIcon } from "@mui/icons-material";
import { submitStressCheckIn } from "../services/familySupportService";

interface StressCheckInDialogProps {
  open: boolean;
  onClose: () => void;
  userId: string;
  onSuccess: () => void;
}

// Mood options with emojis
const MOOD_OPTIONS = [
  { value: "great", label: "Great", emoji: "😊" },
  { value: "good", label: "Good", emoji: "🙂" },
  { value: "okay", label: "Okay", emoji: "😐" },
  { value: "stressed", label: "Stressed", emoji: "😰" },
  { value: "overwhelmed", label: "Overwhelmed", emoji: "😩" },
];

// Common stress factors during job search
const STRESS_FACTORS = [
  "No responses",
  "Rejections",
  "Interview anxiety",
  "Financial pressure",
  "Uncertainty",
  "Competition",
  "Skills gap",
  "Time pressure",
  "Family expectations",
  "Self-doubt",
];

// Positive factors
const POSITIVE_FACTORS = [
  "Got interview",
  "Good feedback",
  "Learned new skill",
  "Good support network",
  "Made progress",
  "Self-care",
  "Exercise",
  "Good sleep",
  "Socializing",
  "Small wins",
];

// Self-care activities
const SELF_CARE_ACTIVITIES = [
  "Exercise",
  "Meditation",
  "Walk outside",
  "Reading",
  "Hobby time",
  "Social time",
  "Good sleep",
  "Healthy eating",
  "Digital detox",
  "Music",
];

export function StressCheckInDialog({
  open,
  onClose,
  userId,
  onSuccess,
}: StressCheckInDialogProps) {
  // Form state
  const [stressLevel, setStressLevel] = useState<number>(5);
  const [mood, setMood] = useState<string>("okay");
  const [selectedStressFactors, setSelectedStressFactors] = useState<string[]>(
    []
  );
  const [selectedPositiveFactors, setSelectedPositiveFactors] = useState<
    string[]
  >([]);
  const [selectedSelfCare, setSelectedSelfCare] = useState<string[]>([]);
  const [notes, setNotes] = useState("");
  const [shareWithSupporters, setShareWithSupporters] = useState(false);

  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset form when dialog opens
  function resetForm() {
    setStressLevel(5);
    setMood("okay");
    setSelectedStressFactors([]);
    setSelectedPositiveFactors([]);
    setSelectedSelfCare([]);
    setNotes("");
    setShareWithSupporters(false);
    setError(null);
  }

  // Handle close
  function handleClose() {
    resetForm();
    onClose();
  }

  // Toggle factor selection
  function toggleFactor(
    factor: string,
    list: string[],
    setList: (factors: string[]) => void
  ) {
    if (list.includes(factor)) {
      setList(list.filter((f) => f !== factor));
    } else {
      setList([...list, factor]);
    }
  }

  // Get stress level color
  function getStressColor(): "success" | "warning" | "error" {
    if (stressLevel <= 3) return "success";
    if (stressLevel <= 6) return "warning";
    return "error";
  }

  // Get stress level label
  function getStressLabel(): string {
    if (stressLevel <= 2) return "Very Low";
    if (stressLevel <= 4) return "Low";
    if (stressLevel <= 6) return "Moderate";
    if (stressLevel <= 8) return "High";
    return "Very High";
  }

  // Convert numeric stress to StressLevel type
  function getStressLevelType():
    | "very_low"
    | "low"
    | "moderate"
    | "high"
    | "very_high" {
    if (stressLevel <= 2) return "very_low";
    if (stressLevel <= 4) return "low";
    if (stressLevel <= 6) return "moderate";
    if (stressLevel <= 8) return "high";
    return "very_high";
  }

  // Handle submit
  async function handleSubmit() {
    setLoading(true);
    setError(null);

    const result = await submitStressCheckIn(userId, {
      stressLevel: getStressLevelType(),
      mood: mood as "great" | "good" | "okay" | "struggling" | "overwhelmed",
      stressScore: stressLevel,
      stressFactors: selectedStressFactors,
      positiveFactors: selectedPositiveFactors,
      selfCareActivities: selectedSelfCare,
      notes: notes.trim() || undefined,
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
        <HeartIcon color="error" />
        Daily Check-In
      </DialogTitle>

      <DialogContent>
        <Stack spacing={3} sx={{ mt: 1 }}>
          {error && (
            <Alert severity="error" onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          {/* Stress Level Slider */}
          <Box>
            <Typography variant="subtitle2" gutterBottom>
              How stressed are you feeling? ({getStressLabel()})
            </Typography>
            <Box sx={{ px: 2 }}>
              <Slider
                value={stressLevel}
                onChange={(_, value) => setStressLevel(value as number)}
                min={1}
                max={10}
                step={1}
                marks
                color={getStressColor()}
                valueLabelDisplay="auto"
              />
              <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                <Typography variant="caption" color="text.secondary">
                  😌 Calm
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  😩 Very Stressed
                </Typography>
              </Box>
            </Box>
          </Box>

          {/* Mood Selection */}
          <Box>
            <Typography variant="subtitle2" gutterBottom>
              Current Mood
            </Typography>
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
              {MOOD_OPTIONS.map((option) => (
                <Chip
                  key={option.value}
                  label={`${option.emoji} ${option.label}`}
                  color={mood === option.value ? "primary" : "default"}
                  onClick={() => setMood(option.value)}
                  variant={mood === option.value ? "filled" : "outlined"}
                />
              ))}
            </Box>
          </Box>

          {/* Stress Factors */}
          <Box>
            <Typography variant="subtitle2" gutterBottom>
              What's causing stress? (select all that apply)
            </Typography>
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
              {STRESS_FACTORS.map((factor) => (
                <Chip
                  key={factor}
                  label={factor}
                  size="small"
                  color={
                    selectedStressFactors.includes(factor) ? "error" : "default"
                  }
                  onClick={() =>
                    toggleFactor(
                      factor,
                      selectedStressFactors,
                      setSelectedStressFactors
                    )
                  }
                  variant={
                    selectedStressFactors.includes(factor)
                      ? "filled"
                      : "outlined"
                  }
                />
              ))}
            </Box>
          </Box>

          {/* Positive Factors */}
          <Box>
            <Typography variant="subtitle2" gutterBottom>
              Any positives today? (select all that apply)
            </Typography>
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
              {POSITIVE_FACTORS.map((factor) => (
                <Chip
                  key={factor}
                  label={factor}
                  size="small"
                  color={
                    selectedPositiveFactors.includes(factor)
                      ? "success"
                      : "default"
                  }
                  onClick={() =>
                    toggleFactor(
                      factor,
                      selectedPositiveFactors,
                      setSelectedPositiveFactors
                    )
                  }
                  variant={
                    selectedPositiveFactors.includes(factor)
                      ? "filled"
                      : "outlined"
                  }
                />
              ))}
            </Box>
          </Box>

          {/* Self-Care Activities */}
          <Box>
            <Typography variant="subtitle2" gutterBottom>
              Self-care activities today
            </Typography>
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
              {SELF_CARE_ACTIVITIES.map((activity) => (
                <Chip
                  key={activity}
                  label={activity}
                  size="small"
                  color={
                    selectedSelfCare.includes(activity) ? "info" : "default"
                  }
                  onClick={() =>
                    toggleFactor(
                      activity,
                      selectedSelfCare,
                      setSelectedSelfCare
                    )
                  }
                  variant={
                    selectedSelfCare.includes(activity) ? "filled" : "outlined"
                  }
                />
              ))}
            </Box>
          </Box>

          {/* Notes */}
          <TextField
            label="Additional notes (optional)"
            multiline
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Anything else you want to note..."
          />

          {/* Share with supporters */}
          <FormControlLabel
            control={
              <Switch
                checked={shareWithSupporters}
                onChange={(e) => setShareWithSupporters(e.target.checked)}
              />
            }
            label="Share this check-in with supporters who can view well-being"
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
          disabled={loading}
          startIcon={loading ? <CircularProgress size={20} /> : <SaveIcon />}
        >
          {loading ? "Saving..." : "Save Check-In"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default StressCheckInDialog;
