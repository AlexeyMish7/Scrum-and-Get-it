import { useState } from "react";
import { supabase } from "../supabaseClient"; // need to Adjust import path
import { Button, Input, Card, CardContent, Typography } from "@mui/material"; 

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleResetRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`, // redirect page
    });

    if (error) {
      console.error(error);
      setMessage("If that email is registered, you'll receive a reset link shortly.");
    } else {
      setMessage("If that email is registered, you'll receive a reset link shortly.");
    }

    setLoading(false);
  };

  return (
    <Card sx={{ maxWidth: 400, mx: "auto", mt: 8, p: 2 }}>
      <CardContent>
        <Typography variant="h5" gutterBottom>
          Forgot Password
        </Typography>
        <form onSubmit={handleResetRequest}>
          <Input
            fullWidth
            type="email"
            placeholder="Enter your email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            sx={{ mb: 2 }}
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
          <Typography variant="body2" sx={{ mt: 2, color: "green" }}>
            {message}
          </Typography>
        )}
      </CardContent>
    </Card>
  );
}
