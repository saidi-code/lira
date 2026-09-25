import React from 'react';
import { 
  View, 
  Text, 
  Image, 
  TouchableOpacity, 
  ScrollView, 
  SafeAreaView 
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { CURRENCY } from '@/constants';

// --- TYPES ---
interface CheckoutData {
  orderId: string;
  title: string;
  subtitle: string;
  labels: {
    orderNumber: string;
    total: string;
    duration: string;
    productName: string;
  };
  totalAmount: string;
  estimatedDuration: string;
  product: {
    name: string;
    imageUrl: string;
  };
  buttons: {
    trackOrder: string;
    backToStore: string;
  };
}

// --- CONSTANTS (Replace these with real data) ---
const CHECKOUT_DATA: CheckoutData = {
  orderId: "#LR-8829",
  title: "تم استلام طلبك بنجاح!",
  subtitle: "شكراً لاختيارك لنا. سيصلك بريد إلكتروني بتفاصيل الطلب قريباً",
  labels: {
    orderNumber: "رقم الطلب",
    total: "إجمالي المبلغ",
    duration: "المدة المتوقعة",
    productName: "اسم المنتج",
  },
  totalAmount: "1,250 ر.س",
  estimatedDuration: "14 أكتوبر",
  product: {
    name: "حقيبة ليرا كلاسيكية - بني داكن",
    // Replace with your local asset using require() or keep as remote URL
    imageUrl: "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?q=80&w=200&auto=format&fit=crop", 
  },
  buttons: {
    trackOrder: "تابع تتبع الطلب",
    backToStore: "العودة للمتجر",
  }
};

// --- Route params passed by the checkout screen (all strings) ---
type SuccessParams = {
  orderId?: string;
  orderNumber?: string;
  total?: string;
  productName?: string;
  productImage?: string;
};

const firstParam = (v?: string | string[]) =>
  (Array.isArray(v) ? v[0] : v) ?? "";

// Arabic month names — avoids Intl availability differences on Hermes
const AR_MONTHS = [
  "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
  "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر",
];
const formatArabicDate = (d: Date) =>
  `${d.getDate()} ${AR_MONTHS[d.getMonth()]}`;

// Typical delivery window (the backend order model has no ETA field)
const ESTIMATED_DELIVERY_DAYS = 7;

// --- COMPONENT ---
const CheckoutSuccess: React.FC = () => {
  const router = useRouter();
  const params = useLocalSearchParams<SuccessParams>();

  const orderNumber = firstParam(params.orderNumber);
  const orderId = firstParam(params.orderId);
  const total = firstParam(params.total);
  const productName = firstParam(params.productName);
  const productImage = firstParam(params.productImage);

  // Live view of the order: real data when routed from checkout,
  // demo values from CHECKOUT_DATA when opened directly.
  const data: CheckoutData = {
    ...CHECKOUT_DATA,
    orderId: orderNumber || CHECKOUT_DATA.orderId,
    totalAmount: total ? `${total} ${CURRENCY}` : CHECKOUT_DATA.totalAmount,
    estimatedDuration: formatArabicDate(
      new Date(Date.now() + ESTIMATED_DELIVERY_DAYS * 24 * 60 * 60 * 1000)
    ),
    product: {
      name: productName || CHECKOUT_DATA.product.name,
      imageUrl: productImage || CHECKOUT_DATA.product.imageUrl,
    },
  };

  return (
    <SafeAreaView className="flex-1 bg-[#FDF8F5]">
      <ScrollView 
        contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 16 }}
        showsVerticalScrollIndicator={false}
      >
        
        {/* Card Container */}
        <View className="w-full bg-card rounded-3xl shadow-lg overflow-hidden relative pb-6">
          
          {/* Top Decorative Background Shape */}
          <View className="absolute top-0 left-0 w-full h-48 bg-[#F9EEE8] rounded-b-[200px] z-0" />

          <View className="relative z-10 px-6 flex flex-col items-center">
            
            {/* --- Success Icon Section --- */}
            <View className="mt-10 mb-6 relative items-center justify-center">
              {/* Outer Circle with dashed border effect */}
              <View className="w-24 h-24 rounded-full border border-dashed border-[#D6C4B0] items-center justify-center p-2">
                <View className="w-16 h-16 bg-[#8A7042] rounded-full items-center justify-center shadow-md">
                  <Ionicons name="checkmark" size={32} color="white" />
                </View>
              </View>
            </View>

            {/* --- Header Text --- */}
            <Text className="text-2xl font-bold text-[#6D5629] mb-2 text-center">
              {CHECKOUT_DATA.title}
            </Text>
            <Text className="text-xs text-[#8C7B6B] text-center mb-8 px-4 leading-5">
              {CHECKOUT_DATA.subtitle}
            </Text>

            {/* --- Order Details Card --- */}
            <View className="w-full bg-[#FAFAFA] rounded-xl p-4 mb-6 border border-subtle-border">
              
              {/* Order Number Row */}
              <View className="flex-row justify-between items-center mb-4">
                <Text className="text-xs text-muted">{CHECKOUT_DATA.labels.orderNumber}</Text>
                <Text className="font-bold text-[#8A7042] text-lg tracking-wider">
                  {data.orderId}
                </Text>
              </View>

              {/* Two Columns: Price & Duration */}
              <View className="flex-row gap-3 mb-3">
                {/* Total Price Box */}
                <View className="flex-1 bg-[#FDF6F2] rounded-lg p-3 items-center">
                  <Text className="text-[10px] text-muted mb-1">{CHECKOUT_DATA.labels.total}</Text>
                  <Text className="font-bold text-[#4A3B2A] text-lg">{data.totalAmount}</Text>
                </View>
                
                {/* Duration Box */}
                <View className="flex-1 bg-[#FDF6F2] rounded-lg p-3 items-center">
                  <Text className="text-[10px] text-muted mb-1">{CHECKOUT_DATA.labels.duration}</Text>
                  <Text className="font-bold text-[#4A3B2A] text-lg">{data.estimatedDuration}</Text>
                </View>
              </View>

              {/* Product Info Row */}
              <View className="bg-card rounded-lg p-3 flex-row items-center justify-between border border-subtle-border shadow-sm">
                <View className="flex-row items-center gap-3">
                  <Image 
                    source={{ uri: data.product.imageUrl }} 
                    className="w-10 h-10 rounded-md bg-gray-200"
                  />
                  <View className="flex-col items-end">
                    <Text className="text-[10px] text-muted">{CHECKOUT_DATA.labels.productName}</Text>
                    <Text className="text-xs font-bold text-[#4A3B2A]">
                      {data.product.name}
                    </Text>
                  </View>
                </View>
              </View>

            </View>

            {/* --- Action Buttons --- */}
            <View className="w-full">
              {/* Primary Button */}
              <TouchableOpacity 
                className="w-full bg-[#8A7042] py-3.5 rounded-full shadow-md items-center justify-center"
                activeOpacity={0.8}
                onPress={() =>
                  orderId
                    ? router.push(`/order?orderId=${orderId}`)
                    : router.push("/order")
                }
              >
                <Text className="text-white font-bold text-sm">
                  {CHECKOUT_DATA.buttons.trackOrder}
                </Text>
              </TouchableOpacity>

              {/* Secondary Button */}
              <TouchableOpacity 
                className="w-full bg-transparent border border-[#8A7042] py-3.5 rounded-full flex-row items-center justify-center gap-2 mt-3"
                activeOpacity={0.6}
                onPress={() => router.push("/shop")}
              >
                <Text className="text-[#8A7042] font-bold text-sm">
                  {CHECKOUT_DATA.buttons.backToStore}
                </Text>
                <MaterialIcons name="arrow-back" size={16} color="#8A7042" />
              </TouchableOpacity>
            </View>

          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default CheckoutSuccess;