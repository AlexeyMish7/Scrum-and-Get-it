import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { isMonthAfter } from "../../utils/dateUtils";
import { useAuth } from "../../app/shared/context/AuthContext";
import educationService from "../../services/education";
import type { EducationEntry } from "../../types/education";
import { useErrorHandler } from "../../app/shared/hooks/useErrorHandler";
import { ErrorSnackbar } from "../../components/common/ErrorSnackbar";
import {
  Box,
  Typography,
  TextField,
  Button,
  Switch,
  FormControlLabel,
  MenuItem,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Paper,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Divider,
  Tooltip,
} from "@mui/material";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import "./AddEducation.css";

// List of education levels users can choose from
const degreeOptions = [
  "High School",
  "Associate",
  "Bachelor's",
  "Master's",
  "PhD",
  "Certificate",
];

const AddEducation: React.FC = () => {
  // Get user info and login status from our authentication system
  const { user, loading } = useAuth();
  // Function to navigate to different pages
  const navigate = useNavigate();

  // Centralized error handling
  const {
    notification,
    closeNotification,
    handleError,
    showSuccess,
    showWarning,
  } = useErrorHandler();

  // Keep track of all education entries the user has added
  const [schoolList, setSchoolList] = useState<EducationEntry[]>([]);
  // Track which entry user wants to delete (null means no deletion in progress)
  const [removeId, setRemoveId] = useState<string | null>(null);

  // Store what the user is typing in the form
  const [formData, setFormData] = useState<Partial<EducationEntry>>({
    degree: "",
    institution: "",
    fieldOfStudy: "",
    startDate: "",
    endDate: undefined,
    gpa: undefined,
    gpaPrivate: false,
    honors: undefined,
    active: false, // true if currently enrolled
  });

  // Helper function to update any field in the form
  const updateField = (k: keyof EducationEntry, v: unknown) =>
    setFormData((s) => ({ ...(s ?? {}), [k]: v }));

  // Check if form has required information before allowing submission
  const validate = () => {
    // User must provide either a degree type OR field of study (or both)
    const hasDegreeOrField = Boolean(
      (formData.degree && String(formData.degree).trim()) ||
        (formData.fieldOfStudy && String(formData.fieldOfStudy).trim())
    );

    // All three pieces are required: institution, start date, and degree/field
    const hasRequiredFields = Boolean(
      formData.institution && formData.startDate && hasDegreeOrField
    );

    // If not currently enrolled and end date is provided, validate it's after start date
    if (!formData.active && formData.endDate && formData.startDate) {
      // If not active, and both dates provided, ensure endDate is after startDate
      const isValid = isMonthAfter(formData.startDate, formData.endDate);
      if (!isValid) return false;
    }

    return hasRequiredFields;
  };

  // Handle when user clicks "Add Education" button
  const addEntry = async () => {
    // Don't submit if required fields are missing
    if (!validate()) {
      // Check specific validation issues for better error messages
      if (!formData.institution || !formData.startDate) {
        showWarning(
          "Please complete required fields: Institution and Start Date."
        );
      } else if (!formData.degree && !formData.fieldOfStudy) {
        showWarning("Please provide either a Degree Type or Field of Study.");
      } else if (!formData.active && formData.endDate && formData.startDate) {
        const startDate = new Date(formData.startDate);
        const endDate = new Date(formData.endDate);
        if (endDate <= startDate) {
          showWarning("End date must be after start date.");
        }
      } else {
        showWarning("Please complete required fields.");
      }
      return;
    }

    // If user isn't logged in, just store locally (won't be saved permanently)
    if (loading || !user) {
      // Create temporary ID for local storage
      const id = crypto.randomUUID();
      setSchoolList((s) => [
        ...s,
        {
          id,
          degree: formData.degree ?? "",
          institution: formData.institution ?? "",
          fieldOfStudy: formData.fieldOfStudy ?? "",
          startDate: formData.startDate ?? "",
          endDate: formData.endDate ?? undefined,
          gpa: formData.gpa ?? undefined,
          gpaPrivate: formData.gpaPrivate ?? false,
          honors: formData.honors ?? undefined,
          active: formData.active ?? false,
        },
      ]);
      // Clear form for next entry
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
      showSuccess("Education added (local)");
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

      // Save to database through our education service
      const res = await educationService.createEducation(user.id, payload);
      if (res.error) {
        console.error("Failed to insert education", res.error);
        handleError(res.error);
        return;
      }

      // Add to local list so user sees it immediately
      setSchoolList((s) => [...s, res.data as EducationEntry]);
      // Clear form for next entry
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
      // Tell other parts of app that education data changed
      window.dispatchEvent(new Event("education:changed"));
      showSuccess("Education saved");
      // Go back to education overview page
      navigate("/education");
    } catch (err) {
      console.error("Error adding education", err);
      handleError(err);
    }
  };

  // Handle deleting an education entry
  const deleteEntry = async () => {
    // Don't do anything if no entry is selected for deletion
    if (!removeId) return;

    // If user isn't logged in, just remove from local list
    if (loading || !user) {
      setSchoolList((s) => s.filter((x) => x.id !== removeId));
      setRemoveId(null); // Close delete dialog
      showSuccess("Entry removed");
      return;
    }

    try {
      // Remove from database
      const res = await educationService.deleteEducation(user.id, removeId);
      if (res.error) {
        console.error("Failed to delete education", res.error);
        handleError(res.error);
        return;
      }
      // Remove from local list so user sees change immediately
      setSchoolList((s) => s.filter((x) => x.id !== removeId));
      setRemoveId(null); // Close delete dialog
      showSuccess("Entry removed");
    } catch (err) {
      console.error("Error deleting education", err);
      handleError(err);
    }
  };

  // Load user's existing education entries when page first opens
  useEffect(() => {
    // Don't load if still checking login status or user not logged in
    if (loading || !user) return;

    let mounted = true; // Prevent updating state if component unmounts
    (async () => {
      try {
        // Get education entries from database
        const res = await educationService.listEducation(user.id);
        if (!mounted) return; // Component was unmounted, don't update
        if (res.error) {
          console.error("Failed to load education rows", res.error);
          handleError(res.error);
          return;
        }
        // Show entries in the list
        setSchoolList(res.data ?? []);
      } catch (err) {
        console.error("Error loading education", err);
        if (mounted) {
          handleError(err);
        }
      }
    })();

    // Cleanup function to prevent memory leaks
    return () => {
      mounted = false;
    };
  }, [user, loading, handleError]); // Run this when user or loading status changes

  return (
    // Main page container - centers content and adds padding
    <Box className="education-page-container">
      <Box className="education-content-wrapper">
        {/* Page title */}
        <Typography variant="h4" mb={2} className="education-page-title">
          Education Manager
        </Typography>

        {/* Main form container with glassmorphism styling */}
        <Paper className="education-form-container" elevation={0}>
          <Box sx={{ width: "100%" }}>
            {/* Form fields container with hover effects */}
            <Stack spacing={2}>
              {/* Dropdown to select degree type */}
              <TextField
                select
                fullWidth
                size="small"
                required
                label="Degree Type"
                value={formData.degree ?? ""}
                onChange={(e) => updateField("degree", e.target.value)}
              >
                {degreeOptions.map((degree) => (
                  <MenuItem key={degree} value={degree}>
                    {degree}
                  </MenuItem>
                ))}
              </TextField>

              {/* School/university name field */}
              <TextField
                fullWidth
                size="small"
                label="Institution"
                value={formData.institution ?? ""}
                onChange={(e) => updateField("institution", e.target.value)}
                helperText={!formData.institution ? "Required" : ""}
                error={!formData.institution}
              />

              {/* What subject/major was studied */}
              <TextField
                fullWidth
                size="small"
                label="Field of Study"
                value={formData.fieldOfStudy ?? ""}
                onChange={(e) => updateField("fieldOfStudy", e.target.value)}
              />

              {/* Date inputs for when education started and ended */}
              <Box>
                <TextField
                  fullWidth
                  size="small"
                  label="Start Date"
                  required
                  inputProps={{ type: "month" }} // Shows month/year picker
                  InputLabelProps={{ shrink: true }} // Keeps label above input
                  value={formData.startDate ?? ""}
                  onChange={(e) => updateField("startDate", e.target.value)}
                  helperText={!formData.startDate ? "Required" : ""}
                  error={!formData.startDate}
                  sx={{ mb: 2 }}
                />

                {/* Toggle for currently enrolled */}
                <FormControlLabel
                  control={
                    <Switch
                      checked={Boolean(formData.active)}
                      onChange={(e) => updateField("active", e.target.checked)}
                    />
                  }
                  label="Currently Enrolled"
                  sx={{ mb: 2 }}
                />

                {/* Only show end date if not currently enrolled */}
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
              </Box>

              {/* Optional GPA field */}
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
              />

              {/* Toggle to hide GPA from being displayed publicly */}
              <FormControlLabel
                control={
                  <Switch
                    checked={Boolean(formData.gpaPrivate)}
                    onChange={(e) =>
                      updateField("gpaPrivate", e.target.checked)
                    }
                  />
                }
                label="Hide GPA"
              />

              {/* Free text field for awards, honors, etc. */}
              <TextField
                fullWidth
                size="small"
                label="Achievements / Honors"
                value={formData.honors ?? ""}
                onChange={(e) => updateField("honors", e.target.value)}
              />

              {/* Submit button with gradient and hover effects */}
              <Button
                variant="contained"
                onClick={addEntry}
                className="education-submit-button"
              >
                Add Education
              </Button>
            </Stack>
          </Box>
        </Paper>

        {/* List of education entries the user has added */}
        <Paper className="education-entries-container">
          <Typography variant="subtitle1" className="education-entries-title">
            Your entries
          </Typography>
          <List disablePadding>
            {/* Show message if no entries exist yet */}
            {schoolList.length === 0 && (
              <Typography variant="body2" className="education-no-entries">
                No entries yet.
              </Typography>
            )}
            {/* Display each education entry with delete button */}
            {schoolList.map((item, idx) => (
              <React.Fragment key={item.id}>
                <ListItem
                  secondaryAction={
                    <Tooltip title="Remove">
                      <IconButton
                        edge="end"
                        aria-label="delete"
                        onClick={() => setRemoveId(item.id)}
                      >
                        <DeleteOutlineIcon color="error" />
                      </IconButton>
                    </Tooltip>
                  }
                >
                  <ListItemText
                    primary={`${item.degree} @ ${item.institution}`}
                    secondary={item.fieldOfStudy}
                  />
                </ListItem>
                {/* Add divider between entries (except after last one) */}
                {idx < schoolList.length - 1 && <Divider component="li" />}
              </React.Fragment>
            ))}
          </List>
        </Paper>

        {/* Confirmation dialog when user wants to delete an entry */}
        <Dialog open={!!removeId} onClose={() => setRemoveId(null)}>
          <DialogTitle className="education-dialog-content">
            Delete entry?
          </DialogTitle>
          <DialogContent className="education-dialog-content">
            Are you sure you want to remove this education entry?
          </DialogContent>
          <DialogActions className="education-dialog-content">
            <Button onClick={() => setRemoveId(null)}>Cancel</Button>
            <Button color="error" onClick={deleteEntry}>
              Delete
            </Button>
          </DialogActions>
        </Dialog>

        {/* Centralized error/success notifications */}
        <ErrorSnackbar
          notification={notification}
          onClose={closeNotification}
        />
      </Box>
    </Box>
  );
};

export default AddEducation;
