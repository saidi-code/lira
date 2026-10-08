import { View, StyleSheet } from "react-native";

const SkeletonAddressCard = () => {
  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <View style={styles.titleLine} />
        <View style={styles.badgeLine} />
      </View>
      <View style={styles.textLine} />
      <View style={[styles.textLine, { width: "60%" }]} />
    </View>
  );
};

export default SkeletonAddressCard;

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  row: {
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  titleLine: {
    height: 14,
    width: "35%",
    borderRadius: 6,
    backgroundColor: "#e5e7eb",
  },
  badgeLine: {
    height: 14,
    width: 50,
    borderRadius: 6,
    backgroundColor: "#e5e7eb",
  },
  textLine: {
    height: 12,
    width: "80%",
    borderRadius: 6,
    backgroundColor: "#e5e7eb",
    marginTop: 8,
  },
});