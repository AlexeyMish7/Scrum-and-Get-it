import WorkspaceSidebar, { type NavItem } from "./WorkspaceSidebar";

const jobsNavItems: NavItem[] = [
  { to: "/jobs/pipeline", label: "Pipeline" },
  { to: "/jobs/new", label: "Add Job Opportunity" },
  { to: "/jobs/documents", label: "Documents" },
  { to: "/jobs/saved-searches", label: "Search Jobs" },
  { to: "/jobs/analytics", label: "Analytics" },
  { to: "/jobs/automations", label: "Automations" },
  { to: "/jobs/archived-jobs", label: "Archived Jobs" },
];

export default function JobsSidebar() {
  return (
    <WorkspaceSidebar
      title="Jobs Workspace"
      ariaLabel="Jobs workspace navigation"
      navItems={jobsNavItems}
    />
  );
}
