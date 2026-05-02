import { useState } from "react";
import { useApp } from "./AppContext";
import { LIGHT, DARK, STATE_COLORS, FEATURE_COLS, SENSOR_META } from "./Theme";

function ReportDetail({ report, onClose, theme }) {
  // theme passed explicitly — fixes the blank screen crash
  const t  = theme === "light" ? LIGHT : DARK;
  const sc = STATE_COLORS[report.state] || STATE_COLORS.NOMINAL;

  return (
    <div
      onClick={onClose}
      style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.4)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:1000, padding:32 }}>
      <div
        onClick={e => e.stopPropagation()}
        style={{ background:t.surface, border:`1px solid ${t.border}`, borderRadius:16, width:"100%", maxWidth:520, maxHeight:"80vh", overflow:"hidden", display:"flex", flexDirection:"column" }}>

        {/* Header */}
        <div style={{ padding:"18px 24px", borderBottom:`1px solid ${t.border}`, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <div>
            <div style={{ fontSize:14, fontWeight:600, color:t.text }}>Crash Report</div>
            <div style={{ fontSize:11, color:t.textFaint, marginTop:2, fontFamily:"'DM Mono',monospace" }}>{report.time} · cycle #{report.cycle}</div>
          </div>
          <button onClick={onClose} style={{ padding:"6px 14px", fontSize:12, borderRadius:8, border:`1px solid ${t.border}`, background:"transparent", color:t.textMuted, cursor:"pointer", fontFamily:"inherit" }}>
            Close
          </button>
        </div>

        <div style={{ overflowY:"auto", padding:"20px 24px" }}>
          {/* State badge */}
          <div style={{ padding:"12px 16px", borderRadius:10, marginBottom:16, background:theme==="light" ? sc.bg : sc.darkBg, border:`1px solid ${theme==="light" ? sc.border : sc.darkBorder}` }}>
            <div style={{ fontSize:11, color:sc.color, fontWeight:600, marginBottom:4 }}>TRIGGER STATE</div>
            <div style={{ fontSize:20, fontWeight:600, color:sc.color }}>{report.state.replace("_"," ")}</div>
          </div>

          {/* Meta grid */}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:16 }}>
            {[
              ["Cycle",            `#${report.cycle}`],
              ["Prediction source", report.source || "—"],
              ["Chaos active",      report.chaos ? "Yes" : "No"],
              ["Key sensors",       report.topSensors?.join(", ") || "—"],
            ].map(([label, value]) => (
              <div key={label} style={{ background:t.surfaceAlt, borderRadius:8, padding:"10px 12px" }}>
                <div style={{ fontSize:10, color:t.textFaint, marginBottom:3 }}>{label}</div>
                <div style={{ fontSize:12, color:t.text, fontFamily:"'DM Mono',monospace" }}>{value}</div>
              </div>
            ))}
          </div>

          {/* Sensor readings */}
          <div style={{ fontSize:13, fontWeight:600, color:t.text, marginBottom:10 }}>Sensor readings at fault</div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8 }}>
            {FEATURE_COLS.slice(0,9).map((key, i) => {
              const val  = report.sensors?.[i];
              const meta = SENSOR_META[key];
              return (
                <div key={key} style={{ background:t.surfaceAlt, borderRadius:6, padding:"8px 10px" }}>
                  <div style={{ fontSize:9, color:t.textFaint, marginBottom:2 }}>{key}</div>
                  <div style={{ fontSize:12, fontFamily:"'DM Mono',monospace", color:t.text }}>
                    {val != null ? val.toFixed(2) : "—"}
                    <span style={{ fontSize:9, color:t.textFaint, marginLeft:3 }}>{meta?.unit}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {report.chaos && (
            <div style={{ marginTop:14, padding:"10px 14px", borderRadius:8, background:"#d9770610", border:"1px solid #d9770625", fontSize:12, color:"#d97706" }}>
              ⚡ Monte Carlo chaos was active at time of this event.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function PageCrashReports() {
  const { theme, crashReports } = useApp();
  const t = theme === "light" ? LIGHT : DARK;
  const [selected, setSelected] = useState(null);

  const safeModeCount = crashReports.filter(r => r.state === "SAFE_MODE").length;
  const degradedCount = crashReports.filter(r => r.state === "DEGRADED").length;
  const chaosCount    = crashReports.filter(r => r.chaos).length;

  return (
    <div style={{ padding:"32px 36px" }}>
      {/* Modal — theme passed explicitly to avoid reference error */}
      {selected && (
        <ReportDetail
          report={selected}
          theme={theme}
          onClose={() => setSelected(null)}
        />
      )}

      <div style={{ marginBottom:28 }}>
        <h1 style={{ fontSize:22, fontWeight:600, color:t.text, letterSpacing:"-0.5px" }}>Crash Reports</h1>
        <p style={{ fontSize:13, color:t.textMuted, marginTop:4 }}>Auto-captured fault events with sensor readings</p>
      </div>

      {/* Summary */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:14, marginBottom:24 }}>
        {[
          { label:"Total events",  value:crashReports.length, color:t.text    },
          { label:"Safe Mode",     value:safeModeCount,       color:"#dc2626" },
          { label:"Degraded",      value:degradedCount,       color:"#d97706" },
          { label:"During chaos",  value:chaosCount,          color:"#d97706" },
        ].map(({ label, value, color }) => (
          <div key={label} style={{ background:t.surface, border:`1px solid ${t.border}`, borderRadius:12, padding:"18px 20px" }}>
            <div style={{ fontSize:12, color:t.textFaint, marginBottom:6 }}>{label}</div>
            <div style={{ fontSize:28, fontWeight:600, color, fontFamily:"'DM Mono',monospace" }}>{value}</div>
          </div>
        ))}
      </div>

      {/* Report list */}
      {crashReports.length === 0 ? (
        <div style={{ background:t.surface, border:`1px solid ${t.border}`, borderRadius:14, padding:"60px", textAlign:"center" }}>
          <div style={{ fontSize:32, marginBottom:12 }}>✓</div>
          <div style={{ fontSize:15, fontWeight:500, color:t.text, marginBottom:6 }}>No crash reports yet</div>
          <div style={{ fontSize:13, color:t.textFaint }}>The recorder captures events automatically when faults are detected</div>
        </div>
      ) : (
        <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
          {[...crashReports].reverse().map((r, i) => {
            const sc = STATE_COLORS[r.state] || STATE_COLORS.NOMINAL;
            return (
              <div key={i} onClick={() => setSelected(r)} style={{
                background:t.surface, border:`1px solid ${t.border}`, borderRadius:12,
                padding:"16px 20px", cursor:"pointer", transition:"border-color 0.15s",
                display:"grid", gridTemplateColumns:"10px 1fr auto", gap:16, alignItems:"center"
              }}
              onMouseEnter={e => e.currentTarget.style.borderColor = t.borderStrong}
              onMouseLeave={e => e.currentTarget.style.borderColor = t.border}>
                <div style={{ width:8, height:8, borderRadius:"50%", background:sc.color }}/>
                <div>
                  <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:4 }}>
                    <span style={{ fontSize:13, fontWeight:600, color:sc.color }}>{r.state.replace("_"," ")}</span>
                    {r.chaos && <span style={{ fontSize:10, padding:"1px 6px", borderRadius:4, background:"#d9770615", color:"#d97706", border:"1px solid #d9770625" }}>chaos</span>}
                    {r.source && <span style={{ fontSize:10, padding:"1px 6px", borderRadius:4, background:t.surfaceAlt, color:t.textFaint }}>{r.source}</span>}
                  </div>
                  <div style={{ fontSize:11, color:t.textFaint, fontFamily:"'DM Mono',monospace" }}>
                    {r.time} · cycle #{String(r.cycle).padStart(3,"0")} · sensors: {r.topSensors?.join(", ") || "—"}
                  </div>
                </div>
                <div style={{ fontSize:12, color:t.textFaint }}>View →</div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}