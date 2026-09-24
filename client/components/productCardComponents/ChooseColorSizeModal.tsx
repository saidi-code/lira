import React, { useMemo, useState } from "react";
import {
  FlatList,
  Image,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { useCart } from "../../hooks/useCart";
import { IProduct } from "../../constants/types";

type Props = {
  show: boolean;
  setShow: (v: boolean) => void;
  product: IProduct | null;
};

const ChooseColorSizeModal = ({
  show,
  setShow,
  product,

}: Props) => {
  const { addToCart } = useCart();
   const defaultColor = product?.colors?.[0]?.hex ?? null;
     const defaultSize = product?.colors?.[0]?.variants?.[0]?.size ?? null;
  const [selectedSize] = useState<string | null>(defaultSize);
  const [selectedColor, setSelectedColor] = useState<string | null>(
    defaultColor,
  );
    
const [uiColor, setUiColor] = useState<string | null>(selectedColor);
const [, setUiSize] = useState<string | null>(selectedSize);
  const isVariable = product?.type === "variable";

  

  // Keep UI state in sync when parent changes (first open / reset)
  React.useEffect(() => {
    setUiColor(selectedColor);
    setUiSize(selectedSize);
  }, [selectedColor, selectedSize, show]);

  const colors = useMemo(() => (product as any)?.colors ?? [], [product]);
  const activeColorObj = useMemo(() => {
    if (!isVariable) return null;
    return colors.find((c: any) => c?.name === uiColor) ?? colors?.[0] ?? null;
  }, [colors, isVariable, uiColor]);

  const sizes = useMemo(() => {
    if (!isVariable) return [];
    const variants = activeColorObj?.variants ?? [];
    // In your schema variants.size is an array of strings.
    const allSizes: string[] = [];
    variants.forEach((v: any) => {
      if (Array.isArray(v?.size)) allSizes.push(...v.size);
      else if (v?.size != null) allSizes.push(String(v.size));
    });
    // de-dup
    return Array.from(new Set(allSizes));
  }, [activeColorObj, isVariable]);



  return (
    <Modal
      visible={show}
      transparent
      animationType="fade"
      onRequestClose={() => setShow(false)}
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
          <ScrollView contentContainerStyle={{ paddingBottom: 12 }}>
            <View className="items-center mb-4">
              <View className="justify-center items-center w-16 h-16 rounded-full bg-[#b89354]/5 mb-2">
                <Image
                  style={{ height: 48, width: 48 }}
                  resizeMode="contain"
                  source={require("../../assets/images/logo2.png")}
                />
              </View>

              <Text className="text-2xl font-bold text-primary-700 font-tajwal">
                إضافة إلى الحقيبة
              </Text>

              
                <Text className="text-gray-500 text-sm font-tajwal mt-2 text-center">
                  اختر اللون والمقاس أولاً
                </Text>
              
            </View>

            {isVariable && (
              <>
                <Text className="text-right font-tajwal text-base text-[#807668] mb-3">
                  اللون
                </Text>

                <FlatList
                  data={colors}
                  keyExtractor={(_, index) => String(index)}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ paddingHorizontal: 2, gap: 12,justifyContent:"flex-end" }}
                  renderItem={({ item: colorObj }: any) => {
                    const colorName = colorObj?.name;
                    const isSelected = uiColor === colorName;
                    return (
                      <Pressable
                        onPress={() => {
                          setSelectedColor(colorName);
                          setUiColor(colorName);
                          // // When switching color, reset size; user chooses again
                          // setUiSize(null);
                        }}
                        className="h-8 w-8 rounded-full"
                        style={{
                          backgroundColor: colorObj?.hex ?? "#000",
                          outlineWidth: 2,
                          outlineColor: isSelected ? "#B89354" : "rgba(184,147,84,0.4)",
                          shadowColor: "#fff",
                          shadowOpacity: 0.2,
                          shadowRadius: 6,
                          elevation: 4,
                          outlineOffset: 2,
                          margin: 4,
                        }}
                      />
                    );
                  }}
                />

                <View className="h-4" />

                <Text className="text-right font-tajwal text-base text-[#807668] mb-3">
                  المقاس
                </Text>

                <FlatList
                  data={sizes}
                  keyExtractor={(s: any, index: number) => `${s ?? ""}-${index}`}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ padding: 2, gap: 12, flexGrow: 0 ,alignItems:"flex-start",justifyContent:"flex-end"}}
                  renderItem={({ item: size }: any) => {
                    const isSelected = selectedSize === String(size);
                    return (
                      <Pressable
                        onPress={() => setUiSize(String(size))}
                        className="flex items-center justify-center rounded-lg"
                        style={{
                          height: 36,
                          minWidth: 36,
                          paddingHorizontal: 10,
                          backgroundColor: isSelected ? "#B89354" : "#fff",
                          borderStyle: "solid",
                          borderWidth: 1,
                          borderColor: isSelected ? "#B89354" : "rgba(184,147,84,0.1)",
                        }}
                      >
                        <Text
                          className="font-tajwal text-xs uppercase font-bold"
                          style={{ color: isSelected ? "#201b16" : "#807668" }}
                        >
                          {size}
                        </Text>
                      </Pressable>
                    );
                  }}
                />
              </>
            )}

            <View className="h-6" />

            <TouchableOpacity
              onPress={async () => {
                if (!product) return;
                await addToCart(product, selectedSize, selectedColor);
                setShow(false);
              }}
              activeOpacity={0.8}
            
              className={`w-full py-3 rounded-2xl items-center mt-1 border border-primary  `}
            >
              <Text
                className={`text-lg font-bold font-tajwal text-primary `}
              >
                إضافة إلى الحقيبة
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setShow(false)}
              activeOpacity={0.8}
              className="w-full items-center mt-3 py-3 border border-gray-500 rounded-2xl"
            >
              <Text className="text-gray-500 text-base font-tajwal">إلغاء</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

export default ChooseColorSizeModal;


