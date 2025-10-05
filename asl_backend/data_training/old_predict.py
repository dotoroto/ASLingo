# app.py
import os, io, base64
from collections import deque
from typing import Optional, Tuple

import cv2
import numpy as np
import pandas as pd
from PIL import Image

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

import torch
import torch.nn as nn
import joblib
import mediapipe as mp

# ========= FastAPI + CORS =========
app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],   # tighten for prod
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ========= Config (MUST match training) =========
INPUT_SIZE = 63                     # 21 hand landmarks * (x,y,z)
# These must match what you trained with; consider saving them in your ckpt next time.
HIDDEN_SIZE = int(os.getenv("ASL_HIDDEN_SIZE", "64"))
NUM_LAYERS  = int(os.getenv("ASL_NUM_LAYERS",  "1"))

# Sequence length T must equal training sequence length
SEQ_LEN = int(os.getenv("ASL_SEQ_LEN", "30"))          # <-- set this to your training T
MIN_FRAMES_TO_PREDICT = SEQ_LEN                         # wait for a full window

MODEL_PATH     = os.getenv("ASL_MODEL_PATH",     "models/gesture_lstm.pt")
SCALER_PATH    = os.getenv("ASL_SCALER_PATH",    "models/scaler.pkl")

DEVICE = "cuda" if torch.cuda.is_available() else "cpu"

# ========= Request/Response =========
class FramePayload(BaseModel):
    image: str  # data URL or raw base64

class PredictResponse(BaseModel):
    label: str
    confidence: float
    state: str  # "collecting" | "predicted" | "no-hand" | "error"

# ========= Model (same as training) =========
class TinyLSTMModel(nn.Module):
    def __init__(self, input_size, hidden_size, num_layers, num_classes, p_drop=0.4):
        super().__init__()
        self.lstm = nn.LSTM(input_size, hidden_size, num_layers, batch_first=True)
        self.head = nn.Sequential(
            nn.LayerNorm(hidden_size),
            nn.Dropout(p_drop),
            nn.Linear(hidden_size, num_classes),
        )
    def forward(self, X):
        out, _ = self.lstm(X)      # [B, T, H]
        out = out[:, -1, :]        # last time step
        return self.head(out)      # [B, C]

# ========= Load scaler, checkpoint, class names once =========
scaler = joblib.load(SCALER_PATH)

ckpt = torch.load(MODEL_PATH, map_location="cpu")
state_dict = ckpt["state_dict"]
class_names = ckpt.get("class_names", None)
if class_names is None:
    # Fallback if not saved (not ideal, but avoids crash)
    num_classes_from_state = state_dict["head.2.weight"].shape[0]
    class_names = [str(i) for i in range(num_classes_from_state)]

num_classes = len(class_names)

model = TinyLSTMModel(
    input_size=INPUT_SIZE,
    hidden_size=HIDDEN_SIZE,
    num_layers=NUM_LAYERS,
    num_classes=num_classes,
    p_drop=0.4,
)
model.load_state_dict(state_dict)
model.to(DEVICE).eval()

softmax = nn.Softmax(dim=1)

# ========= MediaPipe Hands =========
mp_hands = mp.solutions.hands.Hands(
    static_image_mode=False,
    max_num_hands=1,
    min_detection_confidence=0.5,
    min_tracking_confidence=0.5,
)

# ========= Rolling buffer of landmarks =========
# Each element: np.ndarray shape (63,)
landmark_buffer: deque[np.ndarray] = deque(maxlen=SEQ_LEN)

# ========= Helpers =========
def np_from_base64_jpeg(data_url_or_b64: str) -> np.ndarray:
    """Convert base64 (optionally data URL) JPEG to OpenCV BGR numpy image."""
    data = data_url_or_b64.split(",", 1)[1] if "," in data_url_or_b64 else data_url_or_b64
    img_bytes = base64.b64decode(data)
    pil_img = Image.open(io.BytesIO(img_bytes)).convert("RGB")
    np_img = np.array(pil_img)
    return cv2.cvtColor(np_img, cv2.COLOR_RGB2BGR)

def extract_landmarks_bgr(np_bgr: np.ndarray) -> Optional[np.ndarray]:
    """Return flat (63,) landmarks if a hand is found; else None."""
    rgb = cv2.cvtColor(np_bgr, cv2.COLOR_BGR2RGB)
    results = mp_hands.process(rgb)
    if not results.multi_hand_landmarks:
        return None
    hand = results.multi_hand_landmarks[0]
    coords = []
    for lm in hand.landmark:
        coords.extend([lm.x, lm.y, lm.z])
    return np.array(coords, dtype=np.float32)  # (63,)

def predict_from_sequence(buf: deque[np.ndarray]) -> Tuple[str, float, str]:
    """Scale → Tensor → LSTM → Softmax → (label, prob, state)."""
    if len(buf) < MIN_FRAMES_TO_PREDICT:
        return "collecting", 0.0, "collecting"

    # Build (T, F)
    seq = np.stack(list(buf), axis=0)  # (T, 63)

    # Apply the SAME StandardScaler as training: fit on train 2D, transform per-frame
    seq_scaled = scaler.transform(seq)  # still (T, 63)

    # To torch tensor [1, T, F]
    x = torch.tensor(seq_scaled, dtype=torch.float32).unsqueeze(0).to(DEVICE)

    with torch.no_grad():
        logits = model(x)                 # [1, C]
        probs  = softmax(logits)          # [1, C]
        conf, pred_idx = torch.max(probs, dim=1)
        label = class_names[int(pred_idx.item())]
        confidence = float(conf.item())

    return label, confidence, "predicted"

# ========= API routes =========
@app.post("/predict", response_model=PredictResponse)
def predict(payload: FramePayload):
    try:
        np_bgr = np_from_base64_jpeg(payload.image)

        lm = extract_landmarks_bgr(np_bgr)
        if lm is None:
            # optional: gently decay buffer so small gaps don't wipe history
            if len(landmark_buffer) > 0:
                landmark_buffer.popleft()
            return PredictResponse(label="no-hand", confidence=0.0, state="no-hand")

        landmark_buffer.append(lm)  # append newest frame’s landmarks

        label, confidence, state = predict_from_sequence(landmark_buffer)
        return PredictResponse(label=label, confidence=confidence, state=state)

    except Exception as e:
        # print(e)  # uncomment while debugging
        return PredictResponse(label="error", confidence=0.0, state="error")

@app.post("/reset")
def reset_buffer():
    landmark_buffer.clear()
    return {"ok": True, "len": len(landmark_buffer)}

