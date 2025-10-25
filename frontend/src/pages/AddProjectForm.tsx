import React, { useState } from "react";
import type { SelectChangeEvent } from "@mui/material/Select";
import {
  Box,
  Grid,
  TextField,
  Typography,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  Button,
  CircularProgress,
} from "@mui/material";
import { supabase } from "../supabaseClient";

interface ProjectEntry {
  projectName: string;
  description: string;
  role: string;
  startDate: string;
  endDate?: string;
  technologies: string;
  projectUrl?: string;
  teamSize?: string;
  outcomes?: string;
  industry?: string;
  status: "Completed" | "Ongoing" | "Planned";
  mediaFile?: File | null;
}

const AddProjectForm: React.FC = () => {
  const [formData, setFormData] = useState<ProjectEntry>({
    projectName: "",
    description: "",
    role: "",
    startDate: "",
    endDate: "",
    technologies: "",
    projectUrl: "",
    teamSize: "",
    outcomes: "",
    industry: "",
    status: "Planned",
    mediaFile: null,
  });

  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleInputChange = (
    e: React.ChangeEvent< HTMLInputElement | HTMLTextAreaElement >
  ) => {
    const { name, value, files } = e.target as HTMLInputElement;
    if (files && files.length > 0) {
      setFormData({ ...formData, mediaFile: files[0] });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSelectChange = (e: SelectChangeEvent<string>) => {
  const { name, value } = e.target;
  setFormData({ ...formData, [name]: value as ProjectEntry["status"] });
};

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setLoading(true);

    // Validation
    if (!formData.projectName || !formData.description || !formData.startDate) {
      setMessage("Please fill in all required fields.");
      setLoading(false);
      return;
    }

    if (formData.endDate && formData.startDate > formData.endDate) {
      setMessage("Start date must be before end date.");
      setLoading(false);
      return;
    }

    try {
      const { data: userData, error: userErr } = await supabase.auth.getUser();
      if (userErr) console.warn("getUser error:", userErr);
      const user = userData?.user ?? null;

      if (!user) {
        setMessage("Please sign in before adding a project.");
        setLoading(false);
        return;
      }

      let mediaUrl = null;
      if (formData.mediaFile) {
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("project_media")
          .upload(
            `${user.id}/${Date.now()}_${formData.mediaFile.name}`,
            formData.mediaFile
          );

        if (uploadError) {
          console.error("File upload error:", uploadError);
          setMessage("Failed to upload media file.");
          setLoading(false);
          return;
        }

        const { data: publicUrlData } = supabase.storage
          .from("project_media")
          .getPublicUrl(uploadData.path);

        mediaUrl = publicUrlData?.publicUrl ?? null;
      }

      const payload = {
        project_name: formData.projectName,
        description: formData.description,
        role: formData.role,
        start_date: formData.startDate,
        end_date: formData.endDate || null,
        technologies: formData.technologies,
        project_url: formData.projectUrl || null,
        team_size: formData.teamSize || null,
        outcomes: formData.outcomes || null,
        industry: formData.industry || null,
        status: formData.status,
        media_url: mediaUrl,
        user_id: user.id,
      };

      const { data, error } = await supabase
        .from("projects")
        .insert([payload])
        .select();

      if (error) {
        console.error("Supabase insert error:", error);
        setMessage(`Something went wrong: ${error.message}`);
        setLoading(false);
        return;
      }

      console.log("Inserted project:", data);
      setMessage("✅ Project added successfully!");
      setFormData({
        projectName: "",
        description: "",
        role: "",
        startDate: "",
        endDate: "",
        technologies: "",
        projectUrl: "",
        teamSize: "",
        outcomes: "",
        industry: "",
        status: "Planned",
        mediaFile: null,
      });
    } catch (err) {
      console.error("Unexpected error:", err);
      setMessage("Unexpected error occurred. Check console for details.");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => window.history.back();

  return (
    <Box
      sx={{
        maxWidth: 700,
        mx: "auto",
        mt: 6,
        p: 4,
        bgcolor: "background.paper",
        borderRadius: 3,
        boxShadow: 3,
      }}
    >
      <Typography variant="h5" fontWeight={600} textAlign="center" mb={3}>
        Add Special Project
      </Typography>

      <form onSubmit={handleSubmit}>
        <Grid container spacing={2}>
          <Grid size={12}>
            <TextField
              name="projectName"
              label="Project Name"
              fullWidth
              value={formData.projectName}
              onChange={handleInputChange}
              required
            />
          </Grid>

          <Grid size={12}>
            <TextField
              name="description"
              label="Project Description"
              multiline
              rows={4}
              fullWidth
              value={formData.description}
              onChange={handleInputChange}
              required
            />
          </Grid>

          <Grid size={12}>
            <TextField
              name="role"
              label="Your Role"
              fullWidth
              value={formData.role}
              onChange={handleInputChange}
              required
            />
          </Grid>

          <Grid size={12}>
            <TextField
              name="startDate"
              label="Start Date"
              type="date"
              fullWidth
              InputLabelProps={{ shrink: true }}
              value={formData.startDate}
              onChange={handleInputChange}
              required
            />
          </Grid>

          <Grid size={12}>
            <TextField
              name="endDate"
              label="End Date"
              type="date"
              fullWidth
              InputLabelProps={{ shrink: true }}
              value={formData.endDate}
              onChange={handleInputChange}
            />
          </Grid>

          <Grid size={12}>
            <TextField
              name="technologies"
              label="Technologies / Skills Used"
              fullWidth
              value={formData.technologies}
              onChange={handleInputChange}
              required
            />
          </Grid>

          <Grid size={12}>
            <TextField
              name="projectUrl"
              label="Project URL or Repository Link"
              fullWidth
              value={formData.projectUrl}
              onChange={handleInputChange}
            />
          </Grid>

          <Grid size={12}>
            <TextField
              name="teamSize"
              label="Team Size / Collaboration Details"
              fullWidth
              value={formData.teamSize}
              onChange={handleInputChange}
              required
            />
          </Grid>

          <Grid size={12}>
            <TextField
              name="industry"
              label="Industry or Project Type"
              fullWidth
              value={formData.industry}
              onChange={handleInputChange}
              required
            />
          </Grid>

          <Grid size={12}>
            <TextField
              name="outcomes"
              label="Project Outcomes / Achievements"
              fullWidth
              value={formData.outcomes}
              onChange={handleInputChange}
              required
            />
          </Grid>

          <Grid size={12}>
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                name="status"
                value={formData.status}
                label="Status"
                onChange={handleSelectChange}
              >
                <MenuItem value="Planned">Planned</MenuItem>
                <MenuItem value="Ongoing">Ongoing</MenuItem>
                <MenuItem value="Completed">Completed</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid size={12}>
            <Button
              variant="secondary"
              component="label"
              fullWidth
              sx={{ height: "56px" }}
            >
              Upload Media / Screenshot
              <input
                hidden
                accept="image/*"
                type="file"
                name="mediaFile"
                onChange={handleInputChange}
              />
            </Button>
            {formData.mediaFile && (
              <Typography variant="body2" mt={1}>
                Uploaded: {formData.mediaFile.name}
              </Typography>
            )}
          </Grid>

          <Grid size={12} display="flex" justifyContent="space-between" mt={2}>
            <Button
              variant="primary"
              type="submit"
              disabled={loading}
              sx={{ px: 4 }}
            >
              {loading ? <CircularProgress size={24} color="inherit" /> : "Save Project"}
            </Button>
            <Button
              variant="tertiary"
              onClick={handleCancel}
              sx={{ px: 4 }}
            >
              Cancel
            </Button>
          </Grid>

          {message && (
            <Grid size={12}>
              <Typography
                textAlign="center"
                color={
                  message.startsWith("✅") ? "success.main" : "error.main"
                }
                mt={2}
              >
                {message}
              </Typography>
            </Grid>
          )}
        </Grid>
      </form>
    </Box>
  );
};

export default AddProjectForm;