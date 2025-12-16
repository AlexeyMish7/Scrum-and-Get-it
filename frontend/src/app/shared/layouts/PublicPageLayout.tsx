import { type PropsWithChildren, type ReactNode, useMemo } from "react";
import { Box, Container, type ContainerProps } from "@mui/material";
import { ThemeProvider } from "@mui/material/styles";
import GlobalTopBar from "@shared/layouts/GlobalTopBar";
import { composeTheme } from "@shared/theme";

type PublicPageLayoutProps = PropsWithChildren<{
  topRight?: ReactNode;
  containerMaxWidth?: ContainerProps["maxWidth"];
  centerContent?: boolean;
}>;

export default function PublicPageLayout({
  topRight,
  containerMaxWidth = "md",
  centerContent = false,
  children,
}: PublicPageLayoutProps) {
  // Public entry/auth pages are intentionally stable and consistent.
  // They always use the default color preset, the default design preset, and the default solid background.
  const publicTheme = useMemo(
    () =>
      composeTheme({
        mode: "light",
        colorPresetId: "default",
        designPresetId: "default",
        customAccentColor: null,
        reducedMotion: false,
      }),
    []
  );

  return (
    <ThemeProvider theme={publicTheme}>
      <Box
        sx={{
          minHeight: "100vh",
          bgcolor: "background.default",
          color: "text.primary",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <GlobalTopBar
          mode="public"
          rightSlot={topRight}
          showThemeToggle={false}
        />

        <Box
          component="main"
          sx={{
            flex: 1,
            display: "flex",
            alignItems: centerContent ? "center" : "flex-start",
            py: { xs: 4, md: 6 },
          }}
        >
          <Container maxWidth={containerMaxWidth}>{children}</Container>
        </Box>
      </Box>
    </ThemeProvider>
  );
}
