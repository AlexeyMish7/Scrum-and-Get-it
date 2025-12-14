import { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Stack,
} from "@mui/material";
import { useAuth } from "@shared/context/AuthContext";
import { useProfileChange } from "@shared/context";
import { useUnifiedCacheUtils } from "@profile/cache";
import projectsService from "../../services/projects";
import type { ProjectRow } from "../../types/project";
import { ErrorSnackbar } from "@shared/components/feedback/ErrorSnackbar";
import { useErrorHandler } from "@shared/hooks/useErrorHandler";
import { useConfirmDialog } from "@shared/hooks/useConfirmDialog";

interface AddProjectDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  mode?: "add" | "edit";
  existingEntry?: ProjectRow;
}

export const AddProjectDialog = ({
  open,
  onClose,
  onSuccess,
  mode = "add",
  existingEntry,
}: AddProjectDialogProps) => {
  const { user, loading } = useAuth();
  const { markProfileChanged } = useProfileChange();
  const { invalidateAll } = useUnifiedCacheUtils();
  const {
    notification,
    closeNotification,
    handleError,
    showSuccess,
    showWarning,
  } = useErrorHandler();
  const { confirm } = useConfirmDialog();

  // Form state
  const [formData, setFormData] = useState({
    proj_name: "",
    proj_description: "",
    role: "",
    start_date: "",
    end_date: "",
    status: "planned" as "planned" | "ongoing" | "completed",
    tech_and_skills: "",
    industry_proj_type: "",
    team_size: "",
    team_details: "",
    project_url: "",
    proj_outcomes: "",
  });

  const [submitting, setSubmitting] = useState(false);
  const [showErrors, setShowErrors] = useState(false);

  // Reset form when dialog opens or mode/entry changes
  useEffect(() => {
    if (open) {
      if (mode === "edit" && existingEntry) {
        setFormData({
          proj_name: existingEntry.proj_name || "",
          proj_description: existingEntry.proj_description || "",
          role: existingEntry.role || "",
          start_date: existingEntry.start_date || "",
          end_date: existingEntry.end_date || "",
          status: existingEntry.status || "planned",
          tech_and_skills: Array.isArray(existingEntry.tech_and_skills)
            ? existingEntry.tech_and_skills.join(", ")
            : "",
          industry_proj_type: existingEntry.industry_proj_type || "",
          team_size: existingEntry.team_size?.toString() || "",
          team_details: existingEntry.team_details || "",
          project_url: existingEntry.project_url || "",
          proj_outcomes: existingEntry.proj_outcomes || "",
        });
      } else {
        setFormData({
          proj_name: "",
          proj_description: "",
          role: "",
          start_date: "",
          end_date: "",
          status: "planned",
          tech_and_skills: "",
          industry_proj_type: "",
          team_size: "",
          team_details: "",
          project_url: "",
          proj_outcomes: "",
        });
      }
    }
  }, [open, mode, existingEntry]);

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleClose = () => {
    setShowErrors(false);
    onClose();
  };

  const handleSubmit = async () => {
    if (submitting) return;
    setShowErrors(true);

    const trimmedName = formData.proj_name.trim();
    const trimmedStart = formData.start_date;

    if (!trimmedName) {
      showWarning("Project name is required.");
      return;
    }

    if (!trimmedStart) {
      showWarning("Start date is required.");
      return;
    }

    if (!user) {
      showWarning("Please sign in to continue.");
      return;
    }

    setSubmitting(true);

    try {
      // Convert tech_and_skills from comma-separated string to array
      const techArray = formData.tech_and_skills
        .split(",")
        .map((s) => s.trim())
        .filter((s) => s.length > 0);

      const payload: Partial<ProjectRow> = {
        proj_name: trimmedName,
        proj_description: formData.proj_description.trim() || null,
        role: formData.role.trim() || null,
        start_date: trimmedStart || null,
        end_date: formData.end_date || null,
        status: formData.status,
        tech_and_skills: techArray.length > 0 ? techArray : null,
        industry_proj_type: formData.industry_proj_type.trim() || null,
        team_size: formData.team_size ? parseInt(formData.team_size, 10) : null,
        team_details: formData.team_details.trim() || null,
        project_url: formData.project_url.trim() || null,
        proj_outcomes: formData.proj_outcomes.trim() || null,
      };

      let res;
      if (mode === "edit" && existingEntry) {
        res = await projectsService.updateProject(
          user.id,
          existingEntry.id,
          payload
        );
      } else {
        res = await projectsService.insertProject(user.id, payload);
      }

      if (res.error) {
        console.error("Submit error:", res.error);
        handleError(res.error);
      } else {
        showSuccess(
          mode === "edit"
            ? "Project updated successfully!"
            : "Project added successfully!"
        );

        // Invalidate unified cache so all components get fresh data
        await invalidateAll();

        markProfileChanged();
        onSuccess?.();
        handleClose();
      }
    } catch (e) {
      console.error("Project submit error:", e);
      handleError(e);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (submitting) return;
    if (!user || !existingEntry) return;

    const confirmed = await confirm({
      title: "Delete project?",
      message: "This will permanently delete this project.",
      confirmText: "Delete",
      confirmColor: "error",
    });

    if (!confirmed) return;

    setSubmitting(true);

    try {
      const res = await projectsService.deleteProject(
        user.id,
        existingEntry.id
      );
      if (res.error) {
        console.error("Delete error:", res.error);
        handleError(res.error);
      } else {
        showSuccess("Project deleted successfully!");

        // Invalidate unified cache so all components get fresh data
        await invalidateAll();

        markProfileChanged();
        onSuccess?.();
        onClose();
      }
    } catch (e) {
      console.error("Delete error:", e);
      handleError(e);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return null;

  return (
    <>
      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogTitle>
          {mode === "edit" ? "Edit Project" : "Add Project"}
        </DialogTitle>
        <DialogContent dividers sx={{ pt: 3 }}>
          <Stack spacing={2}>
            <TextField
              label="Project Name"
              value={formData.proj_name}
              onChange={(e) => handleChange("proj_name", e.target.value)}
              required
              fullWidth
              error={showErrors && !formData.proj_name.trim()}
              helperText={
                showErrors && !formData.proj_name.trim()
                  ? "Project name is required"
                  : "Give this project a clear title"
              }
            />

            <TextField
              label="Description"
              value={formData.proj_description}
              onChange={(e) => handleChange("proj_description", e.target.value)}
              multiline
              rows={3}
              fullWidth
            />

            <TextField
              label="Your Role"
              value={formData.role}
              onChange={(e) => handleChange("role", e.target.value)}
              fullWidth
            />

            <Box sx={{ display: "flex", gap: 2 }}>
              <TextField
                label="Start Date"
                type="date"
                value={formData.start_date}
                onChange={(e) => handleChange("start_date", e.target.value)}
                InputLabelProps={{ shrink: true }}
                required
                fullWidth
                error={showErrors && !formData.start_date}
                helperText={
                  showErrors && !formData.start_date
                    ? "Start date is required"
                    : "When did you begin?"
                }
              />

              <TextField
                label="End Date"
                type="date"
                value={formData.end_date}
                onChange={(e) => handleChange("end_date", e.target.value)}
                InputLabelProps={{ shrink: true }}
                fullWidth
                helperText="Leave blank if ongoing"
              />
            </Box>

            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                value={formData.status}
                onChange={(e) =>
                  handleChange(
                    "status",
                    e.target.value as "planned" | "ongoing" | "completed"
                  )
                }
                label="Status"
              >
                <MenuItem value="planned">Planned</MenuItem>
                <MenuItem value="ongoing">Ongoing</MenuItem>
                <MenuItem value="completed">Completed</MenuItem>
              </Select>
            </FormControl>

            <TextField
              label="Technologies & Skills"
              value={formData.tech_and_skills}
              onChange={(e) => handleChange("tech_and_skills", e.target.value)}
              placeholder="React, TypeScript, Node.js"
              helperText="Comma-separated list"
              fullWidth
            />

            <TextField
              label="Industry/Project Type"
              value={formData.industry_proj_type}
              onChange={(e) =>
                handleChange("industry_proj_type", e.target.value)
              }
              fullWidth
            />

            <Box sx={{ display: "flex", gap: 2 }}>
              <TextField
                label="Team Size"
                type="number"
                value={formData.team_size}
                onChange={(e) => handleChange("team_size", e.target.value)}
                fullWidth
              />

              <TextField
                label="Team Details"
                value={formData.team_details}
                onChange={(e) => handleChange("team_details", e.target.value)}
                fullWidth
              />
            </Box>

            <TextField
              label="Project URL"
              type="url"
              value={formData.project_url}
              onChange={(e) => handleChange("project_url", e.target.value)}
              placeholder="https://github.com/username/project"
              fullWidth
              helperText="Public link, demo, or repo"
            />

            <TextField
              label="Outcomes"
              value={formData.proj_outcomes}
              onChange={(e) => handleChange("proj_outcomes", e.target.value)}
              multiline
              rows={2}
              placeholder="Key results and achievements"
              fullWidth
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          {mode === "edit" && (
            <Button
              onClick={handleDelete}
              color="error"
              disabled={submitting}
              sx={{ mr: "auto" }}
            >
              Delete
            </Button>
          )}
          <Button onClick={handleClose} disabled={submitting}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={submitting}
          >
            {submitting ? "Saving..." : mode === "edit" ? "Update" : "Add"}
          </Button>
        </DialogActions>
      </Dialog>

      <ErrorSnackbar notification={notification} onClose={closeNotification} />
    </>
  );
};
