import WorkspaceSidebar, { type NavItem } from "./WorkspaceSidebar";

const aiNavItems: NavItem[] = [
  { to: "/ai-new", label: "AI Hub" },
  { to: "/ai-new/generate/resume", label: "Generate Resume" },
  { to: "/ai-new/generate/cover-letter", label: "Generate Cover Letter" },
  { to: "/ai-new/library", label: "Document Library" },
  { to: "/ai-new/templates", label: "Templates & Themes" },
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
