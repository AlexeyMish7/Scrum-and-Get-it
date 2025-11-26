/**
 * TEAM SETTINGS PAGE
 *
 * Purpose:
 * - Allow team admins to update team configuration
 * - Manage team name, description, and settings
 * - Control auto-approval and visibility options
 *
 * Flow:
 * 1. Load current team settings from TeamContext
 * 2. Show form with editable fields (admin only)
 * 3. Save changes to database via teamService
 * 4. Refresh TeamContext on success
 *
 * Access Control:
 * - Only admins can edit settings
 * - Non-admins see read-only view
 *
 * Usage:
 *   Route: /team/settings
 *   Access: Team members (admins can edit)
 */

import { useState, useEffect } from "react";
import {
  Container,
  Paper,
  Stack,
  Typography,
  TextField,
  Button,
  Switch,
  FormControlLabel,
  Alert,
  CircularProgress,
  Divider,
  Box,
} from "@mui/material";
import { Save as SaveIcon, Lock as LockIcon } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { useTeam } from "@shared/context/useTeam";
import { useAuth } from "@shared/context/AuthContext";
import * as teamService from "../services/teamService";

export function TeamSettings() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { currentTeam, isAdmin, refreshTeam } = useTeam();

  // Form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [autoApprove, setAutoApprove] = useState(false);
  const [assignmentVisibility, setAssignmentVisibility] = useState(false);

  // UI state
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Load current settings when team changes
  useEffect(() => {
    if (currentTeam) {
      setName(currentTeam.name);
      setDescription(currentTeam.description || "");
      // TODO: Load settings from currentTeam.settings when available
      // setAutoApprove(currentTeam.settings?.auto_approve_invitations || false);
      // setAssignmentVisibility(currentTeam.settings?.show_assignment_visibility || false);
    }
  }, [currentTeam]);

  if (!currentTeam) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Alert severity="warning">No team selected</Alert>
        <Button onClick={() => navigate("/team")} sx={{ mt: 2 }}>
          Go to Team Dashboard
        </Button>
      </Container>
    );
  }

  const handleSave = async () => {
    if (!isAdmin || !user) return;

    setSaving(true);
    setError(null);
    setSuccess(false);

    // Update team basic info and settings
    const result = await teamService.updateTeam(user.id, currentTeam.id, {
      name: name.trim(),
      description: description.trim() || undefined,
    });

    setSaving(false);

    if (result.error) {
      setError(result.error.message);
    } else {
      setSuccess(true);
      await refreshTeam();
      setTimeout(() => setSuccess(false), 3000);
    }
  };

  const isValid = name.trim().length >= 3;
  const hasChanges = true; // TODO: Track actual changes

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Stack spacing={4}>
        {/* Header */}
        <Box>
          <Typography variant="h4" gutterBottom>
            Team Settings
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage your team's name, description, and preferences
          </Typography>
        </Box>

        {/* Access Control Alert */}
        {!isAdmin && (
          <Alert severity="info" icon={<LockIcon />}>
            Only team admins can modify settings. You're viewing in read-only
            mode.
          </Alert>
        )}

        {/* Success/Error Messages */}
        {success && (
          <Alert severity="success">Settings saved successfully!</Alert>
        )}
        {error && <Alert severity="error">{error}</Alert>}

        {/* Settings Form */}
        <Paper sx={{ p: 3 }}>
          <Stack spacing={3}>
            {/* Team Info Section */}
            <Typography variant="h6">Team Information</Typography>

            <TextField
              label="Team Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              fullWidth
              required
              disabled={!isAdmin || saving}
              error={name.length > 0 && name.trim().length < 3}
              helperText={
                name.length > 0 && name.trim().length < 3
                  ? "Team name must be at least 3 characters"
                  : ""
              }
            />

            <TextField
              label="Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              fullWidth
              multiline
              rows={3}
              disabled={!isAdmin || saving}
              placeholder="Describe your team's purpose..."
            />

            <Divider sx={{ my: 2 }} />

            {/* Team Settings Section */}
            <Typography variant="h6">Team Preferences</Typography>

            <FormControlLabel
              control={
                <Switch
                  checked={autoApprove}
                  onChange={(e) => setAutoApprove(e.target.checked)}
                  disabled={!isAdmin || saving}
                />
              }
              label="Auto-approve member invitations"
            />
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ mt: -1 }}
            >
              When enabled, new members join immediately without admin approval
            </Typography>

            <FormControlLabel
              control={
                <Switch
                  checked={assignmentVisibility}
                  onChange={(e) => setAssignmentVisibility(e.target.checked)}
                  disabled={!isAdmin || saving}
                />
              }
              label="Show candidate assignments to all members"
            />
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ mt: -1 }}
            >
              When enabled, all team members can see mentor-candidate
              assignments
            </Typography>
          </Stack>
        </Paper>

        {/* Action Buttons */}
        {isAdmin && (
          <Stack direction="row" spacing={2} justifyContent="flex-end">
            <Button
              variant="outlined"
              onClick={() => navigate("/team")}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              startIcon={saving ? <CircularProgress size={16} /> : <SaveIcon />}
              onClick={handleSave}
              disabled={!isValid || !hasChanges || saving}
            >
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </Stack>
        )}
      </Stack>
    </Container>
  );
}
