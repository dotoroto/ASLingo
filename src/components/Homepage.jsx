import React from "react";
import { useNavigate } from "react-router-dom";
import logo from "../assets/logo.png";
import homebg from "../assets/homepagebg.png";

export default function Homepage() {
  const navigate = useNavigate();

  return (
    
    <div
      className="homepage-wrapper"
      style={{
        backgroundImage: `url(${homebg})`,
        backgroundSize: "cover",
        backgroundRepeat: "no-repeat",
        backgroundPosition: "center",
        minHeight: "100vh"
      }}
    >
    {/* Logo */}
    <img src={logo} alt="ASLingo Logo" className="logo" />

    {/* Centered buttons */}
    <div className="homepage-container">
      <div className="centered-title">
        <h1>WANT TO LEARN ASL?</h1>
      </div>
      <div className="centered-text">
        <p>Jump into <strong>ASLingo</strong>, the gamified way to learn <br />
        <strong>American Sign Language!</strong> Get instant feedback, crush mini-games, <br />
        and level up your skills. <strong>No matter your level, this is your all-in-one ASL platform.</strong></p>
      </div>
      <div className="homepage-buttons">
         <button className="frontpage-btn" onClick={() => navigate("/login")}>Login</button>
         <button className="frontpage-btn" onClick={() => navigate("/signup")}>Sign Up</button>
      </div>
    </div>
  </div>

  );
}