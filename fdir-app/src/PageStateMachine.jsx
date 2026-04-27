import { useApp } from "./AppContext";
import { LIGHT, DARK, STATE_COLORS } from "./theme";

function DFADiagram({ activeState, t }) {
  const nodes = {
    NOMINAL:    { x: 200, y: 60  },
    DEGRADED:   { x: 80,  y: 180 },
    SAFE_MODE:  { x: 320, y: 180 },
    RECOVERING: { x: 200, y: 290 },
  };
  const edges = [
    { from:"NOMINAL",    to:"DEGRADED",   label:"1 fault",  cx:100, cy:110 },
    { from:"NOMINAL",    to:"SAFE_MODE",  label:"2 faults", cx:300, cy:110 },
    { from:"DEGRADED",   to:"NOMINAL",    label:"healed",   cx:120, cy:100 },
    { from:"DEGRADED",   to:"SAFE_MODE",  label:"2nd fail", cx:200, cy:195 },
    { from:"DEGRADED",   to:"RECOVERING", label:"reset",    cx:80,  cy:245 },
    { from:"RECOVERING", to:"NOMINAL",    label:"success",  cx:280, cy:245 },
    { from:"RECOVERING", to:"SAFE_MODE",  label:"timeout",  cx:320, cy:250 },
  ];
  return (
    <svg width="100%" viewBox="0 0 400 360" style={{ overflow: "visible" }}>
      <defs>
        <marker id="arr" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M2 2L8 5L2 8" fill="none" stroke={t.borderStrong} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </marker>
        {Object.entries(STATE_COLORS).map(([k,v]) => (
          <marker key={k} id={`arr-${k}`} viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M2 2L8 5L2 8" fill="none" stroke={v.color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </marker>
        ))}
      </defs>
      {edges.map((e,i) => {
        const f=nodes[e.from], to=nodes[e.to], active=activeState===e.from;
        return (
          <g key={i}>
            <path d={`M${f.x},${f.y} Q${e.cx},${e.cy} ${to.x},${to.y}`} fill="none"
              stroke={active ? STATE_COLORS[e.from].color : t.border}
              strokeWidth={active ? 2 : 1} strokeDasharray={active ? "none" : "5 3"}
              markerEnd={active ? `url(#arr-${e.from})` : "url(#arr)"}
              style={{ transition:"stroke 0.3s,stroke-width 0.3s" }}/>
            <text x={e.cx} y={e.cy-8} textAnchor="middle" fontSize={10}
              fill={active ? STATE_COLORS[e.from].color : t.textFaint}
              fontFamily="'DM Mono', monospace" style={{ transition:"fill 0.3s" }}>
              {e.label}
            </text>
          </g>
        );
      })}
      {Object.entries(nodes).map(([id, pos]) => {
        const sc=STATE_COLORS[id], isActive=activeState===id;
        return (
          <g key={id}>
            {isActive && (
              <circle cx={pos.x} cy={pos.y} r={36} fill="none" stroke={sc.color} strokeWidth={1} opacity={0.15}>
                <animate attributeName="r" values="28;36;28" dur="2.5s" repeatCount="indefinite"/>
                <animate attributeName="opacity" values="0.2;0.04;0.2" dur="2.5s" repeatCount="indefinite"/>
              </circle>
            )}
            <circle cx={pos.x} cy={pos.y} r={26}
              fill={isActive ? sc.color+"22" : t.surfaceAlt}
              stroke={isActive ? sc.color : t.border}
              strokeWidth={isActive ? 1.5 : 1}
              style={{ transition:"all 0.35s" }}/>
            <text x={pos.x} y={pos.y-4} textAnchor="middle" fontSize={9} fontWeight="600"
              fontFamily="'DM Mono', monospace"
              fill={isActive ? sc.color : t.textMuted}
              style={{ transition:"fill 0.35s" }}>
              {id.replace("_"," ")}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

const STATE_DESCRIPTIONS = {
  NOMINAL:    { title:"Nominal",    desc:"All 17 sensors reporting values within expected ranges. The trained model classifies system health as normal. No corrective action required.", icon:"✓" },
  DEGRADED:   { title:"Degraded",   desc:"One or more sensor channels deviate from consensus. The system continues operating but flags the anomaly. Operator review recommended.", icon:"△" },
  SAFE_MODE:  { title:"Safe Mode",  desc:"Critical fault detected across multiple channels. The DFA has locked the system to prevent hardware damage. Manual reset command required.", icon:"⊗" },
  RECOVERING: { title:"Recovering", desc:"A reset command has been issued. The system is re-evaluating sensor data. If readings normalise within 3 cycles, state returns to Nominal.", icon:"↺" },
};

export default function PageStateMachine() {
  const { theme, state, cycle, autoRun, setAutoRun, commandReset, log } = useApp();
  const t  = theme === "light" ? LIGHT : DARK;
  const sc = STATE_COLORS[state] || STATE_COLORS.NOMINAL;
  const info = STATE_DESCRIPTIONS[state];

  const stateHistory = ["NOMINAL","DEGRADED","SAFE_MODE","RECOVERING"].map(s => ({
    state: s, count: log.filter(e => e.state === s).length
  }));

  return (
    <div style={{ padding: "32px 36px" }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 22, fontWeight: 600, color: t.text, letterSpacing: "-0.5px" }}>State Machine</h1>
        <p style={{ fontSize: 13, color: t.textMuted, marginTop: 4 }}>Deterministic Finite Automaton — FDIR transition logic</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 20 }}>
        {/* DFA */}
        <div style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 14, padding: "28px" }}>
          <DFADiagram activeState={state} t={t}/>
        </div>

        {/* Right panel */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

          {/* Current state info */}
          <div style={{
            background: theme === "light" ? sc.bg : sc.darkBg,
            border: `1px solid ${theme === "light" ? sc.border : sc.darkBorder}`,
            borderRadius: 14, padding: "20px"
          }}>
            <div style={{ fontSize: 11, color: sc.color, fontWeight: 600, letterSpacing: 1, marginBottom: 8, fontFamily: "'DM Mono', monospace" }}>CURRENT STATE</div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
              <div style={{ width: 10, height: 10, borderRadius: "50%", background: sc.color, animation: state === "SAFE_MODE" ? "blink 1s step-end infinite" : "none" }}/>
              <span style={{ fontSize: 18, fontWeight: 600, color: sc.color }}>{info.title}</span>
            </div>
            <p style={{ fontSize: 12, color: t.textMuted, lineHeight: 1.7 }}>{info.desc}</p>
            <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
              {(state === "DEGRADED" || state === "SAFE_MODE") && (
                <button onClick={commandReset} style={{ flex: 1, padding: "8px 0", fontSize: 12, borderRadius: 8, border: "1px solid #7c3aed44", background: "#7c3aed15", color: "#7c3aed", cursor: "pointer", fontWeight: 500 }}>
                  Issue reset
                </button>
              )}
              <button onClick={() => setAutoRun(a => !a)} style={{ flex: 1, padding: "8px 0", fontSize: 12, borderRadius: 8, border: `1px solid ${t.border}`, background: "transparent", color: t.textMuted, cursor: "pointer" }}>
                {autoRun ? "Pause" : "Resume"}
              </button>
            </div>
          </div>

          {/* State distribution */}
          <div style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 14, padding: "20px" }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: t.text, marginBottom: 14 }}>State Distribution</div>
            {stateHistory.map(({ state: s, count }) => {
              const sc2 = STATE_COLORS[s];
              const pct = log.length > 0 ? (count / log.length) * 100 : 0;
              return (
                <div key={s} style={{ marginBottom: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                    <span style={{ fontSize: 11, color: t.textMuted }}>{s.replace("_"," ")}</span>
                    <span style={{ fontSize: 11, fontFamily: "'DM Mono', monospace", color: t.textFaint }}>{count} cycles</span>
                  </div>
                  <div style={{ height: 5, background: t.surfaceAlt, borderRadius: 3, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${pct}%`, background: sc2.color, borderRadius: 3, transition: "width 0.5s" }}/>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Cycle counter */}
          <div style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 14, padding: "20px" }}>
            <div style={{ fontSize: 11, color: t.textFaint, marginBottom: 4 }}>Total cycles evaluated</div>
            <div style={{ fontSize: 32, fontWeight: 600, color: t.text, fontFamily: "'DM Mono', monospace", letterSpacing: "-1px" }}>
              {String(cycle).padStart(4,"0")}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}