import { View, StyleSheet } from "react-native";

const SkeletonOrderSummary = () => {
  return (
    <View style={styles.box}>
      {[0, 1, 2].map((i) => (
        <View key={i} style={styles.row}>
          <View style={styles.line} />
          <View style={[styles.line, { width: 60 }]} />
        </View>
      ))}

      <View style={styles.divider} />

      {[0, 1, 2].map((i) => (
        <View key={i} style={styles.row}>
          <View style={styles.line} />
          <View style={[styles.line, { width: 60 }]} />
        </View>
      ))}

      <View style={styles.divider} />

      <View style={styles.row}>
        <View style={[styles.line, { height: 16, width: "25%" }]} />
        <View style={[styles.line, { height: 16, width: 80 }]} />
      </View>
    </View>
  );
};

export default SkeletonOrderSummary;

const styles = StyleSheet.create({
  box: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 14,
  },
  row: {
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  line: {
    height: 12,
    width: 120,
    borderRadius: 6,
    backgroundColor: "#e5e7eb",
  },
  divider: {
    height: 1,
    backgroundColor: "#f0f0f0",
    marginVertical: 8,
  },
});