/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ["'Orbitron'", "sans-serif"],
        mono: ["'JetBrains Mono'", "monospace"],
      },
      colors: {
        base: "#0a0f1e",
        panel: "#0f1629",
        card: "#141d35",
        "border-default": "#1e2d4a",
        "border-glow": "#00e5ff",
        "accent-cyan": "#00e5ff",
        "accent-red": "#ff4444",
        "accent-green": "#00ff88",
        "accent-amber": "#ffaa00",
        "text-primary": "#e8eaf0",
        "text-secondary": "#8899bb",
        "text-mono": "#7fdbca",
      },
      boxShadow: {
        "glow-cyan": "0 0 12px rgba(0,229,255,0.45)",
        "glow-red": "0 0 12px rgba(255,68,68,0.45)",
        "glow-green": "0 0 12px rgba(0,255,136,0.45)",
      },
    },
  },
  plugins: [],
};
