import { useAuth } from "@clerk/clerk-expo";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import { Image } from "expo-image";
import {

  StyleSheet,
  Pressable,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { CURRENCY } from "../constants/index";
import { IProduct, ProductCardProps } from "../constants/types";
import ChooseColorSizeModal from "./productCardComponents/ChooseColorSizeModal";
import { useCart } from "../context/CartContext";
import ProductCardCategoryComponent from "./productCardComponents/ProductCategoryComponent";
import ProductNameComponent from "./productCardComponents/ProductNameComponent";
import ProductPriceComponent from "./productCardComponents/ProductPriceComponent";
import AddToCartBtn from "./productCardComponents/AddToCartBtn";
import AddToFavorisBtn from "./productCardComponents/AddToFavorisBtn";
const ProductCard = ({ product }: ProductCardProps) => {
  const placeholderSource = require("../assets/images/productLoadingImage.svg");
  const { isSignedIn } = useAuth();
  const router = useRouter();
  const { addToCart } = useCart();


  const [showModal, setShowModal] = useState(false);
 

  // const defaultColor = useMemo(() => {
  //   if (!isVariable) return null;
  //   const firstColor =  (product as any)?.colors[0]
  //   return firstColor.hex ?? null;
  // }, [isVariable, product]);

  // const defaultSize = useMemo(() => {
  //   if (!isVariable) return null;
  //   const firstColor = (product as any)?.colors?.[0];
  //   return firstColor?.variants?.[0]?.size ?? null;
  // }, [isVariable, product]);

  const imageUri = product.images?.[0] ?? product.colors?.[0]?.images?.[0];
  const handleOpenVariableModal = () => {
    setShowModal(true);
  };

  return (
    <Pressable
      // className="flex-1"
      style={styles.productCard}
      onPress={() => router.push(`/product/${product._id}`)}
    >

        {/* Image with gold badge */}
        <View
          style={styles.imageContainer}
          //   className=" aspect-square relative bg-[#fcf9f1]
          // rounded-2xl overflow-hidden"
        >
          <Image
          
           source={{ uri: imageUri }}
            // defaultSource={require("../assets/images/productLoadingImage.png")}
            style={styles.productImage}
            // placeholderContentFit="cover"
            // contentFit="cover"
          
            
            transition={300}
            // cachePolicy="memory-disk"
            // priority={index < 3 ? 'high' : 'normal'}
            // placeholder={placeholderSource}
            // placeholderContentFit="cover"
            // transition={300}
          />

         <AddToFavorisBtn product={product} />
        </View>
      <View
        className="p-3 bg-white rounded-3xl shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] outline outline-1 outline-offset-[-1px] outline-[#b89354]/5 self-stretch"
        //   className="p-4 bg-white rounded-3xl
        // shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)]
        // outline outline-1 outline-offset-[-1px]
        //  outline-[#b89354]/5 self-stretch"
      >
        {/* // product category component  */}
        <ProductCardCategoryComponent productCategory={product.category.title} />
        {/* Product name */}
        <ProductNameComponent productName={product.name} />

        {/* Price and cart button */}
        <View className=" flex-row justify-between">
          {/* <TouchableOpacity
            onPress={() => {
              if (!product) return;

              if (product.type === "variable") {
                handleOpenVariableModal();
                return;
              }

              // Simple product: add directly
              addToCart(product as IProduct, null, null);
            }}
            className="w-10 h-10 bg-[#b89354] rounded-full justify-center items-center"
          >
            <Ionicons name="add-outline" size={18} color={"#ffffff"} />
          </TouchableOpacity> */}
          <AddToCartBtn
            product={product}
            handleOpenVariableModal={handleOpenVariableModal}
          />
          <ProductPriceComponent productPrice={product.price} />
        </View>

        <ChooseColorSizeModal
          show={showModal}
          setShow={setShowModal}
          product={(product as any) ?? null}
        />
      </View>
    </Pressable>
  );
};
const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFF8F5",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#B89354",
    fontFamily: "Tajawal-Medium",
  },
  errorText: {
    fontSize: 16,
    color: "#B89354",
    fontFamily: "Tajawal-Medium",
  },
  listContainer: {
    paddingHorizontal: 12,
    paddingVertical: 16,
    backgroundColor: "#FFF8F5",
  },
  columnWrapper: {
    justifyContent: "space-between",
    marginBottom: 16,
  },
  productCard: {
    flex: 1,
    marginHorizontal: 6,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  imageContainer: {
    width: "100%",
    // aspectRatio: 1,
    backgroundColor: "#fcf9f1",
    position: "relative",
    aspectRatio: "1 / 1",
  },
  productImage: {
    width: "100%",
    height: "100%",
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1,
  },
  productName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#201B16",
    textAlign: "right",
    paddingHorizontal: 8,
    paddingTop: 8,
    fontFamily: "Tajawal-Medium",
  },
  productPrice: {
    fontSize: 13,
    fontWeight: "700",
    color: "#B89354",
    textAlign: "right",
    paddingHorizontal: 8,
    paddingBottom: 12,
    paddingTop: 4,
    fontFamily: "Tajawal-Medium",
  },
  footer: {
    paddingVertical: 20,
    justifyContent: "center",
    alignItems: "center",
  },
});
export default ProductCard;
