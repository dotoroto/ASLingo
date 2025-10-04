import os
import numpy as np
import pandas as pd

# --------- Config ---------
RAW_DATA_DIR = "test_data/raw"
OUTPUT_X = "test_data/X.npy"
OUTPUT_Y = "test_data/y.npy"
MAX_FRAMES = 40  # max number of frames per gesture, pad/truncate to this

# --------- Helper functions ---------
def load_csv(file_path):
    """Load CSV as numpy array (frames x features)."""
    df = pd.read_csv(file_path)
    df_numeric = df.select_dtypes(include=[np.number])
    return df_numeric.to_numpy()

def normalize(sequence):
    """Normalize coordinates to 0-1 based on min/max per sequence."""
    min_vals = sequence.min(axis=0)
    max_vals = sequence.max(axis=0)
    range_vals = np.where(max_vals - min_vals == 0, 1, max_vals - min_vals)
    return (sequence - min_vals) / range_vals

def pad_sequence(seq, max_frames=MAX_FRAMES):
    """Pad or truncate sequence to fixed length."""
    if seq.shape[0] > max_frames:
        return seq[:max_frames]
    elif seq.shape[0] < max_frames:
        padding = np.zeros((max_frames - seq.shape[0], seq.shape[1]))
        return np.vstack([seq, padding])
    else:
        return seq

# --------- Main processing ---------
X = []
y = []

# Predefined gesture label mapping
gesture_labels = {"hello": 0, "yes": 1, "you": 2}

# Process files in sorted order for consistency
for file_name in sorted(os.listdir(RAW_DATA_DIR)):
    if file_name.endswith(".csv"):
        gesture_name = file_name.split("_")[0].lower()
        if gesture_name not in gesture_labels:
            print(f"Skipping unknown gesture {gesture_name} in {file_name}")
            continue
        
        try:
            seq = load_csv(os.path.join(RAW_DATA_DIR, file_name))
        except Exception as e:
            print(f"Skipping {file_name}: {e}")
            continue
        
        seq = normalize(seq)
        seq = pad_sequence(seq, MAX_FRAMES)
        
        X.append(seq)
        y.append(gesture_labels[gesture_name])

# Save processed arrays
os.makedirs("test_data", exist_ok=True)
np.save(OUTPUT_X, X)
np.save(OUTPUT_Y, y)

print(f"Processed {len(X)} gestures.")
print("Gesture label mapping:", gesture_labels)