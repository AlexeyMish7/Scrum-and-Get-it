import { useEffect, useMemo, useState } from "react";
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
} from "@mui/material";
import NextDeadlinesWidget from "@workspaces/jobs/components/NextDeadlinesWidget/NextDeadlinesWidget";
import DeadlineCalendar from "@workspaces/jobs/components/DeadlineCalendar/DeadlineCalendar";
import { useAuth } from "@shared/context/AuthContext";
import crud from "@shared/services/crud";
import BenchmarkCard from "./BenchmarkCard";
import {
  computeSuccessRates,
  computeAvgResponseDays,
  computeResponseRate,
  computeAvgStageDurations,
  computeMonthlyApplications,
  computeDeadlineAdherence,
  computeTimeToOffer,
} from "./analyticsHelpers";
import type { JobRecord } from "./analyticsHelpers";

export default function AnalyticsPage() {
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

  const total = useMemo(() => Object.values(funnel).reduce((a, b) => a + b, 0), [funnel]);

  // Base analytics
  const byCompany = useMemo(() => computeAvgResponseDays(jobs, "company", 10), [jobs]);
  const byIndustry = useMemo(() => computeAvgResponseDays(jobs, "industry", 10), [jobs]);
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

  const recommendations = useMemo(() => {
    const recs: string[] = [];
    const offers = funnel.Offer ?? 0;
    const offerRate = offers / Math.max(1, total);
    if (offerRate < 0.05)
      recs.push("Offer rate is low. Improve tailoring or prioritize higher-match roles.");
    if (byIndustry.length && byIndustry[0].avgDays > 14)
      recs.push("Response times are long in your common industries; consider earlier follow-ups.");
    if (recs.length === 0) recs.push("Metrics look healthy — continue monitoring trends.");
    return recs;
  }, [funnel, total, byIndustry]);

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
    rows.push(["Offer rate", String(((funnel.Offer ?? 0) / Math.max(1, total)).toFixed(3))]);
    rows.push(["Weekly goal", String(weeklyGoal)]);
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
    rows.push(["Response rate", `${(responseRate * 100).toFixed(1)}%`]);
    rows.push(["Average time to offer (days)", String(timeToOffer.toFixed(1))]);
    rows.push(["Deadline adherence", `${(deadlineStats.adherence * 100).toFixed(1)}%`]);

    const csv = rows
      .map((r) => r.map((c) => `"${String(c ?? "").replace(/"/g, '""')}"`).join(","))
      .join("\r\n");
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
    <Box>
      <Typography variant="h4" sx={{ mb: 1 }}>
        Jobs Analytics
      </Typography>

      <Box sx={{ display: "flex", gap: 2, mb: 2, flexDirection: { xs: "column", md: "row" } }}>
        <Box sx={{ width: { xs: "100%", md: "33%" } }}>
          <NextDeadlinesWidget />
        </Box>
        <Box sx={{ width: { xs: "100%", md: "67%" } }}>
          <DeadlineCalendar />
        </Box>
      </Box>

      {loading ? <LinearProgress sx={{ mb: 2 }} /> : null}

      {/* --- Application Funnel --- */}
      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6">Application Funnel</Typography>
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
                  <TableCell>Total</TableCell>
                  <TableCell align="right">{total}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6">Avg response (by company)</Typography>
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

        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6">Success rate by industry</Typography>
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
      </Grid>

      {/* --- Benchmark & Weekly Application Volume --- */}
      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6">Application volume (last 12 weeks)</Typography>
            <Divider sx={{ my: 1 }} />
            <Box sx={{ display: "flex", gap: 1, alignItems: "flex-end", height: 120 }}>
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
                  <Typography variant="caption">{m.month.split("-")[1]}</Typography>
                </Box>
              ))}
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <BenchmarkCard jobs={jobs} />
        </Grid>
      </Grid>

      {/* --- Additional Analytics Sections --- */}
      <Grid container spacing={2} sx={{ mb: 2, mt: 2 }}>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6">Response Rate</Typography>
            <Divider sx={{ my: 1 }} />
            <Typography variant="body1">{(responseRate * 100).toFixed(1)}%</Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6">Average Days per Stage</Typography>
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

        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6">Deadline Adherence</Typography>
            <Divider sx={{ my: 1 }} />
            <Typography variant="body1">
              {deadlineStats.met}/{deadlineStats.met + deadlineStats.missed} met (
              {(deadlineStats.adherence * 100).toFixed(1)}%)
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6">Time to Offer</Typography>
            <Divider sx={{ my: 1 }} />
            <Typography variant="body1">{timeToOffer.toFixed(1)} days</Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6">Recommendations</Typography>
            <Divider sx={{ my: 1 }} />
            <Box component="ul" sx={{ pl: 2, m: 0 }}>
              {recommendations.map((r, i) => (
                <li key={i}>
                  <Typography variant="body2">{r}</Typography>
                </li>
              ))}
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* --- Goals & Progress --- */}
      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item xs={12} md={12}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6">Goals & Progress</Typography>
            <Divider sx={{ my: 1 }} />
            <Typography variant="body2">Weekly application goal</Typography>
            <Box sx={{ display: "flex", gap: 1, alignItems: "center", mt: 1 }}>
              <TextField
                size="small"
                type="number"
                value={weeklyGoal}
                onChange={(e) => setWeeklyGoal(Number(e.target.value) || 0)}
              />
              <Button variant="contained" onClick={saveGoal}>
                Save
              </Button>
              <Button variant="outlined" onClick={exportCsv}>
                Export CSV
              </Button>
            </Box>
            <Typography sx={{ mt: 1 }} variant="caption">
              Progress this week: 0/{weeklyGoal}
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      <Typography color="text.secondary">
        Data is computed from your jobs list (scoped to your account). Benchmarks are basic static
        values for quick comparison.
      </Typography>
      {error ? <Typography color="error">{error}</Typography> : null}
    </Box>
  );
}
