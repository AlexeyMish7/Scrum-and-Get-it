import { useState } from "react";
import { supabase } from "../supabaseClient";

const Login = () => {
  const [userEmail, setUserEmail] = useState("");
  const [userPassword, setUserPassword] = useState("");
  const [loginError, setLoginError] = useState("");

  const submitLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoginError("");

    const { error } = await supabase.auth.signInWithPassword({
      email: userEmail,
      password: userPassword,
    });

    if (error) {
      setLoginError("Incorrect login. Please try again.");
      setUserPassword("");
      return;
    }

    window.location.href = "/profile";
  };

  return (
    <div className="login-wrapper">
      <h1>Sign In</h1>
      <form onSubmit={submitLogin}>
        <input
          type="email"
          placeholder="Email"
          value={userEmail}
          onChange={(e) => setUserEmail(e.target.value)}
          required
        />

        <input
          type="password"
          placeholder="Password"
          value={userPassword}
          onChange={(e) => setUserPassword(e.target.value)}
          required
        />

        {loginError && <p className="error">{loginError}</p>}
        <button type="submit">Log In</button>
      </form>
    </div>
  );
};

export default Login;
