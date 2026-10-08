import { api } from "./api";

// ==================== Types ====================

export interface PricingConfig {
  /** Flat shipping fee charged per order. */
  shippingCost: number;
  /** Fraction, not percent: `0.19` = 19 %. */
  taxRate: number;
  /** Subtotal at/above which shipping is waived; `null` = never waived. */
  freeShippingThreshold: number | null;
}

export interface PricingResponse {
  success: boolean;
  data?: PricingConfig;
}

/**
 * Used when the pricing feed is unreachable. Mirrors the server defaults in
 * `server/config/pricing.ts` so an offline screen still shows coherent numbers.
 * Display only — the server always recomputes what is actually charged.
 */
export const FALLBACK_PRICING: PricingConfig = {
  shippingCost: 7,
  taxRate: 0,
  freeShippingThreshold: null,
};

// ==================== API ====================

export const pricingApi = {
  /**
   * GET /api/v1/pricing (public)
   */
  getPricing: async (): Promise<PricingConfig> => {
    const res = await api.get<PricingResponse>("/pricing");
    return res.data ?? FALLBACK_PRICING;
  },
};
