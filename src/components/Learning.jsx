import React, { useState, useEffect, useRef } from "react";
import axios from "axios";

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
  const [showVideo, setShowVideo] = useState(false);
  const webcamRef = useRef(null);

  const currentWord = WORDS[currentIndex];

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
  }, []);

  // Function to check AI model
  const checkGesture = async () => {
    if (!webcamRef.current) return;

    // Capture current frame as image (optional: adjust size/format)
    const video = webcamRef.current;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const imageData = canvas.toDataURL("image/jpeg");

    try {
      // Call your Python AI model
      const res = await axios.post("http://localhost:5000/predict", {
        image: imageData,
        goalWord: currentWord.word,
      });

      const { topPrediction, confidence } = res.data; // e.g., { topPrediction: "yes", confidence: 0.82 }

      setConfidence(confidence);

      if (confidence >= 0.8) {
        setSuggestion("");
        goToNextWord();
      } else {
        // Call Gemini API for improvement suggestions
        const geminiSuggestion = await getGeminiSuggestion(topPrediction, currentWord.word);
        setSuggestion(geminiSuggestion);
      }
    } catch (err) {
      console.error("Error checking gesture:", err);
    }
  };

  const goToNextWord = () => {
    setCurrentIndex((prev) => (prev + 1) % WORDS.length);
    setConfidence(0);
    setSuggestion("");
  };

  // Stub for Gemini API call
  const getGeminiSuggestion = async (predicted, goal) => {
    // Example API call - replace with real Gemini integration
    try {
      const res = await axios.post("/gemini-suggest", { predicted, goal });
      return res.data.suggestion;
    } catch (err) {
      console.error("Gemini API error:", err);
      return "Try adjusting your hand shape and position.";
    }
  };

  return (
    <div style={{ textAlign: "center", marginTop: "20px" }}>
      <h1>Learning: {currentWord.word}</h1>

      {/* Webcam */}
      <video
        ref={webcamRef}
        autoPlay
        playsInline
        width={400}
        height={300}
        style={{ border: "2px solid black" }}
      ></video>

      <div style={{ marginTop: "10px" }}>
        <button onClick={checkGesture}>Check Gesture</button>
        <button onClick={() => setShowVideo((prev) => !prev)} style={{ marginLeft: "10px" }}>
          {showVideo ? "Hide" : "Show"} Reference Video
        </button>
      </div>

      {/* Reference Video */}
      {showVideo && (
        <div style={{ marginTop: "10px" }}>
          <video src={currentWord.videoUrl} controls width={300}></video>
        </div>
      )}

      {/* Confidence */}
      <p>Confidence: {(confidence * 100).toFixed(1)}%</p>

      {/* Suggestions */}
      {suggestion && (
        <div style={{ marginTop: "20px", border: "1px solid gray", padding: "10px" }}>
          <strong>Suggestion:</strong> {suggestion}
        </div>
      )}
    </div>
  );
}
