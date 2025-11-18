/**
 * WORKSPACE SIDEBAR COMPONENT
 *
 * Generic sidebar component for workspace navigation.
 * Provides consistent layout and behavior across all workspaces.
 *
 * FEATURES:
 * - Configurable title and navigation items
 * - Active route highlighting via NavLink
 * - Accessible navigation with ARIA labels
 * - Responsive scrolling for long navigation lists
 *
 * USAGE:
 * ```tsx
 * <WorkspaceSidebar
 *   title="AI Workspace"
 *   ariaLabel="AI workspace navigation"
 *   navItems={[
 *     { to: "/ai", label: "Dashboard" },
 *     { to: "/ai/resume", label: "Resume Studio" },
 *   ]}
 * />
 * ```
 */

import {
  Box,
  List,
  ListItemButton,
  ListItemText,
  Typography,
} from "@mui/material";
import { NavLink } from "react-router-dom";

export interface NavItem {
  to: string;
  label: string;
  end?: boolean; // For exact matching (e.g., dashboard index routes)
}

interface WorkspaceSidebarProps {
  title: string;
  ariaLabel: string;
  navItems: NavItem[];
}

/**
 * WorkspaceSidebar - Reusable sidebar for workspace navigation
 */
export default function WorkspaceSidebar({
  title,
  ariaLabel,
  navItems,
}: WorkspaceSidebarProps) {
  return (
    <Box
      component="nav"
      aria-label={ariaLabel}
      sx={{
        p: 2,
        borderRight: "1px solid",
        borderColor: "divider",
        height: "100%",
        boxSizing: "border-box",
        overflow: "auto",
      }}
    >
      {/* Workspace Title */}
      <Typography variant="subtitle1" sx={{ mb: 1 }}>
        {title}
      </Typography>

      {/* Navigation Links */}
      <List disablePadding>
        {navItems.map((item) => (
          <ListItemButton
            key={item.to}
            component={NavLink}
            to={item.to}
            end={item.end}
          >
            <ListItemText primary={item.label} />
          </ListItemButton>
        ))}
      </List>
    </Box>
  );
}
