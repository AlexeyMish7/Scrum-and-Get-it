/**
 * AnalyticsPanel — Compact interview-focused analytics panel
 *
 * Purpose: Display interview-focused job search analytics in compact format.
 * Shows quick metrics by default with option to expand for detailed analysis.
 * Can show overall stats or job-specific metrics.
 *
 * Contract:
 * - Inputs:
 *   - expanded: boolean — panel expansion state
 *   - onToggle: () => void — callback to toggle expansion
 *   - selectedJobId?: number — optional job ID for job-specific analytics
 * - Outputs:
 *   - Compact metrics bar with interview conversion funnel
 *   - Expandable detailed analytics
 *   - Job-specific or overall view toggle
 * - Error modes: uses internal error state for data loading failures
 */

import { useMemo, useState } from "react";
import {
  Box,
  Typography,
  Grid,
  Paper,
  Button,
  LinearProgress,
  TextField,
  Divider,
  Table,
  TableBody,
  TableRow,
  TableCell,
  Chip,
  Collapse,
  IconButton,
} from "@mui/material";
import {
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
} from "@mui/icons-material";
import NextDeadlinesWidget from "@job_pipeline/components/calendar/NextDeadlinesWidget/NextDeadlinesWidget";
import DeadlineCalendar from "@job_pipeline/components/calendar/DeadlineCalendar/DeadlineCalendar";
import FollowupCard from "@job_pipeline/components/cards/FollowupCard/FollowupCard";
import { useAuth } from "@shared/context/AuthContext";
import { useCoreJobs } from "@shared/cache/coreHooks";
import BenchmarkCard from "../../pages/AnalyticsPage/BenchmarkCard";
import SalaryResearchCard from "@job_pipeline/components/cards/SalaryResearchCard/SalaryResearchCard";
import SalaryProgressionCard from "@job_pipeline/components/cards/SalaryProgressionCard/SalaryProgressionCard";
import MarketIntelligenceCard from "@job_pipeline/components/cards/MarketIntelligenceCard/MarketIntelligenceCard";
import TimeInvestmentCard from "@job_pipeline/components/cards/TimeInvestmentCard/TimeInvestmentCard";
import {
  computeSuccessRates,
  computeAvgResponseDays,
  computeResponseRate,
  computeAvgStageDurations,
  computeMonthlyApplications,
  computeDeadlineAdherence,
  computeTimeToOffer,
  generateAIInsights,
} from "../../pages/AnalyticsPage/analyticsHelpers";
import type { JobRecord } from "../../pages/AnalyticsPage/analyticsHelpers";
import AnalyticsDashboard from "../../../../../../pages/AnalyticsDashboard";

interface AnalyticsPanelProps {
  expanded: boolean;
  onToggle: () => void;
  selectedJobId?: number; // If provided, show job-specific analytics
}

const EMPTY_JOBS: JobRecord[] = [];

export default function AnalyticsPanel({
  expanded,
  onToggle,
}: AnalyticsPanelProps) {
  const { user } = useAuth();

  const jobsQuery = useCoreJobs<JobRecord>(user?.id);
  const jobs = jobsQuery.data ?? EMPTY_JOBS;
  const loading = jobsQuery.isFetching;
  const error = user?.id
    ? jobsQuery.isError
      ? jobsQuery.error?.message ?? "Failed to load jobs"
      : null
    : null;

  const [weeklyGoal, setWeeklyGoal] = useState<number>(() => {
    try {
      const raw = localStorage.getItem("jobs:weeklyGoal");
      return raw ? Number(raw) : 5;
    } catch {
      return 5;
    }
  });
  const [showFullDashboard, setShowFullDashboard] = useState(false);

  // Funnel
  const funnel = useMemo(() => {
    const buckets: Record<string, number> = {
      Interested: 0,
      Applied: 0,
      "Phone Screen": 0,
      Interview: 0,
      Offer: 0,
      Rejected: 0,
      Unknown: 0,
    };
    for (const j of jobs) {
      const s = j.job_status ?? "Unknown";
      if (buckets[s] !== undefined) buckets[s] += 1;
      else buckets.Unknown += 1;
    }
    return buckets;
  }, [jobs]);

  const total = useMemo(
    () => Object.values(funnel).reduce((a, b) => a + b, 0),
    [funnel]
  );

  // Base analytics
  const byCompany = useMemo(
    () => computeAvgResponseDays(jobs, "company", 10),
    [jobs]
  );
  const byIndustry = useMemo(
    () => computeAvgResponseDays(jobs, "industry", 10),
    [jobs]
  );
  const successByIndustry = useMemo(
    () =>
      computeSuccessRates(jobs, "industry") as Array<{
        key: string;
        rate: number;
        offers: number;
        total: number;
      }>,
    [jobs]
  );

  // Extended analytics
  const responseRate = useMemo(() => computeResponseRate(jobs), [jobs]);
  const stageDurations = useMemo(() => computeAvgStageDurations(jobs), [jobs]);
  const monthlyApps = useMemo(() => computeMonthlyApplications(jobs), [jobs]);
  const deadlineStats = useMemo(() => computeDeadlineAdherence(jobs), [jobs]);
  const timeToOffer = useMemo(() => computeTimeToOffer(jobs), [jobs]);

  // Calculate applications this week
  const thisWeekApplications = useMemo(() => {
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay()); // Start of week (Sunday)
    weekStart.setHours(0, 0, 0, 0);

    return jobs.filter((j) => {
      if (!j.created_at) return false;
      const created = new Date(j.created_at);
      return created >= weekStart && created <= now;
    }).length;
  }, [jobs]);

  // AI-powered recommendations
  const recommendations = useMemo(() => {
    return generateAIInsights(
      jobs,
      funnel,
      responseRate,
      deadlineStats.adherence,
      timeToOffer,
      weeklyGoal,
      thisWeekApplications
    );
  }, [
    jobs,
    funnel,
    responseRate,
    deadlineStats.adherence,
    timeToOffer,
    weeklyGoal,
    thisWeekApplications,
  ]);

  function saveGoal() {
    try {
      localStorage.setItem("jobs:weeklyGoal", String(weeklyGoal));
    } catch {
      // ignore
    }
  }

  function exportCsv() {
    const rows: string[][] = [];
    rows.push(["Metric", "Value"]);
    rows.push(["Total jobs", String(total)]);
    rows.push(["Offers", String(funnel.Offer ?? 0)]);
    rows.push([
      "Offer rate",
      String(((funnel.Offer ?? 0) / Math.max(1, total)).toFixed(3)),
    ]);
    rows.push(["Weekly goal", String(weeklyGoal)]);
    rows.push(["Applications this week", String(thisWeekApplications)]);
    rows.push([]);
    rows.push(["Funnel breakdown"]);
    for (const k of Object.keys(funnel)) rows.push([k, String(funnel[k])]);
    rows.push([]);
    rows.push(["Avg response by company (days)"]);
    for (const r of byCompany)
      rows.push([r.key, String(r.avgDays.toFixed(1)), String(r.count)]);
    rows.push([]);
    rows.push(["Success by industry"]);
    for (const r of successByIndustry)
      rows.push([
        r.key,
        String((r.rate * 100).toFixed(1) + "%"),
        String(r.offers),
        String(r.total),
      ]);
    rows.push([]);
    rows.push(["Extended Metrics"]);
    rows.push(["Response rate", `${(responseRate * 100).toFixed(1)}%`]);
    rows.push(["Average time to offer (days)", String(timeToOffer.toFixed(1))]);
    rows.push([
      "Deadline adherence",
      `${(deadlineStats.adherence * 100).toFixed(1)}%`,
    ]);
    rows.push(["Deadlines met", String(deadlineStats.met)]);
    rows.push(["Deadlines missed", String(deadlineStats.missed)]);
    rows.push([]);
    rows.push(["Average days per stage"]);
    for (const [stage, days] of Object.entries(stageDurations)) {
      rows.push([stage, String(days.toFixed(1))]);
    }

    const csv = rows.map((r) => r.join(",")).join("\r\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `jobs-analytics-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <Paper sx={{ mb: 2 }}>
      {/* Header with toggle */}
      <Box
        sx={{
          p: 2,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          cursor: "pointer",
          "&:hover": { bgcolor: "action.hover" },
        }}
        onClick={onToggle}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Typography variant="h6">Analytics</Typography>
          {!expanded && (
            <Chip
              label={`${total} jobs`}
              size="small"
              color="primary"
              variant="outlined"
            />
          )}
        </Box>
        <Button
          size="small"
          variant="outlined"
          onClick={(e) => {
            e.stopPropagation();
            setShowFullDashboard((s) => !s);
          }}
          sx={{ mr: 1 }}
        >
          {showFullDashboard ? "Hide Full Dashboard" : "View Full Dashboard"}
        </Button>
        <IconButton size="small">
          {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
        </IconButton>
      </Box>

      {/* Collapsible content */}
      <Collapse in={expanded}>
        <Divider />
        {showFullDashboard && (
          <Box sx={{ p: 2 }}>
            <AnalyticsDashboard />
          </Box>
        )}
        <Box sx={{ p: 2 }}>
          {loading && <LinearProgress sx={{ mb: 2 }} />}

          {/* Deadlines + Calendar */}
          <Box
            sx={{
              display: "flex",
              gap: 2,
              mb: 2,
              flexDirection: { xs: "column", md: "row" },
            }}
          >
            <Box sx={{ width: { xs: "100%", md: "33%" } }}>
              <NextDeadlinesWidget />
              <FollowupCard jobs={jobs} />
            </Box>
            <Box sx={{ width: { xs: "100%", md: "67%" } }}>
              <DeadlineCalendar />
            </Box>
          </Box>

          {/* Funnel + basics */}
          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid size={12}>
              <Paper sx={{ p: 2 }} variant="outlined">
                <Typography variant="subtitle1" fontWeight={600}>
                  Application Funnel
                </Typography>
                <Divider sx={{ my: 1 }} />
                <Table size="small">
                  <TableBody>
                    {Object.entries(funnel).map(([k, v]) => (
                      <TableRow key={k}>
                        <TableCell>{k}</TableCell>
                        <TableCell align="right">{v}</TableCell>
                      </TableRow>
                    ))}
                    <TableRow>
                      <TableCell>
                        <strong>Total</strong>
                      </TableCell>
                      <TableCell align="right">
                        <strong>{total}</strong>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </Paper>
            </Grid>

            <Grid size={12}>
              <Paper sx={{ p: 2 }} variant="outlined">
                <Typography variant="subtitle1" fontWeight={600}>
                  Avg response (by company)
                </Typography>
                <Divider sx={{ my: 1 }} />
                <Table size="small">
                  <TableBody>
                    {byCompany.map((r) => (
                      <TableRow key={r.key}>
                        <TableCell>{r.key}</TableCell>
                        <TableCell align="right">
                          {r.avgDays.toFixed(1)} d ({r.count})
                        </TableCell>
                      </TableRow>
                    ))}
                    {byCompany.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={2}>No response data yet</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </Paper>
            </Grid>

            <Grid size={12}>
              <Paper sx={{ p: 2 }} variant="outlined">
                <Typography variant="subtitle1" fontWeight={600}>
                  Success rate by industry
                </Typography>
                <Divider sx={{ my: 1 }} />
                <Table size="small">
                  <TableBody>
                    {successByIndustry.map((r) => (
                      <TableRow key={r.key}>
                        <TableCell>{r.key}</TableCell>
                        <TableCell align="right">
                          {(r.rate * 100).toFixed(1)}% ({r.offers}/{r.total})
                        </TableCell>
                      </TableRow>
                    ))}
                    {successByIndustry.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={2}>
                          No offers recorded yet
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </Paper>
            </Grid>

            <Grid size={12}>
              <Paper sx={{ p: 2 }} variant="outlined">
                <Typography variant="subtitle1" fontWeight={600}>
                  Avg response (by industry)
                </Typography>
                <Divider sx={{ my: 1 }} />
                <Table size="small">
                  <TableBody>
                    {byIndustry.map((r) => (
                      <TableRow key={r.key}>
                        <TableCell>{r.key}</TableCell>
                        <TableCell align="right">
                          {r.avgDays.toFixed(1)} d ({r.count})
                        </TableCell>
                      </TableRow>
                    ))}
                    {byIndustry.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={2}>No response data yet</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </Paper>
            </Grid>
          </Grid>

          {/* Volume + Benchmarks */}
          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid size={12}>
              <Paper sx={{ p: 2 }} variant="outlined">
                <Typography variant="subtitle1" fontWeight={600}>
                  Application volume (last 12 weeks)
                </Typography>
                <Divider sx={{ my: 1 }} />
                <Box
                  sx={{
                    display: "flex",
                    gap: 1,
                    alignItems: "flex-end",
                    height: 120,
                  }}
                >
                  {monthlyApps.map((m) => (
                    <Box key={m.month} sx={{ flex: 1, textAlign: "center" }}>
                      <Box
                        sx={{
                          height: `${Math.min(100, m.count * 12)}%`,
                          bgcolor: "primary.main",
                          mx: 0.5,
                          borderRadius: 0.5,
                        }}
                      />
                      <Typography variant="caption">
                        {m.month.split("-")[1]}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </Paper>
            </Grid>

            <Grid size={12}>
              <BenchmarkCard jobs={jobs} />
            </Grid>
          </Grid>

          {/* Additional metrics */}
          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid size={12}>
              <Paper sx={{ p: 2 }} variant="outlined">
                <Typography variant="subtitle1" fontWeight={600}>
                  Response Rate
                </Typography>
                <Divider sx={{ my: 1 }} />
                <Typography variant="body1">
                  {(responseRate * 100).toFixed(1)}%
                </Typography>
              </Paper>
            </Grid>

            <Grid size={12}>
              <Paper sx={{ p: 2 }} variant="outlined">
                <Typography variant="subtitle1" fontWeight={600}>
                  Average Days per Stage
                </Typography>
                <Divider sx={{ my: 1 }} />
                <Table size="small">
                  <TableBody>
                    {Object.entries(stageDurations).map(([stage, days]) => (
                      <TableRow key={stage}>
                        <TableCell>{stage}</TableCell>
                        <TableCell align="right">{days.toFixed(1)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Paper>
            </Grid>

            <Grid size={12}>
              <Paper sx={{ p: 2 }} variant="outlined">
                <Typography variant="subtitle1" fontWeight={600}>
                  Deadline Adherence
                </Typography>
                <Divider sx={{ my: 1 }} />
                <Typography variant="body1">
                  {deadlineStats.met}/{deadlineStats.met + deadlineStats.missed}{" "}
                  met ({(deadlineStats.adherence * 100).toFixed(1)}%)
                </Typography>
              </Paper>
            </Grid>
          </Grid>

          {/* Time to offer + Recommendations */}
          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid size={12}>
              <Paper sx={{ p: 2 }} variant="outlined">
                <Typography variant="subtitle1" fontWeight={600}>
                  Time to Offer
                </Typography>
                <Divider sx={{ my: 1 }} />
                <Typography variant="body1">
                  {timeToOffer.toFixed(1)} days
                </Typography>
              </Paper>
            </Grid>

            <Grid size={12}>
              <Paper sx={{ p: 2 }} variant="outlined">
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Typography variant="subtitle1" fontWeight={600}>
                    AI-Powered Insights
                  </Typography>
                  <Chip label="AI" size="small" color="primary" />
                </Box>
                <Divider sx={{ my: 1 }} />
                <Box component="ul" sx={{ pl: 2, m: 0 }}>
                  {recommendations.map((r, i) => (
                    <li key={i}>
                      <Typography variant="body2" sx={{ mb: 1 }}>
                        {r}
                      </Typography>
                    </li>
                  ))}
                </Box>
              </Paper>
            </Grid>
          </Grid>

          {/* Goals & Progress */}
          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid size={12}>
              <Paper sx={{ p: 2 }} variant="outlined">
                <Typography variant="subtitle1" fontWeight={600}>
                  Goals & Progress
                </Typography>
                <Divider sx={{ my: 1 }} />
                <Typography variant="body2">Weekly application goal</Typography>
                <Box
                  sx={{ display: "flex", gap: 1, alignItems: "center", mt: 1 }}
                >
                  <TextField
                    size="small"
                    type="number"
                    value={weeklyGoal}
                    onChange={(e) => setWeeklyGoal(Number(e.target.value) || 0)}
                  />
                  <Button variant="contained" onClick={saveGoal} size="small">
                    Save
                  </Button>
                  <Button variant="outlined" onClick={exportCsv} size="small">
                    Export CSV
                  </Button>
                </Box>
                <Typography sx={{ mt: 1 }} variant="caption">
                  Progress this week: {thisWeekApplications}/{weeklyGoal}
                </Typography>
                {thisWeekApplications >= weeklyGoal && weeklyGoal > 0 && (
                  <Typography
                    sx={{ mt: 0.5 }}
                    variant="caption"
                    color="success.main"
                  >
                    ✓ Goal achieved!
                  </Typography>
                )}
              </Paper>
            </Grid>
          </Grid>

          {/* Salary analytics - progression and market research */}
          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid size={12}>
              {user?.id ? (
                <SalaryProgressionCard userId={user.id} timeRange="all" />
              ) : (
                <Paper sx={{ p: 2 }}>
                  <Typography>Loading user...</Typography>
                </Paper>
              )}
            </Grid>
            <Grid size={12}>
              <SalaryResearchCard />
            </Grid>
            <Grid size={12}>
              <MarketIntelligenceCard />
            </Grid>
            <Grid size={12}>
              <TimeInvestmentCard />
            </Grid>
          </Grid>

          <Typography variant="caption" color="text.secondary">
            Data is computed from your jobs list (scoped to your account).
            Benchmarks are basic static values for quick comparison.
          </Typography>
          {error && (
            <Typography
              variant="caption"
              color="error"
              sx={{ display: "block", mt: 1 }}
            >
              {error}
            </Typography>
          )}
        </Box>
      </Collapse>
    </Paper>
  );
}
