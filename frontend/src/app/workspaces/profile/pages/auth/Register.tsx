// React state + router imports
import { useState } from "react";
import { Link as RouterLink, useNavigate } from "react-router-dom";

// Supabase client instance (handles all database/auth requests)
import { supabase } from "@shared/services/supabaseClient";

// Custom authentication context for managing session + signup logic
import { useAuth } from "@shared/context/AuthContext";

// MUI imports for styling + theme integration
import {
  Box,
  TextField,
  Button,
  Typography,
  Paper,
  Stack,
  Alert,
  CircularProgress,
  AppBar,
  Toolbar,
  IconButton,
  Link as MuiLink,
} from "@mui/material";
import LightModeIcon from "@mui/icons-material/LightMode";
import DarkModeIcon from "@mui/icons-material/DarkMode";
import { useThemeContext } from "@shared/context/ThemeContext";
// Uses global ThemeContext; no local ThemeProvider/CssBaseline here.

// Type for our registration form fields
type RegisterForm = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
};

export default function Register() {
  // React Router hook for programmatic navigation
  const navigate = useNavigate();

  // Pull signup method from global Auth context (handles Supabase auth)
  const { signUpNewUser, signInWithOAuth } = useAuth();

  // --- UI + Form state ---
  // Stores all input values for the registration form
  const [form, setForm] = useState<RegisterForm>({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  // Error message displayed to the user (for validation or Supabase errors)
  const [error, setError] = useState<string>("");

  // Informational message (like “Check your email for confirmation”)
  const [info, setInfo] = useState<string>("");

  // Loading flag to disable form and show progress while submitting
  const [loading, setLoading] = useState<boolean>(false);

  // Keep form state in sync with inputs
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError("");
    setInfo("");
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const { mode, toggleMode } = useThemeContext();

  // Validation that collects ALL errors instead of returning early
  const validate = (): string => {
    const errors: string[] = []; // store all error messages here

    // Normalize email: trim spaces + lowercase
    const email = form.email.trim().toLowerCase();

    // Email must look like "something@something.com"
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      errors.push("Invalid email format");

    // Password rules
    if (form.password.length < 8) errors.push("Password too short");
    if (!/[A-Z]/.test(form.password)) errors.push("Need uppercase letter");
    if (!/[a-z]/.test(form.password)) errors.push("Need lowercase letter");
    if (!/[0-9]/.test(form.password)) errors.push("Need a number");

    // Confirm password must match
    if (form.password !== form.confirmPassword)
      errors.push("Passwords do not match");

    // Join errors with commas (or newline) if any exist
    return errors.join(", ");
  };

  // Main submit handler: sign up via Supabase and branch on session presence
  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault(); // Stop default page reload on form submit

    // Reset any previous error/info messages
    setError("");
    setInfo("");

    // Run validation checks
    const v = validate();
    if (v) {
      setError(v); // Show validation error to user
      return; // Stop submission process
    }

    // Normalize inputs for consistency
    const email = form.email.trim().toLowerCase(); // clean + lowercase email
    const firstName = form.firstName.trim(); // remove extra spaces
    const lastName = form.lastName.trim(); // remove extra spaces

    setLoading(true); // show loading state (e.g., disable button/spinner)
    try {
      // Delegate signup to the shared Auth helper for consistency
      const res = await signUpNewUser({
        email,
        password: form.password,
        firstName,
        lastName,
      });

      if (!res.ok) {
        setError(res.message); // show error to user
        setLoading(false); //reset loading if failed
        return; // stop execution
      }

      // If signup requires email confirmation, inform the user and exit
      if ("requiresConfirmation" in res && res.requiresConfirmation) {
        setInfo(
          "Check your email to confirm your account. You can sign in after confirming."
        );
        return; // stop flow here until email is confirmed
      }

      // Session exists → fetch signed-in user
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData?.user?.id;

      if (userId) {
        // Insert or update profile row linked to auth.users.id
        const { error: upsertError } = await supabase.from("profiles").upsert(
          [
            {
              id: userId,
              first_name: firstName || null,
              last_name: lastName || null,
              full_name: `${firstName ?? ""} ${lastName ?? ""}`.trim(),
              email,
            },
          ],
          { onConflict: "id" } // ensures unique per user
        );

        if (upsertError) {
          // If profile save fails, let user know but don’t block account creation
          setInfo("Account created; profile will complete later.");
        }
      }

      navigate("/profile"); // redirect user after successful signup
    } catch (err) {
      // Show error message (fallback if err isn't a standard Error)
      setError(err instanceof Error ? err.message : "Unexpected error");
    } finally {
      // Always reset loading so UI recovers
      setLoading(false);
    }
  };

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

      <Paper
        elevation={4}
        sx={{
          p: 4,
          borderRadius: 3,
          maxWidth: 450,
          width: "100%",
          textAlign: "center",
          mx: "auto",
        }}
      >
        <Typography variant="h3" mb={3}>
          Register
        </Typography>

        {/* Registration form with controlled inputs */}
        <Stack spacing={2} component="form" onSubmit={handleSubmit} noValidate>
          <TextField
            label="First Name"
            name="firstName"
            type="text"
            autoComplete="given-name"
            onChange={handleChange}
            value={form.firstName}
            required
            fullWidth
          />

          <TextField
            label="Last Name"
            name="lastName"
            type="text"
            autoComplete="family-name"
            onChange={handleChange}
            value={form.lastName}
            required
            fullWidth
          />

          <TextField
            label="Email"
            name="email"
            type="email"
            autoComplete="email"
            onChange={handleChange}
            value={form.email}
            required
            fullWidth
          />

          <TextField
            label="Password"
            name="password"
            type="password"
            autoComplete="new-password"
            onChange={handleChange}
            value={form.password}
            required
            fullWidth
          />

          <TextField
            label="Confirm Password"
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            onChange={handleChange}
            value={form.confirmPassword}
            required
            fullWidth
          />

          {/* Disable submit button while loading */}
          <Button
            type="submit"
            variant="contained"
            disabled={loading}
            sx={{ mt: 1 }}
          >
            {loading ? (
              <CircularProgress size={22} color="inherit" />
            ) : (
              "Create Account"
            )}
          </Button>

          {/* Link to login for existing users */}
          <Typography variant="body2">
            Already have an account?{" "}
            <MuiLink
              component={RouterLink}
              to="/Login"
              sx={{ textDecoration: "none", color: "primary.main" }}
            >
              Sign in
            </MuiLink>
          </Typography>
        </Stack>

        <Button
          onClick={async () => {
            setError("");
            setInfo("");
            setLoading(true);
            const res = await signInWithOAuth("google");
            setLoading(false);
            if (!res.ok) setError(res.message || "OAuth error");
          }}
          variant="outlined"
          disabled={loading}
          sx={{ mt: 2 }}
          fullWidth
        >
          Sign in with Google
        </Button>

        {/* Show messages if present */}
        {error && (
          <Alert sx={{ mt: 2 }} severity="error">
            {error}
          </Alert>
        )}
        {info && (
          <Alert sx={{ mt: 2 }} severity="success">
            {info}
          </Alert>
        )}
      </Paper>
    </Box>
  );
}
