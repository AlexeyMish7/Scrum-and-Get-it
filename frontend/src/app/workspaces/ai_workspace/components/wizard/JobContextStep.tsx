/**
 * JOB CONTEXT STEP
 * Step 3 of the generation wizard - allows users to link to an existing job or add a new one.
 */

import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Stack,
  Button,
} from "@mui/material";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import AddIcon from "@mui/icons-material/Add";
import { useAuth } from "@shared/context/AuthContext";
import { listJobs } from "@shared/services/dbMappers";
import JobFormDialog from "@job_pipeline/components/dialogs/JobFormDialog";
import type { JobRow } from "@shared/types/database";

/**
 * Job context data
 */
export interface JobContext {
  /** Optional job ID if selecting from saved jobs */
  jobId?: number;

  /** Company name */
  companyName?: string;

  /** Job title */
  jobTitle?: string;

  /** Job description text */
  jobDescription?: string;

  /** Key requirements extracted from job posting */
  keyRequirements?: string[];
}

/**
 * JobContextStep Props
 */
interface JobContextStepProps {
  /** Current job context data */
  jobContext: JobContext;

  /** Job context update handler */
  onUpdateContext: (context: JobContext) => void;
}

/**
 * JobContextStep Component
 *
 * Inputs:
 * - jobContext: Current job context data
 * - onUpdateContext: Callback to update job context
 *
 * Outputs:
 * - Job selection dropdown (fetches from database)
 * - "Add New Job" button opens dialog
 * - Calls onUpdateContext when job is selected
 */
export const JobContextStep: React.FC<JobContextStepProps> = ({
  jobContext,
  onUpdateContext,
}) => {
  const { user } = useAuth();
  const [savedJobs, setSavedJobs] = useState<JobRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [addJobDialogOpen, setAddJobDialogOpen] = useState(false);

  /**
   * Fetch user's saved jobs on mount
   */
  useEffect(() => {
    const fetchJobs = async () => {
      if (!user?.id) return;

      try {
        setLoading(true);
        const result = await listJobs(user.id, {
          order: { column: "created_at", ascending: false },
        });

        if (result.data) {
          setSavedJobs(result.data as JobRow[]);
        }
      } catch (error) {
        console.error("Failed to load jobs:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchJobs();
  }, [user?.id]);

  /**
   * Handle saved job selection
   * Populates form with job data when user selects from saved jobs
   */
  const handleJobSelect = (jobId: number | string) => {
    // Don't allow clearing selection (empty string)
    if (jobId === "" || jobId === "none") {
      return;
    }

    const job = savedJobs.find((j) => j.id === jobId);
    if (job) {
      onUpdateContext({
        jobId: Number(jobId),
        companyName: job.company_name || undefined,
        jobTitle: job.job_title || undefined,
        jobDescription: job.job_description || undefined,
        keyRequirements: undefined, // Will be extracted if description exists
      });
    }
  };

  /**
   * Handle adding a new job
   * Called when JobFormDialog successfully creates a job
   */
  const handleJobAdded = (newJob: JobRow) => {
    // Add new job to list
    setSavedJobs([newJob, ...savedJobs]);

    // Select the new job
    handleJobSelect(newJob.id);

    // Close dialog
    setAddJobDialogOpen(false);
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Job Context (Required)
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Select or create a job to tailor your resume for.
      </Typography>

      <Alert severity="info" icon={<InfoOutlinedIcon />} sx={{ mb: 3 }}>
        Your resume will be optimized for this specific job posting. Select an
        existing job or create a new one to continue.
      </Alert>

      {/* Show warning if no jobs exist */}
      {!loading && savedJobs.length === 0 && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          You don't have any saved jobs yet. Create your first job to generate a
          tailored resume.
        </Alert>
      )}

      <Stack spacing={3}>
        {/* Job selector */}
        <FormControl fullWidth required>
          <InputLabel>Select Job *</InputLabel>
          <Select
            value={jobContext.jobId || ""}
            label="Select Job *"
            onChange={(e) => handleJobSelect(e.target.value)}
            disabled={loading}
            error={!jobContext.jobId}
          >
            {savedJobs.length === 0 && (
              <MenuItem value="" disabled>
                <em>No jobs available - Create one below</em>
              </MenuItem>
            )}
            {savedJobs.map((job) => (
              <MenuItem key={job.id} value={job.id}>
                {job.job_title} at {job.company_name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Add new job button */}
        <Button
          variant={savedJobs.length === 0 ? "contained" : "outlined"}
          startIcon={<AddIcon />}
          onClick={() => setAddJobDialogOpen(true)}
          fullWidth
          color={savedJobs.length === 0 ? "primary" : "inherit"}
        >
          {savedJobs.length === 0 ? "Create Your First Job" : "Add New Job"}
        </Button>

        {/* Selected job details */}
        {jobContext.jobId && (
          <Box
            sx={{
              p: 2,
              border: 1,
              borderColor: "divider",
              borderRadius: 1,
              bgcolor: "background.default",
            }}
          >
            <Typography variant="subtitle2" gutterBottom>
              Selected Job:
            </Typography>
            <Typography variant="body2" color="text.secondary">
              <strong>Title:</strong> {jobContext.jobTitle}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              <strong>Company:</strong> {jobContext.companyName}
            </Typography>
            {jobContext.jobDescription && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                <strong>Description:</strong>{" "}
                {jobContext.jobDescription.substring(0, 150)}
                {jobContext.jobDescription.length > 150 ? "..." : ""}
              </Typography>
            )}
          </Box>
        )}
      </Stack>

      {/* Add Job Dialog - using the full JobFormDialog from job_pipeline */}
      <JobFormDialog
        open={addJobDialogOpen}
        onClose={() => setAddJobDialogOpen(false)}
        onSuccess={handleJobAdded}
      />
    </Box>
  );
};
