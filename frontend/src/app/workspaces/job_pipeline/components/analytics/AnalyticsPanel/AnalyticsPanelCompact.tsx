/**
 * AnalyticsPanel — Compact interview-focused analytics panel with comprehensive metrics
 *
 * Purpose: Display interview-focused metrics in compact format with full analytics suite.
 * Emphasizes the path to interviews rather than just offers, includes calendar, benchmarks, etc.
 *
 * Contract:
 * - Inputs:
 *   - expanded: boolean — detail panel expansion state
 *   - onToggle: () => void — callback to toggle detailed view
 *   - selectedJobId?: number — optional job ID for job-specific analytics
 * - Outputs:
 *   - Compact interview funnel metrics (always visible)
 *   - Expandable detailed analytics with calendar, benchmarks, AI insights, goals, etc.
 * - Error modes: uses internal error state for loading failures
 */

import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Typography,
  Paper,
  Stack,
  Chip,
  LinearProgress,
  Collapse,
  IconButton,
  Grid,
  Divider,
  Tooltip,
  Table,
  TableBody,
  TableRow,
  TableCell,
  TextField,
  Button,
} from "@mui/material";
import {
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  TrendingUp as TrendingUpIcon,
  Phone as PhoneIcon,
  Work as WorkIcon,
  CheckCircle as CheckCircleIcon,
} from "@mui/icons-material";
import { useAuth } from "@shared/context/AuthContext";
import crud from "@shared/services/crud";
import NextDeadlinesWidget from "@job_pipeline/components/calendar/NextDeadlinesWidget/NextDeadlinesWidget";
import DeadlineCalendar from "@job_pipeline/components/calendar/DeadlineCalendar/DeadlineCalendar";
import BenchmarkCard from "../../pages/AnalyticsPage/BenchmarkCard";
import SalaryResearchCard from "@job_pipeline/components/cards/SalaryResearchCard/SalaryResearchCard";
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

interface AnalyticsPanelProps {
  expanded: boolean;
  onToggle: () => void;
  selectedJobId?: number;
}

export default function AnalyticsPanel({
  expanded,
  onToggle,
  selectedJobId,
}: AnalyticsPanelProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [jobs, setJobs] = useState<JobRecord[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [weeklyGoal, setWeeklyGoal] = useState<number>(() => {
    try {
      const raw = localStorage.getItem("jobs:weeklyGoal");
      return raw ? Number(raw) : 5;
    } catch {
      return 5;
    }
  });

  // Load jobs
  useEffect(() => {
    if (!user?.id) return;
    let mounted = true;
    setLoading(true);
    const userCrud = crud.withUser(user.id);
    userCrud
      .listRows<JobRecord>(
        "jobs",
        "id, job_title, company_name, industry, job_type, created_at, job_status, status_changed_at, application_deadline"
      )
      .then((res) => {
        if (!mounted) return;
        if (res.error) {
          setError(res.error.message ?? "Failed to load jobs");
          setJobs([]);
        } else {
          setJobs((res.data ?? []) as JobRecord[]);
        }
      })
      .catch((e) => {
        if (!mounted) return;
        setError(String(e));
      })
      .finally(() => mounted && setLoading(false));

    return () => {
      mounted = false;
    };
  }, [user?.id]);

  // Filter jobs if selectedJobId is provided
  const filteredJobs = useMemo(() => {
    if (!selectedJobId) return jobs;
    return jobs.filter((j) => String(j.id) === String(selectedJobId));
  }, [jobs, selectedJobId]);

  // Funnel breakdown
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
    for (const j of filteredJobs) {
      const s = j.job_status ?? "Unknown";
      if (buckets[s] !== undefined) buckets[s] += 1;
      else buckets.Unknown += 1;
    }
    return buckets;
  }, [filteredJobs]);

  const total = useMemo(
    () => Object.values(funnel).reduce((a, b) => a + b, 0),
    [funnel]
  );

  // Interview-focused funnel metrics
  const metrics = useMemo(() => {
    const applied = filteredJobs.filter((j) =>
      ["applied", "phone screen", "interview", "offer", "rejected"].includes(
        (j.job_status ?? "").toLowerCase()
      )
    ).length;
    const phoneScreens = filteredJobs.filter((j) =>
      ["phone screen", "interview", "offer"].includes(
        (j.job_status ?? "").toLowerCase()
      )
    ).length;
    const interviews = filteredJobs.filter((j) =>
      ["interview", "offer"].includes((j.job_status ?? "").toLowerCase())
    ).length;
    const offers = filteredJobs.filter(
      (j) => (j.job_status ?? "").toLowerCase() === "offer"
    ).length;

    // Calculate conversion rates (focus on interview path)
    const appliedToPhoneRate = applied > 0 ? phoneScreens / applied : 0;
    const phoneToInterviewRate =
      phoneScreens > 0 ? interviews / phoneScreens : 0;
    const interviewToOfferRate = interviews > 0 ? offers / interviews : 0;
    const appliedToInterviewRate = applied > 0 ? interviews / applied : 0; // KEY METRIC

    return {
      total,
      applied,
      phoneScreens,
      interviews,
      offers,
      appliedToPhoneRate,
      phoneToInterviewRate,
      interviewToOfferRate,
      appliedToInterviewRate, // This is the critical success metric
    };
  }, [filteredJobs, total]);

  // Base analytics
  const byCompany = useMemo(
    () => computeAvgResponseDays(filteredJobs, "company", 10),
    [filteredJobs]
  );
  const byIndustry = useMemo(
    () => computeAvgResponseDays(filteredJobs, "industry", 10),
    [filteredJobs]
  );
  const successByIndustry = useMemo(
    () =>
      computeSuccessRates(filteredJobs, "industry") as Array<{
        key: string;
        rate: number;
        offers: number;
        total: number;
      }>,
    [filteredJobs]
  );

  // Extended analytics
  const responseRate = useMemo(
    () => computeResponseRate(filteredJobs),
    [filteredJobs]
  );
  const stageDurations = useMemo(
    () => computeAvgStageDurations(filteredJobs),
    [filteredJobs]
  );
  const monthlyApps = useMemo(
    () => computeMonthlyApplications(filteredJobs),
    [filteredJobs]
  );
  const deadlineStats = useMemo(
    () => computeDeadlineAdherence(filteredJobs),
    [filteredJobs]
  );
  const timeToOffer = useMemo(
    () => computeTimeToOffer(filteredJobs),
    [filteredJobs]
  );

  // Calculate applications this week
  const thisWeekApplications = useMemo(() => {
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay()); // Start of week (Sunday)
    weekStart.setHours(0, 0, 0, 0);

    return filteredJobs.filter((j) => {
      if (!j.created_at) return false;
      const created = new Date(j.created_at);
      return created >= weekStart && created <= now;
    }).length;
  }, [filteredJobs]);

  // AI-powered recommendations
  const recommendations = useMemo(() => {
    return generateAIInsights(
      filteredJobs,
      funnel,
      responseRate,
      deadlineStats.adherence,
      timeToOffer,
      weeklyGoal,
      thisWeekApplications
    );
  }, [
    filteredJobs,
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

  // Status color helper
  const getStatusColor = (
    rate: number,
    goodThreshold: number,
    okThreshold: number
  ) => {
    if (rate >= goodThreshold) return "success.main";
    if (rate >= okThreshold) return "warning.main";
    return "error.main";
  };

  return (
    <Paper sx={{ mb: 2 }} elevation={1}>
      {loading && <LinearProgress />}

      {/* Compact Header - Always Visible */}
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
        <Stack direction="row" spacing={2} alignItems="center" sx={{ flex: 1 }}>
          <Typography variant="h6" sx={{ minWidth: 120 }}>
            {selectedJobId ? "Job Stats" : "Interview Metrics"}
          </Typography>

          {/* Key Metric: Interview Conversion Rate */}
          <Tooltip title="Applied → Interview conversion rate (key success metric)">
            <Chip
              icon={<WorkIcon fontSize="small" />}
              label={`Interview Rate: ${(
                metrics.appliedToInterviewRate * 100
              ).toFixed(1)}%`}
              color={
                metrics.appliedToInterviewRate >= 0.2
                  ? "success"
                  : metrics.appliedToInterviewRate >= 0.15
                  ? "warning"
                  : "default"
              }
              variant="filled"
            />
          </Tooltip>

          {/* Supporting Metrics */}
          <Chip
            icon={<PhoneIcon fontSize="small" />}
            label={`${metrics.phoneScreens} Screens`}
            size="small"
            variant="outlined"
          />
          <Chip
            icon={<TrendingUpIcon fontSize="small" />}
            label={`${metrics.interviews} Interviews`}
            size="small"
            variant="outlined"
            color="primary"
          />
          <Chip
            icon={<CheckCircleIcon fontSize="small" />}
            label={`${metrics.offers} Offers`}
            size="small"
            variant="outlined"
            color="success"
          />

          <Typography variant="caption" color="text.secondary">
            {metrics.applied} applications tracked
          </Typography>
        </Stack>

        <IconButton size="small">
          {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
        </IconButton>
      </Box>

      {/* Detailed Analytics - Expandable */}
      <Collapse in={expanded}>
        <Divider />
        <Box sx={{ p: 3 }}>
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
            </Box>
            <Box sx={{ width: { xs: "100%", md: "67%" } }}>
              <DeadlineCalendar />
            </Box>
          </Box>

          {/* Interview Funnel Breakdown */}
          <Typography variant="subtitle1" fontWeight={600} gutterBottom>
            Interview Funnel Analysis
          </Typography>

          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Paper variant="outlined" sx={{ p: 2, textAlign: "center" }}>
                <Typography
                  variant="h4"
                  color={getStatusColor(metrics.appliedToPhoneRate, 0.3, 0.2)}
                >
                  {(metrics.appliedToPhoneRate * 100).toFixed(1)}%
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Applied → Phone Screen
                </Typography>
                <Typography variant="body2" sx={{ mt: 0.5 }}>
                  {metrics.phoneScreens}/{metrics.applied}
                </Typography>
              </Paper>
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Paper variant="outlined" sx={{ p: 2, textAlign: "center" }}>
                <Typography
                  variant="h4"
                  color={getStatusColor(metrics.phoneToInterviewRate, 0.6, 0.4)}
                >
                  {(metrics.phoneToInterviewRate * 100).toFixed(1)}%
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Phone → Interview
                </Typography>
                <Typography variant="body2" sx={{ mt: 0.5 }}>
                  {metrics.interviews}/{metrics.phoneScreens}
                </Typography>
              </Paper>
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Paper variant="outlined" sx={{ p: 2, textAlign: "center" }}>
                <Typography
                  variant="h4"
                  color={getStatusColor(
                    metrics.interviewToOfferRate,
                    0.4,
                    0.25
                  )}
                >
                  {(metrics.interviewToOfferRate * 100).toFixed(1)}%
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Interview → Offer
                </Typography>
                <Typography variant="body2" sx={{ mt: 0.5 }}>
                  {metrics.offers}/{metrics.interviews}
                </Typography>
              </Paper>
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Paper
                variant="outlined"
                sx={{ p: 2, textAlign: "center", bgcolor: "primary.50" }}
              >
                <Typography variant="h4" color="primary.main" fontWeight={700}>
                  {(metrics.appliedToInterviewRate * 100).toFixed(1)}%
                </Typography>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  fontWeight={600}
                >
                  Overall Interview Rate ⭐
                </Typography>
                <Typography variant="body2" sx={{ mt: 0.5 }}>
                  {metrics.interviews}/{metrics.applied}
                </Typography>
              </Paper>
            </Grid>
          </Grid>

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
              <BenchmarkCard jobs={filteredJobs} />
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

          {/* Salary research */}
          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid size={{ xs: 12, md: 6 }}>
              <SalaryResearchCard />
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
