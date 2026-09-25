import React from 'react';
import { View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';

const NewsLetterSkeleton = () => {
  // Shimmer animation value (0 → 1 → 0)
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

  return (
    <View className="px-2 mx-4 pt-[47px] pb-12 bg-[#b89354]/10 rounded-[40px] items-start gap-4 mb-12">
      {/* Title */}
      <View className="self-stretch items-center">
        <Animated.View
          style={[animatedStyle, { width: '60%', height: 32 }]}
          className="bg-gray-200 rounded-lg"
        />
      </View>

      {/* Description */}
      <View className="flex items-center justify-center mb-4">
        <View className="mx-3">
          <Animated.View
            style={[animatedStyle, { width: '90%', height: 20, marginBottom: 8 }]}
            className="bg-gray-200 rounded"
          />
          <Animated.View
            style={[animatedStyle, { width: '70%', height: 20 }]}
            className="bg-gray-200 rounded self-center"
          />
        </View>
      </View>

      {/* Input + Button */}
      <View className="w-full max-w-[448px] relative">
        <View className="relative w-full bg-card rounded-full shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)]">
          {/* Input placeholder (full width) */}
          <Animated.View
            style={[animatedStyle, { minHeight: 66 }]}
            className="w-full py-[23px] pl-[104px] pr-8 rounded-full bg-subtle"
          />
        </View>
        {/* Button placeholder (overlaid) */}
        <Animated.View
          style={[
            animatedStyle,
            {
              position: 'absolute',
              left: 8,
              top: '50%',
              transform: [{ translateY: -33 }], // half of button height (66/2)
              width: 80,
              height: 48,
            },
          ]}
          className="bg-skeleton rounded-full"
        />
      </View>
    </View>
  );
};

export default NewsLetterSkeleton;