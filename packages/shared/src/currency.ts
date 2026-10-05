import type { CurrencyCode } from "./tokens";

/** Display-only rates: 1 TND → target. Charged amounts stay TND on the server. */
export const RATES_FROM_TND: Record<CurrencyCode, number> = {
  TND: 1,
  EUR: 0.295,
  USD: 0.32,
  SAR: 1.2,
};

export const CURRENCY_SYMBOL: Record<CurrencyCode, string> = {
  TND: "د.ت",
  EUR: "€",
  USD: "$",
  SAR: "ر.س",
};

export const convertFromTnd = (amountTnd: number, to: CurrencyCode): number => {
  const value = Number(amountTnd ?? 0);
  if (!Number.isFinite(value)) return 0;
  return value * (RATES_FROM_TND[to] ?? 1);
};

export const formatPrice = (
  amountTnd: number,
  to: CurrencyCode = "TND",
  symbol = CURRENCY_SYMBOL[to]
): string => {
  const converted = convertFromTnd(amountTnd, to);
  const withCents = converted.toFixed(2);
  const trimmed = withCents.replace(/\.00$/, "");
  const [whole, cents] = trimmed.split(".");
  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  const number = cents ? `${grouped}.${cents}` : grouped;
  return `${number} ${symbol}`;
};
