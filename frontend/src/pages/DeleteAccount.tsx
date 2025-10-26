import React, { useState } from "react";
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  TextField,
  Alert,
  CircularProgress,
} from "@mui/material";
import { supabase } from "../supabaseClient";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";



const DeleteAccount: React.FC = () => {
  const { user, signOut } = useAuth(); // user.email, user.id available
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const handleOpen = () => setOpen(true);
  const handleClose = () => {
    setOpen(false);
    setPassword("");
    setError("");
    setSuccess(false);
  };

  const handleVerifyAndSignOut = async () => {
    if (!user?.email) {
      setError("User not logged in.");
      return;
    }
    if (!password) {
      setError("Please enter your password.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password,
      });

      if (authError || !data.session) {
        throw new Error("Incorrect password. Please try again.");
      }
      //ADD SUPABASE DELETE STUFF HERE 


      //
      await signOut();

      setSuccess(true);
      navigate("/login", { replace: true });
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Error verifying password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ mt: 6 }}>
      <Typography variant="h6" color="error" gutterBottom>
        Delete Account
      </Typography>
      <Typography variant="body2" sx={{ mb: 2 }}>
        You must confirm your password to delete your account. For now, this will only
        verify your password and sign you out.
      </Typography>

      <Button variant="contained" color="error" onClick={handleOpen}>
        Delete My Account
      </Button>

      <Dialog open={open} onClose={handleClose} fullWidth maxWidth="xs">
        <DialogTitle>Confirm Account Deletion</DialogTitle>
        <DialogContent>
          <Typography sx={{ mb: 2 }}>
            Please confirm your password. If correct, you’ll be signed out.
          </Typography>

          <TextField
            label="Password"
            type="password"
            fullWidth
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          )}
          {success && (
            <Alert severity="success" sx={{ mt: 2 }}>
              Password verified. Signing out...
            </Alert>
          )}
        </DialogContent>

        <DialogActions>
          <Button onClick={handleClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            color="error"
            variant="contained"
            disabled={loading}
            onClick={handleVerifyAndSignOut}
          >
            {loading ? (
              <CircularProgress size={20} color="inherit" />
            ) : (
              "Confirm"
            )}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default DeleteAccount;
