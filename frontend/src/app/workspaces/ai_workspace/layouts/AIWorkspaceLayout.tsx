/**
 * AIWorkspaceLayout - Centralized Layout
 *
 * New centralized layout for AI workspace without sidebar.
 * Uses horizontal navigation tabs and AppShell for consistent structure.
 */

import { Outlet } from "react-router-dom";
import AppShell from "@shared/layouts/AppShell";
import AINavBar from "../navigation/AINavBar";
import { Box } from "@mui/material";

/**
 * AIWorkspaceLayout Component
 *
 * Renders the AI workspace with:
 * - Global top bar (from AppShell)
 * - Horizontal navigation tabs
 * - Main content area (Outlet)
 * - No sidebar (unlike old design)
 */
export default function AIWorkspaceLayout() {
  return (
    <AppShell sidebar={null}>
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          height: "100%",
          overflow: "hidden",
        }}
      >
        {/* Horizontal navigation */}
        <AINavBar />

        {/* Main content area */}
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            overflow: "auto",
            backgroundColor: "background.default",
          }}
        >
          <Outlet />
        </Box>
      </Box>
    </AppShell>
  );
}
