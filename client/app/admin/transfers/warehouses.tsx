// app/admin/transfers/warehouses.tsx
// ==========================================
//   Warehouses, and which one is the default.
//
// Read-only apart from "make default" — the server owns creation, and
// `npm run seed:warehouses` is the supported way to add one. This screen says so
// rather than offering a form that would have to be undone.
// ==========================================
import { COLORS } from "@/constants";
import { useSetDefaultWarehouse, useWarehousesQuery } from "@/hooks/useInventory";
import { Ionicons } from "@expo/vector-icons";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function WarehousesScreen() {
  const { warehouses, isLoading, isRefetching, error, refetch } =
    useWarehousesQuery();
  const setDefault = useSetDefaultWarehouse();

  return (
    <View className="flex-1 bg-surface">
      {isLoading && warehouses.length === 0 ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <FlatList
          data={warehouses}
          keyExtractor={(item) => item._id}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={() => refetch()}
              tintColor={COLORS.primary}
            />
          }
          contentContainerStyle={{ padding: 16 }}
          ListHeaderComponent={
            warehouses.length === 0 && !error ? (
              <View className="items-center py-12">
                <Ionicons name="business-outline" size={40} color={COLORS.secondary} />
                <Text className="text-secondary mt-3 text-center">
                  No warehouses yet.
                </Text>
                <Text className="text-secondary text-xs mt-2 text-center">
                  Run `npm run seed:warehouses` on the server to add them.
                </Text>
              </View>
            ) : null
          }
          ListEmptyComponent={
            error ? (
              <View className="items-center py-12">
                <Ionicons
                  name="alert-circle-outline"
                  size={40}
                  color={COLORS.secondary}
                />
                <Text className="text-secondary mt-3 text-center">
                  Could not load warehouses. Pull down to retry.
                </Text>
              </View>
            ) : null
          }
          renderItem={({ item }) => (
            <View className="bg-card p-4 rounded-2xl border border-subtle-border mb-3">
              <View className="flex-row justify-between items-start">
                <View className="flex-1 pr-3">
                  <Text className="text-primary font-bold text-base">
                    {item.name}
                  </Text>
                  <Text className="text-secondary text-xs mt-0.5">
                    {item.code}
                  </Text>
                </View>

                {item.isDefault ? (
                  <View className="bg-primary/10 px-2 py-1 rounded-full">
                    <Text className="text-primary text-[10px] font-bold uppercase">
                      Default
                    </Text>
                  </View>
                ) : null}
              </View>

              {!item.isActive && (
                <Text className="text-secondary text-[10px] mt-1 uppercase">
                  Inactive
                </Text>
              )}

              {item.address ? (
                <Text className="text-secondary text-xs mt-2">
                  {[
                    item.address.street,
                    item.address.city,
                    item.address.state,
                    item.address.zipCode,
                  ]
                    .filter(Boolean)
                    .join(", ")}
                </Text>
              ) : null}

              {!item.isDefault && item.isActive ? (
                <TouchableOpacity
                  onPress={() => setDefault.mutate(item._id)}
                  disabled={setDefault.isPending}
                  className="mt-3 pt-3 border-t border-subtle-border"
                >
                  <Text className="text-primary text-sm font-medium">
                    Make default
                  </Text>
                </TouchableOpacity>
              ) : null}
            </View>
          )}
        />
      )}
    </View>
  );
}