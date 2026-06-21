import React, { useMemo } from "react";
import { Modal, Text, Image, TouchableOpacity, View } from "react-native";
import { useRouter } from "expo-router";
import { useCart } from "../context/CartContext";
import { IProduct } from "../constants/types";
import { COLORS } from "../constants/index";

type Props = {
  show: boolean;
  setShow: (v: boolean) => void;
  product: IProduct | null;
  selectedSize: string | null;
  selectedColor: string | null;
};

const ChooseColorSizeModal = ({ show, setShow, product, selectedSize, selectedColor }: Props) => {
  const router = useRouter();
  const { addToCart, loading } = useCart();

  const isVariable = product?.type === "variable";

  const isValidSelection = useMemo(() => {
    if (!isVariable) return true;
    return Boolean(selectedColor) && Boolean(selectedSize);
  }, [isVariable, selectedColor, selectedSize]);

  return (
    <Modal
      visible={show}
      transparent
      animationType="fade"
      onRequestClose={() => {
        setShow(false);
      }}
    >
      <View className="flex-1 bg-black/50 items-center justify-center px-6">
        <View
          className="w-full rounded-3xl bg-white p-5"
          style={{
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.15,
            shadowRadius: 20,
            elevation: 6,
          }}
        >
          <View className="items-center mb-4">
            <View className="justify-center items-center w-16 h-16 rounded-full bg-[#b89354]/5 mb-2">
              <Image
                style={{ height: 48, width: 48 }}
                resizeMode="contain"
                source={require("../assets/images/logo2.png")}
              />
            </View>

            <Text className="text-2xl font-bold text-primary-700 font-tajwal">
              إضافة إلى الحقيبة
            </Text>

            {isVariable && !isValidSelection && (
              <Text className="text-gray-500 text-sm font-tajwal mt-2 text-center">
                اختر اللون والمقاس أولاً
              </Text>
            )}
          </View>

          <TouchableOpacity
            onPress={async () => {
              if (!product) return;
              if (!isValidSelection) return;
              // addToCart in CartContext expects: (product, size, color)
              await addToCart(product, selectedSize, selectedColor);
              setShow(false);
            }}
            activeOpacity={0.8}
            disabled={!isValidSelection || loading}
            className={`w-full py-4 rounded-full items-center mt-1 ${
              !isValidSelection || loading ? "bg-gray-300" : "bg-[#785920]"
            }`}
          >
            <Text className={`text-lg font-bold font-tajwal ${
              !isValidSelection || loading ? "text-gray-600" : "text-white"
            }`}>
              إضافة إلى الحقيبة
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              setShow(false);
            }}
            activeOpacity={0.8}
            className="w-full items-center mt-3 py-2"
          >
            <Text className="text-gray-500 text-base font-tajwal">إلغاء</Text>
          </TouchableOpacity>

          {/* If not signed in, CartContext will open its own auth modal.
              Keeping these buttons for consistency with previous UI. */}
          <TouchableOpacity
            onPress={() => {
              router.push("/(auth)/signIn");
              setShow(false);
            }}
            activeOpacity={0.8}
            className="w-full py-4 rounded-full bg-primary-100 items-center mt-3"
          >
            <Text className="text-[#785920] text-lg font-bold font-tajwal">تسجيل الدخول</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

export default ChooseColorSizeModal;

