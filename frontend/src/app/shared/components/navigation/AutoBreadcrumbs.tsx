/**
 * AutoBreadcrumbs
 *
 * Automatically generates breadcrumbs based on the current route.
 * Sits below the GlobalTopBar at a fixed position on the left.
 * Works across the entire app without requiring individual pages to set breadcrumbs.
 * Adjusts position when sidebar is present (profile, jobs, ai workspaces).
 */

import { useMemo } from "react";
import { useLocation, Link as RouterLink } from "react-router-dom";
import {
  Box,
  Breadcrumbs as MuiBreadcrumbs,
  Link,
  Typography,
} from "@mui/material";
import NavigateNextIcon from "@mui/icons-material/NavigateNext";

// Route label mappings - customize labels for specific paths
const ROUTE_LABELS: Record<string, string> = {
  // Profile workspace
  "/profile": "Profile",
  "/profile/dashboard": "Dashboard",
  "/profile/education": "Education",
  "/profile/employment": "Employment",
  "/profile/skills": "Skills",
  "/profile/projects": "Projects",
  "/profile/certifications": "Certifications",
  "/profile/details": "Profile Details",
  "/profile/settings": "Settings",
  "/profile/analytics": "Analytics",

  // AI workspace
  "/ai": "AI Workspace",
  "/ai/hub": "Hub",
  "/ai/documents": "Documents",
  "/ai/templates": "Templates",
  "/ai/company-research": "Company Research",
  "/ai/resume": "Resume Generator",
  "/ai/cover-letter": "Cover Letter",
  "/ai/editor": "Editor",
  "/ai/reviews": "Reviews",

  // Jobs workspace
  "/jobs": "Jobs",
  "/jobs/pipeline": "Pipeline",
  "/jobs/analytics": "Analytics",
  "/jobs/new": "Add Job",
  "/jobs/saved-searches": "Saved Searches",
  "/jobs/automations": "Automations",
  "/jobs/archived": "Archived",

  // Interview Hub
  "/interviews": "Interviews",

  // Network Hub
  "/network": "Network",

  // Teams
  "/teams": "Teams",

  // Auth pages (don't show breadcrumbs)
  "/login": "",
  "/register": "",
  "/forgot-password": "",
  "/reset-password": "",
  "/auth/callback": "",
};

export const AutoBreadcrumbs: React.FC = () => {
  const location = useLocation();

  const breadcrumbs = useMemo(() => {
    const pathname = location.pathname;

    // Don't show breadcrumbs on auth pages or home
    if (
      pathname === "/" ||
      pathname === "/login" ||
      pathname === "/register" ||
      pathname === "/forgot-password" ||
      pathname === "/reset-password" ||
      pathname.startsWith("/auth/")
    ) {
      return [];
    }

    // Split path into segments
    const segments = pathname.split("/").filter(Boolean);

    // Build breadcrumb items
    const items: Array<{ label: string; path: string; isLast: boolean }> = [];
    let currentPath = "";

    segments.forEach((segment, index) => {
      currentPath += `/${segment}`;
      const isLast = index === segments.length - 1;

      // Get label from mapping or format segment
      let label = ROUTE_LABELS[currentPath];

      if (!label) {
        // If not in mapping, format the segment (capitalize, replace dashes)
        label = segment
          .split("-")
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(" ");
      }

      // Skip if label is empty
      if (label) {
        items.push({
          label,
          path: currentPath,
          isLast,
        });
      }
    });

    return items;
  }, [location.pathname]);

  if (breadcrumbs.length === 0) return null;

  return (
    <Box
      sx={{
        mb: 2,
        px: 0,
      }}
    >
      <MuiBreadcrumbs
        separator={
          <NavigateNextIcon
            fontSize="small"
            sx={{
              color: "text.secondary",
              filter: (theme) =>
                theme.palette.mode === "dark"
                  ? "drop-shadow(0 1px 2px rgba(0, 0, 0, 0.8))"
                  : "drop-shadow(0 1px 2px rgba(255, 255, 255, 0.9))",
            }}
          />
        }
        aria-label="breadcrumb"
        sx={{ m: 0 }}
      >
        {breadcrumbs.map((item, index) => {
          if (item.isLast) {
            return (
              <Typography
                key={index}
                fontSize="0.9rem"
                fontWeight={700}
                sx={{
                  color: "text.primary",
                  filter: (theme) =>
                    theme.palette.mode === "dark"
                      ? "drop-shadow(0 2px 3px rgba(0, 0, 0, 0.9)) drop-shadow(0 0 6px rgba(0, 0, 0, 0.5))"
                      : "drop-shadow(0 2px 3px rgba(255, 255, 255, 1)) drop-shadow(0 0 6px rgba(255, 255, 255, 0.7))",
                }}
              >
                {item.label}
              </Typography>
            );
          }

          return (
            <Link
              key={index}
              component={RouterLink}
              to={item.path}
              underline="hover"
              fontSize="0.9rem"
              sx={{
                fontWeight: 600,
                color: "primary.main",
                filter: (theme) =>
                  theme.palette.mode === "dark"
                    ? "drop-shadow(0 1px 2px rgba(0, 0, 0, 0.8)) drop-shadow(0 0 4px rgba(0, 0, 0, 0.4))"
                    : "drop-shadow(0 1px 2px rgba(255, 255, 255, 0.95)) drop-shadow(0 0 4px rgba(255, 255, 255, 0.6))",
                "&:hover": {
                  textDecoration: "underline",
                  filter: (theme) =>
                    theme.palette.mode === "dark"
                      ? "drop-shadow(0 2px 3px rgba(0, 0, 0, 0.9)) drop-shadow(0 0 8px rgba(0, 0, 0, 0.6))"
                      : "drop-shadow(0 2px 3px rgba(255, 255, 255, 1)) drop-shadow(0 0 8px rgba(255, 255, 255, 0.8))",
                },
              }}
            >
              {item.label}
            </Link>
          );
        })}
      </MuiBreadcrumbs>
    </Box>
  );
};
