/**
 * INVITE SUPPORTER DIALOG (UC-113)
 *
 * Dialog for inviting family members or friends to be supporters.
 * Allows setting permissions and sending a personalized invitation.
 */

import { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Switch,
  Stack,
  Typography,
  Divider,
  Alert,
  CircularProgress,
  Box,
  Chip,
} from "@mui/material";
import { PersonAdd as InviteIcon, Send as SendIcon } from "@mui/icons-material";
import { inviteSupporter } from "../services/familySupportService";
import type {
  SupporterRole,
  InviteSupporterData,
} from "../types/familySupport.types";
import { SUPPORTER_ROLE_INFO } from "../types/familySupport.types";

interface InviteSupporterDialogProps {
  open: boolean;
  onClose: () => void;
  userId: string;
  onSuccess: () => void;
}

export function InviteSupporterDialog({
  open,
  onClose,
  userId,
  onSuccess,
}: InviteSupporterDialogProps) {
  // Form state
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<SupporterRole>("friend");
  const [customRoleName, setCustomRoleName] = useState("");
  const [invitationMessage, setInvitationMessage] = useState("");

  // Permission state
  const [canViewApplications, setCanViewApplications] = useState(true);
  const [canViewInterviews, setCanViewInterviews] = useState(true);
  const [canViewProgress, setCanViewProgress] = useState(true);
  const [canViewMilestones, setCanViewMilestones] = useState(true);
  const [canViewStress, setCanViewStress] = useState(false);
  const [canSendEncouragement, setCanSendEncouragement] = useState(true);

  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset form
  function resetForm() {
    setEmail("");
    setName("");
    setRole("friend");
    setCustomRoleName("");
    setInvitationMessage("");
    setCanViewApplications(true);
    setCanViewInterviews(true);
    setCanViewProgress(true);
    setCanViewMilestones(true);
    setCanViewStress(false);
    setCanSendEncouragement(true);
    setError(null);
  }

  // Handle close
  function handleClose() {
    resetForm();
    onClose();
  }

  // Handle submit
  async function handleSubmit() {
    // Validation
    if (!email.trim()) {
      setError("Email is required");
      return;
    }
    if (!name.trim()) {
      setError("Name is required");
      return;
    }
    if (role === "other" && !customRoleName.trim()) {
      setError("Please specify the relationship");
      return;
    }

    setLoading(true);
    setError(null);

    const data: InviteSupporterData = {
      supporterEmail: email.trim(),
      supporterName: name.trim(),
      role,
      customRoleName: role === "other" ? customRoleName.trim() : undefined,
      invitationMessage: invitationMessage.trim() || undefined,
      permissions: {
        canViewApplications,
        canViewInterviews,
        canViewProgress,
        canViewMilestones,
        canViewStress,
        canSendEncouragement,
      },
    };

    const result = await inviteSupporter(userId, data);

    setLoading(false);

    if (result.error) {
      setError(result.error.message);
      return;
    }

    // Success
    resetForm();
    onSuccess();
    onClose();
  }

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <InviteIcon color="primary" />
        Invite a Supporter
      </DialogTitle>

      <DialogContent>
        <Stack spacing={3} sx={{ mt: 1 }}>
          {error && (
            <Alert severity="error" onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          {/* Basic Info */}
          <Typography variant="subtitle2" color="text.secondary">
            Who would you like to invite?
          </Typography>

          <TextField
            label="Their Email Address"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            fullWidth
            required
            placeholder="supporter@example.com"
          />

          <TextField
            label="Their Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            fullWidth
            required
            placeholder="e.g., Mom, John, Sarah"
          />

          <FormControl fullWidth>
            <InputLabel>Relationship</InputLabel>
            <Select
              value={role}
              label="Relationship"
              onChange={(e) => setRole(e.target.value as SupporterRole)}
            >
              {Object.values(SUPPORTER_ROLE_INFO).map((info) => (
                <MenuItem key={info.value} value={info.value}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <span>{info.icon}</span>
                    <span>{info.label}</span>
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {role === "other" && (
            <TextField
              label="Describe the relationship"
              value={customRoleName}
              onChange={(e) => setCustomRoleName(e.target.value)}
              fullWidth
              required
              placeholder="e.g., Aunt, Roommate, Career Coach"
            />
          )}

          <TextField
            label="Personal Message (Optional)"
            value={invitationMessage}
            onChange={(e) => setInvitationMessage(e.target.value)}
            fullWidth
            multiline
            rows={3}
            placeholder="Add a personal note to your invitation..."
          />

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

          <Alert severity="info" icon={false}>
            <Typography variant="caption">
              <strong>Privacy note:</strong> Salary information and rejection
              details are always hidden from supporters. You can change
              permissions anytime.
            </Typography>
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
          disabled={loading}
          startIcon={loading ? <CircularProgress size={20} /> : <SendIcon />}
        >
          {loading ? "Sending..." : "Send Invitation"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default InviteSupporterDialog;
