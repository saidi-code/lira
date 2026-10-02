// app/admin/index.tsx
// ==========================================
//   Admin dashboard.
//
// This called `/admin/stats` with raw axios while every other admin screen went
// through a hook. That is worse than it looks: a raw call means no shared
// query key, so a role change or a new order cannot invalidate it, and it is a
// second, drifting description of how to reach the endpoint.
// ==========================================
import { COLORS } from "@/constants";
import { getStatusColor } from "../../constants/utility";
import { useAdminStats } from "@/hooks/useAdmin";
import React from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from "react-native";

type RecentOrder = {
  _id: string;
  orderStatus: string;
  createdAt: string;
  totalAmount: number;
  items: { _id?: string; product?: string | { _id: string }; name: string; quantity: number }[];
  user?: { name?: string } | null;
};

/**
 * A stable React key for a line item. `product` is an id when the server did not
 * populate it and an object when it did, so it is narrowed rather than cast —
 * `item.product?._id` does not typecheck against a `string | { _id }` union.
 */
const productKey = (item: RecentOrder["items"][number], index: number) => {
  const { product } = item;
  const id =
    product && typeof product === "object"
      ? product._id
      : typeof product === "string"
        ? product
        : (item._id ?? index);
  return `${id}-${index}`;
};

export default function AdminDashboard() {
  const { stats, isLoading, isFetching, refetch, error } = useAdminStats();

  const recentOrders = (stats?.recentOrders ?? []) as RecentOrder[];
  const revenue = stats?.revenue?.total ?? 0;

  const onRefresh = () => {
    refetch();
  };

  if (isLoading) {
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
        <RefreshControl refreshing={isFetching} onRefresh={onRefresh} />
      }
    >
      <View className="mb-8">
        <Text className="text-primary font-bold text-2xl mb-4 tracking-tight">
          Overview
        </Text>
        <View className="flex-row flex-wrap justify-between">
          <StatCard label="Total Revenue" value={`$${revenue.toFixed(2)}`} />
          <StatCard label="Total Orders" value={(stats?.totalOrders ?? 0).toString()} />
          <StatCard label="Products" value={(stats?.totalProducts ?? 0).toString()} />
          <StatCard label="Users" value={(stats?.totalUsers ?? 0).toString()} />
        </View>

        {error ? (
          <Text className="text-danger text-xs mt-2">
            Could not refresh — showing whatever last loaded.
          </Text>
        ) : null}
      </View>

      <View className="mb-6">
        <Text className="text-primary font-bold text-2xl mb-4 tracking-tight">
          Recent Orders
        </Text>
        {recentOrders.length === 0 ? (
          <View className="bg-card p-6 rounded-2xl border border-subtle-border items-center">
            <Text className="text-secondary">No recent orders</Text>
          </View>
        ) : (
          recentOrders.map((order) => (
            <View
              key={order._id}
              className="bg-card p-5 rounded-2xl border border-subtle-border mb-3"
            >
              <View className="flex-row justify-between items-center mb-3">
                <View>
                  <Text className="font-bold text-primary text-base">
                    Total Products :{" "}
                    {order.items.reduce(
                      (acc, item) => acc + item.quantity,
                      0
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
                {order.items.map((item, index) => (
                  <Text
                    key={productKey(item, index)}
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
