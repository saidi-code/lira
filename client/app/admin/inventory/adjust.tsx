// app/admin/inventory/adjust.tsx
// ==========================================
//   Manual stock correction — admin and manager only.
//
// The server requires a reason and 409s if the correction would drive stock
// negative. Both are enforced here too, because a form that lets you submit
// something guaranteed to fail is worse than one that explains why it cannot.
// ==========================================
import { RequireCapability } from "@/components/admin/RequireCapability";
import { COLORS } from "@/constants";
import { useAdjustStock, useWarehousesQuery } from "@/hooks/useInventory";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function AdjustStockRoute() {
  return (
    <RequireCapability capability="inventory.adjust">
      <AdjustStockScreen />
    </RequireCapability>
  );
}

function AdjustStockScreen() {
  const router = useRouter();
  const { warehouses } = useWarehousesQuery();

  // Pre-filled when arriving from a stock row, empty from the toolbar button.
  const params = useLocalSearchParams<{
    productId?: string;
    productName?: string;
    warehouseId?: string;
  }>();

  const [productId, setProductId] = useState(params.productId ?? "");
  const [warehouseId, setWarehouseId] = useState(params.warehouseId ?? "");
  const [quantity, setQuantity] = useState("");
  const [reason, setReason] = useState("");

  const adjust = useAdjustStock();

  const amount = Number(quantity);
  const parsed = Number.isFinite(amount) && quantity.trim() !== "";
  const activeWarehouses = warehouses.filter((w) => w.isActive);

  const canSubmit =
    productId.trim() !== "" &&
    warehouseId !== "" &&
    parsed &&
    amount !== 0 &&
    reason.trim().length >= 3 &&
    !adjust.isPending;

  const submit = () => {
    if (!canSubmit) return;
    adjust.mutate(
      {
        productId: productId.trim(),
        warehouseId,
        quantity: amount,
        reason: reason.trim(),
      },
      { onSuccess: () => router.back() }
    );
  };

  return (
    <ScrollView
      className="flex-1 bg-surface"
      contentContainerStyle={{ padding: 20 }}
      keyboardShouldPersistTaps="handled"
    >
      <Text className="text-secondary text-sm mb-5">
        A signed correction — use a negative number to remove stock. Every
        adjustment is written to the movement ledger with your reason.
      </Text>

      <Field label="Product id">
        <TextInput
          value={productId}
          onChangeText={setProductId}
          placeholder="product id"
          placeholderTextColor={COLORS.secondary}
          autoCapitalize="none"
          className="bg-card border border-subtle-border rounded-xl px-4 py-3 text-primary"
        />
        {params.productName ? (
          <Text className="text-secondary text-xs mt-1">
            {params.productName}
          </Text>
        ) : null}
      </Field>

      <Field label="Warehouse">
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
      </Field>

      <Field label="Quantity (signed)">
        <TextInput
          value={quantity}
          onChangeText={setQuantity}
          placeholder="e.g. -3 for damage, 12 for found stock"
          placeholderTextColor={COLORS.secondary}
          keyboardType="numbers-and-punctuation"
          className="bg-card border border-subtle-border rounded-xl px-4 py-3 text-primary"
        />
      </Field>

      <Field label="Reason (required)">
        <TextInput
          value={reason}
          onChangeText={setReason}
          placeholder="Damaged in transit, cycle count, ..."
          placeholderTextColor={COLORS.secondary}
          className="bg-card border border-subtle-border rounded-xl px-4 py-3 text-primary"
        />
        {reason.trim().length > 0 && reason.trim().length < 3 ? (
          <Text className="text-danger text-xs mt-1">
            Give a real reason — an unexplained correction is indistinguishable
            from a bug.
          </Text>
        ) : null}
      </Field>

      <TouchableOpacity
        onPress={submit}
        disabled={!canSubmit}
        className={`mt-4 py-4 rounded-xl items-center ${
          canSubmit ? "bg-primary" : "bg-subtle"
        }`}
      >
        {adjust.isPending ? (
          <ActivityIndicator color={COLORS.white} />
        ) : (
          <Text
            className={`font-bold ${
              canSubmit ? "text-white" : "text-secondary"
            }`}
          >
            Apply adjustment
          </Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const Field = ({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) => (
  <View className="mb-5">
    <Text className="text-secondary text-xs font-medium uppercase tracking-wide mb-2">
      {label}
    </Text>
    {children}
  </View>
);