import React, { useEffect, useState } from "react";
import axios from "axios";
import logo from "../assets/logo.png";
import avatar from "../assets/avatarimage.png";
import { useNavigate, Link } from "react-router-dom";
import Navbar from "./Navbar";
import { useTranslation } from "react-i18next";
import LanguageSwitcher from "./LanguageSwitcher";

export default function Dashboard() {
  const email = localStorage.getItem("email");
  const [user, setUser] = useState(null); 
  const [xp, setXp] = useState(0);

  const { t } = useTranslation();

  const API_URL = "https://aslingo.study";
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("email");
    localStorage.removeItem("name");
    localStorage.removeItem("xp");
    navigate("/login");
  };

  useEffect(() => {
    const fetchUser = async () => {
      if (!email) return;
      try {
        // fetch all users
        const res = await axios.get(`${API_URL}/api/users`);
        
        // find matching user
        const foundUser = res.data.find((u) => u.email === email);

        if (foundUser) {
          setUser(foundUser);
          setXp(foundUser.xp || 0);
          localStorage.setItem("xp", foundUser.xp || 0);
          if (foundUser.name) {
            localStorage.setItem("name", foundUser.name);
          }
        } else {
          console.warn("User not found in /api/user response");
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
          <h1>{t("dashboard.title")}</h1>
        </div>
        <Navbar />
        <LanguageSwitcher />
        <Link to="/" className="link-text" onClick={handleLogout}>
          {t("dashboard.logout")}
        </Link>
      </div>

      <div className="profile-container">
        <div className="profile-card">
          <div className="profile-left">
            <img src={avatar} alt="Profile" className="profile-avatar" />
            <h2 className="profile-name">
              {user?.name || email?.split("@")[0] || t("dashboard.defaultUser")}
            </h2>
          </div>

          <div className="profile-right">
            <div className="profile-section">
              <h3>{t("dashboard.levelTitle")}</h3>
              <p><strong>{t("dashboard.levelLabel")} {Math.floor(xp / 100)}</strong></p>
              <div className="xp-bar">
                <div className="xp-fill" style={{ width: `${xp % 100}%` }}></div>
              </div>
              <div className="xp-text">
                <span>{xp} XP</span>
                <span>{100 - (xp % 100)} {t("dashboard.xpTillNext")}</span>
              </div>
              <div className="link-text2">
                <Link to="/Leaderboard" className="link-text2">
                  {t("dashboard.leaderboardLink")}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
