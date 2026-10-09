// app/admin/purchasing/[id].tsx
// ==========================================
//   One purchase order, and receiving against it.
//
// Receiving is the only call that turns an order into stock, so the screen is
// built around it: each line shows what is still outstanding, and the form
// defaults to the full remainder so a complete delivery is one tap.
//
// Partial receipts are normal — a supplier splitting a shipment is not an error —
// so a line can be received more than once. The server 409s if a receipt would
// exceed what was ordered, which is a data problem to fix, not a retry.
// ==========================================
import { RequireCapability } from "@/components/admin/RequireCapability";
import { COLORS } from "@/constants";
import {
  useCancelPurchaseOrder,
  usePurchaseOrderQuery,
  useReceivePurchaseOrder,
} from "@/hooks/usePurchasing";
import { useWarehousesQuery } from "@/hooks/useInventory";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import type { BackendPurchaseOrderItem } from "@/config/purchasingApi";

const productIdOf = (item: BackendPurchaseOrderItem) =>
  typeof item.product === "string" ? item.product : item.product._id;
const lineKeyOf = (item: BackendPurchaseOrderItem) => `${productIdOf(item)}::${item.sku ?? ""}`;

// Admin/manager only. Reachable by deep link even when the Buy tab is hidden.
export default function PurchaseOrderDetailRoute() {
  return (
    <RequireCapability capability="purchasing">
      <PurchaseOrderDetail />
    </RequireCapability>
  );
}

function PurchaseOrderDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const { order, isLoading, error, refetch } = usePurchaseOrderQuery(id ?? "");
  const { warehouses } = useWarehousesQuery();
  // The id is an argument, not part of the payload.
  const receive = useReceivePurchaseOrder(id ?? "");
  const cancel = useCancelPurchaseOrder();

  const [warehouseId, setWarehouseId] = useState("");
  const [amounts, setAmounts] = useState<Record<string, string>>({});

  const activeWarehouses = useMemo(
    () => warehouses.filter((w) => w.isActive),
    [warehouses]
  );

  // Receiving is only offered where it can succeed.
  const receivable =
    order?.status === "ordered" || order?.status === "partially_received";

  const lines = (order?.items ?? []).map((item) => {
    const remaining = Math.max(0, item.quantity - item.receivedQty);
    return { item, remaining, productId: productIdOf(item) };
  });

  // Default each line to its remainder, but keep whatever the user has typed.
  const entered = (lineKey: string, remaining: number) => {
    const raw = amounts[lineKey];
    if (raw === undefined) return remaining === 0 ? "" : String(remaining);
    return raw;
  };

  const payload = lines
    .map(({ item, productId, remaining }) => {
      const n = Number(entered(lineKeyOf(item), remaining));
      return {
        productId,
        sku: item.sku ?? undefined,
        quantity: Number.isFinite(n) ? n : 0,
        remaining,
      };
    })
    .filter((line) => line.quantity > 0);

  const canReceive =
    receivable && warehouseId !== "" && payload.length > 0 && !receive.isPending;

  return (
    <View className="flex-1 bg-surface">
      {isLoading && !order ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : error || !order ? (
        <View className="flex-1 items-center justify-center px-8">
          <Text className="text-primary font-bold text-center">
            Could not load this order
          </Text>
          <TouchableOpacity
            onPress={() => refetch()}
            className="mt-4 px-5 py-3 rounded-full bg-primary"
          >
            <Text className="text-white font-bold">Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
          <View className="bg-card p-4 rounded-2xl border border-subtle-border">
            <Text className="text-primary font-bold text-lg">
              {order.orderNumber}
            </Text>
            <Text className="text-secondary text-xs mt-1">
              {typeof order.supplier === "string"
                ? "—"
                : order.supplier.name}
            </Text>
            <Text className="text-secondary text-xs mt-0.5 uppercase tracking-wide">
              {order.status.replace(/_/g, " ")}
            </Text>

            <View className="flex-row justify-between mt-3 pt-3 border-t border-subtle-border">
              <Text className="text-secondary text-sm">Subtotal</Text>
              <Text className="text-primary font-medium">
                ${order.subtotal.toFixed(2)}
              </Text>
            </View>
            <View className="flex-row justify-between mt-1">
              <Text className="text-secondary text-sm">Shipping</Text>
              <Text className="text-primary font-medium">
                ${order.shipping.toFixed(2)}
              </Text>
            </View>
            <View className="flex-row justify-between mt-2">
              <Text className="text-primary font-bold">Total</Text>
              <Text className="text-primary font-bold">
                ${order.total.toFixed(2)}
              </Text>
            </View>
          </View>

          {lines.map(({ item, remaining, productId }) => (
            <View
              key={lineKeyOf(item)}
              className="bg-card p-4 rounded-2xl border border-subtle-border mt-3"
            >
              <View className="flex-row justify-between items-start">
                <Text className="text-primary font-bold flex-1 pr-3">
                  {item.name}
                </Text>
                <Text className="text-primary font-bold">
                  {item.receivedQty}/{item.quantity}
                </Text>
              </View>

              <Text className="text-secondary text-xs mt-1">
                {remaining > 0
                  ? `${remaining} outstanding · ${item.quantity} ordered at $${item.unitCost.toFixed(2)}`
                  : "Fully received"}
              </Text>
              <Text className="text-secondary text-xs">SKU: {item.sku ?? "missing SKU"}</Text>

              {receivable && remaining > 0 ? (
                <TextInput
                  value={entered(lineKeyOf(item), remaining)}
                  onChangeText={(text) =>
                    setAmounts((prev) => ({ ...prev, [lineKeyOf(item)]: text }))
                  }
                  keyboardType="number-pad"
                  placeholder="0"
                  placeholderTextColor={COLORS.secondary}
                  className="bg-subtle border border-subtle-border rounded-xl px-4 py-2 text-primary mt-3"
                />
              ) : null}
            </View>
          ))}

          {receivable ? (
            <View className="mt-4">
              <Text className="text-secondary text-xs font-medium uppercase tracking-wide mb-2">
                Receive into
              </Text>
              <View className="flex-row flex-wrap">
                {activeWarehouses.map((w) => {
                  const selected = warehouseId === w._id;
                  return (
                    <TouchableOpacity
                      key={w._id}
                      onPress={() => setWarehouseId(w._id)}
                      className={`px-3 py-2 rounded-full mr-2 mb-2 ${
                        selected ? "bg-primary" : "bg-subtle"
                      }`}
                    >
                      <Text
                        className={`text-xs font-medium ${
                          selected ? "text-white" : "text-secondary"
                        }`}
                      >
                        {w.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {activeWarehouses.length === 0 ? (
                <Text className="text-secondary text-xs">
                  No active warehouses. Run `npm run seed:warehouses` on the
                  server first.
                </Text>
              ) : null}

              <TouchableOpacity
                onPress={() => {
                  if (!canReceive || !id) return;
                  receive.mutate(
                    {
                      warehouseId,
                      items: payload.map(({ productId: pid, sku, quantity }) => ({
                        productId: pid,
                        sku,
                        quantity,
                      })),
                    },
                    // Reload rather than trust local state: the server owns
                    // receivedQty, and a 409 means the numbers here are stale.
                    { onSuccess: () => refetch() }
                  );
                }}
                disabled={!canReceive}
                className={`mt-2 py-4 rounded-xl items-center ${
                  canReceive ? "bg-primary" : "bg-subtle"
                }`}
              >
                {receive.isPending ? (
                  <ActivityIndicator color={COLORS.white} />
                ) : (
                  <Text
                    className={`font-bold ${
                      canReceive ? "text-white" : "text-secondary"
                    }`}
                  >
                    {payload.length === 0
                      ? "Nothing to receive"
                      : `Receive ${payload.length} line(s)`}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          ) : (
            <Text className="text-secondary text-xs mt-4 text-center">
              {order.status === "received"
                ? "This order is fully received."
                : order.status === "cancelled"
                  ? "This order was cancelled."
                  : "A draft cannot be received against — send it first."}
            </Text>
          )}

          {order.status !== "cancelled" && order.status !== "received" ? (
            <TouchableOpacity
              onPress={() =>
                cancel.mutate(id ?? "", { onSuccess: () => router.back() })
              }
              disabled={cancel.isPending}
              className="mt-6 py-3 items-center"
            >
              <Text className="text-danger text-sm font-medium">
                {cancel.isPending ? "Cancelling…" : "Cancel this order"}
              </Text>
            </TouchableOpacity>
          ) : null}
        </ScrollView>
      )}
    </View>
  );
}
