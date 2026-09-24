import React from 'react';
import { View, FlatList, useWindowDimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';

interface BannerSkeletonProps {
  count?: number; // number of placeholder items
}

const BannerSkeleton: React.FC<BannerSkeletonProps> = ({ count = 4 }) => {
  const { width } = useWindowDimensions();
  const placeholderData = Array.from({ length: count }, (_, i) => ({ id: i }));

  // Shimmer animation (0 → 1 → 0)
  const shimmer = useSharedValue(0);

  React.useEffect(() => {
    shimmer.value = withRepeat(
      withTiming(1, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
  }, [shimmer]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: 0.4 + 0.6 * shimmer.value,
  }));

  const renderPlaceholder = () => (
    <View
      className="flex-1 relative overflow-hidden"
      style={{ width }}
    >
      {/* Image placeholder with shimmer */}
      <Animated.View
        style={[
          animatedStyle,
          { width: '100%', height: 196 },
        ]}
        className="bg-gray-200 rounded-lg"
      />
      {/* Overlay content placeholders with shimmer */}
      <View className="absolute bottom-4 right-4 z-10 items-end">
        <Animated.View
          style={[animatedStyle, { width: 120, height: 24 }]}
          className="bg-gray-300 rounded mb-1"
        />
        <Animated.View
          style={[animatedStyle, { width: 96, height: 16 }]}
          className="bg-gray-300 rounded mb-2"
        />
        <Animated.View
          style={[animatedStyle, { width: 80, height: 40 }]}
          className="bg-gray-300 rounded-lg"
        />
      </View>
      <View className="absolute inset-0 bg-black/10" />
    </View>
  );

  return (
    <View className="mb-6">
      <FlatList
        data={placeholderData}
        keyExtractor={(item) => String(item.id)}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        snapToInterval={width}
        decelerationRate="fast"
        renderItem={renderPlaceholder}
        scrollEnabled={false}
      />
      {/* Pagination dots skeleton */}
      <View className="flex-row justify-center -mt-4 gap-2">
        {placeholderData.map((_, index) => (
          <View
            key={index}
            className={`h-2 rounded-full ${
              index === 0 ? 'w-6 bg-primary' : 'w-2 bg-gray-300'
            }`}
          />
        ))}
      </View>
    </View>
  );
};

export default BannerSkeleton;