import React, { useCallback, useState } from 'react';
import {
  FlatList,
  View,
  Text,
  ActivityIndicator,
  TouchableOpacity,
  StyleSheet,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Header from '../../../components/Header';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { useProducts } from '../../../hooks/useProdoucts.js';
import { COLORS } from '../../../constants';
import ProductCard from '@/components/ProductCard';
import FilterProductsModal from '@/components/FilterProductsModal';
import { api } from '../../../config/apiQuery';
import { useDebouncedSearch } from '../../../hooks/useDebouncedSearch';

// Placeholder assets (unchanged)
const defaultSource = require('../../../assets/images/productLoadingImage.png');
const placeholderSource = require('../../../assets/images/productLoadingImage.svg');

export default function Index() {
  const router = useRouter();
  const queryClient = useQueryClient();

  // ----- Filter state -----
  const [showFilter, setShowFilter] = useState(false);
  const [category, setCategory] = useState('الكل');
  const [color, setColor] = useState('');
  const [size, setSize] = useState('');
  const [brand, setBrand] = useState('');
  const [price, setPrice] = useState<[number, number]>([0, 2500]);
  const [isFocused, setIsFocused] = useState(false);

  // ----- 1. Main product list (infinite scroll) -----
  const {
    data: productsData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading: isInitialLoading,
    isError: isInitialError,
  } = useProducts({
    page: 1,
    category: '', // adjust if you need an initial category
  });

  const allProducts = productsData?.pages.flatMap((page: any) => page.products) || [];

  // ----- 2. Search hook (with explicit `q`) -----
  const {
    inputValue,
    setInputValue,
    products: searchResults,
    isLoading: isSearchLoading,
    isError: isSearchError,
  } = useDebouncedSearch(
    '',
    {
      delay: 400,
      q: inputValue, // 👈 explicitly send the search text
      category: category === 'الكل' ? '' : category,
      minPrice: price[0],
      maxPrice: price[1],
    }
  );

  // Determine what to display
  const isSearchActive = inputValue.trim().length > 0;
  const productsToShow = isSearchActive ? searchResults : allProducts;
  const isLoading = isSearchActive ? isSearchLoading : isInitialLoading;
  const isError = isSearchActive ? isSearchError : isInitialError;

  // ----- 3. Handlers -----
  const handleProductHover = useCallback(
    (productId: string) => {
      queryClient.prefetchQuery({
        queryKey: ['product', productId],
        queryFn: () => api.get(`/products/${productId}`),
        staleTime: 5 * 60 * 1000,
      });
    },
    [queryClient]
  );

  const handleApply = () => {
    console.log('Applying filter');
    setShowFilter(false);
  };

  const handleReset = () => {
    setCategory('الكل');
    setColor('');
    setSize('');
    setBrand('');
    setPrice([0, 2500]);
  };

  const handleClear = () => {
    setInputValue(''); // clear search input
  };

  // ----- 4. Render helpers -----
  const renderItem = ({ item, index }: { item: any; index: number }) => {
    const imageUri = item.images?.[0] ?? item.colors?.[0]?.images?.[0];
    return <ProductCard product={item} />;
  };

  const renderFooter = () => {
    // Only show pagination indicator when NOT searching
    if (isSearchActive) return null;
    if (!isFetchingNextPage) return null;
    return (
      <View style={styles.footer}>
        <ActivityIndicator size="small" color="#B89354" />
      </View>
    );
  };

  // ----- 5. Loading & Error states -----
  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#B89354" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  if (isError) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Error loading products</Text>
      </View>
    );
  }

  // ----- 6. Main render -----
  return (
    <SafeAreaView className="bg-surface shadow flex-1" edges={['top']}>
      <Header showBack />

      {/* Search Bar */}
      <View
        className={`mx-4 my-3 flex-row items-center bg-white rounded-xl overflow-hidden ${
          isFocused ? 'ring-2 ring-primary ring-opacity-50' : ''
        }`}
        style={{
          shadowColor: '#000',
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

        {inputValue.length > 0 && (
          <TouchableOpacity activeOpacity={0.6} onPress={handleClear} className="p-2">
            <Ionicons name="close-circle" size={24} color={COLORS.active} />
          </TouchableOpacity>
        )}

        <TextInput
          className="flex-1 py-4 pr-2 text-right text-base font-medium font-tajwal text-stone-800"
          placeholder="ابحث عن مجموعتنا الحصرية..."
          placeholderTextColor="#a8a29e"
          value={inputValue}
          onChangeText={setInputValue}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          textAlign="right"
          textAlignVertical="center"
          returnKeyType="search"
          clearButtonMode="never"
        />

        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => {
            // Optional manual search trigger
          }}
          className="p-4 pl-3 border-l border-stone-100"
        >
          <Ionicons name="search-outline" size={20} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      {/* Product List */}
      {productsToShow.length === 0 ? (
        <View style={styles.center}>
          <Text style={{ color: '#888', fontSize: 16 }}>
            {isSearchActive ? 'No products match your search' : 'No products available'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={productsToShow}
          renderItem={renderItem}
          keyExtractor={(item, index) => `${item._id}_${index}`}
          numColumns={2}
          onEndReached={() => {
            // Only fetch more if we are NOT searching
            if (!isSearchActive && hasNextPage) {
              fetchNextPage();
            }
          }}
          onEndReachedThreshold={0.5}
          ListFooterComponent={renderFooter}
          windowSize={5}
          maxToRenderPerBatch={5}
          initialNumToRender={6}
          removeClippedSubviews={true}
          contentContainerStyle={styles.listContainer}
          columnWrapperStyle={styles.columnWrapper}
        />
      )}

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
        onApply={handleApply}
      />
    </SafeAreaView>
  );
}

// ---------- Styles (unchanged) ----------
const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFF8F5',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#B89354',
    fontFamily: 'Tajawal-Medium',
  },
  errorText: {
    fontSize: 16,
    color: '#B89354',
    fontFamily: 'Tajawal-Medium',
  },
  listContainer: {
    paddingHorizontal: 12,
    paddingVertical: 16,
    backgroundColor: '#FFF8F5',
  },
  columnWrapper: {
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  productCard: {
    flex: 1,
    marginHorizontal: 6,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  imageContainer: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: '#f5f5f5',
    position: 'relative',
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  productName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#201B16',
    textAlign: 'right',
    paddingHorizontal: 8,
    paddingTop: 8,
    fontFamily: 'Tajawal-Medium',
  },
  productPrice: {
    fontSize: 13,
    fontWeight: '700',
    color: '#B89354',
    textAlign: 'right',
    paddingHorizontal: 8,
    paddingBottom: 12,
    paddingTop: 4,
    fontFamily: 'Tajawal-Medium',
  },
  footer: {
    paddingVertical: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
});