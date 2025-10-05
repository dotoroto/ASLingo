import React from 'react';
import { Link, useLocation } from 'react-router-dom';

export default function Navbar() {
  const location = useLocation();
  
  return (
    <nav className="navbar">
      <Link 
        to="/dashboard" 
        className={`nav-link ${location.pathname === '/dashboard' ? 'active' : ''}`}
      >
        Profile
      </Link>
      <Link 
        to="/lessons" 
        className={`nav-link ${location.pathname.startsWith('/lessons') ? 'active' : ''}`}
      >
        Lessons
      </Link>
      <Link 
        to="/practice" 
        className={`nav-link ${location.pathname === '/practice' ? 'active' : ''}`}
      >
        Practice
      </Link>
      <Link 
        to="/challenges" 
        className={`nav-link ${location.pathname === '/challenges' ? 'active' : ''}`}
      >
        Challenges
      </Link>
    </nav>
  );
}