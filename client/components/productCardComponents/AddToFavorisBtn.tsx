import { View, Text, TouchableOpacity } from 'react-native'
import { useFavoris } from '../../hooks/useFavoris'
import React from 'react'
import { Ionicons } from "@expo/vector-icons";
const AddToFavorisBtn  =({product}:any) => {
      const { isLiked, toggleLike } = useFavoris();
  return (
   <TouchableOpacity
            onPress={(e) => {
              e.stopPropagation();
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