import { useState } from "react";
import { useNavigate } from "react-router-dom";

const Register = () => {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [error, setError] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.email.includes("@")) return setError("Invalid email format");
    if (form.password.length < 8) return setError("Password too short");
    if (!/[A-Z]/.test(form.password)) return setError("Need uppercase");
    if (!/[a-z]/.test(form.password)) return setError("Need lowercase");
    if (!/[0-9]/.test(form.password)) return setError("Need number");
    if (form.password !== form.confirmPassword)
      return setError("Passwords do not match");

    alert("✅ Registration Successful!");
    navigate("/dashboard");
  };

  return (
    <div>
      <h1>Register</h1>

      <form onSubmit={handleSubmit}>
        <input
          name="firstName"
          placeholder="First Name"
          onChange={handleChange}
          required
        />
        <br />

        <input
          name="lastName"
          placeholder="Last Name"
          onChange={handleChange}
          required
        />
        <br />

        <input
          name="email"
          placeholder="Email"
          onChange={handleChange}
          required
        />
        <br />

        <input
          name="password"
          type="password"
          placeholder="Password"
          onChange={handleChange}
          required
        />
        <br />

        <input
          name="confirmPassword"
          type="password"
          placeholder="Confirm Password"
          onChange={handleChange}
          required
        />
        <br />

        <button type="submit">Create Account</button>
      </form>

      {error && <p style={{ color: "red" }}>{error}</p>}
    </div>
  );
};

export default Register;
