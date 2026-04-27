import { useApp } from "./AppContext";
import { LIGHT, DARK, STATE_COLORS, FEATURE_COLS, SENSOR_META, TOP_SENSORS } from "./theme";

function StatCard({ label, value, sub, color, t }) {
  return (
    <div style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 12, padding: "18px 20px" }}>
      <div style={{ fontSize: 12, color: t.textFaint, marginBottom: 6, fontWeight: 500 }}>{label}</div>
      <div style={{ fontSize: 26, fontWeight: 600, color: color || t.text, letterSpacing: "-0.5px", fontFamily: "'DM Mono', monospace" }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: t.textFaint, marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

export default function PageDashboard() {
  const { theme, state, cycle, sensors, voter, source, modelReady, log, autoRun, setAutoRun, commandReset, chaosActive, setChaosActive } = useApp();
  const t  = theme === "light" ? LIGHT : DARK;
  const sc = STATE_COLORS[state] || STATE_COLORS.NOMINAL;

  const recentFaults = log.filter(e => e.state !== "NOMINAL").slice(-5).reverse();
  const nominalPct   = log.length > 0 ? Math.round((log.filter(e => e.state === "NOMINAL").length / log.length) * 100) : 100;

  return (
    <div style={{ padding: "32px 36px" }}>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 22, fontWeight: 600, color: t.text, letterSpacing: "-0.5px" }}>Dashboard</h1>
        <p style={{ fontSize: 13, color: t.textMuted, marginTop: 4 }}>Live system health overview — hydraulic fault detection</p>
      </div>

      {/* State banner */}
      <div style={{
        padding: "16px 20px", borderRadius: 12, marginBottom: 24,
        background: theme === "light" ? sc.bg : sc.darkBg,
        border: `1px solid ${theme === "light" ? sc.border : sc.darkBorder}`,
        display: "flex", alignItems: "center", justifyContent: "space-between"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 10, height: 10, borderRadius: "50%", background: sc.color, animation: state === "SAFE_MODE" ? "blink 1s step-end infinite" : "none" }}/>
          <div>
            <div style={{ fontSize: 15, fontWeight: 600, color: sc.color }}>{state.replace("_"," ")}</div>
            <div style={{ fontSize: 12, color: t.textFaint, marginTop: 1 }}>
              {state === "NOMINAL" ? "All systems operating within normal parameters" :
               state === "DEGRADED" ? "One or more sensors reporting anomalous values" :
               state === "SAFE_MODE" ? "Critical fault detected — system locked" :
               "Attempting sensor recovery — monitoring closely"}
            </div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {(state === "DEGRADED" || state === "SAFE_MODE") && (
            <button onClick={commandReset} style={{ padding: "7px 14px", fontSize: 12, borderRadius: 7, border: `1px solid #7c3aed44`, background: "#7c3aed15", color: "#7c3aed", cursor: "pointer", fontWeight: 500 }}>
              Reset command
            </button>
          )}
          <button onClick={() => setAutoRun(a => !a)} style={{ padding: "7px 14px", fontSize: 12, borderRadius: 7, border: `1px solid ${t.border}`, background: t.surface, color: t.textMuted, cursor: "pointer" }}>
            {autoRun ? "Pause" : "Resume"}
          </button>
        </div>
      </div>

      {/* Stat cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 24 }}>
        <StatCard t={t} label="Total Cycles" value={String(cycle).padStart(4,"0")} sub="since session start"/>
        <StatCard t={t} label="Nominal Rate" value={`${nominalPct}%`} sub={`${log.length} cycles evaluated`} color={nominalPct > 80 ? "#16a34a" : "#d97706"}/>
        <StatCard t={t} label="Prediction Source" value={source} sub={modelReady ? "ONNX model active" : "TMR voter fallback"}/>
        <StatCard t={t} label="Key Sensor" value="FS1" sub="highest fault importance"/>
      </div>

      {/* Bottom grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>

        {/* Top sensors */}
        <div style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 12, padding: "20px" }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: t.text, marginBottom: 16 }}>Key Sensor Readings</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {TOP_SENSORS.map((key, i) => {
              const idx   = FEATURE_COLS.indexOf(key);
              const meta  = SENSOR_META[key];
              const val   = sensors[idx] ?? 0;
              const pct   = Math.max(0, Math.min(100, ((val - meta.min) / (meta.max - meta.min)) * 100));
              const color = ["#3b82f6","#10b981","#8b5cf6","#ef4444","#f59e0b"][i];
              return (
                <div key={key}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                    <span style={{ fontSize: 12, color: t.textMuted }}>{meta.label}</span>
                    <span style={{ fontSize: 12, fontFamily: "'DM Mono', monospace", color: t.text, fontWeight: 500 }}>{val.toFixed(2)} {meta.unit}</span>
                  </div>
                  <div style={{ height: 4, background: t.surfaceAlt, borderRadius: 2, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: 2, transition: "width 0.3s" }}/>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent events */}
        <div style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 12, padding: "20px" }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: t.text, marginBottom: 16 }}>Recent Events</div>
          {recentFaults.length === 0 ? (
            <div style={{ fontSize: 12, color: t.textFaint, padding: "20px 0", textAlign: "center" }}>No fault events recorded yet</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {recentFaults.map((e, i) => {
                const sc2 = STATE_COLORS[e.state] || STATE_COLORS.NOMINAL;
                return (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 8, background: t.surfaceAlt }}>
                    <div style={{ width: 7, height: 7, borderRadius: "50%", background: sc2.color, flexShrink: 0 }}/>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 12, fontWeight: 500, color: sc2.color }}>{e.state.replace("_"," ")}</div>
                      <div style={{ fontSize: 11, color: t.textFaint, fontFamily: "'DM Mono', monospace" }}>cycle #{String(e.cycle).padStart(3,"0")} · {e.time}</div>
                    </div>
                    <div style={{ fontSize: 10, color: t.textFaint }}>{e.source}</div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Monte carlo toggle */}
          <div style={{ marginTop: 16, paddingTop: 14, borderTop: `1px solid ${t.border}` }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: 12, fontWeight: 500, color: t.text }}>Monte Carlo Chaos</div>
                <div style={{ fontSize: 11, color: t.textFaint, marginTop: 1 }}>Inject random sensor noise</div>
              </div>
              <button onClick={() => setChaosActive(a => !a)} style={{
                padding: "6px 14px", fontSize: 12, borderRadius: 20,
                border: `1px solid ${chaosActive ? "#d9770640" : t.border}`,
                background: chaosActive ? "#d9770615" : "transparent",
                color: chaosActive ? "#d97706" : t.textMuted,
                cursor: "pointer", fontWeight: 500, transition: "all 0.2s"
              }}>
                {chaosActive ? "Active" : "Inactive"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}