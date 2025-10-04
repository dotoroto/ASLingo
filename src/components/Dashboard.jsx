import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

export default function Dashboard() {
  const email = localStorage.getItem("email");
  const [xp, setXp] = useState(() => parseInt(localStorage.getItem("xp") || 0));
  const navigate = useNavigate();

  const goToLearning = () => navigate("/learning");
  const goToLeaderboard = () => navigate("/leaderboard");

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  useEffect(() => {
    const fetchXp = async () => {
      if (!email) return;
      try {
        const res = await axios.get(`/api/user/${email}`);
        setXp(res.data.xp);
        localStorage.setItem("xp", res.data.xp);
      } catch (err) {
        console.error("Failed to fetch XP:", err.response?.data || err.message);
      }
    };
    fetchXp();
  }, [email]);

  const addXp = async () => {
    if (!email) return;
    try {
      const res = await axios.post(`/api/user/${email}/add-xp`, { amount: 10 });
      setXp(res.data.xp);
      localStorage.setItem("xp", res.data.xp);
    } catch (err) {
      console.error("Failed to add XP:", err.response?.data || err.message);
    }
  };

  return (
    <div style={{ textAlign: "center", marginTop: "50px" }}>
      <h1>Dashboard</h1>
      <p>Email: {email}</p>
      <p>XP: {xp}</p>
      <button onClick={addXp}>Gain 10 XP</button>
      <br /><br />
      <button onClick={goToLearning}>Go to Learning Page</button>
      <br /><br />
      <button onClick={goToLeaderboard}>Go to Leaderboard</button>
      <br /><br />
      <button onClick={handleLogout}>Log Out</button>
    </div>
  );
}
