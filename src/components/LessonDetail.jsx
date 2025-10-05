// LessonDetail.jsx
import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navbar from "./Navbar";
import logo from "../assets/logo.png";
import { Link } from 'react-router-dom';
import { useTranslation } from "react-i18next";


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
  const { t } = useTranslation();
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
        <div className="homepage-container">
            <div className="centered-top-text">
                <h1>Your Dashboard</h1>
            </div>
            <Navbar />
            <Link to="/" className="link-text">Logout</Link>
        </div>

        <div className="content_wrapper">

        <h1>{t("lessonDetail.lesson")}: {topic}</h1>

        <h2>{currentWord.word}</h2>
        <video src={currentWord.videoUrl} controls width={400}></video>

        <div style={{ marginTop: 20 }}>
            <button className="learning-btn" onClick={goNext}>{t("lessonDetail.nextWord")}</button>
            <button className="learning-btn" onClick={() => navigate(`/practice?word=${currentWord.word}`)}>
            {t("lessonDetail.practiceWord")} "{currentWord.word}"</button>
        </div>

        </div>
    </div>
  );
}
