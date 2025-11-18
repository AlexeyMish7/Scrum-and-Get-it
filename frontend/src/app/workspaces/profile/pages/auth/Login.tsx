import { useState } from "react";
import { useNavigate, Link as RouterLink } from "react-router-dom";
import { useAuth } from "@shared/context/AuthContext";
import { useThemeContext } from "@shared/context/ThemeContext";

import {
  Box,
  Button,
  TextField,
  Typography,
  useTheme,
  Divider,
  AppBar,
  Toolbar,
  IconButton,
  Link as MuiLink,
} from "@mui/material";
import LightModeIcon from "@mui/icons-material/LightMode";
import DarkModeIcon from "@mui/icons-material/DarkMode";

const Login = () => {
  const navigate = useNavigate();
  const { signIn, signInWithOAuth } = useAuth();

  const [userEmail, setUserEmail] = useState("");
  const [userPassword, setUserPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loading, setLoading] = useState(false);

  const submitLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoginError("");
    setLoading(true);

    const res = await signIn(userEmail, userPassword);
    setLoading(false);

    // Dev-only debug: keep console noise out of production
    if (import.meta.env.MODE === "development") {
      console.debug("signIn result:", res);
    }

    if (!res.ok) {
      // Show server-provided message when available (more informative)
      setLoginError(
        res.message ?? "Incorrect email or password. Please try again."
      );
      setUserPassword("");
      return;
    }

    // Navigate to profile - session is already set in AuthContext
    navigate("/profile");
  };

  const handleGoogle = async () => {
    setLoginError("");
    setLoading(true);
    const res = await signInWithOAuth("google");
    setLoading(false);
    if (!res.ok) setLoginError(res.message || "OAuth error");
    // On success, SDK will redirect to provider; nothing more to do here.
  };

  const theme = useTheme();
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

      <Box
        sx={{
          maxWidth: 400,
          mx: "auto",
          mt: 4,
          p: 4,
          borderRadius: 3,
          boxShadow: 2,
          bgcolor: "background.paper",
        }}
      >
        <Typography
          variant="h5"
          textAlign="center"
          fontWeight="bold"
          mb={3}
          color={theme.palette.text.primary}
        >
          Sign In
        </Typography>

        <Box component="form" onSubmit={submitLogin} aria-live="polite">
          <TextField
            type="email"
            label="Email"
            fullWidth
            margin="normal"
            value={userEmail}
            onChange={(e) => setUserEmail(e.target.value)}
            required
            disabled={loading}
          />

          <TextField
            type="password"
            label="Password"
            fullWidth
            margin="normal"
            value={userPassword}
            onChange={(e) => setUserPassword(e.target.value)}
            required
            disabled={loading}
          />

          {loginError && (
            <Typography
              role="alert"
              variant="body2"
              color="error"
              textAlign="center"
              mt={1}
            >
              {loginError}
            </Typography>
          )}

          <Button
            type="submit"
            variant="contained"
            color="primary"
            fullWidth
            disabled={loading}
            sx={{ mt: 3 }}
          >
            {loading ? "Signing in..." : "Log In"}
          </Button>
        </Box>

        <Divider sx={{ my: 3 }}>OR</Divider>

        <Button
          onClick={handleGoogle}
          variant="outlined"
          color="secondary"
          fullWidth
        >
          Sign in with Google
        </Button>

        <Box textAlign="center" mt={2}>
          <Typography variant="body2">
            <MuiLink
              component={RouterLink}
              to="/forgot-password"
              sx={{
                color: "primary.main",
                textDecoration: "none",
                fontWeight: 500,
              }}
            >
              Forgot password?
            </MuiLink>
          </Typography>

          <Typography variant="body2" mt={1}>
            Don’t have an account?{" "}
            <MuiLink
              component={RouterLink}
              to="/register"
              sx={{
                color: "primary.main",
                textDecoration: "none",
                fontWeight: 500,
              }}
            >
              Register
            </MuiLink>
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};

export default Login;
