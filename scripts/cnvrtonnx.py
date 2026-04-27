import joblib
import json
import pandas as pd
from skl2onnx import convert_sklearn
from skl2onnx.common.data_types import FloatTensorType
from sklearn.pipeline import Pipeline

# ── Load ──────────────────────────────────────────────────────────────────────
model    = joblib.load("models/fdir_model.pkl")
scaler   = joblib.load("models/scaler.pkl")
metadata = json.load(open("models/model_metadata.json"))
n_features = metadata["n_features"]

# ── Convert to ONNX ───────────────────────────────────────────────────────────
pipeline = Pipeline([("scaler", scaler), ("classifier", model)])
initial_type = [("float_input", FloatTensorType([None, n_features]))]
onnx_model = convert_sklearn(pipeline, initial_types=initial_type, target_opset=12)

with open("models/fdir_model.onnx", "wb") as f:
    f.write(onnx_model.SerializeToString())
print("Saved: models/fdir_model.onnx")

# ── Export replay data ────────────────────────────────────────────────────────
df = pd.read_csv("dataset/combined/hydraulic_combined.csv")
feature_cols = metadata["feature_cols"]

sample = df.groupby("fdir_state", group_keys=False).apply(
    lambda x: x.sample(min(len(x), 34), random_state=42)
).reset_index(drop=True)

replay = []
for i in range(len(sample)):
    row = sample.iloc[i]
    replay.append({
        "time": f"T+{i:04d}",
        "sensors": [round(float(row[c]), 4) for c in feature_cols],
        "true_state": str(row["fdir_state"])
    })

with open("models/replay_data.json", "w") as f:
    json.dump(replay, f, indent=2)

print(f"Saved: models/replay_data.json  ({len(replay)} cycles)")
print("\nCopy these to fdir-app/public/:")
print("  models/fdir_model.onnx")
print("  models/model_metadata.json")
print("  models/replay_data.json")