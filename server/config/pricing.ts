// config/pricing.ts
// ==========================================
// SERVER-AUTHORITATIVE PRICING
// ==========================================
// Shipping and tax are NEVER taken from the request body. If they were, any
// client could post `shippingCost: 0` (or a negative number — `Number(-5) || 0`
// is `-5`) and buy below cost.
//
// `createOrder` therefore recomputes every total here, from the price stored in
// MongoDB for each product, and simply ignores whatever the client sent.
// Clients may *render* these values (GET /api/v1/pricing) but never dictate
// them — AGENT.md §6.1, "one API, many clients. No business logic duplicated
// in clients."
// ==========================================

/** Parses an env override, rejecting NaN and negatives. */
const envNumber = (value: string | undefined, fallback: number): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
};

export const PRICING = {
  /** Flat shipping fee, per order. */
  shippingCost: envNumber(process.env.SHIPPING_COST, 7),
  /** Fraction, not percent: `0.19` = 19 %. */
  taxRate: envNumber(process.env.TAX_RATE, 0),
  /**
   * Orders at or above this subtotal ship free. `null` (the default) disables
   * the rule, so shipping is always charged.
   */
  freeShippingThreshold:
    process.env.FREE_SHIPPING_THRESHOLD === undefined
      ? null
      : envNumber(process.env.FREE_SHIPPING_THRESHOLD, 0),
} as const;

export interface PricedLine {
  /** Price read from the database — never from the request body. */
  price: number;
  quantity: number;
}

export interface OrderTotals {
  subtotal: number;
  shippingCost: number;
  tax: number;
  totalAmount: number;
}

/** Money is kept to two decimals so float error never reaches an invoice. */
export const roundMoney = (value: number): number =>
  Math.round((value + Number.EPSILON) * 100) / 100;

/**
 * Recomputes an order's totals from its lines.
 *
 * Called with the DB-priced lines only — this is the single source of truth for
 * `subtotal`, `shippingCost`, `tax` and `totalAmount`.
 */
export const computeTotals = (lines: PricedLine[]): OrderTotals => {
  // Round each line first, then sum: an invoice must add up line by line, so
  // the order subtotal is the sum of the amounts printed on it — not the sum of
  // unrounded products that only agrees to the cent by luck.
  const subtotal = roundMoney(
    lines.reduce(
      (sum, line) => sum + roundMoney(line.price * line.quantity),
      0
    )
  );

  const threshold = PRICING.freeShippingThreshold;
  const freeShipping =
    // Nothing to ship. `createOrder` rejects empty orders before pricing gets
    // here, so this is purely defensive.
    lines.length === 0 ||
    (threshold !== null && subtotal >= threshold);

  const shippingCost = freeShipping ? 0 : PRICING.shippingCost;
  const tax = roundMoney(subtotal * PRICING.taxRate);

  return {
    subtotal,
    shippingCost: roundMoney(shippingCost),
    tax,
    totalAmount: roundMoney(subtotal + shippingCost + tax),
  };
};

export default PRICING;
