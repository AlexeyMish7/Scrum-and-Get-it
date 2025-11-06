import { Box, Container } from "@mui/material";
import { Outlet } from "react-router-dom";
import { TopNav } from "@shared/components/TopNav";
import BreadcrumbsBar from "@shared/components/TopNav/BreadcrumbsBar";

export default function JobsLayout() {
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
