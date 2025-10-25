import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Login = () => {
  const navigate = useNavigate();
  const { signIn, signInWithOAuth } = useAuth();

  const [userEmail, setUserEmail] = useState("");
  const [userPassword, setUserPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loading, setLoading] = useState(false);

  const submitLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoginError("");
    setLoading(true);

    const res = await signIn(userEmail, userPassword);
    setLoading(false);

    // Log the raw response for easier debugging in dev
    // eslint-disable-next-line no-console
    console.log("signIn result:", res);

    if (!res.ok) {
      // Show server-provided message when available (more informative)
      setLoginError(
        res.message ?? "Incorrect email or password. Please try again."
      );
      setUserPassword("");
      return;
    }

    navigate("/profile");
  };

  const handleGoogle = async () => {
    setLoginError("");
    setLoading(true);
    const res = await signInWithOAuth("google");
    setLoading(false);
    if (!res.ok) setLoginError(res.message || "OAuth error");
    // On success, SDK will redirect to provider; nothing more to do here.
  };

  return (
    <div className="login-wrapper">
      <h1>Sign In</h1>
      <form onSubmit={submitLogin} aria-live="polite">
        <input
          type="email"
          placeholder="Email"
          value={userEmail}
          onChange={(e) => setUserEmail(e.target.value)}
          required
          disabled={loading}
        />

        <input
          type="password"
          placeholder="Password"
          value={userPassword}
          onChange={(e) => setUserPassword(e.target.value)}
          required
          disabled={loading}
        />

        {loginError && (
          <p role="alert" style={{ color: "red" }}>
            {loginError}
          </p>
        )}

        <button type="submit" disabled={loading}>
          {loading ? "Signing in..." : "Log In"}
        </button>
      </form>

      <div style={{ marginTop: 12 }}>
        <button onClick={handleGoogle} disabled={loading}>
          Sign in with Google
        </button>
        <p style={{ marginTop: 8 }}>
          <Link to="/forgot-password">Forgot password?</Link>
        </p>

        <p style={{ marginTop: 8 }}>
          Don't have an account? <Link to="/register">Register</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
