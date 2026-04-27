// ─── Theme tokens ────────────────────────────────────────────────────────────

export const LIGHT = {
  bg:          "#f8f7f4",
  surface:     "#ffffff",
  surfaceAlt:  "#f2f0ec",
  border:      "#e5e2da",
  borderStrong:"#ccc9c0",
  text:        "#1a1917",
  textMuted:   "#6b6860",
  textFaint:   "#a09e98",
  accent:      "#2563eb",
  accentBg:    "#eff6ff",
};

export const DARK = {
  bg:          "#111110",
  surface:     "#1c1c1a",
  surfaceAlt:  "#242422",
  border:      "#2e2e2b",
  borderStrong:"#3d3d39",
  text:        "#f0ede8",
  textMuted:   "#8c8a84",
  textFaint:   "#525250",
  accent:      "#3b82f6",
  accentBg:    "#1e3a5f",
};

export const STATE_COLORS = {
  NOMINAL:    { color: "#16a34a", bg: "#f0fdf4", border: "#bbf7d0", darkBg: "#14532d22", darkBorder: "#16a34a33" },
  DEGRADED:   { color: "#d97706", bg: "#fffbeb", border: "#fde68a", darkBg: "#78350f22", darkBorder: "#d9770633" },
  SAFE_MODE:  { color: "#dc2626", bg: "#fef2f2", border: "#fecaca", darkBg: "#7f1d1d22", darkBorder: "#dc262633" },
  RECOVERING: { color: "#7c3aed", bg: "#f5f3ff", border: "#ddd6fe", darkBg: "#4c1d9522", darkBorder: "#7c3aed33" },
};

export const FEATURE_COLS = [
  "CE","CP","EPS1","FS1","FS2",
  "PS1","PS2","PS3","PS4","PS5","PS6",
  "SE","TS1","TS2","TS3","TS4","VS1"
];

export const SENSOR_META = {
  CE:   { label: "Cooler Efficiency",  unit: "%",    min: 0,    max: 100,  group: "thermal"   },
  CP:   { label: "Cooler Power",       unit: "kW",   min: 0,    max: 4,    group: "thermal"   },
  EPS1: { label: "Motor Power",        unit: "W",    min: 2400, max: 2700, group: "electrical"},
  FS1:  { label: "Flow Sensor 1",      unit: "l/m",  min: 0,    max: 20,   group: "flow"      },
  FS2:  { label: "Flow Sensor 2",      unit: "l/m",  min: 0,    max: 20,   group: "flow"      },
  PS1:  { label: "Pressure 1",         unit: "bar",  min: 0,    max: 200,  group: "pressure"  },
  PS2:  { label: "Pressure 2",         unit: "bar",  min: 0,    max: 20,   group: "pressure"  },
  PS3:  { label: "Pressure 3",         unit: "bar",  min: 0,    max: 20,   group: "pressure"  },
  PS4:  { label: "Pressure 4",         unit: "bar",  min: 0,    max: 5,    group: "pressure"  },
  PS5:  { label: "Pressure 5",         unit: "bar",  min: 0,    max: 10,   group: "pressure"  },
  PS6:  { label: "Pressure 6",         unit: "bar",  min: 0,    max: 10,   group: "pressure"  },
  SE:   { label: "System Efficiency",  unit: "%",    min: 0,    max: 100,  group: "electrical"},
  TS1:  { label: "Temperature 1",      unit: "°C",   min: 30,   max: 80,   group: "thermal"   },
  TS2:  { label: "Temperature 2",      unit: "°C",   min: 30,   max: 80,   group: "thermal"   },
  TS3:  { label: "Temperature 3",      unit: "°C",   min: 30,   max: 80,   group: "thermal"   },
  TS4:  { label: "Temperature 4",      unit: "°C",   min: 30,   max: 80,   group: "thermal"   },
  VS1:  { label: "Vibration",          unit: "mm/s", min: 0,    max: 2,    group: "mechanical"},
};

export const GROUP_COLORS = {
  thermal:    "#ef4444",
  pressure:   "#3b82f6",
  flow:       "#10b981",
  electrical: "#f59e0b",
  mechanical: "#8b5cf6",
};

export const TOP_SENSORS = ["FS1","PS4","VS1","CE","PS2"];