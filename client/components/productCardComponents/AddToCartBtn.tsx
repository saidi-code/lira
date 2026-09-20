import { StyleSheet, Text, View ,TouchableOpacity} from 'react-native'
import React, { useState } from 'react'
import { Ionicons } from '@expo/vector-icons';
import { useCart } from '../../hooks/useCart';

interface AddToCartBtnProps {
  product: any;
  handleOpenVariableModal: () => void;
}

const AddToCartBtn = ({ product, handleOpenVariableModal }: AddToCartBtnProps) => {
  const { addToCart } = useCart();

  return (
    <TouchableOpacity
      onPress={() => {
        if (product.type !== "variable") {
          // Simple product: add directly
          addToCart(product, null, null);
          return;
        }
        handleOpenVariableModal();
      }}
      className="w-10 h-10 bg-[#b89354] rounded-full justify-center items-center"
    >
            <Ionicons name="add-outline" size={18} color={"#ffffff"} />
          </TouchableOpacity>

  )
}

export default AddToCartBtn

