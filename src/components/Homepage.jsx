import React from "react";
import { useNavigate } from "react-router-dom";
import logo from "../assets/logo.png";
import homebg from "../assets/homepagebg.png";
import { useTranslation } from "react-i18next";

export default function Homepage() {
  const navigate = useNavigate();
  const { t } = useTranslation();

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
        <h1>{t("homepage.title")}</h1>
      </div>
      <div className="centered-text">
        <p dangerouslySetInnerHTML={{ __html: t('homepage.description') }} />
      </div>
      <div className="homepage-buttons">
         <button className="frontpage-btn" onClick={() => navigate("/login")}>{t("homepage.login")}</button>
         <button className="frontpage-btn" onClick={() => navigate("/signup")}>{t("homepage.signup")}</button>
      </div>
    </div>
  </div>

  );
}