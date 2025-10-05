import React, { useState } from 'react';
import logo from "../assets/logo.png";
import { useNavigate } from "react-router-dom";
import { Link } from 'react-router-dom';
import Navbar from './Navbar'

export default function Practice() {
  const navigate = useNavigate();
  
  const words = [
    "Greetings",
    "Numbers", 
    "Common Phrases",
    "Family",
    "Food",
    "Weather"
  ];

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  const handleNext = () => {
    if (isAnimating) return;
    setIsAnimating(true);
    setCurrentIndex((prev) => (prev + 1) % words.length);
    setTimeout(() => setIsAnimating(false), 600);
  };

  const handlePrevious = () => {
    if (isAnimating) return;
    setIsAnimating(true);
    setCurrentIndex((prev) => (prev - 1 + words.length) % words.length);
    setTimeout(() => setIsAnimating(false), 600);
  };

  const visibleCards = [
    words[currentIndex],
    words[(currentIndex + 1) % words.length],
    words[(currentIndex + 2) % words.length]
  ];

  return (
    <div className="homepage-wrapper">
      <img src={logo} alt="ASLingo Logo" className="logo" />
      <div className="homepage-container">
      <div className="centered-top-text">
        <h1>Your Dashboard</h1>
      </div>
      <Navbar />
        <Link to="/" className="link-text">
          Logout
        </Link>
      </div>
      <div className="lesson-cards-container">
       <div className="nav-arrow" onClick={handlePrevious}>&lt;</div>
      
        <div className="cards-wrapper">
          {visibleCards.map((lesson, index) => (
            <div
              key={`${lesson}-${currentIndex}-${index}`}
              className={`lesson-card ${isAnimating ? 'slide-in' : ''}`}
              onClick={() => navigate(`/words/${lesson.toLowerCase().replace(/\s+/g, '-')}`)}
              style={{ cursor: 'pointer' }}
            >
              <span>{lesson}</span>
            </div>
          ))}
        </div>
      
        <div className="nav-arrow" onClick={handleNext}>&gt;</div>
      </div>
    </div>
  );
}