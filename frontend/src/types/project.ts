// Database row format - matches the structure in Supabase
export type ProjectRow = {
  id: string;
  user_id: string;
  proj_name: string;
  proj_description?: string | null;
  role?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  tech_and_skills?: string[] | null;
  project_url?: string | null;
  team_size?: number | null;
  team_details?: string | null;
  industry_proj_type?: string | null;
  proj_outcomes?: string | null;
  status?: "planned" | "ongoing" | "completed" | null;
  media_path?: string | null;
  meta?: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
};

// UI-friendly format - converted from ProjectRow for display
export interface Project {
  id: string;
  projectName: string;
  description: string;
  role: string;
  startDate: string;
  endDate: string;
  technologies: string;
  projectUrl?: string;
  teamSize: string;
  outcomes: string;
  industry: string;
  status: "Completed" | "Ongoing" | "Planned";
  // File path in Supabase storage bucket (e.g. "<user_id>/.../file.png")
  mediaPath?: string | null;
  // Resolved public URL for displaying images (filled by service)
  mediaUrl?: string | null;
  // Preview shape preference ("rounded" | "circle") stored in metadata
  previewShape?: "rounded" | "circle";
}
