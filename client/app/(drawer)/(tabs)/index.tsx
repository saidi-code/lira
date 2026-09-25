import React, { useCallback, useState, useEffect, useMemo, useRef } from "react";
import {
  FlatList,
  View,
  Text,
  ActivityIndicator,
  TouchableOpacity,
  StyleSheet,
  TextInput,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useProducts } from "../../../hooks/useProducts";
import { COLORS } from "../../../constants";
import ProductCard from "@/components/ProductCard";
import FilterProductsModal from "@/components/FilterProductsModal";
import { api } from "../../../config/api";
import LoadingPage from "@/components/searchPage/LoadingPage";

export default function Index() {
  // ----- Filter state -----
  const [showFilter, setShowFilter] = useState(false);
  const [category, setCategory] = useState("الكل");
  const [color, setColor] = useState("");
  const [size, setSize] = useState("");
  const [brand, setBrand] = useState("الكل");
  const [price, setPrice] = useState<[number, number]>([0, 2500]);
  const [searchText, setSearchText] = useState("");
  const [searchResult, setSearchResult] = useState<any[]>([]);
  const [isSearchLoading, setIsSearchLoading] = useState(false);
  const [, setIsSearchError] = useState(false);

  // ----- 1. Main product list (infinite scroll) -----
  const {
    data: productsData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading: isInitialLoading,
    isError: isInitialError,
  } = useProducts({
    limit: 10,
  });

  const allProducts = useMemo(
    () => productsData?.pages.flatMap((page) => page.products) || [],
    [productsData]
  );

  // ----- 2. Search functions -----
  const abortControllerRef = useRef<AbortController | null>(null);

  const performSearch = useCallback(
    async (params: {
      q?: string;
      category?: string;
      color?: string;
      brand?: string;
      size?: string;
      minPrice?: number;
      maxPrice?: number;
    }) => {
      // Cancel previous pending search request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      const controller = new AbortController();
      abortControllerRef.current = controller;

      try {
        setIsSearchLoading(true);
        setIsSearchError(false);

        const cleanParams: Record<string, any> = { ...params };
       console.log("cleanParams", cleanParams);
        if (cleanParams.category === "الكل") delete cleanParams.category;
        Object.keys(cleanParams).forEach((k) => {
          if (!cleanParams[k]) delete cleanParams[k];
        });
        if (cleanParams.brand === "الكل") delete cleanParams.brand;
        Object.keys(cleanParams).forEach((k) => {
          if (!cleanParams[k]) delete cleanParams[k];
        });

        const data = await api.get("/products/search", {
          params: cleanParams,
          signal: controller.signal,
        });

        setSearchResult(data?.data || []);
      } catch (error: any) {
        if (error?.name !== "CanceledError" && error?.name !== "AbortError") {
          setIsSearchError(true);
          console.error("Error searching products:", error);
          setSearchResult([]);
        }
      } finally {
        setIsSearchLoading(false);
      }
    },
    []
  );

  // Debounced text search
  useEffect(() => {
    if (!searchText.trim()) {
      setSearchResult([]);
      return;
    }

    const timer = setTimeout(() => {
      performSearch({
        q: searchText.trim(),
       
      });
    }, 400);
    return () => clearTimeout(timer);
  }, [searchText, performSearch]);

  const handleApplyFilters = useCallback(() => {
    performSearch({
      q: searchText.trim(),
      category,
      color,
      brand,
      size,
      minPrice: price[0],
      maxPrice: price[1],
    });
    setShowFilter(false);
  }, [searchText, category, color, brand, size, price, performSearch, setShowFilter]);

  const isSearchActive =
    searchText.trim().length > 0 ||
    category !== "الكل" 
    ||
    brand !== "الكل" ||
    Boolean(color || size);

  const rawProducts = isSearchActive ? searchResult : allProducts;

  // O(N) Deduplication
  const uniqueProducts = useMemo(() => {
    const seen = new Set<string>();
    return rawProducts.filter((item) => {
      if (!item?._id || seen.has(item._id)) return false;
      seen.add(item._id);
      return true;
    });
  }, [rawProducts]);

  const isLoading = isInitialLoading && !isSearchActive;
  const isError = isInitialError && !isSearchActive;

  const handleClear = useCallback(() => {
    setSearchText("");
    setSearchResult([]);
  }, []);

  const renderItem = useCallback(({ item }: { item: any }) => {
    return <ProductCard product={item} />;
  }, []);

  const renderFooter = useCallback(() => {
    if (isSearchActive || !isFetchingNextPage) return null;
    return (
      <View style={styles.footer}>
        <ActivityIndicator size="small" color="#B89354" />
      </View>
    );
  }, [isSearchActive, isFetchingNextPage]);

  const onEndReached = useCallback(() => {
    if (!isSearchActive && hasNextPage) {
      fetchNextPage();
    }
  }, [isSearchActive, hasNextPage, fetchNextPage]);

  const keyExtractor = useCallback(
    (item: any, index: number) => (item._id ? String(item._id) : `prod-${index}`),
    []
  );

  if (isLoading) {
    return <LoadingPage  />;
  }

  if (isError) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>حدث خطأ أثناء تحميل المنتجات</Text>
      </View>
    );
  }

  return (
    <View className="flex-1">

      {/* Search Bar */}
      <View
        className="mx-4 my-3 flex-row items-center bg-card rounded-xl overflow-hidden"
        style={{
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.05,
          shadowRadius: 8,
          elevation: 3,
        }}
      >
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => setShowFilter(true)}
          className="p-4 pr-3 border-r border-stone-100"
        >
          <Ionicons name="filter-sharp" size={20} color={COLORS.primary} />
        </TouchableOpacity>

        {searchText.length > 0 && (
          <TouchableOpacity activeOpacity={0.6} onPress={handleClear} className="p-2">
            <Ionicons name="close-circle" size={24} color={COLORS.active} />
          </TouchableOpacity>
        )}

        <TextInput
          className="flex-1 py-4 pr-2 text-right text-base font-medium font-tajwal text-body"
          placeholder="ابحث عن مجموعتنا الحصرية..."
          placeholderTextColor="#a8a29e"
          value={searchText}
          onChangeText={setSearchText}
          textAlign="right"
          textAlignVertical="center"
          returnKeyType="search"
          clearButtonMode="never"
        />

        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() =>
            performSearch({
              q: searchText.trim(),
              category: category === "الكل" ? "" : category,
                color:  color === "الكل" ? "" : color,
                brand:  brand === "الكل" ? "" : brand,
                size:  size === "الكل" ? "" : size,
                minPrice: price[0]|| 0,
              maxPrice: price[1]|| 10000,
            })
          }
          className="p-4 pl-3 border-l border-stone-100"
        >
          <Ionicons name="search-outline" size={20} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      {/* Product List Area */}
      <View style={{ flex: 1 }}>
        {isSearchActive && isSearchLoading ? (
          <LoadingPage />
        ) : uniqueProducts.length === 0 ? (
          <View style={styles.center}>
            <Text style={{ color: "#888", fontSize: 16, fontFamily: "Tajawal-Medium" }}>
              {isSearchActive ? "لا توجد منتجات مطابقة لبحثك" : "لا توجد منتجات متاحة حالياً"}
            </Text>
          </View>
        ) : (
          <FlatList
            data={uniqueProducts}
            renderItem={renderItem}
            keyExtractor={keyExtractor}
            numColumns={2}
            onEndReached={onEndReached}
            onEndReachedThreshold={0.4}
            ListFooterComponent={renderFooter}
            windowSize={5}
            maxToRenderPerBatch={6}
            initialNumToRender={6}
            removeClippedSubviews={true}
            contentContainerStyle={styles.listContainer}
            columnWrapperStyle={styles.columnWrapper}
          />
        )}
      </View>

      {/* Filter Modal */}
      <FilterProductsModal
        showFilterModal={showFilter}
        setShowFilterModal={setShowFilter}
        selectedCategory={category}
        setSelectedCategory={setCategory}
        selectedColor={color}
        setSelectedColor={setColor}
        selectedSize={size}
        setSelectedSize={setSize}
        selectedBrand={brand}
        setSelectedBrand={setBrand}
        priceRange={price}
        setPriceRange={setPrice}
        onApply={handleApplyFilters}
        searchResultsCount={searchResult.length}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFF8F5",
  },
  errorText: {
    fontSize: 16,
    color: "#B89354",
    fontFamily: "Tajawal-Medium",
  },
  listContainer: {
    paddingHorizontal: 12,
    paddingVertical: 16,
    backgroundColor: "#FFF8F5",
  },
  columnWrapper: {
    justifyContent: "space-between",
    marginBottom: 16,
  },
  footer: {
    paddingVertical: 20,
    justifyContent: "center",
    alignItems: "center",
  },
});
