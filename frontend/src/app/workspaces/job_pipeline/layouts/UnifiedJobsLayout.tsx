/**
 * UnifiedJobsLayout — Simplified 2-column layout for Jobs workspace
 *
 * Purpose: Main container with Pipeline (left) and Calendar (right).
 * No sidebar navigation - just the main pipeline kanban with integrated analytics.
 *
 * Contract:
 * - Inputs: None (single route - always shows pipeline)
 * - Outputs: 2-column grid: Pipeline (70%) | Calendar (30%)
 * - Layout: Pipeline board with job cards | Deadline calendar widget
 */

import { Outlet } from "react-router-dom";
import { Box, useMediaQuery, useTheme } from "@mui/material";
import AppShell from "@shared/layouts/AppShell";
import CalendarWidget from "../widgets/CalendarWidget/CalendarWidget";

export default function UnifiedJobsLayout() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  return (
    <AppShell>
      <Box
        sx={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "row",
          gap: 2,
          overflow: "hidden",
        }}
      >
        {/* Main Pipeline Area - LEFT SIDE (takes remaining space) */}
        <Box
          sx={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            height: "100%",
            overflow: "auto",
            bgcolor: "background.paper",
            borderRadius: { xs: 0, sm: 1, md: 2 },
            boxShadow: { xs: 0, sm: 1, md: 2 },
          }}
        >
          <Outlet />
        </Box>

        {/* Calendar Widget (Desktop only) - RIGHT SIDE (fixed width) */}
        {!isMobile && (
          <Box
            sx={{
              width: 320,
              flexShrink: 0,
              display: "flex",
              flexDirection: "column",
              height: "100%",
              overflow: "auto",
              bgcolor: "background.paper",
              borderRadius: 2,
              boxShadow: 2,
            }}
          >
            <CalendarWidget />
          </Box>
        )}
      </Box>
    </AppShell>
  );
}
