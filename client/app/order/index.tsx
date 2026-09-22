import { View, Text } from 'react-native'
import React from 'react'
import {useOrder} from '@/hooks/useOrder'
const Index = () => {
 const {orders}=useOrder()
    console.log(orders)

  return (
    <View>
      <Text>order index page </Text>
    </View>
  )
}

export default Index