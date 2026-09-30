import { TouchableOpacity } from 'react-native'
import React from 'react'
import { Ionicons } from '@expo/vector-icons';
import { useCart } from '../../hooks/useCart';
import { hapticLight, hapticSuccess } from '../../constants/utility';

interface AddToCartBtnProps {
  product: any;
  handleOpenVariableModal: () => void;
}

const AddToCartBtn = ({ product, handleOpenVariableModal }: AddToCartBtnProps) => {
  const { addToCart } = useCart();
  const isOutOfStock = product.stock === 0;

  return (
    <TouchableOpacity
      onPress={() => {
        if (isOutOfStock) return;
        if (product.type !== "variable") {
          // Simple product: add directly
          addToCart(product, null, null);
          // §3.5 — add-to-bag celebrates with a success haptic.
          hapticSuccess();
          return;
        }
        hapticLight();
        handleOpenVariableModal();
      }}
      disabled={isOutOfStock}
      className="w-10 h-10 rounded-full justify-center items-center"
      style={{ backgroundColor: isOutOfStock ? '#cfcfcf' : '#b89354' }}
    >
            <Ionicons name="add-outline" size={18} color={"#ffffff"} />
          </TouchableOpacity>

  )
}

export default AddToCartBtn

