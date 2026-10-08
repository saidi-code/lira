// app/reviews/index.tsx — My Reviews
import { useRouter } from "expo-router";
import React from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import Header from "@/components/Header";
import { COLORS } from "@/constants";
import { formatDate } from "@/constants/utility";
import { useMyReviews, useDeleteReview } from "@/hooks/useReviews";
import { BackendReview, ReviewProduct } from "@/config/reviewApi";

const Stars = ({ rating, size = 14 }: { rating: number; size?: number }) => (
  <View className="flex-row-reverse gap-0.5">
    {[1, 2, 3, 4, 5].map((n) => (
      <Ionicons
        key={n}
        name={n <= rating ? "star" : "star-outline"}
        size={size}
        color="#B89354"
      />
    ))}
  </View>
);

const MyReviewsScreen = () => {
  const router = useRouter();
  const { data, isLoading, isError, refetch } = useMyReviews();
  const deleteReview = useDeleteReview();

  const reviews = data?.data ?? [];

  const handleDelete = (review: BackendReview) => {
    Alert.alert("حذف التقييم", "هل أنت متأكد من حذف هذا التقييم؟", [
      { text: "تراجع", style: "cancel" },
      {
        text: "حذف",
        style: "destructive",
        onPress: () =>
          deleteReview.mutate({
            reviewId: review._id,
            productId:
              typeof review.product === "object" ? review.product._id : undefined,
          }),
      },
    ]);
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <View className="py-24 items-center">
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text className="mt-3 font-tajwal text-secondary">
            جارٍ تحميل تقييماتك...
          </Text>
        </View>
      );
    }

    if (isError) {
      return (
        <View className="mx-4 p-4 items-center justify-center bg-canvas rounded-xl border border-primary border-dashed">
          <Text className="text-center text-xl text-primary-700 font-jazera mb-4 font-bold">
            تعذّر تحميل التقييمات
          </Text>
          <TouchableOpacity
            onPress={() => refetch()}
            activeOpacity={0.8}
            className="self-stretch py-4 bg-[#785920] rounded-full shadow-md items-center"
          >
            <Text className="text-white text-base font-tajwal">
              إعادة المحاولة
            </Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (reviews.length === 0) {
      return (
        <View className="mx-4 p-4 items-center justify-center bg-canvas rounded-xl border border-primary border-dashed">
          <Text className="text-center text-xl text-primary-700 font-jazera mb-4 font-bold">
            لم تقيّم أي منتج بعد
          </Text>
          <Text className="text-primary-500 font-tajwal text-center px-4 mb-6">
            شارك رأيك في المنتجات التي اقتنيتها لمساعدة الآخرين على الاختيار
          </Text>
          <TouchableOpacity
            onPress={() => router.push("/")}
            activeOpacity={0.8}
            className="self-stretch py-5 bg-[#785920] rounded-full shadow-md flex-row justify-center items-center gap-2"
          >
            <Ionicons name="bag-outline" color="#fff" size={20} />
            <Text className="text-white text-base font-tajwal">
              ابدأ التسوق الآن
            </Text>
          </TouchableOpacity>
        </View>
      );
    }

    return reviews.map((review) => {
      const product =
        typeof review.product === "object"
          ? (review.product as ReviewProduct)
          : null;

      return (
        <View
          key={review._id}
          className="bg-card mx-4 mb-4 rounded-xl border border-primary-100 shadow-sm p-4"
        >
          <View className="flex-row-reverse items-center gap-3">
            {product?.images?.[0] ? (
              <Image
                source={{ uri: product.images[0] }}
                className="w-16 h-16 rounded-lg"
                resizeMode="cover"
              />
            ) : (
              <View className="w-16 h-16 rounded-lg bg-surface items-center justify-center">
                <Ionicons
                  name="cube-outline"
                  size={24}
                  color={COLORS.inactive}
                />
              </View>
            )}
            <View className="flex-1">
              <Text
                className="text-right font-tajwal text-body font-medium"
                numberOfLines={1}
              >
                {product?.name ?? "منتج محذوف"}
              </Text>
              <View className="mt-1 mb-1">
                <Stars rating={review.rating} />
              </View>
              <Text className="text-right font-body text-xs text-inactive">
                {formatDate(review.createdAt)}
              </Text>
            </View>
            <TouchableOpacity
              activeOpacity={0.7}
              disabled={deleteReview.isLoading}
              onPress={() => handleDelete(review)}
              className="p-2"
            >
              <Ionicons name="trash-outline" size={18} color="#ef4444" />
            </TouchableOpacity>
          </View>

          {review.comment ? (
            <Text className="text-right font-body text-sm text-secondary leading-6 mt-3 border-t border-primary-100 pt-3">
              {review.comment}
            </Text>
          ) : null}

          {product && (
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => router.push(`/product/${product._id}`)}
              className="mt-3 self-stretch py-2 rounded-full border border-primary-200 items-center"
            >
              <Text className="font-tajwal text-xs text-primary">
                عرض المنتج
              </Text>
            </TouchableOpacity>
          )}
        </View>
      );
    });
  };

  return (
    <SafeAreaView className="bg-surface flex-1" edges={["top"]}>
      <Header showBack />
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 32 }}
      >
        <View className="flex-1 justify-center items-center gap-2 mt-8 mb-6">
          <Text className="text-center text-primary text-base font-medium font-tajwal uppercase tracking-wider">
            آراؤك تصنع الفرق
          </Text>
          <Text className="text-center text-body text-4xl leading-[43px] font-bold font-jazera">
            تقييماتي
          </Text>
        </View>
        {renderContent()}
      </ScrollView>
    </SafeAreaView>
  );
};

export default MyReviewsScreen;
