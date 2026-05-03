import { useApp } from "./AppContext";
import { LIGHT, DARK, STATE_COLORS } from "./Theme";

const NAV = [
  { id: "dashboard",     icon: "⊞", label: "Dashboard"    },
  { id: "sensors",       icon: "◈", label: "Sensors"       },
  { id: "state-machine", icon: "◎", label: "State Machine" },
  { id: "replay",        icon: "↺", label: "Replay"        },
  { id: "crash-reports", icon: "⚑", label: "Crash Reports" },
  { id: "self-test",     icon: "⚙", label: "Test Sensors"  },
];

export default function Layout({ children }) {
  const { theme, setTheme, page, setPage, state, cycle, modelReady, crashReports } = useApp();
  const t = theme === "light" ? LIGHT : DARK;
  const sc = STATE_COLORS[state] || STATE_COLORS.NOMINAL;

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: t.bg, color: t.text, fontFamily: "'DM Sans', sans-serif", transition: "background 0.25s, color 0.25s" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=DM+Mono:wght@400;500&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 4px; } ::-webkit-scrollbar-thumb { background: ${t.border}; border-radius: 2px; }
        button { font-family: inherit; }
        @keyframes fadeIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:none} }
        @keyframes blink  { 0%,100%{opacity:1} 50%{opacity:0.3} }
        .page-enter { animation: fadeIn 0.25s ease both; }
      `}</style>

      {/* ── Sidebar ── */}
      <aside style={{
        width: 220, flexShrink: 0, background: t.surface,
        borderRight: `1px solid ${t.border}`,
        display: "flex", flexDirection: "column",
        padding: "0 0 16px 0", position: "sticky", top: 0, height: "100vh",
        transition: "background 0.25s, border-color 0.25s"
      }}>
        {/* Logo */}
        <div style={{ padding: "20px 20px 16px", borderBottom: `1px solid ${t.border}` }}>
          <div style={{ fontSize: 15, fontWeight: 600, color: t.text, letterSpacing: "-0.3px" }}>FDIR Engine</div>
          <div style={{ fontSize: 11, color: t.textFaint, marginTop: 3, fontFamily: "'DM Mono', monospace" }}>v2.0 · hydraulic</div>
        </div>

        {/* System status pill */}
        <div style={{ padding: "12px 16px", borderBottom: `1px solid ${t.border}` }}>
          <div style={{
            display: "flex", alignItems: "center", gap: 8,
            padding: "8px 12px", borderRadius: 8,
            background: theme === "light" ? sc.bg : sc.darkBg,
            border: `1px solid ${theme === "light" ? sc.border : sc.darkBorder}`,
          }}>
            <div style={{
              width: 7, height: 7, borderRadius: "50%", background: sc.color, flexShrink: 0,
              animation: state === "SAFE_MODE" ? "blink 1s step-end infinite" : "none"
            }}/>
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, color: sc.color, letterSpacing: 0.3 }}>{state.replace("_"," ")}</div>
              <div style={{ fontSize: 10, color: t.textFaint, fontFamily: "'DM Mono', monospace" }}>cycle #{String(cycle).padStart(4,"0")}</div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: "8px 10px", display: "flex", flexDirection: "column", gap: 2 }}>
          {NAV.map(item => {
            const active = page === item.id;
            const hasBadge = item.id === "crash-reports" && crashReports.length > 0;
            return (
              <button key={item.id} onClick={() => setPage(item.id)} style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "9px 12px", borderRadius: 8, border: "none",
                background: active ? t.surfaceAlt : "transparent",
                color: active ? t.text : t.textMuted,
                cursor: "pointer", fontSize: 13, fontWeight: active ? 500 : 400,
                textAlign: "left", width: "100%", transition: "all 0.15s",
                position: "relative"
              }}
              onMouseEnter={e => { if (!active) e.currentTarget.style.background = t.surfaceAlt; }}
              onMouseLeave={e => { if (!active) e.currentTarget.style.background = "transparent"; }}
              >
                <span style={{ fontSize: 14, opacity: active ? 1 : 0.6 }}>{item.icon}</span>
                {item.label}
                {hasBadge && (
                  <span style={{ marginLeft: "auto", fontSize: 10, background: "#dc2626", color: "#fff", borderRadius: 10, padding: "1px 6px", fontFamily: "'DM Mono', monospace" }}>
                    {crashReports.length}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Bottom: model status + theme toggle */}
        <div style={{ padding: "12px 16px", borderTop: `1px solid ${t.border}`, display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: modelReady ? "#16a34a" : "#d97706", flexShrink: 0 }}/>
            <span style={{ fontSize: 11, color: t.textFaint }}>{modelReady ? "Model active" : "Loading model..."}</span>
          </div>
          <button onClick={() => setTheme(t => t === "light" ? "dark" : "light")} style={{
            display: "flex", alignItems: "center", gap: 8, padding: "7px 10px", borderRadius: 7,
            border: `1px solid ${t.border}`, background: "transparent", color: t.textMuted,
            cursor: "pointer", fontSize: 12, width: "100%", transition: "all 0.15s"
          }}>
            {theme === "light" ? "🌙 Dark mode" : "☀ Light mode"}
          </button>
        </div>
      </aside>

      {/* ── Main content ── */}
<main style={{ flex: 1, overflow: "auto", minWidth: 0 ,position: "relative"}}>
  <div className="page-enter" key={page} style={{ minHeight: "100vh" }}>
    {children}
  </div>
</main>
    </div>
  );
}