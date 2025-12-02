/**
 * EDIT SUPPORTER DIALOG (UC-113)
 *
 * Dialog for editing supporter permissions and notification preferences.
 */

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControlLabel,
  Switch,
  Stack,
  Typography,
  Divider,
  Alert,
  CircularProgress,
  Box,
  Chip,
  Avatar,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import {
  Edit as EditIcon,
  Save as SaveIcon,
  Delete as DeleteIcon,
} from "@mui/icons-material";
import {
  updateSupporterPermissions,
  removeSupporter,
} from "../services/familySupportService";
import type { FamilySupporterWithProfile } from "../types/familySupport.types";
import { SUPPORTER_ROLE_INFO } from "../types/familySupport.types";

interface EditSupporterDialogProps {
  open: boolean;
  onClose: () => void;
  userId: string;
  supporter: FamilySupporterWithProfile | null;
  onSuccess: () => void;
}

export function EditSupporterDialog({
  open,
  onClose,
  userId,
  supporter,
  onSuccess,
}: EditSupporterDialogProps) {
  // Permission state
  const [canViewApplications, setCanViewApplications] = useState(true);
  const [canViewInterviews, setCanViewInterviews] = useState(true);
  const [canViewProgress, setCanViewProgress] = useState(true);
  const [canViewMilestones, setCanViewMilestones] = useState(true);
  const [canViewStress, setCanViewStress] = useState(false);
  const [canSendEncouragement, setCanSendEncouragement] = useState(true);

  // Notification preferences
  const [notifyOnMilestones, setNotifyOnMilestones] = useState(true);
  const [notifyOnUpdates, setNotifyOnUpdates] = useState(false);
  const [notifyFrequency, setNotifyFrequency] = useState("weekly");

  // UI state
  const [loading, setLoading] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmRemove, setConfirmRemove] = useState(false);

  // Initialize form when supporter changes
  useEffect(() => {
    if (supporter) {
      setCanViewApplications(supporter.can_view_applications);
      setCanViewInterviews(supporter.can_view_interviews);
      setCanViewProgress(supporter.can_view_progress);
      setCanViewMilestones(supporter.can_view_milestones);
      setCanViewStress(supporter.can_view_stress);
      setCanSendEncouragement(supporter.can_send_encouragement);
      setNotifyOnMilestones(supporter.notify_on_milestones);
      setNotifyOnUpdates(supporter.notify_on_updates);
      setNotifyFrequency(supporter.notify_frequency || "weekly");
    }
  }, [supporter]);

  // Handle close
  function handleClose() {
    setError(null);
    setConfirmRemove(false);
    onClose();
  }

  // Handle save
  async function handleSave() {
    if (!supporter) return;

    setLoading(true);
    setError(null);

    const result = await updateSupporterPermissions(userId, supporter.id, {
      canViewApplications,
      canViewInterviews,
      canViewProgress,
      canViewMilestones,
      canViewStress,
      canSendEncouragement,
      notifyOnMilestones,
      notifyOnUpdates,
      notifyFrequency,
    });

    setLoading(false);

    if (result.error) {
      setError(result.error.message);
      return;
    }

    onSuccess();
    onClose();
  }

  // Handle remove
  async function handleRemove() {
    if (!supporter) return;

    setRemoving(true);
    setError(null);

    const result = await removeSupporter(userId, supporter.id);

    setRemoving(false);

    if (result.error) {
      setError(result.error.message);
      return;
    }

    onSuccess();
    onClose();
  }

  if (!supporter) return null;

  const roleInfo = SUPPORTER_ROLE_INFO[supporter.role];

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <EditIcon color="primary" />
        Edit Supporter
      </DialogTitle>

      <DialogContent>
        <Stack spacing={3} sx={{ mt: 1 }}>
          {error && (
            <Alert severity="error" onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          {/* Supporter Info */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Avatar sx={{ width: 56, height: 56, bgcolor: "primary.main" }}>
              {roleInfo?.icon || "👤"}
            </Avatar>
            <Box>
              <Typography variant="h6">{supporter.supporter_name}</Typography>
              <Typography variant="body2" color="text.secondary">
                {supporter.supporter_email}
              </Typography>
              <Chip
                label={roleInfo?.label || supporter.role}
                size="small"
                sx={{ mt: 0.5 }}
              />
            </Box>
          </Box>

          <Divider />

          {/* Permissions */}
          <Typography variant="subtitle2" color="text.secondary">
            What can they see?
          </Typography>

          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
            <Chip
              label="Applications"
              color={canViewApplications ? "primary" : "default"}
              onClick={() => setCanViewApplications(!canViewApplications)}
              variant={canViewApplications ? "filled" : "outlined"}
            />
            <Chip
              label="Interviews"
              color={canViewInterviews ? "primary" : "default"}
              onClick={() => setCanViewInterviews(!canViewInterviews)}
              variant={canViewInterviews ? "filled" : "outlined"}
            />
            <Chip
              label="Progress"
              color={canViewProgress ? "primary" : "default"}
              onClick={() => setCanViewProgress(!canViewProgress)}
              variant={canViewProgress ? "filled" : "outlined"}
            />
            <Chip
              label="Milestones"
              color={canViewMilestones ? "primary" : "default"}
              onClick={() => setCanViewMilestones(!canViewMilestones)}
              variant={canViewMilestones ? "filled" : "outlined"}
            />
            <Chip
              label="Well-being"
              color={canViewStress ? "warning" : "default"}
              onClick={() => setCanViewStress(!canViewStress)}
              variant={canViewStress ? "filled" : "outlined"}
            />
          </Box>

          <FormControlLabel
            control={
              <Switch
                checked={canSendEncouragement}
                onChange={(e) => setCanSendEncouragement(e.target.checked)}
              />
            }
            label="Can send encouragement messages"
          />

          <Divider />

          {/* Notification Preferences */}
          <Typography variant="subtitle2" color="text.secondary">
            Notification Preferences
          </Typography>

          <FormControlLabel
            control={
              <Switch
                checked={notifyOnMilestones}
                onChange={(e) => setNotifyOnMilestones(e.target.checked)}
              />
            }
            label="Notify when I share milestones"
          />

          <FormControlLabel
            control={
              <Switch
                checked={notifyOnUpdates}
                onChange={(e) => setNotifyOnUpdates(e.target.checked)}
              />
            }
            label="Notify on progress updates"
          />

          {notifyOnUpdates && (
            <FormControl fullWidth size="small">
              <InputLabel>Update Frequency</InputLabel>
              <Select
                value={notifyFrequency}
                label="Update Frequency"
                onChange={(e) => setNotifyFrequency(e.target.value)}
              >
                <MenuItem value="daily">Daily</MenuItem>
                <MenuItem value="weekly">Weekly</MenuItem>
                <MenuItem value="monthly">Monthly</MenuItem>
              </Select>
            </FormControl>
          )}

          <Divider />

          {/* Activity Stats */}
          <Typography variant="subtitle2" color="text.secondary">
            Activity
          </Typography>
          <Box sx={{ display: "flex", gap: 3 }}>
            <Box>
              <Typography variant="h5">{supporter.view_count}</Typography>
              <Typography variant="caption" color="text.secondary">
                Profile Views
              </Typography>
            </Box>
            <Box>
              <Typography variant="h5">
                {supporter.encouragements_sent}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Encouragements Sent
              </Typography>
            </Box>
          </Box>

          <Divider />

          {/* Remove Supporter */}
          {!confirmRemove ? (
            <Button
              color="error"
              startIcon={<DeleteIcon />}
              onClick={() => setConfirmRemove(true)}
            >
              Remove Supporter
            </Button>
          ) : (
            <Alert severity="warning">
              <Typography variant="body2" sx={{ mb: 1 }}>
                Are you sure you want to remove {supporter.supporter_name} as a
                supporter? They will no longer be able to see your progress.
              </Typography>
              <Stack direction="row" spacing={1}>
                <Button
                  size="small"
                  color="error"
                  variant="contained"
                  onClick={handleRemove}
                  disabled={removing}
                >
                  {removing ? "Removing..." : "Yes, Remove"}
                </Button>
                <Button size="small" onClick={() => setConfirmRemove(false)}>
                  Cancel
                </Button>
              </Stack>
            </Alert>
          )}
        </Stack>
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          variant="contained"
          disabled={loading}
          startIcon={loading ? <CircularProgress size={20} /> : <SaveIcon />}
        >
          {loading ? "Saving..." : "Save Changes"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default EditSupporterDialog;
