import { View, Text } from 'react-native'
import React from 'react'
import { CURRENCY } from '../../constants'
interface ProductPriceProps {
  productPrice?: number; // Rendue optionnelle car vous fournissez une valeur par défaut
}
const ProductPriceComponent = ({ productPrice }: ProductPriceProps) => {
  return (
        <Text className="text-right text-[#b89354] text-base font-bold font-work-sans">
                {productPrice} {CURRENCY}
              </Text>
  )
}

export default ProductPriceComponent