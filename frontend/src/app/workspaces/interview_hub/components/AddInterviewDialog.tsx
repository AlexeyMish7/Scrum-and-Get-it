/**
 * AddInterviewDialog - Quick form to log interview records
 *
 * Purpose: Allow users to easily add interview records for tracking
 * Usage: Can be added to Interview Hub or Analytics view
 */

import { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Stack,
  MenuItem,
  Alert,
  CircularProgress,
  FormControlLabel,
  Checkbox,
  Typography,
  Divider,
} from "@mui/material";
import { useAuth } from "@shared/context/AuthContext";
import {
  createInterview,
  createConfidenceLog,
  createInterviewFeedback,
} from "@shared/services/dbMappers";

interface AddInterviewDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const INTERVIEW_FORMATS = [
  "phone",
  "video",
  "onsite",
  "take-home",
  "pair-programming",
];
const INTERVIEW_TYPES = [
  "screening",
  "technical",
  "behavioral",
  "case-study",
  "final",
];
const STAGES = [
  "applied",
  "phone_screen",
  "first_round",
  "final_round",
  "offer",
];
const COMPANY_CULTURES = [
  "startup",
  "corporate",
  "mid-size",
  "remote-first",
  "consulting",
  "agency",
  "non-profit",
];

export default function AddInterviewDialog({
  open,
  onClose,
  onSuccess,
}: AddInterviewDialogProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    company: "",
    role: "",
    industry: "",
    company_culture: "",
    interview_date: new Date().toISOString().slice(0, 16),
    format: "video",
    interview_type: "technical",
    stage: "phone_screen",
    result: "",
    score: "",
    notes: "",
    is_mock: false,
    confidence_level: "5",
    anxiety_level: "5",
    feedback_text: "",
    feedback_themes: "",
  });

  const handleSubmit = async () => {
    if (!user?.id) return;

    setLoading(true);
    setError(null);

    try {
      const interviewPayload = {
        company: formData.company,
        role: formData.role,
        industry: formData.industry,
        company_culture: formData.company_culture,
        interview_date: formData.interview_date,
        format: formData.format,
        interview_type: formData.is_mock ? "mock" : formData.interview_type,
        stage: formData.stage,
        result:
          formData.result === "true"
            ? true
            : formData.result === "false"
            ? false
            : null,
        score: formData.score ? parseInt(formData.score, 10) : null,
        notes: formData.notes,
      };

      const result = await createInterview(user.id, interviewPayload);

      if (result.error) {
        throw new Error(result.error.message);
      }

      const interviewId = (result.data as any)?.id;

      // Add confidence log if interview was created
      if (
        interviewId &&
        (formData.confidence_level || formData.anxiety_level)
      ) {
        try {
          await createConfidenceLog(user.id, {
            interview_id: interviewId,
            confidence_level: parseInt(formData.confidence_level, 10),
            anxiety_level: parseInt(formData.anxiety_level, 10),
            notes: formData.notes,
          });
        } catch (confErr) {
          console.error("[AddInterviewDialog] Confidence log error:", confErr);
          // Don't fail the whole operation if confidence logging fails
        }
      }

      // Add feedback if provided - use AI to extract themes
      if (interviewId && formData.feedback_text) {
        try {
          // Call AI to analyze feedback and extract themes
          let aiThemes: string[] = [];
          try {
            const response = await fetch("/api/interviews/analyze-feedback", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${
                  (
                    await user.getSession()
                  )?.access_token
                }`,
              },
              body: JSON.stringify({ feedback_text: formData.feedback_text }),
            });

            if (response.ok) {
              const analysis = await response.json();
              aiThemes = analysis.themes || [];
            }
          } catch {
            // Continue without AI themes if analysis fails
          }

          // Use AI themes, or fallback to manual themes if provided
          const themes =
            aiThemes.length > 0
              ? aiThemes
              : formData.feedback_themes
                  .split(",")
                  .map((t: string) => t.trim())
                  .filter((t: string) => t);

          const feedbackResult = await createInterviewFeedback(
            user.id,
            interviewId,
            {
              provider: "self",
              feedback_text: formData.feedback_text,
              themes: themes,
            }
          );
          if (feedbackResult.error) {
            console.error(
              "[AddInterviewDialog] Feedback error:",
              feedbackResult.error
            );
          }
        } catch (feedbackErr) {
          console.error(
            "[AddInterviewDialog] Feedback creation failed:",
            feedbackErr
          );
          // Don't fail the whole operation if feedback fails
        }
      }

      // Reset form
      setFormData({
        company: "",
        role: "",
        industry: "",
        company_culture: "",
        interview_date: new Date().toISOString().slice(0, 16),
        format: "video",
        interview_type: "technical",
        stage: "phone_screen",
        result: "",
        score: "",
        notes: "",
        is_mock: false,
        confidence_level: "5",
        anxiety_level: "5",
        feedback_text: "",
        feedback_themes: "",
      });

      onSuccess?.();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add interview");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Log Interview</DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Stack spacing={2} sx={{ mt: 1 }}>
          <TextField
            label="Company"
            value={formData.company}
            onChange={(e) =>
              setFormData({ ...formData, company: e.target.value })
            }
            fullWidth
            required
          />

          <TextField
            label="Role"
            value={formData.role}
            onChange={(e) => setFormData({ ...formData, role: e.target.value })}
            fullWidth
            required
          />

          <TextField
            label="Industry"
            value={formData.industry}
            onChange={(e) =>
              setFormData({ ...formData, industry: e.target.value })
            }
            fullWidth
          />

          <TextField
            select
            label="Company Culture"
            value={formData.company_culture}
            onChange={(e) =>
              setFormData({ ...formData, company_culture: e.target.value })
            }
            fullWidth
            SelectProps={{ native: true }}
          >
            <option value="">Select culture type</option>
            {COMPANY_CULTURES.map((culture) => (
              <option key={culture} value={culture}>
                {culture.charAt(0).toUpperCase() +
                  culture.slice(1).replace(/-/g, " ")}
              </option>
            ))}
          </TextField>

          <TextField
            label="Date & Time"
            type="datetime-local"
            value={formData.interview_date}
            onChange={(e) =>
              setFormData({ ...formData, interview_date: e.target.value })
            }
            fullWidth
            required
            InputLabelProps={{ shrink: true }}
          />

          <TextField
            label="Format"
            select
            value={formData.format}
            onChange={(e) =>
              setFormData({ ...formData, format: e.target.value })
            }
            fullWidth
          >
            {INTERVIEW_FORMATS.map((format) => (
              <MenuItem key={format} value={format}>
                {format.replace("-", " ").replace("_", " ")}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            label="Type"
            select
            value={formData.interview_type}
            onChange={(e) =>
              setFormData({ ...formData, interview_type: e.target.value })
            }
            fullWidth
          >
            {INTERVIEW_TYPES.map((type) => (
              <MenuItem key={type} value={type}>
                {type.replace("-", " ").replace("_", " ")}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            label="Stage"
            select
            value={formData.stage}
            onChange={(e) =>
              setFormData({ ...formData, stage: e.target.value })
            }
            fullWidth
          >
            {STAGES.map((stage) => (
              <MenuItem key={stage} value={stage}>
                {stage.replace("_", " ")}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            label="Result"
            select
            value={formData.result}
            onChange={(e) =>
              setFormData({ ...formData, result: e.target.value })
            }
            fullWidth
            helperText="Did this interview result in an offer?"
          >
            <MenuItem value="">Not yet known</MenuItem>
            <MenuItem value="true">Yes - Received offer</MenuItem>
            <MenuItem value="false">No - Did not receive offer</MenuItem>
          </TextField>

          <TextField
            label="Interview Score (0-100)"
            type="number"
            value={formData.score}
            onChange={(e) =>
              setFormData({ ...formData, score: e.target.value })
            }
            fullWidth
            inputProps={{ min: 0, max: 100 }}
            helperText="Optional: Your self-assessed performance"
          />

          <Divider sx={{ my: 2 }}>
            <Typography variant="caption" color="text.secondary">
              Interview Details
            </Typography>
          </Divider>

          <FormControlLabel
            control={
              <Checkbox
                checked={formData.is_mock}
                onChange={(e) =>
                  setFormData({ ...formData, is_mock: e.target.checked })
                }
              />
            }
            label="This was a mock interview (practice)"
          />

          <TextField
            label="Confidence Level (1-10)"
            type="number"
            value={formData.confidence_level}
            onChange={(e) =>
              setFormData({ ...formData, confidence_level: e.target.value })
            }
            fullWidth
            inputProps={{ min: 1, max: 10 }}
            helperText="How confident did you feel? (1=Not confident, 10=Very confident)"
          />

          <TextField
            label="Anxiety Level (1-10)"
            type="number"
            value={formData.anxiety_level}
            onChange={(e) =>
              setFormData({ ...formData, anxiety_level: e.target.value })
            }
            fullWidth
            inputProps={{ min: 1, max: 10 }}
            helperText="How anxious did you feel? (1=Not anxious, 10=Very anxious)"
          />

          <TextField
            label="Notes"
            multiline
            rows={3}
            value={formData.notes}
            onChange={(e) =>
              setFormData({ ...formData, notes: e.target.value })
            }
            fullWidth
            placeholder="How did it go? What did you learn?"
          />

          <Divider sx={{ my: 2 }}>
            <Typography variant="caption" color="text.secondary">
              Feedback (Optional)
            </Typography>
          </Divider>

          <TextField
            label="Feedback"
            multiline
            rows={4}
            value={formData.feedback_text}
            onChange={(e) =>
              setFormData({ ...formData, feedback_text: e.target.value })
            }
            fullWidth
            placeholder="What feedback did you receive? What went well? What needs improvement?"
            helperText="AI will automatically extract improvement themes from your feedback"
          />
        </Stack>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={
            loading ||
            !formData.company ||
            !formData.role ||
            !formData.interview_date
          }
          startIcon={loading && <CircularProgress size={16} />}
        >
          {loading ? "Adding..." : "Add Interview"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
