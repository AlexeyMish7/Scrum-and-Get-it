import React, { useState } from "react";
import { TextField, Button, MenuItem, Box, Typography } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { DatePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
// Uses the global ThemeContext (dark/light). No local ThemeProvider here.
import { useAuth } from "@shared/context/AuthContext";
import { createJob } from "@shared/services/dbMappers";
import { useErrorHandler } from "@shared/hooks/useErrorHandler";
import ErrorSnackbar from "@shared/components/common/ErrorSnackbar";
import ConfirmDialog from "@shared/components/common/ConfirmDialog";

const industries = [
  "Technology",
  "Finance",
  "Healthcare",
  "Education",
  "Manufacturing",
  "Other",
];

const jobTypes = ["Full-time", "Part-time", "Internship", "Contract"];

export default function JobForm() {
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

  // Notifications (success/error) are shown centrally via useErrorHandler()
  const [saving, setSaving] = useState(false);

  const { user } = useAuth();
  const { handleError, showSuccess, notification, closeNotification } =
    useErrorHandler();

  const [confirmOpen, setConfirmOpen] = useState(false);

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
        // clear form
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
      <Typography variant="h4" gutterBottom className="ai-glow">
        Add Job Opportunity
      </Typography>

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
              setForm((prev) => ({
                ...prev,
                application_deadline: newValue,
              }))
            }
            slotProps={{
              textField: { fullWidth: true },
            }}
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
          {industries.map((option) => (
            <MenuItem key={option} value={option}>
              {option}
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
          {jobTypes.map((option) => (
            <MenuItem key={option} value={option}>
              {option}
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
            onClick={() => setConfirmOpen(true)}
          >
            Cancel
          </Button>
        </Box>
      </Box>

      {/* Centralized notification (errors, warnings, success) */}
      <ErrorSnackbar notification={notification} onClose={closeNotification} />

      {/* Confirm cancel dialog */}
      <ConfirmDialog
        open={confirmOpen}
        title="Discard changes?"
        description="Are you sure you want to discard your changes? This will clear the form."
        confirmText="Discard"
        cancelText="Keep editing"
        onClose={() => setConfirmOpen(false)}
        onConfirm={() => {
          setConfirmOpen(false);
          handleCancel();
        }}
      />
    </Box>
  );
}
