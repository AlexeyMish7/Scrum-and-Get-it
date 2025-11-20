import WorkspaceSidebar, { type NavItem } from "./WorkspaceSidebar";

const aiNavItems: NavItem[] = [
  { to: "/ai", label: "AI Hub" },
  { to: "/ai/generate/resume", label: "Generate Resume" },
  { to: "/ai/generate/cover-letter", label: "Generate Cover Letter" },
  { to: "/ai/library", label: "Document Library" },
  { to: "/ai/templates", label: "Templates & Themes" },
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
