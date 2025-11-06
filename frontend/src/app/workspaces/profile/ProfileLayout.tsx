import { Box, Container } from "@mui/material";
import { Outlet } from "react-router-dom";
import { TopNav } from "@shared/components/TopNav";
import BreadcrumbsBar from "@shared/components/TopNav/BreadcrumbsBar";

interface ProfileLayoutProps {
  children?: React.ReactNode;
}

/**
 * ProfileLayout — workspace layout for profile pages.
 * Keeps the same visual structure as AiLayout/JobsLayout but accepts
 * children (so it can be used where the router wraps elements) and
 * falls back to <Outlet /> for nested route usage.
 */
export default function ProfileLayout({ children }: ProfileLayoutProps) {
  return (
    <Box sx={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <TopNav />
      <BreadcrumbsBar />
      <Box component="main" sx={{ flexGrow: 1, py: { xs: 2, md: 4 } }}>
        <Container maxWidth="xl">{children ?? <Outlet />}</Container>
      </Box>
    </Box>
  );
}
