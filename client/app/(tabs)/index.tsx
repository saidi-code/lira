import { Ionicons, MaterialCommunityIcons, Octicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import {
  Dimensions,
  FlatList,
  Image,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Header from "../../components/Header";
import ProductCard from "../../components/ProductCard";
import { CATEGORIES, COLLECTIONS, COLORS } from "../../constants/index";
import { ICollection, IProduct } from "../../constants/types";
export default function Index() {
  const [email, setEmail] = useState("");
  const [collections, setCollections] = useState<ICollection[]>([]);
  const [activeBannerIndex, setActiveBannerIndex] = useState(0);

  const { width } = Dimensions.get("window");

  const getIconName = (title: string) => {
    switch (title) {
      case "مجوهرات":
        return "diamond-outline";
      case "ساعات":
        return "watch-outline";
      case "عطور":
        return "water-outline";
      case "ملابس":
        return "shirt-outline";
      case "باخور":
        return "flame-outline";
      case "حقائب يد":
        return "briefcase-outline";
      case "إكسسوارات":
        return "color-palette-outline";
      case "أحذية":
        return "";
      default:
        return "help-circle-outline";
    }
  };
  const getIcon = (title: string) => {
    switch (title) {
      case "مجوهرات":
        return (
          <Ionicons name="diamond-outline" size={24} color={COLORS.primary} />
        );
      case "ساعات":
        return (
          <MaterialCommunityIcons
            name="watch"
            size={24}
            color={COLORS.primary}
          />
        );
      case "عطور":
        return (
          <Image
            resizeMode="center"
            style={{
              height: 28,
              width: 28,
            }}
            source={require("../../assets/images/icons/spray_4648182.png")}
          />
        );
      case "ملابس":
        return (
          <Image
            resizeMode="center"
            style={{
              height: 24,
              width: 24,
            }}
            source={require("../../assets/images/icons/dress1.png")}
          />
        );
      case "باخور":
        return <Octicons name="flame" size={24} color={COLORS.primary} />;
      case "حقائب يد":
        return (
          <Image
            resizeMode="center"
            style={{
              height: 24,
              width: 24,
            }}
            source={require("../../assets/images/icons/hand_bag.png")}
          />
        );
      case "إكسسوارات":
        return (
          <Image
            resizeMode="center"
            style={{
              height: 24,
              width: 24,
            }}
            source={require("../../assets/images/icons/accessoires.png")}
          />
        );
      case "مكياج":
        return (
          <Image
            resizeMode="center"
            style={{
              height: 24,
              width: 24,
            }}
            source={require("../../assets/images/icons/makeup.png")}
          />
        );
      case "أحذية":
        return (
          <MaterialCommunityIcons
            name="shoe-heel"
            size={32}
            color={COLORS.primary}
          />
        );
      default:
        return (
          <Ionicons name="grid-outline" size={24} color={COLORS.primary} />
        );
    }
  };

  const fetchCollections = () => {
    // COLLECTIONS mock data is not perfectly typed vs IProduct/ICollection in constants/types.ts
    setCollections(COLLECTIONS as unknown as ICollection[]);
  };

  useEffect(() => {
    fetchCollections();
  }, []);

  return (
    <SafeAreaView className="bg-surface flex-1" edges={["top"]}>
      <Header showSearch showBack={false} />

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Slider Section */}
        <View className="mb-6">
          <FlatList
            data={collections}
            keyExtractor={(item, index) => String(item._id ?? index)}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            snapToInterval={width}
            decelerationRate="fast"
            onMomentumScrollEnd={(e) => {
              const index = Math.round(e.nativeEvent.contentOffset.x / width);
              if (index !== activeBannerIndex) setActiveBannerIndex(index);
            }}
            renderItem={({ item }) => (
              <View
                className="flex-1 relative overflow-hidden"
                style={{ width: width }}
              >
                <Image
                  source={{ uri: item.banner }}
                  style={{ width: 360, height: 196 }}
                  resizeMode="contain"
                />

                <View className="absolute bottom-4 right-4 z-10">
                  <Text className="text-white font-jazera text-2xl font-bold text-right">
                    {item.title}
                  </Text>
                  <Text className="text-white font-tajwal text-sm font-medium">
                    {item.subtitle}
                  </Text>

                  <TouchableOpacity className="mt-2 px-4 py-2 bg-white self-end rounded-lg">
                    <Text className="text-primary text-right text-base">
                      {item.cta}
                    </Text>
                  </TouchableOpacity>
                </View>

                <View className="absolute inset-0 bg-black/20" />
              </View>
            )}
          />

          {/* Pagination Dots */}
          <View className="flex-row justify-center -mt-4 gap-2">
            {COLLECTIONS.map((_, index) => (
              <View
                key={index}
                className={`h-2 rounded-full ${
                  index === activeBannerIndex
                    ? "w-6 bg-primary"
                    : "w-2 bg-gray-300"
                }`}
              />
            ))}
          </View>
        </View>

        {/* Categories sections */}
        <View className="py-6">
          <View className="flex-row items-center justify-between px-4 mb-6">
            <Text className="font-tajwal text-sm text-primary">عرض المزيد</Text>
            <Text className="font-tajwal text-2xl text-body">
              الفئات الفاخرة
            </Text>
          </View>

          <FlatList
            data={CATEGORIES}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item) => item.title}
            renderItem={({ item }) => (
              <TouchableOpacity
                className="rounded-2xl mx-4 items-center justify-center"
                activeOpacity={0.8}
              >
                <View className="w-[80px] h-[80px] rounded-full bg-[#FDF1EA] flex items-center justify-center outline -outline-offset-1 outline-[#B89354}">
                  {getIcon(item.title)}
                  {/* <Ionicons
                    name={getIconName(item.title)}
                    size={24}
                    color={COLORS.primary}
                  /> */}
                </View>
                <Text className="font-tajwal text-base font-medium text-center text-gray-800">
                  {item.title}
                </Text>
              </TouchableOpacity>
            )}
          />
        </View>

        {/* Collections Section */}
        <View className="py-12 px-6">
          {/* Title */}
          <View className="items-center mb-8">
            <Text className="text-center text-[#201b16] text-[32px] font-bold font-jazera leading-[38.4px]">
              مجموعات مختارة
            </Text>
          </View>

          <FlatList
            data={COLLECTIONS}
            keyExtractor={(item, index) => String(item._id ?? index)}
            scrollEnabled={false}
            renderItem={({ item }) => (
              <View className="mb-8 ">
                {/* Banner with overlay */}
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
                  {/* Products Grid - 2 columns */}
                  <FlatList
                    data={(item.products as IProduct[]).slice(0, 4)}
                    keyExtractor={(product, index) =>
                      String(product._id ?? index)
                    }
                    scrollEnabled={false}
                    numColumns={2}
                    columnWrapperStyle={{
                      flex: 1,
                      marginBottom: 16,
                      columnGap: 16,
                    }}
                    renderItem={({ item: product }) => (
                      <ProductCard product={product as IProduct} />
                    )}
                  />
                </View>
              </View>
            )}
          />
        </View>

        {/* News Letters Sections */}
        <View className="px-2 mx-4 pt-[47px] pb-12 bg-[#b89354]/10 rounded-[40px] items-start gap-4 mb-12">
          {/* Title */}
          <View className="self-stretch items-center">
            <Text className="text-center text-[#785920] text-2xl font-bold font-jazera">
              مجلة ليرة الرقمية
            </Text>
          </View>

          {/* Description */}
          <View className="flex items-center justify-center mb-4">
            <View className="mx-3">
              <Text className="text-center text-[#4e4639] text-base font-bady">
                اشترك لتصلك أحدث المقالات والمجموعات الحصرية من عالم الفخامة
              </Text>
            </View>
          </View>

          {/* Input + Button container */}
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
