import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  Stack,
  FormControlLabel,
  Switch,
} from "@mui/material";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@shared/context/AuthContext";
import { useProfileChange } from "@shared/context";
import { useErrorHandler } from "@shared/hooks/useErrorHandler";
import { ErrorSnackbar } from "@shared/components/feedback/ErrorSnackbar";
import { isMonthAfter } from "@shared/utils/dateUtils";
import { profileKeys } from "@profile/cache";
import educationService from "../../services/education";
import type { EducationEntry } from "../../types/education";

// List of education levels users can choose from
const DEGREE_OPTIONS = [
  "High School",
  "Associate",
  "Bachelor's",
  "Master's",
  "PhD",
  "Certificate",
];

interface AddEducationDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  mode?: "add" | "edit";
  existingEntry?: EducationEntry;
}

export const AddEducationDialog: React.FC<AddEducationDialogProps> = ({
  open,
  onClose,
  onSuccess,
  mode = "add",
  existingEntry,
}) => {
  const { user, loading } = useAuth();
  const queryClient = useQueryClient();
  const { markProfileChanged } = useProfileChange();
  const {
    notification,
    closeNotification,
    handleError,
    showSuccess,
    showWarning,
  } = useErrorHandler();

  // Initialize form data
  const [formData, setFormData] = useState<Partial<EducationEntry>>({
    degree: "",
    institution: "",
    fieldOfStudy: "",
    startDate: "",
    endDate: undefined,
    gpa: undefined,
    gpaPrivate: false,
    honors: undefined,
    active: false,
  });

  // Reset form when dialog opens or mode changes
  useEffect(() => {
    if (open) {
      if (mode === "edit" && existingEntry) {
        setFormData({
          degree: existingEntry.degree ?? "",
          institution: existingEntry.institution ?? "",
          fieldOfStudy: existingEntry.fieldOfStudy ?? "",
          startDate: existingEntry.startDate ?? "",
          endDate: existingEntry.endDate,
          gpa: existingEntry.gpa,
          gpaPrivate: existingEntry.gpaPrivate ?? false,
          honors: existingEntry.honors,
          active: existingEntry.active ?? false,
        });
      } else {
        // Reset form for add mode
        setFormData({
          degree: "",
          institution: "",
          fieldOfStudy: "",
          startDate: "",
          endDate: undefined,
          gpa: undefined,
          gpaPrivate: false,
          honors: undefined,
          active: false,
        });
      }
    }
  }, [open, mode, existingEntry]);

  // Helper function to update any field in the form
  const updateField = (k: keyof EducationEntry, v: unknown) =>
    setFormData((s) => ({ ...(s ?? {}), [k]: v }));

  // Validate form data
  const validate = (): { isValid: boolean; message?: string } => {
    // User must provide either a degree type OR field of study (or both)
    const hasDegreeOrField = Boolean(
      (formData.degree && String(formData.degree).trim()) ||
        (formData.fieldOfStudy && String(formData.fieldOfStudy).trim())
    );

    if (!formData.institution) {
      return { isValid: false, message: "Institution is required" };
    }

    if (!formData.startDate) {
      return { isValid: false, message: "Start date is required" };
    }

    if (!hasDegreeOrField) {
      return {
        isValid: false,
        message: "Please provide either a Degree Type or Field of Study",
      };
    }

    // If not currently enrolled and end date is provided, validate it's after start date
    if (!formData.active && formData.endDate && formData.startDate) {
      const isValid = isMonthAfter(formData.startDate, formData.endDate);
      if (!isValid) {
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
      showWarning("Please log in to save education entries");
      return;
    }

    try {
      // Prepare data to send to database
      const payload = {
        institution: formData.institution,
        degree: formData.degree,
        fieldOfStudy: formData.fieldOfStudy,
        startDate: formData.startDate,
        endDate: formData.endDate,
        gpa: formData.gpa,
        gpaPrivate: formData.gpaPrivate,
        honors: formData.honors,
        active: formData.active,
      } as Record<string, unknown>;

      let res;
      if (mode === "edit" && existingEntry) {
        // Update existing entry
        res = await educationService.updateEducation(
          user.id,
          existingEntry.id,
          payload
        );
      } else {
        // Create new entry
        res = await educationService.createEducation(user.id, payload);
      }

      if (res.error) {
        console.error("Failed to save education", res.error);
        handleError(res.error);
        return;
      }

      // Invalidate React Query cache so all components get fresh data
      await queryClient.invalidateQueries({
        queryKey: profileKeys.education(user.id),
      });

      // Notify other components of the change (for non-React Query listeners)
      window.dispatchEvent(new Event("education:changed"));
      markProfileChanged();

      showSuccess(
        mode === "edit"
          ? "Education updated successfully"
          : "Education added successfully"
      );

      // Call success callback if provided (parent can do additional work)
      onSuccess?.();

      // Close dialog
      onClose();
    } catch (err) {
      console.error("Error saving education", err);
      handleError(err);
    }
  };

  // Handle delete (only in edit mode)
  const handleDelete = async () => {
    if (mode !== "edit" || !existingEntry) return;

    if (
      !window.confirm("Are you sure you want to delete this education entry?")
    ) {
      return;
    }

    if (loading || !user) {
      showWarning("Please log in to delete education entries");
      return;
    }

    try {
      const res = await educationService.deleteEducation(
        user.id,
        existingEntry.id
      );

      if (res.error) {
        console.error("Failed to delete education", res.error);
        handleError(res.error);
        return;
      }

      // Invalidate React Query cache so all components get fresh data
      await queryClient.invalidateQueries({
        queryKey: profileKeys.education(user.id),
      });

      // Notify other components of the change (for non-React Query listeners)
      window.dispatchEvent(new Event("education:changed"));
      markProfileChanged();

      showSuccess("Education deleted successfully");

      // Call success callback if provided
      onSuccess?.();

      // Close dialog
      onClose();
    } catch (err) {
      console.error("Error deleting education", err);
      handleError(err);
    }
  };

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
        <DialogTitle>
          {mode === "edit" ? "Edit Education" : "Add Education"}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            {/* Degree Type */}
            <TextField
              select
              fullWidth
              size="small"
              label="Degree Type"
              value={formData.degree ?? ""}
              onChange={(e) => updateField("degree", e.target.value)}
            >
              {DEGREE_OPTIONS.map((degree) => (
                <MenuItem key={degree} value={degree}>
                  {degree}
                </MenuItem>
              ))}
            </TextField>

            {/* Institution */}
            <TextField
              fullWidth
              size="small"
              label="Institution"
              required
              value={formData.institution ?? ""}
              onChange={(e) => updateField("institution", e.target.value)}
              error={!formData.institution}
              helperText={!formData.institution ? "Required" : ""}
            />

            {/* Field of Study */}
            <TextField
              fullWidth
              size="small"
              label="Field of Study"
              value={formData.fieldOfStudy ?? ""}
              onChange={(e) => updateField("fieldOfStudy", e.target.value)}
            />

            {/* Start Date */}
            <TextField
              fullWidth
              size="small"
              label="Start Date"
              required
              inputProps={{ type: "month" }}
              InputLabelProps={{ shrink: true }}
              value={formData.startDate ?? ""}
              onChange={(e) => updateField("startDate", e.target.value)}
              error={!formData.startDate}
              helperText={!formData.startDate ? "Required" : ""}
            />

            {/* Currently Enrolled Toggle */}
            <FormControlLabel
              control={
                <Switch
                  checked={Boolean(formData.active)}
                  onChange={(e) => updateField("active", e.target.checked)}
                />
              }
              label="Currently Enrolled"
            />

            {/* End Date (only if not currently enrolled) */}
            {!formData.active && (
              <TextField
                fullWidth
                size="small"
                label="End Date"
                inputProps={{ type: "month" }}
                InputLabelProps={{ shrink: true }}
                value={formData.endDate ?? ""}
                onChange={(e) =>
                  updateField("endDate", e.target.value || undefined)
                }
              />
            )}

            {/* GPA */}
            <TextField
              fullWidth
              size="small"
              label="GPA (optional)"
              type="number"
              value={formData.gpa ?? ""}
              onChange={(e) =>
                updateField(
                  "gpa",
                  e.target.value ? parseFloat(e.target.value) : undefined
                )
              }
              inputProps={{ min: 0, max: 4, step: 0.01 }}
            />

            {/* Hide GPA Toggle */}
            <FormControlLabel
              control={
                <Switch
                  checked={Boolean(formData.gpaPrivate)}
                  onChange={(e) => updateField("gpaPrivate", e.target.checked)}
                />
              }
              label="Hide GPA"
            />

            {/* Honors */}
            <TextField
              fullWidth
              size="small"
              label="Achievements / Honors"
              value={formData.honors ?? ""}
              onChange={(e) => updateField("honors", e.target.value)}
              multiline
              rows={2}
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
            {mode === "edit" ? "Save Changes" : "Add Education"}
          </Button>
        </DialogActions>
      </Dialog>

      <ErrorSnackbar notification={notification} onClose={closeNotification} />
    </>
  );
};
