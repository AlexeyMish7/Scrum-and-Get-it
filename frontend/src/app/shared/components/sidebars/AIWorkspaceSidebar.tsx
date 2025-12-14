/**
 * AI WORKSPACE SIDEBAR COMPONENT
 *
 * Animated sidebar for the AI workspace.
 * Uses Framer Motion for smooth expand/collapse animations.
 *
 * Desktop: Collapses to icons only, expands on hover
 * Mobile: Hamburger menu with slide-in drawer
 */

import AnimatedSidebar from "./AnimatedSidebar";
import AnimatedSidebarLink from "./AnimatedSidebarLink";
import { SidebarProvider } from "@shared/context/SidebarContext";

// MUI Icons for each navigation item
import HomeIcon from "@mui/icons-material/Home";
import DescriptionIcon from "@mui/icons-material/Description";
import EmailIcon from "@mui/icons-material/Email";
import FolderIcon from "@mui/icons-material/Folder";
import PaletteIcon from "@mui/icons-material/Palette";
import SearchIcon from "@mui/icons-material/Search";
import AssignmentIcon from "@mui/icons-material/Assignment";

/**
 * AIWorkspaceSidebar - Animated navigation for AI workspace
 *
 * Wraps itself in SidebarProvider to manage open/close state.
 */
export default function AIWorkspaceSidebar() {
  return (
    <SidebarProvider>
      <AnimatedSidebar title="AI Workspace" ariaLabel="AI workspace navigation">
        <AnimatedSidebarLink to="/ai" icon={<HomeIcon />} label="Hub" end />
        <AnimatedSidebarLink
          to="/ai/generate/resume"
          icon={<DescriptionIcon />}
          label="Resume"
        />
        <AnimatedSidebarLink
          to="/ai/generate/cover-letter"
          icon={<EmailIcon />}
          label="Cover Letter"
        />
        <AnimatedSidebarLink
          to="/ai/library"
          icon={<FolderIcon />}
          label="Library"
        />
        <AnimatedSidebarLink
          to="/ai/templates"
          icon={<PaletteIcon />}
          label="Templates"
        />
        <AnimatedSidebarLink
          to="/ai/research"
          icon={<SearchIcon />}
          label="Research"
        />
        <AnimatedSidebarLink
          to="/ai/reviews"
          icon={<AssignmentIcon />}
          label="Reviews"
        />
      </AnimatedSidebar>
    </SidebarProvider>
  );
}
