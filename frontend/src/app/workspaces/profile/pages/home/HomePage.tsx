import {
  Box,
  Button,
  Typography,
  Paper,
  Chip,
  IconButton,
} from "@mui/material";
import Brightness4Icon from "@mui/icons-material/Brightness4";
import Brightness7Icon from "@mui/icons-material/Brightness7";
import { useThemeContext } from "@shared/context/ThemeContext";
import { useNavigate } from "react-router-dom";
import logo from "@shared/assets/logos/logo-full.png";

const HomePage = () => {
  const navigate = useNavigate();

  const { mode, toggleMode } = useThemeContext();

  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: "background.default",
        color: "text.primary",
      }}
    >
      {/* 🔹 Top Blue Banner */}
      <Box
        sx={{
          width: "100%",
          backgroundColor: "primary.main",
          height: 72,
          display: "flex",
          justifyContent: "flex-end",
          alignItems: "center",
          px: 6,
          gap: 2,
          position: "fixed",
          top: 0,
          zIndex: 1000,
        }}
      >
        <Button
          variant="outlined"
          color="inherit"
          onClick={() => navigate("/register")}
        >
          Register
        </Button>
        <Button
          variant="outlined"
          color="inherit"
          onClick={() => navigate("/login")}
        >
          Sign In
        </Button>
        {/* Theme toggle */}
        <IconButton
          onClick={toggleMode}
          color="inherit"
          aria-label={
            mode === "dark" ? "Switch to light mode" : "Switch to dark mode"
          }
          sx={{ ml: 1 }}
        >
          {mode === "dark" ? <Brightness7Icon /> : <Brightness4Icon />}
        </IconButton>
      </Box>

      {/* 🔹 Push content down to clear fixed header */}
      <Box sx={{ pt: 12 }} />

      {/* 🔹 Center Hero Content Better */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          py: 6,
        }}
      >
        <Paper
          elevation={4}
          sx={{
            width: { xs: "92%", md: "78%" },
            p: 6,
            py: 8,
            borderRadius: 4,
            display: "flex",
            flexDirection: { xs: "column", md: "row" },
            alignItems: "center",
            gap: 6,
          }}
        >
          {/* ✅ Bigger Clean Logo Centered */}
          <Box
            component="img"
            src={logo}
            alt="Flow ATS Logo"
            sx={{
              width: { xs: "85%", md: "48%" },
              maxWidth: "580px",
              display: "block",
            }}
          />

          {/* ✅ Hero Text */}
          <Box sx={{ maxWidth: 520 }}>
            <Typography variant="h2" sx={{ fontWeight: 700, mb: 3 }}>
              WELCOME
            </Typography>

            <Typography variant="h6" sx={{ mb: 4, lineHeight: 1.6 }}>
              Take control of your career journey — organize your skills,
              education, projects, and employment history in one digital
              professional profile. Track progress and showcase your strengths!
            </Typography>

            <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
              What You Can Do:
            </Typography>

            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mb: 4 }}>
              <Chip label="Build Profile" color="primary" variant="outlined" />
              <Chip label="Track Strength" color="primary" variant="outlined" />
              <Chip
                label="Showcase Projects"
                color="primary"
                variant="outlined"
              />
              <Chip label="Certifications" color="primary" variant="outlined" />
            </Box>
          </Box>
        </Paper>
      </Box>

      {/* 🔹 Footer */}
      <Typography
        variant="body2"
        sx={{
          mb: 3,
          textAlign: "center",
          opacity: 0.6,
          fontSize: "0.9rem",
        }}
      >
        New here? Start by creating your account. Already with us? Sign in to
        continue your journey.
      </Typography>
    </Box>
  );
};

export default HomePage;
