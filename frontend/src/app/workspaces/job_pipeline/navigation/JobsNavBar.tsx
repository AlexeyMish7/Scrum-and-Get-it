/**
 * JobsNavBar — Vertical tab navigation for Jobs workspace
 *
 * Purpose: Provide intuitive navigation between Pipeline, Analytics, Documents, and Profile views.
 * Renders as vertical tabs on desktop, horizontal bottom nav on mobile.
 *
 * Contract:
 * - Inputs: None (reads current route from React Router)
 * - Outputs: Navigation tabs with active state highlighting
 * - Interactions: Click tab → navigate to view, keyboard shortcuts (1-4)
 * - Mobile: Horizontal bottom navigation with icons only
 */

import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Box,
  Tabs,
  Tab,
  useMediaQuery,
  useTheme,
  Tooltip,
} from "@mui/material";
import {
  ViewKanban as PipelineIcon,
  Analytics as AnalyticsIcon,
  FolderOpen as DocumentsIcon,
  Person as ProfileIcon,
} from "@mui/icons-material";
import { NAV_ITEMS, type JobsView } from "./types";

const ICON_MAP = {
  pipeline: PipelineIcon,
  analytics: AnalyticsIcon,
  documents: DocumentsIcon,
  profile: ProfileIcon,
};

export default function JobsNavBar() {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  // Determine active view from current path
  const activeView: JobsView = (() => {
    const path = location.pathname;
    if (path.includes("/analytics")) return "analytics";
    if (path.includes("/documents")) return "documents";
    if (path.includes("/profile")) return "profile";
    return "pipeline"; // Default
  })();

  // Handle tab change
  const handleChange = (_event: React.SyntheticEvent, newValue: JobsView) => {
    const item = NAV_ITEMS.find((i) => i.id === newValue);
    if (item) {
      navigate(item.path);
    }
  };

  // Keyboard shortcuts (1-4)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only trigger if no input/textarea focused and no modifiers
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.ctrlKey ||
        e.metaKey ||
        e.altKey
      ) {
        return;
      }

      const keyMap: Record<string, JobsView> = {
        "1": "pipeline",
        "2": "analytics",
        "3": "documents",
        "4": "profile",
      };

      const view = keyMap[e.key];
      if (view) {
        e.preventDefault();
        const item = NAV_ITEMS.find((i) => i.id === view);
        if (item) {
          navigate(item.path);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [navigate]);

  // Desktop: Vertical tabs
  if (!isMobile) {
    return (
      <Box
        sx={{
          width: 200,
          height: "100%",
          borderRight: "1px solid",
          borderColor: "divider",
          bgcolor: "background.paper",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <Tabs
          orientation="vertical"
          value={activeView}
          onChange={handleChange}
          sx={{
            "& .MuiTabs-indicator": {
              left: 0,
              right: "auto",
              width: 4,
            },
          }}
        >
          {NAV_ITEMS.map((item) => {
            const Icon = ICON_MAP[item.id];
            return (
              <Tooltip
                key={item.id}
                title={`${item.description} (${item.shortcut})`}
                placement="right"
              >
                <Tab
                  value={item.id}
                  label={item.label}
                  icon={<Icon />}
                  iconPosition="start"
                  sx={{
                    justifyContent: "flex-start",
                    alignItems: "center",
                    textAlign: "left",
                    minHeight: 56,
                    px: 3,
                    "&.Mui-selected": {
                      bgcolor: "action.selected",
                    },
                  }}
                />
              </Tooltip>
            );
          })}
        </Tabs>
      </Box>
    );
  }

  // Mobile: Horizontal bottom navigation
  return (
    <Box
      sx={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: theme.zIndex.appBar,
        bgcolor: "background.paper",
        borderTop: "1px solid",
        borderColor: "divider",
        boxShadow: theme.shadows[8],
      }}
    >
      <Tabs
        value={activeView}
        onChange={handleChange}
        variant="fullWidth"
        sx={{
          minHeight: 64,
          "& .MuiTabs-indicator": {
            top: 0,
            height: 4,
          },
        }}
      >
        {NAV_ITEMS.map((item) => {
          const Icon = ICON_MAP[item.id];
          return (
            <Tab
              key={item.id}
              value={item.id}
              icon={<Icon />}
              label={item.label}
              sx={{
                minHeight: 64,
                fontSize: "0.75rem",
                "&.Mui-selected": {
                  color: "primary.main",
                },
              }}
            />
          );
        })}
      </Tabs>
    </Box>
  );
}
