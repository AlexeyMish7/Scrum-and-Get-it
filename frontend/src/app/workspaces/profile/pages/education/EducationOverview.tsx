import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "@shared/context/AuthContext";
import { useErrorHandler } from "@shared/hooks/useErrorHandler";
import { ErrorSnackbar } from "@shared/components/feedback/ErrorSnackbar";
import { Breadcrumbs } from "@shared/components/navigation";
import EmptyState from "@shared/components/feedback/EmptyState";
import { School as SchoolIcon } from "@mui/icons-material";
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
import LoadingSpinner from "@shared/components/common/LoadingSpinner";
// Removed CSS overrides to respect global theme; rely on MUI defaults
import { parseMonthToMs } from "@shared/utils/dateUtils";

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
    <Box sx={{ width: "100%", minHeight: "100vh", p: 3 }}>
      <Breadcrumbs
        items={[{ label: "Profile", path: "/profile" }, { label: "Education" }]}
      />
      {/* Header Section
      - Title and short description on the left
      - Primary action (Add Education) on the right
      The header is intentionally compact so it visually connects to the timeline below.
    */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 2,
        }}
      >
        <Box>
          <Typography variant="h4" component="h1">
            Education Timeline
          </Typography>
          <Typography variant="body1">
            Track your academic journey and achievements
          </Typography>
        </Box>
        <Box>
          <Button
            variant="contained"
            color="primary"
            startIcon={<Add />}
            onClick={() => navigate("/profile/education/add")}
            size="medium"
          >
            Add Education
          </Button>
        </Box>
      </Box>

      {/* Content Section
      - Centered timeline area. Each entry is a card placed on alternating sides.
      - We render a friendly empty state when there are no entries.
    */}
      <Box>
        <Paper variant="outlined" sx={{ p: 2 }}>
          <Timeline position="alternate">
            {education.length === 0 ? (
              <TimelineItem>
                <TimelineOppositeContent />
                <TimelineSeparator>
                  <TimelineDot color="grey" />
                </TimelineSeparator>
                <TimelineContent>
                  <EmptyState
                    icon={<SchoolIcon />}
                    title="No education entries yet"
                    description="Click 'Add Education' to get started building your academic profile"
                  />
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
                  <TimelineItem key={edu.id}>
                    <TimelineOppositeContent>
                      <Typography variant="body2">
                        {startYear}
                        {endYear && ` - ${endYear}`}
                      </Typography>
                      {ongoing && (
                        <Typography variant="caption">Current</Typography>
                      )}
                    </TimelineOppositeContent>
                    <TimelineSeparator>
                      {/* Dot for each entry */}
                      <TimelineDot color={ongoing ? "primary" : "secondary"} />
                      {index < education.length - 1 && (
                        /* Connector between timeline dots; shown for all but last item */
                        <TimelineConnector />
                      )}
                    </TimelineSeparator>
                    <TimelineContent>
                      <Paper variant="outlined" sx={{ p: 2 }}>
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
                          />
                        )}

                        {/* Main content with improved hierarchy */}
                        <Typography variant="h6">{edu.degree}</Typography>

                        <Typography variant="subtitle1">
                          {edu.institution}
                        </Typography>

                        <Typography variant="body2">
                          {edu.fieldOfStudy}
                        </Typography>

                        {/* GPA with better styling */}
                        {edu.gpa !== undefined && !edu.gpaPrivate && (
                          <Typography variant="body2">
                            GPA: {edu.gpa}
                          </Typography>
                        )}

                        {/* Action buttons: Edit opens the dialog; Delete asks for confirmation */}
                        <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                          <Button
                            size="small"
                            variant="contained"
                            color="primary"
                            onClick={() => setEditingEntry(edu)}
                          >
                            Edit
                          </Button>
                          <Button
                            size="small"
                            variant="contained"
                            color="error"
                            onClick={() => setConfirmDeleteId(edu.id)}
                          >
                            Delete
                          </Button>
                        </Stack>
                      </Paper>
                    </TimelineContent>
                  </TimelineItem>
                );
              })
            )}
          </Timeline>
        </Paper>
      </Box>

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
    <Dialog open={true} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>Edit Education</DialogTitle>
      <DialogContent>
        <Stack spacing={3} sx={{ mt: 2 }}>
          <TextField
            label="Degree Type"
            fullWidth
            value={editedEntry.degree || ""}
            onChange={(e) =>
              setEditedEntry({ ...editedEntry, degree: e.target.value })
            }
          />
          <TextField
            label="Institution Name"
            fullWidth
            value={editedEntry.institution || ""}
            onChange={(e) =>
              setEditedEntry({ ...editedEntry, institution: e.target.value })
            }
          />
          <TextField
            label="Field of Study"
            fullWidth
            value={editedEntry.fieldOfStudy || ""}
            onChange={(e) =>
              setEditedEntry({ ...editedEntry, fieldOfStudy: e.target.value })
            }
          />
          <TextField
            label="Start Date (YYYY-MM)"
            fullWidth
            value={editedEntry.startDate || ""}
            onChange={(e) =>
              setEditedEntry({ ...editedEntry, startDate: e.target.value })
            }
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
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} variant="text" color="inherit">
          Cancel
        </Button>
        <Button
          onClick={() => onDelete(entry.id)}
          variant="contained"
          color="error"
        >
          Delete
        </Button>
        <Button onClick={handleSave} variant="contained" color="primary">
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
        <Button onClick={onCancel} variant="text" color="inherit">
          Cancel
        </Button>
        <Button onClick={onConfirm} variant="contained" color="error">
          Delete
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EducationOverview;
