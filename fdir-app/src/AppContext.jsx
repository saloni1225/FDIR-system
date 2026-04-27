import { createContext, useContext, useState, useEffect, useRef, useCallback } from "react";
import * as ort from "onnxruntime-web";
import { FEATURE_COLS, SENSOR_META, TOP_SENSORS } from "./theme";

const AppCtx = createContext(null);
export const useApp = () => useContext(AppCtx);

// ── FDIR logic ────────────────────────────────────────────────────────────────

function runTMRVoter(s, threshold = 5.0) {
  const agrees = Array.from({ length: 3 }, () => Array(3).fill(false));
  for (let i = 0; i < 3; i++)
    for (let j = 0; j < 3; j++)
      agrees[i][j] = Math.abs(s[i] - s[j]) <= threshold;
  const valid = [false, false, false];
  for (let i = 0; i < 3; i++)
    for (let j = 0; j < 3; j++)
      if (i !== j && agrees[i][j]) valid[i] = true;
  let sum = 0, count = 0;
  const fault = [false, false, false];
  for (let i = 0; i < 3; i++) {
    fault[i] = !valid[i];
    if (valid[i]) { sum += s[i]; count++; }
  }
  if (count === 0) {
    const sorted = [...s].sort((a,b)=>a-b);
    return { fault:[true,true,true], votedValue: sorted[1], faultCount: 3 };
  }
  return { fault, votedValue: sum/count, faultCount: fault.filter(Boolean).length };
}

function getNextState(cur, faultCount, recoveryCycles) {
  if (cur === "SAFE_MODE")   return { state: "SAFE_MODE",   cycles: 0 };
  if (cur === "RECOVERING") {
    const n = recoveryCycles + 1;
    if (n >= 3)       return { state: "SAFE_MODE", cycles: 0 };
    if (faultCount === 0) return { state: "NOMINAL",   cycles: 0 };
    if (faultCount === 1) return { state: "DEGRADED",  cycles: 0 };
    return { state: "SAFE_MODE", cycles: 0 };
  }
  if (faultCount === 0) return { state: "NOMINAL",   cycles: 0 };
  if (faultCount === 1) return { state: "DEGRADED",  cycles: 0 };
  return { state: "SAFE_MODE", cycles: 0 };
}

function applyChaos(sensors, intensity) {
  return sensors.map(v => {
    const r = Math.random();
    if (r < intensity * 0.2) return v + (Math.random()-0.5) * 200;
    if (r < intensity * 0.6) return v + (Math.random()-0.5) * 20;
    return v;
  });
}

// ── Safe Mode confidence guard ────────────────────────────────────────────────
// The model was trained on a dataset where 77% of cycles are SAFE_MODE,
// so it tends to over-predict it. We require SAFE_MODE to appear in
// N consecutive cycles before accepting it, and use TMR voter as a check.
const SAFE_MODE_CONFIRM_CYCLES = 3;

const ts = () => {
  const d = new Date();
  return [d.getHours(),d.getMinutes(),d.getSeconds()].map(n=>String(n).padStart(2,"0")).join(":");
};

export function AppProvider({ children }) {
  const [theme, setTheme]               = useState("light");
  const [page,  setPage]                = useState("dashboard");
  const [modelReady, setModelReady]     = useState(false);
  const [modelError, setModelError]     = useState(null);
  const [sensors, setSensors]           = useState(() => FEATURE_COLS.map(k => (SENSOR_META[k].min + SENSOR_META[k].max) / 2));
  const [state,  setState]              = useState("NOMINAL");
  const [recoveryCycles, setRecovery]   = useState(0);
  const [voter,  setVoter]              = useState({ fault:[false,false,false], votedValue:0, faultCount:0 });
  const [log,    setLog]                = useState([]);
  const [cycle,  setCycle]              = useState(0);
  const [autoRun, setAutoRun]           = useState(true);
  const [chaosActive, setChaosActive]   = useState(false);
  const [chaosIntensity, setChaosInt]   = useState(0.3);
  const [crashReports, setCrashReports] = useState([]);
  const [replayMode, setReplayMode]     = useState(false);
  const [replayQueue, setReplayQueue]   = useState([]);
  const [replayIdx,  setReplayIdx]      = useState(0);
  const [source, setSource]             = useState("voter");

  const sessionRef       = useRef(null);
  const stateRef         = useRef(state);
  const cyclesRef        = useRef(recoveryCycles);
  const sensorsRef       = useRef(sensors);
  const chaosRef         = useRef(chaosActive);
  const safePendingRef   = useRef(0); // consecutive SAFE_MODE predictions counter

  stateRef.current   = state;
  cyclesRef.current  = recoveryCycles;
  sensorsRef.current = sensors;
  chaosRef.current   = chaosActive;

  useEffect(() => {
    async function load() {
      try {
        await fetch("/model_metadata.json");
        sessionRef.current = await ort.InferenceSession.create("/fdir_model.onnx");
        setModelReady(true);
      } catch(e) { setModelError(e.message); }
    }
    load();
  }, []);

  const predict = useCallback(async (vals) => {
    if (!sessionRef.current) return null;
    try {
      const tensor  = new ort.Tensor("float32", new Float32Array(vals), [1, vals.length]);
      const results = await sessionRef.current.run({ float_input: tensor });
      const classes = ["DEGRADED","NOMINAL","SAFE_MODE"];
      const idx     = Number(results.label?.data?.[0] ?? results.output_label?.data?.[0] ?? 0);
      return classes[idx] ?? "NOMINAL";
    } catch { return null; }
  }, []);

  const addLog = useCallback((ns, cycleNum, extras={}) => {
    setLog(l => [...l.slice(-200), { cycle: cycleNum, state: ns, time: ts(), ...extras }]);
  }, []);

  const recordCrash = useCallback((ns, currentSensors, cycleNum, chaos, src) => {
    if (ns === "SAFE_MODE" || ns === "DEGRADED") {
      setCrashReports(r => [...r, {
        state: ns, cycle: cycleNum, time: ts(),
        sensors: [...currentSensors], chaos, source: src,
        topSensors: TOP_SENSORS.slice(0,3)
      }]);
    }
  }, []);

  const tick = useCallback(async (currentSensors) => {
    const effective = chaosRef.current ? applyChaos(currentSensors, chaosRef.current ? 0.3 : 0) : currentSensors;
    setSensors(effective);

    const v = runTMRVoter(effective.slice(0,3));
    setVoter(v);

    let rawPrediction, src;

    if (modelReady) {
      const result = await predict(effective);
      rawPrediction = result ?? getNextState(stateRef.current, v.faultCount, cyclesRef.current).state;
      src = result ? "model" : "voter";
    } else {
      rawPrediction = getNextState(stateRef.current, v.faultCount, cyclesRef.current).state;
      src = "voter";
    }

    // ── Safe Mode confidence guard ──
    // Only accept SAFE_MODE after it appears SAFE_MODE_CONFIRM_CYCLES times in a row.
    // This prevents the model's bias toward SAFE_MODE from causing false positives.
    let ns = rawPrediction;
    if (rawPrediction === "SAFE_MODE") {
      safePendingRef.current += 1;
      if (safePendingRef.current < SAFE_MODE_CONFIRM_CYCLES) {
        // Downgrade to DEGRADED while building confidence
        ns = "DEGRADED";
      }
    } else {
      safePendingRef.current = 0;
    }

    // Don't exit SAFE_MODE via model alone — require reset command
    if (stateRef.current === "SAFE_MODE" && ns !== "RECOVERING") {
      ns = "SAFE_MODE";
    }

    setSource(src);
    setState(ns);
    setCycle(c => {
      const nc = c + 1;
      addLog(ns, nc, { chaos: chaosRef.current, source: src });
      recordCrash(ns, effective, nc, chaosRef.current, src);
      return nc;
    });
  }, [modelReady, predict, addLog, recordCrash]);

  useEffect(() => {
    if (!autoRun || replayMode) return;
    const id = setInterval(() => tick(sensorsRef.current), 1500);
    return () => clearInterval(id);
  }, [autoRun, replayMode, tick]);

  useEffect(() => {
    if (!replayMode || replayQueue.length === 0) return;
    if (replayIdx >= replayQueue.length) { setReplayMode(false); return; }
    const id = setTimeout(async () => {
      await tick(replayQueue[replayIdx].sensors);
      setReplayIdx(i => i+1);
    }, 600);
    return () => clearTimeout(id);
  }, [replayMode, replayQueue, replayIdx, tick]);

  const commandReset = () => {
    if (state === "DEGRADED" || state === "SAFE_MODE") {
      setState("RECOVERING"); setRecovery(0); safePendingRef.current = 0;
    }
  };

  const startReplay = (data) => {
    setReplayQueue(data); setReplayIdx(0); setReplayMode(true); setAutoRun(false);
  };

  const exportLog = () => {
    const blob = new Blob([JSON.stringify(log, null, 2)], { type: "application/json" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob);
    a.download = `fdir_log_${Date.now()}.json`; a.click();
  };

  return (
    <AppCtx.Provider value={{
      theme, setTheme, page, setPage,
      modelReady, modelError, source,
      sensors, setSensors,
      state, setState,
      voter, cycle,
      log, crashReports, setCrashReports,
      autoRun, setAutoRun,
      chaosActive, setChaosActive,
      chaosIntensity, setChaosInt,
      replayMode, setReplayMode, replayIdx, replayQueue,
      commandReset, startReplay, exportLog, tick,
    }}>
      {children}
    </AppCtx.Provider>
  );
}