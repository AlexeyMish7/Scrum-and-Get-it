import { useState } from "react";
import { supabase } from "../../app/shared/services/supabaseClient";
import {
  Button,
  TextField,
  Card,
  CardContent,
  Typography,
  Link as MuiLink,
} from "@mui/material";
import { Link } from "react-router-dom";

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
    <Card sx={{ maxWidth: 400, mx: "auto", mt: 8, p: 2 }}>
      <CardContent>
        <Typography variant="h5" gutterBottom>
          Forgot Password
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
            {loading ? "Sending..." : "Send Reset Link"}
          </Button>
        </form>

        {message && (
          <Typography
            variant="body2"
            sx={{ mt: 2, color: "green" }}
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
      </CardContent>
    </Card>
  );
}
