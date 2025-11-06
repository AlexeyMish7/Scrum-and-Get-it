import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@shared/services/supabaseClient";
import { Box, Typography, AppBar, Toolbar, IconButton } from "@mui/material";
import LightModeIcon from "@mui/icons-material/LightMode";
import DarkModeIcon from "@mui/icons-material/DarkMode";
import { useThemeContext } from "@shared/context/ThemeContext";

const AuthCallback: React.FC = () => {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function handleCallback() {
      try {
        // Try to read session (supabase-js may process the URL automatically)
        const { data: sessData, error: sessErr } =
          await supabase.auth.getSession();
        if (sessErr) {
          console.error("getSession error:", sessErr);
          if (mounted) setError(sessErr.message ?? "OAuth callback failed");
          return;
        }

        if (sessData?.session) {
          navigate("/profile", { replace: true });
        } else {
          if (mounted)
            setError("No active session found after OAuth callback.");
        }
      } catch (e) {
        console.error(e);
        if (mounted) setError(e instanceof Error ? e.message : String(e));
      }
    }

    void handleCallback();

    return () => {
      mounted = false;
    };
  }, [navigate]);

  const { mode, toggleMode } = useThemeContext();

  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: "background.default",
        color: "text.primary",
      }}
    >
      <AppBar
        position="static"
        color="transparent"
        elevation={0}
        sx={{ mb: 2 }}
      >
        <Toolbar>
          <Box sx={{ flex: 1 }} />
          <IconButton
            onClick={toggleMode}
            aria-label="Toggle theme"
            color="inherit"
          >
            {mode === "dark" ? <LightModeIcon /> : <DarkModeIcon />}
          </IconButton>
        </Toolbar>
      </AppBar>

      <Box sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Completing sign in...
        </Typography>

        {error ? (
          <Box sx={{ color: "error.main" }}>
            <Typography variant="body2">Sign-in failed:</Typography>
            <pre>{error}</pre>
          </Box>
        ) : (
          <Typography>
            Please wait while we complete sign in and redirect you.
          </Typography>
        )}
      </Box>
    </Box>
  );
};

export default AuthCallback;
