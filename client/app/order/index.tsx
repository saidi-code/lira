// app/order/index.tsx — My Orders
import { useRouter, useLocalSearchParams } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  RefreshControl,
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
  formatDate,
  getStatusColor,
} from "@/constants/utility";
import { useMyOrdersQuery, useCancelOrder } from "@/hooks/useOrder";
import { BackendOrder, OrderStatus } from "@/config/orderApi";

const FILTERS: { key: OrderStatus | "all"; label: string }[] = [
  { key: "all", label: "الكل" },
  { key: "placed", label: ORDER_STATUS_LABELS.placed },
  { key: "processing", label: ORDER_STATUS_LABELS.processing },
  { key: "shipped", label: ORDER_STATUS_LABELS.shipped },
  { key: "delivered", label: ORDER_STATUS_LABELS.delivered },
  { key: "cancelled", label: ORDER_STATUS_LABELS.cancelled },
];

const isCancellable = (status: OrderStatus) =>
  status === "placed" || status === "processing";

const OrdersScreen = () => {
  const router = useRouter();
  const { orderId } = useLocalSearchParams<{ orderId?: string }>();

  const [filter, setFilter] = useState<OrderStatus | "all">("all");
  const [refreshing, setRefreshing] = useState(false);

  const { orders, isLoading, isError, refetch } = useMyOrdersQuery(
    filter === "all" ? { limit: 50 } : { limit: 50, status: filter }
  );
  const cancelOrder = useCancelOrder();

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const handleCancel = (order: BackendOrder) => {
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

  // Success banner (right after checkout)
  const justCreatedOrder = orderId
    ? orders.find((o) => o._id === orderId)
    : undefined;

  const renderContent = () => {
    if (isLoading && !refreshing) {
      return (
        <View className="flex-1 justify-center items-center py-24">
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text className="mt-3 font-tajwal text-secondary">
            جارٍ تحميل طلباتك...
          </Text>
        </View>
      );
    }

    if (isError) {
      return (
        <View className="mx-4 p-4 items-center justify-center bg-canvas rounded-xl border border-primary border-dashed">
          <Text className="text-center text-xl text-primary-700 font-jazera mb-4 font-bold">
            تعذّر تحميل الطلبات
          </Text>
          <Text className="text-primary-500 font-tajwal text-center px-4 mb-6">
            حدث خطأ أثناء جلب طلباتك، حاول مرة أخرى.
          </Text>
          <TouchableOpacity
            onPress={() => refetch()}
            activeOpacity={0.8}
            className="self-stretch py-4 bg-[#785920] rounded-full shadow-md items-center"
          >
            <Text className="text-white text-base font-tajwal">إعادة المحاولة</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (orders.length === 0) {
      return (
        <View className="mx-4 p-4 items-center justify-center bg-canvas rounded-xl border border-primary border-dashed">
          <Text className="text-center text-xl text-primary-700 font-jazera mb-4 font-bold">
            لا توجد طلبات بعد
          </Text>
          <Text className="text-primary-500 font-tajwal text-center px-4 mb-6">
            ابدأ التسوق واستمتع بتجربة تسوق فاخرة تناسب ذوقك الراقي
          </Text>
          <TouchableOpacity
            onPress={() => router.push("/")}
            activeOpacity={0.8}
            className="self-stretch py-5 bg-[#785920] rounded-full shadow-md flex-row justify-center items-center gap-2"
          >
            <Ionicons name="bag-outline" color="#fff" size={20} />
            <Text className="text-white text-base font-tajwal">ابدأ التسوق الآن</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <>
        {justCreatedOrder && (
          <View className="mx-4 mb-4 p-4 bg-green-50 rounded-xl border border-green-200">
            <View className="flex-row-reverse items-center gap-3">
              <Ionicons name="checkmark-circle" size={28} color="#16a34a" />
              <View className="flex-1">
                <Text className="text-right font-tajwal text-lg text-green-900 font-bold">
                  تم إنشاء طلبك بنجاح!
                </Text>
                <Text className="text-right font-body text-sm text-green-800 mt-1">
                  رقم الطلب: {justCreatedOrder.orderNumber}
                </Text>
              </View>
            </View>
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => router.push(`/order/${justCreatedOrder._id}`)}
              className="mt-3 py-3 bg-[#785920] rounded-full items-center"
            >
              <Text className="text-white font-tajwal text-base">
                عرض تفاصيل الطلب
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {orders.map((order) => (
          <TouchableOpacity
            key={order._id}
            activeOpacity={0.85}
            onPress={() => router.push(`/order/${order._id}`)}
            className="bg-white mx-4 mb-4 rounded-xl border border-primary-100 shadow-sm p-4"
          >
            <View className="flex-row-reverse justify-between items-center">
              <Text className="font-tajwal text-body text-lg">
                {order.orderNumber}
              </Text>
              <View
                className={`px-3 py-1 rounded-full ${getStatusColor(order.orderStatus)}`}
              >
                <Text className="text-xs font-bold font-tajwal">
                  {ORDER_STATUS_LABELS[order.orderStatus] ?? order.orderStatus}
                </Text>
              </View>
            </View>

            <Text className="text-right text-xs text-inactive font-body mt-1 mb-3">
              {formatDate(order.createdAt)}
            </Text>

            <View className="flex-row-reverse items-center gap-3 mb-3">
              {order.items[0]?.image ? (
                <Image
                  source={{ uri: order.items[0].image }}
                  className="w-14 h-14 rounded-lg"
                  resizeMode="cover"
                />
              ) : (
                <View className="w-14 h-14 rounded-lg bg-surface items-center justify-center">
                  <Ionicons name="cube-outline" size={24} color={COLORS.inactive} />
                </View>
              )}
              <View className="flex-1">
                <Text
                  className="text-right font-body text-sm text-body"
                  numberOfLines={1}
                >
                  {order.items[0]?.name ?? "منتج"}
                </Text>
                <Text className="text-right text-xs text-inactive font-body mt-1">
                  {order.items.length > 1
                    ? `و ${order.items.length - 1} منتجات أخرى`
                    : `الكمية: ${order.items[0]?.quantity ?? 1}`}
                </Text>
              </View>
              <Text className="font-tajwal text-accent text-base">
                {order.totalAmount.toFixed(2)} {CURRENCY}
              </Text>
            </View>

            <View className="flex-row-reverse justify-between items-center border-t border-primary-100 pt-3">
              <Text className="text-primary font-body text-sm font-medium">
                عرض التفاصيل
              </Text>
              {isCancellable(order.orderStatus) && (
                <TouchableOpacity
                  activeOpacity={0.7}
                  disabled={cancelOrder.isLoading}
                  onPress={() => handleCancel(order)}
                  className="px-3 py-1 rounded-full bg-red-50 border border-red-100"
                >
                  <Text className="text-red-600 text-xs font-body font-semibold">
                    إلغاء الطلب
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </TouchableOpacity>
        ))}
      </>
    );
  };

  return (
    <SafeAreaView className="bg-surface flex-1" edges={["top"]}>
      <Header showBack />
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.primary}
          />
        }
      >
        <View className="flex-1 justify-center items-center gap-2 mt-8 mb-6">
          <Text className="text-center text-primary text-base font-medium font-tajwal uppercase tracking-wider">
            تابع مشترياتك الأخيرة
          </Text>
          <Text className="text-center text-body text-4xl leading-[43px] font-bold font-jazera">
            طلباتي
          </Text>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{
            flexDirection: "row-reverse",
            gap: 8,
            paddingHorizontal: 16,
            marginBottom: 16,
          }}
        >
          {FILTERS.map((f) => (
            <TouchableOpacity
              key={f.key}
              activeOpacity={0.8}
              onPress={() => setFilter(f.key)}
              className={`px-4 py-2 rounded-full border ${
                filter === f.key
                  ? "bg-[#785920] border-[#785920]"
                  : "bg-white border-primary-200"
              }`}
            >
              <Text
                className={`font-tajwal text-sm ${
                  filter === f.key ? "text-white" : "text-primary-700"
                }`}
              >
                {f.label}
              </Text>
            </TouchableOpacity>
          ))}
           
        </ScrollView>
        {renderContent()}
        <View className="h-6" />
      </ScrollView>
    </SafeAreaView>
  );
};

export default OrdersScreen;


