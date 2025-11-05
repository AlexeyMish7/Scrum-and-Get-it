import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "../../app/shared/context/AuthContext";
import { useErrorHandler } from "../../app/shared/hooks/useErrorHandler";
import { ErrorSnackbar } from "../../app/shared/components/common/ErrorSnackbar";
import educationService from "../../services/education";
import type { EducationEntry } from "../../types/education";
import {
  Box,
  Typography,
  Button,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Switch,
  FormControlLabel,
  Stack,
  Chip,
  Avatar,
} from "@mui/material";
import {
  Timeline,
  TimelineItem,
  TimelineSeparator,
  TimelineConnector,
  TimelineContent,
  TimelineDot,
  TimelineOppositeContent,
} from "@mui/lab";
import { Add } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import LoadingSpinner from "../../app/shared/components/common/LoadingSpinner";
import "./EducationOverview.css";
import { parseMonthToMs } from "../../utils/dateUtils";

/*
  EducationOverview
  - Shows the user's education timeline as a vertical, alternating list.
  - Uses the shared `educationService` to load/update/delete entries.
  - Uses centralized error handling and theme button variants for consistency.
  - Contains small dialogs for editing and confirming deletes.
*/

const EducationOverview: React.FC = () => {
  // Auth + navigation
  // `user` comes from AuthContext; `loading` is true while auth initializes.
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  // Centralized error handling
  // useErrorHandler gives us a simple way to show errors and success notifications.
  const { notification, closeNotification, handleError, showSuccess } =
    useErrorHandler();

  // Local UI state
  // - `education` holds the list shown in the timeline
  // - `isLoading` shows a loading spinner while requests are in-flight
  // - `error` is a transient error message forwarded to handleError
  const [education, setEducation] = useState<EducationEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Dialog state
  // - `editingEntry` controls the edit dialog when not null
  // - `confirmDeleteId` controls the delete confirmation dialog when not null
  const [editingEntry, setEditingEntry] = useState<EducationEntry | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Use shared date utility to convert YYYY-MM strings to milliseconds.
  // Returns 0 for invalid/missing input so sorting is stable.
  const dateToMs = (s?: string | undefined) => parseMonthToMs(s ?? undefined);

  // Fetch the user's education entries from the shared service.
  // Keeps loading state and funnels any errors into the centralized handler.
  const loadEducation = useCallback(async () => {
    if (!user?.id) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const result = await educationService.listEducation(user.id);

      if (result.error) {
        // Surface a friendly message; the hook will display it.
        setError("Failed to load education data. Please try again.");
        return;
      }

      // Sort by start date descending (most recent first) so newest entries appear at top.
      const sorted = result.data.sort(
        (a, b) => dateToMs(b.startDate) - dateToMs(a.startDate)
      );
      setEducation(sorted);
    } catch (err) {
      // Keep a console trace for developers and show a friendly UI message.
      console.error("Error loading education:", err);
      setError("Failed to load education data. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  // Initial load
  useEffect(() => {
    if (!loading && user?.id) {
      loadEducation();
    }
  }, [user?.id, loading, loadEducation]);

  // Listen for education changes
  useEffect(() => {
    let mounted = true;

    const handler = () => {
      if (mounted && user?.id) {
        loadEducation();
      }
    };

    window.addEventListener("education:changed", handler);

    return () => {
      mounted = false;
      window.removeEventListener("education:changed", handler);
    };
  }, [user?.id, loading, loadEducation]);

  // When an error string is set we forward it to the global handler and clear it.

  // If any code sets `error`, hand it to the shared UI error handler.
  // The handler shows a snack/toast and we clear the local string afterwards.
  useEffect(() => {
    if (error) {
      handleError(error);
      setError(null); // Clear error after showing it
    }
  }, [error, handleError]);

  // Called when the edit dialog saves an entry.
  // Sends the updated fields to the shared service and reloads the list.
  const handleSaveEntry = async (updatedEntry: EducationEntry) => {
    if (!user?.id) return;

    try {
      const formData = {
        degree: updatedEntry.degree,
        institution: updatedEntry.institution,
        fieldOfStudy: updatedEntry.fieldOfStudy,
        startDate: updatedEntry.startDate,
        endDate: updatedEntry.endDate,
        gpa: updatedEntry.gpa,
        gpaPrivate: updatedEntry.gpaPrivate,
        honors: updatedEntry.honors,
        active: updatedEntry.active,
      };

      await educationService.updateEducation(
        user.id,
        updatedEntry.id,
        formData
      );
      showSuccess("Education updated successfully");
      setEditingEntry(null);
      await loadEducation();
    } catch (err) {
      handleError(err);
    }
  };

  // Called when the user confirms delete.
  // Uses the service to remove the row and refreshes the timeline.
  const handleDeleteEntry = async (id: string) => {
    if (!user?.id) return;

    try {
      await educationService.deleteEducation(user.id, id);
      showSuccess("Education deleted successfully");
      setConfirmDeleteId(null);
      await loadEducation();
    } catch (err) {
      handleError(err);
    }
  };

  if (isLoading || loading) {
    return <LoadingSpinner />;
  }

  return (
    <Box className="education-overview-container">
      {/* Header Section
      - Title and short description on the left
      - Primary action (Add Education) on the right
      The header is intentionally compact so it visually connects to the timeline below.
    */}
      <div className="education-header-section">
        <div className="education-header-content">
          <div className="education-header-text">
            <Typography variant="h4" component="h1" className="education-title">
              Education Timeline
            </Typography>
            <Typography variant="body1" className="education-subtitle">
              Track your academic journey and achievements
            </Typography>
          </div>
          <div className="education-header-actions">
            <Button
              variant="primary"
              startIcon={<Add />}
              onClick={() => navigate("/education/manage")}
              size="medium"
            >
              Add Education
            </Button>
          </div>
        </div>
      </div>

      {/* Content Section
      - Centered timeline area. Each entry is a card placed on alternating sides.
      - We render a friendly empty state when there are no entries.
    */}
      <div className="education-content-section">
        <Paper className="education-timeline-container" elevation={0}>
          <Timeline position="alternate">
            {education.length === 0 ? (
              <TimelineItem>
                <TimelineOppositeContent />
                <TimelineSeparator>
                  {/* Empty-state dot: styled via CSS to keep visuals centralized */}
                  <TimelineDot className="timeline-dot-empty" />
                </TimelineSeparator>
                <TimelineContent className="education-timeline-content">
                  <Box className="education-card">
                    {/* Empty state: encourage the user to add their first entry */}
                    <Typography
                      variant="body1"
                      className="education-empty-text"
                    >
                      No education entries yet. Click "+ Add Education" to get
                      started building your academic profile.
                    </Typography>
                  </Box>
                </TimelineContent>
              </TimelineItem>
            ) : (
              education.map((edu, index) => {
                const ongoing = edu.active || !edu.endDate;
                const startYear = edu.startDate?.substring(0, 4) || "";
                const endYear = ongoing
                  ? "Present"
                  : edu.endDate?.substring(0, 4) || "";

                // Each timeline item shows dates on the side, a dot/connector,
                // and a white card with the education details and action buttons.
                return (
                  <TimelineItem
                    key={edu.id}
                    className="education-timeline-item"
                  >
                    <TimelineOppositeContent className="education-timeline-dates">
                      <Typography variant="body2">
                        {startYear}
                        {endYear && ` - ${endYear}`}
                      </Typography>
                      {ongoing && (
                        <Typography
                          variant="caption"
                          className="education-current-badge"
                        >
                          Current
                        </Typography>
                      )}
                    </TimelineOppositeContent>
                    <TimelineSeparator>
                      {/* Dot for each entry; CSS controls size and color */}
                      <TimelineDot
                        className={
                          ongoing ? "timeline-dot-ongoing" : "timeline-dot"
                        }
                      />
                      {index < education.length - 1 && (
                        /* Connector between timeline dots; shown for all but last item */
                        <TimelineConnector className="timeline-connector" />
                      )}
                    </TimelineSeparator>
                    <TimelineContent className="education-timeline-content">
                      <Box
                        className={`education-card ${
                          ongoing
                            ? "education-card-ongoing"
                            : "education-card-completed"
                        }`}
                      >
                        {/* Honors chip */}
                        {edu.honors && (
                          <Chip
                            label={edu.honors}
                            size="small"
                            avatar={
                              <Avatar
                                sx={{
                                  width: 18,
                                  height: 18,
                                  fontSize: "0.7rem",
                                }}
                              >
                                🏆
                              </Avatar>
                            }
                            className="education-honors-chip"
                          />
                        )}

                        {/* Main content with improved hierarchy */}
                        <Typography
                          variant="h6"
                          className="education-card-title"
                        >
                          {edu.degree}
                        </Typography>

                        <Typography
                          variant="subtitle1"
                          className="education-card-institution"
                        >
                          {edu.institution}
                        </Typography>

                        <Typography
                          variant="body2"
                          className="education-card-field"
                        >
                          {edu.fieldOfStudy}
                        </Typography>

                        {/* GPA with better styling */}
                        {edu.gpa !== undefined && !edu.gpaPrivate && (
                          <Typography
                            variant="body2"
                            className="education-card-gpa"
                          >
                            GPA: {edu.gpa}
                          </Typography>
                        )}

                        {/* Action buttons: Edit opens the dialog; Delete asks for confirmation */}
                        <Stack
                          direction="row"
                          spacing={1}
                          className="education-card-actions"
                        >
                          <Button
                            size="small"
                            variant="primary"
                            onClick={() => setEditingEntry(edu)}
                          >
                            Edit
                          </Button>
                          <Button
                            size="small"
                            variant="destructive"
                            onClick={() => setConfirmDeleteId(edu.id)}
                          >
                            Delete
                          </Button>
                        </Stack>
                      </Box>
                    </TimelineContent>
                  </TimelineItem>
                );
              })
            )}
          </Timeline>
        </Paper>
      </div>

      {/* Error Handling: shared snackbar used across pages */}
      <ErrorSnackbar notification={notification} onClose={closeNotification} />

      {/* Edit Dialog */}
      {editingEntry && (
        <EditEducationDialog
          entry={editingEntry}
          onClose={() => setEditingEntry(null)}
          onSave={handleSaveEntry}
          onDelete={(id) => {
            setConfirmDeleteId(id);
            setEditingEntry(null);
          }}
        />
      )}

      {/* Delete Confirmation Dialog */}
      {confirmDeleteId && (
        <DeleteConfirmationDialog
          onConfirm={() => handleDeleteEntry(confirmDeleteId)}
          onCancel={() => setConfirmDeleteId(null)}
        />
      )}
    </Box>
  );
};

// Edit Education Dialog Component
// A small form shown in a modal to edit an existing education entry.
// It uses local component state and calls `onSave` with the updated object.
interface EditEducationDialogProps {
  entry: EducationEntry;
  onClose: () => void;
  onSave: (entry: EducationEntry) => void;
  onDelete: (id: string) => void;
}

const EditEducationDialog: React.FC<EditEducationDialogProps> = ({
  entry,
  onClose,
  onSave,
  onDelete,
}) => {
  const [editedEntry, setEditedEntry] = useState<EducationEntry>({ ...entry });

  const handleSave = () => {
    onSave(editedEntry);
  };

  return (
    <Dialog
      open={true}
      onClose={onClose}
      fullWidth
      maxWidth="md"
      className="education-dialog"
    >
      <DialogTitle className="education-dialog-title">
        Edit Education
      </DialogTitle>
      <DialogContent className="education-dialog-content">
        <Stack spacing={3} sx={{ mt: 2 }}>
          <TextField
            label="Degree Type"
            fullWidth
            value={editedEntry.degree || ""}
            onChange={(e) =>
              setEditedEntry({ ...editedEntry, degree: e.target.value })
            }
            className="education-dialog-field"
          />
          <TextField
            label="Institution Name"
            fullWidth
            value={editedEntry.institution || ""}
            onChange={(e) =>
              setEditedEntry({ ...editedEntry, institution: e.target.value })
            }
            className="education-dialog-field"
          />
          <TextField
            label="Field of Study"
            fullWidth
            value={editedEntry.fieldOfStudy || ""}
            onChange={(e) =>
              setEditedEntry({ ...editedEntry, fieldOfStudy: e.target.value })
            }
            className="education-dialog-field"
          />
          <TextField
            label="Start Date (YYYY-MM)"
            fullWidth
            value={editedEntry.startDate || ""}
            onChange={(e) =>
              setEditedEntry({ ...editedEntry, startDate: e.target.value })
            }
            className="education-dialog-field"
          />
          <FormControlLabel
            control={
              <Switch
                checked={editedEntry.active || !editedEntry.endDate}
                onChange={(e) =>
                  setEditedEntry({
                    ...editedEntry,
                    active: e.target.checked,
                    endDate: e.target.checked
                      ? undefined
                      : editedEntry.endDate || "",
                  })
                }
              />
            }
            label="Currently Enrolled"
          />
          <TextField
            label="End Date (YYYY-MM)"
            fullWidth
            value={editedEntry.endDate || ""}
            onChange={(e) =>
              setEditedEntry({
                ...editedEntry,
                endDate: e.target.value || undefined,
              })
            }
            disabled={editedEntry.active}
            helperText="Leave empty if currently enrolled"
            className="education-dialog-field"
          />
          <TextField
            label="GPA"
            type="number"
            fullWidth
            value={editedEntry.gpa?.toString() || ""}
            onChange={(e) =>
              setEditedEntry({
                ...editedEntry,
                gpa: parseFloat(e.target.value) || undefined,
              })
            }
            className="education-dialog-field"
          />
          <FormControlLabel
            control={
              <Switch
                checked={editedEntry.gpaPrivate ?? false}
                onChange={(e) =>
                  setEditedEntry({
                    ...editedEntry,
                    gpaPrivate: e.target.checked,
                  })
                }
              />
            }
            label="Hide GPA"
          />
          <TextField
            label="Achievements & Honors"
            fullWidth
            multiline
            rows={3}
            value={editedEntry.honors || ""}
            onChange={(e) =>
              setEditedEntry({ ...editedEntry, honors: e.target.value })
            }
            className="education-dialog-field"
          />
        </Stack>
      </DialogContent>
      <DialogActions className="education-dialog-actions">
        <Button
          onClick={onClose}
          variant="secondary"
          className="education-dialog-cancel"
        >
          Cancel
        </Button>
        <Button
          onClick={() => onDelete(entry.id)}
          variant="destructive"
          className="education-dialog-delete"
        >
          Delete
        </Button>
        <Button
          onClick={handleSave}
          variant="primary"
          className="education-dialog-save"
        >
          Save Changes
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// Delete Confirmation Dialog Component
// Simple confirmation modal shown when the user tries to remove an entry.
// Keeps the UI flow explicit and prevents accidental deletes.
interface DeleteConfirmationDialogProps {
  onConfirm: () => void;
  onCancel: () => void;
}

const DeleteConfirmationDialog: React.FC<DeleteConfirmationDialogProps> = ({
  onConfirm,
  onCancel,
}) => {
  return (
    <Dialog open={true} onClose={onCancel}>
      <DialogTitle>Confirm Delete</DialogTitle>
      <DialogContent>
        <Typography>
          Are you sure you want to delete this education entry? This action
          cannot be undone.
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onCancel} variant="secondary">
          Cancel
        </Button>
        <Button onClick={onConfirm} variant="destructive">
          Delete
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EducationOverview;
