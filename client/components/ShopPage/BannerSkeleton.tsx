import React from 'react';
import { View, FlatList, useWindowDimensions } from 'react-native';

interface BannerSkeletonProps {
  count?: number; // number of placeholder items
}

const BannerSkeleton: React.FC<BannerSkeletonProps> = ({ count = 4 }) => {
  const { width } = useWindowDimensions();
  const placeholderData = Array.from({ length: count }, (_, i) => ({ id: i }));

  const renderPlaceholder = () => (
    <View
      className="flex-1 relative overflow-hidden"
      style={{ width }}
    >
      {/* Image placeholder */}
      <View
        style={{ width: "100%", height: 196 }}
        className="bg-gray-200 rounded-lg"
      />
      {/* Overlay content placeholders */}
      <View className="absolute bottom-4 right-4 z-10 items-end">
        <View className="w-32 h-6 bg-gray-300 rounded mb-1" />
        <View className="w-24 h-4 bg-gray-300 rounded mb-2" />
        <View className="w-20 h-10 bg-gray-300 rounded-lg" />
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
        scrollEnabled={false} // disable interaction while loading
       
      />
      {/* Pagination dots skeleton – first one active */}
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