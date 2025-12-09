import React from "react";
import { Box } from "@mui/material";
import GlobalTopBar from "./GlobalTopBar.tsx";
import SystemLayer from "./SystemLayer.tsx";
import { MockDataNotificationProvider } from "@shared/components/feedback/MockDataNotificationProvider";
import { ErrorNotificationProvider } from "@shared/components/feedback/ErrorNotificationProvider";
import {
  BackgroundGradientAnimation,
  FlickeringGrid,
} from "@shared/components/backgrounds";
import { useThemeContext } from "@shared/context/ThemeContext";
import GettingStartedModal from "@shared/components/GettingStartedModal";
import { useAuth } from "@shared/context/AuthContext";

type AppShellProps = {
  sidebar?: React.ReactNode;
  children?: React.ReactNode;
};

export default function AppShell({ sidebar, children }: AppShellProps) {
  const { backgroundMode } = useThemeContext();
  const { user } = useAuth();
  const [showGettingStarted, setShowGettingStarted] = React.useState(false);

  React.useEffect(() => {
    if (!user) return;
    try {
      const seen = localStorage.getItem("sgt:seen_getting_started");
      if (!seen) setShowGettingStarted(true);
    } catch {}
  }, [user]);

  // Listen for a global request to open the Getting Started modal
  React.useEffect(() => {
    const handler = (_e?: Event) => setShowGettingStarted(true);
    window.addEventListener("open-getting-started", handler as EventListener);
    return () => window.removeEventListener("open-getting-started", handler as EventListener);
  }, []);

  // Check if we're using an animated background (gradient or flickering)
  const hasAnimatedBackground =
    backgroundMode === "gradient" || backgroundMode === "flickering";

  return (
    <>
      {/* Animated gradient background - rendered when backgroundMode is 'gradient' */}
      {backgroundMode === "gradient" && <BackgroundGradientAnimation />}

      {/* Flickering grid background - rendered when backgroundMode is 'flickering' */}
      {backgroundMode === "flickering" && <FlickeringGrid />}

      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          // When using animated background, make content background transparent
          bgcolor: hasAnimatedBackground ? "transparent" : "background.default",
          position: "relative",
          zIndex: 1,
        }}
      >
        <GlobalTopBar />
        <Box sx={{ display: "flex", flex: 1, overflow: "hidden" }}>
          {/*
           * Sidebar slot - only render container if sidebar provided
           * Note: For animated sidebars, the width is controlled by the sidebar itself
           * via Framer Motion. We just need to let it flex without fixed width.
           */}
          {sidebar && (
            <Box
              sx={{
                // On mobile (xs-sm), animated sidebar handles its own positioning
                // On desktop (md+), let sidebar control its own width
                display: { xs: "block", md: "flex" },
                flexShrink: 0,
                overflow: "visible",
              }}
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
              // Add padding on left for mobile hamburger button
              pl: { xs: 7, md: 3 },
              overflow: "auto",
            }}
          >
            {children}
          </Box>
        </Box>
        <GettingStartedModal
          open={showGettingStarted}
          onClose={() => setShowGettingStarted(false)}
        />

        <SystemLayer />
        <MockDataNotificationProvider />
        <ErrorNotificationProvider />
      </Box>
    </>
  );
}
