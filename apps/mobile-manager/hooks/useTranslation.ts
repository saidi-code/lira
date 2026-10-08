// hooks/useTranslation.ts
// ==========================================
// Translation hook bound to the saved language preference.
// ==========================================
import { useCallback, useMemo } from "react";
import { I18nManager } from "react-native";
import { useSettings } from "@/context/SettingsContext";
import {
  translate,
  TranslationKey,
  totalTranslationKeys,
  missingKeys,
} from "@/constants/i18n";

/**
 * Returns a translator bound to the user's chosen language.
 *
 *   const { t, isRTL } = useTranslation();
 *   <Text>{t("addToCart")}</Text>
 *
 * Unknown keys fall back to Arabic rather than rendering the raw key.
 */
export const useTranslation = () => {
  const { settings, isRTL, languageLabel } = useSettings();
  const lang = settings.language;

  const t = useCallback(
    (key: TranslationKey) => translate(lang, key),
    [lang]
  );

  /**
   * Swaps the app between RTL and LTR and flushes the change so the native
   * layout mirrors immediately. Must be called from a user gesture (a tap on
   * the language row) — RN requires a reload for direction changes to fully
   * take effect, and mutating it during render throws.
   */
  const setTextDirection = useCallback(
    (nextRTL: boolean) => {
      if (I18nManager.isRTL === nextRTL) return;
      I18nManager.allowRTL(nextRTL);
      I18nManager.forceRTL(nextRTL);
    },
    []
  );

  const coverage = useMemo(
    () => ({
      total: totalTranslationKeys,
      missing: missingKeys(lang),
    }),
    [lang]
  );

  return { t, lang, isRTL, languageLabel, setTextDirection, coverage };
};
