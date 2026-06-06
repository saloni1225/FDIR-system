# FDIR Engine

**Fault Detection, Isolation & Recovery** — A real-time hydraulic system health monitoring application powered by machine learning and a Deterministic Finite Automaton.

![License](https://img.shields.io/badge/license-MIT-blue) ![React](https://img.shields.io/badge/React-18-61dafb) ![Python](https://img.shields.io/badge/Python-3.13-3776ab) ![Accuracy](https://img.shields.io/badge/Model%20Accuracy-98.6%25-22c55e)

---

## Overview

FDIR Engine is a full-stack systems engineering project that simulates the fault management logic used in aerospace and industrial control systems. It combines a machine learning model trained on real hydraulic sensor data with a classical DFA-based state machine to continuously classify system health in real time.

The core idea is Triple Modular Redundancy (TMR) — a fault-tolerance technique where three independent sensor readings are compared, outliers are isolated, and a "voted" truth value is computed. This voted value feeds into a trained Random Forest classifier which outputs one of three health states: **Nominal**, **Degraded**, or **Safe Mode**.

---

## Architecture

```
UCI Hydraulic Dataset (17 sensors × 2205 cycles)
        ↓
Python preprocessing (combine.py)
  → Mean across 60 timesteps per cycle
  → Component health → FDIR state mapping
        ↓
scikit-learn Random Forest (train.py)
  → 98.6% classification accuracy
  → Feature importance: FS1, PS4, VS1, CE, PS2
        ↓
ONNX export (skl2onnx)
        ↓
React + onnxruntime-web
  → In-browser inference (no backend)
  → DFA state machine
  → Live dashboard, sensor monitoring, replay
```

---

## Features

### Live Dashboard
Real-time system health monitoring with state transitions, key sensor readings, and recent fault events. The DFA transitions automatically based on model predictions.

### Sensor Monitor
All 17 hydraulic channels grouped by type — pressure, thermal, flow, electrical, mechanical. Click any sensor card for a detailed drill-down showing value, zone classification, range, and fault importance rank.

### State Machine
Interactive DFA diagram showing the current active state and transition history. Includes a state distribution chart across the session.

### Sensor Self-Test
Fully independent testing sandbox. Move sliders for 8 key sensors and watch the TMR voter and ML model respond instantly — without affecting the live dashboard. Shows both the voter decision and model prediction side by side.

### Telemetry Replay
Load real hydraulic cycle data from `replay_data.json` or upload a previous session log to replay it through the trained model. Export session logs as JSON for later analysis.

### Black-Box Recorder
Automatically captures a detailed report on every fault transition — sensor readings at time of event, prediction source, whether chaos injection was active, and which sensors were flagged.

### Monte Carlo Chaos
Injects randomised bit-flips and sensor noise across all 17 channels to stress-test the fault detection system at configurable intensity.

### Light / Dark Mode
Full theme support with warm neutrals in light mode and deep neutrals in dark mode.

---

## Dataset

**UCI Hydraulic System Condition Monitoring Dataset**

- 2205 hydraulic test cycles
- 17 sensor channels (pressure, temperature, flow, vibration, efficiency)
- 60 timestep readings per cycle at 1Hz sampling
- Component health labels: cooler condition, valve condition, pump leakage, accumulator condition

Label mapping used in this project:

| Condition | FDIR State |
|---|---|
| Pump leakage severe (2) | SAFE_MODE |
| Cooler near failure (3) | SAFE_MODE |
| Valve severe fault (73) | SAFE_MODE |
| Accumulator near failure (90) | SAFE_MODE |
| Pump weak leakage (1) | DEGRADED |
| Cooler reduced efficiency (20) | DEGRADED |
| Valve moderate/slight fault (80, 90) | DEGRADED |
| All components healthy | NOMINAL |

> Note: `stable_flag` is intentionally excluded from label mapping. It reflects data collection stability, not machine health, and including it caused ~77% of cycles to be incorrectly labelled SAFE_MODE.

---

## Model Performance

| Class | Precision | Recall | F1 |
|---|---|---|---|
| NOMINAL | 0.86 | 0.86 | 0.86 |
| DEGRADED | 0.99 | 0.96 | 0.97 |
| SAFE_MODE | 0.99 | 1.00 | 0.99 |
| **Overall** | | | **98.6%** |

Top 5 sensors by feature importance:
1. FS1 — Flow Sensor 1 (16.2%)
2. PS4 — Pressure Sensor 4 (11.9%)
3. VS1 — Vibration Sensor (10.9%)
4. CE — Cooler Efficiency (9.9%)
5. PS2 — Pressure Sensor 2 (7.9%)

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite |
| Styling | Inline CSS with DM Sans / DM Mono |
| ML Runtime | onnxruntime-web |
| Model Training | scikit-learn (Random Forest) |
| Model Export | skl2onnx |
| Data Processing | pandas, numpy |
| Language | Python 3.13, JavaScript (ES2022) |

---

## Project Structure

```
FDIR/
├── dataset/
│   ├── csv/              # Raw hydraulic sensor CSVs
│   └── combined/         # Processed dataset
├── models/
│   ├── fdir_model.pkl    # Trained sklearn model
│   ├── fdir_model.onnx   # ONNX export for browser
│   ├── scaler.pkl        # Feature scaler
│   ├── model_metadata.json
│   └── replay_data.json  # Sample replay cycles
├── scripts/
│   ├── combine.py        # Data preprocessing + label mapping
│   ├── train.py          # Model training + evaluation
│   └── cnvrtonnx.py      # ONNX export + replay data generation
└── fdir-app/
    ├── public/           # ONNX model + metadata served statically
    └── src/
        ├── App.jsx
        ├── AppContext.jsx    # Global state + FDIR engine logic
        ├── Landing.jsx       # Animated intro page
        ├── Layout.jsx        # Sidebar navigation shell
        ├── theme.js          # Design tokens + sensor metadata
        ├── PageDashboard.jsx
        ├── PageSensors.jsx
        ├── PageStateMachine.jsx
        ├── PageReplay.jsx
        ├── PageCrashReports.jsx
        └── SelfTestPanel.jsx
```

---

## Getting Started

### Prerequisites
- Node.js 18+
- Python 3.10+

### 1. Install Python dependencies
```bash
pip install pandas numpy scikit-learn joblib skl2onnx onnxruntime
```

### 2. Download the dataset
Download the [UCI Hydraulic System dataset](https://archive.ics.uci.edu/dataset/447/condition+monitoring+of+hydraulic+systems) and extract the CSV files into `dataset/csv/`.

### 3. Preprocess and train
```bash
python scripts/combine.py
python scripts/train.py
python scripts/cnvrtonnx.py
```

### 4. Copy model files to React public folder
```bash
copy models\fdir_model.onnx fdir-app\public\
copy models\model_metadata.json fdir-app\public\
copy models\replay_data.json fdir-app\public\
```

### 5. Install and run the React app
```bash
cd fdir-app
npm install
npm run dev
```

Open `http://localhost:5173`

---

## Key Concepts

**Triple Modular Redundancy (TMR)** — A fault-tolerance technique from aerospace engineering where three sensors measure the same value. If one diverges from the other two beyond a threshold, it is flagged as faulty and excluded from the voted output.

**Deterministic Finite Automaton (DFA)** — The state machine that governs system transitions. Each state (NOMINAL, DEGRADED, SAFE_MODE, RECOVERING) has defined transition rules. SAFE_MODE is a latch — it can only be exited via an explicit reset command, modelling the real-world requirement for human intervention in critical failures.

**Confidence gating** — Because the model was trained on an imbalanced dataset (SAFE_MODE is overrepresented), a consecutive-prediction guard requires SAFE_MODE to appear in 3 successive cycles before it is accepted. This prevents false positives from single noisy readings.

---

## Limitations and Known Issues

- The hydraulic dataset has natural class imbalance — NOMINAL cycles are rare (< 2%) compared to DEGRADED and SAFE_MODE, which affects recall for the NOMINAL class.
- The ONNX model runs inference in the browser which adds ~10–50ms latency depending on device.
- The TMR voter operates on the first 3 sensor channels as a proxy. In a real deployment each sensor would have physical redundancy.

---

## License

MIT — free to use, modify, and distribute.
