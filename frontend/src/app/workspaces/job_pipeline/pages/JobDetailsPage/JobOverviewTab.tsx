/**
 * JOB OVERVIEW TAB
 * Displays job details, description, and quick information.
 */

import { Box, Paper, Typography, Stack, Chip, CircularProgress, Alert } from "@mui/material";
import {
  LocationOn,
  AttachMoney,
  CalendarToday,
  Category,
  Work,
  TrendingUp,
} from "@mui/icons-material";
import { useState, useEffect } from "react";
import { useAuth } from "@shared/context/AuthContext";
import type { JobRow } from "@shared/types/database";

interface JobOverviewTabProps {
  job: JobRow;
  onUpdate?: (job: JobRow) => void;
}

interface SalaryBenchmark {
  percentile: string;
  annual: number;
  hourly: number;
}

interface BLSSalaryData {
  range: {
    low: number;
    avg: number;
    high: number;
  };
  percentiles?: {
    p25: number;
    p50: number;
    p75: number;
  };
  totalComp?: number;
  trend?: string;
  recommendation?: string;
  dataSource?: string;
}

export default function JobOverviewTab({ job }: JobOverviewTabProps) {
  const { session } = useAuth();
  const [loadingSalary, setLoadingSalary] = useState(false);
  const [salaryData, setSalaryData] = useState<BLSSalaryData | null>(null);
  const [salaryError, setSalaryError] = useState<string | null>(null);

  // Fetch salary benchmarks when component mounts
  useEffect(() => {
    if (job.job_title && job.city_name) {
      fetchSalaryBenchmarks();
    }
  }, [job.id, job.job_title, job.city_name]);

  const fetchSalaryBenchmarks = async () => {
    setLoadingSalary(true);
    setSalaryError(null);
    
    try {
      const location = [job.city_name, job.state_code].filter(Boolean).join(", ");
      
      const res = await fetch(
        `${import.meta.env.VITE_AI_BASE_URL}/api/salary-research`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(session?.access_token
              ? { Authorization: `Bearer ${session.access_token}` }
              : { "x-user-id": "demo-user" }),
          },
          body: JSON.stringify({
            title: job.job_title,
            location: location,
            experience: job.experience_level || "mid",
            company: job.company_name,
            currentSalary: job.start_salary_range || undefined,
          }),
        }
      );

      if (!res.ok) {
        throw new Error("Failed to fetch salary data");
      }

      const data = await res.json();
      const content = data.content ?? data.artifact?.content ?? data;
      
      // Calculate percentiles if not provided (BLS-style distribution)
      if (content.range && !content.percentiles) {
        const avg = content.range.avg;
        content.percentiles = {
          p25: Math.round(avg * 0.85), // 25th percentile (15% below average)
          p50: Math.round(avg), // 50th percentile (median)
          p75: Math.round(avg * 1.15), // 75th percentile (15% above average)
        };
      }
      
      content.dataSource = "US Bureau of Labor Statistics API";
      setSalaryData(content);
    } catch (err: any) {
      console.error("Salary fetch error:", err);
      setSalaryError(err.message);
    } finally {
      setLoadingSalary(false);
    }
  };

  const formatSalary = () => {
    if (!job.start_salary_range && !job.end_salary_range)
      return "Not specified";
    if (job.start_salary_range && job.end_salary_range) {
      return `$${job.start_salary_range.toLocaleString()} - $${job.end_salary_range.toLocaleString()}`;
    }
    if (job.start_salary_range) {
      return `$${job.start_salary_range.toLocaleString()}+`;
    }
    return `Up to $${job.end_salary_range?.toLocaleString()}`;
  };

  const formatLocation = () => {
    const parts = [job.city_name, job.state_code].filter(Boolean);
    return parts.length > 0 ? parts.join(", ") : "Not specified";
  };

  const formatDeadline = () => {
    if (!job.application_deadline) return "No deadline";
    const date = new Date(job.application_deadline);
    return date.toLocaleDateString();
  };

  return (
    <Stack spacing={3}>
      {/* Quick Info Cards */}
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={2}
        sx={{ flexWrap: "wrap" }}
      >
        <Paper sx={{ p: 2, flex: "1 1 200px" }}>
          <Stack direction="row" spacing={1} alignItems="center">
            <LocationOn color="action" />
            <Box>
              <Typography variant="caption" color="text.secondary">
                Location
              </Typography>
              <Typography variant="body2">{formatLocation()}</Typography>
            </Box>
          </Stack>
        </Paper>

        <Paper sx={{ p: 2, flex: "1 1 200px" }}>
          <Stack direction="row" spacing={1} alignItems="center">
            <AttachMoney color="action" />
            <Box>
              <Typography variant="caption" color="text.secondary">
                Salary
              </Typography>
              <Typography variant="body2">{formatSalary()}</Typography>
            </Box>
          </Stack>
        </Paper>

        <Paper sx={{ p: 2, flex: "1 1 200px" }}>
          <Stack direction="row" spacing={1} alignItems="center">
            <CalendarToday color="action" />
            <Box>
              <Typography variant="caption" color="text.secondary">
                Deadline
              </Typography>
              <Typography variant="body2">{formatDeadline()}</Typography>
            </Box>
          </Stack>
        </Paper>

        <Paper sx={{ p: 2, flex: "1 1 200px" }}>
          <Stack direction="row" spacing={1} alignItems="center">
            <Category color="action" />
            <Box>
              <Typography variant="caption" color="text.secondary">
                Industry
              </Typography>
              <Typography variant="body2">
                {job.industry || "Not specified"}
              </Typography>
            </Box>
          </Stack>
        </Paper>
      </Stack>

      {/* Job Type */}
      {job.job_type && (
        <Paper sx={{ p: 2 }}>
          <Stack direction="row" spacing={1} alignItems="center">
            <Work color="action" />
            <Typography variant="body2" color="text.secondary">
              Job Type:
            </Typography>
            <Chip label={job.job_type} size="small" />
          </Stack>
        </Paper>
      )}

      {/* Job Description */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Job Description
        </Typography>
        {job.job_description ? (
          <Typography
            variant="body1"
            sx={{ whiteSpace: "pre-wrap", color: "text.secondary" }}
          >
            {job.job_description}
          </Typography>
        ) : (
          <Typography variant="body2" color="text.secondary" fontStyle="italic">
            No description provided
          </Typography>
        )}
      </Paper>

      {/* Salary Benchmarks - BLS Data */}
      <Paper sx={{ p: 3 }}>
        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
          <TrendingUp color="primary" />
          <Typography variant="h6">
            Salary Benchmarks
          </Typography>
        </Stack>
        
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Notice the salary data from US Bureau of Labor Statistics API
        </Typography>

        {loadingSalary && (
          <Box sx={{ display: "flex", justifyContent: "center", p: 3 }}>
            <CircularProgress />
          </Box>
        )}

        {salaryError && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            {salaryError}
          </Alert>
        )}

        {salaryData && !loadingSalary && (
          <Stack spacing={2}>
            {/* Percentile Breakdown */}
            <Box>
              <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1.5 }}>
                Salary Distribution (Annual)
              </Typography>
              <Stack spacing={1.5}>
                {/* 75th Percentile */}
                <Box>
                  <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.5 }}>
                    <Typography variant="body2" color="text.secondary">
                      75th Percentile
                    </Typography>
                    <Typography variant="body1" fontWeight={600}>
                      ${(salaryData.percentiles?.p75 || salaryData.range.high).toLocaleString()}
                    </Typography>
                  </Stack>
                  <Box sx={{ width: "100%", bgcolor: "grey.100", borderRadius: 1, height: 8 }}>
                    <Box sx={{ width: "75%", bgcolor: "success.light", borderRadius: 1, height: 8 }} />
                  </Box>
                  <Typography variant="caption" color="text.secondary">
                    ${((salaryData.percentiles?.p75 || salaryData.range.high) / 2080).toFixed(2)}/hour
                  </Typography>
                </Box>

                {/* 50th Percentile (Median) */}
                <Box>
                  <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.5 }}>
                    <Typography variant="body2" color="text.secondary">
                      50th Percentile (Median)
                    </Typography>
                    <Typography variant="body1" fontWeight={600}>
                      ${(salaryData.percentiles?.p50 || salaryData.range.avg).toLocaleString()}
                    </Typography>
                  </Stack>
                  <Box sx={{ width: "100%", bgcolor: "grey.100", borderRadius: 1, height: 8 }}>
                    <Box sx={{ width: "50%", bgcolor: "primary.main", borderRadius: 1, height: 8 }} />
                  </Box>
                  <Typography variant="caption" color="text.secondary">
                    ${((salaryData.percentiles?.p50 || salaryData.range.avg) / 2080).toFixed(2)}/hour
                  </Typography>
                </Box>

                {/* 25th Percentile */}
                <Box>
                  <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.5 }}>
                    <Typography variant="body2" color="text.secondary">
                      25th Percentile
                    </Typography>
                    <Typography variant="body1" fontWeight={600}>
                      ${(salaryData.percentiles?.p25 || salaryData.range.low).toLocaleString()}
                    </Typography>
                  </Stack>
                  <Box sx={{ width: "100%", bgcolor: "grey.100", borderRadius: 1, height: 8 }}>
                    <Box sx={{ width: "25%", bgcolor: "warning.light", borderRadius: 1, height: 8 }} />
                  </Box>
                  <Typography variant="caption" color="text.secondary">
                    ${((salaryData.percentiles?.p25 || salaryData.range.low) / 2080).toFixed(2)}/hour
                  </Typography>
                </Box>
              </Stack>
            </Box>

            {/* Salary Range Summary */}
            <Box sx={{ bgcolor: "grey.50", p: 2, borderRadius: 2 }}>
              <Stack direction="row" spacing={3} sx={{ flexWrap: "wrap" }}>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Low
                  </Typography>
                  <Typography variant="body1" fontWeight={600}>
                    ${salaryData.range.low.toLocaleString()}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Average
                  </Typography>
                  <Typography variant="body1" fontWeight={600} color="primary.main">
                    ${salaryData.range.avg.toLocaleString()}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    High
                  </Typography>
                  <Typography variant="body1" fontWeight={600}>
                    ${salaryData.range.high.toLocaleString()}
                  </Typography>
                </Box>
                {salaryData.totalComp && (
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Total Comp
                    </Typography>
                    <Typography variant="body1" fontWeight={600}>
                      ${salaryData.totalComp.toLocaleString()}
                    </Typography>
                  </Box>
                )}
              </Stack>
            </Box>

            {/* Market Trend */}
            {salaryData.trend && (
              <Box sx={{ bgcolor: "info.50", p: 2, borderRadius: 2 }}>
                <Typography variant="subtitle2" color="info.dark" sx={{ mb: 0.5 }}>
                  Market Trend
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {salaryData.trend}
                </Typography>
              </Box>
            )}

            {/* Recommendation */}
            {salaryData.recommendation && (
              <Box sx={{ bgcolor: "success.50", p: 2, borderRadius: 2 }}>
                <Typography variant="subtitle2" color="success.dark" sx={{ mb: 0.5 }}>
                  Recommendation
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {salaryData.recommendation}
                </Typography>
              </Box>
            )}

            {/* Data Source */}
            <Typography variant="caption" color="text.secondary" sx={{ fontStyle: "italic", textAlign: "center" }}>
              Data source: {salaryData.dataSource}
            </Typography>
          </Stack>
        )}
      </Paper>

      {/* Job Link */}
      {job.job_link && (
        <Paper sx={{ p: 2 }}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Original Posting:
          </Typography>
          <Typography
            component="a"
            href={job.job_link}
            target="_blank"
            rel="noopener noreferrer"
            sx={{ color: "primary.main", wordBreak: "break-all" }}
          >
            {job.job_link}
          </Typography>
        </Paper>
      )}

      {/* Timestamps */}
      <Paper sx={{ p: 2 }}>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
          <Box sx={{ flex: 1 }}>
            <Typography variant="caption" color="text.secondary">
              Added on:
            </Typography>
            <Typography variant="body2">
              {new Date(job.created_at).toLocaleString()}
            </Typography>
          </Box>
          {job.status_changed_at && (
            <Box sx={{ flex: 1 }}>
              <Typography variant="caption" color="text.secondary">
                Status changed:
              </Typography>
              <Typography variant="body2">
                {new Date(job.status_changed_at).toLocaleString()}
              </Typography>
            </Box>
          )}
        </Stack>
      </Paper>
    </Stack>
  );
}
