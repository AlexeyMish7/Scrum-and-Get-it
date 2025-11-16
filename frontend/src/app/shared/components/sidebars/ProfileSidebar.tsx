import WorkspaceSidebar, { type NavItem } from "./WorkspaceSidebar";

const profileNavItems: NavItem[] = [
  { to: "/profile", label: "Dashboard", end: true },
  { to: "/profile/employment", label: "Employment" },
  { to: "/profile/education", label: "Education" },
  { to: "/profile/skills", label: "Skills" },
  { to: "/profile/projects", label: "Projects" },
  { to: "/profile/certifications", label: "Certifications" },
  { to: "/profile/details", label: "Profile Details" },
  { to: "/profile/settings", label: "Settings" },
];

export default function ProfileSidebar() {
  return (
    <WorkspaceSidebar
      title="Profile Workspace"
      ariaLabel="Profile workspace navigation"
      navItems={profileNavItems}
    />
  );
}
