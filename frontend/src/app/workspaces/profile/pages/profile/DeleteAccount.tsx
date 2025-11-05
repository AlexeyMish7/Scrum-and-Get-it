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
import { supabase } from "../../app/shared/services/supabaseClient";
import crud from "../../app/shared/services/crud";
import { useAuth } from "../../app/shared/context/AuthContext";
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
      const { data, error: authError } = await supabase.auth.signInWithPassword(
        {
          email: user.email,
          password,
        }
      );

      if (authError || !data.session) {
        throw new Error("Incorrect password. Please try again.");
      }

      // Attempt to delete the user's profile row using the centralized CRUD helper.
      // The database should be configured so that deleting the profile cascades
      // and removes dependent rows (education, employment, documents, etc.).
      // If cascade constraints are not present, we fall back to explicit deletes
      // using the user-scoped CRUD helpers.
      const profileDel = await crud.deleteRow("profiles", {
        eq: { id: user.id },
      });

      if (profileDel.error) {
        // Fallback: remove user-scoped rows first, then remove profile
        const userCrud = crud.withUser(user.id);
        const tables = [
          "education",
          "employment",
          "skills",
          "projects",
          "certifications",
          "documents",
        ];

        for (const t of tables) {
          const res = await userCrud.deleteRow(t);
          if (res.error) {
            throw new Error(`Failed to delete ${t}: ${res.error.message}`);
          }
        }

        // Try deleting profile again
        const retry = await crud.deleteRow("profiles", { eq: { id: user.id } });
        if (retry.error) {
          throw new Error(`Failed to delete profile: ${retry.error.message}`);
        }
      }

      // Attempt to remove the underlying auth user record via server-side RPC.
      // We created a secure function `delete_user(uuid)` in a migration which
      // validates auth.uid() and deletes the auth.users row. Calling this RPC
      // requires that the function be granted EXECUTE to the authenticated role.
      // Pass the RPC parameter with the exact name used in the function (p_user_id)
      // Call stable wrapper RPC that accepts `user_id` as param name to avoid
      // any schema-cache / param-name mismatch issues from PostgREST.
      const { error: rpcErr } = await supabase.rpc("delete_user_userid", {
        user_id: user.id,
      });
      if (rpcErr) {
        // If the RPC failed, report and stop — don't sign out unexpectedly.
        throw new Error(`Failed to remove auth account: ${rpcErr.message}`);
      }

      // Sign the user out from the client and redirect to login.
      setSuccess(true);
      await signOut();
      navigate("/login", { replace: true });
    } catch (err) {
      console.error(err);
      const message = err instanceof Error ? err.message : String(err);
      setError(message || "Error verifying password.");
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
        You must confirm your password to delete your account. This will
        permanently delete your account.
      </Typography>

      <Button variant="contained" color="error" onClick={handleOpen}>
        Delete My Account
      </Button>

      <Dialog open={open} onClose={handleClose} fullWidth maxWidth="xs">
        <DialogTitle>Confirm Account Deletion</DialogTitle>
        <DialogContent>
          <Typography sx={{ mb: 2 }}>
            This will permanently delete your account and all associated data,
            including:
          </Typography>
          <Box component="ul" sx={{ mb: 2, pl: 2 }}>
            <Typography component="li">• Your profile information</Typography>
            <Typography component="li">• Education history</Typography>
            <Typography component="li">• Employment history</Typography>
            <Typography component="li">• Skills and certifications</Typography>
            <Typography component="li">• Projects and documents</Typography>
          </Box>
          <Typography sx={{ mb: 2 }} color="error">
            This action cannot be undone. Please enter your password to confirm.
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
              Account successfully deleted. You will be redirected to the login
              page.
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
