/**
 * CreateCohortPage.tsx
 *
 * Full-page form for creating a new cohort in enterprise career services.
 * Provides comprehensive cohort configuration with settings and member management.
 *
 * Route: /team/enterprise/cohorts/new
 * Part of UC-114: Corporate Career Services Integration
 */

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Paper,
  Typography,
  Button,
  TextField,
  Stack,
  Divider,
  Alert,
  CircularProgress,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  FormControlLabel,
  Switch,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import GroupAddIcon from "@mui/icons-material/GroupAdd";
import SaveIcon from "@mui/icons-material/Save";
import { useCohortManagement } from "../hooks/useCohortManagement";
import type { CohortFormData, CohortSettings } from "../types/enterprise.types";

/**
 * CreateCohortPage - Full-page form for creating new cohorts
 *
 * Features:
 * - Comprehensive cohort configuration (name, description, dates, capacity)
 * - Program type selection (career services, job club, bootcamp, etc.)
 * - Settings for notifications, auto-enrollment, and progress tracking
 * - Optional tags for categorization
 */
export const CreateCohortPage = () => {
  const navigate = useNavigate();
  const { createCohort, loading, error } = useCohortManagement();

  // Form state with comprehensive cohort configuration
  const [formData, setFormData] = useState<CohortFormData>({
    name: "",
    description: "",
    start_date: new Date().toISOString().split("T")[0],
    end_date: "",
    max_capacity: 50,
    settings: {
      auto_assign_mentors: false,
      require_weekly_checkin: true,
      enable_peer_networking: true,
      share_aggregate_progress: true,
    },
  });

  // Additional form fields for enhanced configuration
  const [programType, setProgramType] = useState("career_services");
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Handle form field changes
  const handleChange =
    (field: keyof CohortFormData) =>
    (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const value = event.target.value;
      setFormData((prev) => ({
        ...prev,
        [field]: field === "max_capacity" ? parseInt(value) || 0 : value,
      }));
    };

  // Handle settings toggle changes
  const handleSettingChange =
    (setting: keyof CohortSettings) =>
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setFormData((prev) => ({
        ...prev,
        settings: {
          ...prev.settings,
          [setting]: event.target.checked,
        },
      }));
    };

  // Add a tag to the cohort
  const handleAddTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag("");
    }
  };

  // Remove a tag from the cohort
  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
  };

  // Handle form submission
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitError(null);
    setSubmitting(true);

    try {
      // Create cohort data - store program type in the CohortFormData
      const cohortData: CohortFormData = {
        ...formData,
        program_type: programType,
      };

      const result = await createCohort(cohortData);

      if (result?.cohort) {
        // Navigate to the new cohort's detail page
        navigate(`/team/enterprise/cohorts/${result.cohort.id}`);
      } else if (result?.ok) {
        // Navigate back to enterprise dashboard if no cohort ID returned
        navigate("/team/enterprise");
      }
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : "Failed to create cohort"
      );
    } finally {
      setSubmitting(false);
    }
  };

  // Validation check for required fields
  const isFormValid = formData.name.trim() && formData.start_date;

  return (
    <Box sx={{ p: 3, maxWidth: 900, mx: "auto" }}>
      {/* Header with back navigation */}
      <Box display="flex" alignItems="center" mb={3}>
        <IconButton
          onClick={() => navigate("/team/enterprise")}
          sx={{ mr: 2 }}
          aria-label="Back to enterprise dashboard"
        >
          <ArrowBackIcon />
        </IconButton>
        <Box>
          <Typography variant="h4" component="h1">
            <GroupAddIcon sx={{ mr: 1, verticalAlign: "middle" }} />
            Create New Cohort
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Set up a new group of job seekers to manage and track together
          </Typography>
        </Box>
      </Box>

      {/* Error alerts */}
      {(error || submitError) && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error || submitError}
        </Alert>
      )}

      <form onSubmit={handleSubmit}>
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Basic Information
          </Typography>
          <Divider sx={{ mb: 3 }} />

          <Stack spacing={3}>
            {/* Cohort Name */}
            <TextField
              label="Cohort Name"
              value={formData.name}
              onChange={handleChange("name")}
              fullWidth
              required
              placeholder="e.g., Spring 2025 Career Services Cohort"
              helperText="A descriptive name for this group of job seekers"
            />

            {/* Description */}
            <TextField
              label="Description"
              value={formData.description}
              onChange={handleChange("description")}
              fullWidth
              multiline
              rows={3}
              placeholder="Describe the purpose, goals, and target audience for this cohort..."
            />

            {/* Program Type and Capacity row */}
            <Box display="flex" gap={3} flexWrap="wrap">
              <Box flex="1" minWidth={280}>
                <FormControl fullWidth>
                  <InputLabel>Program Type</InputLabel>
                  <Select
                    value={programType}
                    onChange={(e) => setProgramType(e.target.value)}
                    label="Program Type"
                  >
                    <MenuItem value="career_services">
                      Career Services Program
                    </MenuItem>
                    <MenuItem value="job_club">Job Club</MenuItem>
                    <MenuItem value="bootcamp">Bootcamp Cohort</MenuItem>
                    <MenuItem value="internship">Internship Program</MenuItem>
                    <MenuItem value="alumni">Alumni Network</MenuItem>
                    <MenuItem value="workforce_dev">
                      Workforce Development
                    </MenuItem>
                    <MenuItem value="custom">Custom Program</MenuItem>
                  </Select>
                </FormControl>
              </Box>

              <Box flex="1" minWidth={280}>
                <TextField
                  label="Maximum Capacity"
                  type="number"
                  value={formData.max_capacity}
                  onChange={handleChange("max_capacity")}
                  fullWidth
                  inputProps={{ min: 1, max: 10000 }}
                  helperText="Maximum number of members allowed in this cohort"
                />
              </Box>
            </Box>

            {/* Dates row */}
            <Box display="flex" gap={3} flexWrap="wrap">
              <Box flex="1" minWidth={280}>
                <TextField
                  label="Start Date"
                  type="date"
                  value={formData.start_date}
                  onChange={handleChange("start_date")}
                  fullWidth
                  required
                  InputLabelProps={{ shrink: true }}
                />
              </Box>

              <Box flex="1" minWidth={280}>
                <TextField
                  label="End Date"
                  type="date"
                  value={formData.end_date}
                  onChange={handleChange("end_date")}
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                  helperText="Optional - leave blank for ongoing programs"
                />
              </Box>
            </Box>
          </Stack>
        </Paper>

        {/* Settings Section */}
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Cohort Settings
          </Typography>
          <Divider sx={{ mb: 3 }} />

          <Stack spacing={2}>
            <Box>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.settings?.auto_assign_mentors || false}
                    onChange={handleSettingChange("auto_assign_mentors")}
                  />
                }
                label="Auto-Assign Mentors"
              />
              <Typography variant="body2" color="text.secondary" sx={{ ml: 6 }}>
                Automatically pair new members with available mentors
              </Typography>
            </Box>

            <Box>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.settings?.require_weekly_checkin || false}
                    onChange={handleSettingChange("require_weekly_checkin")}
                  />
                }
                label="Require Weekly Check-In"
              />
              <Typography variant="body2" color="text.secondary" sx={{ ml: 6 }}>
                Remind members to submit weekly progress updates
              </Typography>
            </Box>

            <Box>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.settings?.enable_peer_networking || false}
                    onChange={handleSettingChange("enable_peer_networking")}
                  />
                }
                label="Enable Peer Networking"
              />
              <Typography variant="body2" color="text.secondary" sx={{ ml: 6 }}>
                Allow members to connect and message each other
              </Typography>
            </Box>

            <Box>
              <FormControlLabel
                control={
                  <Switch
                    checked={
                      formData.settings?.share_aggregate_progress || false
                    }
                    onChange={handleSettingChange("share_aggregate_progress")}
                  />
                }
                label="Share Aggregate Progress"
              />
              <Typography variant="body2" color="text.secondary" sx={{ ml: 6 }}>
                Show anonymized cohort progress to members for motivation
              </Typography>
            </Box>
          </Stack>
        </Paper>

        {/* Tags Section */}
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Tags (Optional)
          </Typography>
          <Divider sx={{ mb: 3 }} />

          <Box display="flex" gap={2} mb={2}>
            <TextField
              label="Add Tag"
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              onKeyPress={(e) =>
                e.key === "Enter" && (e.preventDefault(), handleAddTag())
              }
              size="small"
              placeholder="e.g., Engineering, Entry-Level"
            />
            <Button variant="outlined" onClick={handleAddTag}>
              Add
            </Button>
          </Box>

          <Box display="flex" flexWrap="wrap" gap={1}>
            {tags.map((tag) => (
              <Chip
                key={tag}
                label={tag}
                onDelete={() => handleRemoveTag(tag)}
                color="primary"
                variant="outlined"
              />
            ))}
            {tags.length === 0 && (
              <Typography variant="body2" color="text.secondary">
                No tags added yet. Tags help organize and filter cohorts.
              </Typography>
            )}
          </Box>
        </Paper>

        {/* Form Actions */}
        <Box display="flex" justifyContent="space-between">
          <Button
            variant="outlined"
            onClick={() => navigate("/team/enterprise")}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            startIcon={
              submitting ? <CircularProgress size={20} /> : <SaveIcon />
            }
            disabled={!isFormValid || submitting || loading}
          >
            {submitting ? "Creating..." : "Create Cohort"}
          </Button>
        </Box>
      </form>
    </Box>
  );
};

export default CreateCohortPage;
