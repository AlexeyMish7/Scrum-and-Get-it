import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { dummyProjects } from "../data/dummyProjects";
import type { Project } from "./ProjectPortfolio";
import { useAuth } from "../context/AuthContext";
import crud from "../services/crud";

const ProjectDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user, loading } = useAuth();
  const [project, setProject] = useState<Project | null>(null);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      if (loading) return;
      if (!id) return;
      if (!user) {
        // fallback to dummy data for unauthenticated users
        const p = dummyProjects.find((p: Project) => p.id === id) ?? null;
        if (!mounted) return;
        setProject(p);
        return;
      }

      try {
        const userCrud = crud.withUser(user.id);
        const res = await userCrud.getRow("projects", "*", {
          eq: { id: id as string },
          single: true,
        });
        if (!mounted) return;
        if (res.error || !res.data) {
          // try dummy fallback if not found
          const p = dummyProjects.find((p: Project) => p.id === id) ?? null;
          setProject(p);
          return;
        }
        const r = res.data as Record<string, unknown>;
        setProject({
          id: String(r.id ?? ""),
          projectName: String(r.project_name ?? ""),
          description: String(r.description ?? ""),
          role: String(r.role ?? ""),
          startDate: String(r.start_date ?? ""),
          endDate: String(r.end_date ?? ""),
          technologies: String(r.technologies ?? ""),
          projectUrl:
            typeof r.project_url === "string"
              ? (r.project_url as string)
              : undefined,
          teamSize: String(r.team_size ?? ""),
          outcomes: String(r.outcomes ?? ""),
          industry: String(r.industry ?? ""),
          status:
            typeof r.status === "string"
              ? (r.status as "Completed" | "Ongoing" | "Planned")
              : "Planned",
        });
      } catch (err) {
        console.error("Failed to load project details", err);
        const p = dummyProjects.find((p: Project) => p.id === id) ?? null;
        if (!mounted) return;
        setProject(p);
      }
    };

    load();
    return () => {
      mounted = false;
    };
  }, [id, user, loading]);

  if (!project) return <div>Project not found</div>;

  return (
    <div style={{ padding: "20px" }}>
      <h2>{project.projectName}</h2>
      <p>
        <strong>Role:</strong> {project.role}
      </p>
      <p>
        <strong>Technologies:</strong> {project.technologies}
      </p>
      <p>
        <strong>Description:</strong> {project.description}
      </p>
      <p>
        <strong>Team Size:</strong> {project.teamSize}
      </p>
      <p>
        <strong>Outcomes:</strong> {project.outcomes}
      </p>
      <p>
        <strong>Industry:</strong> {project.industry}
      </p>
      <p>
        <strong>Status:</strong> {project.status}
      </p>
      {project.projectUrl && (
        <a href={project.projectUrl} target="_blank" rel="noreferrer">
          View Project
        </a>
      )}
    </div>
  );
};

export default ProjectDetails;
