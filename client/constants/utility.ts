import { Dimensions } from "react-native";
import Toast from "react-native-toast-message";
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
export const getStatusColor = (status: string) => {
  switch (status) {
    case "placed":
      return "bg-yellow-50 text-yellow-900";
    case "processing":
      return "bg-indigo-50 text-indigo-900";
    case "shipped":
      return "bg-purple-50 text-purple-900";
    case "delivered":
      return "bg-green-50 text-green-900";
    case "cancelled":
      return "bg-red-50 text-red-900";
    default:
      return "bg-gray-50 text-gray-900";
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
