import React from "react";
import { Container, Box } from "@mui/material";
import NavBar from "./Navbar";
import BreadcrumbsBar from "./BreadcrumbsBar";

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  return (
    <Box sx={{ backgroundColor: "background.default", minHeight: "100vh" }}>
      {/* ✅ Top navigation stays fixed at top of page layout */}
      <NavBar />
      <BreadcrumbsBar />

      {/* ✅ Page Content Container */}
      <Box
        sx={{
          flex: 1,
          width: "100%",
          display: "flex",
          justifyContent: "center",
          mt: { xs: 2, sm: 3, md: 4 },
        }}
      >
        <Container
          maxWidth="lg"
          sx={{
            p: { xs: 2, sm: 3, md: 4 },
            flexGrow: 1,
          }}
        >
          {children}
        </Container>
      </Box>
    </Box>
  );
};

export default MainLayout;
