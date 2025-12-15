import { useState } from "react";
import { useNavigate, Link as RouterLink } from "react-router-dom";
import { useAuth } from "@shared/context/AuthContext";
import PublicPageLayout from "@shared/layouts/PublicPageLayout";

import {
  Box,
  Button,
  TextField,
  Typography,
  useTheme,
  Divider,
  Link as MuiLink,
  Paper,
} from "@mui/material";
import { FcGoogle } from "react-icons/fc";
import LinkedInButton from "../../components/LinkedIn/LinkedInButton";
import logo from "@shared/assets/logos/logo-full.png";

const Login = () => {
  const navigate = useNavigate();
  const { signIn, signInWithOAuth } = useAuth();

  const [userEmail, setUserEmail] = useState("");
  const [userPassword, setUserPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loading, setLoading] = useState(false);

  const submitLogin = async (event: React.FormEvent) => {
    event.preventDefault();

    // Prevent double-submission while already processing login
    if (loading) {
      return;
    }

    setLoginError("");
    setLoading(true);

    const res = await signIn(userEmail, userPassword);

    if (!res.ok) {
      setLoading(false);
      // Check for rate limit error and provide helpful message
      const errorMessage =
        res.message ?? "Incorrect email or password. Please try again.";

      if (errorMessage.toLowerCase().includes("rate limit")) {
        setLoginError(
          "Too many login attempts. Please wait a minute and try again."
        );
      } else {
        setLoginError(errorMessage);
      }

      setUserPassword("");
      return;
    }

    // Success - navigate to profile (session is set in AuthContext)
    navigate("/profile");
  };

  const handleGoogle = async () => {
    // Prevent multiple OAuth attempts while one is in progress
    if (loading) {
      return;
    }

    setLoginError("");
    setLoading(true);
    const res = await signInWithOAuth("google");
    setLoading(false);
    if (!res.ok) setLoginError(res.message || "OAuth error");
    // On success, SDK will redirect to provider; nothing more to do here.
  };

  const theme = useTheme();

  // Match common OAuth button patterns (Google neutral, LinkedIn branded)
  const oauthButtonBaseSx = {
    position: "relative",
    justifyContent: "center",
    py: 1.25,
    textTransform: "none",
    fontWeight: 600,
    "& .MuiButton-startIcon": {
      position: "absolute" as const,
      left: 12,
      margin: 0,
    },
  };

  const googleButtonSx = {
    ...oauthButtonBaseSx,
    // Standard Google button styling (neutral)
    backgroundColor: "#ffffff",
    borderColor: "#dadce0",
    color: "#3c4043",
    "&:hover": {
      backgroundColor: "#f8f9fa",
      borderColor: "#dadce0",
    },
  };

  return (
    <PublicPageLayout
      centerContent
      containerMaxWidth="sm"
      topRight={
        <Button variant="outlined" onClick={() => navigate("/register")}>
          Create account
        </Button>
      }
    >
      <Paper
        elevation={4}
        sx={{
          maxWidth: 420,
          mx: "auto",
          p: 4,
          borderRadius: 3,
        }}
      >
        <Box
          component="img"
          src={logo}
          alt="FlowATS"
          sx={{
            height: 34,
            width: "auto",
            display: "block",
            mx: "auto",
            mb: 2,
          }}
        />

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
          fullWidth
          disabled={loading}
          sx={googleButtonSx}
          startIcon={<FcGoogle size={20} />}
        >
          Continue with Google
        </Button>

        <LinkedInButton
          sx={{ mt: 1, ...oauthButtonBaseSx }}
          label="Continue with LinkedIn"
        />

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
      </Paper>
    </PublicPageLayout>
  );
};

export default Login;
