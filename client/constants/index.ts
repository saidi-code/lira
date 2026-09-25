import { getThemeIsDark } from "./themeStore";

// ==========================================
// 1. Palettes
// ==========================================
/** Light palette — the original Lyra design values (unchanged). */
export const LIGHT_COLORS = {
  primary: "#B89354",
  accent: "#785920",
  secondary: "#4B5563",
  canvas: "#FFF8F5",
  body: "#201B16",
  surface: "#ECE0D9",
  inactive: "#A8A29E",
  active: "#B45309",
  white: "#FFFFFF",
  skeleton: "#E5E7EB",
} as const;

/**
 * Dark palette — same design language (warm sand / gold) tuned for a dark
 * canvas. Brand `primary` and text tones are lightened so they keep their
 * contrast against the dark surfaces; `white` intentionally stays white
 * because it is used as a foreground on coloured (brand) fills.
 */
export const DARK_COLORS = {
  primary: "#D9B87C",
  accent: "#B8A88A",
  secondary: "#A8A29E",
  canvas: "#1A1714",
  body: "#F5EFE9",
  surface: "#2C2723",
  inactive: "#8A837B",
  active: "#E08A2E",
  white: "#FFFFFF",
  skeleton: "#3A342E",
} as const;

export type Colors = typeof LIGHT_COLORS;

/**
 * Theme-aware colours.
 *
 * Each value is a getter, so `COLORS.primary` resolves to the palette of the
 * *currently active* theme at the moment it is read. That keeps every existing
 * call site (`color={COLORS.primary}`, `styles.header`) working without edits
 * while still following the theme.
 *
 * NOTE: getters are only evaluated when read. Values captured at module scope
 * (e.g. inside a module-level `StyleSheet.create`) freeze to the light palette
 * — those stylesheets must be created inside the component via
 * `useAppColors()` instead.
 */
export const COLORS = {
  get primary() {
    return getThemeIsDark() ? DARK_COLORS.primary : LIGHT_COLORS.primary;
  },
  get accent() {
    return getThemeIsDark() ? DARK_COLORS.accent : LIGHT_COLORS.accent;
  },
  get secondary() {
    return getThemeIsDark() ? DARK_COLORS.secondary : LIGHT_COLORS.secondary;
  },
  get canvas() {
    return getThemeIsDark() ? DARK_COLORS.canvas : LIGHT_COLORS.canvas;
  },
  get body() {
    return getThemeIsDark() ? DARK_COLORS.body : LIGHT_COLORS.body;
  },
  get surface() {
    return getThemeIsDark() ? DARK_COLORS.surface : LIGHT_COLORS.surface;
  },
  get inactive() {
    return getThemeIsDark() ? DARK_COLORS.inactive : LIGHT_COLORS.inactive;
  },
  get active() {
    return getThemeIsDark() ? DARK_COLORS.active : LIGHT_COLORS.active;
  },
  get white() {
    return getThemeIsDark() ? DARK_COLORS.white : LIGHT_COLORS.white;
  },
  get skeleton() {
    return getThemeIsDark() ? DARK_COLORS.skeleton : LIGHT_COLORS.skeleton;
  },
} as const;

/** Snapshot of the active palette (handy for building stylesheets). */
export function getColors(): Colors {
  return getThemeIsDark() ? { ...DARK_COLORS } : { ...LIGHT_COLORS };
}

export const CURRENCY = "د.ت";

export const ICON_PATHS = {
  DIAMOND: "../../assets/images/icons/diamon.svg",
  WATCH: "../../assets/images/icons/watch.svg",
  DRESS: "../../assets/images/icons/dress.svg",
} as const;

export const CATEGORIES = [
  { id: "1", name: "مجوهرات", title: "مجوهرات", icon: "../../assets/images/icons/diamon.svg" },
  { id: "2", name: "ساعات", title: "ساعات", icon: "../../assets/images/icons/watch.svg" },
  { id: "3", name: "عطور", title: "عطور", icon: "../../assets/images/icons/dress.svg" },
  { id: "4", name: "ملابس", title: "ملابس", icon: "../../assets/images/icons/dress.svg" },
  { id: "5", name: "باخور", title: "باخور", icon: "../../assets/images/icons/dress.svg" },
  { id: "6", name: "حقائب يد", title: "حقائب يد", icon: "../../assets/images/icons/dress.svg" },
  { id: "7", name: "إكسسوارات", title: "إكسسوارات", icon: "../../assets/images/icons/dress.svg" },
  { id: "8", name: "أحذية", title: "أحذية", icon: "../../assets/images/icons/dress.svg" },
  { id: "9", name: "مكياج", title: "مكياج", icon: "../../assets/images/icons/dress.svg" },
];

export const PROFILE_MENU = [
  { id: 1, title: "طلباتي", icon: "cube-sharp", route: "/order" },
  {
    id: 2,
    title: "عناوين الشحن",
    icon: "location-outline",
    route: "/address",
  },
  { id: 3, title: "تقيماتي", icon: "star-outline", route: "/reviews" },
  {
    id: 4,
    title: "طرق الدفع",
    icon: "cash-outline",
    route: "/payment-methods",
  },
  { id: 5, title: "الإعدادات", icon: "settings-outline", route: "/settings" },
];

export const ADDRESSES = [
  {
    id: 1,
    type: "المنزل",
    phone: "+21640444336",
    state: "مدنين",
    city: "مدنين",
    codePostal: 4100,
    address: "شارع أبو بكر الصديق منزل عدد 2 طريق بني خداش",
    country: "تونس",
    isDefault: true,
  },
  {
    id: 2,
    type: "المكتب",
    phone: "+21620123456",
    state: "مدنين",
    city: "مدنين",
    codePostal: 4100,
    address: "شارع أبو بكر الصديق منزل عدد 2 طريق بني خداش",
    country: "تونس",
    isDefault: false,
  },
  {
    id: 3,
    type: "أخري",
    phone: "+21620123456",
    state: "مدنين",
    city: "مدنين",
    codePostal: 4100,
    address: "شارع أبو بكر الصديق منزل عدد 2 طريق بني خداش",
    country: "تونس",
    isDefault: false,
  },
];
