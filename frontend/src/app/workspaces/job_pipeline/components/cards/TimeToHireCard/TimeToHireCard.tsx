import { useState, useEffect, useMemo } from "react";
import {
  Paper,
  Typography,
  Box,
  CircularProgress,
  Alert,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Divider,
} from "@mui/material";
import {
  AccessTime as TimeIcon,
  TrendingUp as TrendIcon,
  Download as DownloadIcon,
  Lightbulb as LightbulbIcon,
} from "@mui/icons-material";
import crud from "@shared/services/crud";
import { useAuth } from "@shared/context/AuthContext";

// Industry benchmark data (in days) based on typical hiring timelines
const INDUSTRY_BENCHMARKS = {
  applied_to_phone: 7,
  phone_to_interview: 5,
  interview_to_offer: 10,
  total_process: 30,
};

interface JobRecord {
  id: string;
  company: string;
  title: string;
  status: string;
  created_at: string;
  updated_at: string;
  applied_date?: string;
  phone_screen_date?: string;
  interview_date?: string;
  offer_date?: string;
}

interface StageMetrics {
  stage: string;
  avgDays: number;
  benchmark: number;
  delta: number;
  status: "fast" | "normal" | "slow";
  count: number;
}

export default function TimeToHireCard() {
  const { session } = useAuth();

  const [jobs, setJobs] = useState<JobRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch all jobs with date tracking
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

  // Calculate time-to-hire metrics for each stage
  const metrics = useMemo<StageMetrics[]>(() => {
    // Filter jobs that have moved through stages
    const jobsWithPhoneScreen = jobs.filter(
      (job) => job.applied_date && job.phone_screen_date
    );
    const jobsWithInterview = jobs.filter(
      (job) => job.phone_screen_date && job.interview_date
    );
    const jobsWithOffer = jobs.filter(
      (job) => job.interview_date && job.offer_date
    );
    const jobsComplete = jobs.filter(
      (job) => job.applied_date && job.offer_date
    );

    // Helper to calculate average days between two date fields
    const calculateAvgDays = (
      jobList: JobRecord[],
      startField: keyof JobRecord,
      endField: keyof JobRecord
    ): number => {
      if (jobList.length === 0) return 0;

      const totalDays = jobList.reduce((sum, job) => {
        const start = new Date(job[startField] as string);
        const end = new Date(job[endField] as string);
        const days = Math.floor(
          (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
        );
        return sum + days;
      }, 0);

      return Math.round(totalDays / jobList.length);
    };

    // Helper to determine status based on delta from benchmark
    const getStatus = (delta: number): "fast" | "normal" | "slow" => {
      if (delta < -3) return "fast";
      if (delta > 5) return "slow";
      return "normal";
    };

    const appliedToPhone = calculateAvgDays(
      jobsWithPhoneScreen,
      "applied_date",
      "phone_screen_date"
    );
    const phoneToInterview = calculateAvgDays(
      jobsWithInterview,
      "phone_screen_date",
      "interview_date"
    );
    const interviewToOffer = calculateAvgDays(
      jobsWithOffer,
      "interview_date",
      "offer_date"
    );
    const totalTime = calculateAvgDays(
      jobsComplete,
      "applied_date",
      "offer_date"
    );

    return [
      {
        stage: "Applied → Phone Screen",
        avgDays: appliedToPhone,
        benchmark: INDUSTRY_BENCHMARKS.applied_to_phone,
        delta: appliedToPhone - INDUSTRY_BENCHMARKS.applied_to_phone,
        status: getStatus(
          appliedToPhone - INDUSTRY_BENCHMARKS.applied_to_phone
        ),
        count: jobsWithPhoneScreen.length,
      },
      {
        stage: "Phone Screen → Interview",
        avgDays: phoneToInterview,
        benchmark: INDUSTRY_BENCHMARKS.phone_to_interview,
        delta: phoneToInterview - INDUSTRY_BENCHMARKS.phone_to_interview,
        status: getStatus(
          phoneToInterview - INDUSTRY_BENCHMARKS.phone_to_interview
        ),
        count: jobsWithInterview.length,
      },
      {
        stage: "Interview → Offer",
        avgDays: interviewToOffer,
        benchmark: INDUSTRY_BENCHMARKS.interview_to_offer,
        delta: interviewToOffer - INDUSTRY_BENCHMARKS.interview_to_offer,
        status: getStatus(
          interviewToOffer - INDUSTRY_BENCHMARKS.interview_to_offer
        ),
        count: jobsWithOffer.length,
      },
      {
        stage: "Total Process",
        avgDays: totalTime,
        benchmark: INDUSTRY_BENCHMARKS.total_process,
        delta: totalTime - INDUSTRY_BENCHMARKS.total_process,
        status: getStatus(totalTime - INDUSTRY_BENCHMARKS.total_process),
        count: jobsComplete.length,
      },
    ];
  }, [jobs]);

  // Generate AI insights based on metrics
  const insights = useMemo<string[]>(() => {
    const tips: string[] = [];

    const slowStages = metrics.filter((m) => m.status === "slow");
    const fastStages = metrics.filter((m) => m.status === "fast");

    if (slowStages.length > 0) {
      const slowestStage = slowStages.reduce((prev, curr) =>
        curr.delta > prev.delta ? curr : prev
      );
      tips.push(
        `Your ${slowestStage.stage} stage is ${slowestStage.delta} days slower than average. Consider following up more proactively or streamlining your preparation.`
      );
    }

    if (fastStages.length > 0) {
      tips.push(
        `You're moving quickly through ${fastStages
          .map((s) => s.stage)
          .join(", ")}. Great job staying responsive!`
      );
    }

    const totalMetric = metrics.find((m) => m.stage === "Total Process");
    if (totalMetric && totalMetric.count > 0) {
      if (totalMetric.avgDays > 45) {
        tips.push(
          "Your overall hiring process is taking longer than typical. Focus on companies with faster timelines or negotiate deadlines if you have multiple offers."
        );
      } else if (totalMetric.avgDays < 20) {
        tips.push(
          "You're moving through hiring processes quickly! Make sure you're doing thorough research before accepting offers."
        );
      }
    }

    if (tips.length === 0) {
      tips.push(
        "Your hiring timeline is within normal ranges. Keep tracking dates to identify any bottlenecks as your job search progresses."
      );
    }

    return tips;
  }, [metrics]);

  // Export functionality
  const handleExportJSON = () => {
    const exportData = {
      generatedAt: new Date().toISOString(),
      metrics,
      benchmarks: INDUSTRY_BENCHMARKS,
      insights,
      jobCount: jobs.length,
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `time-to-hire-analytics-${
      new Date().toISOString().split("T")[0]
    }.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportCSV = () => {
    const headers = [
      "Stage",
      "Average Days",
      "Benchmark (Days)",
      "Delta (Days)",
      "Status",
      "Sample Size",
    ];
    const rows = metrics.map((m) => [
      m.stage,
      m.avgDays,
      m.benchmark,
      m.delta,
      m.status,
      m.count,
    ]);

    const csv = [headers, ...rows].map((row) => row.join(",")).join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `time-to-hire-analytics-${
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
          Loading time-to-hire analytics...
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
        <TimeIcon color="primary" />
        <Typography variant="h6" sx={{ flexGrow: 1 }}>
          Time-to-Hire Analytics
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
        Track how long you spend in each hiring stage compared to industry
        benchmarks. Identify bottlenecks and optimize your process.
      </Typography>

      {/* Metrics Table */}
      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Stage</TableCell>
              <TableCell align="right">Your Average</TableCell>
              <TableCell align="right">Industry Benchmark</TableCell>
              <TableCell align="right">Difference</TableCell>
              <TableCell align="right">Status</TableCell>
              <TableCell align="right">Sample Size</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {metrics.map((metric) => (
              <TableRow key={metric.stage}>
                <TableCell>
                  <Typography variant="body2" fontWeight="medium">
                    {metric.stage}
                  </Typography>
                </TableCell>
                <TableCell align="right">
                  <Typography variant="body2">
                    {metric.count > 0 ? `${metric.avgDays} days` : "N/A"}
                  </Typography>
                </TableCell>
                <TableCell align="right">
                  <Typography variant="body2" color="text.secondary">
                    {metric.benchmark} days
                  </Typography>
                </TableCell>
                <TableCell align="right">
                  {metric.count > 0 ? (
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 0.5,
                        justifyContent: "flex-end",
                      }}
                    >
                      <TrendIcon
                        fontSize="small"
                        sx={{
                          color:
                            metric.delta < 0
                              ? "success.main"
                              : metric.delta > 5
                              ? "error.main"
                              : "text.secondary",
                          transform:
                            metric.delta < 0 ? "rotate(180deg)" : "none",
                        }}
                      />
                      <Typography
                        variant="body2"
                        sx={{
                          color:
                            metric.delta < 0
                              ? "success.main"
                              : metric.delta > 5
                              ? "error.main"
                              : "text.secondary",
                        }}
                      >
                        {metric.delta > 0 ? "+" : ""}
                        {metric.delta} days
                      </Typography>
                    </Box>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      N/A
                    </Typography>
                  )}
                </TableCell>
                <TableCell align="right">
                  {metric.count > 0 ? (
                    <Chip
                      label={metric.status}
                      size="small"
                      color={
                        metric.status === "fast"
                          ? "success"
                          : metric.status === "slow"
                          ? "error"
                          : "default"
                      }
                    />
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      N/A
                    </Typography>
                  )}
                </TableCell>
                <TableCell align="right">
                  <Typography variant="body2" color="text.secondary">
                    {metric.count} jobs
                  </Typography>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

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
