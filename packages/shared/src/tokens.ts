/** Design tokens — AGENT.md §3. Shared by Mobile, Admin, and Storefront. */

export const colors = {
  primary: "#B89354",
  "primary-fixed": "#D4AF37",
  "primary-dim": "#785920",
  surface: "#FFF8F5",
  "surface-alt": "#FCF9F1",
  "surface-dim": "#FDF1EA",
  "surface-lowest": "#FFFFFF",
  "on-surface": "#3C3633",
  "on-surface-variant": "#78716C",
  outline: "rgba(184,147,84,0.15)",
  tertiary: "#A3523B",
  dark: {
    background: "#1C1917",
    surface: "#292524",
    text: "#FAF7F2",
    gold: "#D4AF37",
  },
} as const;

export const radii = {
  button: "12px",
  card: "20px",
  sheet: "32px",
  pill: "9999px",
} as const;

export const currencyCodes = ["TND", "EUR", "USD", "SAR"] as const;
export type CurrencyCode = (typeof currencyCodes)[number];

export const languageCodes = ["ar", "fr", "en"] as const;
export type LanguageCode = (typeof languageCodes)[number];
