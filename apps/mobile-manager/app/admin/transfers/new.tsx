// app/admin/transfers/new.tsx
// ==========================================
//   Move stock between warehouses.
//
// This only records the intention. Nothing moves until the transfer reaches
// `completed`, which is why the form says so — a transfer created here shows up
// in the destination as nothing at all until someone completes it.
// ==========================================
import { COLORS } from "@/constants";
import { useWarehousesQuery } from "@/hooks/useInventory";
import { useCreateTransfer } from "@/hooks/usePurchasing";
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

type Line = { key: string; productId: string; quantity: string };

let lineCounter = 0;
const newLine = (): Line => ({
  key: `line-${lineCounter++}`,
  productId: "",
  quantity: "",
});

export default function NewTransfer() {
  const router = useRouter();
  const { warehouses } = useWarehousesQuery();
  const create = useCreateTransfer();

  const [fromId, setFromId] = useState("");
  const [toId, setToId] = useState("");
  const [lines, setLines] = useState<Line[]>([newLine()]);

  const active = useMemo(
    () => warehouses.filter((w) => w.isActive),
    [warehouses]
  );

  const update = (key: string, patch: Partial<Line>) =>
    setLines((prev) =>
      prev.map((line) => (line.key === key ? { ...line, ...patch } : line))
    );

  const parsed = lines
    .map((line) => ({
      productId: line.productId.trim(),
      quantity: Number(line.quantity),
    }))
    .filter((line) => line.productId !== "" && line.quantity > 0);

  // Same rule as purchase orders: a half-typed line must not silently drop out.
  const complete = lines.filter(
    (line) => line.productId.trim() !== "" && line.quantity.trim() !== ""
  ).length;

  const canSubmit =
    fromId !== "" &&
    toId !== "" &&
    // Sending stock to itself is meaningless, and the server would only 400.
    fromId !== toId &&
    parsed.length > 0 &&
    parsed.length === complete &&
    !create.isPending;

  const submit = () => {
    if (!canSubmit) return;
    create.mutate(
      { fromWarehouseId: fromId, toWarehouseId: toId, items: parsed },
      { onSuccess: () => router.back() }
    );
  };

  const total = parsed.reduce((sum, line) => sum + line.quantity, 0);

  return (
    <ScrollView
      className="flex-1 bg-surface"
      contentContainerStyle={{ padding: 20 }}
      keyboardShouldPersistTaps="handled"
    >
      <Text className="text-secondary text-sm mb-5">
        This records the intention only. Stock moves when the transfer is marked
        completed from the list.
      </Text>

      <Picker label="From" options={active} selected={fromId} onSelect={setFromId} />
      <Picker label="To" options={active} selected={toId} onSelect={setToId} />

      {fromId !== "" && toId !== "" && fromId === toId ? (
        <Text className="text-danger text-xs -mt-2 mb-4">
          Pick two different warehouses.
        </Text>
      ) : null}

      <Text className="text-secondary text-xs font-medium uppercase tracking-wide mt-2 mb-2">
        Items
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
          <TextInput
            value={line.quantity}
            onChangeText={(text) => update(line.key, { quantity: text })}
            placeholder="Quantity"
            placeholderTextColor={COLORS.secondary}
            keyboardType="number-pad"
            className="bg-subtle border border-subtle-border rounded-xl px-4 py-2 text-primary"
          />
        </View>
      ))}

      <TouchableOpacity
        onPress={() => setLines((prev) => [...prev, newLine()])}
        className="flex-row items-center justify-center py-3 rounded-xl border border-dashed border-subtle-border"
      >
        <Text className="text-primary text-sm font-medium">Add a line</Text>
      </TouchableOpacity>

      {complete > parsed.length ? (
        <Text className="text-warning text-xs mt-3">
          {complete - parsed.length} line(s) need a product id and a quantity.
        </Text>
      ) : null}

      <Text className="text-secondary text-xs mt-4">
        {total} unit(s) in total.
      </Text>

      <TouchableOpacity
        onPress={submit}
        disabled={!canSubmit}
        className={`mt-4 py-4 rounded-xl items-center ${
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
            Create transfer
          </Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const Picker = ({
  label,
  options,
  selected,
  onSelect,
}: {
  label: string;
  options: { _id: string; name: string }[];
  selected: string;
  onSelect: (id: string) => void;
}) => (
  <View className="mb-4">
    <Text className="text-secondary text-xs font-medium uppercase tracking-wide mb-2">
      {label}
    </Text>
    <View className="flex-row flex-wrap">
      {options.map((w) => {
        const isSelected = selected === w._id;
        return (
          <TouchableOpacity
            key={w._id}
            onPress={() => onSelect(w._id)}
            className={`px-3 py-2 rounded-full mr-2 mb-2 ${
              isSelected ? "bg-primary" : "bg-subtle"
            }`}
          >
            <Text
              className={`text-xs font-medium ${
                isSelected ? "text-white" : "text-secondary"
              }`}
            >
              {w.name}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  </View>
);