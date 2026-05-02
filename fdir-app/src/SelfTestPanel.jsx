import { useState, useEffect } from "react";
import { useApp } from "./AppContext";
import { LIGHT, DARK, FEATURE_COLS, SENSOR_META, STATE_COLORS } from "./theme";

// ── Pure TMR voter — no model bias, deterministic, instant ───────────────────
// Takes 3 sensor readings, checks pairwise agreement within threshold.
// 0 faults → NOMINAL, 1 fault → DEGRADED, 2+ faults → SAFE_MODE
function runTMR(s1, s2, s3, threshold) {
  const s = [s1, s2, s3];
  const valid = [false, false, false];
  for (let i = 0; i < 3; i++)
    for (let j = 0; j < 3; j++)
      if (i !== j && Math.abs(s[i] - s[j]) <= threshold) valid[i] = true;
  const fault     = valid.map(v => !v);
  const faultCount = fault.filter(Boolean).length;
  const state      = faultCount === 0 ? "NOMINAL" : faultCount === 1 ? "DEGRADED" : "SAFE_MODE";
  return { fault, faultCount, state };
}

// ── Mini DFA diagram ──────────────────────────────────────────────────────────
function MiniDFA({ activeState, t, theme }) {
  const nodes = {
    NOMINAL:   { x:120, y:40  },
    DEGRADED:  { x:40,  y:130 },
    SAFE_MODE: { x:200, y:130 },
  };
  const edges = [
    { from:"NOMINAL",   to:"DEGRADED",  label:"1 fault",  cx:55,  cy:82  },
    { from:"NOMINAL",   to:"SAFE_MODE", label:"2 faults", cx:185, cy:82  },
    { from:"DEGRADED",  to:"NOMINAL",   label:"healed",   cx:75,  cy:72  },
    { from:"DEGRADED",  to:"SAFE_MODE", label:"worse",    cx:120, cy:145 },
  ];

  return (
    <svg width="100%" viewBox="0 0 240 185" style={{ overflow:"visible" }}>
      <defs>
        <marker id="ma" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
          <path d="M2 2L8 5L2 8" fill="none" stroke={t.borderStrong} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </marker>
        {Object.entries(STATE_COLORS).slice(0,3).map(([k,v]) => (
          <marker key={k} id={`ma-${k}`} viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
            <path d="M2 2L8 5L2 8" fill="none" stroke={v.color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </marker>
        ))}
      </defs>

      {edges.map((e, i) => {
        const f = nodes[e.from], to = nodes[e.to];
        const active = activeState === e.from;
        return (
          <g key={i}>
            <path d={`M${f.x},${f.y} Q${e.cx},${e.cy} ${to.x},${to.y}`}
              fill="none"
              stroke={active ? STATE_COLORS[e.from].color : t.border}
              strokeWidth={active ? 2 : 1}
              strokeDasharray={active ? "none" : "4 3"}
              markerEnd={active ? `url(#ma-${e.from})` : "url(#ma)"}
              style={{ transition:"stroke 0.3s, stroke-width 0.3s" }}/>
            <text x={e.cx} y={e.cy - 6} textAnchor="middle" fontSize={8}
              fill={active ? STATE_COLORS[e.from].color : t.textFaint}
              fontFamily="'DM Mono',monospace"
              style={{ transition:"fill 0.3s" }}>
              {e.label}
            </text>
          </g>
        );
      })}

      {Object.entries(nodes).map(([id, pos]) => {
        const sc = STATE_COLORS[id];
        const isActive = activeState === id;
        return (
          <g key={id}>
            {isActive && (
              <circle cx={pos.x} cy={pos.y} r={28} fill="none" stroke={sc.color} strokeWidth={1} opacity={0.15}>
                <animate attributeName="r" values="22;30;22" dur="2s" repeatCount="indefinite"/>
                <animate attributeName="opacity" values="0.2;0.04;0.2" dur="2s" repeatCount="indefinite"/>
              </circle>
            )}
            <circle cx={pos.x} cy={pos.y} r={20}
              fill={isActive ? sc.color+"22" : t.surfaceAlt}
              stroke={isActive ? sc.color : t.border}
              strokeWidth={isActive ? 2 : 1}
              style={{ transition:"all 0.35s" }}/>
            <text x={pos.x} y={pos.y-3} textAnchor="middle" fontSize={7.5} fontWeight="600"
              fontFamily="'DM Mono',monospace"
              fill={isActive ? sc.color : t.textMuted}
              style={{ transition:"fill 0.35s" }}>
              {id.replace("_"," ")}
            </text>
          </g>
        );
      })}

      {/* Legend */}
      <text x={120} y={175} textAnchor="middle" fontSize={8} fill={t.textFaint} fontFamily="'DM Mono',monospace">
        active state highlighted · arrows show transitions
      </text>
    </svg>
  );
}

// ── Test sensors — 3 sliders that directly drive the TMR voter ───────────────
// S1, S2, S3 are abstract "sensor readings" on a 0–100 scale.
// The threshold is also adjustable so users can see how tolerance affects votes.

const INITIAL = { s1: 50, s2: 51, s3: 50, threshold: 5 };

const STATE_DESCRIPTIONS = {
  NOMINAL:   "All three sensors agree within the threshold. The system is healthy.",
  DEGRADED:  "One sensor is outside the agreement range — it's been flagged and excluded. System still operational on two sensors.",
  SAFE_MODE: "Two or more sensors disagree with each other. No reliable consensus can be reached. System should lock.",
};

const GUIDED_SCENARIOS = [
  {
    label: "All agree",
    desc:  "Set all sensors close together → NOMINAL",
    color: "#16a34a",
    vals:  { s1:50, s2:51, s3:50, threshold:5 }
  },
  {
    label: "One drifts",
    desc:  "S3 drifts far out → DEGRADED",
    color: "#d97706",
    vals:  { s1:50, s2:51, s3:80, threshold:5 }
  },
  {
    label: "Two fail",
    desc:  "S2 and S3 both spike → SAFE MODE",
    color: "#dc2626",
    vals:  { s1:50, s2:90, s3:5,  threshold:5 }
  },
  {
    label: "Tight threshold",
    desc:  "Small tolerance exposes minor drift",
    color: "#7c3aed",
    vals:  { s1:50, s2:54, s3:50, threshold:2 }
  },
];

export default function SelfTestPanel() {
  const { theme } = useApp();
  const t  = theme === "light" ? LIGHT : DARK;

  const [s, setS]           = useState(INITIAL);
  const [result, setResult] = useState(null);

  // Recompute instantly on any slider change
  useEffect(() => {
    const r = runTMR(s.s1, s.s2, s.s3, s.threshold);
    setResult(r);
  }, [s.s1, s.s2, s.s3, s.threshold]);

  const applyScenario = (scenario) => setS(scenario.vals);
  const reset         = () => setS(INITIAL);

  const sc = result ? (STATE_COLORS[result.state] || STATE_COLORS.NOMINAL) : STATE_COLORS.NOMINAL;

  const sensors = [
    { key:"s1", label:"Sensor 1", color:"#3b82f6" },
    { key:"s2", label:"Sensor 2", color:"#10b981" },
    { key:"s3", label:"Sensor 3", color:"#8b5cf6" },
  ];

  return (
    <div style={{ padding:"32px 36px" }}>
      {/* Header */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:6 }}>
        <div>
          <h1 style={{ fontSize:22, fontWeight:600, color:t.text, letterSpacing:"-0.5px" }}>Test Sensors</h1>
          <p style={{ fontSize:13, color:t.textMuted, marginTop:4 }}>
            Move the sliders and watch the TMR voter and state machine react in real time
          </p>
        </div>
        <button onClick={reset} style={{ padding:"8px 16px", fontSize:12, borderRadius:8, border:`1px solid ${t.border}`, background:"transparent", color:t.textMuted, cursor:"pointer", fontFamily:"inherit" }}>
          Reset
        </button>
      </div>

      {/* Explainer strip */}
      <div style={{ padding:"12px 16px", borderRadius:10, background:t.surfaceAlt, border:`1px solid ${t.border}`, marginBottom:24, fontSize:12, color:t.textMuted, lineHeight:1.7 }}>
        <strong style={{ color:t.text }}>How it works:</strong> The TMR voter compares all three sensor values.
        If two sensors agree within the <strong style={{ color:t.text }}>threshold</strong>, they are valid.
        If one is outside that range it gets flagged as a fault (→ Degraded).
        If two are outside it, no consensus exists (→ Safe Mode).
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 320px", gap:24 }}>

        {/* Left: sliders + scenarios */}
        <div>
          {/* Guided scenarios */}
          <div style={{ marginBottom:20 }}>
            <div style={{ fontSize:12, fontWeight:600, color:t.text, marginBottom:10 }}>Quick scenarios</div>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:8 }}>
              {GUIDED_SCENARIOS.map(sc2 => (
                <button key={sc2.label} onClick={() => applyScenario(sc2)} style={{
                  padding:"10px 8px", borderRadius:10, cursor:"pointer", textAlign:"left",
                  border:`1px solid ${t.border}`, background:t.surface,
                  fontFamily:"inherit", transition:"all 0.15s"
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = sc2.color+"60"; e.currentTarget.style.background = sc2.color+"08"; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = t.border; e.currentTarget.style.background = t.surface; }}>
                  <div style={{ fontSize:11, fontWeight:600, color:sc2.color, marginBottom:3 }}>{sc2.label}</div>
                  <div style={{ fontSize:10, color:t.textFaint, lineHeight:1.5 }}>{sc2.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Sensor sliders */}
          <div style={{ display:"flex", flexDirection:"column", gap:12, marginBottom:16 }}>
            {sensors.map(({ key, label, color }) => {
              const val      = s[key];
              const isFault  = result?.fault[parseInt(key[1])-1] ?? false;
              const barColor = isFault ? "#ef4444" : color;
              return (
                <div key={key} style={{
                  background:t.surface, border:`1px solid ${isFault ? "#ef444330" : t.border}`,
                  borderRadius:10, padding:"14px 18px", transition:"border-color 0.25s"
                }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
                    <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                      <div style={{ width:8, height:8, borderRadius:"50%", background:barColor, transition:"background 0.25s" }}/>
                      <span style={{ fontSize:13, fontWeight:500, color:t.text }}>{label}</span>
                    </div>
                    <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                      {isFault && (
                        <span style={{ fontSize:10, padding:"2px 8px", borderRadius:4, background:"#ef444415", color:"#ef4444", border:"1px solid #ef444330" }}>
                          ⚠ fault
                        </span>
                      )}
                      <span style={{ fontSize:20, fontWeight:600, color:isFault?"#ef4444":t.text, fontFamily:"'DM Mono',monospace", minWidth:48, textAlign:"right", transition:"color 0.25s" }}>
                        {val.toFixed(1)}
                      </span>
                    </div>
                  </div>
                  <input type="range" min={0} max={100} step={0.5} value={val}
                    onChange={e => setS(prev => ({ ...prev, [key]: parseFloat(e.target.value) }))}
                    style={{ width:"100%", accentColor:barColor, height:3, cursor:"pointer" }}/>
                  <div style={{ height:3, background:t.surfaceAlt, borderRadius:2, overflow:"hidden", marginTop:6 }}>
                    <div style={{ height:"100%", width:`${val}%`, background:barColor, borderRadius:2, transition:"width 0.05s, background 0.25s" }}/>
                  </div>
                  <div style={{ display:"flex", justifyContent:"space-between", marginTop:4 }}>
                    <span style={{ fontSize:9, color:t.textFaint }}>0</span>
                    <span style={{ fontSize:9, color:t.textFaint }}>100</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Threshold slider */}
          <div style={{ background:t.surface, border:`1px solid ${t.border}`, borderRadius:10, padding:"14px 18px" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
              <div>
                <span style={{ fontSize:13, fontWeight:500, color:t.text }}>Agreement threshold</span>
                <div style={{ fontSize:11, color:t.textFaint, marginTop:2 }}>Max difference allowed between sensors to be considered "agreeing"</div>
              </div>
              <span style={{ fontSize:20, fontWeight:600, color:t.text, fontFamily:"'DM Mono',monospace" }}>±{s.threshold.toFixed(1)}</span>
            </div>
            <input type="range" min={1} max={30} step={0.5} value={s.threshold}
              onChange={e => setS(prev => ({ ...prev, threshold: parseFloat(e.target.value) }))}
              style={{ width:"100%", accentColor:t.accent, height:3, cursor:"pointer" }}/>
            <div style={{ display:"flex", justifyContent:"space-between", marginTop:6 }}>
              <span style={{ fontSize:9, color:t.textFaint }}>±1 (strict)</span>
              <span style={{ fontSize:9, color:t.textFaint }}>±30 (lenient)</span>
            </div>
          </div>
        </div>

        {/* Right: live result + DFA */}
        <div style={{ display:"flex", flexDirection:"column", gap:12 }}>

          {/* Engine output */}
          <div style={{
            background: theme==="light" ? sc.bg : sc.darkBg,
            border:`1px solid ${theme==="light" ? sc.border : sc.darkBorder}`,
            borderRadius:12, padding:"18px", transition:"all 0.3s"
          }}>
            <div style={{ fontSize:10, color:sc.color, fontWeight:600, letterSpacing:1, marginBottom:8 }}>ENGINE OUTPUT</div>
            <div style={{ fontSize:24, fontWeight:600, color:sc.color, marginBottom:10, transition:"color 0.3s" }}>
              {result?.state.replace("_"," ") ?? "—"}
            </div>
            <div style={{ fontSize:12, color:t.textMuted, lineHeight:1.7 }}>
              {result ? STATE_DESCRIPTIONS[result.state] : "Move a slider to start."}
            </div>
          </div>

          {/* TMR breakdown */}
          <div style={{ background:t.surface, border:`1px solid ${t.border}`, borderRadius:12, padding:"16px" }}>
            <div style={{ fontSize:11, color:t.textFaint, fontWeight:600, letterSpacing:1, marginBottom:12 }}>TMR VOTER BREAKDOWN</div>
            <div style={{ display:"flex", gap:8, marginBottom:10 }}>
              {sensors.map(({ key, label }, i) => {
                const isFault = result?.fault[i] ?? false;
                const c = isFault ? "#ef4444" : "#16a34a";
                return (
                  <div key={key} style={{ flex:1, textAlign:"center", padding:"10px 4px", borderRadius:8, background:isFault?"#ef444410":"#16a34a10", border:`1px solid ${isFault?"#ef444430":"#16a34a30"}`, transition:"all 0.3s" }}>
                    <div style={{ fontSize:9, color:t.textFaint, marginBottom:4 }}>S{i+1}</div>
                    <div style={{ fontSize:15, fontWeight:600, color:c, fontFamily:"'DM Mono',monospace" }}>{s[key].toFixed(1)}</div>
                    <div style={{ fontSize:9, color:c, marginTop:3 }}>{isFault ? "fault" : "ok"}</div>
                  </div>
                );
              })}
            </div>
            <div style={{ fontSize:11, color:t.textFaint, borderTop:`1px solid ${t.border}`, paddingTop:8, marginTop:4 }}>
              Faults: <span style={{ color: result?.faultCount > 0 ? "#ef4444" : "#16a34a", fontWeight:600 }}>
                {result?.faultCount ?? 0}/3
              </span>
              <span style={{ marginLeft:12 }}>
                Threshold: <span style={{ color:t.text, fontWeight:600 }}>±{s.threshold.toFixed(1)}</span>
              </span>
            </div>
          </div>

          {/* Mini DFA */}
          <div style={{ background:t.surface, border:`1px solid ${t.border}`, borderRadius:12, padding:"16px" }}>
            <div style={{ fontSize:11, color:t.textFaint, fontWeight:600, letterSpacing:1, marginBottom:4 }}>STATE MACHINE</div>
            <div style={{ fontSize:10, color:t.textFaint, marginBottom:10 }}>Updates as you move sliders</div>
            <MiniDFA activeState={result?.state ?? "NOMINAL"} t={t} theme={theme}/>
          </div>
        </div>
      </div>
    </div>
  );
}