import ProductCard from "@/components/ProductCard";
import { COLORS } from "@/constants";
import { IProduct } from "@/constants/types";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocalSearchParams } from "expo-router";
import { ActivityIndicator, FlatList, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import axios from "../../config/api";
import Header from "../../components/Header";

type Pagination = {
  total: number;
  page: number;
  pages: number;
};

const LIMIT = 10;

export default function ProductByCategoryScreen() {
  const params = useLocalSearchParams<{ category?: string }>();
  const { category } = params;
console.log("Received category param:", category);
  const [products, setProducts] = useState<IProduct[]>([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState<number>(1);

  const [initialLoading, setInitialLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const inFlight = useRef(false);

  const normalizedCategory = useMemo(() => {
    const t = typeof category === "string" ? category : "";
    return t || "الكل";
  }, [category]);

  const canLoadMore = useMemo(() => !initialLoading && page < pages, [initialLoading, page, pages]);

  const fetchPage = useCallback(
    async (nextPage: number) => {
      if (inFlight.current) return;
      inFlight.current = true;

      if (nextPage === 1) setInitialLoading(true);
      else setLoadingMore(true);

      try {
        const queryParams: any = { page: nextPage, limit: LIMIT };
        if (normalizedCategory !== "الكل") queryParams.category = normalizedCategory;

        const { data } = await axios.get("/products", { params: queryParams });

        const pagination: Pagination | undefined = data.pagination;
        const received: IProduct[] = data.data ?? [];

        setProducts((prev) => (nextPage === 1 ? received : [...prev, ...received]));
        setPage(pagination?.page ?? nextPage);
        setPages(pagination?.pages ?? 1);
      } catch (e) {
        console.error(e);
      } finally {
        inFlight.current = false;
        setInitialLoading(false);
        setLoadingMore(false);
      }
    },
    [normalizedCategory]
  );

  useEffect(() => {
    setProducts([]);
    setPage(1);
    setPages(1);
    fetchPage(1);
  }, [fetchPage]);

  const onEndReached = useCallback(() => {
    if (!canLoadMore) return;
    if (loadingMore) return;
    fetchPage(page + 1);
  }, [canLoadMore, fetchPage, loadingMore, page]);

  if (initialLoading) {
    return (
      <SafeAreaView className="flex-1 justify-center items-center bg-surface" edges={["top"]}>
        <ActivityIndicator size="small" color={COLORS.primary} />
        <Text className="mt-2 text-secondary text-sm">جارٍ التحميل...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-surface" edges={["top"]}>
      <Header showBack />
      <View className="px-4 py-3">
        <Text className="text-right font-tajwal font-bold text-lg text-body" numberOfLines={1}>
          {normalizedCategory}
        </Text>
      </View>

      <FlatList
        data={products}
        keyExtractor={(p) => p._id}
        numColumns={2}
        columnWrapperStyle={{ flex: 1, columnGap: 16, marginBottom: 16 }}
        renderItem={({ item }) => <ProductCard product={item} />}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
        onEndReached={onEndReached}
        onEndReachedThreshold={0.35}
        ListFooterComponent={
          loadingMore ? (
            <View className="py-6">
              <ActivityIndicator size="small" color={COLORS.primary} />
            </View>
          ) : null
        }
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}
