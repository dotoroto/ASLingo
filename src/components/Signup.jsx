import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import logo from "../assets/logo.png";
import lgbg from "../assets/loginbg.png";

export default function Signup() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSignup = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post("/api/signup", { email, password, name });

      localStorage.setItem("email", res.data.user.email);
      localStorage.setItem("name", res.data.user.name);
      localStorage.setItem("xp", res.data.user.xp);

      if (res.data.data?.access_token) localStorage.setItem("access_token", res.data.data.access_token);
      if (res.data.data?.id_token) localStorage.setItem("id_token", res.data.data.id_token);

      navigate("/dashboard");
    } catch (err) {
      console.error("Signup failed:", err.response?.data || err.message);
      setError(err.response?.data?.error || "Signup failed");
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
      <form onSubmit={handleSignup} className="login-form">
        <img src={logo} alt="ASLingo Logo" className="login-logo" />
        <input
          type="text"
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="login-input"
        />
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
        <button type="submit" className="login-btn">Sign Up</button>
        {error && <p className="login-error">{error}</p>}
      </form>
    </div>
  );
}
