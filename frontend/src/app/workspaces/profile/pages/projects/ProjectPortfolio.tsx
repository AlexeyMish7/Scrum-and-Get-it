import React, { useEffect, useState, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { unifiedProfileKeys } from "@profile/cache";
import { AutoBreadcrumbs } from "@shared/components/navigation/AutoBreadcrumbs";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  TextField,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tooltip,
  Chip,
  Stack,
} from "@mui/material";
import { useAuth } from "@shared/context/AuthContext";
import { useProfileChange } from "@shared/context";
import projectsService from "../../services/projects";
import { useErrorHandler } from "@shared/hooks/useErrorHandler";
import { ErrorSnackbar } from "@shared/components/feedback/ErrorSnackbar";
import LoadingSpinner from "@shared/components/feedback/LoadingSpinner";
import { useConfirmDialog } from "@shared/hooks/useConfirmDialog";
import EmptyState from "@shared/components/feedback/EmptyState";
import { FolderOpen as ProjectIcon } from "@mui/icons-material";
import type { Project } from "../../types/project.ts";
import type { ProjectRow } from "../../types/project";
import { AddProjectDialog } from "../../components/dialogs/AddProjectDialog";
import { useProjectsList } from "@profile/cache";

// Main portfolio page showing all user's projects in a grid layout
const ProjectPortfolio: React.FC = () => {
  // Use React Query hook for cached projects data
  const {
    data: projectsData,
    isLoading: queryLoading,
    refetch: refetchProjects,
  } = useProjectsList();

  // Projects with resolved media URLs (updated in background)
  const [projects, setProjects] = useState<Project[]>([]);

  // Filter and search controls
  const [search, setSearch] = useState("");
  const [filterTech, setFilterTech] = useState("");
  const [filterIndustry, setFilterIndustry] = useState("");
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");
  // Dialog for viewing project details
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [deleting, setDeleting] = useState(false);
  const { confirm } = useConfirmDialog();

  // Add/Edit Project Dialog state
  const [projectDialogOpen, setProjectDialogOpen] = useState(false);
  const [projectDialogMode, setProjectDialogMode] = useState<"add" | "edit">(
    "add"
  );
  const [selectedProjectRow, setSelectedProjectRow] = useState<
    ProjectRow | undefined
  >();

  const queryClient = useQueryClient();
  const { user, loading: authLoading } = useAuth();
  const { markProfileChanged } = useProfileChange();
  const { notification, closeNotification, showSuccess, handleError } =
    useErrorHandler();

  // Update projects when query data changes and resolve media URLs
  useEffect(() => {
    if (!projectsData) return;

    setProjects(projectsData);

    // Resolve media URLs in background
    projectsData.forEach(async (p) => {
      if (p.mediaPath && !p.mediaUrl) {
        try {
          const url = await projectsService.resolveMediaUrl(p.mediaPath);
          if (url) {
            setProjects((prev) =>
              prev.map((x) => (x.id === p.id ? { ...x, mediaUrl: url } : x))
            );
          }
        } catch (err) {
          console.warn("Failed to resolve media URL", err);
        }
      }
    });
  }, [projectsData]);

  // Listen for success/error messages from other components (like add/edit forms)
  useEffect(() => {
    const handler = (ev: Event) => {
      try {
        const ce = ev as CustomEvent;
        const detail = ce.detail as
          | { message?: string; severity?: string }
          | undefined;
        if (!detail || !detail.message) return;
        if (detail.severity === "success") showSuccess(detail.message);
        else if (detail.severity === "error")
          handleError(new Error(detail.message));
        else showSuccess(detail.message);
      } catch (err) {
        console.warn("projects:notification handler error", err);
      }
    };
    window.addEventListener("projects:notification", handler as EventListener);
    return () =>
      window.removeEventListener(
        "projects:notification",
        handler as EventListener
      );
  }, [showSuccess, handleError]);

  // Apply search filters and sorting
  const filteredProjects = useMemo(() => {
    let temp = [...projects];

    // Filter by project name search
    if (search)
      temp = temp.filter((p) =>
        p.projectName.toLowerCase().includes(search.toLowerCase())
      );
    // Filter by technology
    if (filterTech)
      temp = temp.filter((p) => p.technologies.includes(filterTech));
    // Filter by industry
    if (filterIndustry)
      temp = temp.filter((p) => p.industry === filterIndustry);

    // Sort by date
    temp.sort((a, b) =>
      sortOrder === "newest"
        ? new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
        : new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
    );

    return temp;
  }, [projects, search, filterTech, filterIndustry, sortOrder]);

  if (authLoading || queryLoading) return <LoadingSpinner />;

  // Handle deleting a project with confirmation
  const performDelete = async (projectId: string) => {
    if (!user) return handleError(new Error("Sign in required"));
    setDeleting(true);
    try {
      const res = await projectsService.deleteProject(user.id, projectId);
      if (res.error) {
        handleError(res.error);
        return;
      }
      showSuccess("Project deleted");
      markProfileChanged(); // Invalidate analytics cache
      // Invalidate unified cache so data is refetched
      queryClient.invalidateQueries({
        queryKey: unifiedProfileKeys.user(user.id),
      });
      window.dispatchEvent(
        new CustomEvent("projects:notification", {
          detail: { message: "Project deleted", severity: "success" },
        })
      );
      window.dispatchEvent(new Event("projects:changed"));
      setSelectedProject(null);
    } catch (err) {
      handleError(err as Error);
    } finally {
      setDeleting(false);
    }
  };

  // Utility functions for user actions
  const handlePrint = () => window.print();
  const handleCopyLink = async (projectId: string) => {
    const url = `${window.location.origin}/projects/${projectId}`;
    try {
      await navigator.clipboard.writeText(url);
      showSuccess("Project link copied to clipboard!");
    } catch (err) {
      handleError(err as Error);
    }
  };
  const handleAddProject = () => {
    setProjectDialogMode("add");
    setSelectedProjectRow(undefined);
    setProjectDialogOpen(true);
  };

  const handleEditProject = async (projectId: string) => {
    if (!user) return;
    const res = await projectsService.getProject(user.id, projectId);
    if (res.error || !res.data) {
      handleError(res.error || "Failed to load project");
      return;
    }
    setProjectDialogMode("edit");
    setSelectedProjectRow(res.data as ProjectRow);
    setProjectDialogOpen(true);
  };

  const handleCloseProjectDialog = () => {
    setProjectDialogOpen(false);
    setSelectedProjectRow(undefined);
  };

  const handleProjectDialogSuccess = () => {
    refetchProjects();
  };

  return (
    <Box sx={{ width: "100%", p: 3, pt: 2 }}>
      <AutoBreadcrumbs />
      <Box sx={{ maxWidth: 1200, mx: "auto" }}>
        <Box sx={{ textAlign: "center", mb: 3 }}>
          <Typography variant="h3">My Projects Portfolio</Typography>
          <Typography variant="subtitle1" color="text.secondary">
            Showcase of my professional work and achievements
          </Typography>
        </Box>

        {/* Add Project Button */}
        <Box
          sx={{
            textAlign: "center",
            mb: 4,
            "@media print": { display: "none" },
          }}
        >
          <Button variant="contained" size="large" onClick={handleAddProject}>
            Add Project
          </Button>
        </Box>

        <Typography
          variant="body2"
          sx={{
            textAlign: "center",
            mb: 4,
            color: "text.secondary",
            "@media print": { display: "none" },
          }}
        >
          Click on any project to view details and copy its shareable link.
        </Typography>

        {/* Filters, search, and print */}
        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={2}
          alignItems={{ xs: "stretch", md: "flex-end" }}
          sx={{ mb: 3, "@media print": { display: "none" } }}
        >
          <TextField
            label="Search Projects"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            fullWidth
          />

          <FormControl fullWidth>
            <InputLabel>Technology</InputLabel>
            <Select
              value={filterTech}
              label="Technology"
              onChange={(e) => setFilterTech(e.target.value)}
            >
              <MenuItem value="">All</MenuItem>
              <MenuItem value="React">React</MenuItem>
              <MenuItem value="TypeScript">TypeScript</MenuItem>
              <MenuItem value="Python">Python</MenuItem>
            </Select>
          </FormControl>

          <FormControl fullWidth>
            <InputLabel>Industry</InputLabel>
            <Select
              value={filterIndustry}
              label="Industry"
              onChange={(e) => setFilterIndustry(e.target.value)}
            >
              <MenuItem value="">All</MenuItem>
              <MenuItem value="Finance">Finance</MenuItem>
              <MenuItem value="Healthcare">Healthcare</MenuItem>
              <MenuItem value="Education">Education</MenuItem>
              <MenuItem value="Productivity">Productivity</MenuItem>
            </Select>
          </FormControl>

          <FormControl fullWidth>
            <InputLabel>Sort</InputLabel>
            <Select
              value={sortOrder}
              label="Sort"
              onChange={(e) =>
                setSortOrder(e.target.value as "newest" | "oldest")
              }
            >
              <MenuItem value="newest">Newest</MenuItem>
              <MenuItem value="oldest">Oldest</MenuItem>
            </Select>
          </FormControl>

          <Button variant="outlined" onClick={handlePrint}>
            Print All Projects
          </Button>
        </Stack>

        {/* Loading State */}
        {queryLoading && (
          <Box sx={{ display: "grid", placeItems: "center", py: 6 }}>
            <LoadingSpinner />
            <Typography sx={{ mt: 1 }}>Loading projects...</Typography>
          </Box>
        )}

        {/* Empty State */}
        {!queryLoading && filteredProjects.length === 0 && (
          <EmptyState
            icon={<ProjectIcon />}
            title="No Projects Found"
            description={
              projects.length === 0
                ? "Start building your portfolio by adding your first project!"
                : "Try adjusting your search or filter criteria."
            }
            action={
              projects.length === 0 ? (
                <Button
                  variant="contained"
                  size="large"
                  onClick={handleAddProject}
                >
                  Add Your First Project
                </Button>
              ) : undefined
            }
          />
        )}

        {/* Project Cards */}
        {!queryLoading && filteredProjects.length > 0 && (
          <Box
            sx={{
              display: "grid",
              gap: 2,
              gridTemplateColumns: {
                xs: "1fr",
                md: "1fr 1fr",
                lg: "1fr 1fr 1fr",
              },
            }}
          >
            {filteredProjects.map((project) => (
              <Card
                key={project.id}
                onClick={() => setSelectedProject(project)}
                sx={{ cursor: "pointer", height: "100%" }}
              >
                <CardContent>
                  <Stack direction="row" spacing={2} alignItems="flex-start">
                    {/* Thumbnail */}
                    {project.mediaUrl ? (
                      <Box
                        sx={{
                          width: 96,
                          height: 96,
                          borderRadius:
                            project.previewShape === "circle" ? "50%" : 2,
                          overflow: "hidden",
                          flexShrink: 0,
                          border: "1px solid",
                          borderColor: "divider",
                        }}
                      >
                        <Box
                          component="img"
                          src={project.mediaUrl}
                          alt={`${project.projectName} screenshot`}
                          sx={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                          }}
                        />
                      </Box>
                    ) : (
                      <Box
                        sx={{
                          width: 96,
                          height: 96,
                          borderRadius:
                            project.previewShape === "circle" ? "50%" : 2,
                          display: "grid",
                          placeItems: "center",
                          bgcolor: "action.hover",
                          color: "text.secondary",
                          border: "1px solid",
                          borderColor: "divider",
                          flexShrink: 0,
                        }}
                      >
                        📁
                      </Box>
                    )}

                    {/* Content */}
                    <Box sx={{ minWidth: 0, flex: 1 }}>
                      <Typography variant="h6" noWrap>
                        {project.projectName}
                      </Typography>
                      <Box sx={{ my: 0.5 }}>
                        <Chip
                          label={project.status}
                          size="small"
                          color={
                            project.status.toLowerCase() === "completed"
                              ? "success"
                              : ["in_progress", "ongoing"].includes(
                                  project.status.toLowerCase()
                                )
                              ? "warning"
                              : project.status.toLowerCase() === "archived"
                              ? "default"
                              : "info"
                          }
                        />
                      </Box>
                      <Typography variant="body2" color="text.secondary" noWrap>
                        {project.role} | {project.technologies}
                      </Typography>
                      <Typography variant="body2" sx={{ mt: 0.5 }} noWrap>
                        {project.description.length > 100
                          ? `${project.description.substring(0, 100)}...`
                          : project.description}
                      </Typography>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            ))}
          </Box>
        )}

        {/* Project Details Dialog */}
        <Dialog
          open={!!selectedProject}
          onClose={() => setSelectedProject(null)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>{selectedProject?.projectName}</DialogTitle>
          <DialogContent dividers>
            {selectedProject?.mediaUrl && (
              <Box sx={{ mb: 2 }}>
                <Box
                  component="img"
                  src={selectedProject.mediaUrl}
                  alt={`${selectedProject.projectName} screenshot`}
                  sx={{
                    width: "100%",
                    maxHeight: 320,
                    objectFit: "cover",
                    borderRadius: 2,
                  }}
                />
              </Box>
            )}

            {selectedProject?.role && (
              <Box sx={{ mb: 1 }}>
                <Typography variant="overline">Role</Typography>
                <Typography>{selectedProject.role}</Typography>
              </Box>
            )}

            {(selectedProject?.startDate || selectedProject?.endDate) && (
              <Box sx={{ mb: 1 }}>
                <Typography variant="overline">Dates</Typography>
                <Typography>
                  {selectedProject.startDate ?? ""}
                  {selectedProject.endDate
                    ? ` - ${selectedProject.endDate}`
                    : ""}
                </Typography>
              </Box>
            )}

            {selectedProject?.technologies && (
              <Box sx={{ mb: 1 }}>
                <Typography variant="overline">Technologies</Typography>
                <Typography>{selectedProject.technologies}</Typography>
              </Box>
            )}

            {selectedProject?.description && (
              <Box sx={{ mb: 1 }}>
                <Typography variant="overline">Description</Typography>
                <Typography>{selectedProject.description}</Typography>
              </Box>
            )}

            {selectedProject?.teamSize && (
              <Box sx={{ mb: 1 }}>
                <Typography variant="overline">Team Size</Typography>
                <Typography>{selectedProject.teamSize}</Typography>
              </Box>
            )}

            {selectedProject?.outcomes && (
              <Box sx={{ mb: 1 }}>
                <Typography variant="overline">Outcomes</Typography>
                <Typography>{selectedProject.outcomes}</Typography>
              </Box>
            )}

            {selectedProject?.industry && (
              <Box sx={{ mb: 1 }}>
                <Typography variant="overline">Industry</Typography>
                <Typography>{selectedProject.industry}</Typography>
              </Box>
            )}

            {selectedProject?.status && (
              <Box sx={{ mb: 1 }}>
                <Typography variant="overline">Status</Typography>
                <Box sx={{ mt: 0.5 }}>
                  <Chip
                    label={selectedProject.status}
                    size="small"
                    color={
                      selectedProject.status.toLowerCase() === "completed"
                        ? "success"
                        : ["in_progress", "ongoing"].includes(
                            selectedProject.status.toLowerCase()
                          )
                        ? "warning"
                        : selectedProject.status.toLowerCase() === "archived"
                        ? "default"
                        : "info"
                    }
                  />
                </Box>
              </Box>
            )}

            {selectedProject?.projectUrl && (
              <Button
                href={selectedProject.projectUrl}
                target="_blank"
                sx={{ mt: 1 }}
              >
                View Project
              </Button>
            )}

            <Tooltip title="Copy unique shareable URL for this project">
              <Button
                onClick={() => handleCopyLink(selectedProject!.id)}
                sx={{ mt: 1, ml: 2 }}
              >
                Copy Shareable Link
              </Button>
            </Tooltip>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setSelectedProject(null)} variant="outlined">
              Close
            </Button>
            <Button
              onClick={() => {
                if (!selectedProject) return;
                setSelectedProject(null);
                handleEditProject(selectedProject.id);
              }}
              variant="contained"
            >
              Edit
            </Button>
            <Button
              onClick={async () => {
                if (!selectedProject) return;
                const confirmed = await confirm({
                  title: "Confirm delete",
                  message: `Are you sure you want to delete "${
                    selectedProject.projectName ?? "this project"
                  }"? This action cannot be undone.`,
                  confirmText: "Delete",
                  confirmColor: "error",
                });
                if (confirmed) {
                  await performDelete(selectedProject.id);
                }
              }}
              color="error"
              disabled={deleting}
            >
              {deleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Add/Edit Project Dialog */}
        <AddProjectDialog
          open={projectDialogOpen}
          onClose={handleCloseProjectDialog}
          onSuccess={handleProjectDialogSuccess}
          mode={projectDialogMode}
          existingEntry={selectedProjectRow}
        />

        <ErrorSnackbar
          notification={notification}
          onClose={closeNotification}
        />
      </Box>
    </Box>
  );
};

export default ProjectPortfolio;
