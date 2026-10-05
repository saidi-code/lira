import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#B89354",
        "primary-dim": "#785920",
        canvas: "#FFF8F5",
        "surface-dim": "#FDF1EA",
        ink: "#3C3633",
        muted: "#78716C",
        danger: "#A3523B",
      },
      boxShadow: {
        card: "0 4px 20px rgba(184,147,84,0.08)",
      },
    },
  },
  plugins: [],
};

export default config;
