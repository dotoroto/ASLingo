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
BATCH_SIZE = 8
EPOCHS=100
LR = 0.002
HIDDEN_SIZE = 128
NUM_LAYERS = 1
VAL_SPLIT = 0.1
WEIGHT_DECAY = 5e-4
LABEL_SMOOTH = 0.1
PATIENCE = 20
CLIP_NORM = 1.0

DEVICE = "cuda" if torch.cuda.is_available() else "cpu"

# -------- Dataset --------
class GestureDataset(Dataset):
    def __init__(self, X, Y):
        self.X = torch.tensor(X, dtype=torch.float32)
        self.Y = torch.tensor(Y, dtype=torch.long)
    def __len__(self):
        return len(self.X)
    def __getitem__(self, idx):
        return self.X[idx], self.Y[idx]

# -------- Model --------
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
        out, _ = self.lstm(X)
        out = out[:, -1, :]
        return self.head(out)

# -------- Load data --------
X = np.load(RAW_X)
Y = np.load(RAW_Y)
N, T, F = X.shape
num_classes = len(np.unique(Y))

# Stratified split
splitter = StratifiedShuffleSplit(n_splits=1, test_size=VAL_SPLIT, random_state=SEED)
train_idx, val_idx = next(splitter.split(X, Y))
X_train, Y_train = X[train_idx], Y[train_idx]
X_val, Y_val     = X[val_idx],   Y[val_idx]

print("Class distribution in training set:", np.bincount(Y_train))
print("Class distribution in validation set:", np.bincount(Y_val))

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
X_val   = apply_scale(X_val)

# -------- Datasets & Loaders --------
train_ds = GestureDataset(X_train, Y_train)
val_ds   = GestureDataset(X_val, Y_val)
train_loader = DataLoader(train_ds, batch_size=BATCH_SIZE, shuffle=True)
val_loader   = DataLoader(val_ds, batch_size=BATCH_SIZE, shuffle=False)

# -------- Class weights --------
counts = np.bincount(Y_train, minlength=num_classes).astype(np.float32)
inv_freq = 1.0 / (np.log(1.02 + counts))
class_weights = torch.tensor(inv_freq / inv_freq.mean(), dtype=torch.float32, device=DEVICE)

# -------- Initialize model/loss/optimizer --------
model = TinyLSTMModel(F, HIDDEN_SIZE, NUM_LAYERS, num_classes, p_drop=0.4).to(DEVICE)
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
        if train: optimizer.zero_grad(set_to_none=True)
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

for epoch in range(1, EPOCHS + 1):
    tr_loss, tr_acc = run_epoch(train_loader, train=True)
    vl_loss, vl_acc = run_epoch(val_loader, train=False)

    train_losses.append(tr_loss); train_accs.append(tr_acc)
    val_losses.append(vl_loss); val_accs.append(vl_acc)

    if vl_loss < best_val - 1e-4:
        best_val = vl_loss
        best_state = copy.deepcopy(model.state_dict())
        bad_epochs = 0
        improved = True
    else:
        bad_epochs += 1
        improved = False

    print(f"Epoch {epoch}/{EPOCHS} | Train Loss {tr_loss:.4f} | Val Loss {vl_loss:.4f} | "
        f"Train Acc {tr_acc:.4f} | Val Acc {vl_acc:.4f} {'<<' if improved else ''}")

    if bad_epochs >= PATIENCE:
        print(f"Early stopping at epoch {epoch}. Best Val Loss: {best_val:.4f}")
        break

# Restore best model
if best_state is not None:
    model.load_state_dict(best_state)

# -------- Save checkpoint --------
class_names = ["Hello", "Yes", "You"]
torch.save({"state_dict": model.state_dict(), "class_names": class_names}, "models/gesture_lstm.pt")
joblib.dump(scaler, "models/scaler.pkl")
print("✅ Saved small model and scaler")

# -------- Plot metrics --------
plt.figure(figsize=(10,4))
plt.subplot(1,2,1)
plt.plot(train_losses, label="Train Loss")
plt.plot(val_losses, label="Val Loss")
plt.legend()
plt.title("Loss")
plt.subplot(1,2,2)
plt.plot(train_accs, label="Train Acc")
plt.plot(val_accs, label="Val Acc")
plt.legend()
plt.title("Accuracy")
plt.tight_layout()
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
all_true  = np.concatenate(all_true)

cm = confusion_matrix(all_true, all_preds, labels=np.arange(num_classes))
disp = ConfusionMatrixDisplay(cm, display_labels=[str(i) for i in range(num_classes)])
disp.plot(values_format='d')
plt.title("Validation Confusion Matrix")
plt.show()
