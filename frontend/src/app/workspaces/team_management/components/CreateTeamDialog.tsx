/**
 * CREATE TEAM DIALOG
 *
 * Purpose:
 * - Allow users to create a new team
 * - Creator becomes team owner and first admin
 * - Free tier subscription created automatically
 *
 * Flow:
 * 1. User clicks "Create Team" button
 * 2. Dialog opens with form (name + description)
 * 3. Submit → calls teamService.createTeam()
 * 4. TeamContext auto-switches to new team
 * 5. Success → close dialog, show dashboard
 *
 * Usage:
 *   <CreateTeamDialog open={open} onClose={handleClose} />
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
  Alert,
  CircularProgress,
} from "@mui/material";
import { useTeam } from "@shared/context/useTeam";

type CreateTeamDialogProps = {
  open: boolean;
  onClose: () => void;
};

export function CreateTeamDialog({ open, onClose }: CreateTeamDialogProps) {
  const { createTeam } = useTeam();

  // Form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Validation
  const isValid = name.trim().length >= 3;

  const handleSubmit = async () => {
    if (!isValid) return;

    setLoading(true);
    setError(null);

    const result = await createTeam({
      name: name.trim(),
      description: description.trim() || undefined,
    });

    setLoading(false);

    if (result.ok) {
      // Success - reset and close
      setName("");
      setDescription("");
      onClose();
    } else {
      setError(result.error || "Failed to create team");
    }
  };

  const handleClose = () => {
    if (loading) return; // Don't close while creating
    setName("");
    setDescription("");
    setError(null);
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Create New Team</DialogTitle>

      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          {error && <Alert severity="error">{error}</Alert>}

          <TextField
            label="Team Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., Career Coaching Team, Job Search Squad"
            fullWidth
            required
            disabled={loading}
            autoFocus
            error={name.length > 0 && name.trim().length < 3}
            helperText={
              name.length > 0 && name.trim().length < 3
                ? "Team name must be at least 3 characters"
                : "Choose a descriptive name for your team"
            }
          />

          <TextField
            label="Description (Optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe your team's purpose..."
            fullWidth
            multiline
            rows={3}
            disabled={loading}
            helperText="Help members understand what this team is for"
          />

          <Alert severity="info" sx={{ mt: 2 }}>
            You'll be the team owner and first admin. You can invite members
            after creation.
          </Alert>
        </Stack>
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={!isValid || loading}
          startIcon={loading ? <CircularProgress size={16} /> : null}
        >
          {loading ? "Creating..." : "Create Team"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
