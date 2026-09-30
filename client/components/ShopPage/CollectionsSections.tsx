import React, { memo } from "react";
import { StyleSheet, View, Text } from "react-native";
import { Image } from "expo-image";
import ProductCard from "../../components/ProductCard";
import { IProduct } from "../../constants/types";
import CollectionsSkeleton from "./CollectionsSkeleton";

interface CollectionsSectionsProps {
  collections: any[];
  isLoading: boolean;
}

const CollectionsSections = memo(({ collections, isLoading }: CollectionsSectionsProps) => {
  if (isLoading) {
    return <CollectionsSkeleton />;
  }

  if (!collections || collections.length === 0) {
    return null;
  }

  return (
    <View className="py-12 px-3">
      <View className="items-center mb-8">
        <Text className="text-center text-body text-[32px] font-bold font-jazera leading-[38.4px]">
          مجموعات مختارة
        </Text>
      </View>

      {collections.map((item, index) => {
        const products = Array.isArray(item.products)
          ? (item.products as IProduct[]).slice(0, 4)
          : [];

        return (
          <View key={item._id || `col-${index}`} className="mb-8">
            <View className="relative bg-card/0 rounded-3xl shadow-[0px_2px_4px_-2px_rgba(0,0,0,0.10)] overflow-hidden mb-4">
              <Image
                source={{ uri: item.banner }}
                contentFit="cover"
                style={{ width: "100%", height: 192 }}
                cachePolicy="memory-disk"
                transition={200}
              />
              <View className="absolute inset-0 p-8 bg-scrim/20 justify-end" />
            </View>

            <View style={styles.grid}>
              {products.map((product, pIdx) => (
                <View key={product._id || `prod-${pIdx}`} style={styles.gridItem}>
                  <ProductCard product={product} />
                </View>
              ))}
            </View>
          </View>
        );
      })}
    </View>
  );
});

CollectionsSections.displayName = "CollectionsSections";

export default CollectionsSections;

const styles = StyleSheet.create({
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    paddingHorizontal: 4,
  },
  gridItem: {
    width: "48%",
    marginBottom: 16,
  },
});
