import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Text, View } from "react-native";

const SuccessToast = (props: any) => {
  const text1 = props?.text1;
  const text2 = props?.text2;
  return (
    <View
      className="bg-surface blur-3xl p-4 rounded-xl min-w-[300px] z-10"
      style={{
        elevation: 1,
        position: "absolute",
        top: "50%",
        left: "50%",
        transform: [{ translateX: -150 }, { translateY: -60 }],
      }}
    >
      <View className="flex-1 items-center">
        <Ionicons name="checkmark-circle" size={44} color="#16a34a" />
        <Text className="mt-2 font-semibold font-tajwal text-xl text-body text-center">
          {text1 ?? "تم!"}
        </Text>
        {text2 && (
          <Text className="text-body text-lg font-tajwal text-right">
            {text2}
          </Text>
        )}
      </View>
    </View>
  );
};

export default SuccessToast;
