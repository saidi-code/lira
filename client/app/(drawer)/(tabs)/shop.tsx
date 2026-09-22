import React from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Header from "../../../components/Header";
import BannerCarousel from "../../../components/ShopPage/BannerCarousel";
import { useCollections } from "../../../hooks/useCollections";
import { useCategories } from "../../../hooks/useCategories";
import CategoriesSections from "../../../components/ShopPage/CategoriesSections";
import CollectionsSections from "@/components/ShopPage/CollectionsSections";
import NewsLetterSection from "@/components/ShopPage/NewsLetterSection";

export default function ShopScreen() {
  const { data, isLoading, isError, error, refetch } = useCollections({
    page: 1,
    limit: 10,
    isActive: true,
    isFeatured: true,
  });

  const { data: categoriesData, isLoading: categoriesIsLoading } = useCategories({
    page: 1,
    limit: 10,
  });

  const collections = data || [];

  if (isError) {
    return (
      <SafeAreaView className="bg-surface flex-1" edges={["top"]}>
        <Header showSearch showBack={false} />
        <View className="flex-1 items-center justify-center p-4">
          <Text className="text-primary text-lg font-tajwal text-center mb-4">
            حدث خطأ أثناء تحميل البيانات
          </Text>
          <Text className="text-gray-500 text-sm mb-6">
            {(error as Error)?.message || "يرجى المحاولة مرة أخرى"}
          </Text>
          <TouchableOpacity
            onPress={() => refetch()}
            className="px-6 py-2 bg-primary rounded-lg"
          >
            <Text className="text-white font-tajwal">إعادة المحاولة</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="bg-surface flex-1" edges={["top"]}>
      <Header showSearch showBack={false} />
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <BannerCarousel collections={collections} isLoading={isLoading} />
        <CategoriesSections
          categories={categoriesData || []}
          isLoading={categoriesIsLoading}
        />
        <CollectionsSections collections={collections} isLoading={isLoading} />
        <NewsLetterSection isLoading={isLoading || categoriesIsLoading} />
      </ScrollView>
    </SafeAreaView>
  );
}
