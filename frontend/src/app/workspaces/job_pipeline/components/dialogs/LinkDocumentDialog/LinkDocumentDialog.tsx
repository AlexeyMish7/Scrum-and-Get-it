/**
 * Link Document to Job Dialog
 *
 * WHAT: Dialog to link an existing document to a job application
 * WHY: Allows users to associate specific resumes/cover letters with job applications
 *
 * Features:
 * - Select job from pipeline
 * - Choose link type (resume or cover letter)
 * - Creates job_materials entry
 *
 * Inputs: documentId, documentKind, open state, onClose callback
 * Outputs: Creates job_materials association
 * Errors: Displays error snackbar on failure
 */

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  RadioGroup,
  FormControlLabel,
  Radio,
  Typography,
  Box,
  CircularProgress,
  Alert,
} from "@mui/material";
import { useAuth } from "@shared/context/AuthContext";
import { listRows } from "@shared/services/crud";
import { addJobMaterials } from "@shared/services/jobMaterials";
import type { DocumentKind } from "@shared/services/documents";

interface Job {
  id: number;
  job_title: string;
  company_name: string;
  job_status: string;
}

interface LinkDocumentDialogProps {
  open: boolean;
  onClose: () => void;
  documentId: string;
  documentKind: DocumentKind;
  onSuccess?: () => void;
  onError?: (error: unknown) => void;
}

export default function LinkDocumentDialog({
  open,
  onClose,
  documentId,
  documentKind,
  onSuccess,
  onError,
}: LinkDocumentDialogProps) {
  const { user } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<number | "">("");
  const [linkType, setLinkType] = useState<"resume" | "cover">(
    documentKind === "cover_letter" ? "cover" : "resume"
  );
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const loadJobs = async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const result = await listRows<Job>(
        "jobs",
        "id,job_title,company_name,job_status",
        {
          order: { column: "created_at", ascending: false },
          limit: 100,
        }
      );
      if (result.error) throw new Error(result.error.message);
      setJobs(result.data || []);
    } catch (err) {
      if (onError) onError(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open && user?.id) {
      loadJobs();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, user?.id]);

  async function handleSubmit() {
    if (!user?.id || !selectedJobId) return;

    setSubmitting(true);
    try {
      const payload =
        linkType === "resume"
          ? { job_id: selectedJobId as number, resume_document_id: documentId }
          : { job_id: selectedJobId as number, cover_document_id: documentId };

      const result = await addJobMaterials(user.id, payload);
      if (result.error) throw new Error(result.error.message);

      if (onSuccess) onSuccess();
      handleClose();
    } catch (err) {
      if (onError) onError(err);
    } finally {
      setSubmitting(false);
    }
  }

  function handleClose() {
    setSelectedJobId("");
    setLinkType(documentKind === "cover_letter" ? "cover" : "resume");
    onClose();
  }

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Link Document to Job</DialogTitle>
      <DialogContent>
        <Box sx={{ pt: 1 }}>
          {loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 3 }}>
              <CircularProgress />
            </Box>
          ) : jobs.length === 0 ? (
            <Alert severity="info">
              No jobs found. Create a job in the pipeline first before linking
              documents.
            </Alert>
          ) : (
            <>
              <FormControl fullWidth sx={{ mb: 3 }}>
                <InputLabel>Select Job</InputLabel>
                <Select
                  value={selectedJobId}
                  label="Select Job"
                  onChange={(e) => setSelectedJobId(e.target.value as number)}
                >
                  {jobs.map((job) => (
                    <MenuItem key={job.id} value={job.id}>
                      <Box>
                        <Typography variant="body2">
                          {job.job_title || "Untitled"} -{" "}
                          {job.company_name || "Unknown Company"}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Status: {job.job_status || "N/A"}
                        </Typography>
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <Typography variant="subtitle2" gutterBottom>
                Link Type
              </Typography>
              <RadioGroup
                value={linkType}
                onChange={(e) =>
                  setLinkType(e.target.value as "resume" | "cover")
                }
              >
                <FormControlLabel
                  value="resume"
                  control={<Radio />}
                  label="Resume"
                />
                <FormControlLabel
                  value="cover"
                  control={<Radio />}
                  label="Cover Letter"
                />
              </RadioGroup>
            </>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={submitting}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={!selectedJobId || submitting || loading}
        >
          {submitting ? <CircularProgress size={24} /> : "Link Document"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
