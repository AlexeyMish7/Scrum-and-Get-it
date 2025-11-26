/**
 * TEAM REPORTS PAGE
 *
 * Purpose:
 * - Generate team performance reports and coaching insights
 * - Show member performance comparison and success rates
 * - Provide exportable reports for admin and mentors
 *
 * UC-108 Requirements:
 * - Generate team performance reports and coaching insights
 * - Provide team dashboard with aggregate progress insights
 *
 * Usage:
 *   Route: /team/reports
 *   Access: Admin and Mentor roles only
 */

import { useState, useEffect } from "react";
import {
  Container,
  Stack,
  Typography,
  Paper,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  Chip,
  LinearProgress,
} from "@mui/material";
import {
  Download as DownloadIcon,
  Assessment as AssessmentIcon,
} from "@mui/icons-material";
import { useTeam } from "@shared/context/useTeam";
import { useAuth } from "@shared/context/AuthContext";
import * as teamService from "../services/teamService";

export function TeamReports() {
  const { user } = useAuth();
  const { currentTeam, isAdmin, isMentor } = useTeam();

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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load insights on mount
  useEffect(() => {
    async function loadInsights() {
      if (!user || !currentTeam) return;

      setLoading(true);
      setError(null);
      const result = await teamService.getTeamInsights(user.id, currentTeam.id);
      if (result.error) {
        setError(result.error.message);
      } else {
        setInsights(result.data);
      }
      setLoading(false);
    }

    loadInsights();
  }, [user, currentTeam]);

  // Check permissions
  if (!isAdmin && !isMentor) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="warning">
          Only team admins and mentors can access team reports.
        </Alert>
      </Container>
    );
  }

  if (!currentTeam) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="info">
          No team selected. Please select a team first.
        </Alert>
      </Container>
    );
  }

  // Calculate success rates
  const calculateSuccessRate = (interviews: number, applications: number) => {
    return applications > 0 ? Math.round((interviews / applications) * 100) : 0;
  };

  const calculateOfferRate = (offers: number, interviews: number) => {
    return interviews > 0 ? Math.round((offers / interviews) * 100) : 0;
  };

  // Export to CSV
  const handleExport = () => {
    if (!insights) return;

    const csvHeader =
      "Name,Applications,Interviews,Offers,Interview Rate,Offer Rate\n";
    const csvRows = insights.memberActivity
      .map((member) => {
        const interviewRate = calculateSuccessRate(
          member.interviews,
          member.applications
        );
        const offerRate = calculateOfferRate(member.offers, member.interviews);
        return `${member.name},${member.applications},${member.interviews},${member.offers},${interviewRate}%,${offerRate}%`;
      })
      .join("\n");

    const csv = csvHeader + csvRows;
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `team-report-${currentTeam.name}-${
      new Date().toISOString().split("T")[0]
    }.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Stack spacing={4}>
        {/* Header */}
        <Box>
          <Stack direction="row" alignItems="center" spacing={2} mb={1}>
            <AssessmentIcon sx={{ fontSize: 40, color: "primary.main" }} />
            <Typography variant="h4">Team Performance Reports</Typography>
          </Stack>
          <Typography variant="body1" color="text.secondary">
            Coaching insights and member performance comparison for{" "}
            {currentTeam.name}
          </Typography>
        </Box>

        {error && <Alert severity="error">{error}</Alert>}

        {/* Summary Cards */}
        {loading ? (
          <Box display="flex" justifyContent="center" py={4}>
            <CircularProgress />
          </Box>
        ) : insights ? (
          <>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Team Summary
              </Typography>
              <Stack direction="row" spacing={4} flexWrap="wrap">
                <Box>
                  <Typography variant="h3" color="primary">
                    {insights.totalMembers}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Team Members
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="h3" color="info.main">
                    {insights.totalApplications}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Applications
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="h3" color="warning.main">
                    {insights.totalInterviews}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Interviews
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="h3" color="success.main">
                    {insights.totalOffers}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Offers
                  </Typography>
                </Box>
              </Stack>
            </Paper>

            {/* Coaching Insights */}
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Coaching Insights
              </Typography>
              <Stack spacing={2}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="subtitle2" gutterBottom>
                      Team Conversion Rate
                    </Typography>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      paragraph
                    >
                      Overall interview rate:{" "}
                      <strong>
                        {calculateSuccessRate(
                          insights.totalInterviews,
                          insights.totalApplications
                        )}
                        %
                      </strong>
                    </Typography>
                    <LinearProgress
                      variant="determinate"
                      value={calculateSuccessRate(
                        insights.totalInterviews,
                        insights.totalApplications
                      )}
                      sx={{ mb: 1 }}
                    />
                    <Typography variant="caption" color="text.secondary">
                      Industry benchmark: 20-30% for quality applications
                    </Typography>
                  </CardContent>
                </Card>

                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="subtitle2" gutterBottom>
                      Offer Conversion
                    </Typography>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      paragraph
                    >
                      Interview to offer rate:{" "}
                      <strong>
                        {calculateOfferRate(
                          insights.totalOffers,
                          insights.totalInterviews
                        )}
                        %
                      </strong>
                    </Typography>
                    <LinearProgress
                      variant="determinate"
                      value={calculateOfferRate(
                        insights.totalOffers,
                        insights.totalInterviews
                      )}
                      color="success"
                      sx={{ mb: 1 }}
                    />
                    <Typography variant="caption" color="text.secondary">
                      Industry benchmark: 30-40% for prepared candidates
                    </Typography>
                  </CardContent>
                </Card>
              </Stack>
            </Paper>

            {/* Member Performance Table */}
            <Paper sx={{ p: 3 }}>
              <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="center"
                mb={2}
              >
                <Typography variant="h6">
                  Member Performance Comparison
                </Typography>
                <Button
                  variant="outlined"
                  startIcon={<DownloadIcon />}
                  onClick={handleExport}
                  size="small"
                >
                  Export CSV
                </Button>
              </Stack>

              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Member</TableCell>
                      <TableCell align="right">Applications</TableCell>
                      <TableCell align="right">Interviews</TableCell>
                      <TableCell align="right">Offers</TableCell>
                      <TableCell align="right">Interview Rate</TableCell>
                      <TableCell align="right">Offer Rate</TableCell>
                      <TableCell>Performance</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {insights.memberActivity
                      .sort((a, b) => b.applications - a.applications)
                      .map((member) => {
                        const interviewRate = calculateSuccessRate(
                          member.interviews,
                          member.applications
                        );
                        const offerRate = calculateOfferRate(
                          member.offers,
                          member.interviews
                        );

                        return (
                          <TableRow key={member.userId}>
                            <TableCell>{member.name}</TableCell>
                            <TableCell align="right">
                              {member.applications}
                            </TableCell>
                            <TableCell align="right">
                              {member.interviews}
                            </TableCell>
                            <TableCell align="right">{member.offers}</TableCell>
                            <TableCell align="right">
                              {interviewRate}%
                            </TableCell>
                            <TableCell align="right">{offerRate}%</TableCell>
                            <TableCell>
                              {interviewRate >= 25 ? (
                                <Chip
                                  label="Excellent"
                                  color="success"
                                  size="small"
                                />
                              ) : interviewRate >= 15 ? (
                                <Chip
                                  label="Good"
                                  color="primary"
                                  size="small"
                                />
                              ) : member.applications > 0 ? (
                                <Chip
                                  label="Needs Coaching"
                                  color="warning"
                                  size="small"
                                />
                              ) : (
                                <Chip
                                  label="Getting Started"
                                  color="default"
                                  size="small"
                                />
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                  </TableBody>
                </Table>
              </TableContainer>

              {insights.memberActivity.length === 0 && (
                <Box py={4} textAlign="center">
                  <Typography color="text.secondary">
                    No member activity data available yet
                  </Typography>
                </Box>
              )}
            </Paper>
          </>
        ) : (
          <Alert severity="info">No data available</Alert>
        )}
      </Stack>
    </Container>
  );
}
