import React, { useState } from 'react';

export default function Lessons() {
  const lessons = [
    "Greetings",
    "Numbers", 
    "Common Phrases",
    "Animals",
    "Colors",
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
    <div className="lesson-cards-container">
      <div className="nav-arrow" onClick={handlePrevious}>&lt;</div>
      
      <div className="cards-wrapper">
        {visibleCards.map((lesson, index) => (
          <div 
            key={`${lesson}-${currentIndex}-${index}`} 
            className={`lesson-card ${isAnimating ? 'slide-in' : ''}`}
          >
            <span>{lesson}</span>
          </div>
        ))}
      </div>
      
      <div className="nav-arrow" onClick={handleNext}>&gt;</div>
    </div>
  );
}