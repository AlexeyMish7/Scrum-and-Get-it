import { Box, Container } from "@mui/material";
import { Outlet } from "react-router-dom";
import { TopNav } from "@shared/components/TopNav";
import BreadcrumbsBar from "@profile/components/navigation/BreadcrumbsBar";

/**
 * AiLayout renders AI workspace pages under the shared TopNav.
 */
export default function AiLayout() {
  return (
    <Box sx={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <TopNav />
      <BreadcrumbsBar />
      <Box component="main" sx={{ flexGrow: 1, py: { xs: 2, md: 4 } }}>
        <Container maxWidth="xl">
          <Outlet />
        </Container>
      </Box>
    </Box>
  );
}
