import type { Config } from "tailwindcss"

const config: Config = {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["IBM Plex Sans", "sans-serif"],
        mono: ["IBM Plex Mono", "monospace"],
      },
      colors: {
        base: "#0A0F1E",
        surface: "#111827",
        elevated: "#1F2937",
        accent: "#1E3A5F",
      },
      keyframes: {
        "timer-pulse": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.4" },
        },
        "toast-in": {
          from: { transform: "translateX(120%)", opacity: "0" },
          to: { transform: "translateX(0)", opacity: "1" },
        },
        "block-expand": {
          from: { maxHeight: "0", opacity: "0" },
          to: { maxHeight: "800px", opacity: "1" },
        },
        "glow-pulse": {
          "0%, 100%": { boxShadow: "0 0 8px currentColor" },
          "50%": { boxShadow: "0 0 22px currentColor" },
        },
      },
      animation: {
        "timer-pulse": "timer-pulse 1s ease-in-out infinite",
        "toast-in": "toast-in 0.3s ease-out forwards",
        "block-expand": "block-expand 0.25s ease-out forwards",
        "glow-pulse": "glow-pulse 2s ease-in-out infinite",
      },
    },
  },
  plugins: [],
}

export default config
