import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

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
