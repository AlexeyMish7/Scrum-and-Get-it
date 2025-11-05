import * as crud from "../app/shared/services/crud";
import { supabase } from "../app/shared/services/supabaseClient";
import type { ProjectRow, Project } from "../types/project";

// Convert database row format to UI-friendly format
const mapRowToProject = (r: ProjectRow): Project => {
  // Helper to safely convert any value to string for display
  const getString = (v: unknown) => {
    if (typeof v === "string") return v;
    if (Array.isArray(v)) return v.join(", ");
    if (v === null || v === undefined) return "";
    return String(v);
  };

  return {
    id: r.id,
    projectName: getString(r.proj_name),
    description: getString(r.proj_description),
    role: getString(r.role),
    startDate: getString(r.start_date),
    endDate: getString(r.end_date),
    technologies: getString(r.tech_and_skills),
    projectUrl: typeof r.project_url === "string" ? r.project_url : undefined,
    teamSize: getString(r.team_size),
    outcomes: getString(r.proj_outcomes),
    industry: getString(r.industry_proj_type),
    // Convert lowercase status to capitalized for display
    status:
      r.status === "completed"
        ? "Completed"
        : r.status === "ongoing"
        ? "Ongoing"
        : "Planned",
    mediaPath: typeof r.media_path === "string" ? r.media_path : null,
    mediaUrl: null, // Will be populated later when image loads
    // Extract preview shape preference from metadata
    previewShape: (() => {
      try {
        const m = r.meta as Record<string, unknown> | null;
        if (
          m &&
          typeof m.previewShape === "string" &&
          m.previewShape === "circle"
        )
          return "circle" as const;
      } catch {
        /* ignore parsing errors */
      }
      return "rounded" as const; // Default shape
    })(),
  } as Project;
};

// Get a viewable URL for project images stored in private bucket
const resolveMediaUrl = async (
  mediaPath: string | null
): Promise<string | null> => {
  if (!mediaPath) return null;
  try {
    // Try to get a secure signed URL first (expires in 1 hour)
    const { data: signedData, error: signedErr } = await supabase.storage
      .from("projects")
      .createSignedUrl(mediaPath, 60 * 60);
    if (
      !signedErr &&
      signedData &&
      (signedData as { signedUrl?: string }).signedUrl
    ) {
      return (signedData as { signedUrl?: string }).signedUrl ?? null;
    }

    // Fallback to public URL if signed URL fails
    const { data: pub } = supabase.storage
      .from("projects")
      .getPublicUrl(mediaPath);
    if (pub && (pub as { publicUrl?: string }).publicUrl) {
      return (pub as { publicUrl?: string }).publicUrl ?? null;
    }
  } catch (err) {
    console.warn("resolveMediaUrl error", err);
  }
  return null;
};

// Get all projects for the current user, newest first
const listProjects = async (userId: string) => {
  const userCrud = crud.withUser(userId);
  return await userCrud.listRows<ProjectRow>("projects", "*", {
    order: { column: "start_date", ascending: false },
  });
};

// Get a single project by ID for the current user
const getProject = async (userId: string, id: string) => {
  const userCrud = crud.withUser(userId);
  return await userCrud.getRow<ProjectRow>("projects", "*", {
    eq: { id },
    single: true,
  });
};

// Create a new project for the current user
const insertProject = async (userId: string, payload: Partial<ProjectRow>) => {
  const userCrud = crud.withUser(userId);
  return await userCrud.insertRow("projects", payload, "*");
};

// Update an existing project for the current user
const updateProject = async (
  userId: string,
  id: string,
  payload: Partial<ProjectRow>
) => {
  const userCrud = crud.withUser(userId);
  return await userCrud.updateRow("projects", payload, { eq: { id } });
};

// Delete a project and clean up all associated files and documents
const deleteProject = async (userId: string, id: string) => {
  const userCrud = crud.withUser(userId);

  try {
    // First, get the project details so we know what files to clean up
    const projRes = await userCrud.getRow<ProjectRow>("projects", "*", {
      eq: { id },
      single: true,
    });

    if (projRes.error) {
      return projRes;
    }

    const project = projRes.data as ProjectRow | null;

    // Step 1: Look for documents linked to this project and clean them up
    let documentsDeleted = false;
    try {
      const docsRes = await userCrud.listRows("documents", "id,file_path", {
        eq: { project_id: id },
      });

      if (!docsRes.error && docsRes.data) {
        const rows = Array.isArray(docsRes.data)
          ? docsRes.data
          : [docsRes.data];

        for (const d of rows as Array<{ id?: string; file_path?: string }>) {
          // Remove the actual file from storage
          if (d.file_path) {
            try {
              await supabase.storage.from("projects").remove([d.file_path]);
            } catch (err) {
              console.warn("Failed to remove document file from storage:", err);
            }
          }

          // Remove the database record
          if (d.id) {
            try {
              await userCrud.deleteRow("documents", { eq: { id: d.id } });
            } catch (err) {
              console.warn("Failed to delete documents row:", err);
            }
          }
        }
        documentsDeleted = true;
      }
    } catch (err) {
      console.warn(
        "Failed to query documents by project_id (migration may not be applied):",
        err
      );
    }

    // Step 2: Fallback - look for documents by matching the file path directly
    if (!documentsDeleted && project && project.media_path) {
      try {
        const docsRes = await userCrud.listRows("documents", "id,file_path", {
          eq: { file_path: project.media_path },
        });

        if (!docsRes.error && docsRes.data) {
          const rows = Array.isArray(docsRes.data)
            ? docsRes.data
            : [docsRes.data];

          for (const d of rows as Array<{ id?: string; file_path?: string }>) {
            // Remove the file from storage
            if (d.file_path) {
              try {
                await supabase.storage.from("projects").remove([d.file_path]);
              } catch (err) {
                console.warn(
                  "Failed to remove document file from storage (fallback):",
                  err
                );
              }
            }

            // Remove the database record
            if (d.id) {
              try {
                await userCrud.deleteRow("documents", { eq: { id: d.id } });
              } catch (err) {
                console.warn("Failed to delete documents row:", err);
              }
            }
          }
        }
      } catch (err) {
        console.warn("Failed to query documents by file_path:", err);
      }
    }

    // Step 3: Remove the main project image file
    if (project && project.media_path) {
      try {
        await supabase.storage.from("projects").remove([project.media_path]);
      } catch (err) {
        console.warn("Failed to remove project media file:", err);
      }
    }

    // Step 4: Finally, delete the project record itself
    return await userCrud.deleteRow("projects", { eq: { id } });
  } catch (err) {
    console.error("deleteProject error:", err);
    return { error: err } as { error: unknown };
  }
};

// Export all the project service functions
export default {
  listProjects,
  getProject,
  insertProject,
  updateProject,
  deleteProject,
  mapRowToProject,
  resolveMediaUrl,
};
