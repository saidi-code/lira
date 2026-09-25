import { COLORS } from "@/constants";
import { getStatusColor } from "../../constants/utility";
import { useAuth } from "@clerk/clerk-expo";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from "react-native";
import axios from "../../config/api";

export default function AdminDashboard() {
  const { getToken } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalProducts: 0,
    totalOrders: 0,
    totalRevenue: 0,
    recentOrders: [],
  });

  // Clerk's getToken is not memoized; keep the latest instance in a ref so
  // fetchStats stays referentially stable (avoids refetch loops).
  const getTokenRef = useRef(getToken);
  useEffect(() => {
    getTokenRef.current = getToken;
  }, [getToken]);

  const fetchStats = useCallback(async () => {
    try {
      const token = await getTokenRef.current();
      const { data } = await axios.get("/admin/stats", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (data.success) {
        setStats(data.data);
      }
    } catch (error) {
      console.error("Failed to fetch admin stats", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchStats();
  };

  if (loading && !refreshing) {
    return (
      <View className="flex-1 justify-center items-center bg-surface">
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <ScrollView
      className="flex-1 bg-surface p-4"
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View className="mb-8">
        <Text className="text-primary font-bold text-2xl mb-4 tracking-tight">
          Overview
        </Text>
        <View className="flex-row flex-wrap justify-between">
          <StatCard
            label="Total Revenue"
            value={`$${stats.totalRevenue.toFixed(2)}`}
          />
          <StatCard label="Total Orders" value={stats.totalOrders.toString()} />
          <StatCard label="Products" value={stats.totalProducts.toString()} />
          <StatCard label="Users" value={stats.totalUsers.toString()} />
        </View>
      </View>

      <View className="mb-6">
        <Text className="text-primary font-bold text-2xl mb-4 tracking-tight">
          Recent Orders
        </Text>
        {stats.recentOrders.length === 0 ? (
          <View className="bg-card p-6 rounded-2xl border border-subtle-border items-center">
            <Text className="text-secondary">No recent orders</Text>
          </View>
        ) : (
          stats.recentOrders.map((order: any) => (
            <View
              key={order._id}
              className="bg-card p-5 rounded-2xl border border-subtle-border mb-3"
            >
              <View className="flex-row justify-between items-center mb-3">
                <View>
                  <Text className="font-bold text-primary text-base">
                    Total Products :{" "}
                    {order.items.reduce(
                      (acc: number, item: any) => acc + item.quantity,
                      0,
                    )}
                  </Text>
                  <Text className="text-secondary text-xs mt-1">
                    {new Date(order.createdAt).toLocaleDateString()}
                  </Text>
                </View>
                <View
                  className={`px-3 py-1.5 rounded-full ${getStatusColor(order.orderStatus)}`}
                >
                  <Text className="text-[10px] font-bold uppercase">
                    {order.orderStatus}
                  </Text>
                </View>
              </View>
              <View className="pb-2">
                {order.items.map((item: any, itemIndex: number) => (
                  <Text
                    key={`${item.product?._id ?? item.product ?? itemIndex}-${itemIndex}`}
                    className="text-secondary text-xs mt-1"
                  >
                    {item.name} x {item.quantity}
                  </Text>
                ))}
              </View>

              <View className="h-[1px] bg-subtle mb-3" />

              <View className="flex-row justify-between items-center">
                <View className="flex-row items-center">
                  <View className="w-8 h-8 rounded-full bg-subtle items-center justify-center mr-2">
                    <Text className="text-primary font-bold text-xs">
                      {(order.user?.name || "?").charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <Text className="text-secondary text-sm">
                    {order.user?.name || "Unknown User"}
                  </Text>
                </View>
                <Text className="text-primary font-bold text-lg">
                  ${order.totalAmount.toFixed(2)}
                </Text>
              </View>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const StatCard = ({ label, value }: { label: string; value: string }) => (
  <View className="bg-card p-5 rounded-2xl border border-subtle-border w-[48%] mb-4 justify-center">
    <Text className="text-xl font-bold text-primary mb-1">{value}</Text>
    <Text className="text-secondary text-xs font-medium uppercase tracking-wide">
      {label}
    </Text>
  </View>
);
