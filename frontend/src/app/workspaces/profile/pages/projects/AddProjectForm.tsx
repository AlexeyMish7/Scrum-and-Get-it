import React, { useState, useEffect } from "react";
import type { SelectChangeEvent } from "@mui/material/Select";
import { useQueryClient } from "@tanstack/react-query";
import { profileKeys } from "@profile/cache/queryKeys";
import {
  Button,
  TextField,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Paper,
  Stack,
} from "@mui/material";
// Use Stack/Box for responsive layout to avoid Grid dependency issues
import ReactCrop, {
  type Crop,
  centerCrop,
  makeAspectCrop,
} from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import { useAuth } from "@shared/context/AuthContext";
import { useProfileChange } from "@shared/context";
import projectsService from "../../services/projects";
import type { ProjectRow } from "../../types/project";
import { ErrorSnackbar } from "@shared/components/feedback/ErrorSnackbar";
import { useErrorHandler } from "@shared/hooks/useErrorHandler";
import { supabase } from "@shared/services/supabaseClient";
import { useNavigate, useParams } from "react-router-dom";
// Removed CSS overrides; rely on MUI theme for visuals

// Form for adding new projects or editing existing ones
const AddProjectForm: React.FC = () => {
  // Basic project information
  const [projectName, setProjectName] = useState("");
  const [description, setDescription] = useState("");
  const [role, setRole] = useState("");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState("");
  const [technologies, setTechnologies] = useState("");
  const [projectUrl, setProjectUrl] = useState("");
  const [teamSize, setTeamSize] = useState("");
  const [teamDetails, setTeamDetails] = useState("");
  const [industry, setIndustry] = useState("");
  const [outcomes, setOutcomes] = useState("");
  const [status, setStatus] = useState<"planned" | "ongoing" | "completed">(
    "planned"
  );

  // Image upload and preview functionality
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [previewShape, setPreviewShape] = useState<"rounded" | "circle">(
    "rounded"
  );
  const [croppedPreviewUrl, setCroppedPreviewUrl] = useState<string | null>(
    null
  );
  const [previewSrc, setPreviewSrc] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Interactive cropping state
  const [showCropDialog, setShowCropDialog] = useState(false);
  const [imgSrc, setImgSrc] = useState<string>("");
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<Crop>();
  const [imgRef, setImgRef] = useState<HTMLImageElement | null>(null);

  const { handleError, notification, closeNotification, showSuccess } =
    useErrorHandler();
  const { markProfileChanged } = useProfileChange();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Check if we're editing an existing project
  const params = useParams<{ id?: string }>();
  const editingId = params.id;

  // Update preview image when file or cropped version changes
  useEffect(() => {
    let obj: string | null = null;
    if (croppedPreviewUrl) {
      setPreviewSrc(croppedPreviewUrl);
    } else if (mediaFile) {
      obj = URL.createObjectURL(mediaFile);
      setPreviewSrc(obj);
    } else {
      setPreviewSrc(null);
    }
    // Clean up object URL to prevent memory leaks
    return () => {
      if (obj) URL.revokeObjectURL(obj);
    };
  }, [mediaFile, croppedPreviewUrl]);

  // Handle file selection with validation
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;

    // File validation
    if (file) {
      // Check file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        handleError(new Error("File size must be less than 10MB"));
        return;
      }

      // Check file type - only allow image files
      if (!file.type.startsWith("image/")) {
        handleError(new Error("Please select a valid image file"));
        return;
      }
    }

    setMediaFile(file);
    setCroppedPreviewUrl(null); // Reset any cropped version

    // Open crop dialog if file is selected
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setImgSrc(reader.result as string);
        setShowCropDialog(true);
      };
      reader.readAsDataURL(file);
    }
  };

  // Function to create cropped canvas from selected area
  const getCroppedImg = (
    image: HTMLImageElement,
    crop: Crop
  ): Promise<{ blob: Blob; dataUrl: string }> => {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      if (!ctx) {
        reject(new Error("Failed to get canvas context"));
        return;
      }

      const scaleX = image.naturalWidth / image.width;
      const scaleY = image.naturalHeight / image.height;

      canvas.width = crop.width;
      canvas.height = crop.height;

      ctx.drawImage(
        image,
        crop.x * scaleX,
        crop.y * scaleY,
        crop.width * scaleX,
        crop.height * scaleY,
        0,
        0,
        crop.width,
        crop.height
      );

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error("Failed to create blob"));
            return;
          }
          const dataUrl = canvas.toDataURL("image/png");
          resolve({ blob, dataUrl });
        },
        "image/png",
        0.9
      );
    });
  };

  // Handle crop completion
  const handleCropComplete = async () => {
    if (!imgRef || !completedCrop || !mediaFile) {
      handleError(new Error("Missing crop data"));
      return;
    }

    try {
      const { blob, dataUrl } = await getCroppedImg(imgRef, completedCrop);

      // Create new file with cropped image
      const croppedFile = new File([blob], `cropped_${mediaFile.name}`, {
        type: blob.type,
      });

      setMediaFile(croppedFile);
      setCroppedPreviewUrl(dataUrl);
      setShowCropDialog(false);
      showSuccess("Image cropped successfully");
    } catch (err) {
      handleError(err as Error);
    }
  };

  // Initialize crop when image loads
  const onImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const { width, height } = e.currentTarget;
    setImgRef(e.currentTarget);

    // Set initial crop based on preview shape
    const aspectRatio = previewShape === "circle" ? 1 : 16 / 9;
    const crop = centerCrop(
      makeAspectCrop(
        {
          unit: "%",
          width: 80,
        },
        aspectRatio,
        width,
        height
      ),
      width,
      height
    );

    setCrop(crop);
    setCompletedCrop(crop);
  };

  // Automatically crop image based on preview shape
  // REMOVED: Auto-crop functionality - manual cropping is now available

  // Handle project status dropdown changes
  const handleStatusChange = (e: SelectChangeEvent<string>) => {
    setStatus(e.target.value as "planned" | "ongoing" | "completed");
  };

  // Load existing project data when editing
  useEffect(() => {
    let mounted = true;
    const load = async () => {
      if (!editingId || authLoading) return;
      if (!user) return;
      try {
        // Fetch project details from database
        const res = await projectsService.getProject(user.id, editingId);
        if (!mounted) return;
        if (res.error || !res.data) return;

        // Populate form fields with existing data
        const r = res.data as ProjectRow;
        setProjectName(r.proj_name ?? "");
        setDescription(r.proj_description ?? "");
        setRole(r.role ?? "");
        setStartDate(r.start_date ?? "");
        setEndDate(r.end_date ?? "");
        setTechnologies(
          Array.isArray(r.tech_and_skills) ? r.tech_and_skills.join(", ") : ""
        );
        setProjectUrl(r.project_url ?? "");
        setTeamSize(r.team_size != null ? String(r.team_size) : "");
        setTeamDetails(r.team_details ?? "");
        setIndustry(r.industry_proj_type ?? "");
        setOutcomes(r.proj_outcomes ?? "");
        setStatus(
          (r.status as "planned" | "ongoing" | "completed") ?? "planned"
        );

        // Load existing image if available
        if (r.media_path) {
          const url = await projectsService.resolveMediaUrl(r.media_path);
          if (url) setPreviewSrc(url);
        }

        // Load preview shape from metadata
        try {
          const m = r.meta as Record<string, unknown> | null;
          if (
            m &&
            typeof m.previewShape === "string" &&
            (m.previewShape === "circle" || m.previewShape === "rounded")
          ) {
            setPreviewShape(m.previewShape as "rounded" | "circle");
          }
        } catch {
          // Ignore metadata parsing errors
        }
      } catch (err) {
        console.warn("Failed to load project for editing", err);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, [editingId, user, authLoading]);

  // Handle form submission for creating/updating projects
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (authLoading) return handleError(new Error("Auth still loading"));
    if (!user) return handleError(new Error("Please sign in to add a project"));

    // Basic validation - required fields
    if (!projectName.trim() || !startDate)
      return handleError(new Error("Project name and start date are required"));

    // Enhanced date validation to ensure dates are valid
    const startDateObj = new Date(startDate);
    const endDateObj = endDate ? new Date(endDate) : null;

    if (isNaN(startDateObj.getTime())) {
      return handleError(new Error("Please enter a valid start date"));
    }

    if (endDateObj && isNaN(endDateObj.getTime())) {
      return handleError(new Error("Please enter a valid end date"));
    }

    if (endDateObj && startDateObj > endDateObj) {
      return handleError(new Error("Start date must be before end date"));
    }

    setSubmitting(true);
    let mediaPath: string | null = null;
    try {
      // Upload image file if provided
      if (mediaFile) {
        // Create unique file path using user ID and timestamp
        const filePath = `${user.id}/${Date.now()}_${mediaFile.name}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("projects")
          .upload(filePath, mediaFile);
        if (uploadError) throw uploadError;
        mediaPath = uploadData.path;
      }

      // Prepare project data for database
      const payload: Partial<ProjectRow> = {
        proj_name: projectName.trim(),
        proj_description: description || null,
        role: role || null,
        start_date: startDate || null,
        end_date: endDate || null,
        tech_and_skills: technologies
          ? technologies
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean)
          : null,
        project_url: projectUrl || null,
        team_size: teamSize ? parseInt(teamSize, 10) : null,
        team_details: teamDetails || null,
        industry_proj_type: industry || null,
        proj_outcomes: outcomes || null,
        status: status,
        media_path: mediaPath ?? null,
        meta: { previewShape },
      };

      // Save to database - either update existing or create new
      let res;
      if (editingId)
        res = await projectsService.updateProject(user.id, editingId, payload);
      else res = await projectsService.insertProject(user.id, payload);

      // Handle database errors and cleanup uploaded files if needed
      if (res.error) {
        if (mediaPath) {
          try {
            // Clean up uploaded file if database save failed
            await supabase.storage.from("projects").remove([mediaPath]);
          } catch {
            // Ignore cleanup errors
          }
        }
        return handleError(res.error);
      }

      // Create document record for uploaded file
      if (mediaPath && mediaFile) {
        try {
          const userCrudModule = await import("@shared/services/crud");
          const userCrud = userCrudModule.withUser(user.id);
          const createdRow = res.data as ProjectRow | null;
          const createdId = createdRow?.id ?? null;

          // Insert document record linking file to project
          const docRes = await userCrud.insertRow(
            "documents",
            {
              kind: "portfolio",
              file_name: mediaFile.name,
              file_path: mediaPath,
              mime_type: mediaFile.type,
              bytes: mediaFile.size,
              project_id: createdId,
              meta: { source: "project", project_id: createdId, previewShape },
            },
            "*"
          );
          if (docRes.error) {
            handleError(docRes.error);
          } else {
            // Notify user and trigger document refresh
            showSuccess("Media saved to Documents");
            window.dispatchEvent(
              new CustomEvent("projects:notification", {
                detail: {
                  message: "Media saved to Documents",
                  severity: "success",
                },
              })
            );
            window.dispatchEvent(new Event("documents:changed"));
          }
        } catch (docErr) {
          handleError(docErr as Error);
        }
      }

      // Show success message and trigger portfolio refresh
      const msg = editingId
        ? "Project updated successfully"
        : "Project added successfully";
      showSuccess(msg);
      markProfileChanged(); // Invalidate analytics cache
      // Invalidate projects cache so list refetches on next view
      queryClient.invalidateQueries({
        queryKey: profileKeys.projects(user.id),
      });
      window.dispatchEvent(
        new CustomEvent("projects:notification", {
          detail: { message: msg, severity: "success" },
        })
      );
      window.dispatchEvent(new Event("projects:changed"));
      navigate("/profile/projects");
    } catch (err) {
      console.error(err);
      handleError(err as Error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box sx={{ width: "100%", minHeight: "100vh", p: 3 }}>
      <Box sx={{ maxWidth: 960, mx: "auto" }}>
        <Paper variant="outlined" sx={{ p: 3 }}>
          <Typography variant="h5" mb={2}>
            {editingId ? "Edit Project" : "Add Project"}
          </Typography>

          <Box component="form" onSubmit={handleSubmit}>
            <Stack spacing={2}>
              <TextField
                label="Project Name"
                name="projectName"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                fullWidth
                required
              />

              <TextField
                label="Description"
                name="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                fullWidth
                multiline
                rows={4}
              />

              <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                <Box sx={{ flex: 1 }}>
                  <TextField
                    label="Your Role"
                    name="role"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    fullWidth
                  />
                </Box>
                <Box sx={{ width: { xs: "100%", sm: "50%", md: 240 } }}>
                  <TextField
                    label="Start Date"
                    name="startDate"
                    type="date"
                    InputLabelProps={{ shrink: true }}
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    fullWidth
                    required
                  />
                </Box>
                <Box sx={{ width: { xs: "100%", sm: "50%", md: 240 } }}>
                  <TextField
                    label="End Date"
                    name="endDate"
                    type="date"
                    InputLabelProps={{ shrink: true }}
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    fullWidth
                  />
                </Box>
              </Stack>

              <TextField
                label="Technologies (comma separated)"
                name="technologies"
                value={technologies}
                onChange={(e) => setTechnologies(e.target.value)}
                fullWidth
              />

              <TextField
                label="Project URL"
                name="projectUrl"
                value={projectUrl}
                onChange={(e) => setProjectUrl(e.target.value)}
                fullWidth
              />

              <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                <Box sx={{ flex: 1 }}>
                  <TextField
                    label="Team Size"
                    name="teamSize"
                    value={teamSize}
                    onChange={(e) => setTeamSize(e.target.value)}
                    fullWidth
                  />
                </Box>
                <Box sx={{ flex: 1 }}>
                  <TextField
                    label="Team Details"
                    name="teamDetails"
                    value={teamDetails}
                    onChange={(e) => setTeamDetails(e.target.value)}
                    fullWidth
                  />
                </Box>
              </Stack>

              <TextField
                label="Industry / Project Type"
                name="industry"
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                fullWidth
              />

              <TextField
                label="Outcomes / Achievements"
                name="outcomes"
                value={outcomes}
                onChange={(e) => setOutcomes(e.target.value)}
                fullWidth
              />

              <Stack
                direction={{ xs: "column", sm: "row" }}
                spacing={2}
                alignItems="flex-start"
              >
                <Box sx={{ width: { xs: "100%", sm: 240 } }}>
                  <FormControl fullWidth>
                    <InputLabel id="status-label">Status</InputLabel>
                    <Select
                      labelId="status-label"
                      name="status"
                      value={status}
                      label="Status"
                      onChange={handleStatusChange}
                    >
                      <MenuItem value="planned">Planned</MenuItem>
                      <MenuItem value="ongoing">Ongoing</MenuItem>
                      <MenuItem value="completed">Completed</MenuItem>
                    </Select>
                  </FormControl>
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Stack spacing={1}>
                    <Button variant="outlined" component="label" fullWidth>
                      {mediaFile
                        ? `Selected: ${mediaFile.name}`
                        : "Upload Screenshot"}
                      <input
                        hidden
                        accept="image/jpeg,image/png,image/webp,image/gif"
                        type="file"
                        onChange={handleFileChange}
                      />
                    </Button>

                    <Stack
                      direction={{ xs: "column", sm: "row" }}
                      spacing={1}
                      alignItems="center"
                    >
                      <Box sx={{ width: { xs: "100%", sm: 200 } }}>
                        <FormControl size="small" fullWidth>
                          <InputLabel id="preview-shape-label">
                            Preview
                          </InputLabel>
                          <Select
                            labelId="preview-shape-label"
                            value={previewShape}
                            label="Preview"
                            onChange={(e) =>
                              setPreviewShape(
                                e.target.value as "rounded" | "circle"
                              )
                            }
                          >
                            <MenuItem value="rounded">Rounded</MenuItem>
                            <MenuItem value="circle">Circle</MenuItem>
                          </Select>
                        </FormControl>
                      </Box>
                      {mediaFile && (
                        <Button
                          variant="outlined"
                          onClick={() => {
                            const reader = new FileReader();
                            reader.onload = () => {
                              setImgSrc(reader.result as string);
                              setShowCropDialog(true);
                            };
                            reader.readAsDataURL(mediaFile);
                          }}
                        >
                          Crop Image
                        </Button>
                      )}
                    </Stack>

                    {previewSrc && (
                      <Box sx={{ mt: 1 }}>
                        <img
                          src={previewSrc}
                          alt="preview"
                          style={
                            {
                              width: 96,
                              height: 96,
                              objectFit: "cover",
                              borderRadius:
                                previewShape === "circle" ? "50%" : 8,
                              border: "1px solid",
                              borderColor:
                                "var(--color-divider, rgba(0,0,0,0.12))",
                            } as React.CSSProperties
                          }
                        />
                      </Box>
                    )}
                  </Stack>
                </Box>
              </Stack>

              <Box
                sx={{
                  display: "flex",
                  gap: 2,
                  justifyContent: "flex-end",
                  mt: 1,
                }}
              >
                <Button
                  type="submit"
                  disabled={submitting}
                  startIcon={submitting ? <CircularProgress size={18} /> : null}
                  variant="contained"
                >
                  {submitting ? "Saving..." : "Save Project"}
                </Button>
                <Button onClick={() => navigate(-1)} variant="outlined">
                  Cancel
                </Button>
              </Box>
            </Stack>
          </Box>

          <ErrorSnackbar
            notification={notification}
            onClose={closeNotification}
          />
        </Paper>
      </Box>

      {/* Crop Dialog */}
      <Dialog
        open={showCropDialog}
        onClose={() => setShowCropDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Crop Your Image</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Drag to select the area you want to use for your project preview.
          </Typography>
          {imgSrc && (
            <ReactCrop
              crop={crop}
              onChange={(_, percentCrop) => setCrop(percentCrop)}
              onComplete={(c) => setCompletedCrop(c)}
              aspect={previewShape === "circle" ? 1 : 16 / 9}
            >
              <Box
                component="img"
                src={imgSrc}
                onLoad={onImageLoad}
                alt="Crop preview"
                sx={{ maxWidth: "100%", maxHeight: 400 }}
              />
            </ReactCrop>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setShowCropDialog(false)}
            variant="text"
            color="inherit"
          >
            Cancel
          </Button>
          <Button
            onClick={handleCropComplete}
            disabled={!completedCrop}
            variant="contained"
          >
            Apply Crop
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AddProjectForm;
