// React state + router imports
import { useState } from "react";
import { Link as RouterLink, useNavigate } from "react-router-dom";

// Supabase client instance (handles all database/auth requests)
import { supabase } from "@shared/services/supabaseClient";

// Custom authentication context for managing session + signup logic
import { useAuth } from "@shared/context/AuthContext";

// MUI imports for styling + theme integration
import {
  Alert,
  Box,
  Button,
  Checkbox,
  CircularProgress,
  FormControlLabel,
  Link as MuiLink,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { FcGoogle } from "react-icons/fc";
import LinkedInButton from "../../components/LinkedIn/LinkedInButton";

import PublicPageLayout from "@shared/layouts/PublicPageLayout";
import TermsOfService from "@shared/components/TermsOfService";
import PrivacyPolicy from "@shared/components/PrivacyPolicy";
import logo from "@shared/assets/logos/logo-full.png";

// Type for our registration form fields
type RegisterForm = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  agreedToTerms: boolean;
  agreedToPrivacy: boolean;
};

export default function Register() {
  // React Router hook for programmatic navigation
  const navigate = useNavigate();

  // Pull signup method from global Auth context (handles Supabase auth)
  const { signUpNewUser, signInWithOAuth } = useAuth();

  // Stores all input values for the registration form
  const [form, setForm] = useState<RegisterForm>({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    agreedToTerms: false,
    agreedToPrivacy: false,
  });

  // Error message displayed to the user (for validation or Supabase errors)
  const [error, setError] = useState<string>("");

  // Informational message (like "Check your email for confirmation")
  const [info, setInfo] = useState<string>("");

  // Loading flag to disable form and show progress while submitting
  const [loading, setLoading] = useState<boolean>(false);

  // Dialog state for Terms and Privacy
  const [termsOpen, setTermsOpen] = useState(false);
  const [privacyOpen, setPrivacyOpen] = useState(false);

  // Keep form state in sync with inputs
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError("");
    setInfo("");

    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // Validation that collects ALL errors instead of returning early
  const validate = (): string => {
    const errors: string[] = [];

    // Normalize email: trim spaces + lowercase
    const email = form.email.trim().toLowerCase();

    if (!form.firstName.trim()) errors.push("First name is required");
    if (!form.lastName.trim()) errors.push("Last name is required");

    // Email must look like "something@something.com"
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.push("Invalid email format");
    }

    // Password rules
    if (form.password.length < 8) errors.push("Password too short");
    if (!/[A-Z]/.test(form.password)) errors.push("Need uppercase letter");
    if (!/[a-z]/.test(form.password)) errors.push("Need lowercase letter");
    if (!/[0-9]/.test(form.password)) errors.push("Need a number");

    // Confirm password must match
    if (form.password !== form.confirmPassword)
      errors.push("Passwords do not match");

    // Terms and Privacy agreement
    if (!form.agreedToTerms) errors.push("You must agree to Terms of Service");
    if (!form.agreedToPrivacy) errors.push("You must agree to Privacy Policy");

    return errors.join("\n");
  };

  // Main submit handler: sign up via Supabase and branch on session presence
  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();

    // Prevent double-submission while already processing
    if (loading) {
      return;
    }

    // Reset any previous error/info messages
    setError("");
    setInfo("");

    const v = validate();
    if (v) {
      setError(v);
      return;
    }

    const email = form.email.trim().toLowerCase();
    const firstName = form.firstName.trim();
    const lastName = form.lastName.trim();

    setLoading(true);

    try {
      const res = await signUpNewUser({
        email,
        password: form.password,
        firstName,
        lastName,
      });

      if (!res.ok) {
        setError(res.message);
        return;
      }

      // If signup requires email confirmation, inform the user and exit
      if ("requiresConfirmation" in res && res.requiresConfirmation) {
        setInfo(
          "Check your email to confirm your account. You can sign in after confirming."
        );
        return;
      }

      // Session exists  fetch signed-in user
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData?.user?.id;

      if (userId) {
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
          { onConflict: "id" }
        );

        if (upsertError) {
          // If profile save fails, let user know but dont block account creation.
          setInfo("Account created; profile will complete later.");
        }
      }

      navigate("/profile");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unexpected error");
    } finally {
      setLoading(false);
    }
  };

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
        <Button variant="outlined" onClick={() => navigate("/login")}>
          Sign in
        </Button>
      }
    >
      <Paper
        elevation={4}
        sx={{
          p: 4,
          borderRadius: 3,
          maxWidth: 480,
          width: "100%",
          mx: "auto",
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

        <Typography variant="h4" mb={2} textAlign="center" fontWeight={800}>
          Create your account
        </Typography>

        <Typography
          variant="body2"
          sx={{ opacity: 0.8, mb: 3 }}
          textAlign="center"
        >
          Set up your profile and start tracking your applications.
        </Typography>

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
            disabled={loading}
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
            disabled={loading}
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
            disabled={loading}
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
            disabled={loading}
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
            disabled={loading}
          />

          <FormControlLabel
            control={
              <Checkbox
                name="agreedToTerms"
                checked={form.agreedToTerms}
                onChange={handleChange}
                disabled={loading}
              />
            }
            label={
              <Typography variant="body2">
                I agree to the{" "}
                <MuiLink
                  component="button"
                  variant="body2"
                  onClick={(ev) => {
                    ev.preventDefault();
                    setTermsOpen(true);
                  }}
                >
                  Terms of Service
                </MuiLink>
              </Typography>
            }
          />

          <FormControlLabel
            control={
              <Checkbox
                name="agreedToPrivacy"
                checked={form.agreedToPrivacy}
                onChange={handleChange}
                disabled={loading}
              />
            }
            label={
              <Typography variant="body2">
                I agree to the{" "}
                <MuiLink
                  component="button"
                  variant="body2"
                  onClick={(ev) => {
                    ev.preventDefault();
                    setPrivacyOpen(true);
                  }}
                >
                  Privacy Policy
                </MuiLink>
              </Typography>
            }
          />

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

          <Typography variant="body2" textAlign="center">
            Already have an account?{" "}
            <MuiLink
              component={RouterLink}
              to="/login"
              sx={{ textDecoration: "none", color: "primary.main" }}
            >
              Sign in
            </MuiLink>
          </Typography>
        </Stack>

        <Button
          onClick={async () => {
            if (loading) {
              return;
            }

            setError("");
            setInfo("");
            setLoading(true);
            const res = await signInWithOAuth("google");
            setLoading(false);
            if (!res.ok) setError(res.message || "OAuth error");
          }}
          variant="outlined"
          disabled={loading}
          sx={{ mt: 2, ...googleButtonSx }}
          fullWidth
          startIcon={<FcGoogle size={20} />}
        >
          Continue with Google
        </Button>

        <LinkedInButton
          sx={{ mt: 1, ...oauthButtonBaseSx }}
          label="Continue with LinkedIn"
        />

        {error && (
          <Alert sx={{ mt: 2, whiteSpace: "pre-line" }} severity="error">
            {error}
          </Alert>
        )}
        {info && (
          <Alert sx={{ mt: 2 }} severity="success">
            {info}
          </Alert>
        )}
      </Paper>

      <TermsOfService open={termsOpen} onClose={() => setTermsOpen(false)} />
      <PrivacyPolicy open={privacyOpen} onClose={() => setPrivacyOpen(false)} />
    </PublicPageLayout>
  );
}
