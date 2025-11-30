/**
 * AnalyticsView — Full-page interview-focused analytics
 *
 * Purpose: Display comprehensive analytics for job search progress.
 * Migrated from AnalyticsPanelCompact, now as full-page view without expandable/collapsible state.
 * Calendar and deadlines removed (now in persistent sidebar).
 *
 * Contract:
 * - Inputs: None (authenticated user via context)
 * - Outputs: Full analytics dashboard with metrics, charts, benchmarks, AI insights
 * - Features: Interview funnel, response rates, stage durations, goals, export
 */

import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Typography,
  Paper,
  Stack,
  Chip,
  LinearProgress,
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
  TrendingUp as TrendingUpIcon,
  Phone as PhoneIcon,
  Work as WorkIcon,
  CheckCircle as CheckCircleIcon,
} from "@mui/icons-material";
import { useAuth } from "@shared/context/AuthContext";
import crud from "@shared/services/crud";
import BenchmarkCard from "@job_pipeline/pages/AnalyticsPage/BenchmarkCard";
import SalaryProgressionCard from "@job_pipeline/components/cards/SalaryProgressionCard/SalaryProgressionCard";
import SalaryResearchCard from "@job_pipeline/components/cards/SalaryResearchCard/SalaryResearchCard";
import CompanyResearchCard from "@job_pipeline/components/cards/CompanyResearchCard/CompanyResearchCard";
import SkillsGapCard from "@job_pipeline/components/cards/SkillsGapCard/SkillsGapCard";
import InterviewAnalyticsCard from "@job_pipeline/components/cards/InterviewAnalyticsCard/InterviewAnalyticsCard";
import ApplicationQualityCard from "@job_pipeline/components/cards/ApplicationQualityCard/ApplicationQualityCard";
import TimeToHireCard from "@job_pipeline/components/cards/TimeToHireCard/TimeToHireCard";
import ResponseRateCard from "@job_pipeline/components/cards/ResponseRateCard/ResponseRateCard";
import GoalSettingCard from "@job_pipeline/components/cards/GoalSettingCard/GoalSettingCard";
import CompetitivePositioningCard from "@job_pipeline/components/cards/CompetitivePositioningCard/CompetitivePositioningCard";
import {
  computeSuccessRates,
  computeAvgResponseDays,
  computeResponseRate,
  computeAvgStageDurations,
  computeMonthlyApplications,
  computeDeadlineAdherence,
  computeTimeToOffer,
  generateAIInsights,
} from "@job_pipeline/pages/AnalyticsPage/analyticsHelpers";
import type { JobRecord } from "@job_pipeline/pages/AnalyticsPage/analyticsHelpers";

export default function AnalyticsView() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [jobs, setJobs] = useState<JobRecord[]>([]);
  const [error, setError] = useState<string | null>(null);

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

  // Interview-focused funnel metrics
  const metrics = useMemo(() => {
    const applied = jobs.filter((j) =>
      ["applied", "phone screen", "interview", "offer", "rejected"].includes(
        (j.job_status ?? "").toLowerCase()
      )
    ).length;
    const phoneScreens = jobs.filter((j) =>
      ["phone screen", "interview", "offer"].includes(
        (j.job_status ?? "").toLowerCase()
      )
    ).length;
    const interviews = jobs.filter((j) =>
      ["interview", "offer"].includes((j.job_status ?? "").toLowerCase())
    ).length;
    const offers = jobs.filter(
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
      appliedToInterviewRate,
    };
  }, [jobs, total]);

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
      5, // Default weekly goal
      thisWeekApplications
    );
  }, [
    jobs,
    funnel,
    responseRate,
    deadlineStats.adherence,
    timeToOffer,
    thisWeekApplications,
  ]);

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
    <Box sx={{ width: "100%", p: 3 }}>
      <Box sx={{ maxWidth: 1400, mx: "auto" }}>
        {loading && <LinearProgress sx={{ mb: 2 }} />}

        {/* Page Header */}
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
          sx={{ mb: 3 }}
        >
          <Typography variant="h4">Interview Analytics</Typography>
          <Button variant="outlined" onClick={exportCsv} size="small">
            Export CSV
          </Button>
        </Stack>

        {/* Key Metrics Header */}
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={2}
          sx={{
            mb: 3,
            p: 2,
            bgcolor: "background.paper",
            borderRadius: 2,
            boxShadow: 1,
          }}
        >
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
              sx={{ flex: 1 }}
            />
          </Tooltip>

          <Chip
            icon={<PhoneIcon fontSize="small" />}
            label={`${metrics.phoneScreens} Screens`}
            variant="outlined"
            sx={{ flex: 1 }}
          />
          <Chip
            icon={<TrendingUpIcon fontSize="small" />}
            label={`${metrics.interviews} Interviews`}
            variant="outlined"
            color="primary"
            sx={{ flex: 1 }}
          />
          <Chip
            icon={<CheckCircleIcon fontSize="small" />}
            label={`${metrics.offers} Offers`}
            variant="outlined"
            color="success"
            sx={{ flex: 1 }}
          />
        </Stack>

        {/* Interview Funnel Breakdown */}
        <Typography variant="h6" fontWeight={600} gutterBottom sx={{ mt: 3 }}>
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
                color={getStatusColor(metrics.interviewToOfferRate, 0.4, 0.25)}
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

        {/* Interview Performance Card */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid size={{ xs: 12 }}>
            <InterviewAnalyticsCard />
          </Grid>
        </Grid>

        {/* Funnel + Response Analytics */}
        <Typography variant="h6" fontWeight={600} gutterBottom sx={{ mt: 3 }}>
          Application Breakdown
        </Typography>

        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid size={{ xs: 12, md: 6 }}>
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

          <Grid size={{ xs: 12, md: 6 }}>
            <Paper sx={{ p: 2 }} variant="outlined">
              <Typography variant="subtitle1" fontWeight={600}>
                Avg Response (by Company)
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

          <Grid size={{ xs: 12, md: 6 }}>
            <Paper sx={{ p: 2 }} variant="outlined">
              <Typography variant="subtitle1" fontWeight={600}>
                Success Rate by Industry
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
                      <TableCell colSpan={2}>No offers recorded yet</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </Paper>
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <Paper sx={{ p: 2 }} variant="outlined">
              <Typography variant="subtitle1" fontWeight={600}>
                Avg Response (by Industry)
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
        <Typography variant="h6" fontWeight={600} gutterBottom sx={{ mt: 3 }}>
          Trends & Benchmarks
        </Typography>

        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid size={12}>
            <Paper sx={{ p: 2 }} variant="outlined">
              <Typography variant="subtitle1" fontWeight={600}>
                Application Volume (Last 12 Weeks)
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

          <Grid size={12}>
            <CompetitivePositioningCard />
          </Grid>
        </Grid>

        {/* Additional Metrics */}
        <Typography variant="h6" fontWeight={600} gutterBottom sx={{ mt: 3 }}>
          Performance Metrics
        </Typography>

        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Paper sx={{ p: 2 }} variant="outlined">
              <Typography variant="subtitle1" fontWeight={600}>
                Response Rate
              </Typography>
              <Divider sx={{ my: 1 }} />
              <Typography variant="h5">
                {(responseRate * 100).toFixed(1)}%
              </Typography>
            </Paper>
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Paper sx={{ p: 2 }} variant="outlined">
              <Typography variant="subtitle1" fontWeight={600}>
                Time to Offer
              </Typography>
              <Divider sx={{ my: 1 }} />
              <Typography variant="h5">
                {timeToOffer.toFixed(1)} days
              </Typography>
            </Paper>
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Paper sx={{ p: 2 }} variant="outlined">
              <Typography variant="subtitle1" fontWeight={600}>
                Deadline Adherence
              </Typography>
              <Divider sx={{ my: 1 }} />
              <Typography variant="h5">
                {(deadlineStats.adherence * 100).toFixed(1)}%
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {deadlineStats.met}/{deadlineStats.met + deadlineStats.missed}{" "}
                met
              </Typography>
            </Paper>
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Paper sx={{ p: 2 }} variant="outlined">
              <Typography variant="subtitle1" fontWeight={600}>
                This Week
              </Typography>
              <Divider sx={{ my: 1 }} />
              <Typography variant="h5">{thisWeekApplications}</Typography>
              <Typography variant="caption" color="text.secondary">
                applications
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
        </Grid>

        {/* AI Insights + Goals */}
        <Typography variant="h6" fontWeight={600} gutterBottom sx={{ mt: 3 }}>
          Insights & Goals
        </Typography>

        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid size={{ xs: 12, md: 6 }}>
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

          <Grid size={{ xs: 12, md: 6 }}>
            <GoalSettingCard />
          </Grid>
        </Grid>

        {/* Research & Intelligence */}
        <Typography variant="h6" fontWeight={600} gutterBottom sx={{ mt: 3 }}>
          Research & Intelligence
        </Typography>

        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid size={{ xs: 12 }}>
            <SalaryProgressionCard userId={user?.id || ""} timeRange="all" />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <SalaryResearchCard />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <CompanyResearchCard />
          </Grid>
        </Grid>

        {/* Quality Analysis */}
        <Typography variant="h6" fontWeight={600} gutterBottom sx={{ mt: 3 }}>
          Quality Analysis
        </Typography>

        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid size={{ xs: 12 }}>
            <ApplicationQualityCard />
          </Grid>
        </Grid>

        {/* Skills Development */}
        <Typography variant="h6" fontWeight={600} gutterBottom sx={{ mt: 3 }}>
          Skills Development
        </Typography>

        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid size={{ xs: 12 }}>
            <SkillsGapCard />
          </Grid>
        </Grid>

        {/* Timeline Insights */}
        <Typography variant="h6" fontWeight={600} gutterBottom sx={{ mt: 3 }}>
          Timeline & Process Insights
        </Typography>

        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid size={{ xs: 12, md: 6 }}>
            <TimeToHireCard />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <ResponseRateCard />
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
    </Box>
  );
}
