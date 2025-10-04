import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const DOMAIN = "dev-0rs44np0zj70rnwz.us.auth0.com";
const CLIENT_ID = "oSvrqa2TRwe4SBy58IehjFQbHfuMDTEE";
const CONNECTION = "Username-Password-Authentication";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(`https://${DOMAIN}/oauth/token`, {
        grant_type: "password",
        username: email,
        password,
        client_id: CLIENT_ID,
        scope: "openid profile email",
        connection: CONNECTION,
      });
      console.log("Logged in!", res.data);
      // Save tokens locally, then redirect to dashboard/home
      localStorage.setItem("id_token", res.data.id_token);
      navigate("/dashboard"); 
    } catch (err) {
      console.error("Login failed:", err.response?.data || err.message);
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
        style={{ display: "block", margin: "10px auto", padding: "10px" }}
        required
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        style={{ display: "block", margin: "10px auto", padding: "10px" }}
        required
      />
      <button type="submit" style={{ padding: "10px 20px" }}>Login</button>
    </form>
  );
}


