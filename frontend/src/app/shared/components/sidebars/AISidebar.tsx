import WorkspaceSidebar, { type NavItem } from "./WorkspaceSidebar";

const aiNavItems: NavItem[] = [
  { to: "/ai", label: "Dashboard" },
  { to: "/ai/job-match", label: "Job Match" },
  { to: "/ai/company-research", label: "Company Research" },
  { to: "/ai/resume", label: "Resume Studio" },
  { to: "/ai/cover-letter", label: "Cover Letters" },
  { to: "/ai/templates", label: "Templates" },
];

export default function AISidebar() {
  return (
    <WorkspaceSidebar
      title="AI Workspace"
      ariaLabel="AI workspace navigation"
      navItems={aiNavItems}
    />
  );
}
