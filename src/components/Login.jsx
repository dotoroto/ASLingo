import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import logo from "../assets/logo.png";
import lgbg from "../assets/loginbg.png";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();
   const { t } = useTranslation();

  const handleLogin = async (e) => {
  e.preventDefault();
  try {
    const res = await axios.post("https://aslingo.study/api/login", { email, password });
    console.log("Logged in!", res.data);

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
        setError(err.response?.data?.error_description || "Login failed");
    }
    };


  return (
    <div
        className="login-wrapper"
        style={{
           backgroundImage: `url(${lgbg})`,
           backgroundSize: "cover",        // makes image cover the whole container
           backgroundRepeat: "no-repeat",  // prevents tiling
           backgroundPosition: "center",   // centers the image
       }}
    >
    <form onSubmit={handleLogin} className="login-form">
      <img src={logo} alt="ASLingo Logo" className="logo-middle" />
      <Link to="/" className="link-text">{t("login.home")}</Link>

      <input
         type="email"
         placeholder={t("login.email")}
         value={email}
         onChange={(e) => setEmail(e.target.value)}
         required
         className="login-input"
      />

       <input
         type="password"
         placeholder={t("login.password")}
         value={password}
         onChange={(e) => setPassword(e.target.value)}
         required
         className="login-input"
      />

      <button type="submit" className="login-btn">{t("login.title")}</button>
      {error && <p className="login-error">{error}</p>}
    </form>
    </div>
  );
}
