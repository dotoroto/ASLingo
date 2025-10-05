import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from "react-i18next";

export default function Navbar() {
  const location = useLocation();
  const { t } = useTranslation();

  return (
    <nav className="navbar">
      <Link 
        to="/dashboard" 
        className={`nav-link ${location.pathname === '/dashboard' ? 'active' : ''}`}
      >
        {t("navbar.profile")}
      </Link>
      <Link 
        to="/lessons" 
        className={`nav-link ${location.pathname.startsWith('/lessons') ? 'active' : ''}`}
      >
        {t("navbar.lessons")}
      </Link>
      <Link 
        to="/practice" 
        className={`nav-link ${location.pathname === '/practice' ? 'active' : ''}`}
      >
        {t("navbar.practice")}
      </Link>
      <Link 
        to="/challenges" 
        className={`nav-link ${location.pathname === '/challenges' ? 'active' : ''}`}
      >
        {t("navbar.challenges")}
      </Link>
    </nav>
  );
}