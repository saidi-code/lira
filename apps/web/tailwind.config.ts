import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#B89354",
        "primary-fixed": "#D4AF37",
        "primary-dim": "#785920",
        canvas: "#FFF8F5",
        "surface-dim": "#FDF1EA",
        ink: "#3C3633",
        muted: "#78716C",
        danger: "#A3523B",
      },
      fontFamily: {
        serif: ["var(--font-display)", "Reem Kufi", "Noto Serif", "serif"],
        sans: ["var(--font-body)", "Cairo", "IBM Plex Sans Arabic", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 4px 20px rgba(184,147,84,0.08)",
        nav: "0 -4px 20px rgba(184,147,84,0.08)",
        glow: "0 12px 40px rgba(184,147,84,0.14)",
      },
    },
  },
  plugins: [],
};

export default config;
