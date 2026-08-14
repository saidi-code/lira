import React from 'react';
import { View, Text } from 'react-native';

interface ProductCategoryProps {
  productCategory?: string; // Rendue optionnelle car vous fournissez une valeur par défaut
}

const ProductCategoryComponent = ({ productCategory }: ProductCategoryProps) => {
  return (
    <View className="pt-3 items-end">
     
      <Text className="text-right text-[#b89354] text-xs font-bold font-tajawal tracking-wide">
        {productCategory?.trim() || "إكسسوارات"} 
        </Text>
    </View>
  );
};

export default ProductCategoryComponent;