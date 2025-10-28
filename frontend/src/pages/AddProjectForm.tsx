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
  Checkbox,
  FormControlLabel,
} from "@mui/material";
import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import crud from "../services/crud";

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
  status: "planned" | "ongoing" | "completed";
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
    status: "planned",
    mediaFile: null,
  });

  const [message, setMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [saveToDocuments, setSaveToDocuments] = useState(false);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
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

  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setSubmitting(true);

    // Validation
    if (!formData.projectName || !formData.description || !formData.startDate) {
      setMessage("Please fill in all required fields.");
      setSubmitting(false);
      return;
    }

    if (formData.endDate && formData.startDate > formData.endDate) {
      setMessage("Start date must be before end date.");
      setSubmitting(false);
      return;
    }

    try {
      if (authLoading) {
        setMessage("Auth still loading. Try again shortly.");
        setSubmitting(false);
        return;
      }

      if (!user) {
        setMessage("Please sign in before adding a project.");
        setSubmitting(false);
        return;
      }

      let mediaPath: string | null = null;
      if (formData.mediaFile) {
        // upload to the canonical 'projects' bucket
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("projects")
          .upload(
            `${user.id}/${Date.now()}_${formData.mediaFile.name}`,
            formData.mediaFile
          );

        if (uploadError) {
          console.error("File upload error:", uploadError);
          setMessage("Failed to upload media file.");
          setSubmitting(false);
          return;
        }

        // store the storage path (not public URL) in the DB; front-end can construct public URL if needed
        mediaPath = uploadData.path;
        // We don't need the public URL here; we store the storage path in the DB
        mediaPath = uploadData.path;
      }

      // Map UI fields to canonical DB column names from schema
      const payload = {
        proj_name: formData.projectName,
        proj_description: formData.description,
        role: formData.role,
        start_date: formData.startDate,
        end_date: formData.endDate || null,
        tech_and_skills: formData.technologies
          ? formData.technologies
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean)
          : null,
        project_url: formData.projectUrl || null,
        team_size: formData.teamSize ? parseInt(formData.teamSize, 10) : null,
        team_details: formData.teamSize || null,
        industry_proj_type: formData.industry || null,
        proj_outcomes: formData.outcomes || null,
        status: formData.status,
        media_path: mediaPath ?? null,
        meta: null,
      };
      // Use the shared crud helper to respect RLS (withUser injects user_id)
      const userCrud = crud.withUser(user.id);
      const res = await userCrud.insertRow("projects", payload, "*");
      if (res.error) {
        console.error("Insert project failed:", res.error);
        // If we uploaded a file but the DB insert failed, remove the uploaded object to avoid orphaned files
        if (mediaPath) {
          try {
            await supabase.storage.from("projects").remove([mediaPath]);
          } catch (cleanupErr) {
            console.warn(
              "Failed to cleanup uploaded media after project insert failure:",
              cleanupErr
            );
          }
        }
        setMessage(`Something went wrong: ${res.error.message}`);
        setSubmitting(false);
        return;
      }

      console.log("Inserted project:", res.data);
      const insertedProject = res.data as { id?: string } | null;
      setMessage("✅ Project added successfully!");
      // Optionally add a documents row for the uploaded media
      if (saveToDocuments && mediaPath && formData.mediaFile) {
        try {
          const docPayload = {
            kind: "portfolio",
            file_name: formData.mediaFile.name,
            file_path: mediaPath,
            mime_type: formData.mediaFile.type,
            bytes: formData.mediaFile.size,
            meta: {
              source: "project",
              project_id: insertedProject?.id ?? null,
            },
          };

          const docRes = await userCrud.insertRow("documents", docPayload, "*");
          if (docRes.error) {
            console.warn(
              "Failed to insert documents row for project media:",
              docRes.error
            );
            // Non-blocking: notify the user but don't fail the whole flow
            setMessage((m) =>
              m ? m + " — Document save failed" : "Document save failed"
            );
          } else {
            // Notify listeners that documents changed
            window.dispatchEvent(new Event("documents:changed"));
          }
        } catch (docErr) {
          console.warn("Error inserting documents row:", docErr);
          setMessage((m) =>
            m ? m + " — Document save failed" : "Document save failed"
          );
        }
      }
      // Notify listeners and navigate back to the portfolio
      window.dispatchEvent(new Event("projects:changed"));
      try {
        navigate("/portfolio");
      } catch (navErr) {
        /* ignore navigation errors in some test environments */
        console.warn("Navigation failed:", navErr);
      }
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
        status: "planned",
        mediaFile: null,
      });
      setSubmitting(false);
    } catch (err) {
      console.error("Unexpected error:", err);
      setMessage("Unexpected error occurred. Check console for details.");
    } finally {
      setSubmitting(false);
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
                <MenuItem value="planned">Planned</MenuItem>
                <MenuItem value="ongoing">Ongoing</MenuItem>
                <MenuItem value="completed">Completed</MenuItem>
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

          <Grid size={12}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={saveToDocuments}
                  onChange={(e) => setSaveToDocuments(e.target.checked)}
                />
              }
              label="Save uploaded media to My Documents"
            />
          </Grid>

          <Grid size={12} display="flex" justifyContent="space-between" mt={2}>
            <Button
              variant="primary"
              type="submit"
              disabled={submitting}
              sx={{ px: 4 }}
            >
              {submitting ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                "Save Project"
              )}
            </Button>
            <Button variant="tertiary" onClick={handleCancel} sx={{ px: 4 }}>
              Cancel
            </Button>
          </Grid>

          {message && (
            <Grid size={12}>
              <Typography
                textAlign="center"
                color={message.startsWith("✅") ? "success.main" : "error.main"}
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
