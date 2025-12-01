/**
 * CANDIDATE PROGRESS PAGE (UC-111)
 *
 * Purpose:
 * - Main dashboard for candidates to view and manage their progress sharing
 * - Display progress reports, visualizations, and achievements
 * - Configure privacy settings for what to share with team
 * - Manage accountability partnerships
 *
 * Sections:
 * 1. Progress Overview - Current stats and trends
 * 2. Progress Visualization - Charts and graphs
 * 3. Achievements - Recent milestones and celebrations
 * 4. Accountability Partners - Partner list and management
 * 5. Sharing Settings - Privacy configuration
 *
 * Access: /team/progress route
 */

import { useState, useEffect, useCallback } from "react";
import {
  Box,
  Stack,
  Typography,
  Paper,
  Grid,
  Button,
  IconButton,
  Tabs,
  Tab,
  Alert,
  Skeleton,
  Drawer,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import {
  Assessment as AssessmentIcon,
  Timeline as TimelineIcon,
  EmojiEvents as TrophyIcon,
  People as PeopleIcon,
  Settings as SettingsIcon,
  Refresh as RefreshIcon,
  Add as AddIcon,
  Share as ShareIcon,
} from "@mui/icons-material";
import { useAuth } from "@shared/context/AuthContext";
import { useTeam } from "@shared/context/useTeam";
import * as progressService from "../services/progressSharingService";
import type {
  ProgressSnapshot,
  ProgressSharingSettings,
  AccountabilityPartnership,
  AchievementCelebration,
} from "../services/progressSharingService";

// Import components
import { ProgressReportCard } from "../components/ProgressReportCard";
import { ProgressVisualization } from "../components/ProgressVisualization";
import {
  AchievementCelebration as AchievementCard,
  AchievementList,
} from "../components/AchievementCelebration";
import { AccountabilityPartnerCard } from "../components/AccountabilityPartnerCard";
import { ProgressSharingSettings as SettingsComponent } from "../components/ProgressSharingSettings";

// ============================================================================
// TYPES
// ============================================================================

type TabValue =
  | "overview"
  | "charts"
  | "achievements"
  | "partners"
  | "settings";

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function CandidateProgressPage() {
  const { user } = useAuth();
  const { currentTeam } = useTeam();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  // Tab state
  const [activeTab, setActiveTab] = useState<TabValue>("overview");

  // Data state
  const [snapshots, setSnapshots] = useState<ProgressSnapshot[]>([]);
  const [latestSnapshot, setLatestSnapshot] = useState<ProgressSnapshot | null>(
    null
  );
  const [settings, setSettings] = useState<ProgressSharingSettings | null>(
    null
  );
  const [partnerships, setPartnerships] = useState<AccountabilityPartnership[]>(
    []
  );
  const [pendingCelebration, setPendingCelebration] =
    useState<AchievementCelebration | null>(null);

  // Loading state
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Settings drawer state (for mobile)
  const [settingsDrawerOpen, setSettingsDrawerOpen] = useState(false);

  // Load all data function
  const loadAllData = useCallback(async () => {
    if (!user?.id || !currentTeam?.id) return;

    setLoading(true);
    setError(null);

    try {
      // Load snapshots with options object
      const snapshotsResult = await progressService.getProgressSnapshots(
        user.id,
        currentTeam.id,
        { limit: 12 } // Last 12 snapshots
      );
      if (snapshotsResult.data) {
        setSnapshots(snapshotsResult.data);
        if (snapshotsResult.data.length > 0) {
          setLatestSnapshot(snapshotsResult.data[0]);
        }
      }

      // Load settings
      const settingsResult = await progressService.getProgressSharingSettings(
        user.id,
        currentTeam.id
      );
      if (settingsResult.data) {
        setSettings(settingsResult.data);
      }

      // Load partnerships
      const partnershipsResult = await progressService.getActivePartnerships(
        user.id,
        currentTeam.id
      );
      if (partnershipsResult.data) {
        setPartnerships(partnershipsResult.data);
      }

      // Check for pending achievements to celebrate
      const achievementsResult = await progressService.getAchievements(
        user.id,
        currentTeam.id,
        { limit: 1 } // Just get latest
      );
      if (achievementsResult.data && achievementsResult.data.length > 0) {
        setPendingCelebration(achievementsResult.data[0]);
      }
    } catch (err) {
      setError("Failed to load progress data. Please try again.");
      console.error("Error loading progress data:", err);
    } finally {
      setLoading(false);
    }
  }, [user?.id, currentTeam?.id]);

  // Load all data on mount
  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  // Refresh data
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadAllData();
    setRefreshing(false);
  }, [loadAllData]);

  // Handle tab change
  const handleTabChange = (
    _event: React.SyntheticEvent,
    newValue: TabValue
  ) => {
    setActiveTab(newValue);
  };

  // Handle settings update
  const handleSettingsChange = useCallback(
    (updatedSettings: ProgressSharingSettings) => {
      setSettings(updatedSettings);
    },
    []
  );

  // Handle partnership update
  const handlePartnershipUpdate = useCallback(
    (updatedPartnership: AccountabilityPartnership) => {
      setPartnerships((prev) =>
        prev.map((p) =>
          p.id === updatedPartnership.id ? updatedPartnership : p
        )
      );
    },
    []
  );

  // Handle celebration acknowledgement
  const handleAcknowledgeCelebration = useCallback(async () => {
    if (!pendingCelebration) return;

    await progressService.dismissCelebration(pendingCelebration.id);
    setPendingCelebration(null);
  }, [pendingCelebration]);

  // Create manual snapshot
  // Create manual snapshot - uses weekly period type
  const handleCreateSnapshot = useCallback(async () => {
    if (!user?.id || !currentTeam?.id) return;

    setRefreshing(true);
    const result = await progressService.createProgressSnapshot(
      user.id,
      currentTeam.id,
      "weekly" // Use weekly period type for manual snapshots
    );

    if (result.data) {
      // Reload snapshots since createProgressSnapshot returns snapshot ID
      await loadAllData();
    }

    setRefreshing(false);
  }, [user?.id, currentTeam?.id, loadAllData]);

  // Render loading state
  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Stack spacing={3}>
          <Skeleton variant="rectangular" height={60} />
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, md: 8 }}>
              <Skeleton variant="rectangular" height={300} />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <Skeleton variant="rectangular" height={300} />
            </Grid>
          </Grid>
          <Skeleton variant="rectangular" height={400} />
        </Stack>
      </Box>
    );
  }

  // Render no team state
  if (!currentTeam) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="info">
          Please join or create a team to access progress sharing features.
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <Stack spacing={3}>
        {/* Pending celebration modal */}
        {pendingCelebration && (
          <AchievementCard
            celebration={pendingCelebration}
            isOwnAchievement
            showConfetti
            onAcknowledge={handleAcknowledgeCelebration}
          />
        )}

        {/* Page header */}
        <Stack
          direction={{ xs: "column", sm: "row" }}
          justifyContent="space-between"
          alignItems={{ xs: "stretch", sm: "center" }}
          spacing={2}
        >
          <Box>
            <Typography variant="h4" fontWeight="bold">
              My Progress
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Track your job search journey and share with your team
            </Typography>
          </Box>

          <Stack direction="row" spacing={1}>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={handleRefresh}
              disabled={refreshing}
            >
              {refreshing ? "Refreshing..." : "Refresh"}
            </Button>
            <Button
              variant="contained"
              startIcon={<AssessmentIcon />}
              onClick={handleCreateSnapshot}
              disabled={refreshing}
            >
              Generate Snapshot
            </Button>
            {isMobile && (
              <IconButton onClick={() => setSettingsDrawerOpen(true)}>
                <SettingsIcon />
              </IconButton>
            )}
          </Stack>
        </Stack>

        {/* Error alert */}
        {error && (
          <Alert severity="error" onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Tabs navigation */}
        <Paper sx={{ px: 2 }}>
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            variant={isMobile ? "scrollable" : "standard"}
            scrollButtons="auto"
          >
            <Tab
              value="overview"
              icon={<AssessmentIcon />}
              iconPosition="start"
              label="Overview"
            />
            <Tab
              value="charts"
              icon={<TimelineIcon />}
              iconPosition="start"
              label="Charts"
            />
            <Tab
              value="achievements"
              icon={<TrophyIcon />}
              iconPosition="start"
              label="Achievements"
            />
            <Tab
              value="partners"
              icon={<PeopleIcon />}
              iconPosition="start"
              label="Partners"
            />
            {!isMobile && (
              <Tab
                value="settings"
                icon={<SettingsIcon />}
                iconPosition="start"
                label="Settings"
              />
            )}
          </Tabs>
        </Paper>

        {/* Tab content */}
        <Box>
          {/* Overview Tab */}
          {activeTab === "overview" && (
            <Grid container spacing={3}>
              <Grid size={{ xs: 12, lg: 8 }}>
                <Stack spacing={3}>
                  {/* Progress Report Card */}
                  <ProgressReportCard
                    userId={user?.id}
                    teamId={currentTeam.id}
                    snapshot={latestSnapshot}
                    onRefresh={handleRefresh}
                  />

                  {/* Quick visualization */}
                  <ProgressVisualization
                    snapshots={snapshots}
                    compact
                    defaultChart="timeline"
                  />
                </Stack>
              </Grid>

              <Grid size={{ xs: 12, lg: 4 }}>
                <Stack spacing={3}>
                  {/* Sharing status */}
                  {settings && (
                    <Paper sx={{ p: 2 }}>
                      <Stack
                        direction="row"
                        alignItems="center"
                        justifyContent="space-between"
                        sx={{ mb: 2 }}
                      >
                        <Typography variant="h6">Sharing Status</Typography>
                        <ShareIcon color="primary" />
                      </Stack>
                      <Stack spacing={1}>
                        <Typography variant="body2">
                          <strong>Visibility:</strong>{" "}
                          {settings.visibility === "private"
                            ? "Private"
                            : settings.visibility === "mentors_only"
                            ? "Mentors Only"
                            : settings.visibility === "accountability"
                            ? "Accountability Partners"
                            : settings.visibility === "team"
                            ? "Team Members"
                            : "Public"}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {settings.shareApplications && "Applications • "}
                          {settings.shareInterviews && "Interviews • "}
                          {settings.shareGoals && "Goals"}
                        </Typography>
                      </Stack>
                      <Button
                        fullWidth
                        variant="outlined"
                        sx={{ mt: 2 }}
                        onClick={() =>
                          isMobile
                            ? setSettingsDrawerOpen(true)
                            : setActiveTab("settings")
                        }
                      >
                        Edit Settings
                      </Button>
                    </Paper>
                  )}

                  {/* Active partners */}
                  <Paper sx={{ p: 2 }}>
                    <Stack
                      direction="row"
                      alignItems="center"
                      justifyContent="space-between"
                      sx={{ mb: 2 }}
                    >
                      <Typography variant="h6">
                        Accountability Partners
                      </Typography>
                      <Button size="small" startIcon={<AddIcon />}>
                        Add
                      </Button>
                    </Stack>
                    {partnerships.length === 0 ? (
                      <Typography variant="body2" color="text.secondary">
                        No active partnerships yet. Add a partner to stay
                        accountable!
                      </Typography>
                    ) : (
                      <Stack spacing={2}>
                        {partnerships.slice(0, 3).map((partnership) => (
                          <AccountabilityPartnerCard
                            key={partnership.id}
                            partnership={partnership}
                            compact
                            onPartnershipUpdate={handlePartnershipUpdate}
                          />
                        ))}
                        {partnerships.length > 3 && (
                          <Button
                            size="small"
                            onClick={() => setActiveTab("partners")}
                          >
                            View all ({partnerships.length})
                          </Button>
                        )}
                      </Stack>
                    )}
                  </Paper>
                </Stack>
              </Grid>
            </Grid>
          )}

          {/* Charts Tab */}
          {activeTab === "charts" && (
            <ProgressVisualization snapshots={snapshots} loading={refreshing} />
          )}

          {/* Achievements Tab */}
          {activeTab === "achievements" && (
            <Box>
              <AchievementList teamId={currentTeam.id} showOwnOnly />
            </Box>
          )}

          {/* Partners Tab */}
          {activeTab === "partners" && (
            <Stack spacing={3}>
              <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="center"
              >
                <Typography variant="h6">
                  Accountability Partners ({partnerships.length})
                </Typography>
                <Button variant="contained" startIcon={<AddIcon />}>
                  Add Partner
                </Button>
              </Stack>

              {partnerships.length === 0 ? (
                <Paper sx={{ p: 4, textAlign: "center" }}>
                  <PeopleIcon
                    sx={{ fontSize: 48, color: "text.disabled", mb: 2 }}
                  />
                  <Typography variant="h6" gutterBottom>
                    No Accountability Partners Yet
                  </Typography>
                  <Typography color="text.secondary" sx={{ mb: 2 }}>
                    Accountability partners help keep you motivated and on track
                    with your job search goals.
                  </Typography>
                  <Button variant="contained" startIcon={<AddIcon />}>
                    Find a Partner
                  </Button>
                </Paper>
              ) : (
                <Grid container spacing={2}>
                  {partnerships.map((partnership) => (
                    <Grid size={{ xs: 12, md: 6 }} key={partnership.id}>
                      <AccountabilityPartnerCard
                        partnership={partnership}
                        onPartnershipUpdate={handlePartnershipUpdate}
                      />
                    </Grid>
                  ))}
                </Grid>
              )}
            </Stack>
          )}

          {/* Settings Tab */}
          {activeTab === "settings" && (
            <SettingsComponent onSettingsChange={handleSettingsChange} />
          )}
        </Box>
      </Stack>

      {/* Mobile settings drawer */}
      <Drawer
        anchor="right"
        open={settingsDrawerOpen}
        onClose={() => setSettingsDrawerOpen(false)}
        PaperProps={{ sx: { width: "100%", maxWidth: 400 } }}
      >
        <Box sx={{ p: 2 }}>
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
            sx={{ mb: 2 }}
          >
            <Typography variant="h6">Sharing Settings</Typography>
            <IconButton onClick={() => setSettingsDrawerOpen(false)}>
              <SettingsIcon />
            </IconButton>
          </Stack>
          <SettingsComponent onSettingsChange={handleSettingsChange} compact />
        </Box>
      </Drawer>
    </Box>
  );
}

export default CandidateProgressPage;
