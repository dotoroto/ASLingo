<<<<<<< Updated upstream
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

export default function Leaderboard() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();


  const goToDashboard = () => {
    navigate("/dashboard");
  };
   const API_URL = process.env.NODE_ENV === "production"
  ? "https://aslingo.study"
  : "http://localhost:5000";

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const res = await axios.get("${API_URL}/users");
        // Sort users by XP descending
        const sortedUsers = res.data.sort((a, b) => b.xp - a.xp);
        setUsers(sortedUsers);
        setLoading(false);
      } catch (err) {
        console.error("Failed to fetch leaderboard:", err.response?.data || err.message);
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, []);

  if (loading) return <p>Loading leaderboard...</p>;

  return (
    <div style={{ textAlign: "center", marginTop: "50px" }}>
        <button onClick={goToDashboard}>Dashboard</button>
      <h1>Leaderboard</h1>
      {users.length === 0 ? (
        <p>No users yet!</p>
      ) : (
        <table style={{ margin: "0 auto", borderCollapse: "collapse", width: "50%" }}>
          <thead>
            <tr>
              <th style={{ borderBottom: "2px solid #000", padding: "10px" }}>Rank</th>
              <th style={{ borderBottom: "2px solid #000", padding: "10px" }}>Name</th>
              <th style={{ borderBottom: "2px solid #000", padding: "10px" }}>XP</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user, index) => (
              <tr key={user._id} style={{ background: index % 2 === 0 ? "#f2f2f2" : "#fff" }}>
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
=======
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import logo from "../assets/logo.png";

export default function Leaderboard() {
    const location = useLocation();
return (
    <div className = 'homepage-wrapper'>
    <img src={logo} alt="ASLingo Logo" className="logo" />
    </div>
  );
}

>>>>>>> Stashed changes
