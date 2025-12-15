import React from "react";
import { Box } from "@mui/material";
import { alpha } from "@mui/material/styles";
import GlobalTopBar from "./GlobalTopBar.tsx";
import SystemLayer from "./SystemLayer.tsx";
import { MockDataNotificationProvider } from "@shared/components/feedback/MockDataNotificationProvider";
import { ErrorNotificationProvider } from "@shared/components/feedback/ErrorNotificationProvider";
import GettingStartedModal from "@shared/components/GettingStartedModal";
import { useAuth } from "@shared/context/AuthContext";
import { useThemeContext } from "@shared/context/ThemeContext";

const NOISE_SVG = `
<svg xmlns='http://www.w3.org/2000/svg' width='240' height='240' viewBox='0 0 240 240'>
  <filter id='n'>
    <feTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='3' stitchTiles='stitch'/>
    <feColorMatrix type='saturate' values='0'/>
  </filter>
  <rect width='240' height='240' filter='url(#n)' opacity='0.8'/>
</svg>
`;
const NOISE_DATA_URL = `data:image/svg+xml,${encodeURIComponent(NOISE_SVG)}`;

type AppShellProps = {
  sidebar?: React.ReactNode;
  children?: React.ReactNode;
};

export default function AppShell({ sidebar, children }: AppShellProps) {
  const { user } = useAuth();
  const { backgroundStyle } = useThemeContext();
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
    return () =>
      window.removeEventListener(
        "open-getting-started",
        handler as EventListener
      );
  }, []);

  return (
    <>
      <Box
        sx={(theme) => {
          const baseBefore = {
            content: '""',
            position: "absolute",
            inset: 0,
            pointerEvents: "none",
            zIndex: 0,
          } as const;

          const commonBefore = {
            ...baseBefore,
            display: backgroundStyle === "plain" ? "none" : "block",
          };

          const noiseOpacity = theme.palette.mode === "dark" ? 0.12 : 0.08;
          const gridOpacity = theme.palette.mode === "dark" ? 0.22 : 0.16;

          const vignetteEdge =
            theme.palette.mode === "dark"
              ? alpha(theme.palette.common.black, 0.55)
              : alpha(theme.palette.common.black, 0.14);

          const beforeByStyle =
            backgroundStyle === "noise"
              ? {
                  ...commonBefore,
                  backgroundColor: alpha(theme.palette.primary.main, 0.05),
                  backgroundImage: `url("${NOISE_DATA_URL}")`,
                  backgroundRepeat: "repeat",
                  backgroundSize: "220px 220px",
                  opacity: noiseOpacity,
                  mixBlendMode:
                    theme.palette.mode === "dark" ? "screen" : "multiply",
                }
              : backgroundStyle === "vignette"
              ? {
                  ...commonBefore,
                  backgroundImage: `radial-gradient(1200px circle at 50% 10%, ${alpha(
                    theme.palette.primary.main,
                    theme.palette.mode === "dark" ? 0.14 : 0.12
                  )} 0%, transparent 55%), radial-gradient(circle at 50% 50%, transparent 35%, ${vignetteEdge} 100%)`,
                  opacity: 1,
                }
              : backgroundStyle === "grid"
              ? {
                  ...commonBefore,
                  backgroundImage: `linear-gradient(to right, ${alpha(
                    theme.palette.text.primary,
                    0.12
                  )} 1px, transparent 1px), linear-gradient(to bottom, ${alpha(
                    theme.palette.text.primary,
                    0.12
                  )} 1px, transparent 1px)`,
                  backgroundSize: "56px 56px",
                  opacity: gridOpacity,
                }
              : commonBefore;

          return {
            minHeight: "100vh",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            bgcolor: "background.default",
            position: "relative",
            zIndex: 0,
            "&::before": beforeByStyle,
            "& > *": {
              position: "relative",
              zIndex: 1,
            },
          };
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
