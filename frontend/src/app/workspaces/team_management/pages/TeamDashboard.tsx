/**
 * TEAM DASHBOARD PAGE
 *
 * Purpose:
 * - Central hub for team overview and management
 * - Shows current team info, members, subscription status
 * - Quick access to team actions (invite, settings, switch teams)
 *
 * Flow:
 * 1. Check if user has team via TeamContext
 * 2. If no team → show create team prompt
 * 3. If has team → show dashboard with:
 *    - Team header with name and team switcher
 *    - Team progress insights (applications, interviews, offers)
 *    - Member list with roles
 *    - Subscription status
 *    - Quick action buttons
 *
 * Usage:
 *   Route: /team or /team/dashboard
 *   Access: All authenticated users
 *   Requires: User must have/create a team
 */

import { useState, useEffect } from "react";
import {
  Container,
  Stack,
  Typography,
  Button,
  Paper,
  Box,
  Card,
  CardContent,
  CardActions,
  Chip,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Divider,
  Alert,
  CircularProgress,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  type SelectChangeEvent,
} from "@mui/material";
import {
  Add as AddIcon,
  Settings as SettingsIcon,
  People as PeopleIcon,
  Business as BusinessIcon,
  Verified as VerifiedIcon,
  TrendingUp as TrendingUpIcon,
  Assignment as AssignmentIcon,
  EmojiEvents as EmojiEventsIcon,
  School as SchoolIcon,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { useTeam } from "@shared/context/useTeam";
import { useAuth } from "@shared/context/AuthContext";
import { CreateTeamDialog, InviteMemberDialog } from "../components";
import * as teamService from "../services/teamService";
import type { TeamMemberWithProfile } from "../types";

export function TeamDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    currentTeam,
    userTeams,
    userRole,
    isAdmin,
    isMentor,
    loading,
    error,
    switchTeam,
  } = useTeam();

  const [switching, setSwitching] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [insights, setInsights] = useState<{
    totalMembers: number;
    totalApplications: number;
    totalInterviews: number;
    totalOffers: number;
    memberActivity: Array<{
      userId: string;
      name: string;
      applications: number;
      interviews: number;
      offers: number;
    }>;
  } | null>(null);
  const [loadingInsights, setLoadingInsights] = useState(false);

  /**
   * Load team insights when team changes
   */
  useEffect(() => {
    async function loadInsights() {
      if (!user || !currentTeam) {
        setInsights(null);
        return;
      }

      setLoadingInsights(true);
      const result = await teamService.getTeamInsights(user.id, currentTeam.id);
      if (result.data) {
        setInsights(result.data);
      }
      setLoadingInsights(false);
    }

    loadInsights();
  }, [user, currentTeam]);

  /**
   * Handle team switcher dropdown change
   * Switches to selected team and updates localStorage
   */
  const handleTeamChange = async (event: SelectChangeEvent<string>) => {
    const newTeamId = event.target.value;
    if (newTeamId === currentTeam?.id) return;

    setSwitching(true);
    await switchTeam(newTeamId);
    setSwitching(false);
  };

  // Loading state while fetching teams
  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Stack spacing={3} alignItems="center">
          <CircularProgress />
          <Typography color="text.secondary">Loading team...</Typography>
        </Stack>
      </Container>
    );
  }

  // Error state
  if (error) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
        <Button onClick={() => window.location.reload()}>Retry</Button>
      </Container>
    );
  }

  // No team state - show create team prompt
  if (!currentTeam) {
    return (
      <Container maxWidth="md" sx={{ py: 8 }}>
        <Card>
          <CardContent sx={{ textAlign: "center", py: 6 }}>
            <BusinessIcon sx={{ fontSize: 64, color: "primary.main", mb: 2 }} />
            <Typography variant="h4" gutterBottom>
              Welcome to Team Management
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
              You're not part of any team yet. Create your first team to start
              collaborating with mentors and candidates.
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
              Teams allow coaches to manage candidates, mentors to provide
              guidance, and candidates to track their progress together.
            </Typography>
          </CardContent>
          <CardActions sx={{ justifyContent: "center", pb: 4 }}>
            <Button
              variant="contained"
              size="large"
              startIcon={<AddIcon />}
              onClick={() => setShowCreateDialog(true)}
            >
              Create Your Team
            </Button>
            <Button
              variant="outlined"
              size="large"
              onClick={() => navigate("/team/invitations")}
            >
              View Invitations
            </Button>
          </CardActions>
        </Card>

        {/* Create Team Dialog */}
        <CreateTeamDialog
          open={showCreateDialog}
          onClose={() => setShowCreateDialog(false)}
        />
      </Container>
    );
  }

  // Get subscription tier (default to free if no subscription)
  const subscriptionTier = "Free"; // TODO: Get from currentTeam.subscription when available

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Stack spacing={4}>
        {/* Header: Team Name and Switcher */}
        <Paper sx={{ p: 3 }}>
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            flexWrap="wrap"
            gap={2}
          >
            <Stack direction="row" alignItems="center" spacing={2} flex={1}>
              <BusinessIcon sx={{ fontSize: 40, color: "primary.main" }} />
              <Box>
                <Typography variant="h4">{currentTeam.name}</Typography>
                <Stack direction="row" spacing={1} alignItems="center" mt={0.5}>
                  <Chip
                    label={userRole || "Member"}
                    size="small"
                    color={isAdmin ? "primary" : "default"}
                  />
                  <Chip
                    label={subscriptionTier}
                    size="small"
                    icon={<VerifiedIcon />}
                    variant="outlined"
                  />
                </Stack>
              </Box>
            </Stack>

            {/* Team Switcher */}
            {userTeams.length > 1 && (
              <FormControl sx={{ minWidth: 200 }} size="small">
                <InputLabel>Switch Team</InputLabel>
                <Select
                  value={currentTeam.id}
                  label="Switch Team"
                  onChange={handleTeamChange}
                  disabled={switching}
                >
                  {userTeams.map(
                    (team: {
                      team_id: string;
                      team_name: string;
                      role: string;
                    }) => (
                      <MenuItem key={team.team_id} value={team.team_id}>
                        {team.team_name}
                        <Chip label={team.role} size="small" sx={{ ml: 1 }} />
                      </MenuItem>
                    )
                  )}
                </Select>
              </FormControl>
            )}

            {/* Settings Button (Admin Only) */}
            {isAdmin && (
              <Button
                variant="outlined"
                startIcon={<SettingsIcon />}
                onClick={() => navigate("/team/settings")}
              >
                Settings
              </Button>
            )}
          </Stack>
        </Paper>

        {/* Team Progress Insights */}
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Team Progress Insights
          </Typography>
          {loadingInsights ? (
            <Box display="flex" justifyContent="center" py={4}>
              <CircularProgress />
            </Box>
          ) : insights ? (
            <Stack direction="row" spacing={2} flexWrap="wrap">
              <Card variant="outlined" sx={{ flex: "1 1 200px" }}>
                <CardContent>
                  <Stack direction="row" alignItems="center" spacing={1} mb={1}>
                    <PeopleIcon color="primary" />
                    <Typography variant="body2" color="text.secondary">
                      Team Members
                    </Typography>
                  </Stack>
                  <Typography variant="h4">{insights.totalMembers}</Typography>
                </CardContent>
              </Card>
              <Card variant="outlined" sx={{ flex: "1 1 200px" }}>
                <CardContent>
                  <Stack direction="row" alignItems="center" spacing={1} mb={1}>
                    <AssignmentIcon color="info" />
                    <Typography variant="body2" color="text.secondary">
                      Applications
                    </Typography>
                  </Stack>
                  <Typography variant="h4">
                    {insights.totalApplications}
                  </Typography>
                </CardContent>
              </Card>
              <Card variant="outlined" sx={{ flex: "1 1 200px" }}>
                <CardContent>
                  <Stack direction="row" alignItems="center" spacing={1} mb={1}>
                    <TrendingUpIcon color="warning" />
                    <Typography variant="body2" color="text.secondary">
                      Interviews
                    </Typography>
                  </Stack>
                  <Typography variant="h4">
                    {insights.totalInterviews}
                  </Typography>
                </CardContent>
              </Card>
              <Card variant="outlined" sx={{ flex: "1 1 200px" }}>
                <CardContent>
                  <Stack direction="row" alignItems="center" spacing={1} mb={1}>
                    <EmojiEventsIcon color="success" />
                    <Typography variant="body2" color="text.secondary">
                      Offers
                    </Typography>
                  </Stack>
                  <Typography variant="h4">{insights.totalOffers}</Typography>
                </CardContent>
              </Card>
            </Stack>
          ) : (
            <Typography color="text.secondary">
              No insights available
            </Typography>
          )}
        </Paper>

        {/* Quick Actions */}
        <Stack direction="row" spacing={2} flexWrap="wrap">
          {isAdmin && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setShowInviteDialog(true)}
            >
              Invite Member
            </Button>
          )}
          {(isMentor || isAdmin) && (
            <Button
              variant="contained"
              color="secondary"
              startIcon={<SchoolIcon />}
              onClick={() => navigate("/team/mentor")}
            >
              Mentor Dashboard
            </Button>
          )}
          <Button
            variant="outlined"
            startIcon={<PeopleIcon />}
            onClick={() => navigate("/team/members")}
          >
            View All Members ({currentTeam.members.length})
          </Button>
        </Stack>

        {/* Team Members Preview */}
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Team Members
          </Typography>
          <List>
            {currentTeam.members
              .slice(0, 5)
              .map((member: TeamMemberWithProfile, index: number) => (
                <div key={member.id}>
                  {index > 0 && <Divider />}
                  <ListItem>
                    <ListItemAvatar>
                      <Avatar alt={member.profile?.full_name || "User"}>
                        {(
                          member.profile?.full_name?.[0] ||
                          member.profile?.first_name?.[0] ||
                          "U"
                        ).toUpperCase()}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        member.profile?.full_name ||
                        `${member.profile?.first_name || ""} ${
                          member.profile?.last_name || ""
                        }`.trim() ||
                        "Unknown User"
                      }
                      secondary={
                        <Box
                          component="span"
                          sx={{ display: "flex", alignItems: "center", gap: 1 }}
                        >
                          <Chip
                            label={member.role}
                            size="small"
                            component="span"
                          />
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            component="span"
                          >
                            {member.profile?.email}
                          </Typography>
                        </Box>
                      }
                      secondaryTypographyProps={{ component: "div" }}
                    />
                  </ListItem>
                </div>
              ))}
          </List>
          {currentTeam.members.length > 5 && (
            <Box sx={{ textAlign: "center", mt: 2 }}>
              <Button onClick={() => navigate("/team/members")}>
                View All {currentTeam.members.length} Members
              </Button>
            </Box>
          )}
        </Paper>

        {/* Subscription Status */}
        <Paper sx={{ p: 3 }}>
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
          >
            <Box>
              <Typography variant="h6" gutterBottom>
                Subscription: {subscriptionTier} Plan
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {currentTeam.members.length} / 5 members
              </Typography>
            </Box>
            {isAdmin && (
              <Button
                variant="outlined"
                onClick={() => navigate("/team/subscription")}
              >
                Upgrade Plan
              </Button>
            )}
          </Stack>
        </Paper>

        {/* Coming Soon: Activity Feed */}
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Recent Activity
          </Typography>
          <Alert severity="info">
            Activity feed coming soon! You'll see member joins, role changes,
            and mentor assignments here.
          </Alert>
        </Paper>
      </Stack>

      {/* Dialogs */}
      <InviteMemberDialog
        open={showInviteDialog}
        onClose={() => setShowInviteDialog(false)}
      />
    </Container>
  );
}
