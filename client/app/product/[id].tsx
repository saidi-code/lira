import { useFavoris } from "@/context/FavorisContext";
import {
  FontAwesome6,
  Ionicons,
  MaterialCommunityIcons,
  MaterialIcons,
} from "@expo/vector-icons";
import { useLocalSearchParams } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
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
import { COLORS, CURRENCY } from "../../constants/index";
import { IProduct } from "../../constants/types";
import { useCart } from "../../context/CartContext";

const SingleProduct = () => {
  const { addToCart, updateCartItemQuantity, cartItems } = useCart();
  const { isLiked, addToFavoris, removeFromFavoris } = useFavoris();

  const [product, setProduct] = useState<IProduct | null>(null);
  const [activeBannerIndex, setActiveBannerIndex] = useState(0);

  const { width } = Dimensions.get("screen");
  const [loading, setLoading] = useState(true);

  // UI state for variable products
  const [pColor, setPColor] = useState<number>(0);
  const [pSize, setPSize] = useState<number>(0);

  const params = useLocalSearchParams();
  const id = params.id as string | undefined;

  // route params can be string | string[]
  const routeColor = useMemo(() => {
    const v = params.color;
    if (Array.isArray(v)) return v[0];
    return v;
  }, [params.color]);

  const routeSize = useMemo(() => {
    const v = params.size;
    if (Array.isArray(v)) return v[0];
    return v;
  }, [params.size]);

  useEffect(() => {
    if (!id) return;

    const fetchProduct = async () => {
      try {
        setLoading(true);
        const { data } = await axios.get(`/products/${id}`);
        setProduct(data.data);
      } catch (e) {
        console.error("Error fetching product:", e);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  // Resolve defaults from route params for variable products
  useEffect(() => {
    if (!product) return;
    if (product.type !== "variable") return;

    const colorList: any[] = (product as any)?.colors ?? [];

    const resolvedColorIndex =
      routeColor != null
        ? colorList.findIndex((c: any) => c?.name === routeColor)
        : 0;

    const safeColorIndex = resolvedColorIndex >= 0 ? resolvedColorIndex : 0;
    setPColor(safeColorIndex);

    if (routeSize != null) {
      const variants = colorList?.[safeColorIndex]?.variants ?? [];
      const sizeIndex = variants.findIndex(
        (v: any) => String(v?.size) === String(routeSize),
      );
      setPSize(sizeIndex >= 0 ? sizeIndex : 0);
    } else {
      setPSize(0);
    }
  }, [product, routeColor, routeSize]);

  const toggleFavoris = (p: IProduct) => {
    if (isLiked(p._id)) removeFromFavoris(p._id);
    else addToFavoris(p);
  };

  const currentVariant = useMemo(() => {
    if (!product) return null;

    if (product.type === "variable") {
      const vcolor = (product as any)?.colors?.[pColor] ?? null;
      const variants = (vcolor?.variants ?? []) as any[];
      const selectedVariant = variants[pSize] ?? variants[0] ?? null;

      const selectedColorName = vcolor?.name ?? null;
      const selectedSizeValue: string | null =
        selectedVariant?.size != null ? String(selectedVariant.size) : null;

      return {
        productId: product._id,
        size: selectedSizeValue,
        color: selectedColorName,
        quantityToAdd: 1,
      };
    }

    return {
      productId: product._id,
      size: null as string | null,
      color: null as string | null,
      quantityToAdd: 1,
    };
  }, [product, pColor, pSize]);

  const matchingCartItem = useMemo(() => {
    if (!currentVariant) return null;

    return (
      cartItems?.find((item: any) => {
        return (
          item?.product?._id?.toString?.() ===
            currentVariant.productId?.toString?.() &&
          item?.size === currentVariant.size &&
          item?.color === currentVariant.color
        );
      }) ?? null
    );
  }, [cartItems, currentVariant]);

  const handleAddOrUpdate = () => {
    if (!product || !currentVariant) return;

    // If already exists -> update quantity +1
    if (matchingCartItem?._id) {
      const nextQty = (matchingCartItem.quantity ?? 0) + 1;
      updateCartItemQuantity(
        matchingCartItem._id,
        currentVariant.size,
        nextQty,
        currentVariant.color,
      );
      return;
    }

    // Else -> add new variant line
    addToCart(product, currentVariant.size, currentVariant.color);
  };

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
                  product?.images?.[0] ??
                  (product as any)?.colors?.[0]?.images?.[0],
              }}
              defaultSource={require("../../assets/images/productLoadingImage.png")}
              style={{ width, height: width }}
              resizeMode="cover"
            />
          ) : (
            <View className="">
              <FlatList
                data={((product as any)?.colors?.[pColor ?? 0]?.images ?? []) as any[]}
                keyExtractor={(_, index) => String(index)}
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
                    style={{ width }}
                  >
                    <Image
                      source={{ uri: item }}
                      style={{ width, height: width }}
                      resizeMode="cover"
                    />
                  </View>
                )}
              />

              {/* Pagination Dots */}
              <View className="flex-row justify-center -mt-4 gap-2">
                {(((product as any)?.colors?.[pColor ?? 0]?.images ?? []) as any[]).map(
                  (_: string, index: number) => (
                    <View
                      key={index}
                      className={`h-2 rounded-full ${
                        index === activeBannerIndex
                          ? "w-8 bg-primary"
                          : "w-2 bg-gray-300"
                      }`}
                    />
                  ),
                )}
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

        <View className="flex-1 px-4 mb-12">
          <View className="flex-1 flex flex-row flex-wrap items-center justify-between mt-6 mb-2">
            <Text className="text-right text-primary text-2xl font-jazera font-bold">
              {product.price} {CURRENCY}
            </Text>
            <Text className="text-right text-body text-[24px] font-jazera font-bold">
              {product.name}
            </Text>
          </View>

          <Text className="text-right tracking-widest text-[#4E4639] text-base font-body leading-8 mb-6">
            {product.subtitle}
          </Text>

          {product.type === "variable" && (
            <>
              <View className="mb-6">
                <Text className="text-right font-tajwal text-base text-[#807668] mb-4">
                  اللون
                </Text>
                <FlatList
                  data={((product as any)?.colors ?? []) as any[]}
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
                      onPress={() => setPColor(index)}
                      className="h-8 w-8 rounded-full"
                      style={{
                        backgroundColor: color?.hex ?? "#000",
                        outlineWidth: 2,
                        outlineColor:
                          pColor === index
                            ? "#B89354"
                            : "#rgba(184,147,84,0.4)",
                        shadowColor: "#fff",
                        shadowOpacity: 0.2,
                        shadowRadius: 6,
                        elevation: 4,
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
                  data={
                    ((product as any)?.colors?.[pColor ?? 0]?.variants ?? []) as any[]
                  }
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  keyExtractor={(_, index) => String(index)}
                  contentContainerStyle={{
                    justifyContent: "flex-end",
                    gap: 12,
                    flex: 1,
                  }}
                  renderItem={({ item: variant, index }) => (
                    <TouchableOpacity
                      activeOpacity={0.85}
                      onPress={() => setPSize(index)}
                      className="flex items-center justify-center rounded-lg"
                      style={{
                        height: 32,
                        width: 32,
                        backgroundColor: index === pSize ? "#B89354" : "#fff",
                        borderStyle: "solid",
                        borderWidth: 1,
                        borderColor:
                          index === pSize
                            ? "#B89354"
                            : "rgba(184,147,84,0.1)",
                      }}
                    >
                      <Text
                        className="font-tajwal text-xs uppercase font-bold"
                        style={{
                          color: index === pSize ? "#201b16" : "#807668",
                        }}
                      >
                        {variant?.size}
                      </Text>
                    </TouchableOpacity>
                  )}
                />
              </View>
            </>
          )}

          <View className=" bg-[#d1c5b4]/30" style={{ height: 1 }} />

          <Text className="text-right text-body text-2xl font-tajwal font-medium my-4">
            عن المنتج
          </Text>
          <Text className="text-right tracking-widest text-body text-lg font-body leading-8 mb-6">
            {product.description}
          </Text>

          <View className="flex-1 flex-row gap-4 items-center">
            <View className="flex-1 p-4 bg-[#f3e3dc] rounded-lg outline outline-1 outline-offset-[-1px] outline-[#78350F]/5 flex-col justify-start items-end">
              <FontAwesome6 name="hand-sparkles" size={20} color="#785920" />
              <View className="self-stretch pt-2 flex-col items-end">
                <Text className="text-right text-[#645d59] text-xs font-[FreeSerif] font-medium uppercase tracking-wide">
                  الصناعة
                </Text>
              </View>
              <View className="self-stretch flex-col items-end">
                <Text className="text-right text-[#201b16] text-base font-[FreeSerif]">
                  يدوية فاخرة
                </Text>
              </View>
            </View>

            <View className="flex-1 p-4 bg-[#f3e3dc] rounded-lg outline outline-1 outline-offset-[-1px] outline-amber-900/5 flex-col justify-start items-end">
              <View className="bg-[#785920] rounded-sm" />
              <Ionicons name="sparkles-outline" size={20} color="#785920" />
              <View className="self-stretch pt-2 flex-col items-end">
                <Text className="text-right text-[#645d59] text-xs font-[FreeSerif] font-medium uppercase tracking-wide">
                  المكونات
                </Text>
              </View>
              <View className="self-stretch flex-col items-end">
                <Text className="text-right text-[#201b16] text-base font-[FreeSerif]">
                  طبيعية ١٠٠٪
                </Text>
              </View>
            </View>
          </View>
        </View>

        <View className="pb-32 mt-16 px-4 bg-white rounded-t-[32px] shadow-lg mb-12">
          <Text className="text-right text-body text-2xl font-tajwal font-medium my-6">
            تفاصيل إضافية
          </Text>

          <View
            className="flex-1 rounded-lg outline outline-1 outline-offset-[-1px] outline-amber-900/5 flex-row justify-end items-center gap-4"
          >
            <View className="flex-col py-4">
              <Text className="text-body leading-[24px] text-right text-base font-body font-bold">
                توصيل مجاني
              </Text>
              <Text className="text-body leading-[24px] text-right text-base font-body">
                خلال ٢-٣ أيام عمل
              </Text>
            </View>
            <MaterialCommunityIcons name="truck-outline" size={24} color="#785920" />
          </View>

          <View className=" bg-[#d1c5b4]/30" style={{ height: 1 }} />

          <View
            className="flex-1 rounded-lg outline outline-1 outline-offset-[-1px] outline-amber-900/5 flex-row justify-end items-center gap-4"
          >
            <View className="flex-col py-4">
              <Text className="text-body leading-[24px] text-right text-base font-body font-bold">
                ضمان الأصالة
              </Text>
              <Text className="text-body leading-[24px] text-right text-base font-body">
                منتج أصلي مضمون ١٠٠٪
              </Text>
            </View>
            <MaterialCommunityIcons name="shield-check-outline" size={24} color="#785920" />
          </View>
        </View>
      </ScrollView>

      <View className=" px-6 pt-4 pb-12 absolute left-0 bottom-0 bg-stone-50/90 shadow-md border-t border-amber-900/10 backdrop-blur-md flex-row justify-start items-center gap-4">
        <TouchableOpacity
          onPress={handleAddOrUpdate}
          disabled={product?.type === "variable" && (!routeColor || !routeSize)}
          className="flex-1 h-[59px] rounded-xl flex-row justify-center items-center gap-2"
          style={{
            backgroundColor:
              product?.type === "variable" && (!routeColor || !routeSize)
                ? "#cfcfcf"
                : "#785920",
          }}
        >
          <MaterialIcons name="add-shopping-cart" size={16} color="white" />
          <Text className="text-center text-white text-base font-tajwal">
            إضافة إلى الحقيبة
          </Text>
        </TouchableOpacity>


        <View className="px-4 h-[59px] w-[59px] border border-[#785920] rounded-[12px] flex justify-center items-center">
          <Ionicons name="share-social-outline" size={16} color="#785920" />
        </View>
      </View>
    </SafeAreaView>
  );
};

export default SingleProduct;

