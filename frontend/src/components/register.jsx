import React, { useState } from "react";
import api from "../utils/api";
import { useNavigate } from "react-router-dom";

export default function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async e => {
    e.preventDefault();
    try {
      const res = await api.post("auth/register", { email, password });
      setMsg(res.data.message);
      setTimeout(() => navigate("/login"), 1500);
    } catch (err) {
      setMsg(err.response?.data?.error || "Registration failed");
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <h2>Activate Account</h2>
        <form onSubmit={handleSubmit} className="auth-form">
          <input placeholder="University Email" value={email} onChange={e => setEmail(e.target.value)} required />
          <input placeholder="New Password" type="password" value={password} onChange={e => setPassword(e.target.value)} required />
          <button type="submit">Activate</button>
        </form>
        {msg && <p className={msg.includes("successfully") ? "success" : "error"}>{msg}</p>}
        <p className="back-to-login">
          Already activated?{" "}
          <a href="/login" className="login-link">Login here</a>
        </p>
      </div>
    </div>
  );
}
