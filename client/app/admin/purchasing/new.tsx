// app/admin/purchasing/new.tsx
// ==========================================
//   Raise a purchase order.
//
// Products are typed as ids on purpose: the server validates the product and
// stores the unit cost that was entered, so an autocomplete guessing a price
// would be another way to order at the wrong number.
// ==========================================
import { COLORS } from "@/constants";
import { useCreatePurchaseOrder, useSuppliersQuery } from "@/hooks/usePurchasing";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

type Line = {
  key: string;
  productId: string;
  quantity: string;
  unitCost: string;
};

let lineCounter = 0;
const newLine = (): Line => ({
  key: `line-${lineCounter++}`,
  productId: "",
  quantity: "",
  unitCost: "",
});

export default function NewPurchaseOrder() {
  const router = useRouter();
  const { suppliers } = useSuppliersQuery({ active: true });
  const create = useCreatePurchaseOrder();

  const [supplierId, setSupplierId] = useState("");
  const [shipping, setShipping] = useState("");
  const [lines, setLines] = useState<Line[]>([newLine()]);

  const activeSuppliers = useMemo(
    () => suppliers.filter((s) => s.isActive),
    [suppliers]
  );

  const update = (key: string, patch: Partial<Line>) =>
    setLines((prev) =>
      prev.map((line) => (line.key === key ? { ...line, ...patch } : line))
    );

  const parsed = lines
    .map((line) => ({
      productId: line.productId.trim(),
      quantity: Number(line.quantity),
      unitCost: Number(line.unitCost),
    }))
    .filter(
      (line) =>
        line.productId !== "" &&
        Number.isFinite(line.quantity) &&
        Number.isFinite(line.unitCost) &&
        line.quantity > 0 &&
        line.unitCost >= 0
    );

  // Only complete lines count, so a half-typed line cannot silently vanish.
  const complete = lines.filter(
    (line) => line.productId.trim() !== "" && line.quantity.trim() !== ""
  ).length;

  const shippingCost = Number(shipping);
  const subtotal = parsed.reduce(
    (sum, line) => sum + line.quantity * line.unitCost,
    0
  );

  const canSubmit =
    supplierId !== "" &&
    parsed.length > 0 &&
    parsed.length === complete &&
    Number.isFinite(shippingCost) &&
    shippingCost >= 0 &&
    !create.isPending;

  const submit = () => {
    if (!canSubmit) return;
    create.mutate(
      {
        supplierId,
        items: parsed,
        ...(shipping.trim() !== "" ? { shipping: shippingCost } : {}),
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
      <Text className="text-secondary text-xs font-medium uppercase tracking-wide mb-2">
        Supplier
      </Text>
      <View className="flex-row flex-wrap mb-2">
        {activeSuppliers.map((s) => {
          const selected = supplierId === s._id;
          return (
            <TouchableOpacity
              key={s._id}
              onPress={() => setSupplierId(s._id)}
              className={`px-3 py-2 rounded-full mr-2 mb-2 ${
                selected ? "bg-primary" : "bg-subtle"
              }`}
            >
              <Text
                className={`text-xs font-medium ${
                  selected ? "text-white" : "text-secondary"
                }`}
              >
                {s.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {activeSuppliers.length === 0 ? (
        <Text className="text-secondary text-xs mb-5">
          No active suppliers. Add one on the Suppliers screen first.
        </Text>
      ) : null}

      <Text className="text-secondary text-xs font-medium uppercase tracking-wide mt-3 mb-2">
        Lines
      </Text>

      {lines.map((line, index) => (
        <View
          key={line.key}
          className="bg-card border border-subtle-border rounded-2xl p-4 mb-3"
        >
          <View className="flex-row justify-between items-center mb-2">
            <Text className="text-secondary text-xs font-bold uppercase">
              Line {index + 1}
            </Text>
            {lines.length > 1 && (
              <TouchableOpacity
                onPress={() =>
                  setLines((prev) => prev.filter((l) => l.key !== line.key))
                }
              >
                <Text className="text-danger text-xs font-medium">Remove</Text>
              </TouchableOpacity>
            )}
          </View>

          <TextInput
            value={line.productId}
            onChangeText={(text) => update(line.key, { productId: text })}
            placeholder="Product id"
            placeholderTextColor={COLORS.secondary}
            autoCapitalize="none"
            className="bg-subtle border border-subtle-border rounded-xl px-4 py-2 text-primary mb-2"
          />

          <View className="flex-row">
            <TextInput
              value={line.quantity}
              onChangeText={(text) => update(line.key, { quantity: text })}
              placeholder="Qty"
              placeholderTextColor={COLORS.secondary}
              keyboardType="number-pad"
              className="flex-1 bg-subtle border border-subtle-border rounded-xl px-4 py-2 text-primary mr-2"
            />
            <TextInput
              value={line.unitCost}
              onChangeText={(text) => update(line.key, { unitCost: text })}
              placeholder="Unit cost"
              placeholderTextColor={COLORS.secondary}
              keyboardType="decimal-pad"
              className="flex-1 bg-subtle border border-subtle-border rounded-xl px-4 py-2 text-primary"
            />
          </View>
        </View>
      ))}

      <TouchableOpacity
        onPress={() => setLines((prev) => [...prev, newLine()])}
        className="flex-row items-center justify-center py-3 rounded-xl border border-dashed border-subtle-border"
      >
        <Text className="text-primary text-sm font-medium">Add a line</Text>
      </TouchableOpacity>

      <Text className="text-secondary text-xs font-medium uppercase tracking-wide mt-6 mb-2">
        Shipping
      </Text>
      <TextInput
        value={shipping}
        onChangeText={setShipping}
        placeholder="0.00"
        placeholderTextColor={COLORS.secondary}
        keyboardType="decimal-pad"
        className="bg-card border border-subtle-border rounded-xl px-4 py-3 text-primary"
      />

      <View className="flex-row justify-between mt-6 mb-2">
        <Text className="text-secondary text-sm">Subtotal</Text>
        <Text className="text-primary font-medium">${subtotal.toFixed(2)}</Text>
      </View>
      <View className="flex-row justify-between mb-4">
        <Text className="text-primary font-bold">Total</Text>
        <Text className="text-primary font-bold">
          ${(subtotal + (Number.isFinite(shippingCost) ? shippingCost : 0)).toFixed(2)}
        </Text>
      </View>

      {complete > parsed.length ? (
        <Text className="text-warning text-xs mb-3">
          {complete - parsed.length} line(s) need a quantity, a unit cost and a
          valid product id.
        </Text>
      ) : null}

      <TouchableOpacity
        onPress={submit}
        disabled={!canSubmit}
        className={`py-4 rounded-xl items-center ${
          canSubmit ? "bg-primary" : "bg-subtle"
        }`}
      >
        {create.isPending ? (
          <ActivityIndicator color={COLORS.white} />
        ) : (
          <Text
            className={`font-bold ${
              canSubmit ? "text-white" : "text-secondary"
            }`}
          >
            Create order
          </Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}