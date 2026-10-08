// app/admin/inventory/index.tsx
// ==========================================
//   Stock levels per warehouse, and the low-stock view.
//
// The number that matters is `available` (quantity − reserved), not `quantity`.
// Showing raw quantity here is what makes a backoffice look fine while the shop
// is already selling stock that is spoken for.
// ==========================================
import { COLORS } from "@/constants";
import {
  useInventoryQuery,
  useLowStockQuery,
  useWarehousesQuery,
} from "@/hooks/useInventory";
import { usePermissions } from "@/hooks/usePermissions";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import type { BackendInventoryRow } from "@/config/inventoryApi";

type Filter = "all" | "low";

/** The product is a bare id unless the server populated it. */
const productName = (row: BackendInventoryRow) =>
  typeof row.product === "string" ? "—" : row.product.name;

const productId = (row: BackendInventoryRow) =>
  typeof row.product === "string" ? row.product : row.product._id;

const warehouseName = (row: BackendInventoryRow) =>
  typeof row.warehouse === "string" ? "—" : row.warehouse.name;

export default function InventoryScreen() {
  const router = useRouter();
  const { can } = usePermissions();

  const [warehouse, setWarehouse] = useState<string | undefined>(undefined);
  const [filter, setFilter] = useState<Filter>("all");

  const { warehouses } = useWarehousesQuery();
  const stock = useInventoryQuery({ warehouse, limit: 100 });
  const low = useLowStockQuery(warehouse);

  // Both queries run; only one is rendered. `useLowStockQuery` has no `enabled`
  // flag, and adding one for a second request that is cheap either way would be
  // more machinery than the saving.
  const rows = filter === "low" ? low.rows : stock.rows;
  const isLoading = filter === "low" ? low.isLoading : stock.isLoading;
  const error = filter === "low" ? low.error : stock.error;
  const refreshing = filter === "low" ? low.isRefetching : stock.isRefetching;

  const totalRows = filter === "low" ? low.rows.length : stock.pagination.total;
  const activeWarehouses = useMemo(
    () => warehouses.filter((w) => w.isActive),
    [warehouses]
  );

  return (
    <View className="flex-1 bg-surface">
      <View className="px-4 pt-3 pb-2 flex-row items-center">
        <FilterChip
          label="All stock"
          selected={filter === "all"}
          onPress={() => setFilter("all")}
        />
        <FilterChip
          label="Low stock"
          selected={filter === "low"}
          onPress={() => setFilter("low")}
        />

        <View className="flex-1" />

        {can("inventory.adjust") && (
          <TouchableOpacity
            onPress={() => router.push("/admin/inventory/adjust")}
            className="flex-row items-center bg-primary px-3 py-2 rounded-full"
          >
            <Ionicons name="create-outline" size={14} color={COLORS.white} />
            <Text className="text-white text-xs font-bold ml-1">Adjust</Text>
          </TouchableOpacity>
        )}
      </View>

      <View className="px-4 pb-2">
        <Text className="text-secondary text-xs font-medium mb-2 uppercase tracking-wide">
          Warehouse
        </Text>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={[{ _id: "", name: "All" }, ...activeWarehouses]}
          keyExtractor={(item) => item._id || "all"}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => setWarehouse(item._id || undefined)}
              className={`px-3 py-1.5 rounded-full mr-2 ${
                (warehouse ?? "") === item._id ? "bg-primary/15" : "bg-subtle"
              }`}
            >
              <Text
                className={`text-xs font-medium ${
                  (warehouse ?? "") === item._id
                    ? "text-primary font-bold"
                    : "text-secondary"
                }`}
              >
                {item.name}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {isLoading && rows.length === 0 ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <FlatList
          data={rows}
          keyExtractor={(item) => item._id}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => (filter === "low" ? low.refetch() : stock.refetch())}
              tintColor={COLORS.primary}
            />
          }
          contentContainerStyle={{ padding: 16, paddingTop: 4 }}
          ListHeaderComponent={
            <Text className="text-secondary text-xs mb-2">
              {totalRows} row(s)
              {filter === "low" ? " at or below reorder level" : ""}
            </Text>
          }
          ListEmptyComponent={
            <View className="items-center py-12">
              <Ionicons
                name={error ? "alert-circle-outline" : "checkmark-done-outline"}
                size={40}
                color={COLORS.secondary}
              />
              <Text className="text-secondary mt-3 text-center">
                {error
                  ? "Could not load stock. Pull down to retry."
                  : filter === "low"
                    ? "Nothing is below its reorder level."
                    : "No stock rows yet."}
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <StockRow
              row={item}
              canAdjust={can("inventory.adjust")}
              onAdjust={() =>
                router.push({
                  pathname: "/admin/inventory/adjust",
                  params: {
                    productId: productId(item),
                    productName: productName(item),
                    warehouseId:
                      typeof item.warehouse === "string"
                        ? item.warehouse
                        : item.warehouse._id,
                  },
                })
              }
            />
          )}
        />
      )}

      <TouchableOpacity
        onPress={() => router.push("/admin/inventory/movements")}
        className="flex-row items-center justify-center py-4 border-t border-subtle-border"
      >
        <Ionicons name="list-outline" size={16} color={COLORS.primary} />
        <Text className="text-primary text-sm font-medium ml-2">
          Movement ledger
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const FilterChip = ({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) => (
  <TouchableOpacity
    onPress={onPress}
    className={`px-4 py-2 rounded-full mr-2 ${selected ? "bg-primary" : "bg-subtle"}`}
  >
    <Text
      className={`text-xs font-bold ${selected ? "text-white" : "text-secondary"}`}
    >
      {label}
    </Text>
  </TouchableOpacity>
);

const StockRow = ({
  row,
  canAdjust,
  onAdjust,
}: {
  row: BackendInventoryRow;
  canAdjust: boolean;
  onAdjust: () => void;
}) => {
  // The server may omit `available`; falling back to `quantity` would overstate
  // what a customer can actually buy, so derive it rather than trust it.
  const available = row.available ?? row.quantity - row.reserved;
  const low = available <= row.reorderLevel;

  return (
    <TouchableOpacity
      onPress={canAdjust ? onAdjust : undefined}
      className="bg-card p-4 rounded-2xl border border-subtle-border mb-3"
    >
      <View className="flex-row justify-between items-start">
        <View className="flex-1 pr-3">
          <Text className="text-primary font-bold text-base">
            {productName(row)}
          </Text>
          <Text className="text-secondary text-xs mt-0.5">
            {warehouseName(row)}
            {row.binLocation ? ` · ${row.binLocation}` : ""}
          </Text>
        </View>

        {low && (
          <View className="bg-danger/10 px-2 py-1 rounded-full">
            <Text className="text-danger text-[10px] font-bold uppercase">
              Low
            </Text>
          </View>
        )}
      </View>

      <View className="flex-row mt-3 pt-3 border-t border-subtle-border">
        <Stat label="Available" value={available} emphasis />
        <Stat label="On hand" value={row.quantity} />
        <Stat label="Reserved" value={row.reserved} />
        <Stat label="Reorder at" value={row.reorderLevel} />
      </View>
    </TouchableOpacity>
  );
};

const Stat = ({
  label,
  value,
  emphasis,
}: {
  label: string;
  value: number;
  emphasis?: boolean;
}) => (
  <View className="flex-1">
    <Text
      className={`text-base font-bold ${
        emphasis ? "text-primary" : "text-secondary"
      }`}
    >
      {value}
    </Text>
    <Text className="text-secondary text-[10px] uppercase tracking-wide mt-0.5">
      {label}
    </Text>
  </View>
);