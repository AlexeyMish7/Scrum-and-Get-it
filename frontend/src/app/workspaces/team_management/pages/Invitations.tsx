/**
 * INVITATIONS PAGE
 *
 * Purpose:
 * - Show user's pending team invitations
 * - Allow accepting or declining invitations
 * - Update team membership on acceptance
 *
 * Flow:
 * 1. Load user's pending invitations from database
 * 2. Display list with team name, role, inviter info
 * 3. User accepts → creates team_member record, deletes invitation
 * 4. User declines → deletes invitation record
 * 5. Auto-switch to team on acceptance (if no current team)
 *
 * Usage:
 *   Route: /team/invitations
 *   Access: All authenticated users
 */

import { useState, useEffect } from "react";
import {
  Container,
  Stack,
  Typography,
  Button,
  Paper,
  Card,
  CardContent,
  CardActions,
  Chip,
  Alert,
  CircularProgress,
  Box,
  Divider,
} from "@mui/material";
import {
  CheckCircle as AcceptIcon,
  Cancel as DeclineIcon,
  Mail as MailIcon,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@shared/context/AuthContext";
import { useTeam } from "@shared/context/useTeam";
import * as teamService from "../services/teamService";
import type { TeamInvitationWithTeam } from "../types";

export function Invitations() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { refreshTeams } = useTeam();

  const [invitations, setInvitations] = useState<TeamInvitationWithTeam[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);

  // Load pending invitations
  useEffect(() => {
    loadInvitations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const loadInvitations = async () => {
    if (!user) {
      setInvitations([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const result = await teamService.getUserInvitations();

    if (result.error) {
      setError(result.error.message);
      setInvitations([]);
    } else {
      setInvitations(result.data || []);
    }

    setLoading(false);
  };

  const handleAccept = async (invitationId: string) => {
    if (!user) return;

    setProcessingId(invitationId);
    setError(null);

    const result = await teamService.acceptInvitation(user.id, invitationId);

    if (result.error) {
      setError(result.error.message);
      setProcessingId(null);
    } else {
      // Success - refresh invitations and team list
      await Promise.all([loadInvitations(), refreshTeams()]);
      setProcessingId(null);
    }
  };

  const handleDecline = async (invitationId: string) => {
    if (!user) return;

    setProcessingId(invitationId);
    setError(null);

    const result = await teamService.declineInvitation(user.id, invitationId);

    if (result.error) {
      setError(result.error.message);
      setProcessingId(null);
    } else {
      // Success - refresh invitations
      await loadInvitations();
      setProcessingId(null);
    }
  };

  if (loading) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Stack spacing={3} alignItems="center">
          <CircularProgress />
          <Typography color="text.secondary">Loading invitations...</Typography>
        </Stack>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Stack spacing={4}>
        {/* Header */}
        <Box>
          <Typography variant="h4" gutterBottom>
            Team Invitations
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Review and respond to invitations to join teams
          </Typography>
        </Box>

        {/* Error Alert */}
        {error && <Alert severity="error">{error}</Alert>}

        {/* No Invitations */}
        {invitations.length === 0 && (
          <Card>
            <CardContent sx={{ textAlign: "center", py: 6 }}>
              <MailIcon sx={{ fontSize: 64, color: "text.secondary", mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                No Pending Invitations
              </Typography>
              <Typography variant="body2" color="text.secondary">
                You don't have any team invitations at the moment.
              </Typography>
            </CardContent>
            <CardActions sx={{ justifyContent: "center", pb: 4 }}>
              <Button variant="outlined" onClick={() => navigate("/team")}>
                Go to Team Dashboard
              </Button>
            </CardActions>
          </Card>
        )}

        {/* Invitations List */}
        {invitations.map((invitation) => {
          const isProcessing = processingId === invitation.id;

          return (
            <Paper key={invitation.id} sx={{ p: 3 }}>
              <Stack spacing={2}>
                {/* Invitation Header */}
                <Stack
                  direction="row"
                  justifyContent="space-between"
                  alignItems="flex-start"
                >
                  <Box flex={1}>
                    <Typography variant="h6">
                      {invitation.team?.name || "Unknown Team"}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {invitation.team?.description || "No description"}
                    </Typography>
                  </Box>
                  <Chip
                    label={invitation.role}
                    color={
                      invitation.role === "admin"
                        ? "primary"
                        : invitation.role === "mentor"
                        ? "secondary"
                        : "default"
                    }
                  />
                </Stack>

                <Divider />

                {/* Invitation Details */}
                <Stack spacing={1}>
                  <Typography variant="caption" color="text.secondary">
                    Invited by: {invitation.inviter?.full_name || "Unknown"}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Invited on:{" "}
                    {new Date(invitation.created_at).toLocaleDateString()}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Status: {invitation.status}
                  </Typography>
                </Stack>

                {/* Action Buttons */}
                {invitation.status === "pending" && (
                  <Stack direction="row" spacing={2} justifyContent="flex-end">
                    <Button
                      variant="outlined"
                      color="error"
                      startIcon={
                        isProcessing ? (
                          <CircularProgress size={16} />
                        ) : (
                          <DeclineIcon />
                        )
                      }
                      onClick={() => handleDecline(invitation.id)}
                      disabled={isProcessing}
                    >
                      Decline
                    </Button>
                    <Button
                      variant="contained"
                      startIcon={
                        isProcessing ? (
                          <CircularProgress size={16} />
                        ) : (
                          <AcceptIcon />
                        )
                      }
                      onClick={() => handleAccept(invitation.id)}
                      disabled={isProcessing}
                    >
                      {isProcessing ? "Accepting..." : "Accept Invitation"}
                    </Button>
                  </Stack>
                )}
              </Stack>
            </Paper>
          );
        })}
      </Stack>
    </Container>
  );
}
