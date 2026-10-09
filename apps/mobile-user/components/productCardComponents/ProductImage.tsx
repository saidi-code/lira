import { Image } from 'expo-image';
import { BlurView } from 'expo-blur';
import { View, ActivityIndicator, Text } from 'react-native';
import { useState } from 'react';

const ProductImage = ({ product}:{product:any}) => {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const blurhash ='U9IqZ800009FWAx]D%-n00bv%#~p01R*_2D*';
  const imageUri = product.featureImage ?? product.images?.[0] ?? product.colors?.[0]?.featureImage ?? product.colors?.[0]?.images?.[0];
  const isOutOfStock = product.stock === 0;

  return (
    <View style={{ position: 'relative' }}>
      {!loaded && !error && (
        <BlurView
          intensity={50}
          style={{
            position: 'absolute',
            width: '100%',
            height: '100%',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <ActivityIndicator size="large" color="#fff" />
        </BlurView>
      )}
      
      <Image
        source={{ uri:imageUri }}
        style={{ width:"auto", height: 150, opacity: isOutOfStock ? 0.5 : 1 }}
        onLoad={() => setLoaded(true)}
        onError={() => {
          setLoaded(true);
          setError(true);
        }}
        cachePolicy="memory-disk"
        placeholder={blurhash ? { blurhash } : require('../../assets/images/productLoadingImage.png')}
        contentFit="cover"
        transition={300}
      />
      
      {error && (
        <View style={{ position: 'absolute', top: '40%', width: '100%', alignItems: 'center' }}>
          <Text style={{ color: '#666' }}>⚠️ Image manquante</Text>
        </View>
      )}

      {isOutOfStock && (
        <View
          style={{
            position: 'absolute',
            bottom: 8,
            left: 8,
            backgroundColor: 'rgba(30,20,10,0.72)',
            borderRadius: 6,
            paddingHorizontal: 8,
            paddingVertical: 4,
          }}
        >
          <Text style={{ color: '#fff', fontSize: 10, fontFamily: 'tajwal-medium', letterSpacing: 0.5 }}>
            rupture de stock
          </Text>
        </View>
      )}
    </View>
  );
};

export default ProductImage;

// import { View,ActivityIndicator,StyleSheet } from 'react-native'
// import React,{useState} from 'react'
// import {BlurView} from "expo-blur"
// import {Image} from "expo-image"
// import AddToFavorisBtn from './AddToFavorisBtn'
// const ProductImage = ({product}:{product:any}) => {
//     const [loaded,setLoaded] = useState(false)
//   return (
   
         
//         <View
//           style={styles.imageContainer}
//           //   className=" aspect-square relative bg-[#fcf9f1]
//           // rounded-2xl overflow-hidden"
//         >
//            {!loaded && (
//         <BlurView
//           intensity={50}
//           style={{
//             position: 'absolute',
//             width: '100%',
//             height: '100%',
//             justifyContent: 'center',
//             alignItems: 'center',
//           }}
//         >
//           <ActivityIndicator size="large" color="#fff" />
//         </BlurView>
//       )}
//           <Image
//            source={{ uri: product.imageUri }}
//             // defaultSource={require("../assets/images/productLoadingImage.png")}
//             style={styles.productImage}
//             // placeholderContentFit="cover"
//             // contentFit="cover"
//             onLoad={() => setLoaded(true)}
//             cachePolicy="memory-disk"
//              placeholder={{ blurhash: 'LGF5]+Yk^6#M@-5c,1J5@[or[Q6.' }}
//             transition={300}
//              contentFit="cover"
//             // cachePolicy="memory-disk"
//             // priority={index < 3 ? 'high' : 'normal'}
//             // placeholder={placeholderSource}
//             // placeholderContentFit="cover"
//             // transition={300}
//           />

//          <AddToFavorisBtn product={product} />
//         </View>
//   )
// }

// export default ProductImage
// const styles = StyleSheet.create({






//   imageContainer: {
//     width: "100%",
//     // aspectRatio: 1,
//     backgroundColor: "#fcf9f1",
//     position: "relative",
//     aspectRatio: "1 / 1",
//   },
//   productImage: {
//     width: "100%",
//     height: "100%",
//   },

 
  
  
// });
