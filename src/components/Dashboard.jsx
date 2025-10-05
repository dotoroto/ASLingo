import React, { useEffect, useState } from "react";
import axios from "axios";
import logo from "../assets/logo.png";
import avatar from "../assets/avatarimage.png";
import { useNavigate, Link } from "react-router-dom";
import Navbar from "./Navbar";

export default function Dashboard() {
  const email = localStorage.getItem("email");
  const [user, setUser] = useState(null); // store full user object
  const [xp, setXp] = useState(0);

  const API_URL = "https://aslingo.study";
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("email");
    localStorage.removeItem("name");
    localStorage.removeItem("xp");
    navigate("/login");
  };

  // Fetch user from backend when dashboard loads
  useEffect(() => {
    const fetchUser = async () => {
      if (!email) return;
      try {
        const res = await axios.get(`${API_URL}/api/user/:${email}`);
        setUser(res.data);
        setXp(res.data.xp || 0);
        localStorage.setItem("xp", res.data.xp || 0);
        if (res.data.name) {
          localStorage.setItem("name", res.data.name);
        }
      } catch (err) {
        console.error("Failed to fetch user:", err.response?.data || err.message);
      }
    };
    fetchUser();
  }, [email]);


  return (
    <div className="homepage-wrapper">
      <img src={logo} alt="ASLingo Logo" className="logo" />
      <div className="homepage-container">
        <div className="centered-top-text">
          <h1>Your Dashboard</h1>
        </div>
        <Navbar />
        <Link to="/" className="link-text" onClick={handleLogout}>
          Logout
        </Link>
      </div>

      <div className="profile-container">
        <div className="profile-card">
          <div className="profile-left">
            <img src={avatar} alt="Profile" className="profile-avatar" />
            <h2 className="profile-name">
              {user?.name || email?.split("@")[0] || "User"}
            </h2>
          </div>

          <div className="profile-right">
            <div className="profile-section">
              <h3>Gesture Rookie</h3>
              <p><strong>Level {xp/100}</strong></p>
              <div className="xp-bar">
                <div className="xp-fill" style={{ width: `${xp%100}%` }}></div>
              </div>
              <div className="xp-text">
                <span>{xp} XP</span>
                <span>{100 - xp%100} XP till next level</span>
              </div>
              <div className="link-text2">
                <Link to="/Leaderboard" className="link-text2">View Leaderboard Place</Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
