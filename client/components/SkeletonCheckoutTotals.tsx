// components/skeletons/SkeletonCheckoutTotals.tsx (animated)
import { useEffect } from "react";
import { View, StyleSheet } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from "react-native-reanimated";
import { COLORS } from "../constants/index";

const AnimatedBox = ({ style }: { style: any }) => {
  const shimmer = useSharedValue(0.4);

  useEffect(() => {
    shimmer.value = withRepeat(
      withTiming(1, { duration: 900, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: shimmer.value,
  }));

  return <Animated.View style={[style, animatedStyle]} />;
};

const SkeletonCheckoutTotals = () => {
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

const styles = StyleSheet.create({
  box: {
    backgroundColor: COLORS.white,
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
    backgroundColor: COLORS.skeleton ?? "#e5e7eb",
  },
  lineStrong: {
    height: 16,
    borderRadius: 6,
    backgroundColor: COLORS.skeleton ?? "#e5e7eb",
  },
  divider: {
    height: 1,
    backgroundColor: "#f0f0f0",
    marginVertical: 8,
  },
});