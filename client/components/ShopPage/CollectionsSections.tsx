
import React from 'react'
import { FlatList, Image, StyleSheet ,View,Text} from 'react-native';
import ProductCard from "../../components/ProductCard"
import { IProduct } from '../../constants/types';
const CollectionsSections = ({collections}:{collections:any[]}) => {
  return (
    <View className="py-12 px-3">
          <View className="items-center mb-8">
            <Text className="text-center text-[#201b16] text-[32px] font-bold font-jazera leading-[38.4px]">
              مجموعات مختارة
            </Text>
          </View>

          <FlatList
            data={collections} // ← consider using `collections` if it has the same structure
            keyExtractor={(item, index) => String(item._id ?? index)}
            scrollEnabled={false}
            renderItem={({ item }) => (
              <View className="mb-8">
                <View className="relative bg-white/0 rounded-3xl shadow-[0px_2px_4px_-2px_rgba(0,0,0,0.10)] overflow-hidden mb-4">
                  <Image
                    source={{ uri: item.banner }}
                    resizeMode="cover"
                    className="w-full h-[192px]"
                    style={{ height: 192.38 }}
                  />
                  <View className="absolute inset-0 p-8 bg-black/20 justify-end" />
                </View>
                <View className="flex-1">
                  <FlatList
                    data={(item.products as IProduct[]).slice(0, 4)}
                    renderItem={({ item: product }) => (
                      <ProductCard product={product as IProduct} />
                    )}
                    keyExtractor={(product, index) => String(product._id ?? index)}
                    numColumns={2}
                    scrollEnabled={false}
                    contentContainerStyle={styles.listContainer}
                    columnWrapperStyle={styles.columnWrapper}
                  />
                </View>
              </View>
            )}
          />
        </View>
  )
}

export default CollectionsSections

const styles = StyleSheet.create({
  // ... keep your existing styles (unchanged) ...
  listContainer: {
    paddingHorizontal: 12,
    paddingVertical: 16,
    backgroundColor: '#FFF8F5',
  },
  columnWrapper: {
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  // (Include the rest of your styles as they were)
});