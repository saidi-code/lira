import { useQuery } from "@tanstack/react-query";
import {
  FALLBACK_PRICING,
  pricingApi,
  type PricingConfig,
} from "../config/pricingApi";

// ==========================================
// 1. Query Keys
// ==========================================
export const pricingKeys = {
  all: ["pricing"] as const,
};

// ==========================================
// 2. Query Hook: usePricing
// ==========================================
/**
 * Shipping fee and tax rate used to *preview* the totals at checkout.
 *
 * The server recomputes every amount when the order is created
 * (server/config/pricing.ts), so a stale or failed fetch here can only make the
 * preview look slightly off — it can never change what the customer is charged.
 * That is what makes showing a fallback value safe.
 */
export function usePricing() {
  const query = useQuery<PricingConfig, Error>({
    queryKey: pricingKeys.all,
    queryFn: () => pricingApi.getPricing(),
    staleTime: 1000 * 60 * 30,
    retry: 1,
    placeholderData: FALLBACK_PRICING,
  });

  return {
    ...query,
    pricing: query.data ?? FALLBACK_PRICING,
  };
}

export default usePricing;
