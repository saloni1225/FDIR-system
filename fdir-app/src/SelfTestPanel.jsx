import { useState } from "react";
import { useApp } from "./AppContext";
import { LIGHT, DARK, FEATURE_COLS, SENSOR_META } from "./theme";

const SCENARIOS = [
  {
    id: "nominal", label: "All nominal", desc: "All sensors in healthy range", icon: "✓", color: "#16a34a",
    values: () => FEATURE_COLS.map(k => SENSOR_META[k].min + (SENSOR_META[k].max - SENSOR_META[k].min) * 0.5)
  },
  {
    id: "flow-fault", label: "Flow fault", desc: "FS1 drops to near zero", icon: "△", color: "#d97706",
    values: () => FEATURE_COLS.map(k => k === "FS1" ? SENSOR_META[k].min + (SENSOR_META[k].max - SENSOR_META[k].min) * 0.05 : SENSOR_META[k].min + (SENSOR_META[k].max - SENSOR_META[k].min) * 0.5)
  },
  {
    id: "overheat", label: "Overheat", desc: "Temperature sensors spike", icon: "🌡", color: "#ef4444",
    values: () => FEATURE_COLS.map(k => k.startsWith("TS") ? SENSOR_META[k].max * 0.95 : SENSOR_META[k].min + (SENSOR_META[k].max - SENSOR_META[k].min) * 0.5)
  },
  {
    id: "pressure-drop", label: "Pressure loss", desc: "PS1 drops critically", icon: "↓", color: "#ef4444",
    values: () => FEATURE_COLS.map(k => k === "PS1" ? SENSOR_META[k].min + (SENSOR_META[k].max - SENSOR_META[k].min) * 0.04 : SENSOR_META[k].min + (SENSOR_META[k].max - SENSOR_META[k].min) * 0.5)
  },
];

export default function SelfTestPanel() {
  const { theme, setSensors, state, autoRun, setAutoRun } = useApp();
  const t = theme === "light" ? LIGHT : DARK;

  const [manualMode, setManualMode]         = useState(false);
  const [manualVals, setManualVals]         = useState(() => FEATURE_COLS.map(k => (SENSOR_META[k].min + SENSOR_META[k].max) / 2));
  const [activeScenario, setActiveScenario] = useState(null);

  const applyScenario = (scenario) => {
    setSensors(scenario.values());
    setManualVals(scenario.values());
    setActiveScenario(scenario.id);
    if (autoRun) setAutoRun(false);
  };

  const applyManual = () => {
    setSensors([...manualVals]);
    setActiveScenario(null);
    if (autoRun) setAutoRun(false);
    console.log("Applying manual values:", manualVals);
  };

  const resume = () => {
    setAutoRun(true);
    setActiveScenario(null);
  };

  return (
    <div style={{ padding: "32px 36px" }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 22, fontWeight: 600, color: t.text, letterSpacing: "-0.5px" }}>Test Sensors</h1>
        <p style={{ fontSize: 13, color: t.textMuted, marginTop: 4 }}>
          Inject preset fault scenarios or manually set sensor values to see how the FDIR engine responds
        </p>
      </div>

      {/* Status bar */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", borderRadius: 10, background: t.surfaceAlt, border: `1px solid ${t.border}`, marginBottom: 24 }}>
        <div style={{ fontSize: 12, color: t.textMuted }}>Current state:</div>
        <div style={{ fontSize: 12, fontWeight: 600, color: t.text }}>{state.replace("_", " ")}</div>
        <div style={{ marginLeft: "auto", fontSize: 12, color: t.textFaint }}>
          {autoRun ? "⏵ Auto-running" : "⏸ Paused — manual mode"}
        </div>
      </div>

      <div style={{ maxWidth: 560 }}>
        {/* Tabs */}
        <div style={{ display: "flex", borderBottom: `1px solid ${t.border}`, marginBottom: 20 }}>
          {["Scenarios", "Manual"].map(tab => (
            <button key={tab} onClick={() => setManualMode(tab === "Manual")} style={{
              padding: "10px 20px", fontSize: 13, border: "none", background: "transparent",
              fontWeight: manualMode === (tab === "Manual") ? 600 : 400,
              color: manualMode === (tab === "Manual") ? t.text : t.textFaint,
              cursor: "pointer", fontFamily: "inherit",
              borderBottom: `2px solid ${manualMode === (tab === "Manual") ? t.accent : "transparent"}`,
              transition: "all 0.15s"
            }}>{tab}</button>
          ))}
        </div>

        {/* Scenario presets */}
        {!manualMode && (
          <div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
              {SCENARIOS.map(s => (
                <button key={s.id} onClick={() => applyScenario(s)} style={{
                  padding: "16px 14px", borderRadius: 12, cursor: "pointer", textAlign: "left",
                  border: `1px solid ${activeScenario === s.id ? s.color + "50" : t.border}`,
                  background: activeScenario === s.id ? s.color + "12" : t.surface,
                  transition: "all 0.15s", fontFamily: "inherit"
                }}
                onMouseEnter={e => { if (activeScenario !== s.id) e.currentTarget.style.borderColor = s.color + "40"; }}
                onMouseLeave={e => { if (activeScenario !== s.id) e.currentTarget.style.borderColor = t.border; }}>
                  <div style={{ fontSize: 20, marginBottom: 8 }}>{s.icon}</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: activeScenario === s.id ? s.color : t.text, marginBottom: 4 }}>{s.label}</div>
                  <div style={{ fontSize: 11, color: t.textFaint, lineHeight: 1.5 }}>{s.desc}</div>
                  {activeScenario === s.id && (
                    <div style={{ marginTop: 8, fontSize: 10, color: s.color, fontWeight: 600 }}>● ACTIVE</div>
                  )}
                </button>
              ))}
            </div>
            <button onClick={resume} style={{
              width: "100%", padding: "11px 0", fontSize: 13, borderRadius: 10,
              border: `1px solid ${t.border}`, background: "transparent",
              color: t.textMuted, cursor: "pointer", fontFamily: "inherit"
            }}>↺ Resume auto-run</button>
          </div>
        )}

        {/* Manual sliders */}
        {manualMode && (
          <div>
            <div style={{ fontSize: 12, color: t.textFaint, marginBottom: 16 }}>
              Adjust the 5 most important sensors identified by the trained model
            </div>
            {["FS1","PS4","VS1","CE","PS2"].map(key => {
              const idx  = FEATURE_COLS.indexOf(key);
              const meta = SENSOR_META[key];
              const val  = manualVals[idx] ?? meta.min;
              const pct  = ((val - meta.min) / (meta.max - meta.min)) * 100;
              return (
                <div key={key} style={{ marginBottom: 20 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                    <span style={{ fontSize: 13, color: t.text, fontWeight: 500 }}>{meta.label}</span>
                    <span style={{ fontSize: 13, fontFamily: "'DM Mono', monospace", color: t.text }}>
                      {val.toFixed(2)} <span style={{ color: t.textFaint, fontSize: 11 }}>{meta.unit}</span>
                    </span>
                  </div>
                  <input type="range"
                    min={meta.min} max={meta.max} step={(meta.max - meta.min) / 100}
                    value={val}
                    onChange={e => {
                      const n = [...manualVals];
                      n[idx] = parseFloat(e.target.value);
                      setManualVals(n);
                    }}
                    style={{ width: "100%", accentColor: t.accent, height: 3, marginBottom: 6 }}
                  />
                  <div style={{ height: 3, background: t.surfaceAlt, borderRadius: 2, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${pct}%`, background: t.accent, borderRadius: 2, transition: "width 0.1s" }}/>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
                    <span style={{ fontSize: 10, color: t.textFaint, fontFamily: "'DM Mono', monospace" }}>{meta.min}</span>
                    <span style={{ fontSize: 10, color: t.textFaint, fontFamily: "'DM Mono', monospace" }}>{meta.max} {meta.unit}</span>
                  </div>
                </div>
              );
            })}
            <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
              <button onClick={applyManual} style={{
                flex: 2, padding: "11px 0", fontSize: 13, borderRadius: 10,
                border: `1px solid ${t.accent}40`, background: t.accent + "15",
                color: t.accent, cursor: "pointer", fontWeight: 600, fontFamily: "inherit"
              }}>Apply values</button>
              <button onClick={resume} style={{
                flex: 1, padding: "11px 0", fontSize: 13, borderRadius: 10,
                border: `1px solid ${t.border}`, background: "transparent",
                color: t.textMuted, cursor: "pointer", fontFamily: "inherit"
              }}>Auto</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}