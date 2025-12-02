/**
 * INVITE MEMBER DIALOG
 *
 * Purpose:
 * - Allow team admins to invite new members
 * - Assign role during invitation (admin/mentor/candidate)
 * - Send invitation via email (stored in database)
 * - Warn when inviting users who don't have an account
 *
 * Flow:
 * 1. Admin clicks "Invite Member" button
 * 2. Dialog opens with email and role fields
 * 3. On email blur, check if user exists in system
 * 4. Show warning if user doesn't have an account
 * 5. Submit → creates team_invitations record
 * 6. Invitee receives email (if configured) or checks /team/invitations
 * 7. Success → close dialog, refresh team members
 *
 * Access Control:
 * - Only team admins can invite members
 * - RLS policies enforce this at database level
 *
 * Usage:
 *   <InviteMemberDialog open={open} onClose={handleClose} />
 */

import { useState, useEffect, useCallback } from "react";
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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
} from "@mui/material";
import { Send as SendIcon, Warning as WarningIcon } from "@mui/icons-material";
import { useTeam } from "@shared/context/useTeam";
import * as teamService from "../services/teamService";
import type { TeamRole } from "../types";

type InviteMemberDialogProps = {
  open: boolean;
  onClose: () => void;
};

export function InviteMemberDialog({ open, onClose }: InviteMemberDialogProps) {
  const { inviteMember, isAdmin } = useTeam();

  // Form state
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<TeamRole>("candidate");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // User existence check state
  const [checkingUser, setCheckingUser] = useState(false);
  const [userExists, setUserExists] = useState<boolean | null>(null);
  const [existingUserName, setExistingUserName] = useState<string | null>(null);

  // Email validation
  const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const isValid = isValidEmail && role;

  // Check if user exists when email changes (debounced)
  const checkUserExists = useCallback(
    async (emailToCheck: string) => {
      if (!emailToCheck || !isValidEmail) {
        setUserExists(null);
        setExistingUserName(null);
        return;
      }

      setCheckingUser(true);
      const result = await teamService.checkUserExistsByEmail(emailToCheck);
      setCheckingUser(false);

      if (result.data) {
        setUserExists(result.data.exists);
        setExistingUserName(result.data.profile?.full_name || null);
      } else {
        setUserExists(null);
        setExistingUserName(null);
      }
    },
    [isValidEmail]
  );

  // Check user when email field loses focus
  const handleEmailBlur = () => {
    if (isValidEmail) {
      checkUserExists(email.trim().toLowerCase());
    }
  };

  // Reset user check when email changes
  useEffect(() => {
    setUserExists(null);
    setExistingUserName(null);
  }, [email]);

  const handleSubmit = async () => {
    if (!isValid || !isAdmin) return;

    setLoading(true);
    setError(null);

    const result = await inviteMember({
      invitee_email: email.trim().toLowerCase(),
      role,
    });

    setLoading(false);

    if (result.ok) {
      // Success - reset and close
      setEmail("");
      setRole("candidate");
      setUserExists(null);
      setExistingUserName(null);
      onClose();
    } else {
      setError(result.error || "Failed to send invitation");
    }
  };

  const handleClose = () => {
    if (loading) return; // Don't close while sending
    setEmail("");
    setRole("candidate");
    setError(null);
    setUserExists(null);
    setExistingUserName(null);
    onClose();
  };

  if (!isAdmin) {
    return null; // Don't render if user isn't admin
  }

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Invite Team Member</DialogTitle>

      <DialogContent>
        <Stack spacing={3} sx={{ mt: 1 }}>
          {error && <Alert severity="error">{error}</Alert>}

          <Alert severity="info">
            The invitee will receive an email and can accept the invitation from
            their account dashboard.
          </Alert>

          <TextField
            label="Email Address"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onBlur={handleEmailBlur}
            placeholder="colleague@example.com"
            fullWidth
            required
            disabled={loading}
            autoFocus
            error={email.length > 0 && !isValidEmail}
            helperText={
              email.length > 0 && !isValidEmail
                ? "Please enter a valid email address"
                : checkingUser
                ? "Checking if user exists..."
                : userExists === true && existingUserName
                ? `Found: ${existingUserName}`
                : "Enter the email of the person you want to invite"
            }
            InputProps={{
              endAdornment: checkingUser ? (
                <CircularProgress size={20} />
              ) : null,
            }}
          />

          {/* Warning for non-existent users */}
          {userExists === false && (
            <Alert severity="warning" icon={<WarningIcon />}>
              <Typography variant="body2">
                <strong>No account found</strong> for this email address.
              </Typography>
              <Typography variant="caption" component="p" sx={{ mt: 0.5 }}>
                The person will need to sign up first before they can accept
                this invitation. They will see the invitation after creating an
                account with this email.
              </Typography>
            </Alert>
          )}

          {/* Success indicator when user exists */}
          {userExists === true && (
            <Alert severity="success">
              <Typography variant="body2">
                {existingUserName
                  ? `${existingUserName} has an account and can accept this invitation immediately.`
                  : "This user has an account and can accept this invitation."}
              </Typography>
            </Alert>
          )}

          <FormControl fullWidth required disabled={loading}>
            <InputLabel>Role</InputLabel>
            <Select
              value={role}
              label="Role"
              onChange={(e) => setRole(e.target.value as TeamRole)}
            >
              <MenuItem value="candidate">
                <Stack>
                  <Typography variant="body2" fontWeight="medium">
                    Candidate
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Job seeker being coached - can manage their own profile and
                    applications
                  </Typography>
                </Stack>
              </MenuItem>
              <MenuItem value="mentor">
                <Stack>
                  <Typography variant="body2" fontWeight="medium">
                    Mentor
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Coach or advisor - can be assigned to candidates and view
                    their progress
                  </Typography>
                </Stack>
              </MenuItem>
              <MenuItem value="admin">
                <Stack>
                  <Typography variant="body2" fontWeight="medium">
                    Admin
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Team manager - full access to manage members, settings, and
                    assignments
                  </Typography>
                </Stack>
              </MenuItem>
            </Select>
          </FormControl>

          <Alert severity="warning">
            <Typography variant="caption">
              <strong>Note:</strong> You can change their role later from the
              team members list.
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
          disabled={!isValid || loading}
          startIcon={loading ? <CircularProgress size={16} /> : <SendIcon />}
        >
          {loading ? "Sending..." : "Send Invitation"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
