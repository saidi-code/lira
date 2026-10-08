import { View, Text,FlatList, TouchableOpacity,Image  } from 'react-native'
import React from 'react'
import { Ionicons, MaterialCommunityIcons, Octicons } from "@expo/vector-icons";
import { COLORS } from '../../constants/index';
import { pushTo } from '../../constants/utility';
import { useRouter } from "expo-router";
import CategoriesSkeleton from './CategoriesSkeleton';
  const getIcon = (title: string) => {
    switch (title) {
      case "مجوهرات":
        return <Ionicons name="diamond-outline" size={24} color={COLORS.primary} />;
      case "ساعات":
        return <MaterialCommunityIcons name="watch" size={24} color={COLORS.primary} />;
      case "عطور":
        return (
          <Image
            resizeMode="center"
            style={{ height: 28, width: 28 }}
            source={require("../../assets/images/icons/spray_4648182.png")}
          />
        );
      case "ملابس":
        return (
          <Image
            resizeMode="center"
            style={{ height: 24, width: 24 }}
            source={require("../../assets/images/icons/dress1.png")}
          />
        );
      case "باخور":
        return <Octicons name="flame" size={24} color={COLORS.primary} />;
      case "حقائب يد":
        return (
          <Image
            resizeMode="center"
            style={{ height: 24, width: 24 }}
            source={require("../../assets/images/icons/hand_bag.png")}
          />
        );
      case "إكسسوارات":
        return (
          <Image
            resizeMode="center"
            style={{ height: 24, width: 24 }}
            source={require("../../assets/images/icons/accessoires.png")}
          />
        );
      case "مكياج":
        return (
          <Image
            resizeMode="center"
            style={{ height: 24, width: 24 }}
            source={require("../../assets/images/icons/makeup.png")}
          />
        );
      case "أحذية":
        return <MaterialCommunityIcons name="shoe-heel" size={32} color={COLORS.primary} />;
      default:
        return <Ionicons name="grid-outline" size={24} color={COLORS.primary} />;
    }
  };
const CategoriesSections = ({categories,isLoading}:{categories:any[],isLoading:boolean}) => {
  const router = useRouter()


       return isLoading ? (
  <CategoriesSkeleton />
) : (
 <View className="py-6">
             <View className="flex-row items-center justify-between px-4 mb-6">
               <Text className="font-tajwal text-sm text-primary">عرض المزيد</Text>
               <Text className="font-tajwal text-2xl text-body">الفئات الفاخرة</Text>
             </View>
   
             <FlatList
               data={categories}
               horizontal
               showsHorizontalScrollIndicator={false}
               keyExtractor={(item) => item.title}
               renderItem={({ item }) => (
                 <TouchableOpacity
                   onPress={() => {
                      pushTo(router, "/product", { category: item.title });
                   }}
                   className="rounded-2xl mx-4 items-center justify-center"
                   activeOpacity={0.8}
                 >
                   <View className="w-[80px] h-[80px] rounded-full bg-[#FDF1EA] flex items-center justify-center outline -outline-offset-1 outline-[#B89354]/20 mb-2">
                     {getIcon(item.title)}
                   </View>
                   <Text className="font-tajwal text-base font-medium text-center text-gray-800">
                     {item.title}
                   </Text>
                 </TouchableOpacity>
               )}
             />
           </View>
)

    
}

export default CategoriesSections
