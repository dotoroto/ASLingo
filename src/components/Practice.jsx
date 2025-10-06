import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import Navbar from './Navbar';
import logo from "../assets/logo.png";
import { useTranslation } from 'react-i18next';

const BACKEND_PREDICT = "https://aslingorecognitionai.onrender.com/predict";

const WORDS_ENG = ["yes", "you", "hello"];

// Example words and reference video URLs
const WORDS = [
  { word: "yes", videoUrl: "/videos/yes.mp4" },
  { word: "you", videoUrl: "/videos/you.mp4" },
  { word: "hello", videoUrl: "/videos/hello.mp4" },
];

export default function Learning() {
  const { t, i18n } = useTranslation();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [xp, setXp] = useState(0); 
  const [geminiFeedback, setGeminiFeedback] = useState("");

  // Map English words to translated words
  const translatedWords = WORDS_ENG.map((w) => t(`words.${w}`));

  // Get the word from URL (always English)
  const wordParam = searchParams.get("word");
  const targetWord = wordParam
    ? WORDS.find((w) => w.word.toLowerCase() === wordParam.toLowerCase())
    : null;

  // ML state
  const [suggestion, setSuggestion] = useState("");
  const [confidence, setConfidence] = useState(0);
  const [label, setLabel] = useState("—");
  const [state, setState] = useState("collecting");
  const [showVideo, setShowVideo] = useState(false);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [noHandCount, setNoHandCount] = useState(0);
  const [showHelp, setShowHelp] = useState(false);

  const webcamRef = useRef(null);
  const canvasRef = useRef(null);
  const intervalRef = useRef(null);
  const abortRef = useRef(null);
  const TARGET_CONF = 0.8;
  const NO_HAND_THRESHOLD = 10; // Show help after 10 consecutive "no hand" detections

  // Get current word for practice
  const currentWord = targetWord || WORDS[currentWordIndex];

  // Function to go to next word
  const goToNextWord = () => {
    const nextIndex = (currentWordIndex + 1) % WORDS.length;
    setCurrentWordIndex(nextIndex);
    setNoHandCount(0); // Reset counter
    setShowHelp(false);
    navigate(`/practice?word=${WORDS[nextIndex].word}`);
  };

  // Start webcam with optimal settings
  useEffect(() => {
    if (!targetWord) return;

    const startWebcam = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            facingMode: "user"
          } 
        });
        if (webcamRef.current) {
          webcamRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error("Error accessing webcam:", err);
        alert("Cannot access webcam. Please check permissions.");
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

  // Capture and send function
  const captureAndSend = async () => {
    const video = webcamRef.current;
    if (!video || video.videoWidth === 0) {
      return;
    }

    let canvas = canvasRef.current;
    if (!canvas) {
      canvas = document.createElement("canvas");
      canvasRef.current = canvas;
    }

    // Capture at good resolution
    const w = 640;
    const h = Math.round((video.videoHeight / video.videoWidth) * w);
    canvas.width = w;
    canvas.height = h;

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return;
    }
    ctx.drawImage(video, 0, 0, w, h);

    // Use JPEG with high quality for faster transmission
    const imageData = canvas.toDataURL("image/jpeg", 0.9);

    try {
      const res = await axios.post(
        BACKEND_PREDICT,
        { image: imageData },
        { timeout: 8000 }
      );

      const { label: lbl, confidence: conf, state: st } = res.data;
      setLabel(lbl);
      setConfidence(conf);
      setState(st);

      // Track "no-hand" states
      if (st === "no-hand") {
        setNoHandCount(prev => prev + 1);
        if (noHandCount + 1 >= NO_HAND_THRESHOLD) {
          setShowHelp(true);
        }
      } else {
        setNoHandCount(0);
        setShowHelp(false);
      }

      // Update suggestions based on state
      if (st === "no-hand") {
        setSuggestion("No hand detected. Please position your hand in frame.");
      } else if (st === "collecting") {
        setSuggestion("Hold your sign steady...");
      } else if (st === "predicted" && conf < TARGET_CONF) {
        setSuggestion(`Close! Try to make the sign clearer. (${(conf * 100).toFixed(0)}%)`);
        console.log("Requesting Gemini feedback...");
        axios.post("/api/gemini-feedback", {
  label: lbl,
  confidence: conf,
  targetWord: currentWord.word
})
.then(r => setGeminiFeedback(r.data.feedback))
.catch(err => console.error("Gemini feedback error:", err));


      } else {
        setSuggestion("");
      }

      // Success condition
      if (
        st === "predicted" &&
        conf >= TARGET_CONF &&
        (lbl || "").toLowerCase() === currentWord.word.toLowerCase()
      ) {
        setSuggestion("✓ Correct! Moving to next word...");
        setXp(prev => {
    const newXp = prev + 10;
    localStorage.setItem("xp", newXp); // persist locally
    return newXp;
  });
        setTimeout(() => {
          goToNextWord();
        }, 1000);
      }
    } catch (err) {
      if (err.code === 'ECONNABORTED') {
        console.warn("Request timeout - backend may be slow");
      } else {
        console.error("Prediction error:", err);
      }
    }
  };

  // Continuous polling
  useEffect(() => {
    if (!targetWord) return;

    if (intervalRef.current) clearInterval(intervalRef.current);

    captureAndSend();
    intervalRef.current = setInterval(captureAndSend, 400);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = null;
    };
  }, [targetWord]);

  const stateColor =
    state === "predicted" ? "#16a34a" :
    state === "collecting" ? "#ca8a04" :
    state === "no-hand" ? "#4b5563" :
    "#dc2626";

  if (!targetWord) {
    return (
      <div className="homepage-wrapper">
        <img src={logo} alt="ASLingo Logo" className="logo" />
        <div className="homepage-container">
          <div className="centered-top-text">
            <h1>{t("practice.selectWord")}</h1>
          </div>
          <Navbar />
          <Link to="/" className="link-text">{t("practice.logout") || "Logout"}</Link>
        </div>

        <div className="content_wrapper">
          <ul style={{ listStyle: "none", padding: 0 }}>
            {translatedWords.map((translated, idx) => (
              <li key={WORDS_ENG[idx]} style={{ margin: "8px 0" }}>
                <button
                  className="learning-btn"
                  onClick={() => navigate(`/practice?word=${WORDS_ENG[idx]}`)}
                >
                  {translated}
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
        <Link to="/practice" className="link-text">{t("practice.back") || "Back"}</Link>
      </div>

      <div className="content_wrapper">
        <h1>{t("practice.practice")} "{t(`words.${targetWord.word}`)}"</h1>

        {/* Help message for persistent no-hand detection */}
        {showHelp && (
          <div style={{
            background: "#fef3c7",
            border: "2px solid #f59e0b",
            padding: "15px",
            marginBottom: "15px",
            borderRadius: "8px"
          }}>
            <strong>💡 Tips for better detection:</strong>
            <ul style={{ marginTop: "8px", marginBottom: "0" }}>
              <li>Ensure good lighting on your hand</li>
              <li>Use a plain, contrasting background</li>
              <li>Position your hand clearly in the center of the frame</li>
              <li>Avoid cluttered or busy backgrounds</li>
              <li>Keep your hand fully visible (no parts cut off)</li>
            </ul>
            <button 
              onClick={() => setShowHelp(false)}
              style={{ marginTop: "10px", padding: "5px 15px", fontSize: "12px" }}
            >
              Got it
            </button>
          </div>
        )}

        <div style={{ position: "relative", display: "inline-block" }}>
          <video
            ref={webcamRef}
            autoPlay
            playsInline
            muted
            width={700}
            height={450}
            style={{ border: "2px solid black", background: "#000", borderRadius: 12 }}
          ></video>

          {/* Hand detection guide overlay */}
          {state === "no-hand" && (
            <div style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              color: "#fff",
              fontSize: "24px",
              textAlign: "center",
              background: "rgba(0,0,0,0.7)",
              padding: "20px",
              borderRadius: "12px",
              pointerEvents: "none"
            }}>
              👋<br />
              Show your hand
            </div>
          )}

          <div style={{
            position: "absolute", left: 12, bottom: 12,
            background: "rgba(0,0,0,0.7)", color: "#fff",
            padding: "8px 10px", borderRadius: 10, textAlign: "left"
          }}>
            <div style={{ fontSize: 12, opacity: 0.8 }}>Prediction</div>
            <div style={{ fontSize: 18, fontWeight: 700 }}>
              {label} <span style={{ opacity: 0.8 }}>({confidence.toFixed(2)})</span>
            </div>
          </div>

          <div style={{
            position: "absolute", right: 12, bottom: 12,
            padding: "6px 10px", color: "#fff",
            borderRadius: 6, background: stateColor,
            fontSize: 12, textTransform: "capitalize",
            fontWeight: 600
          }}>
            {state}
          </div>
        </div>

        {showVideo && (
          <div style={{ marginTop: "15px" }}>
            <h3>Reference Video</h3>
            <video src={targetWord.videoUrl} controls width={300} style={{ borderRadius: "8px" }}></video>
          </div>
        )}

        {/* Live feedback */}
        {suggestion && (
          <div style={{ 
            marginTop: "15px", 
            padding: "12px", 
            background: suggestion.includes("✓") ? "#d1fae5" : "#fef3c7",
            border: `2px solid ${suggestion.includes("✓") ? "#10b981" : "#f59e0b"}`,
            borderRadius: "8px",
            fontSize: "16px"
          }}>

            <strong>{suggestion}</strong>
            {geminiFeedback && (
  <div style={{
    marginTop: "15px",
    padding: "12px",
    background: "#e0f2fe",
    border: "2px solid #0284c7",
    borderRadius: "8px",
    fontSize: "15px"
  }}>
    💡 {geminiFeedback}
  </div>
)}
          </div>
        )}

        <div style={{ marginTop: "20px" }}>
          <button
            onClick={() => setShowVideo(!showVideo)}
            style={{ 
              padding: "10px 20px", 
              marginRight: "10px",
              background: "#3b82f6",
              color: "#fff",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer"
            }}
          >
            {showVideo ? "Hide Reference Video" : "Show Reference Video"}
          </button>

          <button
            onClick={() => navigate("/practice")}
            style={{ 
              padding: "10px 20px",
              background: "#6b7280",
              color: "#fff",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer"
            }}
          >
            Choose Different Word
          </button>
        </div>
      </div>
    </div>
  );
}