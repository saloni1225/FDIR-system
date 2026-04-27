import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import LabelEncoder, StandardScaler
from sklearn.metrics import classification_report, confusion_matrix
import joblib
import json
import os

# ── Load combined dataset ─────────────────────────────────────────────────────
print("Loading dataset...")
df = pd.read_csv("dataset/combined/hydraulic_combined.csv")
print(f"Shape: {df.shape}")
print(f"\nFDIR state distribution:\n{df['fdir_state'].value_counts()}\n")

# ── Features and target ───────────────────────────────────────────────────────
# Drop all label columns, keep only sensor readings
label_cols = ["cooler_cond", "valve_cond", "pump_leak", "accum_cond", "stable_flag", "fdir_state"]
feature_cols = [c for c in df.columns if c not in label_cols]

X = df[feature_cols].values
y = df["fdir_state"].values

print(f"Features: {len(feature_cols)} sensors")
print(f"Feature names: {feature_cols}")

# ── Encode labels ─────────────────────────────────────────────────────────────
# NOMINAL=0, DEGRADED=1, SAFE_MODE=2 (alphabetical by default)
le = LabelEncoder()
y_encoded = le.fit_transform(y)
print(f"\nClass mapping: {dict(zip(le.classes_, le.transform(le.classes_)))}")

# ── Scale features ────────────────────────────────────────────────────────────
scaler = StandardScaler()
X_scaled = scaler.fit_transform(X)

# ── Train / test split ────────────────────────────────────────────────────────
X_train, X_test, y_train, y_test = train_test_split(
    X_scaled, y_encoded, test_size=0.2, random_state=42, stratify=y_encoded
)
print(f"\nTrain: {X_train.shape}  Test: {X_test.shape}")

# ── Train Random Forest ───────────────────────────────────────────────────────
print("\nTraining Random Forest...")
model = RandomForestClassifier(
    n_estimators=200,
    max_depth=15,
    min_samples_leaf=2,
    class_weight="balanced",   # handles class imbalance
    random_state=42,
    n_jobs=-1
)
model.fit(X_train, y_train)

# ── Evaluate ──────────────────────────────────────────────────────────────────
y_pred = model.predict(X_test)
acc = model.score(X_test, y_test)

print(f"\nAccuracy: {acc:.4f} ({acc*100:.1f}%)")
print("\nClassification Report:")
print(classification_report(y_test, y_pred, target_names=le.classes_))
print("Confusion Matrix:")
print(confusion_matrix(y_test, y_pred))

# ── Feature importance ────────────────────────────────────────────────────────
importances = model.feature_importances_
feat_imp = sorted(zip(feature_cols, importances), key=lambda x: -x[1])
print("\nTop 5 most important sensors:")
for name, imp in feat_imp[:5]:
    print(f"  {name}: {imp:.4f}")

# ── Save model and metadata ───────────────────────────────────────────────────
os.makedirs("models", exist_ok=True)

joblib.dump(model, "models/fdir_model.pkl")
joblib.dump(scaler, "models/scaler.pkl")

# Save metadata for the React dashboard
metadata = {
    "feature_cols": feature_cols,
    "classes": le.classes_.tolist(),          # ["DEGRADED", "NOMINAL", "SAFE_MODE"]
    "class_indices": {c: int(i) for c, i in zip(le.classes_, le.transform(le.classes_))},
    "scaler_mean": scaler.mean_.tolist(),
    "scaler_std": scaler.scale_.tolist(),
    "accuracy": float(acc),
    "n_features": len(feature_cols)
}
with open("models/model_metadata.json", "w") as f:
    json.dump(metadata, f, indent=2)

print("\nSaved:")
print("  models/fdir_model.pkl")
print("  models/scaler.pkl")
print("  models/model_metadata.json")
print(f"\nModel ready. Accuracy: {acc*100:.1f}%")