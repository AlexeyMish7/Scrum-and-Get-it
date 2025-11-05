import React, { useState } from "react";

// AddEmployment — form to create a new employment entry
// - Collects required fields, validates client-side, and sends a payload
//   to the employment service. On success it navigates back to the list and
//   uses navigation state to show a centralized success message.
// Student notes: the component demonstrates form validation, controlled
// components, and preparing a backend payload using snake_case keys.
import { useAuth } from "../../app/shared/context/AuthContext";
import employmentService from "../../app/workspaces/profile/services/employment";
import type { EmploymentFormData } from "../../types/employment";
import EmploymentForm from "./EmploymentForm";
import { ErrorSnackbar } from "../../app/shared/components/common/ErrorSnackbar";
import { useErrorHandler } from "../../app/shared/hooks/useErrorHandler";
import { Button, Typography, useTheme } from "@mui/material";
import "./employment.css";
import { useNavigate } from "react-router-dom";

const AddEmploymentForm: React.FC = () => {
  const [formData, setFormData] = useState<EmploymentFormData>({
    jobTitle: "",
    companyName: "",
    location: "",
    startDate: "",
    endDate: "",
    isCurrent: false,
    description: "",
  });
  const [loading, setLoading] = useState(false);
  const { handleError, notification, closeNotification } = useErrorHandler();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [errors, setErrors] = useState<
    Partial<Record<keyof EmploymentFormData, string>>
  >({});

  const handleFieldChange = (
    name: keyof EmploymentFormData,
    val: string | boolean
  ) => {
    setFormData((prev) => ({ ...(prev as EmploymentFormData), [name]: val }));
    // clear field-level error when user types
    setErrors((prev) => ({ ...(prev || {}), [name]: undefined }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Client-side validation: mark missing required fields and ensure date order.
    // Inline errors are shown so the user can quickly correct input.
    const newErrors: Partial<Record<keyof EmploymentFormData, string>> = {};
    if (!formData.jobTitle) newErrors.jobTitle = "Required";
    if (!formData.companyName) newErrors.companyName = "Required";
    if (!formData.startDate) newErrors.startDate = "Required";
    if (
      !formData.isCurrent &&
      formData.endDate &&
      formData.startDate > formData.endDate
    )
      newErrors.endDate = "End date must be the same or after start date";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      handleError("Please correct the highlighted fields.");
      setLoading(false);
      return;
    }

    try {
      if (!user) {
        handleError("Please sign in before adding employment history.");
        setLoading(false);
        return;
      }

      // If no end date provided, treat as current
      const endDateRaw = (formData.endDate ?? "").toString().trim();
      const isCurrent = endDateRaw === "" ? true : Boolean(formData.isCurrent);
      const endDate = isCurrent ? null : endDateRaw || null;

      // Validate start date present
      const startDate = (formData.startDate ?? "").toString();
      if (!startDate) {
        handleError("Start date is required.");
        setLoading(false);
        return;
      }

      if (endDate && startDate && endDate < startDate) {
        handleError("End date must be the same or after start date.");
        setLoading(false);
        return;
      }

      const payload = {
        job_title: formData.jobTitle || "",
        company_name: formData.companyName || "",
        location: formData.location || null,
        start_date: startDate,
        end_date: endDate,
        current_position: isCurrent,
        job_description: formData.description || null,
      } as const;

      const res = await employmentService.insertEmployment(user.id, payload);

      // If the server returned an error, surface it via the centralized
      // error handler and do not navigate. Previously this branch
      // navigated with a success message on error which hid failures.
      if (res.error) {
        console.error(res.error);
        handleError(res.error);
        setLoading(false);
        return;
      }

      // On success: navigate back to the list and pass a success message via
      // navigation state. The list page will show a centralized snackbar so
      // notifications are consistent across add/edit/delete flows.
      navigate("/employment-history", {
        state: { success: "Employment entry added successfully!" },
      });

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
      handleError(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    // Navigate back to the previous page. This keeps the UX simple and
    // predictable — the Cancel button behaves like the browser Back action.
    window.history.back();
  };

  const theme = useTheme();

  return (
    <form onSubmit={handleSubmit} className="glossy-card employment-form-paper">
      <Typography
        variant="h5"
        className="glossy-title"
        fontWeight="bold"
        textAlign="center"
        mb={3}
        color={theme.palette.text.primary}
      >
        Add Employment History
      </Typography>

      <div className="employment-form-fields">
        <EmploymentForm
          value={formData}
          onFieldChange={handleFieldChange}
          errors={errors}
        />
      </div>

      <ErrorSnackbar notification={notification} onClose={closeNotification} />

      <div className="employment-form-actions">
        <Button
          type="submit"
          variant="contained"
          color="primary"
          disabled={loading}
        >
          {loading ? "Saving..." : "Save"}
        </Button>
        <Button variant="outlined" onClick={handleCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
};

export default AddEmploymentForm;
