/**
 * JOB OVERVIEW TAB
 * Displays job details, description, and quick information.
 */

import { Box, Paper, Typography, Stack, Chip } from "@mui/material";
import {
  LocationOn,
  AttachMoney,
  CalendarToday,
  Category,
  Work,
} from "@mui/icons-material";
import type { JobRow } from "@shared/types/database";

interface JobOverviewTabProps {
  job: JobRow;
  onUpdate?: (job: JobRow) => void;
}

export default function JobOverviewTab({ job }: JobOverviewTabProps) {
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
