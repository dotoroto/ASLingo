import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Homepage from "./components/Homepage.jsx";
import Login from "./components/Login.jsx";
import Signup from "./components/Signup.jsx";
import Dashboard from "./components/Dashboard.jsx";
import Leaderboard from "./components/Leaderboard.jsx";
import Lessons from "./components/Lessons.jsx";
import LessonDetail from "./components/LessonDetail.jsx";
import Practice from "./components/Practice.jsx";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Homepage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/leaderboard" element={<Leaderboard />} />
         <Route path="/lessons" element={<Lessons />} />
        <Route path="/lessons/:topic" element={<LessonDetail />} />
        <Route path="/practice" element={<Practice />} />
      </Routes>
    </Router>
  );
}
