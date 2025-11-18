/**
 * AINavBar - Horizontal Navigation
 *
 * Horizontal tab navigation for AI workspace. Replaces the old sidebar
 * with clean, accessible tabs for Hub, Library, Templates, and Research.
 */

import { useLocation, useNavigate } from "react-router-dom";
import { Tabs, Tab, Box, Badge } from "@mui/material";
import {
  Home as HomeIcon,
  Folder as FolderIcon,
  Palette as PaletteIcon,
  Search as SearchIcon,
} from "@mui/icons-material";
import type { NavigationTab, AIWorkspaceTab } from "../types";

/**
 * Navigation tab configuration
 */
const NAVIGATION_TABS: NavigationTab[] = [
  {
    id: "hub",
    label: "Hub",
    icon: "home",
    path: "/ai",
  },
  {
    id: "library",
    label: "Library",
    icon: "folder",
    path: "/ai/library",
  },
  {
    id: "templates",
    label: "Templates",
    icon: "palette",
    path: "/ai/templates",
  },
  {
    id: "research",
    label: "Research",
    icon: "search",
    path: "/ai/research",
  },
];

/**
 * Icon mapping
 */
const ICON_MAP: Record<string, React.ComponentType> = {
  home: HomeIcon,
  folder: FolderIcon,
  palette: PaletteIcon,
  search: SearchIcon,
};

interface AINavBarProps {
  /** Optional badge counts per tab */
  badgeCounts?: Partial<Record<AIWorkspaceTab, number>>;
}

/**
 * AINavBar Component
 *
 * Renders horizontal navigation tabs for the AI workspace.
 * Automatically detects active tab based on current route.
 */
export default function AINavBar({ badgeCounts }: AINavBarProps) {
  const location = useLocation();
  const navigate = useNavigate();

  // Determine active tab from current path
  const activeTab =
    NAVIGATION_TABS.find((tab) => location.pathname === tab.path)?.id || "hub";

  const handleTabChange = (
    _event: React.SyntheticEvent,
    newValue: AIWorkspaceTab
  ) => {
    const tab = NAVIGATION_TABS.find((t) => t.id === newValue);
    if (tab) {
      navigate(tab.path);
    }
  };

  return (
    <Box
      sx={{
        borderBottom: 1,
        borderColor: "divider",
        backgroundColor: "background.paper",
      }}
    >
      <Tabs
        value={activeTab}
        onChange={handleTabChange}
        aria-label="AI workspace navigation"
        sx={{
          px: 2,
          "& .MuiTab-root": {
            minHeight: 56,
            textTransform: "none",
            fontSize: "0.95rem",
            fontWeight: 500,
          },
        }}
      >
        {NAVIGATION_TABS.map((tab) => {
          const IconComponent = ICON_MAP[tab.icon];
          const badgeCount = badgeCounts?.[tab.id];

          return (
            <Tab
              key={tab.id}
              value={tab.id}
              label={
                badgeCount ? (
                  <Badge badgeContent={badgeCount} color="primary">
                    {tab.label}
                  </Badge>
                ) : (
                  tab.label
                )
              }
              icon={<IconComponent />}
              iconPosition="start"
              disabled={tab.disabled}
            />
          );
        })}
      </Tabs>
    </Box>
  );
}
