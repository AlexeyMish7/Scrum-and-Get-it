/**
 * ENTERPRISE DASHBOARD PAGE
 *
 * Purpose:
 * - Central hub for enterprise career services management
 * - Manages cohorts of job seekers
 * - Displays program analytics and ROI reports
 * - Configures white-label branding
 * - Tracks compliance and audit logs
 * - Manages external integrations
 *
 * Flow:
 * 1. Check if user has enterprise access (admin + enterprise subscription)
 * 2. Load dashboard overview with key metrics
 * 3. Navigate between tabs for different features
 *
 * Usage:
 *   Route: /team/enterprise
 *   Access: Team admins with enterprise subscription
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
  Card,
  CardContent,
  Grid,
  Button,
  Chip,
  Alert,
  CircularProgress,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  LinearProgress,
  IconButton,
  Tooltip,
} from "@mui/material";
import {
  Business as BusinessIcon,
  Groups as GroupsIcon,
  Analytics as AnalyticsIcon,
  Assessment as AssessmentIcon,
  Palette as PaletteIcon,
  Security as SecurityIcon,
  IntegrationInstructions as IntegrationIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Refresh as RefreshIcon,
  Add as AddIcon,
  CloudUpload as CloudUploadIcon,
  School as SchoolIcon,
  Work as WorkIcon,
  AttachMoney as AttachMoneyIcon,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { useTeam } from "@shared/context/useTeam";
import { useEnterprise } from "../hooks/useEnterprise";
import { useCohortManagement } from "../hooks/useCohortManagement";
import type {
  CohortRow,
  IntegrationWithStatus,
} from "../types/enterprise.types";

// Tab panel component
interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel({ children, value, index }: TabPanelProps) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`enterprise-tabpanel-${index}`}
      aria-labelledby={`enterprise-tab-${index}`}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

export function EnterpriseDashboard() {
  const navigate = useNavigate();
  const { currentTeam, isAdmin } = useTeam();
  const {
    cohortStats,
    analyticsSummary,
    programEffectiveness,
    branding,
    integrations,
    complianceSummary,
    loading,
    refreshAll,
  } = useEnterprise();

  const {
    cohorts,
    loading: loadingCohorts,
    fetchCohorts,
  } = useCohortManagement();

  const [activeTab, setActiveTab] = useState(0);

  // Load cohorts on mount
  useEffect(() => {
    if (currentTeam && isAdmin) {
      fetchCohorts();
    }
  }, [currentTeam, isAdmin, fetchCohorts]);

  // Handle tab change
  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  // Access denied for non-admins
  if (!isAdmin) {
    return (
      <Container maxWidth="md" sx={{ py: 8 }}>
        <Alert severity="error">
          <Typography variant="h6" gutterBottom>
            Access Denied
          </Typography>
          <Typography>
            You need administrator privileges to access the Enterprise
            Dashboard.
          </Typography>
        </Alert>
      </Container>
    );
  }

  // No team selected
  if (!currentTeam) {
    return (
      <Container maxWidth="md" sx={{ py: 8 }}>
        <Alert severity="info">
          <Typography variant="h6" gutterBottom>
            No Team Selected
          </Typography>
          <Typography>
            Please select or create a team to access enterprise features.
          </Typography>
          <Button
            variant="contained"
            sx={{ mt: 2 }}
            onClick={() => navigate("/team")}
          >
            Go to Team Dashboard
          </Button>
        </Alert>
      </Container>
    );
  }

  // Loading state
  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Stack spacing={3} alignItems="center">
          <CircularProgress />
          <Typography color="text.secondary">
            Loading enterprise dashboard...
          </Typography>
        </Stack>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
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
              <BusinessIcon sx={{ fontSize: 40, color: "primary.main" }} />
              <Box>
                <Typography variant="h4">Enterprise Dashboard</Typography>
                <Typography variant="body2" color="text.secondary">
                  {currentTeam.name} • Career Services Administration
                </Typography>
              </Box>
            </Stack>

            <Stack direction="row" spacing={2}>
              <Tooltip title="Refresh all data">
                <IconButton onClick={refreshAll}>
                  <RefreshIcon />
                </IconButton>
              </Tooltip>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => navigate("/team/enterprise/cohorts/new")}
              >
                Create Cohort
              </Button>
              <Button
                variant="outlined"
                startIcon={<CloudUploadIcon />}
                onClick={() => navigate("/team/enterprise/onboarding")}
              >
                Bulk Import
              </Button>
            </Stack>
          </Stack>
        </Paper>

        {/* Quick Stats */}
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card>
              <CardContent>
                <Stack direction="row" alignItems="center" spacing={1} mb={1}>
                  <GroupsIcon color="primary" />
                  <Typography variant="body2" color="text.secondary">
                    Active Cohorts
                  </Typography>
                </Stack>
                <Typography variant="h3">
                  {cohortStats?.active_cohorts || 0}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  of {cohortStats?.total_cohorts || 0} total
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card>
              <CardContent>
                <Stack direction="row" alignItems="center" spacing={1} mb={1}>
                  <SchoolIcon color="info" />
                  <Typography variant="body2" color="text.secondary">
                    Total Enrolled
                  </Typography>
                </Stack>
                <Typography variant="h3">
                  {cohortStats?.total_enrolled || 0}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  across all cohorts
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card>
              <CardContent>
                <Stack direction="row" alignItems="center" spacing={1} mb={1}>
                  <WorkIcon color="success" />
                  <Typography variant="body2" color="text.secondary">
                    Placements
                  </Typography>
                </Stack>
                <Typography variant="h3">
                  {cohortStats?.total_placed || 0}
                </Typography>
                <Stack direction="row" alignItems="center" spacing={0.5}>
                  {(cohortStats?.avg_placement_rate || 0) > 0 ? (
                    <>
                      <TrendingUpIcon fontSize="small" color="success" />
                      <Typography variant="caption" color="success.main">
                        {cohortStats?.avg_placement_rate}% rate
                      </Typography>
                    </>
                  ) : (
                    <Typography variant="caption" color="text.secondary">
                      No placements yet
                    </Typography>
                  )}
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card>
              <CardContent>
                <Stack direction="row" alignItems="center" spacing={1} mb={1}>
                  <AttachMoneyIcon color="warning" />
                  <Typography variant="body2" color="text.secondary">
                    Avg. Salary
                  </Typography>
                </Stack>
                <Typography variant="h3">
                  {analyticsSummary?.avg_salary
                    ? `$${(analyticsSummary.avg_salary / 1000).toFixed(0)}K`
                    : "N/A"}
                </Typography>
                <Stack direction="row" alignItems="center" spacing={0.5}>
                  {analyticsSummary?.trend === "up" && (
                    <>
                      <TrendingUpIcon fontSize="small" color="success" />
                      <Typography variant="caption" color="success.main">
                        +{analyticsSummary.trend_percentage}%
                      </Typography>
                    </>
                  )}
                  {analyticsSummary?.trend === "down" && (
                    <>
                      <TrendingDownIcon fontSize="small" color="error" />
                      <Typography variant="caption" color="error.main">
                        {analyticsSummary.trend_percentage}%
                      </Typography>
                    </>
                  )}
                  {(!analyticsSummary?.trend ||
                    analyticsSummary.trend === "stable") && (
                    <Typography variant="caption" color="text.secondary">
                      Stable
                    </Typography>
                  )}
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Tabs Navigation */}
        <Paper sx={{ width: "100%" }}>
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            aria-label="enterprise dashboard tabs"
            variant="scrollable"
            scrollButtons="auto"
          >
            <Tab
              icon={<AnalyticsIcon />}
              iconPosition="start"
              label="Overview"
            />
            <Tab icon={<GroupsIcon />} iconPosition="start" label="Cohorts" />
            <Tab
              icon={<AssessmentIcon />}
              iconPosition="start"
              label="Analytics"
            />
            <Tab
              icon={<AttachMoneyIcon />}
              iconPosition="start"
              label="ROI Reports"
            />
            <Tab icon={<PaletteIcon />} iconPosition="start" label="Branding" />
            <Tab
              icon={<SecurityIcon />}
              iconPosition="start"
              label="Compliance"
            />
            <Tab
              icon={<IntegrationIcon />}
              iconPosition="start"
              label="Integrations"
            />
          </Tabs>
        </Paper>

        {/* Tab Panels */}
        <TabPanel value={activeTab} index={0}>
          <OverviewPanel
            cohortStats={cohortStats}
            analyticsSummary={analyticsSummary}
            programEffectiveness={programEffectiveness}
            integrations={integrations}
            complianceSummary={complianceSummary}
          />
        </TabPanel>

        <TabPanel value={activeTab} index={1}>
          <CohortsPanel
            cohorts={cohorts}
            loading={loadingCohorts}
            onRefresh={fetchCohorts}
          />
        </TabPanel>

        <TabPanel value={activeTab} index={2}>
          <AnalyticsPanel programEffectiveness={programEffectiveness} />
        </TabPanel>

        <TabPanel value={activeTab} index={3}>
          <ROIReportsPanel />
        </TabPanel>

        <TabPanel value={activeTab} index={4}>
          <BrandingPanel branding={branding} />
        </TabPanel>

        <TabPanel value={activeTab} index={5}>
          <CompliancePanel complianceSummary={complianceSummary} />
        </TabPanel>

        <TabPanel value={activeTab} index={6}>
          <IntegrationsPanel integrations={integrations} />
        </TabPanel>
      </Stack>
    </Container>
  );
}

// ============================================================================
// OVERVIEW PANEL
// ============================================================================

interface OverviewPanelProps {
  cohortStats: ReturnType<typeof useEnterprise>["cohortStats"];
  analyticsSummary: ReturnType<typeof useEnterprise>["analyticsSummary"];
  programEffectiveness: ReturnType<
    typeof useEnterprise
  >["programEffectiveness"];
  integrations: ReturnType<typeof useEnterprise>["integrations"];
  complianceSummary: ReturnType<typeof useEnterprise>["complianceSummary"];
}

function OverviewPanel({
  programEffectiveness,
  integrations,
  complianceSummary,
}: OverviewPanelProps) {
  return (
    <Grid container spacing={3}>
      {/* Program Effectiveness */}
      <Grid size={{ xs: 12, md: 8 }}>
        <Paper sx={{ p: 3, height: "100%" }}>
          <Typography variant="h6" gutterBottom>
            Program Effectiveness
          </Typography>
          {programEffectiveness.length > 0 ? (
            <List>
              {programEffectiveness.slice(0, 5).map((program) => (
                <ListItem key={program.cohort_id} divider>
                  <ListItemText
                    primary={program.cohort_name}
                    secondary={
                      <Stack direction="row" spacing={2} mt={0.5}>
                        <Typography variant="caption">
                          Placement: {program.placement_rate}%
                        </Typography>
                        <Typography variant="caption">
                          Target: {program.target_placement_rate}%
                        </Typography>
                        <Typography variant="caption">
                          Avg. Time: {program.avg_time_to_placement} days
                        </Typography>
                      </Stack>
                    }
                  />
                  <Box sx={{ minWidth: 100 }}>
                    <LinearProgress
                      variant="determinate"
                      value={Math.min(program.placement_rate, 100)}
                      color={
                        program.performance_vs_target >= 0
                          ? "success"
                          : "warning"
                      }
                    />
                    <Typography
                      variant="caption"
                      color={
                        program.performance_vs_target >= 0
                          ? "success.main"
                          : "warning.main"
                      }
                    >
                      {program.performance_vs_target >= 0 ? "+" : ""}
                      {program.performance_vs_target}% vs target
                    </Typography>
                  </Box>
                </ListItem>
              ))}
            </List>
          ) : (
            <Alert severity="info">
              No program data available yet. Create cohorts and add members to
              see effectiveness metrics.
            </Alert>
          )}
        </Paper>
      </Grid>

      {/* Quick Status */}
      <Grid size={{ xs: 12, md: 4 }}>
        <Stack spacing={3}>
          {/* Integrations Status */}
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Integration Status
            </Typography>
            {integrations.length > 0 ? (
              <List dense>
                {integrations.slice(0, 4).map((integration) => (
                  <ListItem key={integration.id}>
                    <ListItemIcon>
                      {integration.sync_health === "healthy" && (
                        <CheckCircleIcon color="success" fontSize="small" />
                      )}
                      {integration.sync_health === "warning" && (
                        <WarningIcon color="warning" fontSize="small" />
                      )}
                      {integration.sync_health === "error" && (
                        <ErrorIcon color="error" fontSize="small" />
                      )}
                      {integration.sync_health === "unknown" && (
                        <CheckCircleIcon color="disabled" fontSize="small" />
                      )}
                    </ListItemIcon>
                    <ListItemText
                      primary={integration.name}
                      secondary={
                        integration.provider || integration.integration_type
                      }
                    />
                  </ListItem>
                ))}
              </List>
            ) : (
              <Typography variant="body2" color="text.secondary">
                No integrations configured
              </Typography>
            )}
          </Paper>

          {/* Compliance Summary */}
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Compliance (30 Days)
            </Typography>
            {complianceSummary ? (
              <Stack spacing={1}>
                <Typography variant="body2">
                  Total Events: {complianceSummary.total_events}
                </Typography>
                <Typography variant="body2">
                  Data Access: {complianceSummary.data_access_events}
                </Typography>
                <Typography variant="body2">
                  Settings Changes: {complianceSummary.settings_changes}
                </Typography>
                <Typography variant="body2">
                  Exports: {complianceSummary.export_events}
                </Typography>
              </Stack>
            ) : (
              <Typography variant="body2" color="text.secondary">
                No compliance data available
              </Typography>
            )}
          </Paper>
        </Stack>
      </Grid>
    </Grid>
  );
}

// ============================================================================
// COHORTS PANEL
// ============================================================================

interface CohortsPanelProps {
  cohorts: CohortRow[];
  loading: boolean;
  onRefresh: () => void;
}

function CohortsPanel({ cohorts, loading, onRefresh }: CohortsPanelProps) {
  const navigate = useNavigate();

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" py={4}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Stack spacing={3}>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Typography variant="h6">Cohort Management</Typography>
        <Stack direction="row" spacing={2}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={onRefresh}
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate("/team/enterprise/cohorts/new")}
          >
            Create Cohort
          </Button>
        </Stack>
      </Stack>

      {cohorts.length > 0 ? (
        <Grid container spacing={3}>
          {cohorts.map((cohort) => (
            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={cohort.id}>
              <Card
                sx={{ height: "100%", cursor: "pointer" }}
                onClick={() =>
                  navigate(`/team/enterprise/cohorts/${cohort.id}`)
                }
              >
                <CardContent>
                  <Stack spacing={2}>
                    <Stack
                      direction="row"
                      justifyContent="space-between"
                      alignItems="flex-start"
                    >
                      <Typography variant="h6" noWrap>
                        {cohort.name}
                      </Typography>
                      <Chip
                        label={cohort.status}
                        size="small"
                        color={
                          cohort.status === "active"
                            ? "success"
                            : cohort.status === "draft"
                            ? "default"
                            : cohort.status === "completed"
                            ? "info"
                            : "default"
                        }
                      />
                    </Stack>

                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                      }}
                    >
                      {cohort.description || "No description"}
                    </Typography>

                    <Divider />

                    <Stack direction="row" spacing={2}>
                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          Enrolled
                        </Typography>
                        <Typography variant="h6">
                          {cohort.current_enrollment}
                          {cohort.max_capacity && `/${cohort.max_capacity}`}
                        </Typography>
                      </Box>
                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          Target Rate
                        </Typography>
                        <Typography variant="h6">
                          {cohort.target_placement_rate || 0}%
                        </Typography>
                      </Box>
                    </Stack>

                    {cohort.program_type && (
                      <Chip
                        label={cohort.program_type}
                        size="small"
                        variant="outlined"
                      />
                    )}
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      ) : (
        <Paper sx={{ p: 4, textAlign: "center" }}>
          <GroupsIcon sx={{ fontSize: 64, color: "text.secondary", mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            No Cohorts Yet
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            Create your first cohort to start managing job seekers.
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate("/team/enterprise/cohorts/new")}
          >
            Create Cohort
          </Button>
        </Paper>
      )}
    </Stack>
  );
}

// ============================================================================
// ANALYTICS PANEL
// ============================================================================

interface AnalyticsPanelProps {
  programEffectiveness: ReturnType<
    typeof useEnterprise
  >["programEffectiveness"];
}

function AnalyticsPanel({ programEffectiveness }: AnalyticsPanelProps) {
  return (
    <Stack spacing={3}>
      <Typography variant="h6">Program Analytics</Typography>

      {programEffectiveness.length > 0 ? (
        <Paper sx={{ p: 3 }}>
          <Typography variant="subtitle1" gutterBottom>
            Cohort Performance Comparison
          </Typography>
          <List>
            {programEffectiveness.map((program) => (
              <ListItem key={program.cohort_id} divider>
                <ListItemText
                  primary={program.cohort_name}
                  secondary={
                    <Grid container spacing={2} mt={0.5}>
                      <Grid size={{ xs: 6, sm: 3 }}>
                        <Typography variant="caption" color="text.secondary">
                          Placement Rate
                        </Typography>
                        <Typography variant="body2">
                          {program.placement_rate}%
                        </Typography>
                      </Grid>
                      <Grid size={{ xs: 6, sm: 3 }}>
                        <Typography variant="caption" color="text.secondary">
                          Target Rate
                        </Typography>
                        <Typography variant="body2">
                          {program.target_placement_rate}%
                        </Typography>
                      </Grid>
                      <Grid size={{ xs: 6, sm: 3 }}>
                        <Typography variant="caption" color="text.secondary">
                          vs Target
                        </Typography>
                        <Typography
                          variant="body2"
                          color={
                            program.performance_vs_target >= 0
                              ? "success.main"
                              : "error.main"
                          }
                        >
                          {program.performance_vs_target >= 0 ? "+" : ""}
                          {program.performance_vs_target}%
                        </Typography>
                      </Grid>
                      <Grid size={{ xs: 6, sm: 3 }}>
                        <Typography variant="caption" color="text.secondary">
                          Avg. Time to Placement
                        </Typography>
                        <Typography variant="body2">
                          {program.avg_time_to_placement} days
                        </Typography>
                      </Grid>
                    </Grid>
                  }
                />
              </ListItem>
            ))}
          </List>
        </Paper>
      ) : (
        <Alert severity="info">
          No analytics data available yet. Add members to cohorts and track
          their progress to see analytics.
        </Alert>
      )}
    </Stack>
  );
}

// ============================================================================
// ROI REPORTS PANEL
// ============================================================================

function ROIReportsPanel() {
  return (
    <Stack spacing={3}>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Typography variant="h6">ROI Reports</Typography>
        <Button variant="contained" startIcon={<AddIcon />}>
          Generate Report
        </Button>
      </Stack>

      <Alert severity="info">
        ROI reporting coming soon! You'll be able to track program costs,
        placement outcomes, and calculate return on investment.
      </Alert>
    </Stack>
  );
}

// ============================================================================
// BRANDING PANEL
// ============================================================================

interface BrandingPanelProps {
  branding: ReturnType<typeof useEnterprise>["branding"];
}

function BrandingPanel({ branding }: BrandingPanelProps) {
  return (
    <Stack spacing={3}>
      <Typography variant="h6">White-Label Branding</Typography>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="subtitle1" gutterBottom>
              Brand Colors
            </Typography>
            <Stack spacing={2}>
              <Stack direction="row" alignItems="center" spacing={2}>
                <Box
                  sx={{
                    width: 40,
                    height: 40,
                    borderRadius: 1,
                    bgcolor: branding?.primary_color || "#1976d2",
                    border: 1,
                    borderColor: "divider",
                  }}
                />
                <Box>
                  <Typography variant="body2">Primary Color</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {branding?.primary_color || "#1976d2"}
                  </Typography>
                </Box>
              </Stack>
              <Stack direction="row" alignItems="center" spacing={2}>
                <Box
                  sx={{
                    width: 40,
                    height: 40,
                    borderRadius: 1,
                    bgcolor: branding?.secondary_color || "#dc004e",
                    border: 1,
                    borderColor: "divider",
                  }}
                />
                <Box>
                  <Typography variant="body2">Secondary Color</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {branding?.secondary_color || "#dc004e"}
                  </Typography>
                </Box>
              </Stack>
            </Stack>
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="subtitle1" gutterBottom>
              Organization Details
            </Typography>
            <Stack spacing={1}>
              <Typography variant="body2">
                <strong>Name:</strong>{" "}
                {branding?.organization_name || "Not configured"}
              </Typography>
              <Typography variant="body2">
                <strong>Tagline:</strong>{" "}
                {branding?.tagline || "Not configured"}
              </Typography>
              <Typography variant="body2">
                <strong>Custom Domain:</strong>{" "}
                {branding?.custom_domain || "Not configured"}
              </Typography>
            </Stack>
          </Paper>
        </Grid>
      </Grid>

      <Alert severity="info">
        Full branding editor coming soon! You'll be able to customize colors,
        logos, fonts, and more.
      </Alert>
    </Stack>
  );
}

// ============================================================================
// COMPLIANCE PANEL
// ============================================================================

interface CompliancePanelProps {
  complianceSummary: ReturnType<typeof useEnterprise>["complianceSummary"];
}

function CompliancePanel({ complianceSummary }: CompliancePanelProps) {
  return (
    <Stack spacing={3}>
      <Typography variant="h6">Compliance & Audit Logs</Typography>

      {complianceSummary ? (
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 4 }}>
            <Card>
              <CardContent>
                <Typography variant="h4">
                  {complianceSummary.total_events}
                </Typography>
                <Typography color="text.secondary">
                  Total Events (30 days)
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <Card>
              <CardContent>
                <Typography variant="h4">
                  {complianceSummary.data_access_events}
                </Typography>
                <Typography color="text.secondary">
                  Data Access Events
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <Card>
              <CardContent>
                <Typography variant="h4">
                  {complianceSummary.export_events}
                </Typography>
                <Typography color="text.secondary">Export Events</Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      ) : (
        <Alert severity="info">No compliance data available yet.</Alert>
      )}

      <Paper sx={{ p: 3 }}>
        <Typography variant="subtitle1" gutterBottom>
          Compliance Features
        </Typography>
        <List>
          <ListItem>
            <ListItemIcon>
              <CheckCircleIcon color="success" />
            </ListItemIcon>
            <ListItemText
              primary="Audit Logging"
              secondary="All data access and changes are logged"
            />
          </ListItem>
          <ListItem>
            <ListItemIcon>
              <CheckCircleIcon color="success" />
            </ListItemIcon>
            <ListItemText
              primary="Data Classification"
              secondary="Support for public, internal, confidential, and restricted data"
            />
          </ListItem>
          <ListItem>
            <ListItemIcon>
              <CheckCircleIcon color="success" />
            </ListItemIcon>
            <ListItemText
              primary="Framework Support"
              secondary="GDPR, FERPA, SOC2, HIPAA, CCPA compliance tracking"
            />
          </ListItem>
        </List>
      </Paper>
    </Stack>
  );
}

// ============================================================================
// INTEGRATIONS PANEL
// ============================================================================

interface IntegrationsPanelProps {
  integrations: IntegrationWithStatus[];
}

function IntegrationsPanel({ integrations }: IntegrationsPanelProps) {
  return (
    <Stack spacing={3}>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Typography variant="h6">External Integrations</Typography>
        <Button variant="contained" startIcon={<AddIcon />}>
          Add Integration
        </Button>
      </Stack>

      {integrations.length > 0 ? (
        <Grid container spacing={3}>
          {integrations.map((integration) => (
            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={integration.id}>
              <Card>
                <CardContent>
                  <Stack spacing={2}>
                    <Stack
                      direction="row"
                      justifyContent="space-between"
                      alignItems="center"
                    >
                      <Typography variant="h6">{integration.name}</Typography>
                      <Chip
                        label={integration.sync_health}
                        size="small"
                        color={
                          integration.sync_health === "healthy"
                            ? "success"
                            : integration.sync_health === "warning"
                            ? "warning"
                            : integration.sync_health === "error"
                            ? "error"
                            : "default"
                        }
                      />
                    </Stack>
                    <Typography variant="body2" color="text.secondary">
                      Type: {integration.integration_type}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Provider: {integration.provider || "Custom"}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Last sync:{" "}
                      {integration.last_sync_at
                        ? new Date(integration.last_sync_at).toLocaleString()
                        : "Never"}
                    </Typography>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      ) : (
        <Paper sx={{ p: 4, textAlign: "center" }}>
          <IntegrationIcon
            sx={{ fontSize: 64, color: "text.secondary", mb: 2 }}
          />
          <Typography variant="h6" gutterBottom>
            No Integrations Yet
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            Connect with LMS, CRM, job boards, and other platforms to streamline
            your workflow.
          </Typography>
          <Button variant="contained" startIcon={<AddIcon />}>
            Add Integration
          </Button>
        </Paper>
      )}
    </Stack>
  );
}
