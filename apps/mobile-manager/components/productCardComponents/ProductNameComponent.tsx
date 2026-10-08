import { Text, View } from 'react-native'
import { COLORS } from "../../constants/index";
import React from 'react'

interface ProductNameProps {
  productName?: string; // Rendue optionnelle car vous fournissez une valeur par défaut
}
const ProductNameComponent = ({ productName }: ProductNameProps) => {
  return (
    
            <View>
              <Text style = {{ 
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.body,
    textAlign: 'right',
    // paddingHorizontal: 8,
    // paddingTop: ,
    fontFamily: 'Tajawal-Medium'
    }}
    >
                {productName?.trim() || "اسم المنتج"}
              </Text>
            </View>
  )
}

export default ProductNameComponent

