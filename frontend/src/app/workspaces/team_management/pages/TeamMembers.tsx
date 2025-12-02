/**
 * TEAM MEMBERS PAGE
 *
 * Purpose:
 * - Display all team members in a full list view
 * - Show member roles, status, and basic profile info
 * - Allow admins to manage members (remove, change role)
 *
 * Flow:
 * 1. Load team members from TeamContext
 * 2. Display searchable/filterable list of all members
 * 3. Show member details (role, join date, profile info)
 *
 * Access Control:
 * - All team members can view the list
 * - Only admins can remove members or change roles
 *
 * Usage:
 *   Route: /team/members
 *   Access: All team members
 */

import React, { useState, useMemo } from "react";
import {
  Container,
  Paper,
  Stack,
  Typography,
  TextField,
  InputAdornment,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Chip,
  Divider,
  Box,
  Button,
  Alert,
  IconButton,
  Menu,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  type SelectChangeEvent,
} from "@mui/material";
import {
  Search as SearchIcon,
  ArrowBack as ArrowBackIcon,
  Link as LinkIcon,
  MoreVert as MoreVertIcon,
  PersonRemove as PersonRemoveIcon,
  AdminPanelSettings as AdminIcon,
  School as MentorIcon,
  Person as CandidateIcon,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { useTeam } from "@shared/context/useTeam";
import { useAuth } from "@shared/context/AuthContext";
import * as teamService from "../services/teamService";
import type { TeamMemberWithProfile, TeamRole } from "../types";

// Role display config with colors and icons
const roleConfig: Record<
  TeamRole,
  {
    label: string;
    color: "error" | "primary" | "success";
    icon: React.ReactElement;
  }
> = {
  admin: {
    label: "Admin",
    color: "error",
    icon: <AdminIcon fontSize="small" />,
  },
  mentor: {
    label: "Mentor",
    color: "primary",
    icon: <MentorIcon fontSize="small" />,
  },
  candidate: {
    label: "Candidate",
    color: "success",
    icon: <CandidateIcon fontSize="small" />,
  },
};

export function TeamMembers() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { currentTeam, isAdmin, refreshTeam } = useTeam();

  // Search and filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<TeamRole | "all">("all");

  // Member action menu state
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [selectedMember, setSelectedMember] =
    useState<TeamMemberWithProfile | null>(null);

  // UI state
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Mentor assignment dialog state
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [assigningMentor, setAssigningMentor] = useState(false);
  const [selectedMentorId, setSelectedMentorId] = useState<string>("");

  // Get list of mentors for assignment dropdown
  const mentors = useMemo(() => {
    if (!currentTeam?.members) return [];
    return currentTeam.members.filter(
      (m) => m.role === "mentor" || m.role === "admin"
    );
  }, [currentTeam?.members]);

  // Filter members based on search and role
  const filteredMembers = useMemo(() => {
    if (!currentTeam?.members) return [];

    return currentTeam.members.filter((member) => {
      // Role filter
      if (roleFilter !== "all" && member.role !== roleFilter) {
        return false;
      }

      // Search filter - match name or email
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const name = (
          member.profile?.full_name ||
          `${member.profile?.first_name || ""} ${
            member.profile?.last_name || ""
          }`
        ).toLowerCase();
        const email = (member.profile?.email || "").toLowerCase();

        return name.includes(query) || email.includes(query);
      }

      return true;
    });
  }, [currentTeam?.members, searchQuery, roleFilter]);

  // Handle opening member action menu
  const handleOpenMenu = (
    event: React.MouseEvent<HTMLElement>,
    member: TeamMemberWithProfile
  ) => {
    setMenuAnchor(event.currentTarget);
    setSelectedMember(member);
  };

  // Handle closing member action menu
  const handleCloseMenu = () => {
    setMenuAnchor(null);
    setSelectedMember(null);
  };

  // Handle removing a member from the team
  const handleRemoveMember = async () => {
    if (!user || !currentTeam || !selectedMember) return;

    setActionLoading(true);
    setError(null);
    handleCloseMenu();

    const result = await teamService.removeMember(user.id, selectedMember.id);

    setActionLoading(false);

    if (result.error) {
      setError(result.error.message);
    } else {
      setSuccess(`Removed ${getDisplayName(selectedMember)} from the team`);
      refreshTeam();
      // Clear success after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    }
  };

  // Handle changing a member's role
  const handleChangeRole = async (newRole: TeamRole) => {
    if (!user || !currentTeam || !selectedMember) return;

    setActionLoading(true);
    setError(null);
    handleCloseMenu();

    const result = await teamService.updateMemberRole(
      user.id,
      selectedMember.id,
      { role: newRole }
    );

    setActionLoading(false);

    if (result.error) {
      setError(result.error.message);
    } else {
      setSuccess(
        `Changed ${getDisplayName(selectedMember)}'s role to ${
          roleConfig[newRole].label
        }`
      );
      refreshTeam();
      setTimeout(() => setSuccess(null), 3000);
    }
  };

  // Get display name from member profile
  const getDisplayName = (member: TeamMemberWithProfile): string => {
    return (
      member.profile?.full_name ||
      `${member.profile?.first_name || ""} ${
        member.profile?.last_name || ""
      }`.trim() ||
      "Unknown User"
    );
  };

  // Get initials for avatar
  const getInitials = (member: TeamMemberWithProfile): string => {
    const name = getDisplayName(member);
    if (name === "Unknown User") return "?";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  // Open mentor assignment dialog for a candidate
  const handleOpenAssignDialog = () => {
    setSelectedMentorId("");
    setAssignDialogOpen(true);
    // Close the menu but DON'T clear selectedMember - we still need it for the dialog
    setMenuAnchor(null);
  };

  // Handle assigning a mentor to the selected candidate
  const handleAssignMentor = async () => {
    if (!user || !currentTeam || !selectedMember || !selectedMentorId) return;

    setAssigningMentor(true);
    setError(null);

    const result = await teamService.assignMentor(user.id, currentTeam.id, {
      mentor_id: selectedMentorId,
      candidate_id: selectedMember.user_id,
    });

    setAssigningMentor(false);

    if (result.error) {
      setError(result.error.message);
    } else {
      const mentorName =
        mentors.find((m) => m.user_id === selectedMentorId)?.profile
          ?.full_name || "Mentor";
      setSuccess(
        `Assigned ${mentorName} as mentor for ${getDisplayName(selectedMember)}`
      );
      setAssignDialogOpen(false);
      setSelectedMember(null);
      setTimeout(() => setSuccess(null), 3000);
    }
  };

  // No team selected
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

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Stack spacing={3}>
        {/* Header */}
        <Stack direction="row" alignItems="center" spacing={2}>
          <IconButton
            onClick={() => navigate("/team")}
            aria-label="Back to dashboard"
          >
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h4" component="h1">
            Team Members
          </Typography>
          <Chip
            label={`${currentTeam.members.length} total`}
            size="small"
            color="primary"
            variant="outlined"
          />
        </Stack>

        {/* Alerts */}
        {error && (
          <Alert severity="error" onClose={() => setError(null)}>
            {error}
          </Alert>
        )}
        {success && (
          <Alert severity="success" onClose={() => setSuccess(null)}>
            {success}
          </Alert>
        )}

        {/* Search and Filter */}
        <Paper sx={{ p: 2 }}>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
            <TextField
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              size="small"
              fullWidth
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>Role</InputLabel>
              <Select
                value={roleFilter}
                label="Role"
                onChange={(e: SelectChangeEvent) =>
                  setRoleFilter(e.target.value as TeamRole | "all")
                }
              >
                <MenuItem value="all">All Roles</MenuItem>
                <MenuItem value="admin">Admins</MenuItem>
                <MenuItem value="mentor">Mentors</MenuItem>
                <MenuItem value="candidate">Candidates</MenuItem>
              </Select>
            </FormControl>
          </Stack>
        </Paper>

        {/* Members List */}
        <Paper>
          {filteredMembers.length === 0 ? (
            <Box sx={{ p: 4, textAlign: "center" }}>
              <Typography color="text.secondary">
                {searchQuery || roleFilter !== "all"
                  ? "No members match your search criteria"
                  : "No members in this team yet"}
              </Typography>
            </Box>
          ) : (
            <List>
              {filteredMembers.map((member, index) => {
                const displayName = getDisplayName(member);
                const initials = getInitials(member);
                const role = roleConfig[member.role];
                const isCurrentUser = member.user_id === user?.id;
                const isOwner = member.user_id === currentTeam.owner_id;

                return (
                  <Box key={member.id}>
                    {index > 0 && <Divider />}
                    <ListItem
                      secondaryAction={
                        // Show menu for admins, but not for themselves or the owner
                        isAdmin && !isCurrentUser && !isOwner ? (
                          <IconButton
                            onClick={(e) => handleOpenMenu(e, member)}
                            disabled={actionLoading}
                            aria-label="Member actions"
                          >
                            <MoreVertIcon />
                          </IconButton>
                        ) : null
                      }
                    >
                      <ListItemAvatar>
                        <Avatar>{initials}</Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Stack
                            direction="row"
                            spacing={1}
                            alignItems="center"
                          >
                            <Typography variant="subtitle1">
                              {displayName}
                            </Typography>
                            <Chip
                              icon={role.icon}
                              label={role.label}
                              size="small"
                              color={role.color}
                              variant="outlined"
                            />
                            {isOwner && (
                              <Chip
                                label="Owner"
                                size="small"
                                color="warning"
                                variant="filled"
                              />
                            )}
                            {isCurrentUser && (
                              <Chip
                                label="You"
                                size="small"
                                variant="outlined"
                              />
                            )}
                          </Stack>
                        }
                        secondary={
                          <Stack spacing={0.5} sx={{ mt: 0.5 }}>
                            <Typography variant="body2" color="text.secondary">
                              {member.profile?.email || "No email"}
                            </Typography>
                            {member.profile?.professional_title && (
                              <Typography
                                variant="body2"
                                color="text.secondary"
                              >
                                {member.profile.professional_title}
                              </Typography>
                            )}
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              Joined{" "}
                              {new Date(member.joined_at).toLocaleDateString()}
                            </Typography>
                          </Stack>
                        }
                      />
                    </ListItem>
                  </Box>
                );
              })}
            </List>
          )}
        </Paper>

        {/* Role Summary */}
        <Paper sx={{ p: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            Role Summary
          </Typography>
          <Stack direction="row" spacing={2} flexWrap="wrap">
            <Chip
              icon={<AdminIcon />}
              label={`${
                currentTeam.members.filter((m) => m.role === "admin").length
              } Admins`}
              color="error"
              variant="outlined"
            />
            <Chip
              icon={<MentorIcon />}
              label={`${
                currentTeam.members.filter((m) => m.role === "mentor").length
              } Mentors`}
              color="primary"
              variant="outlined"
            />
            <Chip
              icon={<CandidateIcon />}
              label={`${
                currentTeam.members.filter((m) => m.role === "candidate").length
              } Candidates`}
              color="success"
              variant="outlined"
            />
          </Stack>
        </Paper>
      </Stack>

      {/* Member Action Menu */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={handleCloseMenu}
      >
        {/* Mentor assignment option - only for candidates */}
        {selectedMember?.role === "candidate" && mentors.length > 0 && (
          <>
            <MenuItem onClick={handleOpenAssignDialog}>
              <LinkIcon sx={{ mr: 1 }} fontSize="small" />
              Assign Mentor
            </MenuItem>
            <Divider />
          </>
        )}
        <MenuItem disabled>
          <Typography variant="caption" color="text.secondary">
            Change Role
          </Typography>
        </MenuItem>
        {selectedMember?.role !== "admin" && (
          <MenuItem onClick={() => handleChangeRole("admin")}>
            <AdminIcon sx={{ mr: 1 }} fontSize="small" />
            Make Admin
          </MenuItem>
        )}
        {selectedMember?.role !== "mentor" && (
          <MenuItem onClick={() => handleChangeRole("mentor")}>
            <MentorIcon sx={{ mr: 1 }} fontSize="small" />
            Make Mentor
          </MenuItem>
        )}
        {selectedMember?.role !== "candidate" && (
          <MenuItem onClick={() => handleChangeRole("candidate")}>
            <CandidateIcon sx={{ mr: 1 }} fontSize="small" />
            Make Candidate
          </MenuItem>
        )}
        <Divider />
        <MenuItem onClick={handleRemoveMember} sx={{ color: "error.main" }}>
          <PersonRemoveIcon sx={{ mr: 1 }} fontSize="small" />
          Remove from Team
        </MenuItem>
      </Menu>

      {/* Mentor Assignment Dialog */}
      <Dialog
        open={assignDialogOpen}
        onClose={() => setAssignDialogOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>
          Assign Mentor to{" "}
          {selectedMember ? getDisplayName(selectedMember) : "Candidate"}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Select a mentor to assign to this candidate. The mentor will be
              able to view the candidate's progress and provide coaching.
            </Typography>
            <FormControl fullWidth>
              <InputLabel>Select Mentor</InputLabel>
              <Select
                value={selectedMentorId}
                label="Select Mentor"
                onChange={(e) => setSelectedMentorId(e.target.value)}
              >
                {mentors.map((mentor) => (
                  <MenuItem key={mentor.user_id} value={mentor.user_id}>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <Avatar sx={{ width: 24, height: 24, fontSize: 12 }}>
                        {getInitials(mentor)}
                      </Avatar>
                      <span>
                        {mentor.profile?.full_name || "Unknown"}
                        {mentor.role === "admin" && " (Admin)"}
                      </span>
                    </Stack>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAssignDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleAssignMentor}
            disabled={!selectedMentorId || assigningMentor}
            startIcon={assigningMentor ? <CircularProgress size={16} /> : null}
          >
            {assigningMentor ? "Assigning..." : "Assign Mentor"}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
