import React from 'react';
import { View, FlatList, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48) / 2; // approximate (accounting for padding)

// Number of skeleton collections to show
const SKELETON_COUNT = 2;
// Number of products per collection
const PRODUCTS_PER_COLLECTION = 4;

// Create dummy data for the skeleton
const skeletonCollections = Array.from({ length: SKELETON_COUNT }, (_, i) => ({
  id: i,
  products: Array.from({ length: PRODUCTS_PER_COLLECTION }, (_, j) => ({ id: j })),
}));

const CollectionsSkeleton = () => {
  // Shimmer value (0 → 1 → 0)
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

  // Renders a single product card placeholder
  const renderProductSkeleton = () => (
    <View style={styles.productCard}>
      <Animated.View style={[styles.productImage, animatedStyle]} />
      <Animated.View style={[styles.productTitle, animatedStyle]} />
      <Animated.View style={[styles.productPrice, animatedStyle]} />
    </View>
  );

  // Renders one collection skeleton (banner + product grid)
  const renderCollectionSkeleton = () => (
    <View style={styles.collectionContainer}>
      {/* Banner placeholder */}
      <Animated.View style={[styles.banner, animatedStyle]} />
      {/* Product grid - 2 columns */}
      <View style={styles.gridContainer}>
        {Array.from({ length: PRODUCTS_PER_COLLECTION }).map((_, idx) => (
          <View key={idx} style={styles.productWrapper}>
            {renderProductSkeleton()}
          </View>
        ))}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Animated.View style={[styles.headerTitle, animatedStyle]} />
      </View>

      {/* List of collection skeletons */}
      <FlatList
        data={skeletonCollections}
        keyExtractor={(item) => item.id.toString()}
        scrollEnabled={false}
        renderItem={() => renderCollectionSkeleton()}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 48,
    paddingHorizontal: 12,
    backgroundColor: '#FFF8F5', // match your background
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  headerTitle: {
    width: 200,
    height: 38,
    backgroundColor: '#E0D6CE',
    borderRadius: 8,
  },
  listContent: {
    paddingBottom: 16,
  },
  collectionContainer: {
    marginBottom: 32,
  },
  banner: {
    width: '100%',
    height: 192,
    backgroundColor: '#E0D6CE',
    borderRadius: 24,
    marginBottom: 16,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
  },
  productWrapper: {
    width: CARD_WIDTH,
    marginBottom: 16,
  },
  productCard: {
    backgroundColor: '#F5EDE8',
    borderRadius: 16,
    padding: 12,
    alignItems: 'center',
  },
  productImage: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: '#D8CFC7',
    borderRadius: 12,
    marginBottom: 8,
  },
  productTitle: {
    width: '80%',
    height: 14,
    backgroundColor: '#D8CFC7',
    borderRadius: 4,
    marginBottom: 6,
  },
  productPrice: {
    width: '60%',
    height: 14,
    backgroundColor: '#D8CFC7',
    borderRadius: 4,
  },
});

export default CollectionsSkeleton;