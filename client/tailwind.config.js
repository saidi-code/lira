/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  // NOTE: Update this to include the paths to all files that contain Nativewind classes.
  content: [
    "./App.tsx",
    "./components/**/*.{js,jsx,ts,tsx}",
    "./app/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      // Semantic tokens resolve to CSS variables declared in global.css, so a
      // theme switch re-paints every className usage with no component change.
      // `<alpha-value>` keeps Tailwind's opacity modifiers (bg-primary/20).
      colors: {
        primary: {
          DEFAULT: "rgb(var(--color-primary) / <alpha-value>)",
          // Brand fill for buttons — deliberately does NOT lighten in dark so
          // `text-white` on top keeps its contrast.
          solid: "rgb(var(--color-primary-solid) / <alpha-value>)",
          100: "rgb(var(--color-primary) / 0.1)",
          200: "rgb(var(--color-primary) / 0.2)",
          300: "rgb(var(--color-primary) / 0.3)",
          400: "rgb(var(--color-primary) / 0.4)",
          500: "rgb(var(--color-primary) / 0.5)",
          600: "rgb(var(--color-primary) / 0.6)",
          700: "rgb(var(--color-primary) / 0.7)",
          800: "rgb(var(--color-primary) / 0.8)",
          900: "rgb(var(--color-primary) / 0.9)",
        },
        card: "rgb(var(--color-card) / <alpha-value>)",
        canvas: "rgb(var(--color-canvas) / <alpha-value>)",
        surface: "rgb(var(--color-surface) / <alpha-value>)",
        body: "rgb(var(--color-body) / <alpha-value>)",
        // `text-secondary` — the app's existing "muted body copy" token.
        secondary: "rgb(var(--color-secondary) / <alpha-value>)",
        muted: "rgb(var(--color-muted) / <alpha-value>)",
        accent: "rgb(var(--color-accent) / <alpha-value>)",
        inactive: "rgb(var(--color-inactive) / <alpha-value>)",
        active: "rgb(var(--color-active) / <alpha-value>)",
        // Shimmer blocks for skeleton loaders.
        skeleton: "rgb(var(--color-skeleton) / <alpha-value>)",
        // Faint fills (was gray-50/100): info blocks, empty states, hairlines.
        subtle: {
          DEFAULT: "rgb(var(--color-subtle) / <alpha-value>)",
          border: "rgb(var(--color-subtle-border) / <alpha-value>)",
        },
        // Modal / banner overlay — warm charcoal instead of pure black, so
        // scrims never violate the "no #000000" guardrail.
        scrim: "rgb(var(--color-scrim) / <alpha-value>)",
        // Status tones. `*-surface` is the tinted pill background, the plain
        // token is the text/icon colour on top of it.
        danger: {
          DEFAULT: "rgb(var(--color-danger) / <alpha-value>)",
          surface: "rgb(var(--color-danger-surface) / <alpha-value>)",
        },
        success: {
          DEFAULT: "rgb(var(--color-success) / <alpha-value>)",
          surface: "rgb(var(--color-success-surface) / <alpha-value>)",
        },
        info: {
          DEFAULT: "rgb(var(--color-info) / <alpha-value>)",
          surface: "rgb(var(--color-info-surface) / <alpha-value>)",
        },
        shipped: {
          DEFAULT: "rgb(var(--color-shipped) / <alpha-value>)",
          surface: "rgb(var(--color-shipped-surface) / <alpha-value>)",
        },
      },
      fontFamily: {
        jazera: ["jazera-bold"],
        tajwal: ["tajwal-medium"],
        body: ["arabic-body"],
      },
    },
  },
  plugins: [],
};
