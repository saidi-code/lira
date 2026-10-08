// constants/i18n.ts
// ==========================================
// Lightweight translation layer.
//
// Deliberately dependency-free: the app already hand-rolls its utilities, and
// i18next would add ~100kB plus a provider for what is a flat key/value lookup.
//
// Arabic is the source of truth. Every key exists in `ar`; `fr`/`en` fall back
// to `ar` when a translation is missing, so a partial translation degrades to
// readable Arabic rather than showing a raw key.
// ==========================================

export const translations = {
  // ---------------- Common (ar) ----------------
  ar: {
    save: "حفظ",
    cancel: "إلغاء",
    delete: "حذف",
    edit: "تعديل",
    confirm: "تأكيد",
    continue: "متابعة",
    back: "رجوع",
    next: "التالي",
    submit: "إرسال",
    search: "بحث",
    filter: "تصفية",
    clear: "مسح",
    apply: "تطبيق",
    close: "إغلاق",
    retry: "إعادة المحاولة",
    loading: "جاري التحميل...",
    seeAll: "عرض الكل",
    optional: "اختياري",
    empty: "لا توجد عناصر",
    error: "حدث خطأ",
    success: "تم بنجاح",
    noResults: "لا توجد نتائج",

    // tabs / nav
    home: "الرئيسية",
    shop: "المتجر",
    cart: "السلة",
    wishlist: "المفضلة",
    profile: "حسابي",
    orders: "طلباتي",
    myOrders: "طلباتي",
    addresses: "عناوين الشحن",
    reviews: "تقييماتي",
    paymentMethods: "طرق الدفع",
    settings: "الإعدادات",

    // products
    products: "المنتجات",
    product: "منتج",
    price: "السعر",
    size: "المقاس",
    color: "اللون",
    quantity: "الكمية",
    addToCart: "أضف إلى السلة",
    buyNow: "اشترِ الآن",
    outOfStock: "نفدت الكمية",
    inStock: "متوفر",
    allCategories: "كل الفئات",
    categories: "الفئات",
    collections: "المجموعات",
    newArrivals: "وصل حديثاً",

    // cart & checkout
    orderSummary: "ملخص الطلب",
    subtotal: "المجموع الفرعي",
    shipping: "الشحن",
    tax: "الضريبة",
    total: "المجموع",
    checkout: "الدفع",
    proceedToCheckout: "إتمام الطلب",
    shippingAddress: "عنوان الشحن",
    paymentMethod: "طريقة الدفع",
    coupon: "الرمز الترويجي",
    applyCoupon: "تطبيق",

    // orders
    orderNumber: "رقم الطلب",
    orderDate: "تاريخ الطلب",
    orderStatus: "حالة الطلب",
    paymentStatus: "حالة الدفع",
    placed: "تم استلام الطلب",
    processing: "قيد التجهيز",
    shipped: "تم الشحن",
    delivered: "تم التوصيل",
    cancelled: "ملغى",
    pending: "في الانتظار",
    paid: "مدفوع",
    failed: "فشل الدفع",
    refunded: "مسترد",

    // auth
    signIn: "تسجيل الدخول",
    signUp: "إنشاء حساب",
    signOut: "تسجيل الخروج",
    email: "البريد الإلكتروني",
    password: "كلمة المرور",
    confirmPassword: "تأكيد كلمة المرور",
    fullName: "الاسم الكامل",
    phone: "رقم الهاتف",
    forgotPassword: "نسيت كلمة المرور؟",
    haveAccount: "لديك حساب بالفعل؟",
    noAccount: "ليس لديك حساب؟",

    // drawer settings
    notifications: "التبليهات",
    preferences: "التفضيلات",
    language: "اللغة",
    currency: "العملة",
    theme: "المظهر",
    light: "فاتح",
    dark: "داكن",
    system: "حسب النظام",
    chooseLanguage: "اختيار اللغة",
    chooseCurrency: "اختيار العملة",
    chooseTheme: "اختيار المظهر",
    phoneNotifications: "التنبيهات عبر الهاتف",
    emailNotifications: "تحديثات البريد الإلكتروني",
    // currency names (shown in the currency picker)
    currencyTND: "دينار تونسي",
    currencyEUR: "يورو",
    currencyUSD: "دولار أمريكي",
    currencySAR: "ريال سعودي",
  },
  fr: {
    save: "Enregistrer", cancel: "Annuler", delete: "Supprimer",
    edit: "Modifier", confirm: "Confirmer", continue: "Continuer",
    back: "Retour", next: "Suivant", submit: "Envoyer",
    search: "Rechercher", filter: "Filtrer", clear: "Effacer",
    apply: "Appliquer", close: "Fermer", retry: "Réessayer",
    loading: "Chargement...", seeAll: "Voir tout", optional: "facultatif",
    empty: "Aucun élément", error: "Une erreur est survenue",
    success: "Réussi", noResults: "Aucun résultat",

    home: "Accueil", shop: "Boutique", cart: "Panier",
    wishlist: "Favoris", profile: "Mon compte",
    orders: "Commandes", myOrders: "Mes commandes",
    addresses: "Adresses de livraison", reviews: "Mes avis",
    paymentMethods: "Moyens de paiement", settings: "Paramètres",

    products: "Produits", product: "Produit", price: "Prix",
    size: "Taille", color: "Couleur", quantity: "Quantité",
    addToCart: "Ajouter au panier", buyNow: "Acheter maintenant",
    outOfStock: "Rupture de stock", inStock: "En stock",
    allCategories: "Toutes les catégories", categories: "Catégories",
    collections: "Collections", newArrivals: "Nouveautés",

    orderSummary: "Récapitulatif", subtotal: "Sous-total",
    shipping: "Livraison", tax: "Taxe", total: "Total",
    checkout: "Paiement", proceedToCheckout: "Commander",
    shippingAddress: "Adresse de livraison",
    paymentMethod: "Moyen de paiement", coupon: "Code promo",
    applyCoupon: "Appliquer",

    orderNumber: "N° de commande", orderDate: "Date de commande",
    orderStatus: "Statut", paymentStatus: "Statut du paiement",
    placed: "Commande reçue", processing: "En préparation",
    shipped: "Expédiée", delivered: "Livrée", cancelled: "Annulée",
    pending: "En attente", paid: "Payée",
    failed: "Échec du paiement", refunded: "Remboursée",

    signIn: "Connexion", signUp: "Créer un compte", signOut: "Déconnexion",
    email: "E-mail", password: "Mot de passe",
    confirmPassword: "Confirmer le mot de passe", fullName: "Nom complet",
    phone: "Téléphone", forgotPassword: "Mot de passe oublié ?",
    haveAccount: "Vous avez déjà un compte ?",
    noAccount: "Vous n'avez pas de compte ?",

    notifications: "Notifications", preferences: "Préférences",
    language: "Langue", currency: "Devise", theme: "Thème",
    light: "Clair", dark: "Sombre", system: "Système",
    chooseLanguage: "Choisir la langue",
    chooseCurrency: "Choisir la devise", chooseTheme: "Choisir le thème",
    phoneNotifications: "Notifications téléphone",
    emailNotifications: "Notifications e-mail",
    currencyTND: "Dinar tunisien", currencyEUR: "Euro",
    currencyUSD: "Dollar américain", currencySAR: "Riyal saoudien",
    fr: "Français",
  },
  en: {
    save: "Save", cancel: "Cancel", delete: "Delete", edit: "Edit",
    confirm: "Confirm", continue: "Continue", back: "Back",
    next: "Next", submit: "Submit", search: "Search", filter: "Filter",
    clear: "Clear", apply: "Apply", close: "Close", retry: "Retry",
    loading: "Loading...", seeAll: "See all", optional: "optional",
    empty: "Nothing here yet", error: "Something went wrong",
    success: "Success", noResults: "No results",

    home: "Home", shop: "Shop", cart: "Cart", wishlist: "Wishlist",
    profile: "Account", orders: "Orders", myOrders: "My orders",
    addresses: "Shipping addresses", reviews: "My reviews",
    paymentMethods: "Payment methods", settings: "Settings",

    products: "Products", product: "Product", price: "Price",
    size: "Size", color: "Color", quantity: "Quantity",
    addToCart: "Add to cart", buyNow: "Buy now",
    outOfStock: "Out of stock", inStock: "In stock",
    allCategories: "All categories", categories: "Categories",
    collections: "Collections", newArrivals: "New arrivals",

    orderSummary: "Order summary", subtotal: "Subtotal",
    shipping: "Shipping", tax: "Tax", total: "Total",
    checkout: "Checkout", proceedToCheckout: "Proceed to checkout",
    shippingAddress: "Shipping address", paymentMethod: "Payment method",
    coupon: "Coupon code", applyCoupon: "Apply",

    orderNumber: "Order number", orderDate: "Order date",
    orderStatus: "Order status", paymentStatus: "Payment status",
    placed: "Order received", processing: "Processing",
    shipped: "Shipped", delivered: "Delivered", cancelled: "Cancelled",
    pending: "Pending", paid: "Paid", failed: "Payment failed",
    refunded: "Refunded",

    signIn: "Sign in", signUp: "Sign up", signOut: "Sign out",
    email: "Email", password: "Password",
    confirmPassword: "Confirm password", fullName: "Full name",
    phone: "Phone", forgotPassword: "Forgot password?",
    haveAccount: "Already have an account?",
    noAccount: "Don't have an account?",

    notifications: "Notifications", preferences: "Preferences",
    language: "Language", currency: "Currency", theme: "Theme",
    light: "Light", dark: "Dark", system: "System",
    chooseLanguage: "Choose language", chooseCurrency: "Choose currency",
    chooseTheme: "Choose theme", phoneNotifications: "Phone notifications",
    emailNotifications: "Email updates",
    currencyTND: "Tunisian dinar", currencyEUR: "Euro",
    currencyUSD: "US dollar", currencySAR: "Saudi riyal",
    fr: "French", en: "English",
  },
} as const;

export type TranslationKey = keyof typeof translations.ar;
export type TranslationLang = keyof typeof translations;

/** Looks up a key, falling back to Arabic then to the key itself. */
export const translate = (
  lang: string,
  key: TranslationKey
): string => {
  const table = (translations as Record<string, Partial<Record<TranslationKey, string>>>)[lang];
  return table?.[key] ?? translations.ar[key] ?? key;
};

/** Keys a locale has not translated yet (dev aid; Arabic is the fallback). */
export const missingKeys = (lang: TranslationLang): TranslationKey[] => {
  const all = Object.keys(translations.ar) as TranslationKey[];
  const table = translations[lang] as Partial<Record<TranslationKey, string>>;
  return all.filter((k) => !table[k]);
};

export const totalTranslationKeys = Object.keys(translations.ar).length;
