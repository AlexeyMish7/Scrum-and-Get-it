/**
 * UC-115: External Advisor and Coach Integration
 * Main dashboard for managing external career advisors
 */

import { useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Tab,
  Tabs,
  Typography,
  Button,
  Chip,
  Stack,
  Alert,
  Skeleton,
  Grid,
} from "@mui/material";
import {
  PersonAdd as PersonAddIcon,
  People as PeopleIcon,
  Event as EventIcon,
  Lightbulb as LightbulbIcon,
  TrendingUp as TrendingUpIcon,
  Payment as PaymentIcon,
} from "@mui/icons-material";

import { useExternalAdvisors } from "../hooks/useExternalAdvisors";
import { useAdvisorSessions } from "../hooks/useAdvisorSessions";
import { useAdvisorRecommendations } from "../hooks/useAdvisorRecommendations";

// Tab panel interface for type safety
interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

// Simple tab panel component
function TabPanel({ children, value, index }: TabPanelProps) {
  return (
    <div role="tabpanel" hidden={value !== index}>
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

/**
 * Advisor Dashboard - Main page for UC-115
 * Tabbed interface: Advisors | Sessions | Recommendations | Impact | Billing
 */
export function AdvisorDashboard() {
  // Tab state
  const [activeTab, setActiveTab] = useState(0);

  // Invite dialog state
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);

  // Data hooks
  const {
    advisors,
    loading: advisorsLoading,
    error: advisorsError,
    summary,
  } = useExternalAdvisors();

  const { upcomingSessions, loading: sessionsLoading } = useAdvisorSessions();

  const { pendingRecommendations, loading: recommendationsLoading } =
    useAdvisorRecommendations();

  // Handle tab change
  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  // Count active advisors
  const activeAdvisors = advisors.filter((a) => a.status === "active");
  const pendingAdvisors = advisors.filter((a) => a.status === "pending");

  return (
    <Box sx={{ p: 3 }}>
      {/* Page Header */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
        }}
      >
        <Box>
          <Typography variant="h4" gutterBottom>
            External Advisors
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage your career coaches, mentors, and advisors
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<PersonAddIcon />}
          onClick={() => setInviteDialogOpen(true)}
        >
          Invite Advisor
        </Button>
      </Box>

      {/* Error Alert */}
      {advisorsError && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {advisorsError}
        </Alert>
      )}

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {/* Active Advisors */}
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Stack direction="row" spacing={2} alignItems="center">
                <PeopleIcon color="primary" sx={{ fontSize: 40 }} />
                <Box>
                  <Typography variant="h4">
                    {advisorsLoading ? (
                      <Skeleton width={40} />
                    ) : (
                      summary?.active_advisors ?? 0
                    )}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Active Advisors
                  </Typography>
                </Box>
              </Stack>
              {pendingAdvisors.length > 0 && (
                <Chip
                  label={`${pendingAdvisors.length} pending`}
                  size="small"
                  color="warning"
                  sx={{ mt: 1 }}
                />
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Upcoming Sessions */}
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Stack direction="row" spacing={2} alignItems="center">
                <EventIcon color="info" sx={{ fontSize: 40 }} />
                <Box>
                  <Typography variant="h4">
                    {sessionsLoading ? (
                      <Skeleton width={40} />
                    ) : (
                      summary?.upcoming_sessions ?? upcomingSessions.length
                    )}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Upcoming Sessions
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* Pending Recommendations */}
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Stack direction="row" spacing={2} alignItems="center">
                <LightbulbIcon color="warning" sx={{ fontSize: 40 }} />
                <Box>
                  <Typography variant="h4">
                    {recommendationsLoading ? (
                      <Skeleton width={40} />
                    ) : (
                      summary?.pending_recommendations ??
                      pendingRecommendations.length
                    )}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Pending Actions
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* Total Hours Coached */}
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Stack direction="row" spacing={2} alignItems="center">
                <TrendingUpIcon color="success" sx={{ fontSize: 40 }} />
                <Box>
                  <Typography variant="h4">
                    {advisorsLoading ? (
                      <Skeleton width={40} />
                    ) : (
                      `${summary?.total_hours_coached?.toFixed(1) ?? 0}h`
                    )}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Hours Coached
                  </Typography>
                </Box>
              </Stack>
              {summary?.average_rating && (
                <Chip
                  label={`★ ${summary.average_rating.toFixed(1)}`}
                  size="small"
                  color="success"
                  sx={{ mt: 1 }}
                />
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabs Navigation */}
      <Card>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          sx={{ borderBottom: 1, borderColor: "divider", px: 2 }}
        >
          <Tab
            icon={<PeopleIcon />}
            iconPosition="start"
            label={`Advisors (${activeAdvisors.length})`}
          />
          <Tab
            icon={<EventIcon />}
            iconPosition="start"
            label={`Sessions (${upcomingSessions.length})`}
          />
          <Tab
            icon={<LightbulbIcon />}
            iconPosition="start"
            label={`Recommendations (${pendingRecommendations.length})`}
          />
          <Tab icon={<TrendingUpIcon />} iconPosition="start" label="Impact" />
          <Tab icon={<PaymentIcon />} iconPosition="start" label="Billing" />
        </Tabs>

        {/* Tab Content */}
        <CardContent>
          {/* Advisors Tab */}
          <TabPanel value={activeTab} index={0}>
            {advisorsLoading ? (
              <Box>
                {[1, 2, 3].map((i) => (
                  <Skeleton
                    key={i}
                    variant="rectangular"
                    height={100}
                    sx={{ mb: 2, borderRadius: 1 }}
                  />
                ))}
              </Box>
            ) : advisors.length === 0 ? (
              <Box textAlign="center" py={4}>
                <PeopleIcon
                  sx={{ fontSize: 64, color: "text.disabled", mb: 2 }}
                />
                <Typography variant="h6" gutterBottom>
                  No Advisors Yet
                </Typography>
                <Typography color="text.secondary" sx={{ mb: 2 }}>
                  Invite career coaches, mentors, and advisors to support your
                  job search
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<PersonAddIcon />}
                  onClick={() => setInviteDialogOpen(true)}
                >
                  Invite Your First Advisor
                </Button>
              </Box>
            ) : (
              <Stack spacing={2}>
                {advisors.map((advisor) => (
                  <Card key={advisor.id} variant="outlined">
                    <CardContent>
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "flex-start",
                        }}
                      >
                        <Box>
                          <Typography variant="h6">
                            {advisor.advisor_name}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {advisor.advisor_email}
                          </Typography>
                          {advisor.organization_name && (
                            <Typography variant="body2" color="text.secondary">
                              {advisor.organization_name}
                              {advisor.advisor_title &&
                                ` • ${advisor.advisor_title}`}
                            </Typography>
                          )}
                        </Box>
                        <Stack direction="row" spacing={1}>
                          <Chip
                            label={advisor.advisor_type.replace("_", " ")}
                            size="small"
                            color="primary"
                            variant="outlined"
                          />
                          <Chip
                            label={advisor.status}
                            size="small"
                            color={
                              advisor.status === "active"
                                ? "success"
                                : advisor.status === "pending"
                                ? "warning"
                                : "default"
                            }
                          />
                        </Stack>
                      </Box>
                      <Box sx={{ mt: 2 }}>
                        <Typography variant="caption" color="text.secondary">
                          {advisor.total_sessions} sessions •{" "}
                          {advisor.total_recommendations} recommendations
                        </Typography>
                      </Box>
                    </CardContent>
                  </Card>
                ))}
              </Stack>
            )}
          </TabPanel>

          {/* Sessions Tab */}
          <TabPanel value={activeTab} index={1}>
            {sessionsLoading ? (
              <Box>
                {[1, 2, 3].map((i) => (
                  <Skeleton
                    key={i}
                    variant="rectangular"
                    height={80}
                    sx={{ mb: 2, borderRadius: 1 }}
                  />
                ))}
              </Box>
            ) : upcomingSessions.length === 0 ? (
              <Box textAlign="center" py={4}>
                <EventIcon
                  sx={{ fontSize: 64, color: "text.disabled", mb: 2 }}
                />
                <Typography variant="h6" gutterBottom>
                  No Upcoming Sessions
                </Typography>
                <Typography color="text.secondary">
                  Schedule coaching sessions with your advisors
                </Typography>
              </Box>
            ) : (
              <Stack spacing={2}>
                {upcomingSessions.map((session) => (
                  <Card key={session.session_id} variant="outlined">
                    <CardContent>
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        <Box>
                          <Typography variant="h6">{session.title}</Typography>
                          <Typography variant="body2" color="text.secondary">
                            with {session.advisor_name}
                          </Typography>
                        </Box>
                        <Box textAlign="right">
                          <Typography variant="body1">
                            {new Date(
                              session.scheduled_start
                            ).toLocaleDateString()}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {new Date(
                              session.scheduled_start
                            ).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </Typography>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                ))}
              </Stack>
            )}
          </TabPanel>

          {/* Recommendations Tab */}
          <TabPanel value={activeTab} index={2}>
            {recommendationsLoading ? (
              <Box>
                {[1, 2, 3].map((i) => (
                  <Skeleton
                    key={i}
                    variant="rectangular"
                    height={80}
                    sx={{ mb: 2, borderRadius: 1 }}
                  />
                ))}
              </Box>
            ) : pendingRecommendations.length === 0 ? (
              <Box textAlign="center" py={4}>
                <LightbulbIcon
                  sx={{ fontSize: 64, color: "text.disabled", mb: 2 }}
                />
                <Typography variant="h6" gutterBottom>
                  No Pending Recommendations
                </Typography>
                <Typography color="text.secondary">
                  Your advisors' recommendations will appear here
                </Typography>
              </Box>
            ) : (
              <Stack spacing={2}>
                {pendingRecommendations.map((rec) => (
                  <Card key={rec.recommendation_id} variant="outlined">
                    <CardContent>
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "flex-start",
                        }}
                      >
                        <Box>
                          <Typography variant="h6">{rec.title}</Typography>
                          <Typography variant="body2" color="text.secondary">
                            from {rec.advisor_name}
                          </Typography>
                          <Typography
                            variant="body2"
                            sx={{
                              mt: 1,
                              display: "-webkit-box",
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: "vertical",
                              overflow: "hidden",
                            }}
                          >
                            {rec.description}
                          </Typography>
                        </Box>
                        <Stack direction="row" spacing={1}>
                          <Chip
                            label={rec.category}
                            size="small"
                            color="primary"
                            variant="outlined"
                          />
                          <Chip
                            label={rec.priority}
                            size="small"
                            color={
                              rec.priority === "high"
                                ? "error"
                                : rec.priority === "medium"
                                ? "warning"
                                : "info"
                            }
                          />
                        </Stack>
                      </Box>
                    </CardContent>
                  </Card>
                ))}
              </Stack>
            )}
          </TabPanel>

          {/* Impact Tab */}
          <TabPanel value={activeTab} index={3}>
            <Box textAlign="center" py={4}>
              <TrendingUpIcon
                sx={{ fontSize: 64, color: "text.disabled", mb: 2 }}
              />
              <Typography variant="h6" gutterBottom>
                Advisor Impact Analytics
              </Typography>
              <Typography color="text.secondary">
                Track the effectiveness of your advisory relationships
              </Typography>
            </Box>
          </TabPanel>

          {/* Billing Tab */}
          <TabPanel value={activeTab} index={4}>
            <Box textAlign="center" py={4}>
              <PaymentIcon
                sx={{ fontSize: 64, color: "text.disabled", mb: 2 }}
              />
              <Typography variant="h6" gutterBottom>
                Billing & Payments
              </Typography>
              <Typography color="text.secondary">
                Manage payments for paid coaching services
              </Typography>
            </Box>
          </TabPanel>
        </CardContent>
      </Card>

      {/* Invite Dialog - placeholder, would be a separate component */}
      {inviteDialogOpen && (
        <Alert
          severity="info"
          onClose={() => setInviteDialogOpen(false)}
          sx={{ position: "fixed", bottom: 20, right: 20, zIndex: 9999 }}
        >
          Invite Advisor dialog would open here
        </Alert>
      )}
    </Box>
  );
}

export default AdvisorDashboard;
