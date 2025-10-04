import matplotlib.pyplot as plt
import numpy as np
import torch
import torch.nn as nn
from torch.utils.data import Dataset, DataLoader
from sklearn.model_selection import StratifiedShuffleSplit
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import confusion_matrix, ConfusionMatrixDisplay
import random
import copy
import joblib

# -------- Reproducibility --------
SEED = 42
random.seed(SEED)
np.random.seed(SEED)
torch.manual_seed(SEED)
torch.use_deterministic_algorithms(False)

# -------- Config --------
RAW_X = "test_data/X.npy"   # [N, T, F]
RAW_Y = "test_data/Y.npy"   # [N]
BATCH_SIZE = 4
EPOCHS = 100
LR = 0.0005  # Reduced from 0.001
HIDDEN_SIZE = 64  # Reduced from 128
NUM_LAYERS = 1
VAL_SPLIT = 0.15
WEIGHT_DECAY = 1e-3  # Increased from 5e-4
LABEL_SMOOTH = 0.2  # Increased from 0.1
PATIENCE = 50
CLIP_NORM = 1.0
DROPOUT = 0.5  # Increased from 0.4

# Data augmentation parameters
NOISE_STD = 0.02

DEVICE = "cuda" if torch.cuda.is_available() else "cpu"

# -------- Data Augmentation --------
def augment_time_series(X, noise_std=NOISE_STD):
    """Apply noise augmentation to time series data"""
    X_aug = X.copy()
    
    # Add Gaussian noise
    noise = np.random.normal(0, noise_std, X.shape)
    X_aug = X_aug + noise
    
    # Random scaling per feature
    if np.random.rand() < 0.3:
        scale = np.random.uniform(0.9, 1.1, X.shape[-1])
        X_aug = X_aug * scale
    
    # Random temporal shift (roll the sequence)
    if np.random.rand() < 0.3:
        shift = np.random.randint(-3, 4)
        X_aug = np.roll(X_aug, shift, axis=0)
    
    return X_aug.astype(np.float32)

# -------- Dataset with Augmentation --------
class GestureDataset(Dataset):
    def __init__(self, X, Y, augment=False):
        self.X = X
        self.Y = torch.tensor(Y, dtype=torch.long)
        self.augment = augment
    
    def __len__(self):
        return len(self.X)
    
    def __getitem__(self, idx):
        x = self.X[idx]
        if self.augment:
            x = augment_time_series(x[np.newaxis, :, :])[0]
        x = torch.tensor(x, dtype=torch.float32)
        return x, self.Y[idx]

# -------- Model --------
class TinyLSTMModel(nn.Module):
    def __init__(self, input_size, hidden_size, num_layers, num_classes, p_drop=0.5):
        super().__init__()
        self.lstm = nn.LSTM(input_size, hidden_size, num_layers, 
                           batch_first=True, dropout=0.0 if num_layers == 1 else p_drop)
        self.head = nn.Sequential(
            nn.LayerNorm(hidden_size),
            nn.Dropout(p_drop),
            nn.Linear(hidden_size, num_classes),
        )
    
    def forward(self, X):
        out, _ = self.lstm(X)
        out = out[:, -1, :]
        return self.head(out)

# -------- Load data --------
X = np.load(RAW_X)
Y = np.load(RAW_Y)
N, T, F = X.shape
num_classes = len(np.unique(Y))

print(f"Dataset shape: {X.shape}")
print(f"Number of classes: {num_classes}")

# Stratified split
splitter = StratifiedShuffleSplit(n_splits=1, test_size=VAL_SPLIT, random_state=SEED)
train_idx, val_idx = next(splitter.split(X, Y))
X_train, Y_train = X[train_idx], Y[train_idx]
X_val, Y_val = X[val_idx], Y[val_idx]

print(f"\nClass distribution in training set: {np.bincount(Y_train)}")
print(f"Class distribution in validation set: {np.bincount(Y_val)}")

# -------- Feature scaling --------
scaler = StandardScaler()
X_train_2d = X_train.reshape(-1, F)
scaler.fit(X_train_2d)

def apply_scale(X_in):
    N, T, F_ = X_in.shape
    X2 = X_in.reshape(-1, F_)
    X2 = scaler.transform(X2)
    return X2.reshape(N, T, F_).astype(np.float32)

X_train = apply_scale(X_train)
X_val = apply_scale(X_val)

# -------- Datasets & Loaders --------
train_ds = GestureDataset(X_train, Y_train, augment=True)  # Enable augmentation
val_ds = GestureDataset(X_val, Y_val, augment=False)
train_loader = DataLoader(train_ds, batch_size=BATCH_SIZE, shuffle=True)
val_loader = DataLoader(val_ds, batch_size=BATCH_SIZE, shuffle=False)

# -------- Class weights --------
counts = np.bincount(Y_train, minlength=num_classes).astype(np.float32)
inv_freq = 1.0 / (np.log(1.02 + counts))
class_weights = torch.tensor(inv_freq / inv_freq.mean(), dtype=torch.float32, device=DEVICE)

# -------- Initialize model/loss/optimizer --------
model = TinyLSTMModel(F, HIDDEN_SIZE, NUM_LAYERS, num_classes, p_drop=DROPOUT).to(DEVICE)
criterion = nn.CrossEntropyLoss(label_smoothing=LABEL_SMOOTH, weight=class_weights)
optimizer = torch.optim.AdamW(model.parameters(), lr=LR, weight_decay=WEIGHT_DECAY)

# -------- Training loop --------
best_state = None
best_val = float("inf")
bad_epochs = 0

train_losses, val_losses, train_accs, val_accs = [], [], [], []

def run_epoch(loader, train=True):
    model.train() if train else model.eval()
    total_loss, correct, total = 0, 0, 0
    for xb, yb in loader:
        xb, yb = xb.to(DEVICE), yb.to(DEVICE)
        if train:
            optimizer.zero_grad(set_to_none=True)
        with torch.set_grad_enabled(train):
            out = model(xb)
            loss = criterion(out, yb)
        if train:
            loss.backward()
            nn.utils.clip_grad_norm_(model.parameters(), CLIP_NORM)
            optimizer.step()
        total_loss += loss.item() * xb.size(0)
        preds = out.argmax(dim=1)
        correct += (preds == yb).sum().item()
        total += xb.size(0)
    return total_loss / total, correct / total

print("\n" + "="*80)
print("TRAINING START")
print("="*80)

for epoch in range(1, EPOCHS + 1):
    tr_loss, tr_acc = run_epoch(train_loader, train=True)
    vl_loss, vl_acc = run_epoch(val_loader, train=False)

    train_losses.append(tr_loss)
    train_accs.append(tr_acc)
    val_losses.append(vl_loss)
    val_accs.append(vl_acc)

    if vl_loss < best_val - 1e-4:
        best_val = vl_loss
        best_state = copy.deepcopy(model.state_dict())
        bad_epochs = 0
        improved = True
    else:
        bad_epochs += 1
        improved = False

    print(f"Epoch {epoch:3d}/{EPOCHS} | Train Loss {tr_loss:.4f} | Val Loss {vl_loss:.4f} | "
          f"Train Acc {tr_acc:.4f} | Val Acc {vl_acc:.4f} {'<<' if improved else ''}")

    if bad_epochs >= PATIENCE:
        print(f"\nEarly stopping at epoch {epoch}. Best Val Loss: {best_val:.4f}")
        break

# Restore best model
if best_state is not None:
    model.load_state_dict(best_state)
    print(f"\n✅ Restored best model from validation")

# -------- Save checkpoint --------
class_names = ["Hello", "Yes", "You", "Sorry", "Name"]
torch.save({"state_dict": model.state_dict(), "class_names": class_names}, "models/gesture_lstm.pt")
joblib.dump(scaler, "models/scaler.pkl")
print("✅ Saved model and scaler to models/")

# -------- Plot metrics --------
plt.figure(figsize=(12, 5))

plt.subplot(1, 2, 1)
plt.plot(train_losses, label="Train Loss", linewidth=2)
plt.plot(val_losses, label="Val Loss", linewidth=2)
plt.xlabel("Epoch")
plt.ylabel("Loss")
plt.legend()
plt.title("Loss Curves")
plt.grid(alpha=0.3)

plt.subplot(1, 2, 2)
plt.plot(train_accs, label="Train Acc", linewidth=2)
plt.plot(val_accs, label="Val Acc", linewidth=2)
plt.xlabel("Epoch")
plt.ylabel("Accuracy")
plt.legend()
plt.title("Accuracy Curves")
plt.grid(alpha=0.3)

plt.tight_layout()
plt.savefig("training_curves.png", dpi=150, bbox_inches='tight')
print("✅ Saved training curves to training_curves.png")
plt.show()

# -------- Confusion matrix --------
model.eval()
all_preds, all_true = [], []
with torch.no_grad():
    for xb, yb in val_loader:
        xb, yb = xb.to(DEVICE), yb.to(DEVICE)
        out = model(xb)
        preds = out.argmax(dim=1).cpu().numpy()
        all_preds.append(preds)
        all_true.append(yb.cpu().numpy())

all_preds = np.concatenate(all_preds)
all_true = np.concatenate(all_true)

cm = confusion_matrix(all_true, all_preds, labels=np.arange(num_classes))
disp = ConfusionMatrixDisplay(cm, display_labels=class_names)
disp.plot(values_format='d', cmap='Blues')
plt.title("Validation Confusion Matrix")
plt.savefig("confusion_matrix.png", dpi=150, bbox_inches='tight')
print("✅ Saved confusion matrix to confusion_matrix.png")
plt.show()

# -------- Final Summary --------
print("\n" + "="*80)
print("TRAINING COMPLETE")
print("="*80)
print(f"Best Validation Loss: {best_val:.4f}")
print(f"Final Validation Accuracy: {val_accs[-1]:.4f}")
print(f"Train/Val Accuracy Gap: {train_accs[-1] - val_accs[-1]:.4f}")
print("="*80)