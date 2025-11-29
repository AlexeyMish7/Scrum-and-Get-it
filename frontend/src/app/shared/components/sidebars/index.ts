/**
 * Shared Sidebar Components
 * Barrel export for simplified imports
 */

// Original workspace sidebar (non-animated)
export { default as WorkspaceSidebar } from "./WorkspaceSidebar";
export type { NavItem } from "./WorkspaceSidebar";

// Animated sidebar components (Framer Motion)
export { default as AnimatedSidebar } from "./AnimatedSidebar";
export {
  SIDEBAR_WIDTH_COLLAPSED,
  SIDEBAR_WIDTH_EXPANDED,
} from "./sidebarConstants";
export { default as AnimatedSidebarLink } from "./AnimatedSidebarLink";

// Workspace-specific sidebars
export { default as AISidebar } from "./AISidebar";
export { default as JobsSidebar } from "./JobsSidebar";
export { default as ProfileSidebar } from "./ProfileSidebar";
