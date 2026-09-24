import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Text, View } from "react-native";

const SuccessToast = (props: any) => {
  const text1 = props?.text1;
  const text2 = props?.text2;
  return (

      <View   style={{
        display: "flex",
        alignItems: "center",
        flexDirection: "column",
        backgroundColor: "#fff8f5",
        borderRadius: 8,
        padding: 16,
        minWidth: 300,
        zIndex: 9999,
      
      }} 
     >
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
   
  );
};

export default SuccessToast;
