import { useState } from "react";
import { supabase } from "@shared/services/supabaseClient";
import {
  Button,
  TextField,
  Paper,
  Typography,
  Link as MuiLink,
  Box,
} from "@mui/material";
import { Link } from "react-router-dom";
import PublicPageLayout from "@shared/layouts/PublicPageLayout";
import logo from "@shared/assets/logos/logo-full.png";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const isValidEmail = (value: string) => /\S+@\S+\.\S+/.test(value);

  const handleResetRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");

    if (!isValidEmail(email)) {
      setMessage("Please enter a valid email address.");
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      // Intentionally show generic message to avoid account enumeration
      setMessage(
        "If that email is registered, you'll receive a reset link shortly."
      );

      if (error) {
        // Log detailed error in dev console only
        console.error("resetPasswordForEmail error:", error);
      }
    } finally {
      setLoading(false);
    }
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
          Reset your password
        </Typography>
        <Typography variant="body2" sx={{ opacity: 0.8, mb: 2 }}>
          Enter your email and we'll send you a reset link.
        </Typography>

        <form onSubmit={handleResetRequest} aria-live="polite">
          <TextField
            fullWidth
            label="Email"
            type="email"
            placeholder="you@example.com"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            sx={{ mb: 2 }}
            disabled={loading}
          />

          <Button
            type="submit"
            variant="contained"
            color="primary"
            disabled={loading}
            fullWidth
          >
            {loading ? "Sending..." : "Send reset link"}
          </Button>
        </form>

        {message && (
          <Typography
            variant="body2"
            sx={{ mt: 2, color: "success.main" }}
            role="status"
            aria-live="polite"
          >
            {message}
          </Typography>
        )}

        <Typography variant="body2" sx={{ mt: 2 }}>
          <MuiLink component={Link} to="/login">
            Back to sign in
          </MuiLink>
        </Typography>
      </Paper>
    </PublicPageLayout>
  );
}
