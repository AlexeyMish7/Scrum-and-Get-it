/**
 * ADD PARTNER DIALOG COMPONENT (UC-111)
 *
 * Modal dialog for adding accountability partners.
 * Allows searching team members and sending partnership requests.
 *
 * Features:
 * - Search team members
 * - View member profiles
 * - Send partnership request with optional message
 * - Loading and error states
 */

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Typography,
  Box,
  Chip,
  CircularProgress,
  Alert,
  InputAdornment,
  Divider,
} from "@mui/material";
import {
  Search as SearchIcon,
  PersonAdd as PersonAddIcon,
  Check as CheckIcon,
} from "@mui/icons-material";
import { getTeamMembers } from "../services/teamService";
import { createPartnershipRequest } from "../services/progressSharingService";
import type { TeamMemberWithProfile } from "../types";

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface AddPartnerDialogProps {
  open: boolean;
  onClose: () => void;
  teamId: string;
  userId: string;
  onPartnerAdded?: () => void;
  existingPartnerIds?: string[];
}

// ============================================================================
// COMPONENT
// ============================================================================

export default function AddPartnerDialog({
  open,
  onClose,
  teamId,
  userId,
  onPartnerAdded,
  existingPartnerIds = [],
}: AddPartnerDialogProps) {
  // Search and filtering state
  const [searchQuery, setSearchQuery] = useState("");
  const [members, setMembers] = useState<TeamMemberWithProfile[]>([]);
  const [filteredMembers, setFilteredMembers] = useState<
    TeamMemberWithProfile[]
  >([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Selection state
  const [selectedMember, setSelectedMember] =
    useState<TeamMemberWithProfile | null>(null);
  const [requestMessage, setRequestMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Load team members when dialog opens
  useEffect(() => {
    async function fetchMembers() {
      setLoading(true);
      setError(null);

      try {
        const result = await getTeamMembers(userId, teamId);

        if (result.error) {
          setError(result.error.message);
          return;
        }

        // Filter out self and existing partners
        const availableMembers = (result.data || []).filter(
          (member) =>
            member.user_id !== userId &&
            !existingPartnerIds.includes(member.user_id)
        );

        setMembers(availableMembers);
        setFilteredMembers(availableMembers);
      } catch {
        setError("Failed to load team members");
      } finally {
        setLoading(false);
      }
    }

    if (open && teamId) {
      fetchMembers();
    }
  }, [open, teamId, userId, existingPartnerIds]);

  // Filter members when search query changes
  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredMembers(members);
    } else {
      const query = searchQuery.toLowerCase();
      setFilteredMembers(
        members.filter(
          (member) =>
            member.profile?.full_name?.toLowerCase().includes(query) ||
            member.profile?.email?.toLowerCase().includes(query) ||
            member.profile?.professional_title?.toLowerCase().includes(query)
        )
      );
    }
  }, [searchQuery, members]);

  // Handle member selection
  function handleSelectMember(member: TeamMemberWithProfile) {
    setSelectedMember(member);
    setRequestMessage("");
  }

  // Send partnership request
  async function handleSendRequest() {
    if (!selectedMember) return;

    setSubmitting(true);
    setError(null);

    try {
      const result = await createPartnershipRequest(userId, {
        teamId,
        partnerId: selectedMember.user_id,
        invitationMessage: requestMessage || undefined,
      });

      if (result.error) {
        setError(result.error.message);
        return;
      }

      // Success - notify parent and close
      onPartnerAdded?.();
      handleClose();
    } catch {
      setError("Failed to send partnership request");
    } finally {
      setSubmitting(false);
    }
  }

  // Reset state and close
  function handleClose() {
    setSearchQuery("");
    setSelectedMember(null);
    setRequestMessage("");
    setError(null);
    onClose();
  }

  // Get initials for avatar
  function getInitials(name?: string | null): string {
    if (!name) return "?";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  }

  // Get role color
  function getRoleColor(role?: string): "primary" | "secondary" | "default" {
    switch (role) {
      case "mentor":
        return "primary";
      case "advisor":
        return "secondary";
      default:
        return "default";
    }
  }

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <PersonAddIcon color="primary" />
          Add Accountability Partner
        </Box>
      </DialogTitle>

      <DialogContent dividers>
        {/* Error Alert */}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {/* Search Field */}
        <TextField
          fullWidth
          placeholder="Search team members..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            },
          }}
          sx={{ mb: 2 }}
        />

        {/* Loading State */}
        {loading && (
          <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
            <CircularProgress />
          </Box>
        )}

        {/* Member List */}
        {!loading && !selectedMember && (
          <>
            {filteredMembers.length === 0 ? (
              <Box sx={{ textAlign: "center", py: 4 }}>
                <Typography color="text.secondary">
                  {members.length === 0
                    ? "No team members available to partner with"
                    : "No members match your search"}
                </Typography>
              </Box>
            ) : (
              <List>
                {filteredMembers.map((member) => (
                  <ListItem
                    key={member.id}
                    onClick={() => handleSelectMember(member)}
                    sx={{
                      cursor: "pointer",
                      borderRadius: 1,
                      mb: 0.5,
                      "&:hover": {
                        backgroundColor: "action.hover",
                      },
                    }}
                  >
                    <ListItemAvatar>
                      <Avatar alt={member.profile?.full_name || undefined}>
                        {getInitials(member.profile?.full_name)}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={member.profile?.full_name || "Unknown"}
                      secondary={
                        member.profile?.professional_title || member.role
                      }
                    />
                    <Chip
                      label={member.role}
                      size="small"
                      color={getRoleColor(member.role)}
                      variant="outlined"
                    />
                  </ListItem>
                ))}
              </List>
            )}
          </>
        )}

        {/* Selected Member View */}
        {selectedMember && (
          <Box>
            {/* Member Preview */}
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 2,
                p: 2,
                backgroundColor: "action.selected",
                borderRadius: 1,
                mb: 2,
              }}
            >
              <Avatar
                alt={selectedMember.profile?.full_name || undefined}
                sx={{ width: 56, height: 56 }}
              >
                {getInitials(selectedMember.profile?.full_name)}
              </Avatar>
              <Box sx={{ flex: 1 }}>
                <Typography variant="subtitle1" fontWeight="bold">
                  {selectedMember.profile?.full_name}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {selectedMember.profile?.professional_title ||
                    selectedMember.role}
                </Typography>
              </Box>
              <Button size="small" onClick={() => setSelectedMember(null)}>
                Change
              </Button>
            </Box>

            <Divider sx={{ my: 2 }} />

            {/* Request Message */}
            <Typography variant="subtitle2" gutterBottom>
              Add a message (optional)
            </Typography>
            <TextField
              fullWidth
              multiline
              rows={3}
              placeholder="Hi! I'd love to be accountability partners. We can help each other stay on track with our job search goals!"
              value={requestMessage}
              onChange={(e) => setRequestMessage(e.target.value)}
            />

            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ display: "block", mt: 1 }}
            >
              They'll be notified of your partnership request.
            </Typography>
          </Box>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose} disabled={submitting}>
          Cancel
        </Button>
        {selectedMember && (
          <Button
            variant="contained"
            onClick={handleSendRequest}
            disabled={submitting}
            startIcon={
              submitting ? <CircularProgress size={16} /> : <CheckIcon />
            }
          >
            {submitting ? "Sending..." : "Send Request"}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
