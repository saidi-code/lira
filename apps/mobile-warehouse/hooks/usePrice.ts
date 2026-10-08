// hooks/usePrice.ts
// ==========================================
// Formats a TND amount using the saved currency preference.
//
// Display only — see constants/currency.ts for why the underlying values
// and the charged amount stay in TND.
// ==========================================
import { useCallback } from "react";
import { useSettings } from "@/context/SettingsContext";
import { formatPrice } from "@/constants/currency";

/**
 * Returns a formatter for prices that are known to be denominated in TND.
 *
 *   const price = usePrice();
 *   <Text>{price(product.price)}</Text>
 */
export const usePrice = () => {
  const { settings, currencySymbol } = useSettings();

  return useCallback(
    (amountTnd: number) => formatPrice(amountTnd, settings.currency, currencySymbol),
    [settings.currency, currencySymbol]
  );
};
