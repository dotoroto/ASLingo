import cv2
import torch
import numpy as np
import mediapipe as mp
from collections import deque
import joblib
import torch.nn.functional as F

# -------- Settings --------
MAX_FRAMES = 40
NUM_FEATURES = 63
HIDDEN_SIZE = 128   # updated to match training
NUM_LAYERS = 1      # updated to match training

# -------- LSTM Model for small dataset --------
class TinyLSTMModel(torch.nn.Module):
    def __init__(self, input_size, hidden_size, num_layers, num_classes, p_drop=0.4):
        super().__init__()
        self.lstm = torch.nn.LSTM(input_size, hidden_size, num_layers, batch_first=True)
        self.head = torch.nn.Sequential(
            torch.nn.LayerNorm(hidden_size),
            torch.nn.Dropout(p_drop),
            torch.nn.Linear(hidden_size, num_classes)
        )

    def forward(self, x):
        out, _ = self.lstm(x)
        out = out[:, -1, :]
        return self.head(out)

# -------- Load model, class names, and scaler --------
ckpt = torch.load("models/gesture_lstm.pt", map_location="cpu")
class_names = ckpt["class_names"]

print("Loaded class names:", class_names)

model = TinyLSTMModel(NUM_FEATURES, HIDDEN_SIZE, NUM_LAYERS, len(class_names), p_drop=0.4)
model.load_state_dict(ckpt["state_dict"])
model.eval()

scaler = joblib.load("models/scaler.pkl")

# -------- Scaling helper --------
def apply_scale_live(seq):
    T, F = seq.shape
    x = scaler.transform(seq.reshape(-1, F))
    return x.reshape(1, T, F).astype(np.float32)

# -------- MediaPipe + camera loop --------
mp_hands = mp.solutions.hands
hands = mp_hands.Hands(max_num_hands=1, min_detection_confidence=0.7)
mp_draw = mp.solutions.drawing_utils

frame_buffer = deque(maxlen=MAX_FRAMES)
cap = cv2.VideoCapture(0)

while True:
    ret, frame = cap.read()
    if not ret: break

    frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    results = hands.process(frame_rgb)

    if results.multi_hand_landmarks:
        hand = results.multi_hand_landmarks[0]
        coords = []
        for lm in hand.landmark:
            coords.extend([lm.x, lm.y, lm.z])
        frame_buffer.append(coords)
        mp_draw.draw_landmarks(frame, hand, mp_hands.HAND_CONNECTIONS)

        if len(frame_buffer) == MAX_FRAMES:
            seq = np.array(frame_buffer, dtype=np.float32)
            seq = apply_scale_live(seq)
            with torch.no_grad():
                logits = model(torch.tensor(seq))
                probs = F.softmax(logits, dim=1).cpu().numpy()[0]
                pred_idx = probs.argmax()
                label = class_names[pred_idx]

                # Optional: show top probabilities
                top_msg = " | ".join([f"{class_names[i]}:{probs[i]:.2f}" for i in probs.argsort()[::-1]])
                cv2.putText(frame, top_msg[:60], (10, 40), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0,255,0), 2)
                cv2.putText(frame, label, (10, 70), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)

    cv2.imshow("ASL Live Prediction", frame)
    if cv2.waitKey(1) & 0xFF == 27:  # ESC to exit
        break

cap.release()
cv2.destroyAllWindows()