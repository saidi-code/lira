import React from "react";
import { Text, View } from "react-native";
import { CURRENCY } from "../constants/index";
import { OrderSummaryProps } from "../constants/types";
const OrderSummary = ({ subtotal, shipping, total }: OrderSummaryProps) => {
  return (
    <View className="self-stretch p-6 bg-white/50 rounded-2xl flex-col justify-start items-start gap-4">
      {/* Header with bottom border */}
      <View className="self-stretch pb-2 border-b border-[#d1c5b4] flex-row justify-end items-center">
        <Text className="text-right text-body  font-body text-lg ">
          ملخص الطلب
        </Text>
      </View>

      {/* Subtotal row */}
      <View className="self-stretch flex-row justify-between items-center">
        <Text className="text-right text-body  font-body text-base  ">
          {subtotal} {CURRENCY}
        </Text>
        <Text className="text-right text-primary-600 text-base  font-body">
          المجموع الفرعي
        </Text>
      </View>

      {/* Shipping row */}
      <View className="self-stretch flex-row justify-between items-center">
        <Text className="text-right text-[#785920] text-base leading-6 font-medium">
          {shipping} {CURRENCY}
        </Text>
        <Text className="text-right text-[#645d59] text-base leading-6 font-normal">
          الشحن والتوصيل
        </Text>
      </View>

      {/* Total row with top border */}
      <View className="self-stretch pt-2 border-t border-[#d1c5b4] flex-row justify-between items-center">
        <Text className="text-right text-[#785920] text-base leading-6 font-normal">
          {total} {CURRENCY}
        </Text>
        <Text className="text-right text-[#201b16] text-base leading-6 font-normal">
          الإجمالي
        </Text>
      </View>
    </View>
  );
};

export default OrderSummary;
