// app/admin/purchasing/index.tsx
// ==========================================
//   Purchase orders — the replenishment side of stock.
//
// An order that cannot be received against is an order you cannot act on, which
// is why the tap target is the whole row: this screen is a queue, the detail
// screen is the work.
// ==========================================
import { COLORS } from "@/constants";
import { usePurchaseOrdersQuery } from "@/hooks/usePurchasing";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import type {
  BackendPurchaseOrder,
  PurchaseOrderStatus,
} from "@/config/purchasingApi";

const STATUSES: { value: PurchaseOrderStatus; label: string }[] = [
  { value: "draft", label: "Draft" },
  { value: "ordered", label: "Ordered" },
  { value: "partially_received", label: "Part received" },
  { value: "received", label: "Received" },
  { value: "cancelled", label: "Cancelled" },
];

const supplierName = (po: BackendPurchaseOrder) =>
  typeof po.supplier === "string" ? "—" : po.supplier.name;

/** A received order is done; a cancelled one never will be. */
const statusTint = (status: PurchaseOrderStatus) => {
  if (status === "received") return "bg-success/10";
  if (status === "partially_received") return "bg-warning/10";
  if (status === "ordered") return "bg-primary/10";
  return "bg-subtle";
};

const statusText = (status: PurchaseOrderStatus) => {
  if (status === "received") return "text-success";
  if (status === "partially_received") return "text-warning";
  if (status === "ordered") return "text-primary";
  return "text-secondary";
};

export default function PurchaseOrdersScreen() {
  const router = useRouter();
  const [status, setStatus] = useState<PurchaseOrderStatus | undefined>();

  const { orders, isLoading, isRefetching, error, refetch } =
    usePurchaseOrdersQuery({ limit: 100, ...(status ? { status } : {}) });

  return (
    <View className="flex-1 bg-surface">
      <View className="flex-row items-center px-4 pt-3 pb-2">
        <TouchableOpacity
          onPress={() => router.push("/admin/purchasing/new")}
          className="flex-row items-center bg-primary px-4 py-2 rounded-full"
        >
          <Ionicons name="add" size={16} color={COLORS.white} />
          <Text className="text-white text-xs font-bold ml-1">New order</Text>
        </TouchableOpacity>

        <View className="flex-1" />

        <TouchableOpacity
          onPress={() => router.push("/admin/purchasing/suppliers")}
          className="flex-row items-center px-3 py-2 rounded-full bg-subtle"
        >
          <Ionicons name="business-outline" size={14} color={COLORS.secondary} />
          <Text className="text-secondary text-xs font-bold ml-1">
            Suppliers
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        data={[{ value: undefined, label: "All" }, ...STATUSES]}
        keyExtractor={(item) => item.label}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 4 }}
        renderItem={({ item }) => {
          const selected = status === item.value;
          return (
            <TouchableOpacity
              onPress={() => setStatus(item.value)}
              className={`px-3 py-1.5 rounded-full mr-2 ${
                selected ? "bg-primary" : "bg-subtle"
              }`}
            >
              <Text
                className={`text-xs font-medium ${
                  selected ? "text-white" : "text-secondary"
                }`}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          );
        }}
      />

      <Text className="px-4 pb-2 text-secondary text-xs">
        {orders.length} loaded
        {status ? ` · ${status.replace(/_/g, " ")}` : ""}
      </Text>

      {isLoading && orders.length === 0 ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(item) => item._id}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={() => refetch()}
              tintColor={COLORS.primary}
            />
          }
          contentContainerStyle={{ padding: 16, paddingTop: 0 }}
          ListEmptyComponent={
            <View className="items-center py-12">
              <Ionicons
                name={error ? "alert-circle-outline" : "document-text-outline"}
                size={40}
                color={COLORS.secondary}
              />
              <Text className="text-secondary mt-3 text-center">
                {error
                  ? "Could not load purchase orders. Pull down to retry."
                  : "No purchase orders yet."}
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() =>
                router.push({
                  pathname: "/admin/purchasing/[id]",
                  params: { id: item._id },
                })
              }
              className="bg-card p-4 rounded-2xl border border-subtle-border mb-3"
            >
              <View className="flex-row justify-between items-start">
                <View className="flex-1 pr-3">
                  <Text className="text-primary font-bold text-base">
                    {item.orderNumber}
                  </Text>
                  <Text className="text-secondary text-xs mt-0.5">
                    {supplierName(item)} · {item.items.length} line(s)
                  </Text>
                </View>
                <View
                  className={`px-2 py-1 rounded-full ${statusTint(item.status)}`}
                >
                  <Text
                    className={`text-[10px] font-bold uppercase ${statusText(item.status)}`}
                  >
                    {item.status.replace(/_/g, " ")}
                  </Text>
                </View>
              </View>

              <View className="flex-row justify-between items-center mt-3 pt-3 border-t border-subtle-border">
                <Text className="text-secondary text-xs">
                  {new Date(item.createdAt).toLocaleDateString()}
                </Text>
                <Text className="text-primary font-bold">
                  ${item.total.toFixed(2)}
                </Text>
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}