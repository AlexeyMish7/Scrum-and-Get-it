import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "../../lib/supabaseClient";
import {
  Button,
  TextField,
  Card,
  CardContent,
  Typography,
  Alert,
  Link as MuiLink,
} from "@mui/material";

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
    <Card sx={{ maxWidth: 400, mx: "auto", mt: 8, p: 2 }}>
      <CardContent>
        <Typography variant="h5" gutterBottom>
          Reset Your Password
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
            {loading ? "Updating..." : "Reset Password"}
          </Button>
        </form>
      </CardContent>
      <CardContent>
        <Typography variant="body2" sx={{ mt: 1 }}>
          <MuiLink component={Link} to="/login">
            Back to sign in
          </MuiLink>
        </Typography>
      </CardContent>
    </Card>
  );
}
