// constants/currency.ts
// ==========================================
// DISPLAY CURRENCY CONVERSION
// ==========================================
//
// IMPORTANT — read before using.
//
// Every price in the app (and in Mongo) is stored as a plain number in
// TUNISIAN DINAR (TND). The server computes order totals in TND
// (`totalAmount = subtotal + shipping + tax`) and there is no currency
// field on the Order or Product models, because there is no card
// processor — payment is cash on delivery.
//
// So this module is DISPLAY ONLY. It converts amounts for presentation
// according to the user's saved preference. It does NOT change what is
// charged, what is persisted, or what appears on the order record.
//
// The rates below are a static, hand-maintained snapshot. They will
// drift from real markets. Replace them with a fetched rate (e.g. an
// exchange-rate API cached daily) before relying on them for anything
// other than a rough preview.
// ==========================================

// Type-only import: erased at compile time, so this module never pulls in
// the context at runtime (the context already imports from constants/).
import type { CurrencyCode } from "@/context/SettingsContext";

/** Units of each currency per 1 TND. */
export const RATES_FROM_TND: Record<CurrencyCode, number> = {
  TND: 1,
  EUR: 0.295,
  USD: 0.32,
  SAR: 1.2,
};

/** Converts a TND amount into the target currency. */
export const convertFromTnd = (
  amountTnd: number,
  to: CurrencyCode
): number => {
  const value = Number(amountTnd ?? 0);
  if (!Number.isFinite(value)) return 0;
  return value * (RATES_FROM_TND[to] ?? 1);
};

/**
 * Formats a TND amount for display in the target currency.
 *
 * Trims a trailing `.00` so whole amounts stay clean ("320 €"), while
 * keeping real cents ("145.50 €"). Jumps to thousands separators.
 */
export const formatPrice = (
  amountTnd: number,
  to: CurrencyCode,
  symbol: string
): string => {
  const converted = convertFromTnd(amountTnd, to);
  const withCents = converted.toFixed(2);
  const trimmed = withCents.replace(/\.00$/, "");
  const [whole, cents] = trimmed.split(".");
  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  const number = cents ? `${grouped}.${cents}` : grouped;
  return `${number} ${symbol}`;
};
