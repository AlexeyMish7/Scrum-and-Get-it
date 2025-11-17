import React from "react";
import { Box, Container } from "@mui/material";
import GlobalTopBar from "./GlobalTopBar.tsx";
import SystemLayer from "./SystemLayer.tsx";

type AppShellProps = {
  sidebar?: React.ReactNode;
  children?: React.ReactNode;
};

export default function AppShell({ sidebar, children }: AppShellProps) {
  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      <GlobalTopBar />
      <Box sx={{ display: "flex", flex: 1, overflow: "hidden" }}>
        {/* Sidebar slot - only render if sidebar provided */}
        {sidebar && (
          <Box
            component="nav"
            sx={{ width: { xs: 0, md: 280 }, flexShrink: 0, overflow: "auto" }}
          >
            {sidebar}
          </Box>
        )}

        {/* Main content area */}
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            py: { xs: 2, md: 4 },
            px: { xs: 2, md: 3 },
            overflow: "hidden",
          }}
        >
          {children}
        </Box>
      </Box>

      <SystemLayer />
    </Box>
  );
}
