import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import * as crud from "../services/crud";
import {
  Box,
  Button,
  TextField,
  Typography,
  Checkbox,
  FormControlLabel,
  useTheme,
} from "@mui/material";

interface EmploymentEntry {
  jobTitle: string;
  companyName: string;
  location: string;
  startDate: string;
  endDate?: string;
  isCurrent: boolean;
  description: string;
}

const AddEmploymentForm: React.FC = () => {
  const [formData, setFormData] = useState<EmploymentEntry>({
    jobTitle: "",
    companyName: "",
    location: "",
    startDate: "",
    endDate: "",
    isCurrent: false,
    description: "",
  });

  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const target = e.target as HTMLInputElement | HTMLTextAreaElement;
    const name =
      (target as HTMLInputElement).name || (target as HTMLTextAreaElement).name;
    const value =
      (target as HTMLInputElement).value ??
      (target as HTMLTextAreaElement).value;
    const type = (target as HTMLInputElement).type ?? "text";
    const checked = (target as HTMLInputElement).checked;

    setFormData((prev) => ({
      ...prev,
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore - dynamic key from form name (kept simple for this form)
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const { user } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setLoading(true);

    // client-side validation
    if (!formData.jobTitle || !formData.companyName || !formData.startDate) {
      setMessage("Please fill in all required fields.");
      setLoading(false);
      return;
    }
    if (
      !formData.isCurrent &&
      formData.endDate &&
      formData.startDate > formData.endDate
    ) {
      setMessage("Start date must be before end date.");
      setLoading(false);
      return;
    }

    try {
      if (!user) {
        setMessage("Please sign in before adding employment history.");
        setLoading(false);
        return;
      }

      const userCrud = crud.withUser(user.id);
      const payload = {
        job_title: formData.jobTitle,
        company_name: formData.companyName,
        location: formData.location || null,
        start_date: formData.startDate,
        end_date: formData.isCurrent ? null : formData.endDate || null,
        current_position: formData.isCurrent,
        job_description: formData.description || null,
      };

      const res = await userCrud.insertRow("employment", payload, "*");

      if (res.error) {
        console.error("Insert error:", res.error);
        setMessage(`Something went wrong: ${res.error.message}`);
        setLoading(false);
        return;
      }

      setMessage("Employment entry added successfully!");
      setFormData({
        jobTitle: "",
        companyName: "",
        location: "",
        startDate: "",
        endDate: "",
        isCurrent: false,
        description: "",
      });
    } catch (err) {
      console.error("Unexpected error:", err);
      setMessage("Unexpected error. See console for details.");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    window.history.back(); // simple navigation back to employment history view
  };

  const theme = useTheme(); 
  
  return (
    <Box
      component="form"
      onSubmit={handleSubmit}
      sx={{
        maxWidth: 600,
        mx: "auto",
        p: 4,
        borderRadius: 3,
        boxShadow: 1,
        bgcolor: theme.palette.background.paper,
      }}
    >
      <Typography
        variant="h5"
        fontWeight="bold"
        textAlign="center"
        mb={3}
        color={theme.palette.text.primary}
      >
        Add Employment History
      </Typography>

      <TextField
        label="Job Title *"
        name="jobTitle"
        value={formData.jobTitle}
        onChange={handleChange}
        fullWidth
        required
        margin="normal"
      />

      <TextField
        label="Company Name *"
        name="companyName"
        value={formData.companyName}
        onChange={handleChange}
        fullWidth
        required
        margin="normal"
      />

      <TextField
        label="Location"
        name="location"
        value={formData.location}
        onChange={handleChange}
        fullWidth
        margin="normal"
      />

      <Box display="flex" gap={2}>
        <TextField
          label="Start Date *"
          type="date"
          name="startDate"
          value={formData.startDate}
          onChange={handleChange}
          fullWidth
          required
          InputLabelProps={{ shrink: true }}
        />
        {!formData.isCurrent && (
          <TextField
            label="End Date"
            type="date"
            name="endDate"
            value={formData.endDate}
            onChange={handleChange}
            fullWidth
            InputLabelProps={{ shrink: true }}
          />
        )}
      </Box>

      <FormControlLabel
        control={
          <Checkbox
            name="isCurrent"
            checked={formData.isCurrent}
            onChange={handleChange}
          />
        }
        label="Current Position"
        sx={{ mt: 1 }}
      />

      <TextField
        label="Job Description (max 1000 characters)"
        name="description"
        value={formData.description}
        onChange={handleChange}
        fullWidth
        multiline
        rows={4}
        inputProps={{ maxLength: 1000 }}
        margin="normal"
      />

      <Box display="flex" justifyContent="space-between" mt={3}>
        <Button
          type="submit"
          variant="contained"
          color="primary"
          disabled={loading}
        >
          {loading ? "Saving..." : "Save"}
        </Button>
        <Button variant="secondary" onClick={handleCancel}>
          Cancel
        </Button>
      </Box>

      {message && (
        <Typography
          variant="body2"
          textAlign="center"
          mt={2}
          color={theme.palette.text.secondary}
        >
          {message}
        </Typography>
      )}
    </Box>
  );
};

export default AddEmploymentForm;
