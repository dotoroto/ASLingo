// LessonDetail.jsx
import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navbar from "./Navbar";
import logo from "../assets/logo.png";

const LESSONS = {
  greetings: [
    { word: "yes", videoUrl: "/videos/yes.mp4" },
    { word: "you", videoUrl: "/videos/you.mp4" },
    { word: "hello", videoUrl: "/videos/hello.mp4" },
  ],
  numbers: [
    { word: "one", videoUrl: "/videos/one.mp4" },
    { word: "two", videoUrl: "/videos/two.mp4" },
  ],
  // add more lessons here
};

export default function LessonDetail() {
  const { topic } = useParams();
  const words = LESSONS[topic] || [];
  const [currentIndex, setCurrentIndex] = useState(0);
  const navigate = useNavigate();

  if (!words.length) return <h2>No words found for this lesson.</h2>;

  const currentWord = words[currentIndex];

  const goNext = () =>
    setCurrentIndex((prev) => (prev + 1) % words.length);

  return (
    <div className="homepage-wrapper">
      <img src={logo} alt="ASLingo Logo" className="logo" />
      <Navbar />
      <h1>Lesson: {topic}</h1>

      <h2>{currentWord.word}</h2>
      <video src={currentWord.videoUrl} controls width={400}></video>

      <div style={{ marginTop: 20 }}>
        <button onClick={goNext}>Next Word</button>
        <button
          onClick={() =>
            navigate(`/practice?word=${currentWord.word}`)
          }
        >
          Practice "{currentWord.word}"
        </button>
      </div>
    </div>
  );
}
