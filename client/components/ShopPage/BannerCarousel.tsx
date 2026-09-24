import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  useWindowDimensions,
} from 'react-native';
import BannerSkeleton from './BannerSkeleton'; // your skeleton component (adjust path)
interface Collection {
  _id: string;
  banner: string;
  title: string;
  subtitle: string;
  cta: string;
}

interface BannerCarouselProps {
  collections: Collection[];
  isLoading: boolean;
}

const BannerCarousel: React.FC<BannerCarouselProps> = ({collections,isLoading}) => {
  const { width } = useWindowDimensions();
  const [activeBannerIndex, setActiveBannerIndex] = useState(0);
  
  // Reset active index when collections change (e.g., new data)
  useEffect(() => {
    setActiveBannerIndex(0);
  }, [collections]);
  // Stable callback for scroll end
  const handleScrollEnd = useCallback(
    (e: any) => {
      const index = Math.round(e.nativeEvent.contentOffset.x / width);
      if (index !== activeBannerIndex) {
        setActiveBannerIndex(index);
      }
    },
    [width, activeBannerIndex]
  );

  // Stable renderItem
  const renderItem = useCallback(
    ({ item }: { item: Collection }) => (
      <View
        className="flex-1 relative overflow-hidden"
        style={{ width }}
      >
        <Image
          source={{ uri: item.banner }}
          style={{ width: "100%", height: 196 }}
          resizeMode="cover"
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
    ),
    [width]
  );

  // If loading, show skeleton with same number of items as collections (or default 3)
  if (isLoading) {
    return <BannerSkeleton count={collections.length || 4} />;
  }

  // If no data, show a placeholder (optional)
  if (collections.length === 0) {
    return (
      <View className="mb-6 items-center justify-center h-48 bg-gray-100 rounded-lg">
        <Text className="text-gray-500">No banners available</Text>
      </View>
    );
  }

  return (
    <View className="mb-6">
      <FlatList
        data={collections}
        keyExtractor={(item, index) => String(item._id ?? index)}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        snapToInterval={width}
        decelerationRate="fast"
        onMomentumScrollEnd={handleScrollEnd}
        renderItem={renderItem}
        // Prevent overscroll on Android
        overScrollMode="never"
        // Optional: keep the active index in sync even after re-renders
        initialScrollIndex={activeBannerIndex}
        getItemLayout={(_, index) => ({
          length: width,
          offset: width * index,
          index,
        })}
      />

      {/* Pagination Dots */}
      <View className="flex-row justify-center -mt-4 gap-2">
        {collections.map((_, index) => (
          <View
            key={index}
            className={`h-2 rounded-full ${
              index === activeBannerIndex
                ? 'w-6 bg-primary'
                : 'w-2 bg-gray-300'
            }`}
          />
        ))}
      </View>
    </View>
  );
};

export default BannerCarousel;