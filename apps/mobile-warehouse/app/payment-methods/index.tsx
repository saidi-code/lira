// app/payment-methods/index.tsx — supported payment methods (info)
import React from "react";
import { ScrollView, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import Header from "@/components/Header";

const METHODS = [
  {
    icon: "cash-outline",
    title: "الدفع عند الاستلام",
    description:
      "ادفع نقداً عند وصول طلبك إلى العنوان المحدد. متاح لجميع الطلبات داخل تونس.",
    badge: "متاح",
    badgeClass: "bg-success-surface text-success",
  },
  {
    icon: "card-outline",
    title: "الدفع بالبطاقة (Stripe)",
    description:
      "ادفع بأمان عبر بطاقات Visa و Mastercard مع تشفير كامل لبياناتك.",
    badge: "متاح",
    badgeClass: "bg-success-surface text-success",
  },
];

const PaymentMethodsScreen = () => {
  return (
    <SafeAreaView className="bg-surface flex-1" edges={["top"]}>
      <Header showBack />
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 32 }}
      >
        <View className="flex-1 justify-center items-center gap-2 mt-8 mb-6">
          <Text className="text-center text-primary text-base font-medium font-tajwal uppercase tracking-wider">
            دفع آمن وسهل
          </Text>
          <Text className="text-center text-body text-4xl leading-[43px] font-bold font-jazera">
            طرق الدفع
          </Text>
        </View>

        <View className="mx-4">
          {METHODS.map((method) => (
            <View
              key={method.title}
              className="bg-card rounded-xl border border-primary-100 shadow-sm p-4 mb-4"
            >
              <View className="flex-row-reverse justify-between items-center mb-2">
                <View className="flex-row-reverse items-center gap-3">
                  <View className="h-10 w-10 rounded-full bg-accent/10 items-center justify-center">
                    <Ionicons name={method.icon as any} size={20} color="#785920" />
                  </View>
                  <Text className="font-tajwal text-body text-base font-medium">
                    {method.title}
                  </Text>
                </View>
                <View className={`px-3 py-1 rounded-full ${method.badgeClass}`}>
                  <Text className="font-tajwal text-xs font-bold">
                    {method.badge}
                  </Text>
                </View>
              </View>
              <Text className="text-right font-body text-sm text-secondary leading-6">
                {method.description}
              </Text>
            </View>
          ))}

          {/* Security note */}
          <View className="bg-canvas rounded-xl border border-primary-200 p-4 flex-row-reverse items-start gap-3">
            <Ionicons name="lock-closed-outline" size={18} color="#785920" />
            <Text className="flex-1 text-right font-body text-xs text-secondary leading-6">
              جميع المعاملات مشفرة. لا نحتفظ ببيانات بطاقتك على خوادمنا — تُعالج
              بشكل آمن عبر مزوّد الدفع.
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default PaymentMethodsScreen;