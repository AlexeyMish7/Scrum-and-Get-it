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
    <Box sx={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <GlobalTopBar />
      <Box sx={{ display: "flex", flex: 1 }}>
        {/* Sidebar slot */}
        <Box component="nav" sx={{ width: { xs: 0, md: 280 }, flexShrink: 0 }}>
          {sidebar}
        </Box>

        {/* Main content area */}
        <Box component="main" sx={{ flexGrow: 1, py: { xs: 2, md: 4 } }}>
          <Container maxWidth="xl">{children}</Container>
        </Box>
      </Box>

      <SystemLayer />
    </Box>
  );
}
