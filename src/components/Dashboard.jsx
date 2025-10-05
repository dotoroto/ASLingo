import React, { useEffect, useState } from "react";
import axios from "axios";
import logo from "../assets/logo.png";
import avatar from "../assets/avatarimage.png"
import { useNavigate } from "react-router-dom";
import { Link } from 'react-router-dom';
import Navbar from './Navbar';

export default function Dashboard() {
  const email = localStorage.getItem("email");
  const [xp, setXp] = useState(() => {
    const storedXp = localStorage.getItem("xp");
    return storedXp ? parseInt(storedXp) : 0;
  });

  const API_URL = process.env.NODE_ENV === "production"
  ? "https://aslingo.study"
  : "http://localhost:5000";

  const navigate = useNavigate();

  const goToLearning = () => {
    navigate("/learning");
  };
  const goToLeaderboard = () => {
    navigate("/leaderboard");
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("email");
    localStorage.removeItem("name");
    localStorage.removeItem("xp");
    navigate("/login");
  };

const currentXP = 30;
const nextLevelXP = 70;
const xpProgress = (currentXP / nextLevelXP) * 100;

  // Fetch XP from backend when dashboard loads
  useEffect(() => {
    const fetchXp = async () => {
      if (!email) return;
      try {
        const res = await axios.get(`${API_URL}/user/${email}`);
        setXp(res.data.xp);
        localStorage.setItem("xp", res.data.xp);
      } catch (err) {
        console.error("Failed to fetch XP:", err.response?.data || err.message);
      }
    };
    fetchXp();
  }, [email]);

  const addXp = async () => {
    //if (!email) return;
    try {
      const res = await axios.post(`${API_URL}/user/${email}/add-xp`, { amount: 10 });
      setXp(res.data.xp);
      localStorage.setItem("xp", res.data.xp);
    } catch (err) {
      console.error("Failed to add XP:", err.response?.data || err.message);
    }
  };

  return (
    <div className = 'homepage-wrapper'>
    <img src={logo} alt="ASLingo Logo" className="logo" />
      <div className="homepage-container">
      <div className="centered-top-text">
        <h1>Your Dashboard</h1>
      </div>
      <Navbar />
        <Link to="/" className="link-text">
          Logout
        </Link>
      </div>
    <div className="profile-container">
      <div className="profile-card">
        <div className="profile-left">
          <img src={avatar} alt="Profile" className="profile-avatar" />
          <h2 className="profile-name">Name</h2>
        </div>

        <div className="profile-right">
          <div className="profile-section">
            <h3>Gesture Rookie</h3>
            <p><strong>Level 1</strong></p>
            <div className="xp-bar">
              <div className="xp-fill" style={{ width: `${xpProgress}%` }}></div>
            </div>
            <div className="xp-text">
              <span>{currentXP} XP</span>
              <span>{nextLevelXP} XP till next level</span>
            </div>
            <div className="link-text2">
              <Link to="/Leaderboard" className="link-text2"> View Leaderboard Place
              </Link>
            </div>

          </div>
        </div>
        </div>
    </div>
  </div>
  );
}
