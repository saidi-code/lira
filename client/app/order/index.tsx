import { View, Text } from 'react-native'
import React,{useEffect} from 'react'
import {useOrder} from '@/hooks/useOrder'
const Index = () => {
    const {orders}= useOrder()
   useEffect(()=>{
    console.log(orders)
   },[orders])
  return (
    <View>
      <Text>order index page </Text>
    </View>
  )
}

export default Index