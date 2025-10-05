import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import logo from "../assets/logo.png";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

export default function Leaderboard() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { t } = useTranslation();

  const goToDashboard = () => {
    navigate("/dashboard");
  };

  // 👇 Use env variable so dev uses localhost, prod uses deployed backend

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const res = await axios.get("https://aslingo.study/api/users");
        // Sort users by XP descending
        const sortedUsers = res.data.sort((a, b) => b.xp - a.xp);
        setUsers(sortedUsers);
      } catch (err) {
        console.error(
          "Failed to fetch leaderboard:",
          err.response?.data || err.message
        );
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, ["https://aslingo.study"]);

  if (loading) return <p>{t("leaderboard.loading")}</p>;

  return (
    <div style={{ textAlign: "center", marginTop: "50px" }}>
        <img src={logo} alt="ASLingo Logo" className="logo" />
        <Link to="/dashboard" className="link-text">{t("leaderboard.back")}</Link>
      <h1>{t("leaderboard.title")}</h1>
      {users.length === 0 ? (
        <p>{t("leaderboard.noUsers")}</p>
      ) : (
        <table
          style={{
            margin: "0 auto",
            borderCollapse: "collapse",
            width: "50%",
          }}
        >
          <thead>
            <tr>
              <th style={{ borderBottom: "2px solid #000", padding: "10px" }}>
                {t("leaderboard.rank")}
              </th>
              <th style={{ borderBottom: "2px solid #000", padding: "10px" }}>
                {t("leaderboard.name")}
              </th>
              <th style={{ borderBottom: "2px solid #000", padding: "10px" }}>
                {t("leaderboard.xp")}
              </th>
            </tr>
          </thead>
          <tbody>
            {users.map((user, index) => (
              <tr
                key={user._id}
                style={{
                  background: index % 2 === 0 ? "#f2f2f2" : "#fff",
                }}
              >
                <td style={{ padding: "10px" }}>{index + 1}</td>
                <td style={{ padding: "10px" }}>{user.name || user.email}</td>
                <td style={{ padding: "10px" }}>{user.xp}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
