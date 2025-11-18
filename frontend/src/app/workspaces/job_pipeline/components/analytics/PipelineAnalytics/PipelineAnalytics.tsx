/**
 * PipelineAnalytics — AI-powered insights for job pipeline
 *
 * Purpose: Display AI-generated analytics and recommendations for the pipeline.
 * Shows match score distribution, skills gaps summary, and optimization suggestions.
 *
 * Contract:
 * - Inputs: jobs (array of job rows)
 * - Outputs: Analytics cards with AI insights
 * - Features: Match score distribution, skills analysis, pipeline health
 */

import { useMemo } from "react";
import {
  Box,
  Card,
  CardContent,
  Stack,
  Typography,
  LinearProgress,
  Chip,
  Alert,
} from "@mui/material";
import {
  TrendingUp as TrendingUpIcon,
  AutoAwesome as AIIcon,
} from "@mui/icons-material";
import type { JobRow } from "@shared/types/database";

interface PipelineAnalyticsProps {
  jobs: JobRow[];
  matchData?: Array<{
    jobId: number;
    score: number;
    breakdown?: Record<string, number>;
  }>;
  /** CUMULATIVE statistics from useJobsPipeline hook */
  cumulativeStats?: {
    total: number;
    interested: number;
    applied: number;
    phoneScreen: number;
    interview: number;
    offer: number;
    rejected: number;
    currentByStage: Record<string, number>;
  };
}

export default function PipelineAnalytics({
  jobs,
  matchData = [],
  cumulativeStats,
}: PipelineAnalyticsProps) {
  // Calculate pipeline metrics
  const metrics = useMemo(() => {
    const total = jobs.length;

    // Use cumulative stats if provided (from useJobsPipeline hook)
    // This fixes the bug where moving from "Applied" to "Phone Screen" incorrectly decrements applied count
    let applied = 0;
    let phoneScreen = 0;
    let interview = 0;
    let offer = 0;
    let byStage: Record<string, number> = {};

    if (cumulativeStats) {
      // Use cumulative counts (jobs that REACHED each stage)
      applied = cumulativeStats.applied;
      phoneScreen = cumulativeStats.phoneScreen;
      interview = cumulativeStats.interview;
      offer = cumulativeStats.offer;
      // Also build byStage from current stage counts for compatibility
      byStage = Object.entries(cumulativeStats.currentByStage).reduce(
        (acc, [stage, count]) => {
          acc[stage] = count as number;
          return acc;
        },
        {} as Record<string, number>
      );
    } else {
      // Fallback: count jobs CURRENTLY in each stage (old behavior)
      byStage = jobs.reduce((acc, job) => {
        const stage = job.job_status || "Interested";
        acc[stage] = (acc[stage] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      applied = byStage["Applied"] || 0;
      phoneScreen = byStage["Phone Screen"] || 0;
      interview = byStage["Interview"] || 0;
      offer = byStage["Offer"] || 0;
    }

    // Calculate conversion rates (FIXED: proper percentage calculations)
    // Application rate: percentage of total jobs that have been applied to (or beyond)
    const applicationRate = total > 0 ? (applied / total) * 100 : 0;
    // Phone screen rate: percentage of applied jobs that reached phone screens
    const phoneScreenRate = applied > 0 ? (phoneScreen / applied) * 100 : 0;
    // Interview rate: percentage of phone screens that converted to interviews
    const interviewRate = phoneScreen > 0 ? (interview / phoneScreen) * 100 : 0;
    // Offer rate: percentage of interviews that converted to offers
    const offerRate = interview > 0 ? (offer / interview) * 100 : 0;

    // AI match score analysis
    const avgMatchScore =
      matchData.length > 0
        ? matchData.reduce((sum, m) => sum + m.score, 0) / matchData.length
        : 0;

    const highMatches = matchData.filter((m) => m.score >= 70).length;
    const mediumMatches = matchData.filter(
      (m) => m.score >= 50 && m.score < 70
    ).length;
    const lowMatches = matchData.filter((m) => m.score < 50).length;

    return {
      total,
      byStage,
      phoneScreen,
      interview,
      applicationRate,
      phoneScreenRate,
      interviewRate,
      offerRate,
      avgMatchScore,
      highMatches,
      mediumMatches,
      lowMatches,
    };
  }, [jobs, matchData, cumulativeStats]);

  // AI-generated insights
  const insights = useMemo(() => {
    const results: Array<{
      type: "success" | "warning" | "info";
      message: string;
    }> = [];

    // Application rate insight
    if (metrics.applicationRate < 30) {
      results.push({
        type: "warning",
        message: `Low application rate (${metrics.applicationRate.toFixed(
          0
        )}%). Consider applying to more positions you've researched.`,
      });
    } else if (metrics.applicationRate > 70) {
      results.push({
        type: "success",
        message: `Strong application rate (${metrics.applicationRate.toFixed(
          0
        )}%). You're actively converting research into applications.`,
      });
    }

    // Match score insight
    if (metrics.avgMatchScore > 0) {
      if (metrics.avgMatchScore >= 70) {
        results.push({
          type: "success",
          message: `Excellent job targeting! Average match score: ${metrics.avgMatchScore.toFixed(
            0
          )}%. You're applying to well-aligned positions.`,
        });
      } else if (metrics.avgMatchScore < 50) {
        results.push({
          type: "warning",
          message: `Average match score is ${metrics.avgMatchScore.toFixed(
            0
          )}%. Consider focusing on positions that better align with your skills.`,
        });
      }
    }

    // Interview conversion insight
    if (metrics.phoneScreen > 0 && metrics.interviewRate < 40) {
      results.push({
        type: "info",
        message: `Phone screen to interview rate: ${metrics.interviewRate.toFixed(
          0
        )}%. Focus on improving phone screen performance.`,
      });
    }

    // Offer conversion insight
    if (metrics.interview > 0 && metrics.offerRate < 30) {
      results.push({
        type: "info",
        message: `Interview to offer rate: ${metrics.offerRate.toFixed(
          0
        )}%. Consider refining your interview preparation.`,
      });
    } else if (metrics.offerRate >= 50) {
      results.push({
        type: "success",
        message: `Outstanding interview performance! ${metrics.offerRate.toFixed(
          0
        )}% offer rate from interviews.`,
      });
    }

    return results;
  }, [metrics]);

  if (jobs.length === 0) return null;

  return (
    <Box sx={{ mb: 3 }}>
      <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
        {/* Pipeline Health Card */}
        <Card sx={{ flex: 1 }}>
          <CardContent>
            <Stack
              direction="row"
              alignItems="center"
              spacing={1}
              sx={{ mb: 2 }}
            >
              <TrendingUpIcon color="primary" />
              <Typography variant="h6">Pipeline Health</Typography>
            </Stack>

            <Stack spacing={2}>
              <Box>
                <Stack
                  direction="row"
                  justifyContent="space-between"
                  sx={{ mb: 0.5 }}
                >
                  <Typography variant="body2" color="text.secondary">
                    Application Rate
                  </Typography>
                  <Typography variant="body2" fontWeight={600}>
                    {metrics.applicationRate.toFixed(0)}%
                  </Typography>
                </Stack>
                <LinearProgress
                  variant="determinate"
                  value={Math.min(metrics.applicationRate, 100)}
                  color={metrics.applicationRate >= 50 ? "success" : "warning"}
                />
              </Box>

              <Box>
                <Stack
                  direction="row"
                  justifyContent="space-between"
                  sx={{ mb: 0.5 }}
                >
                  <Typography variant="body2" color="text.secondary">
                    Interview Conversion
                  </Typography>
                  <Typography variant="body2" fontWeight={600}>
                    {metrics.interviewRate.toFixed(0)}%
                  </Typography>
                </Stack>
                <LinearProgress
                  variant="determinate"
                  value={Math.min(metrics.interviewRate, 100)}
                  color={metrics.interviewRate >= 40 ? "success" : "info"}
                />
              </Box>

              <Box>
                <Stack
                  direction="row"
                  justifyContent="space-between"
                  sx={{ mb: 0.5 }}
                >
                  <Typography variant="body2" color="text.secondary">
                    Offer Rate
                  </Typography>
                  <Typography variant="body2" fontWeight={600}>
                    {metrics.offerRate.toFixed(0)}%
                  </Typography>
                </Stack>
                <LinearProgress
                  variant="determinate"
                  value={Math.min(metrics.offerRate, 100)}
                  color={metrics.offerRate >= 30 ? "success" : "warning"}
                />
              </Box>
            </Stack>
          </CardContent>
        </Card>

        {/* AI Match Analysis Card */}
        {matchData.length > 0 && (
          <Card sx={{ flex: 1 }}>
            <CardContent>
              <Stack
                direction="row"
                alignItems="center"
                spacing={1}
                sx={{ mb: 2 }}
              >
                <AIIcon color="secondary" />
                <Typography variant="h6">AI Match Analysis</Typography>
              </Stack>

              <Stack spacing={2}>
                <Box>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mb: 1 }}
                  >
                    Average Match Score
                  </Typography>
                  <Typography
                    variant="h4"
                    fontWeight={700}
                    color="primary.main"
                  >
                    {metrics.avgMatchScore.toFixed(0)}%
                  </Typography>
                </Box>

                <Stack direction="row" spacing={1}>
                  <Chip
                    label={`${metrics.highMatches} High (≥70%)`}
                    size="small"
                    color="success"
                    variant="outlined"
                  />
                  <Chip
                    label={`${metrics.mediumMatches} Medium`}
                    size="small"
                    color="warning"
                    variant="outlined"
                  />
                  <Chip
                    label={`${metrics.lowMatches} Low (<50%)`}
                    size="small"
                    color="error"
                    variant="outlined"
                  />
                </Stack>
              </Stack>
            </CardContent>
          </Card>
        )}

        {/* AI Insights Card */}
        {insights.length > 0 && (
          <Card sx={{ flex: 1 }}>
            <CardContent>
              <Stack
                direction="row"
                alignItems="center"
                spacing={1}
                sx={{ mb: 2 }}
              >
                <AIIcon color="info" />
                <Typography variant="h6">AI Insights</Typography>
              </Stack>

              <Stack spacing={1}>
                {insights.slice(0, 3).map((insight, idx) => (
                  <Alert
                    key={idx}
                    severity={insight.type}
                    sx={{
                      py: 0.5,
                      "& .MuiAlert-message": { fontSize: "0.875rem" },
                    }}
                  >
                    {insight.message}
                  </Alert>
                ))}
              </Stack>
            </CardContent>
          </Card>
        )}
      </Stack>
    </Box>
  );
}
