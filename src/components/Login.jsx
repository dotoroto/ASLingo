import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import logo from "../assets/logo.png";
import lgbg from "../assets/loginbg.png";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post("/api/login", { email, password });

      if (!res.data.user) {
        setError("Login succeeded but no user returned.");
        return;
      }

      localStorage.setItem("id_token", res.data.tokenData.id_token);
      localStorage.setItem("email", res.data.user.email);
      localStorage.setItem("xp", res.data.user.xp ?? 0);

      navigate("/dashboard");
    } catch (err) {
      console.error("Login failed:", err.response?.data || err.message);
      setError(err.response?.data?.error || "Login failed");
    }
  };

  return (
    <div
      className="login-wrapper"
      style={{
        backgroundImage: `url(${lgbg})`,
        backgroundSize: "cover",
        backgroundRepeat: "no-repeat",
        backgroundPosition: "center",
      }}
    >
      <form onSubmit={handleLogin} className="login-form">
        <img src={logo} alt="ASLingo Logo" className="logo-middle" />
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="login-input"
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="login-input"
        />
        <button type="submit" className="login-btn">Login</button>
        {error && <p className="login-error">{error}</p>}
      </form>
    </div>
  );
}
