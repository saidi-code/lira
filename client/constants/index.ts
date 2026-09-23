export const COLORS = {
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
};

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
