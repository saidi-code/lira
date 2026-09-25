import AsyncStorage from "@react-native-async-storage/async-storage";
import { useColorScheme } from "nativewind";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

// ==========================================
// 1. Available options
// ==========================================
export const LANGUAGES = [
  { code: "ar", label: "العربية", dir: "rtl" },
  { code: "fr", label: "Français", dir: "ltr" },
  { code: "en", label: "English", dir: "ltr" },
] as const;

export const CURRENCIES = [
  { code: "TND", label: "دينار تونسي", symbol: "د.ت" },
  { code: "EUR", label: "يورو", symbol: "€" },
  { code: "USD", label: "دولار أمريكي", symbol: "$" },
  { code: "SAR", label: "ريال سعودي", symbol: "ر.س" },
] as const;

export const THEME_MODES = [
  { code: "light", label: "فاتح" },
  { code: "dark", label: "داكن" },
  { code: "system", label: "حسب النظام" },
] as const;

export type LanguageCode = (typeof LANGUAGES)[number]["code"];
export type CurrencyCode = (typeof CURRENCIES)[number]["code"];
export type ThemeMode = (typeof THEME_MODES)[number]["code"];

// ==========================================
// 2. Shape + defaults
// ==========================================
export interface Settings {
  language: LanguageCode;
  currency: CurrencyCode;
  theme: ThemeMode;
  phoneNotifications: boolean;
  emailNotifications: boolean;
}

export const DEFAULT_SETTINGS: Settings = {
  language: "ar",
  currency: "TND",
  theme: "light",
  phoneNotifications: false,
  emailNotifications: false,
};

const STORAGE_KEY = "@lyra/settings/v1";

const isLanguage = (v: unknown): v is LanguageCode =>
  LANGUAGES.some((l) => l.code === v);
const isCurrency = (v: unknown): v is CurrencyCode =>
  CURRENCIES.some((c) => c.code === v);
const isTheme = (v: unknown): v is ThemeMode =>
  THEME_MODES.some((t) => t.code === v);

/** Merge stored JSON over defaults, discarding unknown/invalid values. */
const parseStored = (raw: string | null): Settings => {
  if (!raw) return DEFAULT_SETTINGS;
  try {
    const parsed = JSON.parse(raw) as Partial<Settings>;
    return {
      language: isLanguage(parsed.language)
        ? parsed.language
        : DEFAULT_SETTINGS.language,
      currency: isCurrency(parsed.currency)
        ? parsed.currency
        : DEFAULT_SETTINGS.currency,
      theme: isTheme(parsed.theme) ? parsed.theme : DEFAULT_SETTINGS.theme,
      phoneNotifications: Boolean(parsed.phoneNotifications),
      emailNotifications: Boolean(parsed.emailNotifications),
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
};

// ==========================================
// 3. Context
// ==========================================
interface SettingsContextValue {
  settings: Settings;
  /** False until AsyncStorage has been read; avoid persisting defaults early. */
  hydrated: boolean;
  setLanguage: (value: LanguageCode) => void;
  setCurrency: (value: CurrencyCode) => void;
  setTheme: (value: ThemeMode) => void;
  setPhoneNotifications: (value: boolean) => void;
  setEmailNotifications: (value: boolean) => void;
  resetSettings: () => void;
  /** Resolved display values for the chosen options. */
  languageLabel: string;
  currencyLabel: string;
  currencySymbol: string;
  isRTL: boolean;
  isDark: boolean;
}

const SettingsContext = createContext<SettingsContextValue | null>(null);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [hydrated, setHydrated] = useState(false);
  const { setColorScheme, colorScheme } = useColorScheme();

  // --- Load persisted settings once on mount ---
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (active) setSettings(parseStored(raw));
      } catch (error) {
        console.warn("Failed to load settings:", error);
      } finally {
        if (active) setHydrated(true);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  // --- Persist on change (skip until hydrated so defaults never overwrite data) ---
  useEffect(() => {
    if (!hydrated) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(settings)).catch(
      (error) => console.warn("Failed to save settings:", error)
    );
  }, [settings, hydrated]);

  // --- Apply theme to NativeWind ---
  useEffect(() => {
    setColorScheme(settings.theme);
  }, [settings.theme, setColorScheme]);

  const update = useCallback(<K extends keyof Settings>(key: K, value: Settings[K]) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  }, []);

  const value = useMemo<SettingsContextValue>(() => {
    const language =
      LANGUAGES.find((l) => l.code === settings.language) ?? LANGUAGES[0];
    const currency =
      CURRENCIES.find((c) => c.code === settings.currency) ?? CURRENCIES[0];
    return {
      settings,
      hydrated,
      setLanguage: (v) => update("language", v),
      setCurrency: (v) => update("currency", v),
      setTheme: (v) => update("theme", v),
      setPhoneNotifications: (v) => update("phoneNotifications", v),
      setEmailNotifications: (v) => update("emailNotifications", v),
      resetSettings: () => setSettings(DEFAULT_SETTINGS),
      languageLabel: language.label,
      currencyLabel: currency.label,
      currencySymbol: currency.symbol,
      isRTL: language.dir === "rtl",
      isDark: colorScheme === "dark",
    };
  }, [settings, hydrated, update, colorScheme]);

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
}

// ==========================================
// 4. Hook
// ==========================================
export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) {
    throw new Error("useSettings must be used inside <SettingsProvider>");
  }
  return ctx;
}
