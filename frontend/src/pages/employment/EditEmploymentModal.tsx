import { useState, useRef, useEffect } from "react";

// EditEmploymentModal — lightweight edit dialog
// - Renders the shared EmploymentForm inside a dialog and saves changes.
// - Focuses the first input for accessibility and delegates notifications
//   to the parent list via navigation state (keeps success messages centralized).
// Student note: mapping between DB row (snake_case) and form shape (camelCase)
// is done once at the top so the form component stays simple.
import type { RefObject } from "react";
import { useAuth } from "../../app/shared/context/AuthContext";
import employmentService from "../../services/employment";
import type { EmploymentFormData, EmploymentRow } from "../../types/employment";
import { useErrorHandler } from "../../app/shared/hooks/useErrorHandler";
import { ErrorSnackbar } from "../../app/shared/components/common/ErrorSnackbar";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
} from "@mui/material";
import "./employment.css";
import EmploymentForm from "./EmploymentForm";
import { useNavigate, useLocation } from "react-router-dom";

interface Props {
  entry: EmploymentRow;
  onClose: () => void;
  // onSave: notify parent to refresh list (notifications are delivered via
  // navigation state so they appear in the central list view).
  onSave: () => void;
}

export default function EditEmploymentModal({ entry, onClose, onSave }: Props) {
  const { user } = useAuth();
  // Map incoming DB row (snake_case) into the UI form shape (camelCase)
  const initialForm: EmploymentFormData = {
    jobTitle: (entry.job_title as string) ?? "",
    companyName: (entry.company_name as string) ?? "",
    location: (entry.location as string) ?? "",
    startDate: (entry.start_date as string) ?? "",
    endDate: (entry.end_date as string) ?? "",
    isCurrent: Boolean(entry.current_position),
    description: (entry.job_description as string) ?? "",
  };

  const [formData, setFormData] = useState<EmploymentFormData>(initialForm);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<
    Partial<Record<keyof EmploymentFormData, string>>
  >({});
  const { handleError, notification, closeNotification } = useErrorHandler();
  const navigate = useNavigate();
  const location = useLocation();
  const firstFieldRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Focus the first input when dialog opens to improve keyboard UX.
    firstFieldRef.current?.focus();
  }, []);

  // Update a single form field; parent keeps the full form state.
  const handleFieldChange = (
    name: keyof EmploymentFormData,
    val: string | boolean
  ) => {
    setFormData((prev) => ({ ...(prev as EmploymentFormData), [name]: val }));
    setErrors((prev) => ({ ...(prev || {}), [name]: undefined }));
  };

  const handleSave = async () => {
    setLoading(true);
    // clear handled by centralized snackbar
    try {
      if (!user) {
        handleError("Please sign in to save changes.");
        setLoading(false);
        return;
      }

      if (!entry.id) {
        handleError("Missing entry id. Cannot save changes.");
        setLoading(false);
        return;
      }

      // Basic validations: mark missing required fields and ensure date ordering
      const jobTitle = (formData.jobTitle ?? "").toString().trim();
      const companyName = (formData.companyName ?? "").toString().trim();

      const newErrors: Partial<Record<keyof EmploymentFormData, string>> = {};
      if (!jobTitle) newErrors.jobTitle = "Required";
      if (!companyName) newErrors.companyName = "Required";

      const startDate = (
        formData.startDate ??
        entry.start_date ??
        ""
      ).toString();
      if (!startDate) newErrors.startDate = "Required";

      const endDateRaw = (formData.endDate ?? "").toString().trim();
      const isCurrent = endDateRaw === "" ? true : Boolean(formData.isCurrent);
      const endDate = isCurrent ? null : endDateRaw || null;

      if (endDate && startDate && endDate < startDate)
        newErrors.endDate = "End date must be the same or after start date";

      if (Object.keys(newErrors).length > 0) {
        // Show inline field errors and a friendly top-level message
        setErrors(newErrors);
        handleError("Please fix the highlighted fields.");
        setLoading(false);
        return;
      }

      // Build an explicit payload using DB column names (snake_case). Keep
      // values explicit to avoid accidental partial updates — we always send
      // the full shape expected by the backend.
      const payload = {
        job_title: jobTitle || (entry.job_title as string) || "",
        company_name: companyName || (entry.company_name as string) || "",
        location: formData.location ?? null,
        start_date: startDate,
        end_date: endDate,
        current_position: isCurrent,
        job_description: formData.description ?? null,
      } as const;

      // Perform the update and delegate notification display to the list via
      // navigation state so users always see success messages in one place.
      const res = await employmentService.updateEmployment(
        user.id,
        entry.id,
        payload
      );
      setLoading(false);

      if (res.error) {
        console.error(res.error);
        handleError(res.error);
      } else {
        // Close modal and refresh parent list
        onSave();
        // Use navigation state to surface a centralized success snackbar on the list page
        navigate(location.pathname, {
          replace: true,
          state: { success: "Changes saved successfully!" },
        });
      }
    } catch (e) {
      console.error(e);
      handleError(e);
      setLoading(false);
    }
  };

  return (
    <Dialog
      open
      onClose={onClose}
      fullWidth
      maxWidth="sm"
      aria-labelledby="edit-employment-title"
    >
      <DialogTitle id="edit-employment-title">Edit Employment</DialogTitle>
      <DialogContent dividers className="glossy-card">
        <EmploymentForm
          value={formData}
          onFieldChange={handleFieldChange}
          errors={errors}
          firstFieldRef={firstFieldRef as RefObject<HTMLInputElement>}
        />

        {/* Messages are surfaced via the centralized ErrorSnackbar */}
        <ErrorSnackbar
          notification={notification}
          onClose={closeNotification}
        />
      </DialogContent>
      <DialogActions>
        <Button variant="outlined" color="inherit" onClick={onClose}>
          Cancel
        </Button>
        <Button
          variant="contained"
          color="primary"
          onClick={handleSave}
          disabled={loading}
        >
          {loading ? "Saving..." : "Save Changes"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
