/**
 * JobFormDialog Component
 *
 * Reusable dialog for adding or editing job opportunities.
 * Extracted from NewJobPage to enable use in modal contexts (e.g., Pipeline page).
 *
 * Features:
 * - Full job form with validation
 * - URL import functionality
 * - Date picker for application deadline
 * - Industry and job type selection
 * - Save/Cancel actions with confirmation
 */

import { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  MenuItem,
  Box,
} from "@mui/material";
import { DatePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { useAuth } from "@shared/context/AuthContext";
import { jobsService } from "@job_pipeline/services";
import type { JobFormData, JobRow } from "@job_pipeline/types";
import { useErrorHandler } from "@shared/hooks/useErrorHandler";
import { ErrorSnackbar } from "@shared/components/feedback/ErrorSnackbar";
import { useConfirmDialog } from "@shared/hooks/useConfirmDialog";
import JobImportURL from "@job_pipeline/components/import/JobImportURL/JobImportURL";

const industries = [
  "Technology",
  "Finance",
  "Healthcare",
  "Education",
  "Manufacturing",
  "Other",
];

const jobTypes = [
  { label: "Full-time", value: "full-time" },
  { label: "Part-time", value: "part-time" },
  { label: "Contract", value: "contract" },
  { label: "Internship", value: "internship" },
  { label: "Freelance", value: "freelance" },
];

interface JobFormDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: (job: JobRow) => void;
  editJob?: JobRow | null;
}

export default function JobFormDialog({
  open,
  onClose,
  onSuccess,
  editJob,
}: JobFormDialogProps) {
  const { user } = useAuth();
  const { handleError, showSuccess, notification, closeNotification } =
    useErrorHandler();
  const { confirm } = useConfirmDialog();

  // Initialize form state from editJob if editing, otherwise empty
  const [form, setForm] = useState(() => {
    if (editJob) {
      return {
        job_title: editJob.job_title || "",
        company_name: editJob.company_name || "",
        street_address: editJob.street_address || "",
        zipcode: editJob.zipcode || "",
        city_name: editJob.city_name || "",
        state_code: editJob.state_code || "",
        start_salary: editJob.start_salary_range?.toString() || "",
        end_salary: editJob.end_salary_range?.toString() || "",
        job_link: editJob.job_link || "",
        application_deadline: editJob.application_deadline
          ? new Date(editJob.application_deadline)
          : null,
        job_description: editJob.job_description || "",
        industry: editJob.industry || "",
        job_type: editJob.job_type || "",
      };
    }
    return {
      job_title: "",
      company_name: "",
      street_address: "",
      zipcode: "",
      city_name: "",
      state_code: "",
      start_salary: "",
      end_salary: "",
      job_link: "",
      application_deadline: null as Date | null,
      job_description: "",
      industry: "",
      job_type: "",
    };
  });

  const [saving, setSaving] = useState(false);
  const [showImporter, setShowImporter] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    // Validation
    if (!form.job_title || !form.company_name) {
      handleError("Job title and company name are required.");
      return;
    }
    if (!user?.id) {
      handleError("You must be signed in to save a job.");
      return;
    }

    setSaving(true);
    try {
      // Build payload
      const payload: JobFormData = {
        job_title: form.job_title,
        company_name: form.company_name,
        street_address: form.street_address || undefined,
        city_name: form.city_name || undefined,
        state_code: form.state_code || undefined,
        zipcode: form.zipcode || undefined,
        start_salary_range: form.start_salary
          ? Number(form.start_salary)
          : undefined,
        end_salary_range: form.end_salary ? Number(form.end_salary) : undefined,
        job_link: form.job_link || undefined,
        application_deadline: form.application_deadline
          ? form.application_deadline.toISOString().split("T")[0]
          : undefined,
        job_description: form.job_description || undefined,
        industry: form.industry || undefined,
        job_type: form.job_type || undefined,
      };

      let res;
      if (editJob?.id) {
        // Update existing job
        res = await jobsService.updateJob(user.id, editJob.id, payload);
      } else {
        // Create new job
        res = await jobsService.createJob(user.id, payload);
      }

      if (res.error) {
        handleError(res.error);
      } else {
        showSuccess(
          editJob ? "Job updated successfully!" : "Job saved successfully!"
        );

        // Notify other components that jobs changed
        window.dispatchEvent(new CustomEvent("jobs-updated"));

        if (onSuccess && res.data) {
          onSuccess(res.data);
        }
        handleClose();
      }
    } catch (e) {
      handleError(e);
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    // Reset form
    setForm({
      job_title: "",
      company_name: "",
      street_address: "",
      zipcode: "",
      city_name: "",
      state_code: "",
      start_salary: "",
      end_salary: "",
      job_link: "",
      application_deadline: null,
      job_description: "",
      industry: "",
      job_type: "",
    });
    setShowImporter(false);
    onClose();
  };

  const handleCancel = async () => {
    const confirmed = await confirm({
      title: "Discard changes?",
      message:
        "Are you sure you want to discard your changes? This will clear the form.",
      confirmText: "Discard",
      cancelText: "Keep editing",
    });
    if (confirmed) {
      handleClose();
    }
  };

  return (
    <>
      <Dialog open={open} onClose={handleCancel} maxWidth="md" fullWidth>
        <DialogTitle>
          {editJob ? "Edit Job Opportunity" : "Add Job Opportunity"}
        </DialogTitle>

        <DialogContent>
          {/* Job Import from URL: hidden by default, revealed when user clicks Import */}
          {!editJob && (
            <>
              {!showImporter ? (
                <Box sx={{ mb: 2, mt: 1 }}>
                  <Button
                    variant="outlined"
                    onClick={() => setShowImporter(true)}
                  >
                    Import from URL
                  </Button>
                </Box>
              ) : (
                <Box sx={{ mb: 2, mt: 1 }}>
                  <JobImportURL
                    onImport={(data: Record<string, unknown>) => {
                      const salary = data.salary as
                        | { min?: unknown; max?: unknown }
                        | undefined;
                      const location = data.location as
                        | { city?: unknown; state?: unknown }
                        | undefined;

                      setForm((prev) => ({
                        ...prev,
                        job_title: String(
                          data.job_title || data.title || prev.job_title || ""
                        ),
                        company_name: String(
                          data.company_name ||
                            data.company ||
                            prev.company_name ||
                            ""
                        ),
                        job_description: String(
                          data.job_description ||
                            data.description ||
                            prev.job_description ||
                            ""
                        ),
                        start_salary: String(
                          data.salary_start ||
                            salary?.min ||
                            prev.start_salary ||
                            ""
                        ),
                        end_salary: String(
                          data.salary_end ||
                            salary?.max ||
                            prev.end_salary ||
                            ""
                        ),
                        city_name: String(
                          data.location_city ||
                            location?.city ||
                            prev.city_name ||
                            ""
                        ),
                        state_code: String(
                          data.location_state ||
                            location?.state ||
                            prev.state_code ||
                            ""
                        ),
                        application_deadline: data.deadline
                          ? new Date(data.deadline as string)
                          : prev.application_deadline,
                        job_link: String(
                          data.job_link || data.url || prev.job_link || ""
                        ),
                      }));
                      setShowImporter(false);
                    }}
                  />
                  <Button
                    size="small"
                    onClick={() => setShowImporter(false)}
                    sx={{ mt: 1 }}
                  >
                    Close
                  </Button>
                </Box>
              )}
            </>
          )}

          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 2 }}>
            <TextField
              label="Job Title"
              name="job_title"
              value={form.job_title}
              onChange={handleChange}
              required
              autoFocus
            />
            <TextField
              label="Company Name"
              name="company_name"
              value={form.company_name}
              onChange={handleChange}
              required
            />
            <TextField
              label="Street Address"
              name="street_address"
              value={form.street_address}
              onChange={handleChange}
              placeholder="123 Main St"
            />
            <Box sx={{ display: "flex", gap: 2 }}>
              <TextField
                label="City"
                name="city_name"
                value={form.city_name}
                onChange={handleChange}
                sx={{ flex: 1 }}
              />
              <TextField
                label="State"
                name="state_code"
                value={form.state_code}
                onChange={handleChange}
                sx={{ width: 100 }}
              />
              <TextField
                label="Zipcode"
                name="zipcode"
                value={form.zipcode}
                onChange={handleChange}
                sx={{ width: 120 }}
              />
            </Box>
            <Box sx={{ display: "flex", gap: 2 }}>
              <TextField
                label="Salary Min"
                name="start_salary"
                type="number"
                value={form.start_salary}
                onChange={handleChange}
                sx={{ flex: 1 }}
              />
              <TextField
                label="Salary Max"
                name="end_salary"
                type="number"
                value={form.end_salary}
                onChange={handleChange}
                sx={{ flex: 1 }}
              />
            </Box>
            <TextField
              label="Job Posting URL"
              name="job_link"
              value={form.job_link}
              onChange={handleChange}
            />

            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DatePicker
                label="Application Deadline"
                value={form.application_deadline}
                onChange={(newValue) =>
                  setForm((prev) => ({
                    ...prev,
                    application_deadline: newValue,
                  }))
                }
                slotProps={{ textField: { fullWidth: true } }}
              />
            </LocalizationProvider>

            <TextField
              label="Job Description"
              name="job_description"
              value={form.job_description}
              onChange={handleChange}
              multiline
              minRows={3}
              maxRows={8}
              inputProps={{ maxLength: 2000 }}
              helperText={`${
                String(form.job_description ?? "").length
              }/2000 characters`}
            />

            <Box sx={{ display: "flex", gap: 2 }}>
              <TextField
                select
                label="Industry"
                name="industry"
                value={form.industry}
                onChange={handleChange}
                sx={{ flex: 1 }}
              >
                {industries.map((opt) => (
                  <MenuItem key={opt} value={opt}>
                    {opt}
                  </MenuItem>
                ))}
              </TextField>

              <TextField
                select
                label="Job Type"
                name="job_type"
                value={form.job_type}
                onChange={handleChange}
                sx={{ flex: 1 }}
              >
                {jobTypes.map((opt) => (
                  <MenuItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </MenuItem>
                ))}
              </TextField>
            </Box>
          </Box>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleCancel} disabled={saving}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            variant="contained"
            disabled={saving}
            autoFocus
          >
            {saving ? "Saving..." : editJob ? "Update" : "Add Job"}
          </Button>
        </DialogActions>
      </Dialog>

      <ErrorSnackbar notification={notification} onClose={closeNotification} />
    </>
  );
}
