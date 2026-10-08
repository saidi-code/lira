import { Text } from 'react-native'
import React from 'react'
import { usePrice } from '../../hooks/usePrice'
interface ProductPriceProps {
  productPrice?: number; // Rendue optionnelle car vous fournissez une valeur par défaut
}
const ProductPriceComponent = ({ productPrice }: ProductPriceProps) => {
  const price = usePrice();
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
                {price(productPrice ?? 0)}
              </Text>
  )
}

export default ProductPriceComponent