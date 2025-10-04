import React, { useEffect, useState } from "react";
import axios from "axios";

export default function Dashboard() {
  const email = localStorage.getItem("email"); // ✅ use email, store this on login
  const [xp, setXp] = useState(0);

  // Fetch XP from backend when dashboard loads
  useEffect(() => {
    const fetchXp = async () => {
      if (!email) return;
      try {
        const res = await axios.get(`http://localhost:5000/user/${email}`);
        setXp(res.data.xp);
      } catch (err) {
        console.error("Failed to fetch XP:", err.response?.data || err.message);
      }
    };
    fetchXp();
  }, [email]);

  // Function to add XP
  const addXp = async () => {
    if (!email) return;
    try {
      const res = await axios.post(`http://localhost:5000/user/${email}/add-xp`, {
        amount: 10,
      });
      setXp(res.data.xp);
      localStorage.setItem("xp", res.data.xp); // optional: keep local copy
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
    </div>
  );
}
