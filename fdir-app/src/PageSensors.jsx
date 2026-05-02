import { useState } from "react";
import { useApp } from "./AppContext";
import { LIGHT, DARK, FEATURE_COLS, SENSOR_META, GROUP_COLORS, TOP_SENSORS, STATE_COLORS } from "./Theme";

function SensorDetail({ sensorKey, value, t, Theme, onClose }) {
  const meta   = SENSOR_META[sensorKey];
  const pct    = Math.max(0, Math.min(100, ((value - meta.min) / (meta.max - meta.min)) * 100));
  const color  = GROUP_COLORS[meta.group];
  const isTop  = TOP_SENSORS.includes(sensorKey);
  const importanceRank = TOP_SENSORS.indexOf(sensorKey);

  const zones = [
    { label: "Low",    from: 0,   to: 33,  color: "#3b82f6" },
    { label: "Normal", from: 33,  to: 66,  color: "#16a34a" },
    { label: "High",   from: 66,  to: 100, color: "#ef4444" },
  ];
  const zone = zones.find(z => pct >= z.from && pct < z.to) || zones[1];

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.35)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 800, padding: 32 }}
      onClick={onClose}>
      <div style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 16, width: "100%", maxWidth: 460, overflow: "hidden" }}
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div style={{ padding: "20px 24px", borderBottom: `1px solid ${t.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 10, height: 10, borderRadius: "50%", background: color }}/>
            <div>
              <div style={{ fontSize: 16, fontWeight: 600, color: t.text }}>{meta.label}</div>
              <div style={{ fontSize: 11, color: t.textFaint, fontFamily: "'DM Mono', monospace", marginTop: 1 }}>{sensorKey} · {meta.group}</div>
            </div>
          </div>
          <button onClick={onClose} style={{ padding: "6px 12px", fontSize: 12, borderRadius: 7, border: `1px solid ${t.border}`, background: "transparent", color: t.textMuted, cursor: "pointer", fontFamily: "inherit" }}>Close</button>
        </div>

        <div style={{ padding: "24px" }}>
          {/* Big value */}
          <div style={{ textAlign: "center", marginBottom: 24 }}>
            <div style={{ fontSize: 52, fontWeight: 600, color, fontFamily: "'DM Mono', monospace", letterSpacing: "-2px", lineHeight: 1 }}>
              {value.toFixed(2)}
            </div>
            <div style={{ fontSize: 14, color: t.textFaint, marginTop: 6 }}>{meta.unit}</div>
          </div>

          {/* Range bar with zones */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ display: "flex", height: 8, borderRadius: 4, overflow: "hidden", marginBottom: 8 }}>
              {zones.map(z => (
                <div key={z.label} style={{ flex: 1, background: z.color, opacity: zone.label === z.label ? 1 : 0.2, transition: "opacity 0.3s" }}/>
              ))}
            </div>
            <div style={{ position: "relative", height: 16 }}>
              <div style={{ position: "absolute", left: `${pct}%`, transform: "translateX(-50%)", top: 0 }}>
                <div style={{ width: 2, height: 10, background: t.text, borderRadius: 1, margin: "0 auto" }}/>
                <div style={{ fontSize: 10, color: t.text, fontFamily: "'DM Mono', monospace', marginTop: 1, whiteSpace: 'nowrap" }}>{pct.toFixed(0)}%</div>
              </div>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
              <span style={{ fontSize: 10, color: t.textFaint, fontFamily: "'DM Mono', monospace" }}>{meta.min} {meta.unit}</span>
              <span style={{ fontSize: 11, fontWeight: 600, color: zone.color }}>{zone.label} zone</span>
              <span style={{ fontSize: 10, color: t.textFaint, fontFamily: "'DM Mono', monospace" }}>{meta.max} {meta.unit}</span>
            </div>
          </div>

          {/* Meta info */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {[
              ["Group",        meta.group],
              ["Unit",         meta.unit],
              ["Range",        `${meta.min} – ${meta.max}`],
              ["Zone",         zone.label],
              ["Fault rank",   isTop ? `#${importanceRank + 1} key sensor` : "Not in top 5"],
              ["Coverage",     `${pct.toFixed(1)}% of range`],
            ].map(([label, val]) => (
              <div key={label} style={{ background: t.surfaceAlt, borderRadius: 8, padding: "10px 12px" }}>
                <div style={{ fontSize: 10, color: t.textFaint, marginBottom: 2 }}>{label}</div>
                <div style={{ fontSize: 12, color: t.text, fontFamily: "'DM Mono', monospace" }}>{val}</div>
              </div>
            ))}
          </div>

          {isTop && (
            <div style={{ marginTop: 12, padding: "10px 14px", borderRadius: 8, background: "#f59e0b10", border: "1px solid #f59e0b25", fontSize: 12, color: "#d97706" }}>
              ★ This is one of the top {TOP_SENSORS.indexOf(sensorKey) + 1} most important sensors for fault detection in the trained model.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const GROUPS = ["pressure","thermal","flow","electrical","mechanical"];

export default function PageSensors() {
  const { theme, sensors, voter, chaosActive, setChaosActive, chaosIntensity, setChaosInt } = useApp();
  const t = theme === "light" ? LIGHT : DARK;
  const [selected, setSelected] = useState(null);

  return (
    <div style={{ padding: "32px 36px" }}>
      {selected && (
        <SensorDetail
          sensorKey={selected}
          value={sensors[FEATURE_COLS.indexOf(selected)] ?? 0}
          t={t} theme={theme}
          onClose={() => setSelected(null)}
        />
      )}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 600, color: t.text, letterSpacing: "-0.5px" }}>Sensors</h1>
          <p style={{ fontSize: 13, color: t.textMuted, marginTop: 4 }}>Click any sensor card for details · 17 hydraulic channels</p>
        </div>

        {/* Chaos control */}
        <div style={{ background: t.surface, border: `1px solid ${chaosActive ? "#d9770640" : t.border}`, borderRadius: 12, padding: "14px 18px", minWidth: 240, transition: "border-color 0.2s" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: chaosActive ? 12 : 0 }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: t.text }}>⚡ Monte Carlo Chaos</div>
              <div style={{ fontSize: 11, color: t.textFaint, marginTop: 1 }}>Random fault injection</div>
            </div>
            <button onClick={() => setChaosActive(a => !a)} style={{
              padding: "5px 12px", fontSize: 11, borderRadius: 20,
              border: `1px solid ${chaosActive ? "#d9770640" : t.border}`,
              background: chaosActive ? "#d9770615" : "transparent",
              color: chaosActive ? "#d97706" : t.textMuted,
              cursor: "pointer", fontWeight: 500, fontFamily: "inherit"
            }}>{chaosActive ? "Stop" : "Start"}</button>
          </div>
          {chaosActive && (
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 11, color: t.textFaint, minWidth: 56 }}>Intensity</span>
              <input type="range" min={0.05} max={1.0} step={0.05} value={chaosIntensity}
                onChange={e => setChaosInt(parseFloat(e.target.value))}
                style={{ flex: 1, accentColor: "#d97706", height: 3 }}/>
              <span style={{ fontSize: 11, color: "#d97706", minWidth: 30, textAlign: "right", fontFamily: "'DM Mono', monospace" }}>{Math.round(chaosIntensity*100)}%</span>
            </div>
          )}
        </div>
      </div>

      {/* Sensor groups */}
      {GROUPS.map(group => {
        const groupKeys = FEATURE_COLS.filter(k => SENSOR_META[k].group === group);
        if (groupKeys.length === 0) return null;
        const color = GROUP_COLORS[group];
        return (
          <div key={group} style={{ marginBottom: 28 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: color }}/>
              <span style={{ fontSize: 13, fontWeight: 600, color: t.text, textTransform: "capitalize" }}>{group}</span>
              <span style={{ fontSize: 11, color: t.textFaint }}>{groupKeys.length} channels</span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 10 }}>
              {groupKeys.map(key => {
                const idx   = FEATURE_COLS.indexOf(key);
                const meta  = SENSOR_META[key];
                const val   = sensors[idx] ?? 0;
                const pct   = Math.max(0, Math.min(100, ((val - meta.min) / (meta.max - meta.min)) * 100));
                const isTop = TOP_SENSORS.includes(key);
                return (
                  <div key={key} onClick={() => setSelected(key)} style={{
                    background: t.surface,
                    border: `1px solid ${isTop ? color + "35" : t.border}`,
                    borderRadius: 10, padding: "14px 16px",
                    cursor: "pointer", transition: "all 0.15s",
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = color + "60"; e.currentTarget.style.transform = "translateY(-1px)"; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = isTop ? color+"35" : t.border; e.currentTarget.style.transform = "none"; }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                      <div>
                        <div style={{ fontSize: 10, fontFamily: "'DM Mono', monospace", color: t.textFaint, marginBottom: 2 }}>{key}{isTop ? " ★" : ""}</div>
                        <div style={{ fontSize: 11, color: t.textMuted }}>{meta.label}</div>
                      </div>
                    </div>
                    <div style={{ fontSize: 20, fontWeight: 600, color: t.text, fontFamily: "'DM Mono', monospace", marginBottom: 8 }}>
                      {val.toFixed(2)}<span style={{ fontSize: 10, color: t.textFaint, marginLeft: 3, fontWeight: 400 }}>{meta.unit}</span>
                    </div>
                    <div style={{ height: 3, background: t.surfaceAlt, borderRadius: 2, overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: 2, transition: "width 0.3s" }}/>
                    </div>
                    <div style={{ fontSize: 9, color: t.textFaint, marginTop: 5 }}>Click for details</div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}