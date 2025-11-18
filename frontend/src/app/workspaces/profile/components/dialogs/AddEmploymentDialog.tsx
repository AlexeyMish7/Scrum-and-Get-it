import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Stack,
  FormControlLabel,
  Switch,
} from "@mui/material";
import { useAuth } from "@shared/context/AuthContext";
import { useProfileChange } from "@shared/context";
import { useErrorHandler } from "@shared/hooks/useErrorHandler";
import { ErrorSnackbar } from "@shared/components/feedback/ErrorSnackbar";
import employmentService from "../../services/employment";
import type { EmploymentRow } from "../../types/employment";

interface AddEmploymentDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  mode?: "add" | "edit";
  existingEntry?: EmploymentRow;
}

export const AddEmploymentDialog: React.FC<AddEmploymentDialogProps> = ({
  open,
  onClose,
  onSuccess,
  mode = "add",
  existingEntry,
}) => {
  const { user, loading } = useAuth();
  const { markProfileChanged } = useProfileChange();
  const {
    notification,
    closeNotification,
    handleError,
    showSuccess,
    showWarning,
  } = useErrorHandler();

  // Initialize form data
  const [formData, setFormData] = useState({
    jobTitle: "",
    companyName: "",
    location: "",
    startDate: "",
    endDate: "",
    isCurrent: false,
    description: "",
  });

  // Reset form when dialog opens or mode changes
  useEffect(() => {
    if (open) {
      if (mode === "edit" && existingEntry) {
        setFormData({
          jobTitle: existingEntry.job_title ?? "",
          companyName: existingEntry.company_name ?? "",
          location: existingEntry.location ?? "",
          startDate: existingEntry.start_date ?? "",
          endDate: existingEntry.end_date ?? "",
          isCurrent: existingEntry.current_position ?? false,
          description: existingEntry.job_description ?? "",
        });
      } else {
        // Reset form for add mode
        setFormData({
          jobTitle: "",
          companyName: "",
          location: "",
          startDate: "",
          endDate: "",
          isCurrent: false,
          description: "",
        });
      }
    }
  }, [open, mode, existingEntry]);

  // Helper function to update any field in the form
  const updateField = (k: keyof typeof formData, v: string | boolean) =>
    setFormData((s) => ({ ...s, [k]: v }));

  // Validate form data
  const validate = (): { isValid: boolean; message?: string } => {
    if (!formData.jobTitle?.trim()) {
      return { isValid: false, message: "Job title is required" };
    }

    if (!formData.companyName?.trim()) {
      return { isValid: false, message: "Company name is required" };
    }

    if (!formData.startDate) {
      return { isValid: false, message: "Start date is required" };
    }

    // If not current and end date is provided, validate it's after start date
    if (!formData.isCurrent && formData.endDate && formData.startDate) {
      if (formData.endDate < formData.startDate) {
        return { isValid: false, message: "End date must be after start date" };
      }
    }

    return { isValid: true };
  };

  // Handle form submission
  const handleSubmit = async () => {
    const validation = validate();
    if (!validation.isValid) {
      showWarning(validation.message ?? "Please complete required fields");
      return;
    }

    if (loading || !user) {
      showWarning("Please log in to save employment entries");
      return;
    }

    try {
      // Prepare data to send to database using correct column names
      const payload = {
        job_title: formData.jobTitle,
        company_name: formData.companyName,
        location: formData.location || null,
        start_date: formData.startDate,
        end_date: formData.isCurrent ? null : formData.endDate || null,
        current_position: formData.isCurrent,
        job_description: formData.description || null,
      };

      let res;
      if (mode === "edit" && existingEntry) {
        // Update existing entry
        res = await employmentService.updateEmployment(
          user.id,
          existingEntry.id,
          payload
        );
      } else {
        // Create new entry
        res = await employmentService.insertEmployment(user.id, payload);
      }

      if (res.error) {
        console.error("Failed to save employment", res.error);
        handleError(res.error);
        return;
      }

      // Notify other components of the change
      window.dispatchEvent(new Event("employment:changed"));
      markProfileChanged();

      showSuccess(
        mode === "edit"
          ? "Employment updated successfully"
          : "Employment added successfully"
      );

      // Call success callback if provided
      onSuccess?.();

      // Close dialog
      onClose();
    } catch (err) {
      console.error("Error saving employment", err);
      handleError(err);
    }
  };

  // Handle delete (only in edit mode)
  const handleDelete = async () => {
    if (mode !== "edit" || !existingEntry) return;

    if (
      !window.confirm("Are you sure you want to delete this employment entry?")
    ) {
      return;
    }

    if (loading || !user) {
      showWarning("Please log in to delete employment entries");
      return;
    }

    try {
      const res = await employmentService.deleteEmployment(
        user.id,
        existingEntry.id
      );

      if (res.error) {
        console.error("Failed to delete employment", res.error);
        handleError(res.error);
        return;
      }

      // Notify other components of the change
      window.dispatchEvent(new Event("employment:changed"));
      markProfileChanged();

      showSuccess("Employment deleted successfully");

      // Call success callback if provided
      onSuccess?.();

      // Close dialog
      onClose();
    } catch (err) {
      console.error("Error deleting employment", err);
      handleError(err);
    }
  };

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
        <DialogTitle>
          {mode === "edit" ? "Edit Employment" : "Add Employment"}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            {/* Job Title */}
            <TextField
              fullWidth
              size="small"
              label="Job Title"
              required
              value={formData.jobTitle}
              onChange={(e) => updateField("jobTitle", e.target.value)}
              error={!formData.jobTitle}
              helperText={!formData.jobTitle ? "Required" : ""}
            />

            {/* Company Name */}
            <TextField
              fullWidth
              size="small"
              label="Company Name"
              required
              value={formData.companyName}
              onChange={(e) => updateField("companyName", e.target.value)}
              error={!formData.companyName}
              helperText={!formData.companyName ? "Required" : ""}
            />

            {/* Location */}
            <TextField
              fullWidth
              size="small"
              label="Location"
              value={formData.location}
              onChange={(e) => updateField("location", e.target.value)}
            />

            {/* Start Date */}
            <TextField
              fullWidth
              size="small"
              label="Start Date"
              required
              inputProps={{ type: "date" }}
              InputLabelProps={{ shrink: true }}
              value={formData.startDate}
              onChange={(e) => updateField("startDate", e.target.value)}
              error={!formData.startDate}
              helperText={!formData.startDate ? "Required" : ""}
            />

            {/* Currently Working Toggle */}
            <FormControlLabel
              control={
                <Switch
                  checked={Boolean(formData.isCurrent)}
                  onChange={(e) => updateField("isCurrent", e.target.checked)}
                />
              }
              label="Currently Working Here"
            />

            {/* End Date (only if not current) */}
            {!formData.isCurrent && (
              <TextField
                fullWidth
                size="small"
                label="End Date"
                inputProps={{ type: "date" }}
                InputLabelProps={{ shrink: true }}
                value={formData.endDate}
                onChange={(e) => updateField("endDate", e.target.value)}
              />
            )}

            {/* Job Description */}
            <TextField
              fullWidth
              size="small"
              label="Job Description"
              value={formData.description}
              onChange={(e) => updateField("description", e.target.value)}
              multiline
              rows={4}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          {mode === "edit" && (
            <Button onClick={handleDelete} color="error" sx={{ mr: "auto" }}>
              Delete
            </Button>
          )}
          <Button onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained">
            {mode === "edit" ? "Save Changes" : "Add Employment"}
          </Button>
        </DialogActions>
      </Dialog>

      <ErrorSnackbar notification={notification} onClose={closeNotification} />
    </>
  );
};
