import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Card,
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
} from "@mui/material";
import { useAuth } from "../../app/shared/context/AuthContext";
import projectsService from "../../app/workspaces/profile/services/projects";
import { useErrorHandler } from "../../app/shared/hooks/useErrorHandler";
import { ErrorSnackbar } from "../../app/shared/components/common/ErrorSnackbar";
import LoadingSpinner from "../../app/shared/components/common/LoadingSpinner";
import type { Project } from "../../types/project";
import "./Projects.css";

// Main portfolio page showing all user's projects in a grid layout
const ProjectPortfolio: React.FC = () => {
  // All projects from database
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  // Projects after applying search and filters
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([]);
  // Filter and search controls
  const [search, setSearch] = useState("");
  const [filterTech, setFilterTech] = useState("");
  const [filterIndustry, setFilterIndustry] = useState("");
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");
  // Dialog for viewing project details
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  // Dialog for confirming deletion
  const [confirmDeleteProject, setConfirmDeleteProject] =
    useState<Project | null>(null);
  const [deleting, setDeleting] = useState(false);

  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const { notification, closeNotification, showSuccess, handleError } =
    useErrorHandler();

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

  // Load all projects for the current user
  useEffect(() => {
    let mounted = true;
    const load = async () => {
      if (loading) {
        setIsLoading(true);
        return;
      }

      if (!user) {
        if (!mounted) return;
        setProjects([]);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        const res = await projectsService.listProjects(user.id);
        if (!mounted) return;
        if (res.error) {
          console.error("Failed to load projects:", res.error);
          setProjects([]);
          return;
        }

        const rows = Array.isArray(res.data)
          ? res.data
          : res.data
          ? [res.data]
          : [];
        const mapped = rows.map(projectsService.mapRowToProject);
        setProjects(mapped);
        // Load image URLs in background - don't block the main display
        mapped.forEach(async (p) => {
          if (p.mediaPath) {
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
      } catch (err) {
        console.error("Error loading projects:", err);
        setProjects([]);
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    load();
    // Reload when projects change (after add/edit/delete)
    const handler = () => void load();
    window.addEventListener("projects:changed", handler);

    return () => {
      mounted = false;
      window.removeEventListener("projects:changed", handler);
    };
  }, [user, loading]);

  // Apply search filters and sorting whenever inputs change
  useEffect(() => {
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

    setFilteredProjects(temp);
  }, [projects, search, filterTech, filterIndustry, sortOrder]);

  if (loading || isLoading) return <LoadingSpinner />;

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
      // Notify other components and reload the list
      window.dispatchEvent(
        new CustomEvent("projects:notification", {
          detail: { message: "Project deleted", severity: "success" },
        })
      );
      window.dispatchEvent(new Event("projects:changed"));
      setSelectedProject(null);
      setConfirmDeleteProject(null);
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
  const handleAddProject = () => navigate("/projects/new");

  return (
    <div className="projects-container">
      <div className="projects-content-wrapper">
        <div className="projects-portfolio-header">
          <Typography variant="h2" className="projects-title">
            My Projects Portfolio
          </Typography>
          <Typography variant="subtitle1" className="projects-subtitle">
            Showcase of my professional work and achievements
          </Typography>
        </div>

        {/* Add Project Button */}
        <div
          style={{ textAlign: "center", marginBottom: "2rem" }}
          className="no-print"
        >
          <Button
            className="projects-btn-glossy projects-btn-large"
            onClick={handleAddProject}
          >
            Add Project
          </Button>
        </div>

        <Typography
          variant="body2"
          className="projects-subtitle no-print"
          style={{ textAlign: "center", marginBottom: "2rem" }}
        >
          Click on any project to view details and copy its shareable link.
        </Typography>

        {/* Filters, search, and print */}
        <div className="projects-controls no-print">
          <div className="projects-form-field projects-search-field">
            <TextField
              label="Search Projects"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              fullWidth
            />
          </div>

          <div className="projects-form-field projects-filter-control">
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
          </div>

          <div className="projects-form-field projects-filter-control">
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
          </div>

          <div className="projects-form-field projects-filter-control">
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
          </div>

          <Button className="projects-btn-secondary" onClick={handlePrint}>
            Print All Projects
          </Button>
        </div>

        {/* Loading State */}
        {(loading || isLoading) && (
          <div className="projects-loading">
            <LoadingSpinner />
            <Typography>Loading projects...</Typography>
          </div>
        )}

        {/* Empty State */}
        {!loading && !isLoading && filteredProjects.length === 0 && (
          <div className="projects-empty">
            <Typography variant="h4" className="projects-empty-title">
              No Projects Found
            </Typography>
            <Typography className="projects-empty-text">
              {projects.length === 0
                ? "Start building your portfolio by adding your first project!"
                : "Try adjusting your search or filter criteria."}
            </Typography>
            {projects.length === 0 && (
              <Button
                className="projects-btn-glossy projects-btn-large"
                onClick={handleAddProject}
              >
                Add Your First Project
              </Button>
            )}
          </div>
        )}

        {/* Project Cards */}
        {!loading && !isLoading && filteredProjects.length > 0 && (
          <div className="projects-grid">
            {filteredProjects.map((project) => (
              <Card
                key={project.id}
                className="project-card"
                onClick={() => setSelectedProject(project)}
              >
                <div className="project-card-content">
                  {/* Thumbnail on the left */}
                  {project.mediaUrl ? (
                    <img
                      src={project.mediaUrl}
                      alt={`${project.projectName} screenshot`}
                      className={`project-thumbnail ${
                        project.previewShape === "circle" ? "circle" : ""
                      }`}
                    />
                  ) : (
                    <div
                      className={`project-thumbnail-placeholder ${
                        project.previewShape === "circle" ? "circle" : ""
                      }`}
                    >
                      📁
                    </div>
                  )}

                  {/* Content on the right */}
                  <div className="project-info">
                    <Typography variant="h6" className="project-name">
                      {project.projectName}
                    </Typography>

                    <div
                      className={`project-status ${project.status.toLowerCase()}`}
                    >
                      {project.status}
                    </div>

                    <Typography className="project-description">
                      {project.role} | {project.technologies}
                    </Typography>

                    <Typography className="project-tech">
                      {project.description.length > 100
                        ? `${project.description.substring(0, 100)}...`
                        : project.description}
                    </Typography>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Project Details Dialog */}
        <Dialog
          open={!!selectedProject}
          onClose={() => setSelectedProject(null)}
          maxWidth="sm"
          fullWidth
          className="projects-dialog"
        >
          <DialogTitle className="projects-dialog-title">
            {selectedProject?.projectName}
          </DialogTitle>
          <DialogContent className="projects-dialog-content" dividers>
            {selectedProject?.mediaUrl && (
              <img
                src={selectedProject.mediaUrl}
                alt={`${selectedProject.projectName} screenshot`}
                className="projects-dialog-image"
              />
            )}

            {selectedProject?.role && (
              <div className="projects-detail-section">
                <div className="projects-detail-label">Role</div>
                <div className="projects-detail-value">
                  {selectedProject.role}
                </div>
              </div>
            )}

            {(selectedProject?.startDate || selectedProject?.endDate) && (
              <div className="projects-detail-section">
                <div className="projects-detail-label">Dates</div>
                <div className="projects-detail-value">
                  {selectedProject.startDate ?? ""}
                  {selectedProject.endDate
                    ? ` - ${selectedProject.endDate}`
                    : ""}
                </div>
              </div>
            )}

            {selectedProject?.technologies && (
              <div className="projects-detail-section">
                <div className="projects-detail-label">Technologies</div>
                <div className="projects-detail-value">
                  {selectedProject.technologies}
                </div>
              </div>
            )}

            {selectedProject?.description && (
              <div className="projects-detail-section">
                <div className="projects-detail-label">Description</div>
                <div className="projects-detail-value">
                  {selectedProject.description}
                </div>
              </div>
            )}

            {selectedProject?.teamSize && (
              <div className="projects-detail-section">
                <div className="projects-detail-label">Team Size</div>
                <div className="projects-detail-value">
                  {selectedProject.teamSize}
                </div>
              </div>
            )}

            {selectedProject?.outcomes && (
              <div className="projects-detail-section">
                <div className="projects-detail-label">Outcomes</div>
                <div className="projects-detail-value">
                  {selectedProject.outcomes}
                </div>
              </div>
            )}

            {selectedProject?.industry && (
              <div className="projects-detail-section">
                <div className="projects-detail-label">Industry</div>
                <div className="projects-detail-value">
                  {selectedProject.industry}
                </div>
              </div>
            )}

            {selectedProject?.status && (
              <div className="projects-detail-section">
                <div className="projects-detail-label">Status</div>
                <div
                  className={`project-status ${selectedProject.status.toLowerCase()}`}
                >
                  {selectedProject.status}
                </div>
              </div>
            )}

            {selectedProject?.projectUrl && (
              <Button
                href={selectedProject.projectUrl}
                target="_blank"
                className="projects-btn-glossy"
                sx={{ mt: 2 }}
              >
                View Project
              </Button>
            )}

            <Tooltip title="Copy unique shareable URL for this project">
              <Button
                onClick={() => handleCopyLink(selectedProject!.id)}
                className="projects-btn-secondary"
                sx={{ mt: 2, ml: 2 }}
              >
                Copy Shareable Link
              </Button>
            </Tooltip>
          </DialogContent>
          <DialogActions>
            <Button
              onClick={() => setSelectedProject(null)}
              className="projects-btn-secondary"
            >
              Close
            </Button>
            <Button
              onClick={() => {
                if (!selectedProject) return;
                navigate(`/projects/${selectedProject.id}/edit`);
              }}
              className="projects-btn-glossy"
            >
              Edit
            </Button>
            <Button
              onClick={() => {
                if (!selectedProject) return;
                setConfirmDeleteProject(selectedProject);
              }}
              className="projects-btn-danger"
            >
              Delete
            </Button>
          </DialogActions>
        </Dialog>

        {/* Confirm delete dialog */}
        <Dialog
          open={!!confirmDeleteProject}
          onClose={() => setConfirmDeleteProject(null)}
          className="projects-dialog"
        >
          <DialogTitle className="projects-dialog-title">
            Confirm delete
          </DialogTitle>
          <DialogContent className="projects-dialog-content">
            <Typography>
              {`Are you sure you want to delete "${
                confirmDeleteProject?.projectName ?? "this project"
              }"? This action cannot be undone.`}
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button
              onClick={() => setConfirmDeleteProject(null)}
              className="projects-btn-secondary"
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (!confirmDeleteProject) return;
                performDelete(confirmDeleteProject.id);
              }}
              disabled={deleting}
              className="projects-btn-danger"
            >
              {deleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogActions>
        </Dialog>

        <ErrorSnackbar
          notification={notification}
          onClose={closeNotification}
        />
      </div>
    </div>
  );
};

export default ProjectPortfolio;
