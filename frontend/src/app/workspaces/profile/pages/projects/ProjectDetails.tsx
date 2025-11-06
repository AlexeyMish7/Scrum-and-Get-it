import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useAuth } from "@shared/context/AuthContext";
import projectsService from "../../services/projects";
import type { Project } from "../../types/project.ts";
import { Box, Paper, Typography, Chip, Button } from "@mui/material";

// Component to display detailed view of a single project
const ProjectDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user, loading } = useAuth();
  const [project, setProject] = useState<Project | null>(null);
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);

  // Load project data when component mounts or ID changes
  useEffect(() => {
    let mounted = true;
    const load = async () => {
      if (loading) return;
      if (!id) return;
      if (!user) {
        // Show nothing for unauthenticated users
        if (!mounted) return;
        setProject(null);
        return;
      }

      try {
        // Fetch project from database using service
        const res = await projectsService.getProject(user.id, id as string);
        if (!mounted) return;
        if (res.error || !res.data) {
          setProject(null);
          return;
        }

        // Convert database row to UI-friendly format
        const p = projectsService.mapRowToProject(res.data);
        setProject(p);

        // Load project image if available
        if (p.mediaPath) {
          try {
            const url = await projectsService.resolveMediaUrl(p.mediaPath);
            if (url) setMediaUrl(url);
          } catch (err) {
            console.warn("Failed to resolve media URL", err);
          }
        }
      } catch (err) {
        console.error("Failed to load project details", err);
        if (!mounted) return;
        setProject(null);
      }
    };

    load();
    return () => {
      mounted = false;
    };
  }, [id, user, loading]);

  // Show loading state while fetching data
  if (loading) return <Typography sx={{ p: 3 }}>Loading...</Typography>;
  if (!project) return <Typography sx={{ p: 3 }}>Project not found</Typography>;

  return (
    <Box sx={{ width: "100%", minHeight: "100vh", p: 3 }}>
      <Box sx={{ maxWidth: 960, mx: "auto" }}>
        <Paper variant="outlined" sx={{ p: 3 }}>
          <Typography variant="h4" sx={{ mb: 2 }}>
            {project.projectName}
          </Typography>

          {/* Display project image if available */}
          {mediaUrl && (
            <Box sx={{ mb: 2 }}>
              <Box
                component="img"
                src={mediaUrl}
                alt={`${project.projectName} screenshot`}
                sx={{
                  width: "100%",
                  maxHeight: 360,
                  objectFit: "cover",
                  borderRadius: 3,
                }}
              />
            </Box>
          )}

          {/* Display project details */}
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
            {project.role && (
              <Box>
                <Typography variant="overline">Role</Typography>
                <Typography variant="body1">{project.role}</Typography>
              </Box>
            )}

            {project.technologies && (
              <Box>
                <Typography variant="overline">Technologies</Typography>
                <Typography variant="body1">{project.technologies}</Typography>
              </Box>
            )}

            {project.description && (
              <Box>
                <Typography variant="overline">Description</Typography>
                <Typography variant="body1">{project.description}</Typography>
              </Box>
            )}

            {project.teamSize && (
              <Box>
                <Typography variant="overline">Team Size</Typography>
                <Typography variant="body1">{project.teamSize}</Typography>
              </Box>
            )}

            {project.outcomes && (
              <Box>
                <Typography variant="overline">Outcomes</Typography>
                <Typography variant="body1">{project.outcomes}</Typography>
              </Box>
            )}

            {project.industry && (
              <Box>
                <Typography variant="overline">Industry</Typography>
                <Typography variant="body1">{project.industry}</Typography>
              </Box>
            )}

            {project.status && (
              <Box>
                <Typography variant="overline">Status</Typography>
                <Box sx={{ mt: 0.5 }}>
                  <Chip
                    label={project.status}
                    color={
                      project.status.toLowerCase() === "completed"
                        ? "success"
                        : project.status.toLowerCase() === "ongoing"
                        ? "warning"
                        : "default"
                    }
                    size="small"
                  />
                </Box>
              </Box>
            )}

            {project.projectUrl && (
              <Box>
                <Typography variant="overline">Project Link</Typography>
                <Box sx={{ mt: 0.5 }}>
                  <Button href={project.projectUrl} target="_blank">
                    View Project
                  </Button>
                </Box>
              </Box>
            )}
          </Box>
        </Paper>
      </Box>
    </Box>
  );
};

export default ProjectDetails;
