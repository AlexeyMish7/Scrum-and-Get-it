/**
 * TIME ENTRY FORM
 * Simple form to manually log time tracking entries for testing
 */

import { useState } from "react";
import {
  Box,
  Button,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  TextField,
  Typography,
  Alert,
} from "@mui/material";
import { useAuth } from "@shared/context/AuthContext";

export default function TimeEntryForm() {
  const { session } = useAuth();
  const [activityType, setActivityType] = useState("applications");
  const [durationMinutes, setDurationMinutes] = useState(30);
  const [energyLevel, setEnergyLevel] = useState(3);
  const [outcomeType, setOutcomeType] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session?.access_token) return;

    setLoading(true);
    setMessage(null);

    try {
      const response = await fetch("http://localhost:8787/api/time-entries", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          activity_type: activityType,
          duration_minutes: durationMinutes,
          energy_level: energyLevel,
          outcome_type: outcomeType || null,
          notes: notes || null,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      setMessage({ type: "success", text: "Time entry logged successfully!" });
      
      // Reset form
      setActivityType("applications");
      setDurationMinutes(30);
      setEnergyLevel(3);
      setOutcomeType("");
      setNotes("");
    } catch (err: any) {
      console.error("[TimeEntryForm] error:", err);
      setMessage({ type: "error", text: err?.message || "Failed to log time entry" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Paper elevation={3} sx={{ p: 3, maxWidth: 600, mx: "auto" }}>
      <Typography variant="h6" fontWeight={600} gutterBottom>
        Log Time Entry
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Track a focused work session for your job search
      </Typography>

      {message && (
        <Alert severity={message.type} sx={{ mb: 2 }} onClose={() => setMessage(null)}>
          {message.text}
        </Alert>
      )}

      <form onSubmit={handleSubmit}>
        <Stack spacing={2.5}>
          <FormControl fullWidth>
            <InputLabel>Activity Type</InputLabel>
            <Select
              value={activityType}
              label="Activity Type"
              onChange={(e) => setActivityType(e.target.value)}
            >
              <MenuItem value="applications">Applications</MenuItem>
              <MenuItem value="networking">Networking</MenuItem>
              <MenuItem value="research">Research</MenuItem>
              <MenuItem value="interview_prep">Interview Prep</MenuItem>
              <MenuItem value="skill_building">Skill Building</MenuItem>
              <MenuItem value="other">Other</MenuItem>
            </Select>
          </FormControl>

          <TextField
            label="Duration (minutes)"
            type="number"
            value={durationMinutes}
            onChange={(e) => setDurationMinutes(Number(e.target.value))}
            inputProps={{ min: 1, max: 480 }}
            fullWidth
          />

          <FormControl fullWidth>
            <InputLabel>Energy Level</InputLabel>
            <Select
              value={energyLevel}
              label="Energy Level"
              onChange={(e) => setEnergyLevel(Number(e.target.value))}
            >
              <MenuItem value={1}>1 - Very Low</MenuItem>
              <MenuItem value={2}>2 - Low</MenuItem>
              <MenuItem value={3}>3 - Medium</MenuItem>
              <MenuItem value={4}>4 - High</MenuItem>
              <MenuItem value={5}>5 - Very High</MenuItem>
            </Select>
          </FormControl>

          <FormControl fullWidth>
            <InputLabel>Outcome (Optional)</InputLabel>
            <Select
              value={outcomeType}
              label="Outcome (Optional)"
              onChange={(e) => setOutcomeType(e.target.value)}
            >
              <MenuItem value="">None</MenuItem>
              <MenuItem value="application_submitted">Application Submitted</MenuItem>
              <MenuItem value="interview">Interview Scheduled</MenuItem>
              <MenuItem value="offer">Offer Received</MenuItem>
              <MenuItem value="referral">Referral Obtained</MenuItem>
              <MenuItem value="networking_connection">Networking Connection Made</MenuItem>
            </Select>
          </FormControl>

          <TextField
            label="Notes (Optional)"
            multiline
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            fullWidth
          />

          <Button
            type="submit"
            variant="contained"
            size="large"
            disabled={loading}
            fullWidth
          >
            {loading ? "Logging..." : "Log Time Entry"}
          </Button>
        </Stack>
      </form>
    </Paper>
  );
}
