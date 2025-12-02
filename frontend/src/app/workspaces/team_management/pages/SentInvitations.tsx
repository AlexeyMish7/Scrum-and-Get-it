/**
 * SENT INVITATIONS PAGE
 *
 * Purpose:
 * - Allow team admins to view all invitations they've sent
 * - Show invitation status (pending, accepted, declined, expired, cancelled)
 * - Allow canceling pending invitations
 * - Resend expired invitations
 *
 * Flow:
 * 1. Load all invitations for current team
 * 2. Display list with status, invitee email, role, and dates
 * 3. Admin can cancel pending or resend expired invitations
 *
 * Access Control:
 * - Only team admins can view this page
 *
 * Usage:
 *   Route: /team/sent-invitations
 *   Access: Team admins only
 */

import React, { useState, useEffect, useMemo } from "react";
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
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  type SelectChangeEvent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";
import {
  ArrowBack as ArrowBackIcon,
  Cancel as CancelIcon,
  Refresh as ResendIcon,
  Mail as MailIcon,
  CheckCircle as AcceptedIcon,
  Close as DeclinedIcon,
  Schedule as PendingIcon,
  TimerOff as ExpiredIcon,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@shared/context/AuthContext";
import { useTeam } from "@shared/context/useTeam";
import * as teamService from "../services/teamService";
import type { InvitationWithDetails, InvitationStatus } from "../types";

// Status display configuration
const statusConfig: Record<
  InvitationStatus,
  {
    label: string;
    color: "default" | "primary" | "success" | "error" | "warning";
    icon: React.ReactElement;
  }
> = {
  pending: {
    label: "Pending",
    color: "primary",
    icon: <PendingIcon fontSize="small" />,
  },
  accepted: {
    label: "Accepted",
    color: "success",
    icon: <AcceptedIcon fontSize="small" />,
  },
  declined: {
    label: "Declined",
    color: "error",
    icon: <DeclinedIcon fontSize="small" />,
  },
  expired: {
    label: "Expired",
    color: "warning",
    icon: <ExpiredIcon fontSize="small" />,
  },
  cancelled: {
    label: "Cancelled",
    color: "default",
    icon: <CancelIcon fontSize="small" />,
  },
};

export function SentInvitations() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { currentTeam, isAdmin, inviteMember } = useTeam();

  const [invitations, setInvitations] = useState<InvitationWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<InvitationStatus | "all">(
    "all"
  );

  // Load invitations
  useEffect(() => {
    loadInvitations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, currentTeam]);

  const loadInvitations = async () => {
    if (!user || !currentTeam) {
      setInvitations([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    // Fetch all invitations (not just pending)
    const result = await teamService.getTeamInvitations(
      user.id,
      currentTeam.id,
      {
        status: "all",
      }
    );

    if (result.error) {
      setError(result.error.message);
      setInvitations([]);
    } else {
      setInvitations(result.data || []);
    }

    setLoading(false);
  };

  // Filter invitations by status
  const filteredInvitations = useMemo(() => {
    if (statusFilter === "all") return invitations;
    return invitations.filter((inv) => inv.status === statusFilter);
  }, [invitations, statusFilter]);

  // Group invitations by status for summary
  const statusCounts = useMemo(() => {
    const counts: Record<InvitationStatus, number> = {
      pending: 0,
      accepted: 0,
      declined: 0,
      expired: 0,
      cancelled: 0,
    };
    invitations.forEach((inv) => {
      counts[inv.status]++;
    });
    return counts;
  }, [invitations]);

  // Handle canceling an invitation
  const handleCancel = async (invitationId: string) => {
    if (!user) return;

    setProcessingId(invitationId);
    setError(null);

    const result = await teamService.cancelInvitation(user.id, invitationId);

    if (result.error) {
      setError(result.error.message);
    } else {
      // Refresh the list
      await loadInvitations();
    }

    setProcessingId(null);
  };

  // Handle resending an expired invitation
  const handleResend = async (invitation: InvitationWithDetails) => {
    if (!user || !currentTeam) return;

    setProcessingId(invitation.id);
    setError(null);

    // Cancel the old one and create a new invitation
    await teamService.cancelInvitation(user.id, invitation.id);

    const result = await inviteMember({
      invitee_email: invitation.invitee_email,
      role: invitation.role,
    });

    if (!result.ok) {
      setError(result.error || "Failed to resend invitation");
    } else {
      // Refresh the list
      await loadInvitations();
    }

    setProcessingId(null);
  };

  // Check if invitation is expired
  const isExpired = (expiresAt: string) => new Date(expiresAt) < new Date();

  // Access control - only admins
  if (!isAdmin) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Alert severity="error">
          Only team admins can view sent invitations.
        </Alert>
        <Button onClick={() => navigate("/team")} sx={{ mt: 2 }}>
          Go to Team Dashboard
        </Button>
      </Container>
    );
  }

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
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Stack spacing={4}>
        {/* Header */}
        <Stack direction="row" alignItems="center" spacing={2}>
          <IconButton
            onClick={() => navigate("/team")}
            aria-label="Back to dashboard"
          >
            <ArrowBackIcon />
          </IconButton>
          <Box flex={1}>
            <Typography variant="h4" component="h1">
              Sent Invitations
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Manage invitations you've sent to join {currentTeam.name}
            </Typography>
          </Box>
          <Button
            variant="outlined"
            startIcon={<ResendIcon />}
            onClick={loadInvitations}
            disabled={loading}
          >
            Refresh
          </Button>
        </Stack>

        {/* Error Alert */}
        {error && (
          <Alert severity="error" onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Status Summary */}
        <Paper sx={{ p: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            Invitation Summary
          </Typography>
          <Stack direction="row" spacing={2} flexWrap="wrap">
            <Chip
              icon={<PendingIcon />}
              label={`${statusCounts.pending} Pending`}
              color="primary"
              variant={statusFilter === "pending" ? "filled" : "outlined"}
              onClick={() =>
                setStatusFilter(statusFilter === "pending" ? "all" : "pending")
              }
            />
            <Chip
              icon={<AcceptedIcon />}
              label={`${statusCounts.accepted} Accepted`}
              color="success"
              variant={statusFilter === "accepted" ? "filled" : "outlined"}
              onClick={() =>
                setStatusFilter(
                  statusFilter === "accepted" ? "all" : "accepted"
                )
              }
            />
            <Chip
              icon={<DeclinedIcon />}
              label={`${statusCounts.declined} Declined`}
              color="error"
              variant={statusFilter === "declined" ? "filled" : "outlined"}
              onClick={() =>
                setStatusFilter(
                  statusFilter === "declined" ? "all" : "declined"
                )
              }
            />
            <Chip
              icon={<ExpiredIcon />}
              label={`${statusCounts.expired} Expired`}
              color="warning"
              variant={statusFilter === "expired" ? "filled" : "outlined"}
              onClick={() =>
                setStatusFilter(statusFilter === "expired" ? "all" : "expired")
              }
            />
            <Chip
              icon={<CancelIcon />}
              label={`${statusCounts.cancelled} Cancelled`}
              variant={statusFilter === "cancelled" ? "filled" : "outlined"}
              onClick={() =>
                setStatusFilter(
                  statusFilter === "cancelled" ? "all" : "cancelled"
                )
              }
            />
          </Stack>
        </Paper>

        {/* Filter Dropdown (Mobile friendly alternative) */}
        <FormControl
          size="small"
          sx={{ display: { xs: "block", md: "none" }, maxWidth: 200 }}
        >
          <InputLabel>Filter by Status</InputLabel>
          <Select
            value={statusFilter}
            label="Filter by Status"
            onChange={(e: SelectChangeEvent) =>
              setStatusFilter(e.target.value as InvitationStatus | "all")
            }
          >
            <MenuItem value="all">All Invitations</MenuItem>
            <MenuItem value="pending">Pending</MenuItem>
            <MenuItem value="accepted">Accepted</MenuItem>
            <MenuItem value="declined">Declined</MenuItem>
            <MenuItem value="expired">Expired</MenuItem>
            <MenuItem value="cancelled">Cancelled</MenuItem>
          </Select>
        </FormControl>

        {/* No Invitations */}
        {filteredInvitations.length === 0 && (
          <Card>
            <CardContent sx={{ textAlign: "center", py: 6 }}>
              <MailIcon sx={{ fontSize: 64, color: "text.secondary", mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                {statusFilter === "all"
                  ? "No Invitations Sent Yet"
                  : `No ${
                      statusConfig[statusFilter as InvitationStatus]?.label ||
                      ""
                    } Invitations`}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {statusFilter === "all"
                  ? "Invite team members from the dashboard to get started."
                  : "Try selecting a different status filter."}
              </Typography>
            </CardContent>
            <CardActions sx={{ justifyContent: "center", pb: 4 }}>
              <Button variant="outlined" onClick={() => navigate("/team")}>
                Go to Dashboard
              </Button>
              {statusFilter !== "all" && (
                <Button variant="text" onClick={() => setStatusFilter("all")}>
                  Show All
                </Button>
              )}
            </CardActions>
          </Card>
        )}

        {/* Invitations Table */}
        {filteredInvitations.length > 0 && (
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Invitee Email</TableCell>
                  <TableCell>Role</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Sent</TableCell>
                  <TableCell>Expires</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredInvitations.map((invitation) => {
                  const status = statusConfig[invitation.status];
                  const isProcessing = processingId === invitation.id;
                  const expired = isExpired(invitation.expires_at);
                  const canCancel = invitation.status === "pending" && !expired;
                  const canResend =
                    invitation.status === "expired" ||
                    (invitation.status === "pending" && expired);

                  return (
                    <TableRow key={invitation.id}>
                      <TableCell>
                        <Typography variant="body2" fontWeight="medium">
                          {invitation.invitee_email}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={invitation.role}
                          size="small"
                          color={
                            invitation.role === "admin"
                              ? "error"
                              : invitation.role === "mentor"
                              ? "primary"
                              : "success"
                          }
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          icon={status.icon}
                          label={
                            expired && invitation.status === "pending"
                              ? "Expired"
                              : status.label
                          }
                          size="small"
                          color={
                            expired && invitation.status === "pending"
                              ? "warning"
                              : status.color
                          }
                          variant="filled"
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption" color="text.secondary">
                          {new Date(invitation.created_at).toLocaleDateString()}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography
                          variant="caption"
                          color={expired ? "error.main" : "text.secondary"}
                        >
                          {new Date(invitation.expires_at).toLocaleDateString()}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Stack
                          direction="row"
                          spacing={1}
                          justifyContent="flex-end"
                        >
                          {canCancel && (
                            <Button
                              size="small"
                              color="error"
                              startIcon={
                                isProcessing ? (
                                  <CircularProgress size={14} />
                                ) : (
                                  <CancelIcon />
                                )
                              }
                              onClick={() => handleCancel(invitation.id)}
                              disabled={isProcessing}
                            >
                              Cancel
                            </Button>
                          )}
                          {canResend && (
                            <Button
                              size="small"
                              color="primary"
                              startIcon={
                                isProcessing ? (
                                  <CircularProgress size={14} />
                                ) : (
                                  <ResendIcon />
                                )
                              }
                              onClick={() => handleResend(invitation)}
                              disabled={isProcessing}
                            >
                              Resend
                            </Button>
                          )}
                          {!canCancel && !canResend && (
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              —
                            </Typography>
                          )}
                        </Stack>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Stack>
    </Container>
  );
}
