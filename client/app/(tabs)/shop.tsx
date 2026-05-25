import ProductCard from "@/components/ProductCard";
import { CATEGORIES, COLORS, CURRENCY } from "@/constants";
import { IProduct } from "@/constants/types";
import { FontAwesome, Ionicons } from "@expo/vector-icons";
import MultiSlider from "@ptomasroos/react-native-multi-slider";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  FlatList,
  Modal,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Header from "../../components/Header";
import axios from "../../config/api";
const Shop = () => {
  const fetchInFlight = useRef(false);
  const [searchText, setSearchText] = useState("");
  const [products, setProducts] = useState<IProduct[]>([]);
  const [productsByCategory, setProductsByCategory] = useState<Record<string, IProduct[]>>(
    {}
  );

  const [isFocused, setIsFocused] = useState(false);
  const [filterModal, setFilterModal] = useState(false);
  const inputRef = useRef<TextInput | null>(null);
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const categoriesMaped = CATEGORIES.map((c) => c.title);
  const [category, setCategory] = useState<string>("الكل");
  const [activeCategoryLoading, setActiveCategoryLoading] = useState(false);

  const [color, setColor] = useState<string>("");
  const [brand, setBrand] = useState([
    { label: "الكل", checked: true },
    { label: "نسيج الشرق", checked: true },
    { label: "فنون يدوية", checked: true },
    { label: "تراثنا الأصيل", checked: true },
  ]);
  const [size, setSize] = useState("");
  const sizesOption = [
    {
      label: "الكل",
      value: "",
    },
    {
      label: "صغير",
      value: "s",
    },
    {
      label: "متوسط",
      value: "m",
    },
    {
      label: "كبير",
      value: "l",
    },
    {
      label: "كبير جداً",
      value: "xxl",
    },
  ];
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const colorOptions = ["#000000", "#ffffff", "#B89354", "#D4AF37"];
  const [priceValues, setPriceValues] = useState([150, 2500]);
  const handleClear = () => {
    setSearchText("");
    inputRef.current?.focus();
  };
  const fetchProducts = async (pageNumber: number = 1) => {
    if (fetchInFlight.current) return;
    fetchInFlight.current = true;
    if (pageNumber === 1) {
      setLoading(true);
    } else {
      setLoadingMore(true);
    }
    try {
      const queryParams: any = { page: pageNumber, limit: 4 };
      const { data } = await axios.get("/products", { params: queryParams });
      if (pageNumber === 1) {
        setProducts(data.data);
      } else {
        setProducts((prev) => [...prev, ...data.data]);
      }
      setHasMore(data.pagination.page < data.pagination.pages);
      setPage(pageNumber);
    } catch (error: any) {
      console.error("Error fetching products:", error);
    } finally {
      fetchInFlight.current = false;
      setLoading(false);
      setLoadingMore(false);
    }
  };
  const fetchProductsByCategory = async (
    pageNumber: number = 1,
    category: string
  ) => {
    if (!category) return;

    if (fetchInFlight.current) return;

    fetchInFlight.current = true;
    if (pageNumber === 1) {
      setLoading(true);
    } else {
      setLoadingMore(true);
    }
    try {
      const queryParams: any = { page: pageNumber, limit: 4,category };
      const { data } = await axios.get("/products", { params: queryParams });
      if (pageNumber === 1) {
        setProducts(data.data);
      } else {
        setProducts((prev) => [...prev, ...data.data]);
      }
      setHasMore(data.pagination.page < data.pagination.pages);
      setPage(pageNumber);
    } catch (error: any) {
      console.error("Error fetching products:", error);
    } finally {
      fetchInFlight.current = false;
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const loadMore = () => {
    if (!loading && !loadingMore && hasMore && !fetchInFlight.current) {
      fetchProducts(page + 1);
    }
  };
  const animatePress = (callback: any) => {
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.92,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start(callback);
  };

  useEffect(() => {
    // fetch first page for all categories (4 products each)
    const fetchAll = async () => {
      // Use promise sequence to avoid overloading fetchInFlight ref.
      // We'll display category tabs but initial grid will show 'الكل'.
      // (If you want to render multiple category sections, you'll need UI changes.)
      setCategory("الكل");
      fetchProducts(1);

      // Preload first page for each category (optional)
      for (const c of categoriesMaped) {
        try {
          await fetchProductsByCategory(1, c);
        } catch {
          // ignore
        }
      }
    };
    fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <SafeAreaView className="bg-surface shadow flex-1" edges={["top"]}>
      <Header showBack />

      <Animated.View
        className={`mx-4 my-3 flex-row items-center
           bg-white rounded-xl overflow-hidden
        ${isFocused ? "ring-2 ring-primary ring-opacity-50" : ""}`}
        style={{
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.05,
          shadowRadius: 8,
          elevation: 3,
          transform: [{ scale: scaleAnim }],
        }}
      >
        {/* Left icon – sparkles (with touch feedback) */}
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={(e) => {
            e.stopPropagation();
            animatePress(() => setFilterModal(true));
          }}
          className="p-4 pr-3 border-r border-stone-100"
        >
          <Ionicons name="sparkles-outline" size={20} color={COLORS.primary} />
        </TouchableOpacity>

        {/* TextInput – flexible, right-aligned */}
        <TextInput
          onPressIn={(e) => e.stopPropagation()}
          ref={inputRef}
          className="flex-1 py-4 pr-2 text-right text-base font-medium 
          font-tajwal text-stone-800"
          placeholder="ابحث عن مجموعتنا الحصرية..."
          placeholderTextColor="#a8a29e"
          value={searchText}
          onChangeText={(e) => console.log(e)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          textAlign="right"
          textAlignVertical="center"
          returnKeyType="search"
          clearButtonMode="never" // we handle custom clear
        />

        {/* Clear button (appears only when text exists) */}
        {searchText.length > 0 && (
          <TouchableOpacity
            activeOpacity={0.6}
            onPress={handleClear}
            className="p-2"
          >
            <Ionicons name="close-circle" size={20} color="#9ca3af" />
          </TouchableOpacity>
        )}

        {/* Right icon – search (with touch feedback) */}
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={(e) => {
            e.stopPropagation();
            animatePress(() => console.log("Search:", searchText));
          }}
          className="p-4 pl-3 border-l border-stone-100"
        >
          <Ionicons name="search-outline" size={20} color={COLORS.primary} />
        </TouchableOpacity>
      </Animated.View>
      <View className="mr-4 mt-4  ">
      {
        loading? (
          <View className="flex-1 flex-row items-center justify-center mt-4">
            <ActivityIndicator size="small" color={COLORS.primary} />
            <Text className="text-secondary mr-2 text-sm">
              جارٍ التحميل...
            </Text>
          </View>
        ):( <FlatList
          data={[...categoriesMaped, "الكل"]}
          horizontal
          contentContainerStyle={{
            alignSelf: "flex-start",
            justifyContent: "flex-start",
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            gap: 4,
            paddingHorizontal: 4,
            paddingVertical: 3,
          }}
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => item}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => setCategory(item)}
              style={{
                outlineWidth: 1,
                outlineColor:
                  category === item ? COLORS.active : COLORS.inactive,
                outlineOffset: -1,
                backgroundColor: "white",
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.05,
                shadowRadius: 8,
                elevation: 1,
              }}
              className="px-6 py-2 rounded-full inline-flex flex-col justify-center items-center"
            >
              <Text
                className={`text-center justify-center  ${category === item ? "text-primary-700" : "text-primary-800"} text-base font-medium font-tajwal  tracking-wide`}
              >
                {item}
              </Text>
            </TouchableOpacity>
          )}
        />)
      }
       
      </View>

      <ScrollView className="flex-1 mt-4 mb-6 mx-4" showsVerticalScrollIndicator={false}>
        {/* Section: first 4 products for each category */}
        {(["الكل", ...categoriesMaped] as string[]).map((c) => {
          const items =
            c === "الكل" ? products : productsByCategory[c] ?? [];

          return (
            <View key={c} className="mb-8">
              <View className="flex-row items-center justify-between mb-3">
                <Text className="text-right text-body text-lg font-bold font-tajwal text-[#201b16]">
                  {c}
                </Text>
              </View>

              {items.length === 0 ? (
                <View className="flex-1 flex-row items-center justify-center mt-2">
                  <ActivityIndicator size="small" color={COLORS.primary} />
                  <Text className="text-secondary mr-2 text-sm">جارٍ التحميل...</Text>
                </View>
              ) : (
                <FlatList
                  data={items}
                  keyExtractor={(item) => item._id}
                  numColumns={2}
                  scrollEnabled={false}
                  columnWrapperStyle={{
                    flex: 1,
                    marginBottom: 16,
                    columnGap: 16,
                  }}
                  renderItem={({ item }) => (
                    <ProductCard product={item as IProduct} />
                  )}
                />
              )}
            </View>
          );
        })}
      </ScrollView>

      <Modal visible={filterModal}
       
        animationType="fade"
        transparent
        onRequestClose={() => setFilterModal(false)}
      >
        <View className="bg-surface flex-1 rounded-t-2xl p-4 relative">
          <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
            <View className="flex-row justify-between items-center mb-4 pb-4 border-b border-primary-100">
              <View className="flex flex-row items-center gap-2">
                <Ionicons
                  name="repeat-outline"
                  size={18}
                  color={COLORS.inactive}
                />
                <Text className="text-sm font-base font-body text-primary-700">
                  إعادة تعيين
                </Text>
              </View>
              <TouchableOpacity onPress={() => setFilterModal(false)}>
                <Ionicons
                  name="close-outline"
                  size={24}
                  color={COLORS.inactive}
                />
              </TouchableOpacity>
            </View>
            <View className="mb-8">
              <View className="border-r-2 border-primary-700 mb-8">
                <Text
                  className="font-tajwal mr-4 text-2xl
                     text-body font-bold text-right
                
               
              "
                >
                  التصفية حسب اللون
                </Text>
              </View>
              <View
                className="flex-1 self-end 
                flex-row gap-4 mx-4  "
              >
                {colorOptions.map((c, index) => (
                  <TouchableOpacity
                    onPress={() => setColor(c)}
                    key={index}
                    style={{
                      outlineColor:
                        c === color ? COLORS.active : COLORS.inactive,
                      outlineOffset: 2,
                      outlineWidth: c === color ? 3 : 2,
                      backgroundColor: c,
                    }}
                    className={`flex items-center justify-center h-[32px] w-[32px] rounded-full `}
                  >
                    {c === color && (
                      <Ionicons
                        name="checkmark-sharp"
                        color={"#785920"}
                        size={14}
                      />
                    )}
                  </TouchableOpacity>
                ))}
                <TouchableOpacity
                  onPress={() => setColor("")}
                  style={{
                    outlineColor:
                      "" === color ? COLORS.primary : COLORS.inactive,
                    outlineOffset: 2,
                    outlineWidth: "" === color ? 3 : 2,
                  }}
                  className={`h-[32px] w-[32px] flex items-center justify-center rounded-full bg-primary-100`}
                >
                  <Text className="text-sx font-tajwal text-primary">الكل</Text>
                </TouchableOpacity>
              </View>
            </View>
            <View className="mb-8">
              <View className="border-r-2 border-primary-700 mb-8">
                <Text
                  className="font-tajwal mr-4 text-2xl text-body font-bold text-right
                
               
              "
                >
                  العلامات التجارية
                </Text>
              </View>
              <View className="flex-col self-end gap-3 p-4  rounded-lg">
                {brand.map((opt, index) => (
                  <TouchableOpacity
                    onPress={() =>
                      setBrand((prev) =>
                        prev.map((b) =>
                          b.label === opt.label
                            ? { ...b, checked: !b.checked }
                            : b,
                        ),
                      )
                    }
                    key={index}
                    className={`flex-row items-center justify-between w-full rounded-xl  p-3 ${opt.checked ? "bg-primary-200" : "bg-primary-100"}`}
                  >
                    {/* مربع الاختيار */}
                    <View
                      className={`w-6 h-6 rounded border border-gray-400 flex items-center justify-center ${opt.checked ? "bg-primary-700" : ""}`}
                    >
                      {opt.checked && (
                        <FontAwesome name="check" size={14} color="white" />
                      )}
                    </View>
                    {/* النص */}
                    <Text className="text-right text-body  font-tajwal text-lg">
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            <View className="mb-8 ">
              <View className="flex-1 mx-4  flex-row items-center justify-between border-r-2 border-primary-700 mb-8">
                <Text className="font-tajwal mr-4 text-xl leading-7 text-accent font-bold text-left">
                  {priceValues[1]} - {priceValues[0]} {CURRENCY}
                </Text>
                <Text className="font-tajwal mr-4 text-2xl leading-7 text-body font-bold text-right">
                  نطاق السعر
                </Text>
              </View>
              <View className="flex-1 mx-auto">
                <MultiSlider
                  values={priceValues}
                  min={0}
                  max={5000}
                  step={50}
                  onValuesChange={setPriceValues}
                  selectedStyle={{ backgroundColor: "#785920" }}
                  unselectedStyle={{ backgroundColor: "#d1c5b4" }}
                  markerStyle={{
                    backgroundColor: "#785920",
                    width: 24,
                    height: 24,
                  }}
                  trackStyle={{
                    height: 4,
                    width: "100%",
                  }}
                />
                {/* Labels en bas */}
                <View className="flex-row items-end justify-between ">
                  <Text className="text-body text-sm font-tajwal">
                    0 {CURRENCY}
                  </Text>
                  <Text className="text-body text-right text-sm font-tajwal">
                    +5000 {CURRENCY}
                  </Text>
                </View>
              </View>
            </View>
            <View className="mb-12">
              <View className="border-r-2 border-primary-700 mb-8">
                <Text className="font-tajwal mr-4 text-2xl text-body font-bold text-right      ">
                  المقاس
                </Text>
              </View>
              <View className="flex justify-end flex-row gap-3 p-3">
                {sizesOption.map((s, index) => (
                  <TouchableWithoutFeedback
                    onPress={() => setSize(s.value)}
                    key={index}
                    className={` px-6 py-2  
                       
                        inline-flex flex-col justify-center items-center`}
                    style={{
                      backgroundColor: size === s.value ? "#b89354" : "#d1c5b4",
                      borderColor: size === s.value ? "#7a5b14" : "#7a5b14",
                      borderWidth: 1,
                    }}
                  >
                    <Text
                      className={`font-tajwal text-base  ${s.value === size ? "text-active" : "text-inactive"}`}
                    >
                      {s.label}
                    </Text>
                  </TouchableWithoutFeedback>
                ))}
              </View>
            </View>
          </ScrollView>
          <View className=" bg-[#fcf9f1]/90 py-4 px-6   border-t border-t-primary-100  flex-row justify-between items-center">
            <TouchableOpacity className="px-12 py-3 relative bg-[#785920] rounded-full inline-flex flex-col justify-center items-center">
              <View className="w-[177.64px] h-[52px] left-0 top-0 absolute bg-white/0 rounded-full shadow-[0px_4px_6px_-4px_rgba(120,89,32,0.20)] shadow-[0px_10px_15px_-3px_rgba(120,89,32,0.20)]" />

              <Text className="text-center justify-center text-white text-lg font-bold font-tajwal leading-7">
                تطبيق الفلاتر
              </Text>
            </TouchableOpacity>
            <View className="inline-flex flex-col justify-start items-start">
              <View className="self-stretch flex flex-col justify-start items-end">
                <Text className="text-right justify-center text-[#4c4542] text-[10px] font-normal font-tajwal leading-[15px]">
                  النتائج
                </Text>
              </View>
              <View className="">
                <Text className="text-right justify-center text-accent text-base font-normal font-tajwal leading-6">
                  124 قطعة
                </Text>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default Shop;
