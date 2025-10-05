import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import Navbar from "./Navbar";
import logo from "../assets/logo.png";
const BACKEND_PREDICT = "http://localhost:8000/predict";
const BACKEND_RESET = "http://localhost:8000/reset";

// Flat list of all words
const WORDS = [
  { word: "yes", videoUrl: "/videos/yes.mp4" },
  { word: "you", videoUrl: "/videos/you.mp4" },
  { word: "hello", videoUrl: "/videos/hello.mp4" }
];

export default function Practice() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const wordParam = searchParams.get("word");
  const targetWord = wordParam
    ? WORDS.find((w) => w.word.toLowerCase() === wordParam.toLowerCase())
    : null;

  // ML state
  const [suggestion, setSuggestion] = useState("");
  const [confidence, setConfidence] = useState(0);
  const [label, setLabel] = useState("—");
  const [state, setState] = useState("collecting"); // "collecting" | "predicted" | "no-hand" | "error"
  const [showVideo, setShowVideo] = useState(false);

  const webcamRef = useRef(null);
  const canvasRef = useRef(null);
  const intervalRef = useRef(null);
  const abortRef = useRef(null);

  const TARGET_CONF = 0.8;

  // Start webcam when word is selected
  useEffect(() => {
    if (!targetWord) return;

    const startWebcam = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (webcamRef.current) {
          webcamRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error("Error accessing webcam:", err);
      }
    };
    startWebcam();

    return () => {
      if (webcamRef.current?.srcObject) {
        webcamRef.current.srcObject.getTracks().forEach((t) => t.stop());
      }
      if (intervalRef.current) window.clearInterval(intervalRef.current);
      if (abortRef.current) abortRef.current.abort();
    };
  }, [targetWord]);

  // Poll backend continuously for predictions
  useEffect(() => {
    if (!targetWord) return;

    if (intervalRef.current) clearInterval(intervalRef.current);

    captureAndSend();
    intervalRef.current = setInterval(captureAndSend, 250);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [targetWord]);

  const captureAndSend = async () => {
    if (!targetWord) return;
    const video = webcamRef.current;
    if (!video || video.videoWidth === 0) return;

    let canvas = canvasRef.current;
    if (!canvas) {
      canvas = document.createElement("canvas");
      canvasRef.current = canvas;
    }

    const w = 320;
    const h = Math.round((video.videoHeight / video.videoWidth) * w);
    canvas.width = w;
    canvas.height = h;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, w, h);

    const imageData = canvas.toDataURL("image/jpeg", 0.7);

    if (abortRef.current) abortRef.current.abort();
    abortRef.current = new AbortController();

    try {
      const res = await axios.post(
        BACKEND_PREDICT,
        { image: imageData },
        { signal: abortRef.current.signal }
      );
      const { label: lbl, confidence: conf, state: st } = res.data;
      setLabel(lbl);
      setConfidence(conf);
      setState(st);

      if (
        st === "predicted" &&
        conf >= TARGET_CONF &&
        (lbl || "").toLowerCase() === targetWord.word.toLowerCase()
      ) {
        setSuggestion("");
      }
    } catch (err) {
      // ignore abort errors
    }
  };

  const resetSequence = async () => {
    try {
      await axios.post(BACKEND_RESET);
      setLabel("—");
      setConfidence(0);
      setState("collecting");
    } catch (e) {
      console.error("Reset error:", e);
    }
  };

  const stateColor =
    state === "predicted"
      ? "#16a34a"
      : state === "collecting"
      ? "#ca8a04"
      : state === "no-hand"
      ? "#4b5563"
      : "#dc2626";

  // Case 1: no word → show list
  if (!targetWord) {
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

        <div className="content_wrapper">
        <h1>Select a Word to Practice</h1>
        <ul style={{ listStyle: "none", padding: 0 }}>
          {WORDS.map((w) => (
            <li key={w.word} style={{ margin: "8px 0" }}>
              <button
                className="learning-btn"
                onClick={() => navigate(`/practice?word=${w.word}`)}
              >
                {w.word}
              </button>
            </li>
          ))}
        </ul>
        </div>
      </div>
    );
  }

  // Case 2: word selected → ML practice mode
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

      <div className="content_wrapper">
      <h1>Practice: {targetWord.word}</h1>

      <div style={{ position: "relative", display: "inline-block" }}>
        <video
          ref={webcamRef}
          autoPlay
          playsInline
          width={700}
          height={450}
          style={{ border: "2px solid black", background: "#000", borderRadius: 12 }}
        ></video>

        <div
          style={{
            position: "absolute",
            left: 12,
            bottom: 12,
            background: "rgba(0,0,0,0.6)",
            color: "#fff",
            padding: "8px 10px",
            borderRadius: 10,
            textAlign: "left",
          }}
        >
          <div style={{ fontSize: 12, opacity: 0.8 }}>Prediction</div>
          <div style={{ fontSize: 18, fontWeight: 700 }}>
            {label} <span style={{ opacity: 0.8 }}>({confidence.toFixed(2)})</span>
          </div>
        </div>

        <div
          style={{
            position: "absolute",
            right: 12,
            bottom: 12,
            padding: "4px 8px",
            color: "#fff",
            borderRadius: 6,
            background: stateColor,
            fontSize: 12,
            textTransform: "capitalize",
          }}
        >
          {state}
        </div>
      </div>

      <div style={{ marginTop: "10px" }}>
        <button onClick={resetSequence} className="learning-btn">Reset</button>
        <button onClick={() => setShowVideo((prev) => !prev)} className="learning-btn">
          {showVideo ? "Hide" : "Show"} Reference Video
        </button>
      </div>

      {showVideo && (
        <div style={{ marginTop: "10px" }}>
          <video src={targetWord.videoUrl} controls width={300}></video>
        </div>
      )}

      <p>
        Predicted: <strong>{label}</strong> — Confidence:{" "}
        {(confidence * 100).toFixed(1)}% — State: {state}
      </p>

      {suggestion && (
        <div style={{ marginTop: "20px", border: "1px solid gray", padding: "10px" }}>
          <strong>Suggestion:</strong> {suggestion}
        </div>
      )}
      </div>
    </div>
  );
}
