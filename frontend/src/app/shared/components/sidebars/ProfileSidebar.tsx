/**
 * PROFILE SIDEBAR COMPONENT
 *
 * Animated sidebar for the Profile workspace.
 * Uses Framer Motion for smooth expand/collapse animations.
 *
 * Desktop: Collapses to icons only, expands on hover
 * Mobile: Hamburger menu with slide-in drawer
 */

import AnimatedSidebar from "./AnimatedSidebar";
import AnimatedSidebarLink from "./AnimatedSidebarLink";
import { SidebarProvider } from "@shared/context/SidebarContext";

// MUI Icons for each navigation item
import DashboardIcon from "@mui/icons-material/Dashboard";
import WorkIcon from "@mui/icons-material/Work";
import SchoolIcon from "@mui/icons-material/School";
import StarIcon from "@mui/icons-material/Star";
import FolderIcon from "@mui/icons-material/Folder";
import CardMembershipIcon from "@mui/icons-material/CardMembership";
import CodeIcon from "@mui/icons-material/Code";

/**
 * ProfileSidebar - Animated navigation for Profile workspace
 *
 * Wraps itself in SidebarProvider to manage open/close state.
 */
export default function ProfileSidebar() {
  return (
    <SidebarProvider>
      <AnimatedSidebar
        title="Profile Workspace"
        ariaLabel="Profile workspace navigation"
      >
        <AnimatedSidebarLink
          to="/profile"
          icon={<DashboardIcon />}
          label="Dashboard"
          end
        />
        <AnimatedSidebarLink
          to="/profile/employment"
          icon={<WorkIcon />}
          label="Employment"
        />
        <AnimatedSidebarLink
          to="/profile/education"
          icon={<SchoolIcon />}
          label="Education"
        />
        <AnimatedSidebarLink
          to="/profile/skills"
          icon={<StarIcon />}
          label="Skills"
        />
        <AnimatedSidebarLink
          to="/profile/projects"
          icon={<FolderIcon />}
          label="Projects"
        />
        <AnimatedSidebarLink
          to="/profile/github"
          icon={<CodeIcon />}
          label="GitHub"
        />
        <AnimatedSidebarLink
          to="/profile/certifications"
          icon={<CardMembershipIcon />}
          label="Certifications"
        />
      </AnimatedSidebar>
    </SidebarProvider>
  );
}
