import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import logo from "../assets/logo.png";
import lgbg from "../assets/loginbg.png";

export default function Signup() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSignup = async (e) => {
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
      localStorage.setItem("email", res.data.user.email);
      localStorage.setItem("xp", res.data.user.xp);

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
     <form onSubmit={handleSignup} className="login-form">
       <img src={logo} alt="ASLingo Logo" className="login-logo" />
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
 