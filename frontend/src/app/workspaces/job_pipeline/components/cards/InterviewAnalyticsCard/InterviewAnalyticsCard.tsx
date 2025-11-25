/**
 * InterviewAnalyticsCard — Interview performance tracking and AI-powered prep
 *
 * Purpose: Track interview success metrics and provide actionable insights
 * Features: Conversion rates, performance by company/industry, AI interview tips
 *
 * Data: Uses existing job data and interview funnel metrics
 * AI: Generates personalized interview preparation recommendations
 *
 * Contract:
 * - Inputs: User ID (from auth context), job data from database
 * - Outputs: Interview metrics, success patterns, preparation tips
 * - Export: JSON/CSV download of interview analytics
 */

import { useEffect, useState, useMemo } from "react";
import {
  Box,
  Typography,
  Paper,
  Grid,
  Alert,
  Divider,
  Stack,
  Chip,
  LinearProgress,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  Button,
  Table,
  TableBody,
  TableRow,
  TableCell,
} from "@mui/material";
import {
  Phone as PhoneIcon,
  Work as InterviewIcon,
  CheckCircle as OfferIcon,
  TrendingUp as TrendingIcon,
  Psychology as AIIcon,
  Download as DownloadIcon,
  EmojiEvents as SuccessIcon,
} from "@mui/icons-material";
import { useAuth } from "@shared/context/AuthContext";
import crud from "@shared/services/crud";

interface InterviewMetrics {
  totalInterviews: number;
  phoneScreens: number;
  onSiteInterviews: number;
  offers: number;
  phoneToInterview: number;
  interviewToOffer: number;
  overallSuccess: number;
}

interface CompanyPerformance {
  company: string;
  interviews: number;
  offers: number;
  successRate: number;
}

interface JobRecord {
  id: number;
  job_title?: string;
  company_name?: string;
  industry?: string;
  job_status?: string;
  created_at?: string;
  status_changed_at?: string;
}

export default function InterviewAnalyticsCard() {
  const { user } = useAuth();

  // State
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [jobs, setJobs] = useState<JobRecord[]>([]);

  // Load jobs data
  useEffect(() => {
    if (!user?.id) return;

    const loadJobs = async () => {
      setLoading(true);
      setError(null);

      try {
        const userCrud = crud.withUser(user.id);
        const result = await userCrud.listRows<JobRecord>(
          "jobs",
          "id, job_title, company_name, industry, job_status, created_at, status_changed_at"
        );

        if (result.error) {
          throw new Error(result.error.message);
        }

        setJobs(result.data || []);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load interview data"
        );
      } finally {
        setLoading(false);
      }
    };

    loadJobs();
  }, [user?.id]);

  // Calculate interview metrics
  const metrics: InterviewMetrics = useMemo(() => {
    const statusLower = (job: JobRecord) =>
      (job.job_status || "").toLowerCase();

    const phoneScreens = jobs.filter((j) =>
      ["phone screen", "interview", "offer"].includes(statusLower(j))
    ).length;

    const interviews = jobs.filter((j) =>
      ["interview", "offer"].includes(statusLower(j))
    ).length;

    const offers = jobs.filter((j) => statusLower(j) === "offer").length;

    return {
      totalInterviews: interviews + phoneScreens,
      phoneScreens,
      onSiteInterviews: interviews,
      offers,
      phoneToInterview: phoneScreens > 0 ? interviews / phoneScreens : 0,
      interviewToOffer: interviews > 0 ? offers / interviews : 0,
      overallSuccess: phoneScreens > 0 ? offers / phoneScreens : 0,
    };
  }, [jobs]);

  // Performance by company
  const companyPerformance: CompanyPerformance[] = useMemo(() => {
    const companyMap = new Map<
      string,
      { interviews: number; offers: number }
    >();

    jobs.forEach((job) => {
      const company = job.company_name || "Unknown";
      const status = (job.job_status || "").toLowerCase();

      if (["phone screen", "interview", "offer"].includes(status)) {
        const data = companyMap.get(company) || { interviews: 0, offers: 0 };
        data.interviews += 1;

        if (status === "offer") {
          data.offers += 1;
        }

        companyMap.set(company, data);
      }
    });

    return Array.from(companyMap.entries())
      .map(([company, data]) => ({
        company,
        interviews: data.interviews,
        offers: data.offers,
        successRate: data.interviews > 0 ? data.offers / data.interviews : 0,
      }))
      .sort((a, b) => b.successRate - a.successRate)
      .slice(0, 10);
  }, [jobs]);

  // AI-powered interview tips based on metrics
  const aiTips = useMemo(() => {
    const tips: string[] = [];

    // Phone to interview conversion
    if (metrics.phoneToInterview < 0.4 && metrics.phoneScreens >= 3) {
      tips.push(
        "🎯 Low phone screen → interview rate. Focus on: (1) Demonstrating enthusiasm and culture fit, (2) Asking insightful questions about the role, (3) Clearly articulating your value proposition."
      );
    } else if (metrics.phoneToInterview >= 0.6) {
      tips.push(
        "✅ Strong phone screen performance! You're effectively communicating your fit during initial conversations."
      );
    }

    // Interview to offer conversion
    if (metrics.interviewToOffer < 0.25 && metrics.onSiteInterviews >= 3) {
      tips.push(
        "📚 Interview → offer conversion needs improvement. Tips: (1) Practice behavioral STAR responses, (2) Research company deeply before interviews, (3) Follow up with thoughtful thank-you notes, (4) Ask for feedback after rejections."
      );
    } else if (metrics.interviewToOffer >= 0.4) {
      tips.push(
        "🌟 Excellent interview-to-offer rate! Your interview skills are a strong asset."
      );
    }

    // Overall performance
    if (metrics.overallSuccess >= 0.2 && metrics.phoneScreens >= 5) {
      tips.push(
        "🚀 Outstanding overall success rate! Your preparation and presentation are working well. Keep applying your current strategy."
      );
    }

    // Generic advice if no specific patterns
    if (tips.length === 0) {
      tips.push(
        "💡 Build interview data by applying to more positions and requesting feedback after each interview to identify improvement areas."
      );
      tips.push(
        "📖 Prepare STAR stories (Situation, Task, Action, Result) for common behavioral questions to improve interview performance."
      );
    }

    return tips;
  }, [metrics]);

  // Export as JSON
  const handleExportJSON = () => {
    const data = {
      generatedAt: new Date().toISOString(),
      metrics,
      companyPerformance,
      aiTips,
      totalJobs: jobs.length,
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `interview_analytics_${new Date()
      .toISOString()
      .slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Export as CSV
  const handleExportCSV = () => {
    const rows: string[][] = [];
    rows.push(["Interview Analytics Report"]);
    rows.push(["Generated", new Date().toISOString()]);
    rows.push([]);
    rows.push(["Overall Metrics"]);
    rows.push(["Phone Screens", String(metrics.phoneScreens)]);
    rows.push(["Interviews", String(metrics.onSiteInterviews)]);
    rows.push(["Offers", String(metrics.offers)]);
    rows.push([
      "Phone → Interview",
      `${(metrics.phoneToInterview * 100).toFixed(1)}%`,
    ]);
    rows.push([
      "Interview → Offer",
      `${(metrics.interviewToOffer * 100).toFixed(1)}%`,
    ]);
    rows.push([]);
    rows.push(["Company Performance"]);
    rows.push(["Company", "Interviews", "Offers", "Success Rate"]);

    companyPerformance.forEach((perf) => {
      rows.push([
        perf.company,
        String(perf.interviews),
        String(perf.offers),
        `${(perf.successRate * 100).toFixed(1)}%`,
      ]);
    });

    const csv = rows.map((r) => r.join(",")).join("\r\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `interview_analytics_${new Date()
      .toISOString()
      .slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Paper
      elevation={3}
      sx={{ p: 4, borderRadius: 4, backgroundColor: "#fff" }}
    >
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
        <InterviewIcon color="primary" />
        <Typography variant="h6" fontWeight={600}>
          Interview Performance
        </Typography>
        <Chip label="AI-Powered" size="small" color="primary" />
      </Stack>

      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Track your interview conversion rates and get AI-powered tips to improve
        your performance.
      </Typography>

      {loading && <LinearProgress sx={{ mb: 2 }} />}

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {!loading && metrics.totalInterviews === 0 && (
        <Alert severity="info" sx={{ mb: 2 }}>
          No interview data available yet. Keep applying and updating job
          statuses to track your interview performance.
        </Alert>
      )}

      {!loading && metrics.totalInterviews > 0 && (
        <Box>
          {/* Key Metrics */}
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid size={{ xs: 6, sm: 3 }}>
              <Card variant="outlined">
                <CardContent>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <PhoneIcon fontSize="small" color="action" />
                    <Typography variant="caption" color="text.secondary">
                      Phone Screens
                    </Typography>
                  </Stack>
                  <Typography variant="h5" fontWeight={600}>
                    {metrics.phoneScreens}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid size={{ xs: 6, sm: 3 }}>
              <Card variant="outlined">
                <CardContent>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <InterviewIcon fontSize="small" color="action" />
                    <Typography variant="caption" color="text.secondary">
                      Interviews
                    </Typography>
                  </Stack>
                  <Typography variant="h5" fontWeight={600}>
                    {metrics.onSiteInterviews}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid size={{ xs: 6, sm: 3 }}>
              <Card variant="outlined">
                <CardContent>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <OfferIcon fontSize="small" color="success" />
                    <Typography variant="caption" color="text.secondary">
                      Offers
                    </Typography>
                  </Stack>
                  <Typography
                    variant="h5"
                    fontWeight={600}
                    color="success.main"
                  >
                    {metrics.offers}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid size={{ xs: 6, sm: 3 }}>
              <Card variant="outlined">
                <CardContent>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <SuccessIcon fontSize="small" color="warning" />
                    <Typography variant="caption" color="text.secondary">
                      Success Rate
                    </Typography>
                  </Stack>
                  <Typography variant="h5" fontWeight={600}>
                    {(metrics.overallSuccess * 100).toFixed(0)}%
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          <Divider sx={{ my: 3 }} />

          {/* Export Buttons */}
          <Stack
            direction="row"
            spacing={1}
            justifyContent="flex-end"
            sx={{ mb: 3 }}
          >
            <Button
              size="small"
              startIcon={<DownloadIcon />}
              onClick={handleExportJSON}
            >
              Export JSON
            </Button>
            <Button
              size="small"
              startIcon={<DownloadIcon />}
              onClick={handleExportCSV}
            >
              Export CSV
            </Button>
          </Stack>

          {/* Conversion Funnel */}
          <Box sx={{ mb: 3 }}>
            <Stack
              direction="row"
              alignItems="center"
              spacing={1}
              sx={{ mb: 2 }}
            >
              <TrendingIcon color="info" />
              <Typography variant="subtitle1" fontWeight={600}>
                Conversion Funnel
              </Typography>
            </Stack>

            <Stack spacing={2}>
              <Box>
                <Stack
                  direction="row"
                  justifyContent="space-between"
                  alignItems="center"
                  sx={{ mb: 0.5 }}
                >
                  <Typography variant="body2">
                    Phone Screen → Interview
                  </Typography>
                  <Typography variant="body2" fontWeight={600}>
                    {(metrics.phoneToInterview * 100).toFixed(1)}%
                  </Typography>
                </Stack>
                <LinearProgress
                  variant="determinate"
                  value={metrics.phoneToInterview * 100}
                  sx={{ height: 8, borderRadius: 1 }}
                />
              </Box>

              <Box>
                <Stack
                  direction="row"
                  justifyContent="space-between"
                  alignItems="center"
                  sx={{ mb: 0.5 }}
                >
                  <Typography variant="body2">Interview → Offer</Typography>
                  <Typography variant="body2" fontWeight={600}>
                    {(metrics.interviewToOffer * 100).toFixed(1)}%
                  </Typography>
                </Stack>
                <LinearProgress
                  variant="determinate"
                  value={metrics.interviewToOffer * 100}
                  sx={{ height: 8, borderRadius: 1 }}
                  color="success"
                />
              </Box>
            </Stack>
          </Box>

          <Divider sx={{ my: 3 }} />

          {/* Company Performance */}
          {companyPerformance.length > 0 && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                Performance by Company
              </Typography>
              <Table size="small">
                <TableBody>
                  {companyPerformance.slice(0, 5).map((perf, idx) => (
                    <TableRow key={idx}>
                      <TableCell>{perf.company}</TableCell>
                      <TableCell align="right">
                        {perf.interviews} interview
                        {perf.interviews > 1 ? "s" : ""}
                      </TableCell>
                      <TableCell align="right">
                        {perf.offers} offer{perf.offers > 1 ? "s" : ""}
                      </TableCell>
                      <TableCell align="right">
                        <Chip
                          label={`${(perf.successRate * 100).toFixed(0)}%`}
                          size="small"
                          color={
                            perf.successRate >= 0.5 ? "success" : "default"
                          }
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          )}

          <Divider sx={{ my: 3 }} />

          {/* AI Interview Tips */}
          <Box>
            <Stack
              direction="row"
              alignItems="center"
              spacing={1}
              sx={{ mb: 2 }}
            >
              <AIIcon color="success" />
              <Typography variant="subtitle1" fontWeight={600}>
                AI Interview Preparation Tips
              </Typography>
            </Stack>

            <List dense>
              {aiTips.map((tip, idx) => (
                <ListItem key={idx}>
                  <ListItemText
                    primary={tip}
                    primaryTypographyProps={{ variant: "body2" }}
                  />
                </ListItem>
              ))}
            </List>
          </Box>
        </Box>
      )}
    </Paper>
  );
}
