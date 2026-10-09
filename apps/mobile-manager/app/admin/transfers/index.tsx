// app/admin/transfers/index.tsx
// ==========================================
//   Inter-warehouse transfers.
//
// Only `completed` moves stock. Everything before that is paperwork, so a
// transfer sitting in `draft` or `in_transit` has moved nothing and the screen
// says so rather than implying the goods are already at the destination.
// ==========================================
import { COLORS } from "@/constants";
import { usePermissions } from "@/hooks/usePermissions";
import {
  useSetTransferStatus,
  useTransfersQuery,
} from "@/hooks/usePurchasing";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  RefreshControl,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

// `TransferStatus` is declared in the API module, not re-exported by the hook —
// the hook layer is for behaviour, this is data the screen renders.
import type {
  BackendTransfer,
  TransferStatus,
} from "@/config/purchasingApi";

const STATUSES: { value: TransferStatus; label: string }[] = [
  { value: "draft", label: "Draft" },
  { value: "in_transit", label: "In transit" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

const nameOf = (w: BackendTransfer["fromWarehouse"]) =>
  typeof w === "string" ? "—" : w.name;

const statusTint = (status: TransferStatus) => {
  if (status === "completed") return "bg-success/10";
  if (status === "in_transit") return "bg-warning/10";
  return "bg-subtle";
};

const statusText = (status: TransferStatus) => {
  if (status === "completed") return "text-success";
  if (status === "in_transit") return "text-warning";
  return "text-secondary";
};

/** draft → in_transit → completed. Nothing goes backwards. */
const NEXT: Partial<Record<TransferStatus, TransferStatus>> = {
  draft: "in_transit",
  in_transit: "completed",
};

const ACTION_LABEL: Partial<Record<TransferStatus, string>> = {
  in_transit: "Mark in transit",
  completed: "Mark completed",
};

export default function TransfersScreen() {
  const router = useRouter();
  const { can } = usePermissions();
  const [status, setStatus] = useState<TransferStatus | undefined>();
  const [confirm, setConfirm] = useState<BackendTransfer | null>(null);

  const { transfers, isLoading, isRefetching, error, refetch } =
    useTransfersQuery({ limit: 100, ...(status ? { status } : {}) });

  const setStatusMutation = useSetTransferStatus();
  const next = confirm ? NEXT[confirm.status] : undefined;

  return (
    <View className="flex-1 bg-surface">
      <View className="flex-row items-center px-4 pt-3 pb-2">
        <TouchableOpacity
          onPress={() => router.push("/admin/transfers/new")}
          className="flex-row items-center bg-primary px-4 py-2 rounded-full"
        >
          <Ionicons name="swap-horizontal" size={16} color={COLORS.white} />
          <Text className="text-white text-xs font-bold ml-1">Move stock</Text>
        </TouchableOpacity>

        <View className="flex-1" />

        {/*
          The `transfers` tab is open to warehouse_staff, but managing the
          warehouse list is not — `warehouses` is admin/manager only. This button
          used to render for everyone, so a warehouse_staff member could tap
          through to a screen the server answers with 403. Hidden here, and
          `warehouses.tsx` guards itself for a deep link.
        */}
        {can("warehouses") && (
          <TouchableOpacity
            onPress={() => router.push("/admin/transfers/warehouses")}
            className="flex-row items-center px-3 py-2 rounded-full bg-subtle"
          >
            <Ionicons name="business-outline" size={14} color={COLORS.secondary} />
            <Text className="text-secondary text-xs font-bold ml-1">
              Warehouses
            </Text>
          </TouchableOpacity>
        )}
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

      {isLoading && transfers.length === 0 ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <FlatList
          data={transfers}
          keyExtractor={(item) => item._id}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={() => refetch()}
              tintColor={COLORS.primary}
            />
          }
          contentContainerStyle={{ padding: 16, paddingTop: 4 }}
          ListEmptyComponent={
            <View className="items-center py-12">
              <Ionicons
                name={error ? "alert-circle-outline" : "swap-horizontal-outline"}
                size={40}
                color={COLORS.secondary}
              />
              <Text className="text-secondary mt-3 text-center">
                {error
                  ? "Could not load transfers. Pull down to retry."
                  : "No transfers yet."}
              </Text>
            </View>
          }
          renderItem={({ item }) => {
            const action = NEXT[item.status];
            return (
              <View className="bg-card p-4 rounded-2xl border border-subtle-border mb-3">
                <View className="flex-row justify-between items-start">
                  <View className="flex-1 pr-3">
                    <Text className="text-primary font-bold text-base">
                      {item.reference}
                    </Text>
                    <Text className="text-secondary text-xs mt-0.5">
                      {nameOf(item.fromWarehouse)} →{" "}
                      {nameOf(item.toWarehouse)}
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

                <Text className="text-secondary text-xs mt-2">
                  {item.items
                    .map((line) => `${line.name} · ${line.sku ?? "legacy"} x${line.quantity}`)
                    .join(" · ")}
                </Text>

                {action ? (
                  <TouchableOpacity
                    onPress={() => setConfirm(item)}
                    className="mt-3 pt-3 border-t border-subtle-border"
                  >
                    <Text className="text-primary text-sm font-medium">
                      {ACTION_LABEL[action]}
                    </Text>
                  </TouchableOpacity>
                ) : (
                  <Text className="text-secondary text-[10px] mt-3 pt-3 border-t border-subtle-border">
                    {item.status === "completed"
                      ? "Stock has moved."
                      : "Cancelled — no stock moved."}
                  </Text>
                )}
              </View>
            );
          }}
        />
      )}

      {/*
        Confirming before completing is the whole point. The server guards the
        status change so a double-tap cannot move goods twice, but a 409 after
        the fact still leaves one person looking at stale numbers — so the intent
        is stated before the call, not after the failure.
      */}
      <Modal visible={confirm !== null} animationType="fade" transparent>
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => setConfirm(null)}
          className="flex-1 justify-center bg-scrim/50 px-8"
        >
          <View className="bg-card rounded-2xl p-5">
            <Text className="text-primary font-bold text-lg">
              {next ? ACTION_LABEL[next] : ""}
            </Text>
            <Text className="text-secondary text-sm mt-2">
              {next === "completed"
                ? "This moves the stock between warehouses. It cannot be undone from here."
                : "This marks the goods as on their way. No stock moves yet."}
            </Text>

            <View className="flex-row mt-5">
              <TouchableOpacity
                onPress={() => setConfirm(null)}
                className="flex-1 py-3 rounded-xl bg-subtle items-center mr-2"
              >
                <Text className="text-secondary font-bold">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                disabled={!confirm || !next || setStatusMutation.isPending}
                onPress={() => {
                  if (!confirm || !next) return;
                  setStatusMutation.mutate(
                    { id: confirm._id, status: next },
                    {
                      onSuccess: () => setConfirm(null),
                      // 409 means somebody completed it first: reload rather
                      // than retry, or this screen would fight them for it.
                      onError: () => {
                        setConfirm(null);
                        refetch();
                      },
                    }
                  );
                }}
                className="flex-1 py-3 rounded-xl bg-primary items-center"
              >
                {setStatusMutation.isPending ? (
                  <ActivityIndicator color={COLORS.white} />
                ) : (
                  <Text className="text-white font-bold">Confirm</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}
