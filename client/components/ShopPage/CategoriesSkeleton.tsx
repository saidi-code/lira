import React from 'react';
import { View, Text, FlatList } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';

// Number of placeholder items to show
const SKELETON_COUNT = 6;

// Dummy data for FlatList keys
const skeletonData = Array.from({ length: SKELETON_COUNT }, (_, i) => ({ id: i }));

const CategoriesSkeleton = () => {
  // Shimmer animation value (0 → 1 → 0 loop)
  const shimmer = useSharedValue(0);

  React.useEffect(() => {
    shimmer.value = withRepeat(
      withTiming(1, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
      -1, // infinite
      true // reverse
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: 0.4 + 0.6 * shimmer.value, // between 0.4 and 1.0
  }));

  const renderSkeletonItem = () => (
    <View className="mx-4 items-center justify-center">
      {/* Circle placeholder */}
      <Animated.View
        style={[animatedStyle]}
        className="w-[80px] h-[80px] rounded-full bg-gray-200 dark:bg-gray-700 mb-2"
      />
      {/* Text placeholder */}
      <Animated.View
        style={[animatedStyle]}
        className="w-14 h-4 bg-gray-200 dark:bg-gray-700 rounded"
      />
    </View>
  );

  return (
    <View className="py-6">
      {/* Header row */}
      <View className="flex-row items-center justify-between px-4 mb-6">
        <Animated.View
          style={[animatedStyle]}
          className="h-5 w-20 bg-gray-200 dark:bg-gray-700 rounded"
        />
        <Animated.View
          style={[animatedStyle]}
          className="h-7 w-32 bg-gray-200 dark:bg-gray-700 rounded"
        />
      </View>

      {/* Horizontal list */}
      <FlatList
        data={skeletonData}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderSkeletonItem}
        contentContainerStyle={{ paddingHorizontal: 4 }}
      />
    </View>
  );
};

export default CategoriesSkeleton;