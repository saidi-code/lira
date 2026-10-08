// components/skeletons/SkeletonCheckoutTotals.tsx (animated)
import { useEffect, useMemo } from "react";
import { View, StyleSheet } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from "react-native-reanimated";
import { useAppColors, type Colors } from "../constants/utility";

const AnimatedBox = ({ style }: { style: any }) => {
  const shimmer = useSharedValue(0.4);

  useEffect(() => {
    shimmer.value = withRepeat(
      withTiming(1, { duration: 900, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
  }, [shimmer]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: shimmer.value,
  }));

  return <Animated.View style={[style, animatedStyle]} />;
};

const SkeletonCheckoutTotals = () => {
  const colors = useAppColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  return (
    <View style={styles.box}>
      <View style={styles.row}>
        <AnimatedBox style={[styles.line, { width: "30%" }]} />
        <AnimatedBox style={[styles.line, { width: 60 }]} />
      </View>
      <View style={styles.row}>
        <AnimatedBox style={[styles.line, { width: "25%" }]} />
        <AnimatedBox style={[styles.line, { width: 50 }]} />
      </View>
      <View style={styles.row}>
        <AnimatedBox style={[styles.line, { width: "20%" }]} />
        <AnimatedBox style={[styles.line, { width: 40 }]} />
      </View>

      <View style={styles.divider} />

      <View style={styles.row}>
        <AnimatedBox style={[styles.lineStrong, { width: "25%" }]} />
        <AnimatedBox style={[styles.lineStrong, { width: 80 }]} />
      </View>
    </View>
  );
};

export default SkeletonCheckoutTotals;

const createStyles = (colors: Colors) =>
  StyleSheet.create({
  box: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 14,
  },
  row: {
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  line: {
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.skeleton,
  },
  lineStrong: {
    height: 16,
    borderRadius: 6,
    backgroundColor: colors.skeleton,
  },
  divider: {
    height: 1,
    backgroundColor: colors.surface,
    marginVertical: 8,
  },
  });