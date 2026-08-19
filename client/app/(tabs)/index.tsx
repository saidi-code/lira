import React, { useCallback,useState,useRef,useEffect } from 'react';
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
import Header from '../../components/Header'
import { FontAwesome, Ionicons } from "@expo/vector-icons";
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { useProducts } from '../../hooks/useProdoucts.js';

import { CURRENCY } from '../../constants';
import ProductCard from "@/components/ProductCard";
import { COLORS } from '../../constants';
import FilterProductsModal from '@/components/FilterProductsModal';
import {api} from "../../config/apiQuery"
import {useDebouncedSearch} from "../../hooks/useDebouncedSearch"
const defaultSource = require('../../assets/images/productLoadingImage.png');
const placeholderSource = require('../../assets/images/productLoadingImage.svg');
export default function Index() {
  const router = useRouter();
   const [showFilter, setShowFilter] = useState(false);
  const [category, setCategory] = useState('الكل');
  const [color, setColor] = useState('');
  const [size, setSize] = useState('');
  const [brand, setBrand] = useState('');
  const [price, setPrice] = useState<[number, number]>([150, 2500]);
 const [searchText,setSearchText]= useState("")
   const [isFocused, setIsFocused] = useState(false);
   const [searchResult,setSearchResult]= useState([])
   
 const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
  } = useProducts();
const { inputValue, setInputValue, products:SearchProudctsData, isLoading:searchLoading } = useDebouncedSearch('', {
  delay: 400,
  category: 'مجوهرات',
  minPrice: 100,
  maxPrice: 500,
});
  const queryClient = useQueryClient();

  const handleProductHover = useCallback(
    (productId: string) => {
      queryClient.prefetchQuery({
        queryKey: ['product', productId],
        queryFn: () => api.get(`/products/${productId}`),
        staleTime: 5 * 60 * 1000,
      });
    },
    [queryClient],
  );
// -------- Handlers --------
  const handleApply = () => {
    // Parent can listen to onApply to fetch filtered products
 console.log("apying filter function")
    setShowFilter(false);
  };

  const handleReset = () => {
    setCategory('الكل');
    setColor('');
    setSize('');
    setBrand('');
    setPrice([150, 2500]);
  };
  // const handleSearch = async () => {
  //   let filter = {}
  //   const query = new URLSearchParams(filter)
  //   if(searchText){
  //     filter = {...filter,q:searchText}
  //   }
  //   if(category){
  //     filter = {...filter,category}
  //   }
  //   if(color){
  //     filter = {...filter, color}
  //   }
  //   if(size){
  //     filter = {...filter,size}
  //   }
  //   if(brand){
  //     filter = {...filter,brand}
  //   }
  //   if(price){
  //     filter = {...filter,minPrice:price[0]}
  //   }
  //   if(price){
  //     filter = {...filter,maxPrice:price[1]}
  //   }
  //   try {
  //     const { data } = await axios.get("/products/search", {
  //       params: { search: query },
  //     });
  //     setSearchResult(data.data);
  //   } catch (error) {
  //     console.error("Error searching products:", error);
  //   }
  // };
//   const searchProducts = async (query) => {
//   const params = new URLSearchParams({
//     q: query,
//     page: 1,
//     limit: 10,
//     category: 'مجوهرات',
//     minPrice: 100,
//     maxPrice: 500,
//   });
//   const response = await fetch(`${api}/products/search?${params}`);
//   const data = await response.json();
//    setSearchResult(data.data);
//   console.log(data.products);
// };  
  // useEffect(() => {
  //   const delayDebounce = setTimeout(() => {
  //     searchProducts(searchText);
  //   }, 500);
  //   return () => clearTimeout(delayDebounce);
  // }, [searchText]);
  // if (isLoading) {
  //   return (
  //     <View style={styles.center}>
  //       <ActivityIndicator size="large" color="#B89354" />
  //       <Text style={styles.loadingText}>Loading...</Text>
  //     </View>
  //   );
  // }

  // if (isError) {
  //   return (
  //     <View style={styles.center}>
  //       <Text style={styles.errorText}>Error loading products</Text>
  //     </View>
  //   );
  // }

  const allProducts = data?.pages.flatMap((page: any) => page.products) || [];

  const renderItem = ({ item, index }: { item: any; index: number }) => {
    const imageUri = item.images?.[0] ?? item.colors?.[0]?.images?.[0];
    return (
     <ProductCard product={item} />
      // <TouchableOpacity
      //   onPress={() => {
      //     handleProductHover(item._id);
      //     router.push(`/product/${item._id}`);
      //   }}
      //   activeOpacity={0.7}
      //   style={styles.productCard}
      // >
      //   <View style={styles.imageContainer}>
      //     <Image
      //       source={imageUri ? { uri: imageUri } : defaultSource}
      //       style={styles.productImage}
      //       contentFit="cover"
      //       cachePolicy="memory-disk"
      //       priority={index < 3 ? 'high' : 'normal'}
      //       placeholder={placeholderSource}
      //       placeholderContentFit="cover"
      //       transition={300}

      //     />
      //     {/* <View style={styles.loadingOverlay} pointerEvents="none">
      //       <ActivityIndicator size="small" color="#B89354" />
      //     </View> */}
      //     </View>
      //   <Text style={styles.productName}>{item.name}</Text>
      //   <Text style={styles.productPrice}>
      //     {item.price} {CURRENCY}
      //   </Text>
      // </TouchableOpacity>
    );
  };

  const renderFooter = () => {
    if (!isFetchingNextPage) return null;
    return (
      <View style={styles.footer}>
        <ActivityIndicator size="small" color="#B89354" />
      </View>
    );
  };
const handleClear = () => {
    setSearchText("");
    inputRef.current?.focus();
  };
  return (
     <SafeAreaView className="bg-surface shadow flex-1" edges={["top"]}>
      <Header showBack />
        <View
        className={`mx-4 my-3 flex-row items-center bg-white rounded-xl overflow-hidden ${
          isFocused ? "ring-2 ring-primary ring-opacity-50" : ""
        }`}
        style={{
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.05,
          shadowRadius: 8,
          elevation: 3,
          // transform: [{ scale: scaleAnim }],
        }}
      >
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={(e) => {
          e.stopPropagation();
           setShowFilter(true)
          }}
          className="p-4 pr-3 border-r border-stone-100"
        >
          <Ionicons name="filter-sharp" size={20} color={COLORS.primary} />
        </TouchableOpacity>
      {inputValue.length > 0 && (
          <TouchableOpacity activeOpacity={0.6} onPress={handleClear} className="p-2 ">
            <Ionicons name="close-circle" size={24} color={COLORS.active} />
          </TouchableOpacity>
        )}
        <TextInput
          // onPressIn={(e) => e.stopPropagation()}
        
          className="flex-1 py-4 pr-2 text-right text-base font-medium font-tajwal text-stone-800"
          placeholder="ابحث عن مجموعتنا الحصرية..."
          placeholderTextColor="#a8a29e"
          value={inputValue}
          onChangeText={setInputValue}
          // onFocus={() => setIsFocused(true)}
          // onBlur={() => setIsFocused(false)}
          textAlign="right"
          textAlignVertical="center"
          returnKeyType="search"
          clearButtonMode="never"
        />

  
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={(e) => {
            e.stopPropagation();
            // search logic not implemented in backend filter right now
            // console.log("Search:", searchText);
          //  setFilterModal(true)
          // btn search logic not implemented in backend filter right now
          }}
          className="p-4 pl-3 border-l border-stone-100"
        >
          <Ionicons name="search-outline" size={20} color={COLORS.primary} />
        </TouchableOpacity>
    
    </View>
    {/* <FlatList
      data={allProducts}
      renderItem={renderItem}
      keyExtractor={(item, index) => `${item._id}_${index}`}
      numColumns={2}
      onEndReached={() => hasNextPage && fetchNextPage()}
      onEndReachedThreshold={0.5}
      ListFooterComponent={renderFooter}
      windowSize={5}
      maxToRenderPerBatch={5}
      initialNumToRender={6}
      removeClippedSubviews={true}
      contentContainerStyle={styles.listContainer}
      columnWrapperStyle={styles.columnWrapper}
    /> */}
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
