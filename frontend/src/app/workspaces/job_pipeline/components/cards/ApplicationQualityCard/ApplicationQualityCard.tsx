/**
 * ApplicationQualityCard — Application quality metrics and success correlation
 *
 * Purpose: Analyze application quality indicators and their correlation with success
 * Features: Match scores, tailoring metrics, document completeness, success patterns
 *
 * Data: Uses analytics_cache for match scores and job materials
 * AI: Provides recommendations for improving application quality
 *
 * Contract:
 * - Inputs: User ID, jobs with analytics data
 * - Outputs: Quality metrics, success correlations, improvement recommendations
 * - Export: JSON/CSV download of quality analysis
 */

import { useMemo } from "react";
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
} from "@mui/material";
import {
  Assessment as QualityIcon,
  TrendingUp as TrendingIcon,
  Psychology as AIIcon,
  Download as DownloadIcon,
  CheckCircle as SuccessIcon,
  Star as MatchIcon,
} from "@mui/icons-material";
import { useAuth } from "@shared/context/AuthContext";
import {
  useAnalyticsCacheDocumentMatchScores,
  useCoreJobs,
} from "@shared/cache/coreHooks";

interface QualityMetrics {
  avgMatchScore: number;
  applicationsWithScores: number;
  highQualityApps: number; // Match score >= 70
  mediumQualityApps: number; // 50-69
  lowQualityApps: number; // < 50
  successRateByQuality: {
    high: number;
    medium: number;
    low: number;
  };
}

interface JobRecord {
  id: number;
  job_title?: string;
  company_name?: string;
  job_status?: string;
  created_at?: string;
}

interface AnalyticsCache {
  job_id: number;
  analytics_type: string;
  data: Record<string, unknown>;
  match_score?: number;
  created_at: string;
}

const EMPTY_JOBS: JobRecord[] = [];
const EMPTY_CACHE: AnalyticsCache[] = [];

export default function ApplicationQualityCard() {
  const { user } = useAuth();

  const jobsQuery = useCoreJobs<JobRecord>(user?.id);
  const analyticsQuery = useAnalyticsCacheDocumentMatchScores<AnalyticsCache>(
    user?.id
  );

  const jobs = jobsQuery.data ?? EMPTY_JOBS;
  const analyticsCache = analyticsQuery.data ?? EMPTY_CACHE;

  const loading = jobsQuery.isFetching || analyticsQuery.isFetching;
  // We require jobs; analytics cache is a "nice to have" for this card.
  const error = user?.id
    ? jobsQuery.isError
      ? jobsQuery.error?.message ?? "Failed to load jobs"
      : null
    : null;

  // Calculate quality metrics
  const metrics: QualityMetrics = useMemo(() => {
    const jobsWithScores = analyticsCache.filter(
      (cache) => cache.match_score != null
    );

    const avgScore =
      jobsWithScores.length > 0
        ? jobsWithScores.reduce(
            (sum, cache) => sum + (cache.match_score ?? 0),
            0
          ) / jobsWithScores.length
        : 0;

    const highQuality = jobsWithScores.filter(
      (cache) => (cache.match_score ?? 0) >= 70
    );
    const mediumQuality = jobsWithScores.filter(
      (cache) => (cache.match_score ?? 0) >= 50 && (cache.match_score ?? 0) < 70
    );
    const lowQuality = jobsWithScores.filter(
      (cache) => (cache.match_score ?? 0) < 50
    );

    // Calculate success rates by quality tier
    const getSuccessRate = (caches: AnalyticsCache[]) => {
      if (caches.length === 0) return 0;

      const successfulJobs = caches.filter((cache) => {
        const job = jobs.find((j) => j.id === cache.job_id);
        return (
          job &&
          ["offer", "interview"].includes((job.job_status || "").toLowerCase())
        );
      });

      return successfulJobs.length / caches.length;
    };

    return {
      avgMatchScore: Math.round(avgScore),
      applicationsWithScores: jobsWithScores.length,
      highQualityApps: highQuality.length,
      mediumQualityApps: mediumQuality.length,
      lowQualityApps: lowQuality.length,
      successRateByQuality: {
        high: getSuccessRate(highQuality),
        medium: getSuccessRate(mediumQuality),
        low: getSuccessRate(lowQuality),
      },
    };
  }, [analyticsCache, jobs]);

  // AI recommendations based on quality analysis
  const aiRecommendations = useMemo(() => {
    const recommendations: string[] = [];

    if (metrics.avgMatchScore < 60 && metrics.applicationsWithScores >= 3) {
      recommendations.push(
        "📊 Your average match score is below 60%. Focus on applying to jobs that better align with your skills and experience."
      );
    }

    if (metrics.lowQualityApps > metrics.highQualityApps) {
      recommendations.push(
        "🎯 You have more low-quality applications than high-quality ones. Try to be more selective and tailor each application to match job requirements closely."
      );
    }

    if (
      metrics.successRateByQuality.high >
        metrics.successRateByQuality.low * 2 &&
      metrics.highQualityApps >= 3
    ) {
      recommendations.push(
        "✅ High-quality applications (70+ match score) have significantly better success rates. Prioritize quality over quantity in your job search."
      );
    }

    if (metrics.applicationsWithScores < 5) {
      recommendations.push(
        "🔍 Generate match scores for more applications to get better insights into your application quality patterns."
      );
    }

    // Default advice if no specific patterns
    if (recommendations.length === 0) {
      recommendations.push(
        "💡 Continue generating match scores for your applications to identify quality patterns and optimize your job search strategy."
      );
      recommendations.push(
        "📝 Tailor your resume and cover letter for each application to improve match scores and success rates."
      );
    }

    return recommendations;
  }, [metrics]);

  // Export as JSON
  const handleExportJSON = () => {
    const data = {
      generatedAt: new Date().toISOString(),
      metrics,
      aiRecommendations,
      jobsAnalyzed: jobs.length,
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `application_quality_${new Date()
      .toISOString()
      .slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Export as CSV
  const handleExportCSV = () => {
    const rows: string[][] = [];
    rows.push(["Application Quality Report"]);
    rows.push(["Generated", new Date().toISOString()]);
    rows.push([]);
    rows.push(["Overall Metrics"]);
    rows.push(["Avg Match Score", `${metrics.avgMatchScore}%`]);
    rows.push([
      "Applications Analyzed",
      String(metrics.applicationsWithScores),
    ]);
    rows.push([]);
    rows.push(["Quality Distribution"]);
    rows.push(["High Quality (70+)", String(metrics.highQualityApps)]);
    rows.push(["Medium Quality (50-69)", String(metrics.mediumQualityApps)]);
    rows.push(["Low Quality (<50)", String(metrics.lowQualityApps)]);
    rows.push([]);
    rows.push(["Success Rates by Quality"]);
    rows.push([
      "High Quality",
      `${(metrics.successRateByQuality.high * 100).toFixed(1)}%`,
    ]);
    rows.push([
      "Medium Quality",
      `${(metrics.successRateByQuality.medium * 100).toFixed(1)}%`,
    ]);
    rows.push([
      "Low Quality",
      `${(metrics.successRateByQuality.low * 100).toFixed(1)}%`,
    ]);

    const csv = rows.map((r) => r.join(",")).join("\r\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `application_quality_${new Date()
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
        <QualityIcon color="primary" />
        <Typography variant="h6" fontWeight={600}>
          Application Quality Score
        </Typography>
        <Chip label="AI-Powered" size="small" color="primary" />
      </Stack>

      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Analyze the quality of your applications based on match scores and
        correlate with success rates to optimize your strategy.
      </Typography>

      {loading && <LinearProgress sx={{ mb: 2 }} />}

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {!loading && metrics.applicationsWithScores === 0 && (
        <Alert severity="info" sx={{ mb: 2 }}>
          No match scores available yet. Generate match scores for your job
          applications to track quality metrics.
        </Alert>
      )}

      {!loading && metrics.applicationsWithScores > 0 && (
        <Box>
          {/* Summary Metrics */}
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid size={{ xs: 6, sm: 3 }}>
              <Card variant="outlined">
                <CardContent>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <MatchIcon fontSize="small" color="warning" />
                    <Typography variant="caption" color="text.secondary">
                      Avg Match Score
                    </Typography>
                  </Stack>
                  <Typography variant="h5" fontWeight={600}>
                    {metrics.avgMatchScore}%
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid size={{ xs: 6, sm: 3 }}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="caption" color="text.secondary">
                    Analyzed Apps
                  </Typography>
                  <Typography variant="h5" fontWeight={600}>
                    {metrics.applicationsWithScores}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid size={{ xs: 6, sm: 3 }}>
              <Card variant="outlined">
                <CardContent>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <SuccessIcon fontSize="small" color="success" />
                    <Typography variant="caption" color="text.secondary">
                      High Quality
                    </Typography>
                  </Stack>
                  <Typography
                    variant="h5"
                    fontWeight={600}
                    color="success.main"
                  >
                    {metrics.highQualityApps}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid size={{ xs: 6, sm: 3 }}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="caption" color="text.secondary">
                    Low Quality
                  </Typography>
                  <Typography variant="h5" fontWeight={600} color="error.main">
                    {metrics.lowQualityApps}
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

          {/* Quality Distribution */}
          <Box sx={{ mb: 3 }}>
            <Stack
              direction="row"
              alignItems="center"
              spacing={1}
              sx={{ mb: 2 }}
            >
              <TrendingIcon color="info" />
              <Typography variant="subtitle1" fontWeight={600}>
                Application Quality Distribution
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
                    High Quality (70+ match score)
                  </Typography>
                  <Typography variant="body2" fontWeight={600}>
                    {metrics.highQualityApps} (
                    {(
                      (metrics.highQualityApps /
                        metrics.applicationsWithScores) *
                      100
                    ).toFixed(0)}
                    %)
                  </Typography>
                </Stack>
                <LinearProgress
                  variant="determinate"
                  value={
                    (metrics.highQualityApps / metrics.applicationsWithScores) *
                    100
                  }
                  sx={{ height: 8, borderRadius: 1 }}
                  color="success"
                />
              </Box>

              <Box>
                <Stack
                  direction="row"
                  justifyContent="space-between"
                  alignItems="center"
                  sx={{ mb: 0.5 }}
                >
                  <Typography variant="body2">
                    Medium Quality (50-69 match score)
                  </Typography>
                  <Typography variant="body2" fontWeight={600}>
                    {metrics.mediumQualityApps} (
                    {(
                      (metrics.mediumQualityApps /
                        metrics.applicationsWithScores) *
                      100
                    ).toFixed(0)}
                    %)
                  </Typography>
                </Stack>
                <LinearProgress
                  variant="determinate"
                  value={
                    (metrics.mediumQualityApps /
                      metrics.applicationsWithScores) *
                    100
                  }
                  sx={{ height: 8, borderRadius: 1 }}
                  color="warning"
                />
              </Box>

              <Box>
                <Stack
                  direction="row"
                  justifyContent="space-between"
                  alignItems="center"
                  sx={{ mb: 0.5 }}
                >
                  <Typography variant="body2">
                    Low Quality (&lt;50 match score)
                  </Typography>
                  <Typography variant="body2" fontWeight={600}>
                    {metrics.lowQualityApps} (
                    {(
                      (metrics.lowQualityApps /
                        metrics.applicationsWithScores) *
                      100
                    ).toFixed(0)}
                    %)
                  </Typography>
                </Stack>
                <LinearProgress
                  variant="determinate"
                  value={
                    (metrics.lowQualityApps / metrics.applicationsWithScores) *
                    100
                  }
                  sx={{ height: 8, borderRadius: 1 }}
                  color="error"
                />
              </Box>
            </Stack>
          </Box>

          <Divider sx={{ my: 3 }} />

          {/* Success Rate Correlation */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle1" fontWeight={600} gutterBottom>
              Success Rate by Application Quality
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Correlation between match scores and interview/offer success
            </Typography>

            <Stack spacing={1.5}>
              <Stack direction="row" alignItems="center" spacing={2}>
                <Chip
                  label="High"
                  color="success"
                  size="small"
                  sx={{ width: 80 }}
                />
                <LinearProgress
                  variant="determinate"
                  value={metrics.successRateByQuality.high * 100}
                  sx={{ flex: 1, height: 8, borderRadius: 1 }}
                  color="success"
                />
                <Typography variant="body2" fontWeight={600} sx={{ width: 60 }}>
                  {(metrics.successRateByQuality.high * 100).toFixed(0)}%
                </Typography>
              </Stack>

              <Stack direction="row" alignItems="center" spacing={2}>
                <Chip
                  label="Medium"
                  color="warning"
                  size="small"
                  sx={{ width: 80 }}
                />
                <LinearProgress
                  variant="determinate"
                  value={metrics.successRateByQuality.medium * 100}
                  sx={{ flex: 1, height: 8, borderRadius: 1 }}
                  color="warning"
                />
                <Typography variant="body2" fontWeight={600} sx={{ width: 60 }}>
                  {(metrics.successRateByQuality.medium * 100).toFixed(0)}%
                </Typography>
              </Stack>

              <Stack direction="row" alignItems="center" spacing={2}>
                <Chip
                  label="Low"
                  color="error"
                  size="small"
                  sx={{ width: 80 }}
                />
                <LinearProgress
                  variant="determinate"
                  value={metrics.successRateByQuality.low * 100}
                  sx={{ flex: 1, height: 8, borderRadius: 1 }}
                  color="error"
                />
                <Typography variant="body2" fontWeight={600} sx={{ width: 60 }}>
                  {(metrics.successRateByQuality.low * 100).toFixed(0)}%
                </Typography>
              </Stack>
            </Stack>
          </Box>

          <Divider sx={{ my: 3 }} />

          {/* AI Recommendations */}
          <Box>
            <Stack
              direction="row"
              alignItems="center"
              spacing={1}
              sx={{ mb: 2 }}
            >
              <AIIcon color="success" />
              <Typography variant="subtitle1" fontWeight={600}>
                AI Recommendations
              </Typography>
            </Stack>

            <List dense>
              {aiRecommendations.map((rec, idx) => (
                <ListItem key={idx}>
                  <ListItemText
                    primary={rec}
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
