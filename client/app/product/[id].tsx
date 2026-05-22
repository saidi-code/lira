import { useFavoris } from "@/context/FavorisContext";
import {
  FontAwesome6,
  Ionicons,
  MaterialCommunityIcons,
  MaterialIcons,
} from "@expo/vector-icons";
import { useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Image,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Header from "../../components/Header";
import axios from "../../config/api";
import { COLORS, CURRENCY, PRODUCTS } from "../../constants/index";
import { IProduct } from "../../constants/types";

const SingleProduct = () => {
  const { isLiked, addToFavoris, removeFromFavoris } = useFavoris();
  const [product, setProduct] = useState<IProduct | null>(null);
  const [activeBannerIndex, setActiveBannerIndex] = useState(0);
  const [selectedColor, setSelectedColor] = useState<number>(0);
  const [selectedSize, setSelectedSize] = useState<number | null>(null);
  const { width } = Dimensions.get("screen");
  const [loading, setLoading] = useState(true);
  const { id } = useLocalSearchParams();
  const fetchProduct = async (id: string) => {
    try {
      const { data } = await axios.get(`/products/${id}`);
      setProduct(data.data);
      setLoading(false);
    } catch (error) {
      setLoading(false);
      console.error("Error fetching product:", error);
    } finally {
      setLoading(false);
    }
  };
  const existProduct = PRODUCTS.find((p) => p._id === id?.toString());

  const toggleFavoris = (product: IProduct) => {
    if (isLiked(product._id)) {
      removeFromFavoris(product._id);
    } else {
      addToFavoris(product);
    }
  };
  useEffect(() => {
    console.log("Fetching product with ID:", id);
    fetchProduct(id);
  }, [id]);
  if (loading) {
    return (
      <View className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }
  if (!product) {
    return (
      <SafeAreaView className="flex-1 justify-center items-center">
        <View className="justify-center items-center">
          <Text className="text-lg text-primary">Product not found</Text>
        </View>
      </SafeAreaView>
    );
  }
  return (
    <SafeAreaView className=" bg-surface flex-1 relative" edges={["top"]}>
      <Header showBack />

      <ScrollView
        showsVerticalScrollIndicator={false}
        className="flex-1 bg-[#fdf1ea]"
      >
        <View className="relative">
          {product.type === "simple" ? (
            <Image
              source={{
                uri:
                  product.type === "simple"
                    ? product?.images?.[0]
                    : product?.colors?.[0].images?.[0],
              }}
              defaultSource={require("../../assets/images/productLoadingImage.png")}
              style={{
                width: width,
                height: width,
              }}
              resizeMode="cover"
            />
          ) : (
            <View className="">
              <FlatList
                data={product?.colors?.[0].images}
                keyExtractor={(item, index) => String(index)}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                snapToInterval={width}
                decelerationRate="fast"
                onMomentumScrollEnd={(e) => {
                  const index = Math.round(
                    e.nativeEvent.contentOffset.x / width,
                  );
                  if (index !== activeBannerIndex) setActiveBannerIndex(index);
                }}
                renderItem={({ item }) => (
                  <View
                    className="flex-1 relative overflow-hidden"
                    style={{ width: width }}
                  >
                    <Image
                      source={{ uri: item }}
                      style={{ width: width, height: width }}
                      resizeMode="cover"
                    />
                  </View>
                )}
              />

              {/* Pagination Dots */}
              <View className="flex-row justify-center -mt-4 gap-2">
                {product?.colors?.[0].images.map((_, index) => (
                  <View
                    key={index}
                    className={`h-2 rounded-full ${
                      index === activeBannerIndex
                        ? "w-8 bg-primary"
                        : "w-2 bg-gray-300"
                    }`}
                  />
                ))}
              </View>
            </View>
          )}

          <TouchableOpacity
            onPress={() => toggleFavoris(product)}
            className="absolute top-4 right-4 bg-[#fff8f5]/80 rounded-full backdrop-blur-[2px] inline-flex justify-center items-center p-3"
          >
            <Ionicons
              name={isLiked(product._id) ? "heart" : "heart-outline"}
              color={COLORS.primary}
              size={20}
            />
          </TouchableOpacity>
        </View>
        <View className="flex-1 px-4 mb-12  ">
          {/* اسم المنتج */}
          <View className="flex-1 flex flex-row flex-wrap items-center justify-between mt-6 mb-2">
            <Text className="text-right text-primary text-2xl font-jazera font-bold">
              {product.price} {CURRENCY}
            </Text>
            <Text className="text-right text-body text-[24px] font-jazera font-bold">
              {product.name}
              {/* عطر ليرة الاستثنائي */}
            </Text>
            {/* السعر */}
          </View>
          <Text className="text-right tracking-widest text-[#4E4639] text-base font-body leading-8 mb-6">
            {product.subtitle}
            {/* تألقي بأناقة خالدة مع خاتم الذهب عيار 18 قيراط، المصمم يدوياً ليعكس
            الرقي والجمال في كل تفاصيله. */}
          </Text>
          {product.type === "variable" && (
            <>
              <View className="mb-6">
                <Text className="text-right font-tajwal text-base text-[#807668] mb-4">
                  اللون
                </Text>
                <FlatList
                  data={product?.colors ?? []}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  keyExtractor={(_, index) => String(index)}
                  contentContainerStyle={{
                    justifyContent: "flex-end",
                    gap: 16,
                    flex: 1,
                    padding: 4,
                  }}
                  renderItem={({ item: color, index }) => (
                    <TouchableOpacity
                      onPress={() => setSelectedColor(index)}
                      className="h-8 w-8 rounded-full"
                      style={{
                        backgroundColor: color.hex,
                        outlineWidth: 2, // سماكة الحلقة
                        outlineColor:
                          selectedColor === index
                            ? "#B89354"
                            : "#rgba(184,147,84,0.4)", // لون الحلقة (يمكن تغييره)
                        shadowColor: "#fff", // ظل خفيف لإضفاء عمق
                        shadowOpacity: 0.2,
                        shadowRadius: 6,
                        elevation: 4, // لتفعيل الظل على Android
                        outlineOffset: 2,
                      }}
                    />
                  )}
                />
              </View>

              <View className="mb-6">
                <Text className="text-right font-tajwal text-base text-[#807668] mb-4">
                  المقاس
                </Text>

                <FlatList
                  data={product?.colors?.[selectedColor]?.variants ?? []}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  keyExtractor={(_, index) => String(index)}
                  contentContainerStyle={{
                    justifyContent: "flex-end",
                    gap: 12,
                    flex: 1,
                  }}
                  renderItem={({ item: variant, index }) => {
                    const isActive = index === selectedSize;
                    return (
                      <TouchableOpacity
                        activeOpacity={0.85}
                        onPress={() => setSelectedSize(index)}
                        className="w-[77px] h-[42px] flex items-center justify-center rounded-lg"
                        style={{
                          borderStyle: "solid",
                          borderWidth: 1,
                          borderColor: isActive
                            ? "#B89354"
                            : "rgba(184,147,84,0.1)",
                        }}
                      >
                        <Text className="text-[#201b16] font-tajwal text-base uppercase font-bold">
                          {variant.size}
                        </Text>
                      </TouchableOpacity>
                    );
                  }}
                />
              </View>
            </>
          )}

          {/* خط فاصل */}
          <View className=" bg-[#d1c5b4]/30" style={{ height: 1 }} />

          {/* عنوان عن المنتج */}

          <Text className="text-right text-body text-2xl font-tajwal font-medium my-4">
            عن المنتج
          </Text>
          <Text className="text-right tracking-widest text-body text-lg font-body leading-8 mb-6">
            {product.description}
            {/* تجسيد فني للجمال المعاصر، حيث يلتقي التراث الحرفي بالخطوط العصرية.
            صُمم هذا الإصدار بعناية فائقة ليعكس شخصية متفردة تعشق التفاصيل
            الدقيقة والجمال الصامت. مزيج ساحر يجمع بين عبق الشرق ورقي التصميم
            العالمي. */}
          </Text>

          <View className="flex-1 flex-row  gap-4  items-center ">
            <View className="flex-1 p-4 bg-[#f3e3dc] rounded-lg outline outline-1 outline-offset-[-1px] outline-[#78350F]/5 flex-col justify-start items-end ">
              {/* أيقونة */}
              <FontAwesome6 name="hand-sparkles" size={20} color="#785920" />

              {/* عنوان المكونات */}
              <View className="self-stretch pt-2 flex-col items-end">
                <Text className="text-right text-[#645d59] text-xs font-[FreeSerif] font-medium uppercase tracking-wide">
                  الصناعة
                </Text>
              </View>

              {/* وصف المكونات */}
              <View className="self-stretch flex-col items-end">
                <Text className="text-right text-[#201b16] text-base font-[FreeSerif]">
                  يدوية فاخرة
                </Text>
              </View>
            </View>
            <View className="flex-1 p-4 bg-[#f3e3dc] rounded-lg outline outline-1 outline-offset-[-1px] outline-amber-900/5 flex-col justify-start items-end">
              {/* أيقونة */}
              <View className="bg-[#785920] rounded-sm" />
              <Ionicons name="sparkles-outline" size={20} color="#785920" />
              {/* عنوان المكونات */}
              <View className="self-stretch pt-2 flex-col items-end">
                <Text className="text-right text-[#645d59] text-xs font-[FreeSerif] font-medium uppercase tracking-wide">
                  المكونات
                </Text>
              </View>

              {/* وصف المكونات */}
              <View className="self-stretch flex-col items-end">
                <Text className="text-right text-[#201b16] text-base font-[FreeSerif]">
                  طبيعية ١٠٠٪
                </Text>
              </View>
            </View>
          </View>
        </View>
        <View className="pb-32 mt-16  px-4   bg-white rounded-t-[32px] shadow-lg mb-12">
          <Text className="text-right text-body text-2xl font-tajwal font-medium my-6">
            تفاصيل إضافية
          </Text>
          {/* bg-[#fdf1ea]  */}
          <View
            className="flex-1 rounded-lg 
            outline outline-1 outline-offset-[-1px] outline-amber-900/5 
            flex-row justify-end  items-center gap-4 "
          >
            <View className=" flex-col py-4">
              <Text className="text-body leading-[24px] text-right text-base font-body font-bold">
                توصيل مجاني
              </Text>
              <Text className="text-body leading-[24px] text-right  text-base font-body ">
                خلال ٢-٣ أيام عمل
              </Text>
            </View>
            <MaterialCommunityIcons
              name="truck-outline"
              size={24}
              color="#785920"
            />
          </View>
          {/* خط فاصل */}
          <View className=" bg-[#d1c5b4]/30" style={{ height: 1 }} />
          <View
            className="flex-1  rounded-lg 
            outline outline-1 outline-offset-[-1px] outline-amber-900/5 
            flex-row justify-end  items-center gap-4 "
          >
            <View className=" flex-col py-4">
              <Text className="text-body leading-[24px] text-right text-base font-body font-bold">
                ضمان الأصالة
              </Text>
              <Text className="text-body leading-[24px] text-right  text-base font-body ">
                منتج أصلي مضمون ١٠٠٪
              </Text>
            </View>
            <MaterialCommunityIcons
              name="shield-check-outline"
              size={24}
              color="#785920"
            />
          </View>
        </View>
      </ScrollView>

      <View className=" px-6 pt-4 pb-12 absolute left-0 bottom-0 bg-stone-50/90 shadow-md border-t border-amber-900/10 backdrop-blur-md flex-row justify-start items-center gap-4">
        {/* زر إضافة إلى الحقيبة */}
        <View className="flex-1 h-[59px] bg-[#785920] rounded-xl flex-row justify-center items-center gap-2">
          {/* أيقونة */}
          <MaterialIcons name="add-shopping-cart" size={16} color="white" />
          {/* <View className="bg-white rounded-sm" /> */}
          {/* نص الزر */}
          <Text className="text-center text-white text-base font-tajwal">
            إضافة إلى الحقيبة
          </Text>
        </View>

        {/* زر أيقونة جانبي */}
        <View className="px-4 h-[59px] w-[59px] border border-[#785920]  rounded-[12px] flex justify-center items-center">
          <Ionicons name="share-social-outline" size={16} color="#785920" />
        </View>
      </View>
    </SafeAreaView>
  );
};

export default SingleProduct;
