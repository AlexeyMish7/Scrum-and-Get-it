/**
 * AINavBar - Horizontal Navigation
 *
 * Horizontal tab navigation for AI workspace. Replaces the old sidebar
 * with clean, accessible tabs for Hub, Library, Templates, and Research.
 */

import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Tabs, Tab, Box, Badge } from "@mui/material";
import {
  Home as HomeIcon,
  Folder as FolderIcon,
  Palette as PaletteIcon,
  Search as SearchIcon,
  Description as ResumeIcon,
  Email as CoverLetterIcon,
  RateReview as ReviewsIcon,
} from "@mui/icons-material";
import type { NavigationTab, AIWorkspaceTab } from "../types";
import ConfirmNavigationDialog from "../components/common/ConfirmNavigationDialog";
import { useGeneration } from "../context/useGeneration";

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
    id: "resume",
    label: "Resume",
    icon: "resume",
    path: "/ai/generate/resume",
  },
  {
    id: "cover-letter",
    label: "Cover Letter",
    icon: "cover-letter",
    path: "/ai/generate/cover-letter",
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
  {
    id: "reviews",
    label: "Reviews",
    icon: "reviews",
    path: "/ai/reviews",
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
  resume: ResumeIcon,
  "cover-letter": CoverLetterIcon,
  reviews: ReviewsIcon,
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
  const { hasStartedGeneration, setHasStartedGeneration } = useGeneration();
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<string | null>(
    null
  );

  // Determine active tab from current path (including sub-routes)
  const activeTab = (() => {
    // Exact match first
    const exactMatch = NAVIGATION_TABS.find(
      (tab) => location.pathname === tab.path
    );
    if (exactMatch) return exactMatch.id;

    // Check if current path starts with any tab path (for sub-routes)
    const pathMatch = NAVIGATION_TABS.find(
      (tab) => tab.path !== "/ai" && location.pathname.startsWith(tab.path)
    );
    if (pathMatch) return pathMatch.id;

    // Default to hub
    return "hub";
  })();

  const handleTabChange = (
    _event: React.SyntheticEvent,
    newValue: AIWorkspaceTab
  ) => {
    const tab = NAVIGATION_TABS.find((t) => t.id === newValue);
    if (!tab) return;

    // Only warn if on generation page AND user has actually started (selected template)
    const isOnGenerationPage =
      location.pathname === "/ai/generate/resume" ||
      location.pathname === "/ai/generate/cover-letter";

    if (
      isOnGenerationPage &&
      hasStartedGeneration &&
      tab.path !== location.pathname
    ) {
      setPendingNavigation(tab.path);
      setConfirmDialogOpen(true);
    } else {
      // Reset generation state when navigating away
      if (isOnGenerationPage) {
        setHasStartedGeneration(false);
      }
      navigate(tab.path);
    }
  };

  const handleConfirmNavigation = () => {
    if (pendingNavigation) {
      setHasStartedGeneration(false);
      navigate(pendingNavigation);
      setConfirmDialogOpen(false);
      setPendingNavigation(null);
    }
  };

  const handleCancelNavigation = () => {
    setConfirmDialogOpen(false);
    setPendingNavigation(null);
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

      <ConfirmNavigationDialog
        open={confirmDialogOpen}
        onClose={handleCancelNavigation}
        onConfirm={handleConfirmNavigation}
      />
    </Box>
  );
}
