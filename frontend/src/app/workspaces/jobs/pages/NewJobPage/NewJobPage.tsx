import React, { useState } from "react";
import { TextField, Button, MenuItem, Box, Typography } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { DatePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { useAuth } from "@shared/context/AuthContext";
import { createJob } from "@shared/services/dbMappers";
import { useErrorHandler } from "@shared/hooks/useErrorHandler";
import { ErrorSnackbar } from "@shared/components/feedback/ErrorSnackbar";
import { useConfirmDialog } from "@shared/hooks/useConfirmDialog";
import JobImportURL from "../../components/JobImportURL/JobImportURL";

const industries = [
  "Technology",
  "Finance",
  "Healthcare",
  "Education",
  "Manufacturing",
  "Other",
];
const jobTypes = ["Full-time", "Part-time", "Internship", "Contract"];

export default function NewJobPage() {
  const theme = useTheme();
  const [form, setForm] = useState({
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
  });
  const [saving, setSaving] = useState(false);
  const [showImporter, setShowImporter] = useState(false);

  const { user } = useAuth();
  const { handleError, showSuccess, notification, closeNotification } =
    useErrorHandler();
  const { confirm } = useConfirmDialog();

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
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
      const res = await createJob(
        user.id,
        form as unknown as Record<string, unknown>
      );
      if (res.error) {
        handleError(res.error);
      } else {
        showSuccess("Job saved successfully!");
        handleCancel();
      }
    } catch (e) {
      handleError(e);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
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
    // also collapse the importer if open
    setShowImporter(false);
  };

  return (
    <Box
      sx={{
        maxWidth: 700,
        mx: "auto",
        mt: 4,
        p: 3,
        borderRadius: 2,
        boxShadow: theme.shadows[3],
        bgcolor: "background.paper",
      }}
    >
      <Typography variant="h4" gutterBottom>
        Add Job Opportunity
      </Typography>

      {/* Job Import from URL: hidden by default, revealed when user clicks Import */}
      {!showImporter ? (
        <Box sx={{ mb: 2 }}>
          <Button variant="outlined" onClick={() => setShowImporter(true)}>
            Import from URL
          </Button>
        </Box>
      ) : (
        <Box sx={{ mb: 2 }}>
          <JobImportURL
            onImport={(data) => {
              setForm((prev) => ({
                ...prev,
                job_title: data.job_title || data.title || prev.job_title || "",
                company_name:
                  data.company_name || data.company || prev.company_name || "",
                job_description:
                  data.job_description ||
                  data.description ||
                  prev.job_description ||
                  "",
                start_salary:
                  data.salary_start ||
                  data.salary?.min ||
                  prev.start_salary ||
                  "",
                end_salary:
                  data.salary_end || data.salary?.max || prev.end_salary || "",
                city_name:
                  data.location_city ||
                  data.location?.city ||
                  prev.city_name ||
                  "",
                state_code:
                  data.location_state ||
                  data.location?.state ||
                  prev.state_code ||
                  "",
                application_deadline: data.deadline
                  ? new Date(data.deadline)
                  : prev.application_deadline,
                // prefer the canonical job_link key produced by the importer
                job_link: data.job_link || data.url || prev.job_link || "",
              }));
              // hide importer after successful import
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

      <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <TextField
          label="Job Title"
          name="job_title"
          value={form.job_title}
          onChange={handleChange}
          required
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
        <TextField
          label="City"
          name="city_name"
          value={form.city_name}
          onChange={handleChange}
        />
        <TextField
          label="State Code"
          name="state_code"
          value={form.state_code}
          onChange={handleChange}
        />
        <TextField
          label="Zipcode"
          name="zipcode"
          value={form.zipcode}
          onChange={handleChange}
        />
        <TextField
          label="Salary Range Start"
          name="start_salary"
          type="number"
          value={form.start_salary}
          onChange={handleChange}
        />
        <TextField
          label="Salary Range End"
          name="end_salary"
          type="number"
          value={form.end_salary}
          onChange={handleChange}
        />
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
              setForm((prev) => ({ ...prev, application_deadline: newValue }))
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
          inputProps={{ maxLength: 2000 }}
          helperText={`${
            String(form.job_description ?? "").length
          }/2000 characters`}
        />

        <TextField
          select
          label="Industry"
          name="industry"
          value={form.industry}
          onChange={handleChange}
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
        >
          {jobTypes.map((opt) => (
            <MenuItem key={opt} value={opt}>
              {opt}
            </MenuItem>
          ))}
        </TextField>

        <Box sx={{ display: "flex", gap: 2, mt: 2 }}>
          <Button
            variant="contained"
            color="primary"
            onClick={handleSave}
            disabled={saving}
          >
            Save
          </Button>
          <Button
            variant="outlined"
            color="secondary"
            onClick={async () => {
              const confirmed = await confirm({
                title: "Discard changes?",
                message:
                  "Are you sure you want to discard your changes? This will clear the form.",
                confirmText: "Discard",
                cancelText: "Keep editing",
              });
              if (confirmed) {
                handleCancel();
              }
            }}
          >
            Cancel
          </Button>
        </Box>
      </Box>

      <ErrorSnackbar notification={notification} onClose={closeNotification} />
    </Box>
  );
}
