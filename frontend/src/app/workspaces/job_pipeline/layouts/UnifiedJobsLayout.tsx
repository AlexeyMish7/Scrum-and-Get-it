/**
 * UnifiedJobsLayout — Simplified 2-column layout for Jobs workspace
 *
 * Purpose: Main container with Pipeline (left) and Calendar (right).
 * Includes navigation tabs for Pipeline, Analytics, Documents, and Profile views.
 *
 * Contract:
 * - Inputs: None (routes defined in router)
 * - Outputs: 2-column grid: Main content (70%) | Calendar (30%)
 * - Layout: Content with navigation | Deadline calendar widget
 */

import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { Box, useMediaQuery, useTheme, Tabs, Tab, Paper } from "@mui/material";
import {
  ViewKanban as PipelineIcon,
  Analytics as AnalyticsIcon,
} from "@mui/icons-material";
import AppShell from "@shared/layouts/AppShell";
import CalendarWidget from "../widgets/CalendarWidget/CalendarWidget";

export default function UnifiedJobsLayout() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const navigate = useNavigate();
  const location = useLocation();

  // Determine active tab based on current path
  const currentTab = location.pathname.split("/")[2] || "pipeline";

  const handleTabChange = (_event: React.SyntheticEvent, newValue: string) => {
    if (newValue === "pipeline") {
      navigate("/jobs");
    } else {
      navigate(`/jobs/${newValue}`);
    }
  };

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
        {/* Main Content Area - LEFT SIDE (takes remaining space) */}
        <Box
          sx={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            height: "100%",
            overflow: "hidden",
          }}
        >
          {/* Navigation Tabs */}
          <Paper
            sx={{
              borderRadius: { xs: 0, sm: 1, md: 2 },
              boxShadow: { xs: 0, sm: 1, md: 2 },
              mb: 2,
            }}
          >
            <Tabs
              value={currentTab}
              onChange={handleTabChange}
              variant="fullWidth"
              sx={{ borderBottom: 1, borderColor: "divider" }}
            >
              <Tab
                icon={<PipelineIcon />}
                iconPosition="start"
                label="Pipeline"
                value="pipeline"
              />
              <Tab
                icon={<AnalyticsIcon />}
                iconPosition="start"
                label="Analytics"
                value="analytics"
              />
            </Tabs>
          </Paper>

          {/* Main View Content */}
          <Box
            sx={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              overflow: "auto",
              bgcolor: "background.paper",
              borderRadius: { xs: 0, sm: 1, md: 2 },
              boxShadow: { xs: 0, sm: 1, md: 2 },
            }}
          >
            <Outlet />
          </Box>
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
