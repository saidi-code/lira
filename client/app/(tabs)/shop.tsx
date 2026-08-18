import { Ionicons, MaterialCommunityIcons, Octicons } from "@expo/vector-icons";
import { useState } from "react";
import {
  FlatList,
  Image,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import Header from "../../components/Header";
import ProductCard from "../../components/ProductCard";
import BannerCarousel from "../../components/ShopPage/BannerCarousel";
import { useCollections } from "../../hooks/useCollections";
import { CATEGORIES, COLLECTIONS, COLORS } from "../../constants/index";
import { ICollection, IProduct } from "../../constants/types";
import {useCategories} from "../../hooks/useCategories"
import CategoriesSections from "../../components/ShopPage/CategoriesSections";
import CollectionsSections from "@/components/ShopPage/CollectionsSections";
export default function Index() {
  const router = useRouter();
  const [email, setEmail] = useState("");

  // Fetch collections – note the destructuring
  const { data, isLoading, isError, error } = useCollections({
    page: 1,
    limit: 10,
    isActive: true,
    isFeatured: true,
  });

    const { data: categoriesData, isLoading:categoriesIsLoading} = useCategories();
  // Safely extract the collections array (use optional chaining)
  const collections = data|| [];
  const pagination = data?.pagination; // kept for future use

  console.log("Fetched collections:", collections[0].products?.[0]);
  // ─── Error state ──────────────────────────────────────────────────────────
  if (isError) {
    return (
      <SafeAreaView className="bg-surface flex-1" edges={["top"]}>
        <Header showSearch showBack={false} />
        <View className="flex-1 items-center justify-center p-4">
          <Text className="text-primary text-lg font-tajwal text-center mb-4">
            حدث خطأ أثناء تحميل البيانات
          </Text>
          <Text className="text-gray-500 text-sm mb-6">{error?.message || "يرجى المحاولة مرة أخرى"}</Text>
          <TouchableOpacity
            onPress={() => {
              // If your hook provides a refetch function, call it here.
              // Otherwise, you could reload the screen or use a retry mechanism.
              // Example: refetch();
            }}
            className="px-6 py-2 bg-primary rounded-lg"
          >
            <Text className="text-white font-tajwal">إعادة المحاولة</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ─── Main UI ──────────────────────────────────────────────────────────────
  return (
    <SafeAreaView className="bg-surface flex-1" edges={["top"]}>
      <Header showSearch showBack={false} />

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Banner Carousel – handles loading skeleton internally */}
        <BannerCarousel collections={collections} isLoading={isLoading} />

        {/* Categories section */}
        <CategoriesSections categories={categoriesData } isLoading={categoriesIsLoading} />
        {/* <View className="py-6">
          <View className="flex-row items-center justify-between px-4 mb-6">
            <Text className="font-tajwal text-sm text-primary">عرض المزيد</Text>
            <Text className="font-tajwal text-2xl text-body">الفئات الفاخرة</Text>
          </View>

          <FlatList
            data={CATEGORIES}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item) => item.title}
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={() => {
                  router.push({
                    pathname: "/product",
                    params: { category: item.title },
                  });
                }}
                className="rounded-2xl mx-4 items-center justify-center"
                activeOpacity={0.8}
              >
                <View className="w-[80px] h-[80px] rounded-full bg-[#FDF1EA] flex items-center justify-center outline -outline-offset-1 outline-[#B89354]/20 mb-2">
                  {getIcon(item.title)}
                </View>
                <Text className="font-tajwal text-base font-medium text-center text-gray-800">
                  {item.title}
                </Text>
              </TouchableOpacity>
            )}
          />
        </View> */}

        {/* Collections Section – currently using static COLLECTIONS.
            If you want to use fetched collections, replace data with collections.
            Also ensure the fetched collections have the 'products' array. */}
        <CollectionsSections collections={collections} />
        
        {/* <View className="py-12 px-3">
          <View className="items-center mb-8">
            <Text className="text-center text-[#201b16] text-[32px] font-bold font-jazera leading-[38.4px]">
              مجموعات مختارة
            </Text>
          </View>

          <FlatList
            data={collections} // ← consider using `collections` if it has the same structure
            keyExtractor={(item, index) => String(item._id ?? index)}
            scrollEnabled={false}
            renderItem={({ item }) => (
              <View className="mb-8">
                <View className="relative bg-white/0 rounded-3xl shadow-[0px_2px_4px_-2px_rgba(0,0,0,0.10)] overflow-hidden mb-4">
                  <Image
                    source={{ uri: item.banner }}
                    resizeMode="cover"
                    className="w-full h-[192px]"
                    style={{ height: 192.38 }}
                  />
                  <View className="absolute inset-0 p-8 bg-black/20 justify-end" />
                </View>
                <View className="flex-1">
                  <FlatList
                    data={(item.products as IProduct[]).slice(0, 4)}
                    renderItem={({ item: product }) => (
                      <ProductCard product={product as IProduct} />
                    )}
                    keyExtractor={(product, index) => String(product._id ?? index)}
                    numColumns={2}
                    scrollEnabled={false}
                    contentContainerStyle={styles.listContainer}
                    columnWrapperStyle={styles.columnWrapper}
                  />
                </View>
              </View>
            )}
          />
        </View> */}

        {/* Newsletter Section (unchanged) */}
        <View className="px-2 mx-4 pt-[47px] pb-12 bg-[#b89354]/10 rounded-[40px] items-start gap-4 mb-12">
          <View className="self-stretch items-center">
            <Text className="text-center text-[#785920] text-2xl font-bold font-jazera">
              مجلة ليرة الرقمية
            </Text>
          </View>
          <View className="flex items-center justify-center mb-4">
            <View className="mx-3">
              <Text className="text-center text-[#4e4639] text-base font-bady">
                اشترك لتصلك أحدث المقالات والمجموعات الحصرية من عالم الفخامة
              </Text>
            </View>
          </View>
          <View className="w-full max-w-[448px] relative">
            <View className="relative w-full bg-white rounded-full shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)]">
              <TextInput
                className="w-full py-[23px] pl-[104px] pr-8 text-end text-gray-500 text-base font-normal font-tajawal"
                placeholder="بريدك الإلكتروني"
                placeholderTextColor="#9CA3AF"
                value={email}
                onChangeText={setEmail}
                textAlign="right"
                style={{ minHeight: 66 }}
              />
            </View>
            <TouchableOpacity
              activeOpacity={0.8}
              className="absolute left-[8px] top-1/2 -translate-y-1/2 px-6 py-3 bg-[#b89354] rounded-full justify-center items-center"
              onPress={() => {
                console.log("Subscribe with:", email);
              }}
            >
              <Text className="text-center text-white text-base font-medium font-tajawal leading-6">
                انضمام
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  // ... keep your existing styles (unchanged) ...
  listContainer: {
    paddingHorizontal: 12,
    paddingVertical: 16,
    backgroundColor: '#FFF8F5',
  },
  columnWrapper: {
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  // (Include the rest of your styles as they were)
});