import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useAuth } from "../../../../shared/context/AuthContext";
import projectsService from "../../services/projects";
import type { Project } from "../../types/project.ts";
import "./Projects.css";

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
  if (loading) return <div className="projects-loading">Loading...</div>;
  if (!project) return <div className="projects-empty">Project not found</div>;

  return (
    <div className="projects-container">
      <div className="projects-content-wrapper">
        <div className="projects-details-container">
          <h2 className="projects-details-title">{project.projectName}</h2>

          {/* Display project image if available */}
          {mediaUrl && (
            <div className="projects-details-image-container">
              <img
                src={mediaUrl}
                alt={`${project.projectName} screenshot`}
                className="projects-details-image"
              />
            </div>
          )}

          {/* Display project details in organized sections */}
          <div className="projects-details-info">
            {project.role && (
              <div className="projects-detail-section">
                <div className="projects-detail-label">Role</div>
                <div className="projects-detail-value">{project.role}</div>
              </div>
            )}

            {project.technologies && (
              <div className="projects-detail-section">
                <div className="projects-detail-label">Technologies</div>
                <div className="projects-detail-value">
                  {project.technologies}
                </div>
              </div>
            )}

            {project.description && (
              <div className="projects-detail-section">
                <div className="projects-detail-label">Description</div>
                <div className="projects-detail-value">
                  {project.description}
                </div>
              </div>
            )}

            {project.teamSize && (
              <div className="projects-detail-section">
                <div className="projects-detail-label">Team Size</div>
                <div className="projects-detail-value">{project.teamSize}</div>
              </div>
            )}

            {project.outcomes && (
              <div className="projects-detail-section">
                <div className="projects-detail-label">Outcomes</div>
                <div className="projects-detail-value">{project.outcomes}</div>
              </div>
            )}

            {project.industry && (
              <div className="projects-detail-section">
                <div className="projects-detail-label">Industry</div>
                <div className="projects-detail-value">{project.industry}</div>
              </div>
            )}

            {project.status && (
              <div className="projects-detail-section">
                <div className="projects-detail-label">Status</div>
                <div
                  className={`project-status ${project.status.toLowerCase()}`}
                >
                  {project.status}
                </div>
              </div>
            )}

            {project.projectUrl && (
              <div className="projects-detail-section">
                <div className="projects-detail-label">Project Link</div>
                <a
                  href={project.projectUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="projects-detail-link"
                >
                  View Project
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectDetails;
