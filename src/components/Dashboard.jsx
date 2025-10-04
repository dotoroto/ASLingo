import React, { useEffect, useState } from "react";
import axios from "axios";

export default function Dashboard() {
  const auth0Id = localStorage.getItem("auth0Id"); // store on login
  const [xp, setXp] = useState(0);

  useEffect(() => {
    const fetchXp = async () => {
      if (!auth0Id) return;
      const res = await axios.get(`http://localhost:5000/user/${auth0Id}`);
      setXp(res.data.xp);
    };
    fetchXp();
  }, [auth0Id]);

  const addXp = async () => {
    const res = await axios.post(`http://localhost:5000/user/${auth0Id}/add-xp`, {
      amount: 10, // example
    });
    setXp(res.data.xp);
  };

  return (
    <div style={{ textAlign: "center", marginTop: "50px" }}>
      <h1>Dashboard</h1>
      <p>XP: {xp}</p>
      <button onClick={addXp}>Gain 10 XP</button>
    </div>
  );
}
