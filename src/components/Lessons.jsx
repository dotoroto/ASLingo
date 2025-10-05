import React, { useState } from 'react';
import logo from "../assets/logo.png";
import { useNavigate } from "react-router-dom";
import { Link } from 'react-router-dom';
import Navbar from './Navbar'
import { useTranslation } from "react-i18next";

export default function Lessons() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  // Translated lesson names
  const lessons = t("lessons.lessons", { returnObjects: true });

  // English names for URLs
  const lessonsEng = [
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
    setCurrentIndex((prev) => (prev + 1) % lessons.length);
    setTimeout(() => setIsAnimating(false), 600);
  };

  const handlePrevious = () => {
    if (isAnimating) return;
    setIsAnimating(true);
    setCurrentIndex((prev) => (prev - 1 + lessons.length) % lessons.length);
    setTimeout(() => setIsAnimating(false), 600);
  };

  const visibleCards = [
    lessons[currentIndex],
    lessons[(currentIndex + 1) % lessons.length],
    lessons[(currentIndex + 2) % lessons.length]
  ];

  return (
    <div className="homepage-wrapper">
      <img src={logo} alt="ASLingo Logo" className="logo" />
      <div className="homepage-container">
        <div className="centered-top-text">
          <h1>{t("lessons.back")}</h1>
        </div>
        <Navbar />
        <Link to="/" className="link-text">
          {t("lessons.logout")}
        </Link>
      </div>

      <div className="lesson-cards-container">
        <div className="nav-arrow" onClick={handlePrevious}>&lt;</div>

        <div className="cards-wrapper">
          {visibleCards.map((lesson, index) => {
            const lessonIndex = (currentIndex + index) % lessons.length;
            const lessonUrl = lessonsEng[lessonIndex].toLowerCase().replace(/\s+/g, '-');

            return (
              <div
                key={`${lesson}-${currentIndex}-${index}`}
                className={`lesson-card ${isAnimating ? 'slide-in' : ''}`}
                onClick={() => navigate(`/lessons/${lessonUrl}`)}
                style={{ cursor: 'pointer' }}
              >
                <span>{lesson}</span>
              </div>
            );
          })}
        </div>

        <div className="nav-arrow" onClick={handleNext}>&gt;</div>
      </div>
    </div>
  );
}
