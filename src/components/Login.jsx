import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      // Call your backend (not Auth0 directly)
      const res = await axios.post("http://localhost:5000/api/login", {
        email,
        password,
      });

      console.log("Logged in!", res.data);

      // Save tokens from Auth0 (proxied through your backend)
      if (res.data.access_token) {
        localStorage.setItem("access_token", res.data.access_token);
      }
      if (res.data.id_token) {
        localStorage.setItem("id_token", res.data.id_token);
      }

      navigate("/dashboard");
    } catch (err) {
      console.error("Login failed:", err.response?.data || err.message);
      setError(err.response?.data?.error_description || "Login failed");
    }
  };

  return (
    <form onSubmit={handleLogin} style={{ textAlign: "center", marginTop: "50px" }}>
      <h2>Login</h2>
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        style={{ display: "block", margin: "10px auto", padding: "10px" }}
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
        style={{ display: "block", margin: "10px auto", padding: "10px" }}
      />
      <button type="submit" style={{ padding: "10px 20px" }}>Login</button>
      {error && <p style={{ color: "red" }}>{error}</p>}
    </form>
  );
}
