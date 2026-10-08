import { TouchableOpacity } from 'react-native'
import { useFavoris } from '../../hooks/useFavoris'
import React from 'react'
import { Ionicons } from "@expo/vector-icons";
import { hapticLight } from '../../constants/utility';
const AddToFavorisBtn  =({product}:any) => {
      const { isLiked, toggleLike } = useFavoris();
  return (
   <TouchableOpacity
            onPress={(e) => {
              e.stopPropagation();
              // §3.5 — wishlist toggle is a light impact.
              hapticLight();
              toggleLike(product as any);
            }}
            className="absolute left-3 top-3"
          >
            {isLiked((product as any)._id) ? (
              <Ionicons name="heart-sharp" size={20} color={"#b89354"} />
            ) : (
              <Ionicons name="heart-outline" size={20} color={"#b89354"} />
            )}
          </TouchableOpacity>
  )
}

export default AddToFavorisBtn