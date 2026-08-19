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
import NewsLetterSection from "@/components/ShopPage/NewsLetterSection";
export default function Index() {
  const router = useRouter();

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

  // console.log("Fetched collections:", collections[0].products?.[0]);
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

  if( isLoading || categoriesIsLoading){
    return (
      <SafeAreaView className="bg-surface flex-1" edges={["top"]}>
        <Header showSearch showBack={false} />
        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          {/* Banner Carousel – handles loading skeleton internally */}
          <BannerCarousel collections={[]} isLoading={true} />

          {/* Categories section */}
          <CategoriesSections categories={[]} isLoading={true} />

          {/* Collections section */}
          <CollectionsSections collections={[]} isLoading={true} />
          
          {/* Newsletter Section (unchanged) */}
          <NewsLetterSection isLoading={isLoading || categoriesIsLoading}/>
          </ScrollView>
        </SafeAreaView>
      );
    }
  return (
    <SafeAreaView className="bg-surface flex-1" edges={["top"]}>
      <Header showSearch showBack={false} />

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Banner Carousel – handles loading skeleton internally */}
        <BannerCarousel collections={collections} isLoading={isLoading} />

        {/* Categories section */}
        <CategoriesSections categories={categoriesData } isLoading={categoriesIsLoading} />

        {/* Collections section */}
        <CollectionsSections collections={collections} isLoading={isLoading} />
        
        {/* Newsletter Section (unchanged) */}
       <NewsLetterSection isLoading={false}/>
      </ScrollView>
    </SafeAreaView>
  );
}

