import React, { useState } from "react";
/*
  AddEmployment
  -------------
  This component renders the "Add Employment" form and handles the
  following user-facing responsibilities:
  - Collects job title, company, location, start/end dates, current flag, and description.
  - Performs client-side validation (required fields, date ordering) and shows
    inline errors to help users correct mistakes quickly.
  - Treats an empty end date as a "current" position by default.
  - On success, navigates back to the Employment History page and passes a
    success message in navigation state so the list page can show a centralized
    success snackbar (keeps notifications consistent across the flow).
  - The Cancel button navigates back in history as a simple way to return to
    the previous view.
*/
import { useAuth } from "../../context/AuthContext";
import employmentService from "../../services/employment";
import type { EmploymentFormData } from "../../types/employment";
import EmploymentForm from "./EmploymentForm";
import { ErrorSnackbar } from "../../components/common/ErrorSnackbar";
import { useErrorHandler } from "../../hooks/useErrorHandler";
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

      if (res.error) {
        navigate("/employment-history", {
          state: { success: "Employment added" },
        });
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
