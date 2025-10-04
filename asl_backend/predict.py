import cv2
import torch
import numpy as np
import mediapipe as mp
from collections import deque
import joblib
import torch.nn.functional as F

# -------- Settings --------
MAX_FRAMES = 30
NUM_FEATURES = 63
TRIM_FIRST_FRAMES = 5  # number of frames to remove at start
CONFIDENCE_THRESHOLD = 0.6  # minimum confidence to display prediction

# -------- LSTM Model --------
class TinyLSTMModel(torch.nn.Module):
    def __init__(self, input_size, hidden_size, num_layers, num_classes, p_drop=0.5):
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
print("Loading model...")
ckpt = torch.load("models/gesture_lstm.pt", map_location="cpu")
class_names = ckpt["class_names"]
num_classes = len(class_names)
print(f"✅ Loaded {num_classes} classes:", class_names)

# Get model architecture from checkpoint or use defaults
hidden_size = ckpt.get("hidden_size", 64)  # New default
num_layers = ckpt.get("num_layers", 1)
dropout = ckpt.get("dropout", 0.5)

model = TinyLSTMModel(NUM_FEATURES, hidden_size, num_layers, num_classes, p_drop=dropout)
model.load_state_dict(ckpt["state_dict"])
model.eval()
print(f"✅ Model loaded (hidden={hidden_size}, dropout={dropout})")

scaler = joblib.load("models/scaler.pkl")
print("✅ Scaler loaded")

# -------- Preprocessing helpers --------
def trim_sequence(seq, n=TRIM_FIRST_FRAMES):
    """Remove the first n frames (optional)."""
    return seq[n:] if seq.shape[0] > n else seq

def pad_sequence(seq, max_frames=MAX_FRAMES):
    """Pad or truncate sequence to fixed length."""
    if seq.shape[0] > max_frames:
        return seq[:max_frames]
    elif seq.shape[0] < max_frames:
        padding = np.zeros((max_frames - seq.shape[0], seq.shape[1]))
        return np.vstack([seq, padding])
    else:
        return seq

def preprocess_sequence(seq):
    """Apply the same preprocessing as training."""
    # Trim initial frames
    seq = trim_sequence(seq)
    
    # Pad to fixed length
    seq = pad_sequence(seq, MAX_FRAMES)
    
    # Apply scaler (same as training)
    seq_2d = seq.reshape(-1, NUM_FEATURES)
    seq_scaled = scaler.transform(seq_2d)
    seq = seq_scaled.reshape(MAX_FRAMES, NUM_FEATURES)
    
    return seq.astype(np.float32)

# -------- MediaPipe + camera loop --------
print("\n🎥 Starting camera...")
mp_hands = mp.solutions.hands
hands = mp_hands.Hands(
    max_num_hands=1, 
    min_detection_confidence=0.7,
    min_tracking_confidence=0.5
)
mp_draw = mp.solutions.drawing_utils

frame_buffer = deque(maxlen=MAX_FRAMES)
cap = cv2.VideoCapture(0)

# Set camera resolution
cap.set(cv2.CAP_PROP_FRAME_WIDTH, 1280)
cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 720)

print("✅ Camera ready! Press ESC to exit")
print(f"   Collecting {MAX_FRAMES} frames per prediction")
print(f"   Confidence threshold: {CONFIDENCE_THRESHOLD}")

prediction_history = deque(maxlen=5)  # Smooth predictions over last 5 frames

while True:
    ret, frame = cap.read()
    if not ret:
        break

    # Flip frame for mirror effect
    frame = cv2.flip(frame, 1)
    h, w, _ = frame.shape
    
    frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    results = hands.process(frame_rgb)

    # Draw status bar
    cv2.rectangle(frame, (0, 0), (w, 60), (50, 50, 50), -1)
    buffer_status = f"Buffer: {len(frame_buffer)}/{MAX_FRAMES}"
    cv2.putText(frame, buffer_status, (10, 40), cv2.FONT_HERSHEY_SIMPLEX, 1, (255, 255, 255), 2)

    if results.multi_hand_landmarks:
        hand = results.multi_hand_landmarks[0]
        
        # Extract landmarks
        coords = []
        for lm in hand.landmark:
            coords.extend([lm.x, lm.y, lm.z])
        frame_buffer.append(coords)
        
        # Draw hand landmarks
        mp_draw.draw_landmarks(
            frame, 
            hand, 
            mp_hands.HAND_CONNECTIONS,
            mp_draw.DrawingSpec(color=(0, 255, 0), thickness=2, circle_radius=2),
            mp_draw.DrawingSpec(color=(255, 255, 255), thickness=2)
        )

        # Make prediction when buffer is full
        if len(frame_buffer) == MAX_FRAMES:
            seq = np.array(frame_buffer, dtype=np.float32)
            seq = preprocess_sequence(seq)

            with torch.no_grad():
                x = torch.tensor(seq).unsqueeze(0)
                logits = model(x)
                probs = F.softmax(logits, dim=1).cpu().numpy()[0]
                pred_idx = probs.argmax()
                confidence = probs[pred_idx]
                label = class_names[pred_idx]
                
                # Add to history for smoothing
                prediction_history.append((label, confidence))

            # Get most common prediction from history
            if len(prediction_history) >= 3:
                labels = [p[0] for p in prediction_history]
                most_common = max(set(labels), key=labels.count)
                avg_conf = np.mean([p[1] for p in prediction_history if p[0] == most_common])
            else:
                most_common = label
                avg_conf = confidence

            # Display prediction if confident enough
            if avg_conf >= CONFIDENCE_THRESHOLD:
                # Draw prediction box
                box_h = 150
                cv2.rectangle(frame, (0, h - box_h), (w, h), (0, 200, 0), -1)
                
                # Draw label
                cv2.putText(
                    frame, 
                    most_common, 
                    (20, h - 60), 
                    cv2.FONT_HERSHEY_SIMPLEX, 
                    3, 
                    (255, 255, 255), 
                    5
                )
                
                # Draw confidence
                conf_text = f"Confidence: {avg_conf:.1%}"
                cv2.putText(
                    frame, 
                    conf_text, 
                    (20, h - 20), 
                    cv2.FONT_HERSHEY_SIMPLEX, 
                    1, 
                    (255, 255, 255), 
                    2
                )
            else:
                # Low confidence message
                cv2.putText(
                    frame, 
                    "Low confidence - keep hand steady", 
                    (20, h - 30), 
                    cv2.FONT_HERSHEY_SIMPLEX, 
                    0.8, 
                    (0, 165, 255), 
                    2
                )

            # Show all class probabilities (small text)
            y_offset = 80
            for i in np.argsort(probs)[::-1]:
                prob_text = f"{class_names[i]}: {probs[i]:.2%}"
                color = (0, 255, 0) if i == pred_idx else (200, 200, 200)
                cv2.putText(frame, prob_text, (10, y_offset), cv2.FONT_HERSHEY_SIMPLEX, 0.6, color, 2)
                y_offset += 30
    else:
        # No hand detected
        frame_buffer.clear()
        prediction_history.clear()
        cv2.putText(
            frame, 
            "No hand detected", 
            (20, h - 30), 
            cv2.FONT_HERSHEY_SIMPLEX, 
            1, 
            (0, 0, 255), 
            2
        )

    cv2.imshow("ASL Live Prediction", frame)
    
    key = cv2.waitKey(1) & 0xFF
    if key == 27:  # ESC to exit
        break
    elif key == ord('c'):  # 'c' to clear buffer
        frame_buffer.clear()
        prediction_history.clear()
        print("Buffer cleared")

cap.release()
cv2.destroyAllWindows()
print("\n✅ Camera closed")