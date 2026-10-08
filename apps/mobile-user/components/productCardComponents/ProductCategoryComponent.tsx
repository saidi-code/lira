import React from 'react';
import { View, Text } from 'react-native';

interface ProductCategoryProps {
  productCategory?: string; // Rendue optionnelle car vous fournissez une valeur par défaut
}

const ProductCategoryComponent = ({ productCategory }: ProductCategoryProps) => {
  return (
    <View >
     
      <Text style = {{ 
    fontSize: 12, 
    textAlign: 'right',
   fontWeight: '500',
    color: '#B89354',
    // paddingTop: 3,
    fontFamily: 'Tajawal-Medium'
    }}> 
        {productCategory?.trim() || "إكسسوارات"} 
        </Text>
    </View>
  );
};

export default ProductCategoryComponent;