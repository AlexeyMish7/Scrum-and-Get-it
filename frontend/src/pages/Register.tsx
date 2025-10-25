/**
 * Register form
 * - Local state for user input
 * - Client-side validation
 * - Calls Supabase auth.signUp
 * - Handles both flows:
 *    A) Email confirmation required  -> show "check your email" notice
 *    B) Session returned immediately -> navigate and (optionally) create profile
 */

import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { useAuth } from "../context/AuthContext";

type RegisterForm = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
};

export default function Register() {
  const navigate = useNavigate();
  const { signUpNewUser } = useAuth();

  // Form and UI states
  const [form, setForm] = useState<RegisterForm>({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState<string>("");
  const [info, setInfo] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  // Keep form state in sync with inputs
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError("");
    setInfo("");
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // Minimal but useful client-side validation
  const validate = () => {
    const email = form.email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      return "Invalid email format";
    if (form.password.length < 8) return "Password too short";
    if (!/[A-Z]/.test(form.password)) return "Need uppercase letter";
    if (!/[a-z]/.test(form.password)) return "Need lowercase letter";
    if (!/[0-9]/.test(form.password)) return "Need a number";
    if (form.password !== form.confirmPassword) return "Passwords do not match";
    return "";
  };

  // Main submit handler: sign up via Supabase and branch on session presence
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
      // Use the central Auth provider helper so behavior is consistent across the app.
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

      // If email confirmation is required, tell the user and stop here.
      if ("requiresConfirmation" in res && res.requiresConfirmation) {
        setInfo(
          "Check your email to confirm your account. You can sign in after confirming."
        );
        return;
      }

      // Otherwise, a session should now exist. Get the signed-in user and upsert profile row.
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData?.user?.id;
      if (userId) {
        const { error: upsertError } = await supabase.from("profiles").upsert(
          [
            {
              id: userId,
              first_name: firstName || null,
              last_name: lastName || null,
              full_name: `${firstName} ${lastName}`.trim(),
              email,
            },
          ],
          { onConflict: "id" }
        );
        if (upsertError)
          setInfo("Account created; profile will complete later.");
      }

      navigate("/profile");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unexpected error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1>Register</h1>

      <form onSubmit={handleSubmit} noValidate>
        <label>
          First Name
          <input
            name="firstName"
            placeholder="First Name"
            autoComplete="given-name"
            onChange={handleChange}
            value={form.firstName}
            required
          />
        </label>
        <br />

        <label>
          Last Name
          <input
            name="lastName"
            placeholder="Last Name"
            autoComplete="family-name"
            onChange={handleChange}
            value={form.lastName}
            required
          />
        </label>
        <br />

        <label>
          Email
          <input
            name="email"
            type="email"
            placeholder="you@example.com"
            autoComplete="email"
            onChange={handleChange}
            value={form.email}
            required
          />
        </label>
        <br />

        <label>
          Password
          <input
            name="password"
            type="password"
            placeholder="Password"
            autoComplete="new-password"
            onChange={handleChange}
            value={form.password}
            required
          />
        </label>
        <br />

        <label>
          Confirm Password
          <input
            name="confirmPassword"
            type="password"
            placeholder="Confirm Password"
            autoComplete="new-password"
            onChange={handleChange}
            value={form.confirmPassword}
            required
          />
        </label>
        <br />

        <button type="submit" disabled={loading}>
          {loading ? "Creating..." : "Create Account"}
        </button>

        <p>
          Already have an account? <Link to="/Login">Sign in</Link>
        </p>
      </form>

      {error && <p style={{ color: "red" }}>{error}</p>}
      {info && <p style={{ color: "green" }}>{info}</p>}
    </div>
  );
}
