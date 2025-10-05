import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Navbar from './Navbar';
import { Link } from 'react-router-dom';
import logo from "../assets/logo.png";

const BACKEND_PREDICT = "https://aslingorecognitionai.onrender.com/predict";

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
  const [label, setLabel] = useState("—");
  const [state, setState] = useState("collecting");
  const [showVideo, setShowVideo] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const webcamRef = useRef(null);
  const canvasRef = useRef(null);
  const intervalRef = useRef(null);

  const currentWord = WORDS[currentIndex];
  const navigate = useNavigate();
  const TARGET_CONF = 0.8;

  const goToDashboard = () => {
    navigate("/dashboard");
  };

  // Start webcam with optimal settings
  useEffect(() => {
    const startWebcam = async () => {
      if (navigator.mediaDevices.getUserMedia) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: {
              width: { ideal: 1280 },
              height: { ideal: 720 },
              facingMode: "user",
            }
          });
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
    };
  }, []);

  // Continuous polling - restart when the target word changes
  useEffect(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    captureAndSend();
    intervalRef.current = window.setInterval(captureAndSend, 250);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [currentIndex]);

  const captureAndSend = async () => {
    if (isProcessing) {
      console.log("⏭️ Skipping - previous request still processing");
      return;
    }

    const video = webcamRef.current;
    if (!video || video.videoWidth === 0) {
      console.log("❌ No video ready");
      return;
    }

    setIsProcessing(true);

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
      setIsProcessing(false);
      return;
    }
    ctx.drawImage(video, 0, 0, w, h);

    // Use PNG for better quality (no compression artifacts)
    const imageData = canvas.toDataURL("image/png");

    try {
      const res = await axios.post(
        BACKEND_PREDICT,
        { image: imageData },
        { timeout: 5000 }
      );

      console.log("Response:", res.data);

      const { label: lbl, confidence: conf, state: st } = res.data;
      setLabel(lbl);
      setConfidence(conf);
      setState(st);

      if (
        st === "predicted" &&
        conf >= TARGET_CONF &&
        (lbl || "").toLowerCase() === currentWord.word.toLowerCase()
      ) {
        setSuggestion("");
        goToNextWord();
      }
    } catch (err) {
      console.error("Prediction error:", err);
    } finally {
      setIsProcessing(false);
    }
  };

  const goToNextWord = () => {
    setCurrentIndex((prev) => (prev + 1) % WORDS.length);
    setConfidence(0);
    setLabel("—");
    setState("collecting");
    setSuggestion("");
  };

  const stateColor =
    state === "predicted" ? "#16a34a" :
    state === "collecting" ? "#ca8a04" :
    state === "no-hand" ? "#4b5563" :
    "#dc2626";

  return (
    <div className='homepage-wrapper'>
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

        <div style={{ position: "relative", display: "inline-block" }}>
          <video
            ref={webcamRef}
            autoPlay
            playsInline
            width={700}
            height={450}
            style={{ border: "2px solid black", background: "#000", borderRadius: 12 }}
          ></video>

          {/* Prediction overlay */}
          <div
            style={{
              position: "absolute",
              left: 12,
              bottom: 12,
              background: "rgba(0,0,0,0.75)",
              color: "#fff",
              padding: "10px 12px",
              borderRadius: 10,
              textAlign: "left",
              backdropFilter: "blur(4px)",
            }}
          >
            <div style={{ fontSize: 12, opacity: 0.8 }}>Prediction</div>
            <div style={{ fontSize: 20, fontWeight: 700 }}>
              {label} <span style={{ opacity: 0.8, fontSize: 16 }}>({(confidence * 100).toFixed(0)}%)</span>
            </div>
          </div>

          {/* State badge */}
          <div
            style={{
              position: "absolute",
              right: 12,
              bottom: 12,
              padding: "6px 10px",
              color: "#fff",
              borderRadius: 6,
              background: stateColor,
              fontSize: 12,
              fontWeight: 600,
              textTransform: "capitalize",
            }}
          >
            {state.replace("-", " ")}
          </div>

          {/* Tip for no hand detected */}
          {state === "no-hand" && (
            <div
              style={{
                position: "absolute",
                top: 12,
                left: "50%",
                transform: "translateX(-50%)",
                background: "rgba(220, 38, 38, 0.9)",
                color: "#fff",
                padding: "8px 16px",
                borderRadius: 8,
                fontSize: 14,
                fontWeight: 500,
              }}
            >
              💡 Tip: Show your hand clearly with good lighting
            </div>
          )}

          {/* Hand placement guide */}
          {state === "no-hand" && (
            <div style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              width: "60%",
              height: "70%",
              border: "3px dashed rgba(255,255,255,0.5)",
              borderRadius: "12px",
              pointerEvents: "none"
            }}>
              <div style={{
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                color: "white",
                fontSize: "18px",
                textAlign: "center",
                background: "rgba(0,0,0,0.7)",
                padding: "12px 20px",
                borderRadius: "8px"
              }}>
                👋 Place your hand here
              </div>
            </div>
          )}
        </div>

        {showVideo && (
          <div style={{ marginTop: "10px" }}>
            <video src={currentWord.videoUrl} controls width={300}></video>
          </div>
        )}

        <p>
          Predicted: <strong>{label}</strong> — Confidence: {(confidence * 100).toFixed(1)}% — State: {state}
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