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
        // Helper to handle different column naming conventions across queries
        const firstString = (keys: string[]) => {
          for (const k of keys) {
            const v = r[k];
            if (typeof v === "string") return v;
            if (Array.isArray(v)) return v.join(", ");
            if (v !== undefined && v !== null) return String(v);
          }
          return "";
        };

        setProject({
          id: firstString(["id", "project_id"]),
          projectName: firstString([
            "proj_name",
            "project_name",
            "proj_title",
            "name",
          ]),
          description: firstString([
            "proj_description",
            "description",
            "proj_desc",
          ]),
          role: firstString(["role"]),
          startDate: firstString([
            "start_date",
            "proj_start_date",
            "date_start",
          ]),
          endDate: firstString(["end_date", "proj_end_date", "date_end"]),
          technologies: firstString([
            "tech_and_skills",
            "technologies",
            "techs",
          ]),
          projectUrl:
            typeof r["project_url"] === "string"
              ? (r["project_url"] as string)
              : typeof r["projecturl"] === "string"
              ? (r["projecturl"] as string)
              : undefined,
          teamSize: firstString(["team_size", "team"]),
          outcomes: firstString(["proj_outcomes", "outcomes"]),
          industry: firstString(["industry_proj_type", "industry"]),
          status:
            typeof r["status"] === "string"
              ? (r["status"] as "Completed" | "Ongoing" | "Planned")
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
