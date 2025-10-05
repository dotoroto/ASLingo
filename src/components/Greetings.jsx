import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Navbar from './Navbar';
import { Link } from 'react-router-dom';
import logo from "../assets/logo.png";

const BACKEND_PREDICT = "http://localhost:8000/predict";
const BACKEND_RESET   = "http://localhost:8000/reset";

// Example words and reference video URLs
const WORDS = [
  { word: "yes", videoUrl: "/videos/yes.mp4" },
  { word: "you", videoUrl: "/videos/you.mp4" },
  { word: "hello", videoUrl: "/videos/hello.mp4" },
];

export default function Learning() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [suggestion, setSuggestion] = useState("");
  const [confidence, setConfidence] = useState(0);
  // NEW: track live label/state returned by backend
  const [label, setLabel] = useState("—");                       // NEW
  const [state, setState] = useState("collecting");              // NEW: "collecting" | "predicted" | "no-hand" | "error"
  const [showVideo, setShowVideo] = useState(false);

  // CHANGED: keep webcam ref; add canvas/interval/abort refs for streaming
  const webcamRef = useRef(null);
  const canvasRef = useRef(null);                                // NEW: hidden canvas to grab frames
  const intervalRef = useRef(null);                              // NEW: to clear setInterval
  const abortRef = useRef(null);                                 // NEW: to cancel in-flight requests

  const currentWord = WORDS[currentIndex];
  const navigate = useNavigate();
  const TARGET_CONF = 0.8;                                       // NEW: threshold for advancing

  const goToDashboard = () => {
    navigate("/dashboard");
  };

  // Start webcam
  useEffect(() => {
    const startWebcam = async () => {
      if (navigator.mediaDevices.getUserMedia) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: true });
          if (webcamRef.current) {
            webcamRef.current.srcObject = stream;
          }
        } catch (err) {
          console.error("Error accessing webcam:", err);
        }
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
  }, []);

  
// continuous polling every 250ms; restart when the target word changes
useEffect(() => {
  // ensure no duplicate intervals
  if (intervalRef.current) {
    clearInterval(intervalRef.current);
  }

  // optional: immediate first call
  captureAndSend();

  intervalRef.current = window.setInterval(captureAndSend, 250);

  return () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };
}, [currentIndex]);


  // NEW: stream one frame to backend and handle response
  const captureAndSend = async () => {
    const video = webcamRef.current;
    if (!video || video.videoWidth === 0) return;

    // NEW: reuse/create an off-screen canvas
    let canvas = canvasRef.current;
    if (!canvas) {
      canvas = document.createElement("canvas");
      canvasRef.current = canvas;
    }

    // NEW: downscale for bandwidth + speed
    const w = 320;
    const h = Math.round((video.videoHeight / video.videoWidth) * w);
    canvas.width = w;
    canvas.height = h;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, w, h);

    // NEW: encode to JPEG (quality 0.7)
    const imageData = canvas.toDataURL("image/jpeg", 0.7);

    // NEW: cancel any in-progress request before sending the next
    if (abortRef.current) abortRef.current.abort();
    abortRef.current = new AbortController();

    try {
      // CHANGED: hit FastAPI backend on :8000, send ONLY { image }
      const res = await axios.post(
        BACKEND_PREDICT,
        { image: imageData },
        { signal: abortRef.current.signal }
      );

      // NEW: backend returns { label, confidence, state }
      const { label: lbl, confidence: conf, state: st } = res.data;
      setLabel(lbl);
      setConfidence(conf);
      setState(st);

      // NEW: advance when model is confident AND label matches target
      if (
        st === "predicted" &&
        conf >= TARGET_CONF &&
        (lbl || "").toLowerCase() === currentWord.word.toLowerCase()
      ) {
        setSuggestion("");
        goToNextWord();
      } else {
        // (optional) you could request a hint when low confidence here
        // const s = await getGeminiSuggestion(lbl, currentWord.word);
        // setSuggestion(s);
      }
    } catch (err) {
      // ignore abort errors / transient network issues
    }
  };

  // (unchanged) go to next word, but reset live state too
  const goToNextWord = () => {
    setCurrentIndex((prev) => (prev + 1) % WORDS.length);
    setConfidence(0);
    setLabel("—");                 // NEW
    setState("collecting");        // NEW
    setSuggestion("");
  };

  // (unchanged stub) Gemini suggestion — keep or remove as you like
  const getGeminiSuggestion = async (predicted, goal) => {
    try {
      const res = await axios.post("/gemini-suggest", { predicted, goal });
      return res.data.suggestion;
    } catch (err) {
      console.error("Gemini API error:", err);
      return "Try adjusting your hand shape and position.";
    }
  };

  // NEW: quick helper to reset the server’s sequence buffer (optional)
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

  // NEW: small color helper for the state badge
  const stateColor =
    state === "predicted" ? "#16a34a" :      // green-600
    state === "collecting" ? "#ca8a04" :     // yellow-600
    state === "no-hand" ? "#4b5563" :        // gray-600
    "#dc2626";                                // red-600

  return (
     <div className = 'homepage-wrapper'>
        <img src={logo} alt="ASLingo Logo" className="logo" />
          <div className="homepage-container">
          <div className="centered-top-text">
            <h1>Your Dashboard</h1>
          </div>
      <Navbar />
      <Link to="/" className="link-text">
                Logout
      </Link>
      <h1>Learning: {currentWord.word}</h1>

      {/* CHANGED: video now has live overlays for prediction + state */}
      <div style={{ position: "relative", display: "inline-block" }}>
        <video
          ref={webcamRef}
          autoPlay
          playsInline
          width={700}
          height={450}
          style={{ border: "2px solid black", background: "#000", borderRadius: 12 }}
        ></video>

        {/* NEW: prediction overlay (label + confidence) */}
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

        {/* NEW: state badge (collecting/predicted/no-hand/error) */}
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
        {/* CHANGED: removed "Check Gesture" button (streaming is continuous) */}
        <button className="learning-btn">Reset</button>
        <button onClick={() => setShowVideo((prev) => !prev)} className="learning-btn">
        {showVideo ? "Hide" : "Show"} Reference Video
        </button>
      </div>

      {/* (unchanged) Reference Video */}
      {showVideo && (
        <div style={{ marginTop: "10px" }}>
          <video src={currentWord.videoUrl} controls width={300}></video>
        </div>
      )}

      {/* CHANGED: expanded readout to include label + state */}
      <p>
        Predicted: <strong>{label}</strong> — Confidence: {(confidence * 100).toFixed(1)}% — State: {state}
      </p>

      {/* (unchanged) Suggestions UI */}
      {suggestion && (
        <div style={{ marginTop: "20px", border: "1px solid gray", padding: "10px" }}>
          <strong>Suggestion:</strong> {suggestion}
        </div>
      )}
    </div>
  </div>
  );
}
