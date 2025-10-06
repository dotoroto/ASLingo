import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import logo from "../assets/logo.png";
import lgbg from "../assets/loginbg.png";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

export default function Signup() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const { t } = useTranslation();

  const handleSignup = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post("https://aslingo.study/api/signup", {
        name,
        email,
        password,
      });

      console.log("Signup successful!", res.data);

      // Save user info & XP
      localStorage.setItem("name", res.data.user.name);
      localStorage.setItem("email", res.data.user.email);
      localStorage.setItem("xp", res.data.user.xp);

      // Save tokens if returned
      if (res.data.data?.access_token) localStorage.setItem("access_token", res.data.data.access_token);
      if (res.data.data?.id_token) localStorage.setItem("id_token", res.data.data.id_token);

      navigate("/dashboard");
    } catch (err) {
      console.error("Signup failed:", err.response?.data || err.message);
      setError(err.response?.data?.message || "Signup failed");
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
     <form onSubmit={handleSignup} className="login-form">
       <img src={logo} alt="ASLingo Logo" className="login-logo" />
       <Link to="/" className="link-text">{t("signup.back")}</Link>
       <input
          type="name"
          placeholder={t("signup.name")}
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="login-input"
       />
       <input
          type="email"
          placeholder={t("signup.email")}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="login-input"
       />
 
        <input
          type="password"
          placeholder={t("signup.password")}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="login-input"
       />
 
       <button type="submit" className="login-btn">{t("signup.title")}</button>
       {error && <p className="login-error">{error}</p>}
     </form>
     </div>
   );
 }
 