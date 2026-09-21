import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Header from '../Header';
import { SafeAreaView } from "react-native-safe-area-context";

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48) / 2; // approximate (accounting for padding)

// Skeleton colors
const SKELETON_BASE = '#e5e5e5';
const COLORS = {
  primary: '#a8a29e', // muted for skeleton look
};

const LoadingPage = () => {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.7,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [opacity]);

  // Create an array of skeleton cards
  const skeletonCards = Array.from({ length: 6 }, (_, index) => (
    <Animated.View
      key={index}
      style={[styles.card, { opacity }]}
    >
      <View style={styles.imagePlaceholder} />
      <View style={styles.textPlaceholder} />
      <View style={[styles.textPlaceholder, styles.textPlaceholderShort]} />
    </Animated.View>
  ));

  return (
    <SafeAreaView className="bg-surface shadow flex-1" edges={["top"]}>
      <Header showBack />
    <View style={styles.container}>
      {/* Search bar skeleton */}
      <Animated.View style={[styles.searchContainer, { opacity }]}>
        {/* Filter button (right side, RTL) */}
        <View style={styles.searchSideButton}>
          <Ionicons name="filter-sharp" size={20} color={COLORS.primary} />
        </View>

        {/* Text placeholder */}
        <View style={styles.searchInputPlaceholder}>
          <View style={styles.searchTextBar} />
        </View>

        {/* Search button (left side) */}
        <View style={[styles.searchSideButton, styles.searchSideButtonLeft]}>
          <Ionicons name="search-outline" size={20} color={COLORS.primary} />
        </View>
      </Animated.View>

      {/* Cards grid */}
      <View style={styles.grid}>
        {skeletonCards}
      </View>
    </View>
    </SafeAreaView>

  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: 8,
  },
  // --- Search bar skeleton ---
  searchContainer: {
    marginHorizontal: 16,
    marginVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  searchSideButton: {
    padding: 16,
    paddingRight: 12,
    borderRightWidth: 1,
    borderRightColor: '#f5f5f4',
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchSideButtonLeft: {
    borderRightWidth: 0,
    borderLeftWidth: 1,
    borderLeftColor: '#f5f5f4',
    paddingRight: 16,
    paddingLeft: 12,
  },
  searchInputPlaceholder: {
    flex: 1,
    paddingVertical: 18,
    paddingHorizontal: 12,
    alignItems: 'flex-end', // matches text-right in RTL
  },
  searchTextBar: {
    height: 14,
    width: '65%',
    backgroundColor: SKELETON_BASE,
    borderRadius: 4,
  },
  // --- Cards grid ---
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  card: {
    width: CARD_WIDTH,
    backgroundColor: '#f0f0f0',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  imagePlaceholder: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: SKELETON_BASE,
    borderRadius: 8,
    marginBottom: 12,
  },
  textPlaceholder: {
    height: 12,
    backgroundColor: SKELETON_BASE,
    borderRadius: 4,
    marginBottom: 8,
  },
  textPlaceholderShort: {
    width: '60%',
  },
});

export default LoadingPage;