import React from "react";
import { useParams } from "react-router-dom";
import{ dummyProjects} from "./ProjectPortfolio";
import type { Project } from "./ProjectPortfolio";

const ProjectDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const project = dummyProjects.find(p => p.id === id);

  if (!project) return <div>Project not found</div>;

  return (
    <div style={{ padding: "20px" }}>
      <h2>{project.projectName}</h2>
      <p><strong>Role:</strong> {project.role}</p>
      <p><strong>Technologies:</strong> {project.technologies}</p>
      <p><strong>Description:</strong> {project.description}</p>
      <p><strong>Team Size:</strong> {project.teamSize}</p>
      <p><strong>Outcomes:</strong> {project.outcomes}</p>
      <p><strong>Industry:</strong> {project.industry}</p>
      <p><strong>Status:</strong> {project.status}</p>
      {project.projectUrl && (
        <a href={project.projectUrl} target="_blank">View Project</a>
      )}
    </div>
  );
};

export default ProjectDetails;