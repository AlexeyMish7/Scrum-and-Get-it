import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import {
  Button,
  Input,
  Card,
  CardContent,
  Typography,
  Alert,
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
    if (!hash.includes("type=recovery")) {
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
    const { data, error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      setError("Reset link expired or invalid. Please request again.");
      console.error(error);
    } else {
      setMessage("Password reset successful! Redirecting to dashboard...");
      // Supabase automatically signs the user in after password reset
      setTimeout(() => navigate("/register"), 2000);
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
          <Input
            fullWidth
            type="password"
            placeholder="New Password"
            required
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            sx={{ mb: 2 }}
          />
          <Input
            fullWidth
            type="password"
            placeholder="Confirm New Password"
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
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
    </Card>
  );
}
