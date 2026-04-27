import { useState, useEffect } from "react";

export default function Landing({ onEnter }) {
  const [phase, setPhase] = useState(0);
  // phase 0: blank, 1: logo appears, 2: subtitle, 3: stats, 4: button

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 300),
      setTimeout(() => setPhase(2), 1000),
      setTimeout(() => setPhase(3), 1700),
      setTimeout(() => setPhase(4), 2400),
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  const stats = [
    { value: "98.6%", label: "Model accuracy" },
    { value: "17",    label: "Sensor channels" },
    { value: "2205",  label: "Training cycles" },
    { value: "3",     label: "Health states" },
  ];

  return (
    <div style={{
      minHeight: "100vh", background: "#0f0f0d",
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      fontFamily: "'DM Sans', sans-serif",
      position: "relative", overflow: "hidden",
      padding: "40px 20px"
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=DM+Mono:wght@400;500&display=swap');
        @keyframes fadeUp   { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:none} }
        @keyframes fadeIn   { from{opacity:0} to{opacity:1} }
        @keyframes scanline { from{transform:translateY(-100%)} to{transform:translateY(100vh)} }
        @keyframes pulse    { 0%,100%{opacity:0.4} 50%{opacity:1} }
        @keyframes spin     { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        @keyframes glow     { 0%,100%{box-shadow:0 0 20px #3b82f620} 50%{box-shadow:0 0 60px #3b82f640} }
        .enter-btn:hover { background: #3b82f6 !important; color: #fff !important; transform: translateY(-1px); }
        .enter-btn { transition: all 0.2s ease !important; }
      `}</style>

      {/* Subtle grid background */}
      <div style={{
        position: "absolute", inset: 0, opacity: 0.04,
        backgroundImage: "linear-gradient(#e5e5e5 1px, transparent 1px), linear-gradient(90deg, #e5e5e5 1px, transparent 1px)",
        backgroundSize: "40px 40px"
      }}/>

      {/* Animated ring */}
      {phase >= 1 && (
        <div style={{
          position: "absolute", width: 400, height: 400, borderRadius: "50%",
          border: "1px solid #3b82f615",
          animation: "fadeIn 1s ease both, glow 3s ease infinite",
          top: "50%", left: "50%", transform: "translate(-50%, -50%)"
        }}/>
      )}
      {phase >= 1 && (
        <div style={{
          position: "absolute", width: 280, height: 280, borderRadius: "50%",
          border: "1px solid #3b82f620",
          top: "50%", left: "50%", transform: "translate(-50%, -50%)",
          animation: "fadeIn 1.2s ease both"
        }}/>
      )}

      {/* Main content */}
      <div style={{ textAlign: "center", position: "relative", zIndex: 1 }}>

        {/* Badge */}
        {phase >= 1 && (
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            padding: "5px 14px", borderRadius: 20,
            border: "1px solid #3b82f630", background: "#3b82f610",
            marginBottom: 28, animation: "fadeUp 0.6s ease both"
          }}>
            <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#3b82f6", animation: "pulse 2s ease infinite" }}/>
            <span style={{ fontSize: 11, color: "#3b82f6", fontFamily: "'DM Mono', monospace", letterSpacing: 1 }}>
              UCI HYDRAULIC DATASET · RANDOM FOREST · ONNX
            </span>
          </div>
        )}

        {/* Logo */}
        {phase >= 1 && (
          <div style={{ animation: "fadeUp 0.7s ease both" }}>
            <div style={{
              fontSize: "clamp(52px, 10vw, 88px)", fontWeight: 600,
              color: "#f0ede8", letterSpacing: "-3px", lineHeight: 1,
              marginBottom: 8
            }}>
              FDIR
            </div>
            <div style={{
              fontSize: "clamp(52px, 10vw, 88px)", fontWeight: 300,
              color: "#525250", letterSpacing: "-3px", lineHeight: 1,
              marginBottom: 24
            }}>
              Engine
            </div>
          </div>
        )}

        {/* Subtitle */}
        {phase >= 2 && (
          <p style={{
            fontSize: 15, color: "#8c8a84", fontWeight: 400,
            maxWidth: 420, lineHeight: 1.7, marginBottom: 40,
            animation: "fadeUp 0.6s ease both"
          }}>
            Fault Detection · Isolation · Recovery<br/>
            Real-time hydraulic system health monitoring<br/>
            powered by machine learning
          </p>
        )}

        {/* Stats row */}
        {phase >= 3 && (
          <div style={{
            display: "flex", gap: 32, justifyContent: "center",
            marginBottom: 48, animation: "fadeUp 0.6s ease both"
          }}>
            {stats.map(({ value, label }) => (
              <div key={label} style={{ textAlign: "center" }}>
                <div style={{ fontSize: 22, fontWeight: 600, color: "#f0ede8", fontFamily: "'DM Mono', monospace", letterSpacing: "-0.5px" }}>{value}</div>
                <div style={{ fontSize: 11, color: "#525250", marginTop: 3 }}>{label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Enter button */}
        {phase >= 4 && (
          <button className="enter-btn" onClick={onEnter} style={{
            padding: "14px 40px", fontSize: 14, fontWeight: 500,
            borderRadius: 10, border: "1px solid #3b82f640",
            background: "transparent", color: "#3b82f6",
            cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
            letterSpacing: 0.3, animation: "fadeUp 0.6s ease both"
          }}>
            Launch dashboard →
          </button>
        )}
      </div>

      {/* Bottom credit */}
      {phase >= 4 && (
        <div style={{
          position: "absolute", bottom: 28, fontSize: 11,
          color: "#525250", fontFamily: "'DM Mono', monospace",
          animation: "fadeIn 1s ease both"
        }}>
          Built with React · scikit-learn · ONNX Runtime Web
        </div>
      )}
    </div>
  );
}