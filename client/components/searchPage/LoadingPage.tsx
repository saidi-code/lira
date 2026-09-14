import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');
const cardWidth = (width - 24 - 12) / 2; // 2 columns with spacing

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

  return (
    <Animated.View style={[styles.card, { opacity }]}>
      <View style={styles.image} />
      <View style={styles.textLine} />
      <View style={[styles.textLine, { width: '60%' }]} />
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  card: {
    flex: 1,
    marginHorizontal: 6,
    backgroundColor: '#f0f0f0',
    borderRadius: 16,
    overflow: 'hidden',
    padding: 8,
    height: cardWidth + 70, // approximate height
  },
  image: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: '#e0e0e0',
    borderRadius: 8,
  },
  textLine: {
    height: 14,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    marginTop: 8,
    width: '80%',
    alignSelf: 'flex-start',
  },
});

export default LoadingPage;