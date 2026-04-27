# =============================================================================
# combine.py — FIXED label mapping for UCI Hydraulic dataset
#
# THE PROBLEM WITH THE PREVIOUS VERSION:
#   We used stable_flag == 0 as a SAFE_MODE trigger.
#   But stable_flag marks whether TEST CONDITIONS were stable during data
#   collection — NOT whether the machine itself has a fault.
#   This caused ~77% of all cycles to be labelled SAFE_MODE incorrectly.
#
# THE FIX:
#   Only use the actual component health columns:
#     cooler_cond  — cooling efficiency (3=near failure, 20=reduced, 100=full)
#     valve_cond   — valve switching (73=severe, 80=moderate, 90=slight, 100=ok)
#     pump_leak    — internal leakage (0=none, 1=weak, 2=severe)
#     accum_cond   — accumulator pressure (90=near failure, 100-130=ok range)
#   stable_flag is IGNORED for labelling.
# =============================================================================

import pandas as pd
import numpy as np
import os

CSV_DIR = "dataset/csv"
OUT_DIR = "dataset/combined"

SENSOR_FILES = [
    "CE.csv","CP.csv","EPS1.csv",
    "FS1.csv","FS2.csv",
    "PS1.csv","PS2.csv","PS3.csv","PS4.csv","PS5.csv","PS6.csv",
    "SE.csv","TS1.csv","TS2.csv","TS3.csv","TS4.csv","VS1.csv"
]

# ── Load sensor files ─────────────────────────────────────────────────────────
print("Loading sensor files...")
sensor_series = []
for fname in SENSOR_FILES:
    path = os.path.join(CSV_DIR, fname)
    if not os.path.exists(path):
        print(f"  Skipping {fname}")
        continue
    df = pd.read_csv(path, header=0)
    mean_vals = df.mean(axis=1)
    mean_vals.name = fname.replace(".csv","")
    sensor_series.append(mean_vals)
    print(f"  {fname}: {df.shape}")

sensor_df = pd.concat(sensor_series, axis=1)
print(f"\nSensor matrix: {sensor_df.shape}")

# ── Load labels ───────────────────────────────────────────────────────────────
profile = pd.read_csv(os.path.join(CSV_DIR, "profile.csv"), header=0)
profile.columns = ["cooler_cond","valve_cond","pump_leak","accum_cond","stable_flag"]
print(f"Profile matrix: {profile.shape}")
print("\nActual label distributions:")
for col in ["cooler_cond","valve_cond","pump_leak","accum_cond"]:
    print(f"  {col}: {dict(profile[col].value_counts().sort_index())}")

# ── CORRECT label mapping ─────────────────────────────────────────────────────
#
# SAFE_MODE  — component is at or near failure, immediate attention needed
#   pump_leak == 2        : severe internal leakage
#   cooler_cond == 3      : cooler close to total failure
#   valve_cond <= 73      : severe valve fault
#   accum_cond == 90      : accumulator close to failure
#
# DEGRADED   — component showing reduced performance, monitor closely
#   pump_leak == 1        : weak leakage detected
#   cooler_cond == 20     : cooler running at reduced efficiency
#   valve_cond in [80,90] : moderate or slight valve fault
#   accum_cond == 115     : accumulator slightly off optimal
#
# NOMINAL    — all components within healthy operating range
#   pump_leak == 0 AND cooler_cond == 100 AND valve_cond == 100
#   AND accum_cond in [100, 130]
#
# NOTE: stable_flag is deliberately NOT used — it reflects data collection
#       quality, not machine health state.

def to_fdir_state(row):
    # SAFE_MODE: any component at/near failure
    if row["pump_leak"] == 2:       return "SAFE_MODE"
    if row["cooler_cond"] == 3:     return "SAFE_MODE"
    if row["valve_cond"] == 73:     return "SAFE_MODE"
    if row["accum_cond"] == 90:     return "SAFE_MODE"

    # DEGRADED: any component showing reduced performance
    if row["pump_leak"] == 1:       return "DEGRADED"
    if row["cooler_cond"] == 20:    return "DEGRADED"
    if row["valve_cond"] in [80, 90]: return "DEGRADED"
    if row["accum_cond"] == 115:    return "DEGRADED"

    # NOMINAL: everything healthy
    return "NOMINAL"

profile["fdir_state"] = profile.apply(to_fdir_state, axis=1)

print(f"\nFDIR state distribution (FIXED):")
vc = profile["fdir_state"].value_counts()
total = len(profile)
for state, count in vc.items():
    print(f"  {state}: {count} ({count/total*100:.1f}%)")

# ── Combine and save ──────────────────────────────────────────────────────────
final_df = pd.concat([
    sensor_df.reset_index(drop=True),
    profile.reset_index(drop=True)
], axis=1)

os.makedirs(OUT_DIR, exist_ok=True)
final_df.to_csv(os.path.join(OUT_DIR,"hydraulic_combined.csv"), index=False)
print(f"\nSaved: {OUT_DIR}/hydraulic_combined.csv  shape={final_df.shape}")