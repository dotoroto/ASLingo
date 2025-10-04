import os
import numpy as np
import pandas as pd
from collections import Counter

# --------- Config ---------
RAW_DATA_DIR = "test_data/raw"
OUTPUT_X = "test_data/X.npy"
OUTPUT_Y = "test_data/Y.npy"  # Capitalized to match training script
MAX_FRAMES = 30  # max number of frames per gesture, pad/truncate to this

# --------- Helper functions ---------
def load_csv(file_path):
    """Load CSV as numpy array (frames x features)."""
    df = pd.read_csv(file_path)
    df_numeric = df.select_dtypes(include=[np.number])
    return df_numeric.to_numpy()

def pad_sequence(seq, max_frames=MAX_FRAMES):
    """Pad or truncate sequence to fixed length."""
    if seq.shape[0] > max_frames:
        # Truncate to max_frames
        return seq[:max_frames]
    elif seq.shape[0] < max_frames:
        # Pad with zeros
        padding = np.zeros((max_frames - seq.shape[0], seq.shape[1]))
        return np.vstack([seq, padding])
    else:
        return seq

# --------- Main processing ---------
X = []
y = []

# Predefined gesture label mapping
gesture_labels = {"hello": 0, "yes": 1, "you": 2, "sorry": 3, "name": 4}

print("="*60)
print("PREPROCESSING ASL GESTURE DATA")
print("="*60)

# Process files in sorted order for consistency
files = sorted([f for f in os.listdir(RAW_DATA_DIR) if f.endswith(".csv")])
print(f"Found {len(files)} CSV files\n")

skipped_files = []
for file_name in files:
    gesture_name = file_name.split("_")[0].lower()
    
    if gesture_name not in gesture_labels:
        print(f"⚠️  Skipping unknown gesture '{gesture_name}' in {file_name}")
        skipped_files.append(file_name)
        continue
    
    try:
        file_path = os.path.join(RAW_DATA_DIR, file_name)
        seq = load_csv(file_path)
        
        # Validate sequence
        if seq.shape[0] == 0:
            print(f"⚠️  Skipping {file_name}: empty sequence")
            skipped_files.append(file_name)
            continue
        
        if seq.shape[1] != 63:
            print(f"⚠️  Skipping {file_name}: expected 63 features, got {seq.shape[1]}")
            skipped_files.append(file_name)
            continue
        
        # Check for NaN or Inf values
        if np.isnan(seq).any() or np.isinf(seq).any():
            print(f"⚠️  Skipping {file_name}: contains NaN or Inf values")
            skipped_files.append(file_name)
            continue
        
        # Pad/truncate to fixed length (NO normalization here - done in training)
        seq = pad_sequence(seq, MAX_FRAMES)
        
        X.append(seq)
        y.append(gesture_labels[gesture_name])
        
        # Print progress
        if len(X) % 10 == 0:
            print(f"Processed {len(X)} samples...")
        
    except Exception as e:
        print(f"❌ Error processing {file_name}: {e}")
        skipped_files.append(file_name)
        continue

# Convert to numpy arrays
X = np.array(X, dtype=np.float32)
y = np.array(y, dtype=np.int64)

# Print statistics
print("\n" + "="*60)
print("PREPROCESSING SUMMARY")
print("="*60)
print(f"Total samples processed: {len(X)}")
print(f"Skipped files: {len(skipped_files)}")
print(f"Data shape: X={X.shape}, Y={y.shape}")

# Class distribution
class_counts = Counter(y)
print("\nClass distribution:")
for gesture_name, label in sorted(gesture_labels.items(), key=lambda x: x[1]):
    count = class_counts[label]
    percentage = (count / len(y)) * 100
    print(f"  {gesture_name.capitalize():10s} (label {label}): {count:3d} samples ({percentage:.1f}%)")

# Check for class imbalance
if class_counts:
    max_count = max(class_counts.values())
    min_count = min(class_counts.values())
    imbalance_ratio = max_count / min_count if min_count > 0 else float('inf')
    
    print(f"\nImbalance ratio: {imbalance_ratio:.2f}x")
    if imbalance_ratio > 2.0:
        print("⚠️  WARNING: Severe class imbalance detected!")
        print("   Consider collecting more data for minority classes")
    elif imbalance_ratio > 1.5:
        print("⚠️  Moderate class imbalance - class weights will help")

# Data quality checks
print("\n" + "="*60)
print("DATA QUALITY CHECKS")
print("="*60)
print(f"Min value: {X.min():.4f}")
print(f"Max value: {X.max():.4f}")
print(f"Mean value: {X.mean():.4f}")
print(f"Std value: {X.std():.4f}")
print(f"Contains NaN: {np.isnan(X).any()}")
print(f"Contains Inf: {np.isinf(X).any()}")

# Save processed arrays
os.makedirs("test_data", exist_ok=True)
np.save(OUTPUT_X, X)
np.save(OUTPUT_Y, y)

print("\n" + "="*60)
print(f"✅ Saved to {OUTPUT_X} and {OUTPUT_Y}")
print("="*60)

if skipped_files:
    print(f"\n⚠️  Skipped {len(skipped_files)} files:")
    for f in skipped_files[:10]:  # Show first 10
        print(f"   - {f}")
    if len(skipped_files) > 10:
        print(f"   ... and {len(skipped_files) - 10} more")

print("\n✅ Preprocessing complete! You can now run train.py")