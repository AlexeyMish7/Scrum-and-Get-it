/**
 * NAVIGATION TYPES
 * Defines the available views and navigation state for the unified jobs layout.
 */

export type JobsView = "pipeline" | "analytics" | "documents" | "profile";

export interface NavItem {
  id: JobsView;
  label: string;
  path: string;
  shortcut: string;
  description: string;
}

export const NAV_ITEMS: NavItem[] = [
  {
    id: "pipeline",
    label: "Pipeline",
    path: "/jobs/pipeline",
    shortcut: "1",
    description: "Kanban board for tracking job applications",
  },
  {
    id: "analytics",
    label: "Analytics",
    path: "/jobs/analytics",
    shortcut: "2",
    description: "Interview metrics and application insights",
  },
  {
    id: "documents",
    label: "Documents",
    path: "/jobs/documents",
    shortcut: "3",
    description: "Resumes, cover letters, and application materials",
  },
  {
    id: "profile",
    label: "Profile",
    path: "/jobs/profile",
    shortcut: "4",
    description: "Your professional profile and skills",
  },
];
