// app/order/[id].tsx — Order details
import { useLocalSearchParams, useRouter } from "expo-router";
import React from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import Header from "@/components/Header";
import { COLORS, CURRENCY } from "@/constants";
import {
  ORDER_STATUS_LABELS,
  PAYMENT_METHOD_LABELS,
  PAYMENT_STATUS_LABELS,
  formatDate,
  getStatusColor,
} from "@/constants/utility";
import { useOrderByIdQuery, useCancelOrder } from "@/hooks/useOrder";

const SectionTitle = ({ children }: { children: React.ReactNode }) => (
  <Text className="text-right text-body text-xl font-tajwal font-medium mt-6 mb-3">
    {children}
  </Text>
);

const OrderDetailScreen = () => {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const { order, isLoading, isError } = useOrderByIdQuery(id);
  const cancelOrder = useCancelOrder();

  const handleCancel = () => {
    if (!order) return;
    Alert.alert(
      "إلغاء الطلب",
      `هل أنت متأكد من إلغاء الطلب ${order.orderNumber}؟`,
      [
        { text: "تراجع", style: "cancel" },
        {
          text: "إلغاء الطلب",
          style: "destructive",
          onPress: () => cancelOrder.mutate(order._id),
        },
      ]
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-surface" edges={["top"]}>
        <Header showBack />
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (isError || !order) {
    return (
      <SafeAreaView className="flex-1 bg-surface" edges={["top"]}>
        <Header showBack />
        <View className="flex-1 justify-center items-center px-6">
          <Text className="text-lg text-primary font-tajwal mb-4">
            تعذّر عرض الطلب
          </Text>
          <TouchableOpacity
            onPress={() => router.back()}
            className="px-8 py-3 bg-[#785920] rounded-full"
          >
            <Text className="text-white font-tajwal">رجوع</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const cancellable =
    order.orderStatus === "placed" || order.orderStatus === "processing";

  return (
    <SafeAreaView className="bg-surface flex-1" edges={["top"]}>
      <Header showBack />
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 16, paddingBottom: 48 }}
      >
        {/* Title */}
        <View className="items-center gap-2 mt-4 mb-6">
          <Text className="text-center text-primary text-base font-medium font-tajwal uppercase tracking-wider">
            تفاصيل الطلب
          </Text>
          <Text className="text-center text-body text-4xl leading-[43px] font-bold font-jazera">
            {order.orderNumber}
          </Text>
        </View>

        {/* Status + date */}
        <View className="bg-card rounded-xl border border-primary-100 shadow-sm p-4">
          <View className="flex-row-reverse justify-between items-center">
            <View
              className={`px-3 py-1 rounded-full ${getStatusColor(order.orderStatus)}`}
            >
              <Text className="text-xs font-bold font-tajwal">
                {ORDER_STATUS_LABELS[order.orderStatus] ?? order.orderStatus}
              </Text>
            </View>
            <View className="flex-row-reverse items-center gap-2">
              <Ionicons name="calendar-outline" size={16} color={COLORS.inactive} />
              <Text className="font-body text-sm text-secondary">
                {formatDate(order.createdAt)}
              </Text>
            </View>
          </View>
        </View>

        {/* Items */}
        <SectionTitle>المنتجات</SectionTitle>
        <View className="bg-card rounded-xl border border-primary-100 shadow-sm p-4">
          {order.items.map((item, index) => (
            <View
              key={`${item.product}-${index}`}
              className="flex-row-reverse items-center gap-3 py-2"
            >
              {item.image ? (
                <Image
                  source={{ uri: item.image }}
                  className="w-16 h-16 rounded-lg"
                  resizeMode="cover"
                />
              ) : (
                <View className="w-16 h-16 rounded-lg bg-surface items-center justify-center">
                  <Ionicons name="cube-outline" size={24} color={COLORS.inactive} />
                </View>
              )}
              <View className="flex-1">
                <Text className="text-right font-body text-sm text-body font-medium">
                  {item.name}
                </Text>
                <Text className="text-right text-xs text-inactive font-body mt-1">
                  الكمية: {item.quantity}
                  {item.size ? ` • المقاس: ${item.size}` : ""}
                  {item.color ? ` • اللون: ${item.color}` : ""}
                </Text>
              </View>
              <Text className="font-tajwal text-accent text-sm">
                {item.subtotal.toFixed(2)} {CURRENCY}
              </Text>
            </View>
          ))}
        </View>

        {/* Shipping address */}
        <SectionTitle>عنوان الشحن</SectionTitle>
        <View className="bg-card rounded-xl border border-primary-100 shadow-sm p-4 flex-row-reverse items-start gap-3">
          <Ionicons name="location-outline" size={20} color={COLORS.primary} />
          <View className="flex-1">
            <Text className="text-right font-body text-sm text-body leading-6">
              {order.shippingAddress.street}، {order.shippingAddress.city}،{" "}
              {order.shippingAddress.state} {order.shippingAddress.zipCode}
            </Text>
            <Text className="text-right font-body text-sm text-secondary mt-1">
              📞 {order.shippingAddress.phoneNumber}
            </Text>
          </View>
        </View>

        {/* Payment */}
        <SectionTitle>الدفع</SectionTitle>
        <View className="bg-card rounded-xl border border-primary-100 shadow-sm p-4">
          <View className="flex-row-reverse justify-between items-center mb-2">
            <Text className="font-body text-sm text-secondary">طريقة الدفع</Text>
            <Text className="font-tajwal text-sm text-body">
              {PAYMENT_METHOD_LABELS[order.paymentMethod] ?? order.paymentMethod}
            </Text>
          </View>
          <View className="flex-row-reverse justify-between items-center">
            <Text className="font-body text-sm text-secondary">حالة الدفع</Text>
            <Text className="font-tajwal text-sm text-body">
              {PAYMENT_STATUS_LABELS[order.paymentStatus] ?? order.paymentStatus}
            </Text>
          </View>
        </View>

        {/* Totals */}
        <SectionTitle>ملخص الطلب</SectionTitle>
        <View className="bg-card rounded-xl border border-primary-100 shadow-sm p-4">
          <View className="flex-row-reverse justify-between mb-2">
            <Text className="font-body text-sm text-secondary">المجموع الفرعي</Text>
            <Text className="font-body text-sm text-body">
              {order.subtotal.toFixed(2)} {CURRENCY}
            </Text>
          </View>
          <View className="flex-row-reverse justify-between mb-2">
            <Text className="font-body text-sm text-secondary">الشحن والتوصيل</Text>
            <Text className="font-body text-sm text-body">
              {order.shippingCost.toFixed(2)} {CURRENCY}
            </Text>
          </View>
          <View className="flex-row-reverse justify-between mb-2">
            <Text className="font-body text-sm text-secondary">الضريبة</Text>
            <Text className="font-body text-sm text-body">
              {order.tax.toFixed(2)} {CURRENCY}
            </Text>
          </View>
          <View className="flex-row-reverse justify-between border-t border-primary-100 pt-3 mt-1">
            <Text className="font-tajwal text-base text-primary font-bold">
              الإجمالي
            </Text>
            <Text className="font-tajwal text-base text-primary font-bold">
              {order.totalAmount.toFixed(2)} {CURRENCY}
            </Text>
          </View>
        </View>

        {/* Cancel */}
        {cancellable && (
          <TouchableOpacity
            activeOpacity={0.85}
            disabled={cancelOrder.isLoading}
            onPress={handleCancel}
            className="mt-6 py-4 rounded-lg items-center bg-danger-surface border border-danger-surface flex-row justify-center gap-2"
          >
            {cancelOrder.isLoading ? (
              <ActivityIndicator size="small" color="#dc2626" />
            ) : (
              <>
                <Ionicons name="close-circle-outline" size={20} color="#dc2626" />
                <Text className="font-body text-danger font-semibold text-base">
                  إلغاء الطلب
                </Text>
              </>
            )}
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export default OrderDetailScreen;