/**
 * PROGRESS SHARING PAGE (UC-111)
 *
 * Purpose:
 * - Main page for progress sharing and accountability features
 * - Configure privacy settings for progress sharing
 * - View and generate progress reports
 * - Track milestones and achievements
 * - Send and receive encouragements
 * - View accountability partner engagement
 *
 * Acceptance Criteria (UC-111):
 * - Configure privacy settings for progress sharing with selected team members
 * - Generate regular progress reports for mentors and accountability partners
 * - Include goal progress updates and milestone achievements
 * - Provide encouragement and celebration features for achievements
 * - Track accountability partner engagement and support effectiveness
 * - Include motivation tools and progress visualization for shared viewing
 * - Generate insights on accountability impact on job search success
 * - Provide team communication tools for progress discussions
 */

import { useState, useEffect } from "react";
import {
  Container,
  Stack,
  Typography,
  Paper,
  Box,
  Tabs,
  Tab,
  Button,
  IconButton,
  Alert,
  CircularProgress,
  Grid,
  Card,
  CardContent,
  Chip,
  Avatar,
  LinearProgress,
  Tooltip,
  Divider,
} from "@mui/material";
import {
  Share as ShareIcon,
  EmojiEvents as TrophyIcon,
  Favorite as HeartIcon,
  Assessment as ReportIcon,
  People as PeopleIcon,
  ArrowBack as ArrowBackIcon,
  Refresh as RefreshIcon,
  TrendingUp as TrendingUpIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { useTeam } from "@shared/context/useTeam";
import { useAuth } from "@shared/context/AuthContext";
import ProgressSharingSettings from "../components/ProgressSharingSettings";
import MilestoneTracker from "../components/MilestoneTracker";
import EncouragementPanel from "../components/EncouragementPanel";
import * as progressService from "../services/progressSharingService";
import type {
  ProgressSummary,
  AccountabilityDashboard,
  ProgressReportRow,
} from "../types/progress.types";

// ============================================================================
// TYPES
// ============================================================================

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

// ============================================================================
// HELPER COMPONENTS
// ============================================================================

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`progress-tabpanel-${index}`}
      aria-labelledby={`progress-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

/**
 * Summary card for dashboard display
 */
function SummaryCard({
  title,
  value,
  subtitle,
  icon,
  color = "primary.main",
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  color?: string;
}) {
  return (
    <Card variant="outlined">
      <CardContent>
        <Stack direction="row" alignItems="center" spacing={1} mb={1}>
          <Box sx={{ color }}>{icon}</Box>
          <Typography variant="body2" color="text.secondary">
            {title}
          </Typography>
        </Stack>
        <Typography variant="h4">{value}</Typography>
        {subtitle && (
          <Typography variant="caption" color="text.secondary">
            {subtitle}
          </Typography>
        )}
      </CardContent>
    </Card>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function ProgressSharingPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { currentTeam, loading: teamLoading } = useTeam();

  // State
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<ProgressSummary | null>(null);
  const [dashboard, setDashboard] = useState<AccountabilityDashboard | null>(null);
  const [reports, setReports] = useState<ProgressReportRow[]>([]);
  const [generatingReport, setGeneratingReport] = useState(false);

  // Load data
  useEffect(() => {
    async function loadData() {
      if (!user || !currentTeam) return;

      setLoading(true);
      setError(null);

      try {
        // Load progress summary
        const summaryResult = await progressService.getProgressSummary(
          user.id,
          currentTeam.id
        );
        if (summaryResult.data) {
          setSummary(summaryResult.data);
        }

        // Load accountability dashboard
        const dashboardResult = await progressService.getAccountabilityDashboard(
          user.id,
          currentTeam.id
        );
        if (dashboardResult.data) {
          setDashboard(dashboardResult.data);
        }

        // Load recent reports
        const reportsResult = await progressService.getUserReports(
          user.id,
          currentTeam.id,
          5
        );
        if (reportsResult.data) {
          setReports(reportsResult.data);
        }
      } catch (err) {
        setError("Failed to load progress data");
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [user, currentTeam]);

  // Handle generate report
  const handleGenerateReport = async () => {
    if (!user || !currentTeam) return;

    setGeneratingReport(true);

    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 7); // Weekly report

    const result = await progressService.generateProgressReport(
      user.id,
      currentTeam.id,
      "weekly",
      startDate,
      endDate
    );

    if (result.data) {
      setReports((prev) => [result.data!, ...prev]);
    }

    setGeneratingReport(false);
  };

  // Handle refresh
  const handleRefresh = async () => {
    if (!user || !currentTeam) return;

    setLoading(true);

    const summaryResult = await progressService.getProgressSummary(
      user.id,
      currentTeam.id
    );
    if (summaryResult.data) {
      setSummary(summaryResult.data);
    }

    const dashboardResult = await progressService.getAccountabilityDashboard(
      user.id,
      currentTeam.id
    );
    if (dashboardResult.data) {
      setDashboard(dashboardResult.data);
    }

    setLoading(false);
  };

  // Loading state
  if (teamLoading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Stack spacing={3} alignItems="center">
          <CircularProgress />
          <Typography color="text.secondary">Loading...</Typography>
        </Stack>
      </Container>
    );
  }

  // No team selected
  if (!currentTeam) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="info">
          Please select or create a team to access Progress Sharing.
        </Alert>
        <Button
          variant="contained"
          sx={{ mt: 2 }}
          onClick={() => navigate("/team")}
        >
          Go to Team Dashboard
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Stack spacing={4}>
        {/* Header */}
        <Paper sx={{ p: 3 }}>
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            flexWrap="wrap"
            gap={2}
          >
            <Stack direction="row" alignItems="center" spacing={2}>
              <IconButton onClick={() => navigate("/team")}>
                <ArrowBackIcon />
              </IconButton>
              <Box>
                <Typography variant="h4">Progress Sharing</Typography>
                <Typography variant="body2" color="text.secondary">
                  Share your progress and stay accountable with your team
                </Typography>
              </Box>
            </Stack>
            <Stack direction="row" spacing={1}>
              <Tooltip title="Refresh data">
                <IconButton onClick={handleRefresh} disabled={loading}>
                  <RefreshIcon />
                </IconButton>
              </Tooltip>
            </Stack>
          </Stack>
        </Paper>

        {/* Error Alert */}
        {error && (
          <Alert severity="error" onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Summary Cards */}
        {summary && summary.sharing_enabled && (
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <SummaryCard
                title="Total Applications"
                value={summary.job_stats?.total || 0}
                subtitle={
                  summary.job_stats?.interviewing
                    ? `${summary.job_stats.interviewing} interviewing`
                    : undefined
                }
                icon={<TrendingUpIcon />}
                color="primary.main"
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <SummaryCard
                title="Milestones Achieved"
                value={summary.milestones_count}
                icon={<TrophyIcon />}
                color="warning.main"
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <SummaryCard
                title="Goals Completed"
                value={summary.goals_summary?.completed || 0}
                subtitle={
                  summary.goals_summary?.completion_rate
                    ? `${summary.goals_summary.completion_rate}% completion rate`
                    : undefined
                }
                icon={<CheckCircleIcon />}
                color="success.main"
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <SummaryCard
                title="Encouragements"
                value={dashboard?.total_encouragements_received || 0}
                subtitle={`${
                  dashboard?.total_encouragements_sent || 0
                } sent`}
                icon={<HeartIcon />}
                color="error.main"
              />
            </Grid>
          </Grid>
        )}

        {/* Sharing Disabled Warning */}
        {summary && !summary.sharing_enabled && (
          <Alert severity="warning">
            Progress sharing is currently disabled. Enable it in Settings to
            share your progress with your team.
          </Alert>
        )}

        {/* Main Content Tabs */}
        <Paper sx={{ p: 0 }}>
          <Tabs
            value={tabValue}
            onChange={(_, newValue) => setTabValue(newValue)}
            sx={{ borderBottom: 1, borderColor: "divider", px: 2 }}
          >
            <Tab icon={<TrophyIcon />} iconPosition="start" label="Milestones" />
            <Tab
              icon={<HeartIcon />}
              iconPosition="start"
              label="Encouragements"
            />
            <Tab icon={<ReportIcon />} iconPosition="start" label="Reports" />
            <Tab
              icon={<PeopleIcon />}
              iconPosition="start"
              label="Accountability"
            />
            <Tab icon={<ShareIcon />} iconPosition="start" label="Settings" />
          </Tabs>

          {/* Milestones Tab */}
          <TabPanel value={tabValue} index={0}>
            <Box sx={{ px: 2 }}>
              <MilestoneTracker
                showTeamMilestones={true}
                onMilestoneCreated={handleRefresh}
              />
            </Box>
          </TabPanel>

          {/* Encouragements Tab */}
          <TabPanel value={tabValue} index={1}>
            <Box sx={{ px: 2 }}>
              <EncouragementPanel onEncouragementSent={handleRefresh} />
            </Box>
          </TabPanel>

          {/* Reports Tab */}
          <TabPanel value={tabValue} index={2}>
            <Box sx={{ px: 2 }}>
              <Paper sx={{ p: 3 }}>
                <Stack spacing={3}>
                  <Stack
                    direction="row"
                    alignItems="center"
                    justifyContent="space-between"
                  >
                    <Stack direction="row" alignItems="center" spacing={2}>
                      <ReportIcon color="primary" />
                      <Box>
                        <Typography variant="h6">Progress Reports</Typography>
                        <Typography variant="body2" color="text.secondary">
                          Generate and share progress reports
                        </Typography>
                      </Box>
                    </Stack>
                    <Button
                      variant="contained"
                      onClick={handleGenerateReport}
                      disabled={generatingReport}
                      startIcon={<ReportIcon />}
                    >
                      {generatingReport ? "Generating..." : "Generate Weekly Report"}
                    </Button>
                  </Stack>

                  <Divider />

                  {reports.length === 0 ? (
                    <Box
                      sx={{
                        textAlign: "center",
                        py: 4,
                        bgcolor: "action.hover",
                        borderRadius: 1,
                      }}
                    >
                      <ReportIcon
                        sx={{ fontSize: 48, color: "text.disabled", mb: 1 }}
                      />
                      <Typography color="text.secondary">
                        No reports generated yet
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Generate a report to share your progress with your team.
                      </Typography>
                    </Box>
                  ) : (
                    <Stack spacing={2}>
                      {reports.map((report) => (
                        <Card key={report.id} variant="outlined">
                          <CardContent>
                            <Stack
                              direction="row"
                              alignItems="center"
                              justifyContent="space-between"
                            >
                              <Stack
                                direction="row"
                                alignItems="center"
                                spacing={2}
                              >
                                <Avatar sx={{ bgcolor: "primary.main" }}>
                                  <ReportIcon />
                                </Avatar>
                                <Box>
                                  <Typography variant="subtitle1">
                                    {report.report_type.charAt(0).toUpperCase() +
                                      report.report_type.slice(1)}{" "}
                                    Report
                                  </Typography>
                                  <Typography
                                    variant="body2"
                                    color="text.secondary"
                                  >
                                    {new Date(report.period_start).toLocaleDateString()}{" "}
                                    -{" "}
                                    {new Date(report.period_end).toLocaleDateString()}
                                  </Typography>
                                </Box>
                              </Stack>
                              <Stack
                                direction="row"
                                alignItems="center"
                                spacing={1}
                              >
                                <Chip
                                  size="small"
                                  label={`${report.report_data.summary.total_applications || 0} apps`}
                                  variant="outlined"
                                />
                                <Chip
                                  size="small"
                                  label={
                                    report.report_data.milestones_achieved?.length
                                      ? `${report.report_data.milestones_achieved.length} milestones`
                                      : "No milestones"
                                  }
                                  variant="outlined"
                                  color="warning"
                                />
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                >
                                  {new Date(report.generated_at).toLocaleDateString()}
                                </Typography>
                              </Stack>
                            </Stack>
                          </CardContent>
                        </Card>
                      ))}
                    </Stack>
                  )}
                </Stack>
              </Paper>
            </Box>
          </TabPanel>

          {/* Accountability Tab */}
          <TabPanel value={tabValue} index={3}>
            <Box sx={{ px: 2 }}>
              <Paper sx={{ p: 3 }}>
                <Stack spacing={3}>
                  <Stack direction="row" alignItems="center" spacing={2}>
                    <PeopleIcon color="primary" />
                    <Box>
                      <Typography variant="h6">
                        Accountability Partners
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Track engagement with your accountability partners
                      </Typography>
                    </Box>
                  </Stack>

                  {dashboard && dashboard.partners.length > 0 ? (
                    <Grid container spacing={2}>
                      {dashboard.partners.map((partner) => (
                        <Grid
                          key={partner.id}
                          size={{ xs: 12, sm: 6, md: 4 }}
                        >
                          <Card variant="outlined">
                            <CardContent>
                              <Stack
                                direction="row"
                                alignItems="center"
                                spacing={2}
                                mb={2}
                              >
                                <Avatar sx={{ bgcolor: "primary.main" }}>
                                  {partner.partner?.full_name?.[0]?.toUpperCase() ||
                                    "?"}
                                </Avatar>
                                <Box>
                                  <Typography variant="subtitle2">
                                    {partner.partner?.full_name || "Unknown"}
                                  </Typography>
                                  <Typography
                                    variant="caption"
                                    color="text.secondary"
                                  >
                                    {partner.partner?.email}
                                  </Typography>
                                </Box>
                              </Stack>

                              <Stack spacing={1}>
                                <Box>
                                  <Stack
                                    direction="row"
                                    justifyContent="space-between"
                                    mb={0.5}
                                  >
                                    <Typography
                                      variant="caption"
                                      color="text.secondary"
                                    >
                                      Engagement Score
                                    </Typography>
                                    <Typography variant="caption">
                                      {partner.health_score || 0}%
                                    </Typography>
                                  </Stack>
                                  <LinearProgress
                                    variant="determinate"
                                    value={partner.health_score || 0}
                                    color={
                                      (partner.health_score || 0) >= 70
                                        ? "success"
                                        : (partner.health_score || 0) >= 40
                                        ? "warning"
                                        : "error"
                                    }
                                    sx={{ height: 6, borderRadius: 1 }}
                                  />
                                </Box>

                                <Stack direction="row" spacing={1} flexWrap="wrap">
                                  <Chip
                                    size="small"
                                    icon={<HeartIcon />}
                                    label={`${
                                      partner.engagement_stats.encouragements_sent || 0
                                    } sent`}
                                    variant="outlined"
                                  />
                                  <Chip
                                    size="small"
                                    icon={<CheckCircleIcon />}
                                    label={`${
                                      partner.effectiveness_stats.goals_completed || 0
                                    } goals`}
                                    variant="outlined"
                                  />
                                </Stack>

                                {partner.last_interaction_at && (
                                  <Typography
                                    variant="caption"
                                    color="text.secondary"
                                  >
                                    <ScheduleIcon
                                      sx={{
                                        fontSize: 12,
                                        mr: 0.5,
                                        verticalAlign: "middle",
                                      }}
                                    />
                                    Last interaction:{" "}
                                    {new Date(
                                      partner.last_interaction_at
                                    ).toLocaleDateString()}
                                  </Typography>
                                )}
                              </Stack>
                            </CardContent>
                          </Card>
                        </Grid>
                      ))}
                    </Grid>
                  ) : (
                    <Box
                      sx={{
                        textAlign: "center",
                        py: 4,
                        bgcolor: "action.hover",
                        borderRadius: 1,
                      }}
                    >
                      <PeopleIcon
                        sx={{ fontSize: 48, color: "text.disabled", mb: 1 }}
                      />
                      <Typography color="text.secondary">
                        No accountability partnerships yet
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Partner metrics will appear as you engage with mentors
                        and teammates.
                      </Typography>
                    </Box>
                  )}

                  {/* Insights Section */}
                  {dashboard &&
                    (dashboard.total_engagements > 0 ||
                      dashboard.average_health_score > 0) && (
                      <>
                        <Divider />
                        <Box>
                          <Typography
                            variant="subtitle2"
                            color="text.secondary"
                            gutterBottom
                          >
                            Accountability Insights
                          </Typography>
                          <Stack spacing={1}>
                            <Chip
                              icon={<TrendingUpIcon />}
                              label={`${dashboard.total_engagements} total engagements`}
                              color="primary"
                              variant="outlined"
                            />
                            <Chip
                              icon={<HeartIcon />}
                              label={`${dashboard.total_encouragements_sent} encouragements sent, ${dashboard.total_encouragements_received} received`}
                              color="error"
                              variant="outlined"
                            />
                            {dashboard.average_health_score > 0 && (
                              <Chip
                                icon={<CheckCircleIcon />}
                                label={`Average relationship health: ${dashboard.average_health_score}%`}
                                color={
                                  dashboard.average_health_score >= 70
                                    ? "success"
                                    : dashboard.average_health_score >= 40
                                    ? "warning"
                                    : "error"
                                }
                                variant="outlined"
                              />
                            )}
                          </Stack>
                        </Box>
                      </>
                    )}
                </Stack>
              </Paper>
            </Box>
          </TabPanel>

          {/* Settings Tab */}
          <TabPanel value={tabValue} index={4}>
            <Box sx={{ px: 2 }}>
              <ProgressSharingSettings onSave={handleRefresh} />
            </Box>
          </TabPanel>
        </Paper>
      </Stack>
    </Container>
  );
}

export default ProgressSharingPage;
