import { useEffect, useState } from "react";
import { Dimensions } from "react-native";
import Toast from "react-native-toast-message";
import * as Haptics from "expo-haptics";
import { DARK_COLORS, LIGHT_COLORS, type Colors } from "./index";
import { getThemeIsDark, subscribeToTheme } from "./themeStore";

// Re-exported so components can import the theme type from this module
// alongside `useAppColors`.
export type { Colors };
const screenHeight = Dimensions.get("window").height;
export const ShowToast = (type: string, text: string) => {
  Toast.show({
    visibilityTime: 2000,
    type: type === "success" ? "successToast" : "errorToast",
    text1: type === "success" ? "تم!" : "خطأ!",
    text2: text,
    topOffset: screenHeight / 2,
  });
};
export const showSuccessToast = (text: string = "") => {
  console.log("showSuccessToast() called");
  Toast.show({
    visibilityTime: 2000,
    type: "successToast",
    text1: "تم!",
    text2: text,
    topOffset: screenHeight / 2, // Subtract half the height of your toast to center it exactl
  });
};

export const showErrorToast = (text: string = "") => {
  Toast.show({
    visibilityTime: 2000,
    type: "errorToast",
    text1: "خطأ!",
    text2: text,
    topOffset: screenHeight / 2 - 50, // Subtract half the height of your toast to center it exactl
  });
};

// ==========================================
// Haptics (AGENT.md §3.5 "Motion & Micro-interactions", §3.6.4)
// ==========================================
/**
 * Light tap feedback for chip / toggle selections (colour, size, wishlist).
 *
 * Failures are swallowed on purpose: there is no haptic engine on the web
 * target and on some Android devices, and a missing vibration must never
 * break the interaction it is meant to reinforce.
 */
export const hapticLight = () => {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
};

/** Success feedback — "add to bag" and order placement. */
export const hapticSuccess = () => {
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(
    () => {}
  );
};

export const getStatusColor = (status: string) => {
  switch (status) {
    case "placed":
      return "bg-active/15 text-active";
    case "processing":
      return "bg-info-surface text-info";
    case "shipped":
      return "bg-shipped-surface text-shipped";
    case "delivered":
      return "bg-success-surface text-success";
    case "cancelled":
      return "bg-danger-surface text-danger";
    default:
      return "bg-subtle text-muted";
  }
};

// Arabic labels for order / payment statuses (customer-facing screens)
export const ORDER_STATUS_LABELS: Record<string, string> = {
  placed: "تم استلام الطلب",
  processing: "قيد التجهيز",
  shipped: "تم الشحن",
  delivered: "تم التوصيل",
  cancelled: "ملغى",
};

export const PAYMENT_STATUS_LABELS: Record<string, string> = {
  pending: "في الانتظار",
  paid: "مدفوع",
  failed: "فشل الدفع",
  refunded: "مسترد",
};

export const PAYMENT_METHOD_LABELS: Record<string, string> = {
  cash: "الدفع عند الاستلام",
  stripe: "بطاقة بنكية",
};

// Stable date formatting (avoids Intl availability differences on Hermes)
export const formatDate = (iso: string) => {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}/${pad(d.getMonth() + 1)}/${pad(d.getDate())}`;
};


// ==========================================
// Navigation helpers
// ==========================================
export type RouteParams = Record<
  string,
  string | number | boolean | undefined | null
>;

type RouterMethod = (href: string, params?: RouteParams) => void;

const asParamsMethod = (method: unknown): RouterMethod =>
  method as RouterMethod;

/**
 * `navigate` / `push` / `replace` returned by `useRouter()`.
 *
 * expo-router 6.0.24 declares them as `(href, options?)`, while the runtime
 * deprecates the single-object form and expects `(href, params, options)`.
 * These wrappers keep the non-deprecated call shape and narrow `params` so the
 * calls type-check against the current (incomplete) declarations.
 *
 * TODO: drop these helpers once expo-router types the `params` argument.
 */
export const navigateTo = (
  router: { navigate: unknown },
  href: string,
  params?: RouteParams
) => asParamsMethod(router.navigate)(href, params);

export const pushTo = (
  router: { push: unknown },
  href: string,
  params?: RouteParams
) => asParamsMethod(router.push)(href, params);

export const replaceTo = (
  router: { replace: unknown },
  href: string,
  params?: RouteParams
) => asParamsMethod(router.replace)(href, params);

// ==========================================
// 5. Theme hook
// ==========================================
/**
 * Returns the active palette and re-renders the caller whenever the theme
 * changes.
 *
 * Use this (instead of a module-level `StyleSheet.create`) in components whose
 * styles read `COLORS` — a stylesheet built at module scope would capture the
 * light palette before the user ever toggles the theme.
 *
 *   const colors = useAppColors();
 *   const styles = useMemo(() => makeStyles(colors), [colors]);
 */
export function useAppColors(): Colors {
  const [isDark, setIsDark] = useState(getThemeIsDark);
  useEffect(() => subscribeToTheme(() => setIsDark(getThemeIsDark())), []);
  return isDark ? DARK_COLORS : LIGHT_COLORS;
}
