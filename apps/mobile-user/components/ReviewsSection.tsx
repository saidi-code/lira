// components/ReviewsSection.tsx — product reviews (list + add form)
import React, { useState } from "react";
import {
  ActivityIndicator,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "../constants/index";
import { formatDate } from "../constants/utility";
import { useProductReviews, useSubmitReview } from "../hooks/useReviews";
import { BackendReview } from "../config/reviewApi";

// Small read-only star row
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

const ReviewCard = ({ review }: { review: BackendReview }) => {
  const user =
    typeof review.user === "object" ? review.user : { _id: review.user };
  const name = user?.name ?? "عميل";

  return (
    <View className="border-b border-primary-100 py-4">
      <View className="flex-row-reverse justify-between items-center">
        <View className="flex-row-reverse items-center gap-2">
          <View className="h-8 w-8 rounded-full bg-surface items-center justify-center">
            <Ionicons name="person" size={16} color={COLORS.inactive} />
          </View>
          <Text className="font-tajwal text-sm text-body font-medium">{name}</Text>
        </View>
        <Text className="font-body text-xs text-inactive">
          {formatDate(review.createdAt)}
        </Text>
      </View>
      <View className="mt-2 mb-1">
        <Stars rating={review.rating} />
      </View>
      {review.comment ? (
        <Text className="text-right font-body text-sm text-secondary leading-6 mt-1">
          {review.comment}
        </Text>
      ) : null}
    </View>
  );
};

const ReviewsSection = ({ productId }: { productId: string }) => {
  const { data, isLoading } = useProductReviews(productId);
  const submitReview = useSubmitReview();

  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");

  const reviews = data?.data ?? [];
  const averageRating = data?.averageRating ?? 0;
  const count = data?.count ?? 0;

  const handleSubmit = () => {
    if (!comment.trim()) return;
    submitReview.mutate(
      { productId, input: { rating, comment: comment.trim() } },
      {
        onSuccess: () => setComment(""),
      }
    );
  };

  return (
    <View className="px-4 mt-8">
      {/* Header */}
      <View className="flex-row-reverse justify-between items-center mb-3">
        <Text className="text-right text-body text-2xl font-tajwal font-medium">
          التقييمات
        </Text>
        {count > 0 && (
          <View className="flex-row-reverse items-center gap-1.5 bg-accent/10 px-3 py-1 rounded-full">
            <Ionicons name="star" size={14} color="#B89354" />
            <Text className="font-tajwal text-xs text-accent font-bold">
              {averageRating.toFixed(1)} ({count})
            </Text>
          </View>
        )}
      </View>

      {/* Add review */}
      <View className="bg-card rounded-xl border border-primary-100  p-4 mb-4">
        <Text className="text-right font-tajwal text-sm text-body font-medium mb-3">
          أضف تقييمك
        </Text>
        <View className="flex-row-reverse justify-end gap-2 mb-3">
          {[1, 2, 3, 4, 5].map((n) => (
            <TouchableOpacity
              key={n}
              activeOpacity={0.7}
              onPress={() => setRating(n)}
              className="p-1"
            >
              <Ionicons
                name={n <= rating ? "star" : "star-outline"}
                size={28}
                color="#B89354"
              />
            </TouchableOpacity>
          ))}
        </View>
        <TextInput
          className="border border-primary-200 rounded-lg p-3 text-right font-body text-sm mb-3"
          placeholder="شارك تجربتك مع هذا المنتج..."
          placeholderTextColor={COLORS.inactive}
          value={comment}
          onChangeText={setComment}
          multiline
          textAlignVertical="top"
          style={{ minHeight: 72 }}
        />
        <TouchableOpacity
          activeOpacity={0.85}
          disabled={submitReview.isLoading || !comment.trim()}
          onPress={handleSubmit}
          className="py-3 rounded-full items-center flex-row justify-center gap-2 bg-[#785920]"
          style={{ opacity: submitReview.isLoading || !comment.trim() ? 0.6 : 1 }}
        >
          {submitReview.isLoading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Ionicons name="send-outline" size={16} color="#fff" />
              <Text className="text-white font-tajwal text-sm">إرسال التقييم</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* List */}
      {isLoading ? (
        <View className="py-6 items-center">
          <ActivityIndicator size="small" color={COLORS.primary} />
        </View>
      ) : reviews.length === 0 ? (
        <View className="bg-card rounded-xl border border-primary border-dashed p-6 items-center">
          <Ionicons name="chatbubble-ellipses-outline" size={28} color={COLORS.inactive} />
          <Text className="font-tajwal text-sm text-secondary mt-2 text-center">
            لا توجد تقييمات بعد — كن أول من يقيّم هذا المنتج
          </Text>
        </View>
      ) : (
        <View className="bg-card rounded-xl border border-primary-100  px-4">
          {reviews.map((review) => (
            <ReviewCard key={review._id} review={review} />
          ))}
        </View>
      )}
    </View>
  );
};

export default ReviewsSection;