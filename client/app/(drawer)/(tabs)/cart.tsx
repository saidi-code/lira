import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import {
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import CartItem from "../../../components/CartItem";
import Header from "../../../components/Header";
import OrderSummary from "../../../components/OrderSummary";
import { useCart } from "../../../context/CartContext";

const Cart = () => {
  const router = useRouter();
  const { cartItems, removeFromCart, updateCartItemQuantity, cartTotal, loading } =
    useCart();


  return (
    <SafeAreaView className=" bg-surface flex-1" edges={["top"]}>
      <Header showBack />
      {/* Page Title */}
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="flex-1 justify-center items-center gap-2 mt-8 mb-6">
          {/* First line */}

          <Text
            className="text-center
         text-primary-700 text-base 
         font-medium font-tajwal uppercase 
          tracking-wider"
          >
            الحقيبة الخاصة بك
          </Text>

          {/* Second line */}

          <Text className="text-center text-body text-4xl leading-[43px] font-bold font-jazera">
            حقيبة التسوق
          </Text>
        </View>
        {cartItems?.length <= 0 ? (
          <View
            className="flex-1 mx-4 p-4 items-center justify-center bg-[#ece0d9]/30 rounded-xl border
         border-primary border-dashed"
          >
            <Text className="text-center text-xl text-primary-700 font-jazera mb-4 font-bold">
              أضف لمسة فاخرة إلى حقيبتك
            </Text>
            <Text className="text-primary-600 font-tajwal text-center px-4 mb-6">
              اجعل حقيبتك مليئة بالمنتجات التي تعكس ذوقك الراقي
            </Text>
            <TouchableOpacity
              onPress={() => router.push("/")}
              activeOpacity={0.8}
              className="self-stretch py-5 bg-[#785920] rounded-full shadow-md flex-row justify-center items-center gap-2"
              style={{
                shadowColor: "rgba(120,89,32,0.05)",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 1,
                shadowRadius: 20,
                elevation: 4,
              }}
            >
              <MaterialCommunityIcons
                name="shopping-search-outline"
                color={"#fff"}
                size={20}
              />
              <Text className="text-white text-base leading-6 font-normal text-center">
                أبدء التسوق الأن
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>

            {/* Cart Items Container */}
            <View className="mx-6 my-4">
              {cartItems.map((item) => (
                <CartItem
                  key={item._id}
                  loading={loading}
                  item={item}
                  removeItem={removeFromCart}
                  updateItemQuantity={(itemId, newQty, size, color) =>
                    updateCartItemQuantity(itemId, newQty, size, color)
                  }
                />
              ))}
            </View>
            {/* Order Summary Section */}
            <View className="flex-1 p-4 bg-[#ece0d9]/30 ">
              <OrderSummary subtotal={cartTotal} shipping={7} />
            </View>
            {/* CheckOut Button */}
            <View className="flex-1 justify-center p-4">
              <View className="self-stretch flex-col justify-start items-start gap-4">
                {/* Main Button */}
                <TouchableOpacity
                  activeOpacity={0.8}
                  className="self-stretch py-5 bg-[#785920] rounded-full shadow-md flex-row justify-center items-center gap-2"
                  style={{
                    shadowColor: "rgba(120,89,32,0.05)",
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 1,
                    shadowRadius: 20,
                    elevation: 4,
                  }}
                >
                  {/* Arrow icon (left pointing, rotated 180°) */}

                  <Ionicons
                    name="chevron-back-outline"
                    color={"#fff"}
                    size={20}
                  />
                  {/* Button Text */}
                  <Text className="text-white text-base leading-6 font-normal text-center">
                    إتمام عملية الشراء
                  </Text>
                </TouchableOpacity>

                {/* Supporting Message */}
                <View className="self-stretch items-center">
                  <Text className="text-center text-[#645d59] text-base leading-6 font-normal">
                    شحن سريع وخدمة تغليف الهدايا متوفرة
                  </Text>
                </View>
              </View>
            </View>
            {/* Related Products Section */}
            <View className="py-6  mb-16 flex-1">
              <View className="px-4">
                <Text className="text-right font-body text-body text-base mb-4">
                  قد يعجبك أيضاً
                </Text>
              </View>

              <FlatList
                data={cartItems}
                horizontal
                showsHorizontalScrollIndicator={false}
                keyExtractor={(product: any, index) =>
                  String(product?._id ?? index)
                }
                contentContainerStyle={{ gap: 16 }}
                renderItem={({ item: product }) => (
                  <View style={{ marginRight: 0 }}>
                    <ProductCard product={product} />
                  </View>
                )}
              />
            </View>
          </>)
        }
      </ScrollView>
    </SafeAreaView>
  );
};

export default Cart;
