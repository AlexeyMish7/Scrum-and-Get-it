import { useState, useEffect, useMemo } from "react";
import {
  Paper,
  Typography,
  Box,
  CircularProgress,
  Alert,
  Chip,
  Grid,
  Button,
  Divider,
} from "@mui/material";
import {
  Email as ResponseIcon,
  TrendingUp as TrendUpIcon,
  TrendingDown as TrendDownIcon,
  Download as DownloadIcon,
  Lightbulb as LightbulbIcon,
} from "@mui/icons-material";
import crud from "@shared/services/crud";
import { useAuth } from "@shared/context/AuthContext";

interface JobRecord {
  id: string;
  company: string;
  title: string;
  status: string;
  created_at: string;
  applied_date?: string;
  phone_screen_date?: string;
  company_size?: string;
  industry?: string;
  job_type?: string;
  application_method?: string;
}

interface ResponseSegment {
  category: string;
  value: string;
  total: number;
  responded: number;
  responseRate: number;
  avgDaysToResponse: number;
}

export default function ResponseRateCard() {
  const { session } = useAuth();

  const [jobs, setJobs] = useState<JobRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch all jobs
  useEffect(() => {
    async function fetchJobs() {
      if (!session?.user?.id) {
        setError("Not authenticated");
        setLoading(false);
        return;
      }

      try {
        const userCrud = crud.withUser(session.user.id);
        const { data, error: fetchError } = await userCrud.listRows<JobRecord>(
          "jobs",
          "*"
        );

        if (fetchError) throw fetchError;
        setJobs(data ?? []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load jobs");
      } finally {
        setLoading(false);
      }
    }

    fetchJobs();
  }, [session?.user?.id]);

  // Calculate response rates segmented by various categories
  const segments = useMemo<ResponseSegment[]>(() => {
    const calculateSegment = (
      category: string,
      filterKey: keyof JobRecord,
      filterValue: string
    ): ResponseSegment => {
      const filtered = jobs.filter((job) => job[filterKey] === filterValue);
      const responded = filtered.filter((job) => job.phone_screen_date);

      // Calculate average days to response
      let avgDays = 0;
      if (responded.length > 0) {
        const totalDays = responded.reduce((sum, job) => {
          if (job.applied_date && job.phone_screen_date) {
            const applied = new Date(job.applied_date);
            const response = new Date(job.phone_screen_date);
            const days = Math.floor(
              (response.getTime() - applied.getTime()) / (1000 * 60 * 60 * 24)
            );
            return sum + days;
          }
          return sum;
        }, 0);
        avgDays = Math.round(totalDays / responded.length);
      }

      return {
        category,
        value: filterValue,
        total: filtered.length,
        responded: responded.length,
        responseRate:
          filtered.length > 0
            ? Math.round((responded.length / filtered.length) * 100)
            : 0,
        avgDaysToResponse: avgDays,
      };
    };

    const allSegments: ResponseSegment[] = [];

    // Company Size segments
    const sizes = [
      "Small (1-50)",
      "Medium (51-500)",
      "Large (500+)",
      "Unknown",
    ];
    sizes.forEach((size) => {
      const segment = calculateSegment("Company Size", "company_size", size);
      if (segment.total > 0) allSegments.push(segment);
    });

    // Industry segments (only if data exists)
    const industries = [
      ...new Set(jobs.map((j) => j.industry).filter(Boolean)),
    ];
    industries.forEach((industry) => {
      if (industry) {
        const segment = calculateSegment("Industry", "industry", industry);
        if (segment.total > 0) allSegments.push(segment);
      }
    });

    // Job Type segments
    const jobTypes = ["Full-time", "Part-time", "Contract", "Internship"];
    jobTypes.forEach((type) => {
      const segment = calculateSegment("Job Type", "job_type", type);
      if (segment.total > 0) allSegments.push(segment);
    });

    // Application Method segments
    const methods = [
      "Company Website",
      "LinkedIn",
      "Indeed",
      "Referral",
      "Recruiter",
    ];
    methods.forEach((method) => {
      const segment = calculateSegment(
        "Application Method",
        "application_method",
        method
      );
      if (segment.total > 0) allSegments.push(segment);
    });

    return allSegments.sort((a, b) => b.responseRate - a.responseRate);
  }, [jobs]);

  // Overall statistics
  const overallStats = useMemo(() => {
    const totalApplied = jobs.filter((j) => j.applied_date).length;
    const totalResponded = jobs.filter((j) => j.phone_screen_date).length;
    const overallRate =
      totalApplied > 0 ? Math.round((totalResponded / totalApplied) * 100) : 0;

    return {
      totalApplied,
      totalResponded,
      overallRate,
    };
  }, [jobs]);

  // Generate AI insights
  const insights = useMemo<string[]>(() => {
    const tips: string[] = [];

    if (segments.length === 0) {
      tips.push(
        "Start tracking company size, industry, and application method to identify which strategies yield the best response rates."
      );
      return tips;
    }

    // Find best performing segments
    const topSegments = segments.slice(0, 3);
    if (topSegments.length > 0 && topSegments[0].responseRate > 20) {
      tips.push(
        `Your highest response rate is ${topSegments[0].responseRate}% for ${topSegments[0].value} (${topSegments[0].category}). Focus more applications here.`
      );
    }

    // Find underperforming segments
    const lowSegments = segments.filter(
      (s) => s.responseRate < 10 && s.total >= 5
    );
    if (lowSegments.length > 0) {
      tips.push(
        `Low response rates from ${lowSegments
          .map((s) => s.value)
          .join(
            ", "
          )}. Consider revising your approach or targeting different opportunities.`
      );
    }

    // Application method insights
    const methodSegments = segments.filter(
      (s) => s.category === "Application Method"
    );
    if (methodSegments.length > 1) {
      const bestMethod = methodSegments[0];
      tips.push(
        `${bestMethod.value} has the best response rate (${bestMethod.responseRate}%). Prioritize this application channel.`
      );
    }

    // Response time insights
    const fastResponders = segments.filter(
      (s) => s.avgDaysToResponse < 5 && s.avgDaysToResponse > 0
    );
    if (fastResponders.length > 0) {
      tips.push(
        `${fastResponders
          .map((s) => s.value)
          .join(
            ", "
          )} typically respond within 5 days. Great for quick feedback loops.`
      );
    }

    if (tips.length === 0) {
      tips.push(
        "Your response rates are consistent across categories. Keep applying and track which approaches yield the best results."
      );
    }

    return tips;
  }, [segments]);

  // Export functionality
  const handleExportJSON = () => {
    const exportData = {
      generatedAt: new Date().toISOString(),
      overallStats,
      segments,
      insights,
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `response-rate-analytics-${
      new Date().toISOString().split("T")[0]
    }.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportCSV = () => {
    const headers = [
      "Category",
      "Value",
      "Total Applications",
      "Responses",
      "Response Rate (%)",
      "Avg Days to Response",
    ];
    const rows = segments.map((s) => [
      s.category,
      s.value,
      s.total,
      s.responded,
      s.responseRate,
      s.avgDaysToResponse,
    ]);

    const csv = [headers, ...rows].map((row) => row.join(",")).join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `response-rate-analytics-${
      new Date().toISOString().split("T")[0]
    }.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <Paper elevation={3} sx={{ p: 3, textAlign: "center" }}>
        <CircularProgress />
        <Typography sx={{ mt: 2 }}>
          Loading response rate analytics...
        </Typography>
      </Paper>
    );
  }

  if (error) {
    return (
      <Paper elevation={3} sx={{ p: 3 }}>
        <Alert severity="error">{error}</Alert>
      </Paper>
    );
  }

  return (
    <Paper elevation={3} sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
        <ResponseIcon color="primary" />
        <Typography variant="h6" sx={{ flexGrow: 1 }}>
          Response Rate Analytics
        </Typography>
        <Chip
          icon={<LightbulbIcon />}
          label="AI-Powered"
          color="primary"
          size="small"
          variant="outlined"
        />
        <Button
          startIcon={<DownloadIcon />}
          size="small"
          onClick={handleExportJSON}
        >
          JSON
        </Button>
        <Button
          startIcon={<DownloadIcon />}
          size="small"
          onClick={handleExportCSV}
        >
          CSV
        </Button>
      </Box>

      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Analyze which companies, industries, and application methods yield the
        best response rates.
      </Typography>

      {/* Overall Stats */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Paper variant="outlined" sx={{ p: 2, textAlign: "center" }}>
            <Typography variant="h4" color="primary">
              {overallStats.totalApplied}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Total Applications
            </Typography>
          </Paper>
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Paper variant="outlined" sx={{ p: 2, textAlign: "center" }}>
            <Typography variant="h4" color="success.main">
              {overallStats.totalResponded}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Responses Received
            </Typography>
          </Paper>
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Paper variant="outlined" sx={{ p: 2, textAlign: "center" }}>
            <Typography variant="h4" color="info.main">
              {overallStats.overallRate}%
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Overall Response Rate
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Segments Breakdown */}
      <Divider sx={{ mb: 2 }} />
      <Typography variant="subtitle2" sx={{ mb: 2 }}>
        Response Rates by Category
      </Typography>

      {segments.length === 0 ? (
        <Alert severity="info">
          No segmented data available. Make sure to track company size,
          industry, job type, and application method for your applications.
        </Alert>
      ) : (
        <Grid container spacing={2} sx={{ mb: 3 }}>
          {segments.map((segment, idx) => (
            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={idx}>
              <Paper variant="outlined" sx={{ p: 2 }}>
                <Box
                  sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}
                >
                  <Typography
                    variant="body2"
                    fontWeight="medium"
                    sx={{ flexGrow: 1 }}
                  >
                    {segment.value}
                  </Typography>
                  {segment.responseRate > 15 ? (
                    <TrendUpIcon fontSize="small" color="success" />
                  ) : segment.responseRate < 10 ? (
                    <TrendDownIcon fontSize="small" color="error" />
                  ) : null}
                </Box>
                <Typography variant="caption" color="text.secondary">
                  {segment.category}
                </Typography>
                <Box sx={{ mt: 1 }}>
                  <Typography variant="h6" color="primary">
                    {segment.responseRate}%
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {segment.responded} of {segment.total} applications
                  </Typography>
                </Box>
                {segment.avgDaysToResponse > 0 && (
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ mt: 1, display: "block" }}
                  >
                    Avg response: {segment.avgDaysToResponse} days
                  </Typography>
                )}
              </Paper>
            </Grid>
          ))}
        </Grid>
      )}

      {/* AI Insights */}
      <Divider sx={{ my: 3 }} />
      <Box>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
          <LightbulbIcon color="primary" fontSize="small" />
          <Typography variant="subtitle2">AI Insights</Typography>
        </Box>
        {insights.map((insight, idx) => (
          <Alert key={idx} severity="info" sx={{ mb: 1 }}>
            {insight}
          </Alert>
        ))}
      </Box>
    </Paper>
  );
}
