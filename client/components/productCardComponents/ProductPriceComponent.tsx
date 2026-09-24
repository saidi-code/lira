import { Text } from 'react-native'
import React from 'react'
import { CURRENCY } from '../../constants'
interface ProductPriceProps {
  productPrice?: number; // Rendue optionnelle car vous fournissez une valeur par défaut
}
const ProductPriceComponent = ({ productPrice }: ProductPriceProps) => {
  return (
        <Text style = {{ 
    fontSize: 13,
    fontWeight: '700',
    color: '#B89354',
    textAlign: 'right',
    paddingBottom: 12,
    paddingTop: 4,
    fontFamily: 'Tajawal-Medium',
    }}>
                {productPrice} {CURRENCY}
              </Text>
  )
}

export default ProductPriceComponent