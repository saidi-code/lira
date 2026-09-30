import { COLORS } from "@/constants";
import { useAuth } from "@clerk/clerk-expo";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Toast from "react-native-toast-message";
import axios from "../../../config/api";

export default function AdminProducts() {
  const { getToken } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [products, setProducts] = useState([]);

  // Clerk's getToken is not memoized; keep the latest instance in a ref so
  // fetchProducts stays referentially stable (avoids refetch loops).
  const getTokenRef = useRef(getToken);
  useEffect(() => {
    getTokenRef.current = getToken;
  }, [getToken]);

  const fetchProducts = useCallback(async () => {
    try {
      const token = await getTokenRef.current();
      const { data } = await axios.get("/products", {
        params: { limit: 999 },
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (data.success) {
        setProducts(data.data);
      }
    } catch (error: any) {
      console.error(error);
      Toast.show({
        type: "error",
        text1: "Failed to load products",
        text2:
          error.response?.data?.message ||
          "An error occurred while fetching products",
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
    // setProducts(dummyProducts as any);
    // setLoading(false);
    // setRefreshing(false);
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchProducts();
  };

  const performDelete = async (id: string) => {
    try {
      const token = await getToken();
      const { data } = await axios.delete(`/products/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (data.success) {
        Toast.show({
          type: "success",
          text1: "Product Deleted",
          text2: "The product has been successfully deleted",
        });
        fetchProducts();
      }
    } catch (error: any) {
      Toast.show({
        type: "error",
        text1: "Failed to delete product",
        text2:
          error.response?.data?.message ||
          "An error occurred while fetching products",
      });
      console.error("Failed to delete product");
    }

    // setProducts(products.filter((product: any) => product._id !== id) as any);
  };

  const deleteProduct = async (id: string) => {
    Alert.alert(
      "Delete Product",
      "Are you sure you want to delete this product?",
      [
        { text: "Cancel", style: "cancel" as const },
        {
          text: "Delete",
          style: "destructive" as const,
          onPress: () => performDelete(id),
        },
      ],
    );
  };

  if (loading && !refreshing) {
    return (
      <View className="flex-1 justify-center items-center bg-surface">
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-surface">
      <View className="p-4 bg-card border border-subtle-border flex-row justify-between items-center">
        <Text className="text-lg font-semibold text-primary">
          Total Products ({products.length})
        </Text>
        <TouchableOpacity
          onPress={() => router.push("/admin/products/add")}
          className="bg-gray-800 px-4 py-2 rounded-full flex-row items-center"
        >
          <Ionicons name="add" size={20} color="white" />
          <Text className="text-white font-medium ml-1">Add Product</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        className="flex-1 p-2"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {products.length === 0 ? (
          <View className="flex-1 justify-center items-center mt-20">
            <Text className="text-secondary">No products found</Text>
          </View>
        ) : (
          products.map((product: any) => (
            <View
              key={product._id}
              className="bg-card p-3 rounded-lg border border-subtle-border mb-3 flex-row items-center"
            >
              <Image
                source={{
                  uri:
                    product.images && product.images.length > 0
                      ? product.images[0]
                      : "https://via.placeholder.com/150",
                }}
                className="w-16 h-16 rounded-lg bg-subtle mr-3"
                resizeMode="cover"
              />

              <View className="flex-1">
                <Text
                  className="font-bold text-primary text-base"
                  numberOfLines={1}
                >
                  {product.name}
                </Text>
                <Text className="text-secondary text-xs mb-1" numberOfLines={1}>
                  {/* Category : {product.category || "Others"} */}
               Category : {product.category?.title || product.category?.name || "Others"}
                </Text>
                <Text className="text-secondary text-xs mb-1" numberOfLines={1}>
                  Stock : {product.stock}
                </Text>
                <Text className="text-secondary text-xs mb-1" numberOfLines={1}>
                  {/* Sizes : {product.sizes.join(", ")} */}
                  Sizes : {product.sizes?.join(", ") || "N/A"}
                </Text>
                <Text className="text-primary font-bold">
                  ${product.price.toFixed(2)}
                </Text>
              </View>

              <View className="flex-row items-center">
                <TouchableOpacity
                  onPress={() =>
                    router.push(`/admin/products/edit/${product._id}`)
                  }
                  className="p-2 bg-subtle rounded-full mr-2"
                >
                  <Ionicons name="create-outline" size={18} color={COLORS.body} />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => deleteProduct(product._id)}
                  className="p-2 bg-subtle rounded-full"
                >
                  <Ionicons name="trash-outline" size={18} color={COLORS.body} />
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}
