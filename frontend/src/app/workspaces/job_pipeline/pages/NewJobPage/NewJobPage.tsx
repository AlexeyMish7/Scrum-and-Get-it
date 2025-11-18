/**
 * NewJobPage - Wrapper component for adding new jobs
 *
 * This page now uses the reusable JobFormDialog component.
 * Kept as a separate route for backward compatibility, but the actual
 * form logic is in JobFormDialog which can be used in modals elsewhere.
 */

import { useState } from "react";
import { Box } from "@mui/material";
import { useNavigate } from "react-router-dom";
import JobFormDialog from "../../components/JobFormDialog";
import type { JobRow } from "@job_pipeline/types";

export default function NewJobPage() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(true);

  const handleClose = () => {
    setOpen(false);
    // Navigate back to pipeline when dialog closes
    navigate("/jobs/pipeline");
  };

  const handleSuccess = (job: JobRow) => {
    // Navigate to the new job's details page
    navigate(`/jobs/${job.id}`);
  };

  return (
    <Box>
      <JobFormDialog
        open={open}
        onClose={handleClose}
        onSuccess={handleSuccess}
      />
    </Box>
  );
}
