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

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const res = await axios.get("http://localhost:5000/users");
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
