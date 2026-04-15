import React, { useState } from "react";
import api from "../utils/api";
import { useNavigate } from "react-router-dom";
import "./login.css"; // optional: add a shared css file if not already

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();


  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const res = await api.post("/auth/login", { email, password });
      const { token, role, userId } = res.data;

      // ✅ Correct variable name (res not response)
      localStorage.setItem("token", token);
      localStorage.setItem("role", role);
      localStorage.setItem("userId", userId);

      // ✅ Redirect based on role
      if (role === "student") {
        navigate("/student-dashboard");
      } else if (role === "mentor") {
        navigate("/mentor-dashboard");
      }
        else if (role === "coordinator") {
          navigate("/coordinator-dashboard");
      } else {
        setError("Invalid user role");
      }
    } catch (err) {
      console.error("Login failed:", err.response?.data || err.message);
      setError(err.response?.data?.error || "Invalid credentials or server error");
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <h2>Login</h2>
        <form onSubmit={handleSubmit} className="auth-form">
          <input
            type="email"
            placeholder="University Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button type="submit">Login</button>
        </form>

        {error && <p className="error-banner">{error}</p>}

        <p className="auth-footer">
          New user?{" "}
          <a href="/register" style={{ color: "#ff7b00", fontWeight: "bold" }}>
            Register here
          </a>
        </p>
      </div>
    </div>
  );
}
