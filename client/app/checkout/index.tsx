import { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useAuth } from "@clerk/clerk-expo";
import { useRouter } from "expo-router";
import { useCart } from "@/hooks/useCart";
import { useAddress } from "@/hooks/useAddress";
import { useCreateOrder } from "@/hooks/useOrder";
import { BackendAddress } from "@/config/addressApi";
import { PaymentMethod } from "@/config/orderApi";
import { COLORS } from "@/constants";
import SkeletonAddressCard from "@/components/SkeletonAddressCard";
import SkeletonCheckoutTotals from "@/components/SkeletonCheckoutTotals";

const SHIPPING_COST = 7;
const TAX_RATE = 0; // مثل 0.19 لـ 19%

const CheckoutScreen = () => {
  const router = useRouter();
  const { isSignedIn } = useAuth();

  // ---------- السلة ----------
  const { cartItems, cartTotal, clearCart } = useCart();

  // ---------- العناوين ----------
  const {
    addresses,
    defaultAddress,
    isLoading: isAddressLoading,
  } = useAddress();

  // ---------- الطلبات ----------
  // Use the create-order mutation directly: the unified useOrder() hook also
  // fetches the orders list, which made the confirm button appear stuck in its
  // "confirming..." state on mount until that unrelated fetch settled.
  const createOrderMutation = useCreateOrder();
  const isCreatingOrder = createOrderMutation.isLoading;

  // ---------- الحالة المحلية ----------
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(
    null
  );
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash");

  // العنوان المختار: المحدد يدويًا → الافتراضي → الأول
  const selectedAddress: BackendAddress | null =
    addresses.find((a) => a._id === selectedAddressId) ??
    defaultAddress ??
    addresses[0] ??
    null;

  // ---------- الحسابات ----------
  const subtotal = cartTotal ?? 0;
  const tax = +(subtotal * TAX_RATE).toFixed(2);
  const totalAmount = +(subtotal + SHIPPING_COST + tax).toFixed(2);

  // ---------- الإجراءات ----------
  const handlePlaceOrder = async () => {
    if (!isSignedIn) {
      Alert.alert("تنبيه", "يرجى تسجيل الدخول لإتمام الطلب.");
      return;
    }
    if (!selectedAddress) {
      Alert.alert("تنبيه", "يرجى اختيار عنوان الشحن.");
      return;
    }
    if (!cartItems?.length) {
      Alert.alert("تنبيه", "سلة التسوق فارغة.");
      return;
    }

    try {
      const order = await createOrderMutation.mutateAsync({
        items: cartItems.map((item) => ({
          product: item.product._id,
          quantity: item.quantity,
          size: item.size ?? null,
          color: item.color ?? null,
        })),
        shippingAddressId: selectedAddress._id,
        paymentMethod,
        shippingCost: SHIPPING_COST,
        tax,
      });

      // بعض الـ hooks تُرجع { data: order } والبعض يُرجع order مباشرة
      const createdOrder = (order as any)?.data ?? order;

      if (!createdOrder?._id) {
        Alert.alert("خطأ", "تم إنشاء الطلب لكن لم يتم استلام رقمه.");
        return;
      }

      // بيانات شاشة النجاح تُلتقط قبل إفراغ السلة
      const orderItems = createdOrder.items ?? [];
      const itemsCount = orderItems.length || cartItems.length;
      const firstName =
        orderItems[0]?.name ?? cartItems[0]?.product?.name ?? "";
      const successParams = {
        orderId: String(createdOrder._id),
        orderNumber: String(createdOrder.orderNumber ?? ""),
        total: Number(createdOrder.totalAmount ?? totalAmount).toFixed(2),
        productName: firstName
          ? itemsCount > 1
            ? `${firstName} +${itemsCount - 1}`
            : firstName
          : "",
        productImage: String(
          orderItems[0]?.image ?? cartItems[0]?.product?.images?.[0] ?? ""
        ),
      };

      // لا يجوز لفشل إفراغ السلة إخفاء نجاح الطلب — الطلب أُنشئ بالفعل،
      // وستُحدَّث السلة تلقائيًا عبر invalidateQueries في useCreateOrder.
      try {
        await clearCart();
      } catch (clearError) {
        console.warn("clearCart after order failed:", clearError);
      }
      router.replace({
        pathname: "/checkout/checkoutSuccess",
        params: successParams,
      });
    } catch (e: any) {
      console.error("createOrder failed:", e);
      Alert.alert(
        "تعذّر إنشاء الطلب",
        e?.response?.data?.message ??
          e?.message ??
          "حدث خطأ غير متوقع. حاول مرة أخرى."
      );
    }
  };

  // ---------- حالة التحميل (Skeleton) ----------
  if (isAddressLoading) {
    return (
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
      >
        <Text style={styles.sectionTitle}>عنوان الشحن</Text>
        <SkeletonAddressCard />
        <SkeletonAddressCard />
        <SkeletonAddressCard />

        <Text style={styles.sectionTitle}>طريقة الدفع</Text>
        <SkeletonAddressCard />
        <SkeletonAddressCard />

        <Text style={styles.sectionTitle}>المجاميع</Text>
        <SkeletonCheckoutTotals />
      </ScrollView>
    );
  }

  // ---------- لا يوجد عنوان ----------
  if (!selectedAddress) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyText}>
          لا يوجد عنوان شحن. يرجى إضافة عنوان أولاً.
        </Text>
        <TouchableOpacity
          style={styles.primaryBtn}
          onPress={() => router.push("/address")}
        >
          <Text style={styles.primaryBtnText}>إضافة عنوان</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* ============ عنوان الشحن ============ */}
      <Text style={styles.sectionTitle}>عنوان الشحن</Text>

      {addresses.map((addr) => {
        const isSelected = addr._id === selectedAddress._id;
        return (
          <TouchableOpacity
            key={addr._id}
            onPress={() => setSelectedAddressId(addr._id)}
            style={[styles.card, isSelected && styles.cardSelected]}
            activeOpacity={0.8}
          >
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>
                {addr.type === "Home"
                  ? "🏠 المنزل"
                  : addr.type === "Work"
                    ? "🏢 العمل"
                    : "📍 آخر"}
              </Text>
              {addr.isDefault && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>افتراضي</Text>
                </View>
              )}
            </View>
            <Text style={styles.cardText}>
              {addr.street}، {addr.city}، {addr.state} {addr.zipCode}
            </Text>
            <Text style={styles.cardText}>📞 {addr.phoneNumber}</Text>
          </TouchableOpacity>
        );
      })}

      <TouchableOpacity
        style={styles.secondaryBtn}
        onPress={() => router.push("/address")}
        activeOpacity={0.8}
      >
        <Text style={styles.secondaryBtnText}>+ إضافة عنوان جديد</Text>
      </TouchableOpacity>

      {/* ============ طريقة الدفع ============ */}
      <Text style={styles.sectionTitle}>طريقة الدفع</Text>

      {(["cash", "stripe"] as PaymentMethod[]).map((method) => {
        const isSelected = paymentMethod === method;
        return (
          <TouchableOpacity
            key={method}
            onPress={() => setPaymentMethod(method)}
            style={[styles.card, isSelected && styles.cardSelected]}
            activeOpacity={0.8}
          >
            <Text style={styles.cardTitle}>
              {method === "cash" ? "💵 الدفع عند الاستلام" : "💳 بطاقة بنكية"}
            </Text>
          </TouchableOpacity>
        );
      })}

      {/* ============ ملخص الطلب ============ */}
      <Text style={styles.sectionTitle}>ملخص الطلب</Text>

      <View style={styles.summaryBox}>
        {cartItems.map((item) => {
          const unitPrice =
            (item as any).price ??
            (item.product as any)?.price ??
            0;
          return (
            <View key={item._id} style={styles.summaryRow}>
              <Text style={styles.summaryText} numberOfLines={1}>
                {item.product.name} × {item.quantity}
              </Text>
              <Text style={styles.summaryText}>
                {(unitPrice * item.quantity).toFixed(2)} د.ت
              </Text>
            </View>
          );
        })}

        <View style={styles.divider} />

        <View style={styles.summaryRow}>
          <Text style={styles.summaryText}>المجموع الفرعي</Text>
          <Text style={styles.summaryText}>{subtotal.toFixed(2)} د.ت</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryText}>الشحن</Text>
          <Text style={styles.summaryText}>
            {SHIPPING_COST.toFixed(2)} د.ت
          </Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryText}>الضريبة</Text>
          <Text style={styles.summaryText}>{tax.toFixed(2)} د.ت</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.summaryRow}>
          <Text style={styles.totalLabel}>الإجمالي</Text>
          <Text style={styles.totalLabel}>{totalAmount.toFixed(2)} د.ت</Text>
        </View>
      </View>

    {/* ============ تأكيد الطلب ============ */}
<TouchableOpacity
  style={[
    styles.primaryBtn,
    ( !cartItems.length) && styles.btnDisabled,
  ]}
  disabled={isCreatingOrder || !cartItems.length}
  onPress={handlePlaceOrder}
  activeOpacity={0.85}
>
  {isCreatingOrder ? (
    <View style={styles.btnRow}>
      <ActivityIndicator color="#fff" size="small" />
      <Text style={styles.primaryBtnText}>جارٍ تأكيد الطلب...</Text>
    </View>
  ) : (
    <Text style={styles.primaryBtnText}>
      {`تأكيد الطلب (${totalAmount.toFixed(2)} د.ت)`}
    </Text>
  )}
</TouchableOpacity>

    </ScrollView>
  );
};

export default CheckoutScreen;


// ==========================================
// الأنماط
// ==========================================
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f7f7f7" },
  content: { padding: 16, paddingBottom: 60 },
  btnRow: {
  flexDirection: "row",
  alignItems: "center",
  gap: 8,
},
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    backgroundColor: "#f7f7f7",
  },

  emptyText: {
    fontSize: 16,
    color: "#555",
    textAlign: "center",
    marginBottom: 20,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginTop: 20,
    marginBottom: 10,
    textAlign: "right",
    color: COLORS.primary,
    writingDirection: "rtl",
  },

  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: "transparent",
  },
  cardSelected: {
    borderColor: COLORS.primary,
    backgroundColor: "#fff",
  },
  cardHeader: {
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: "700",
    textAlign: "right",
    color: "#111",
    writingDirection: "rtl",
  },
  cardText: {
    fontSize: 13,
    color: "#555",
    marginTop: 4,
    textAlign: "right",
    writingDirection: "rtl",
  },

  badge: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  badgeText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "700",
  },

  summaryBox: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 14,
  },
  summaryRow: {
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  summaryText: {
    fontSize: 14,
    color: "#333",
    writingDirection: "rtl",
  },
  divider: {
    height: 1,
    backgroundColor: "#eee",
    marginVertical: 8,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: "800",
    color: COLORS.primary,
    writingDirection: "rtl",
  },

  primaryBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 24,
  },
  primaryBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
    writingDirection: "rtl",
  },
  btnDisabled: { opacity: 0.5 },

  secondaryBtn: {
    paddingVertical: 12,
    alignItems: "center",
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    marginBottom: 8,
  },
  secondaryBtnText: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: "700",
    writingDirection: "rtl",
  },
});