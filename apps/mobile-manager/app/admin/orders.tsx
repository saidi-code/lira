import { RequireCapability } from "@/components/admin/RequireCapability";
import { COLORS } from "@/constants";
import { getStatusColor } from "../../constants/utility";

import { Ionicons } from "@expo/vector-icons";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
// import { dummyOrders, dummyUser } from "@/assets/assets";
import { useAuth } from "@clerk/clerk-expo";
import Toast from "react-native-toast-message";
import axios from "../../config/api";

// import { dummyUser } from "../(tabs)/assets";
// Admin-only. `href: null` hides the tab from a manager but does not unregister
// the route, so the guard is on the screen as well.
export default function AdminOrdersRoute() {
  return (
    <RequireCapability capability="orders">
      <AdminOrders />
    </RequireCapability>
  );
}

function AdminOrders() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [orders, setOrders] = useState([]);

  // Status Modal State
  const [statusModalVisible, setStatusModalVisible] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [updating, setUpdating] = useState(false);
  const { getToken } = useAuth();
  const STATUSES = [
    "placed",
    "processing",
    "shipped",
    "delivered",
    "cancelled",
  ];

  // Clerk's getToken is not memoized; keep the latest instance in a ref so
  // fetchOrders stays referentially stable (avoids refetch loops).
  const getTokenRef = useRef(getToken);
  useEffect(() => {
    getTokenRef.current = getToken;
  }, [getToken]);

  const fetchOrders = useCallback(async () => {
    try {
      const token = await getTokenRef.current();
      const { data } = await axios.get("/orders", {
        params: { limit: 999 },
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (data.success) {
        setOrders(
          data.data.map((order: any) => ({
            ...order,
            user: order.user || { name: "Unknown User", email: "No email" },
          })) as any,
        );
      } else {
        Toast.show({
          type: "error",
          text1: "Failed to Load Orders",
          text2: data.message || "An error occurred while fetching orders",
        });
      }
    } catch (error: any) {
      console.error("Failed to load orders", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
    // setOrders(dummyOrders.map((order: any) => ({
    //     ...order,
    //     user: dummyUser
    // })) as any);
    // setLoading(false);
    // setRefreshing(false);
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchOrders();
  };

  const openStatusModal = (order: any) => {
    setSelectedOrder(order);
    setStatusModalVisible(true);
  };

  const updateStatus = async (newStatus: string) => {
    if (!selectedOrder) return;
    try {
      const token = await getToken();
      const { data } = await axios.put(
        `/orders/${selectedOrder._id}/status`,
        {
          orderStatus: newStatus,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );
      if (data.success) {
        Toast.show({
          type: "success",
          text1: "Status Updated",
          text2: `Order status has been updated to ${newStatus}`,
        });
        setStatusModalVisible(false);
        fetchOrders();
      }
    } catch (error: any) {
      Toast.show({
        type: "error",
        text1: "Failed to update status",
        text2:
          error.response?.data?.message ||
          "An error occurred while updating order status",
      });
      console.error("Failed to update order status", error);
    } finally {
      setUpdating(false);
    }
    // if (!selectedOrder) return;
    // setOrders(
    //   orders.map((order: any) =>
    //     order._id === selectedOrder._id
    //       ? { ...order, orderStatus: newStatus }
    //       : order,
    //   ) as any,
    // );
    // setStatusModalVisible(false);
    // setUpdating(false);
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
      <ScrollView
        className="flex-1 p-4"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {orders.length === 0 ? (
          <View className="flex-1 justify-center items-center mt-20">
            <Text className="text-secondary">No orders found</Text>
          </View>
        ) : (
          orders.map((order: any) => (
            <View
              key={order._id}
              className="bg-card p-4 rounded-xl shadow-sm mb-4 border border-subtle-border"
            >
              <View className="flex-row justify-between mb-2">
                <Text className="font-medium text-sm text-muted ">
                  Order ID : #{order._id}
                </Text>
                <Text className="text-secondary text-xs">
                  {new Date(order.createdAt).toLocaleDateString()}
                </Text>
              </View>

              <View className="mb-3 bg-subtle p-3 rounded-lg">
                <Text className="text-xs text-secondary font-bold mb-1">
                  CUSTOMER
                </Text>
                <Text className="text-primary font-medium">
                  {order.user?.name || "Unknown User"}
                </Text>
                <Text className="text-secondary text-xs">
                  {order.user?.email || "No email"}
                </Text>
                {!order.user && (
                  <Text className="text-xs text-muted mt-1">
                    ID: {order.user?._id || "N/A"}
                  </Text>
                )}
              </View>

              <View className="mb-3 bg-subtle p-3 rounded-lg">
                <Text className="text-xs text-secondary font-bold mb-1">
                  SHIPPING ADDRESS
                </Text>
                <Text className="text-primary text-xs">
                  {order.shippingAddress?.street}, {order.shippingAddress?.city}
                </Text>
                <Text className="text-primary text-xs">
                  {order.shippingAddress?.state},{" "}
                  {order.shippingAddress?.zipCode},{" "}
                  {order.shippingAddress?.country}
                </Text>
              </View>

              <View className="mb-3">
                <Text className="text-xs text-secondary font-bold mb-2">
                  ITEMS
                </Text>
                {order.items.map((item: any, itemIndex: number) => (
                  <View
                    key={`${item.product?._id ?? item.product ?? itemIndex}-${itemIndex}`}
                    className="flex-row justify-between mb-1"
                  >
                    <Text className="text-secondary text-xs flex-1">
                      {item.quantity}x {item.product?.name || item.name}
                      {item.size && (
                        <Text className="text-muted">
                          {" "}
                          ({item.size || "-"})
                        </Text>
                      )}
                    </Text>
                    <Text className="text-secondary text-xs font-bold">
                      ${item.price.toFixed(2)}
                    </Text>
                  </View>
                ))}
              </View>

              <View className="flex-row justify-between items-center mt-2 pt-3 border-t border-subtle-border">
                <Text className="text-primary font-bold text-lg">
                  ${order.totalAmount.toFixed(2)}
                </Text>

                <TouchableOpacity
                  onPress={() => openStatusModal(order)}
                  className={`flex-row items-center px-4 py-2 rounded-full ${getStatusColor(order.orderStatus)}`}
                >
                  <Text className="text-xs font-bold mr-2 uppercase tracking-wide">
                    {order.orderStatus}
                  </Text>
                  <Ionicons
                    name="pencil"
                    size={12}
                    color="black"
                    style={{ opacity: 0.5 }}
                  />
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* STATUS MODAL */}
      <Modal visible={statusModalVisible} animationType="fade" transparent>
        <TouchableWithoutFeedback onPress={() => setStatusModalVisible(false)}>
          <View className="flex-1 justify-end bg-scrim/50">
            <View className="bg-card rounded-t-2xl p-4 max-h-[60%]">
              <View className="flex-row justify-between items-center mb-4 pb-4 border-b border-subtle-border">
                <Text className="text-lg font-bold text-primary">
                  Update Order Status
                </Text>
                <TouchableOpacity onPress={() => setStatusModalVisible(false)}>
                  <Ionicons name="close" size={24} color={COLORS.secondary} />
                </TouchableOpacity>
              </View>

              {updating ? (
                <View className="py-8">
                  <ActivityIndicator size="large" color={COLORS.primary} />
                  <Text className="text-center text-secondary mt-2">
                    Updating status...
                  </Text>
                </View>
              ) : (
                <FlatList
                  data={STATUSES}
                  keyExtractor={(item) => item}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      className={`p-4 rounded-xl mb-2 flex-row justify-between items-center ${
                        selectedOrder?.orderStatus === item
                          ? "bg-primary/10"
                          : "bg-subtle"
                      }`}
                      onPress={() => updateStatus(item)}
                    >
                      <Text
                        className={`font-medium capitalize ${
                          selectedOrder?.orderStatus === item
                            ? "text-primary font-bold"
                            : "text-secondary"
                        }`}
                      >
                        {item}
                      </Text>
                      {selectedOrder?.orderStatus === item && (
                        <Ionicons
                          name="checkmark-circle"
                          size={20}
                          color={COLORS.primary}
                        />
                      )}
                    </TouchableOpacity>
                  )}
                />
              )}
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
}
