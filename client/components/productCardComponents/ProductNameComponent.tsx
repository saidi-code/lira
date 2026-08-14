import { StyleSheet, Text, View } from 'react-native'
import React from 'react'

interface ProductNameProps {
  productName?: string; // Rendue optionnelle car vous fournissez une valeur par défaut
}
const ProductNameComponent = ({ productName }: ProductNameProps) => {
  return (
    
            <View className="items-end">
              <Text className="text-right text-[#201b16] text-base font-medium font-tajawal line-clamp-1">
                {productName?.trim() || "اسم المنتج"}
              </Text>
            </View>
  )
}

export default ProductNameComponent

