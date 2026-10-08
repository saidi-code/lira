// app/admin/inventory/movements.tsx
// ==========================================
//   The append-only stock ledger.
//
// `quantity` is a magnitude and is always positive; `delta` is the signed effect
// on the warehouse. Showing the magnitude alone makes an `out` look like a
// delivery, which is the easiest way to misread an audit trail.
// ==========================================
import { COLORS } from "@/constants";
import { useMovementsQuery, useWarehousesQuery } from "@/hooks/useInventory";
import { Ionicons } from "@expo/vector-icons";
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
  BackendStockMovement,
  MovementType,
} from "@/config/inventoryApi";

const TYPES: { value: MovementType; label: string }[] = [
  { value: "in", label: "In" },
  { value: "out", label: "Out" },
  { value: "reserve", label: "Reserve" },
  { value: "release", label: "Release" },
  { value: "commit", label: "Commit" },
  { value: "transfer_out", label: "Transfer out" },
  { value: "transfer_in", label: "Transfer in" },
  { value: "adjust", label: "Adjust" },
];

const nameOf = (v: BackendStockMovement["product"]) =>
  typeof v === "string" ? "—" : v.name;

const warehouseOf = (v: BackendStockMovement["warehouse"]) =>
  typeof v === "string" ? "—" : v.name;

export default function MovementsScreen() {
  const [type, setType] = useState<MovementType | undefined>(undefined);
  const { warehouses } = useWarehousesQuery();
  const { movements, pagination, isLoading, isRefetching, error, refetch } =
    useMovementsQuery({ limit: 100, ...(type ? { type } : {}) });

  return (
    <View className="flex-1 bg-surface">
      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        data={[{ value: undefined, label: "All" }, ...TYPES]}
        keyExtractor={(item) => item.label}
        contentContainerStyle={{ padding: 16, paddingBottom: 4 }}
        renderItem={({ item }) => {
          const selected = type === item.value;
          return (
            <TouchableOpacity
              onPress={() => setType(item.value)}
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
        {pagination.total} movement(s) · {warehouses.length} warehouse(s)
      </Text>

      {isLoading && movements.length === 0 ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <FlatList
          data={movements}
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
                name={error ? "alert-circle-outline" : "file-tray-outline"}
                size={40}
                color={COLORS.secondary}
              />
              <Text className="text-secondary mt-3 text-center">
                {error
                  ? "Could not load movements. Pull down to retry."
                  : "No movements recorded yet."}
              </Text>
            </View>
          }
          renderItem={({ item }) => {
            const negative = item.delta < 0;

            return (
              <View className="bg-card p-4 rounded-2xl border border-subtle-border mb-2">
                <View className="flex-row justify-between items-center">
                  <Text className="text-primary font-bold text-sm flex-1 pr-3">
                    {nameOf(item.product)}
                  </Text>
                  <Text
                    className={`text-base font-bold ${
                      negative ? "text-danger" : "text-success"
                    }`}
                  >
                    {negative ? "" : "+"}
                    {item.delta}
                  </Text>
                </View>

                <View className="flex-row items-center mt-1.5">
                  <View className="bg-subtle px-2 py-0.5 rounded">
                    <Text className="text-secondary text-[10px] font-bold uppercase">
                      {item.type}
                    </Text>
                  </View>
                  <Text className="text-secondary text-[10px] ml-2">
                    {item.quantity} unit(s) · {warehouseOf(item.warehouse)}
                  </Text>
                </View>

                {item.note ? (
                  <Text className="text-secondary text-xs mt-2">
                    {item.note}
                  </Text>
                ) : null}

                <Text className="text-secondary text-[10px] mt-2">
                  {new Date(item.createdAt).toLocaleString()}
                </Text>
              </View>
            );
          }}
        />
      )}
    </View>
  );
}