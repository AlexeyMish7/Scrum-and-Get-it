import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@shared/services/supabaseClient";
import {
  Button,
  TextField,
  Paper,
  Typography,
  Alert,
  Link as MuiLink,
  Box,
} from "@mui/material";
import PublicPageLayout from "@shared/layouts/PublicPageLayout";
import logo from "@shared/assets/logos/logo-full.png";

export default function ResetPassword() {
  const navigate = useNavigate();

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // When the user clicks the link in email, Supabase automatically sets the session in URL
    const hash = window.location.hash;
    // Check for either a recovery type or tokens in the fragment
    if (!hash.includes("type=recovery") && !hash.includes("access_token")) {
      setError("Invalid or expired password reset link.");
    }
  }, []);

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");
    setError("");

    // Validate new passwords
    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    // Supabase handles validation of the recovery token internally
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      setError("Reset link expired or invalid. Please request again.");
      console.error("updateUser error:", error);
    } else {
      setMessage("Password reset successful! Redirecting to sign in...");
      // Give user a short moment to read the message, then send to login
      setTimeout(() => navigate("/login"), 2000);
    }

    setLoading(false);
  };

  return (
    <PublicPageLayout centerContent containerMaxWidth="sm">
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

        <Typography variant="h5" fontWeight={800} gutterBottom>
          Choose a new password
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        {message && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {message}
          </Alert>
        )}

        <form onSubmit={handlePasswordReset}>
          <TextField
            fullWidth
            label="New Password"
            type="password"
            required
            value={newPassword}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setNewPassword(e.target.value)
            }
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            label="Confirm New Password"
            type="password"
            required
            value={confirmPassword}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setConfirmPassword(e.target.value)
            }
            sx={{ mb: 2 }}
          />
          <Button
            type="submit"
            variant="contained"
            color="primary"
            disabled={loading}
            fullWidth
          >
            {loading ? "Updating..." : "Reset password"}
          </Button>
        </form>

        <Typography variant="body2" sx={{ mt: 2 }}>
          <MuiLink component={Link} to="/login">
            Back to sign in
          </MuiLink>
        </Typography>
      </Paper>
    </PublicPageLayout>
  );
}
