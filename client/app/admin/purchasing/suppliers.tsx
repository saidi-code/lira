// app/admin/purchasing/suppliers.tsx
// ==========================================
//   Suppliers, and the form to add one.
//
// An order cannot be raised without a supplier, so this is reachable from the
// "New order" screen's empty state rather than being a separate chore.
// ==========================================
import { COLORS } from "@/constants";
import { useCreateSupplier, useSuppliersQuery } from "@/hooks/usePurchasing";
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function SuppliersScreen() {
  const { suppliers, isLoading, isRefetching, error, refetch } =
    useSuppliersQuery({ limit: 100 });
  const create = useCreateSupplier();

  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  const canSubmit = name.trim().length >= 2 && !create.isPending;

  const submit = () => {
    if (!canSubmit) return;
    create.mutate(
      {
        name: name.trim(),
        ...(email.trim() !== "" ? { email: email.trim() } : {}),
        ...(phone.trim() !== "" ? { phone: phone.trim() } : {}),
      },
      {
        onSuccess: () => {
          setOpen(false);
          setName("");
          setEmail("");
          setPhone("");
        },
      }
    );
  };

  return (
    <View className="flex-1 bg-surface">
      <View className="flex-row justify-end px-4 pt-3 pb-2">
        <TouchableOpacity
          onPress={() => setOpen(true)}
          className="flex-row items-center bg-primary px-4 py-2 rounded-full"
        >
          <Ionicons name="add" size={16} color={COLORS.white} />
          <Text className="text-white text-xs font-bold ml-1">Add</Text>
        </TouchableOpacity>
      </View>

      {isLoading && suppliers.length === 0 ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <FlatList
          data={suppliers}
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
                name={error ? "alert-circle-outline" : "business-outline"}
                size={40}
                color={COLORS.secondary}
              />
              <Text className="text-secondary mt-3 text-center">
                {error
                  ? "Could not load suppliers. Pull down to retry."
                  : "No suppliers yet. Add one to raise a purchase order."}
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <View className="bg-card p-4 rounded-2xl border border-subtle-border mb-3">
              <View className="flex-row justify-between items-start">
                <Text className="text-primary font-bold text-base flex-1 pr-3">
                  {item.name}
                </Text>
                {!item.isActive && (
                  <View className="bg-subtle px-2 py-1 rounded-full">
                    <Text className="text-secondary text-[10px] font-bold uppercase">
                      Inactive
                    </Text>
                  </View>
                )}
              </View>
              {item.email ? (
                <Text className="text-secondary text-xs mt-1">{item.email}</Text>
              ) : null}
              {item.phone ? (
                <Text className="text-secondary text-xs mt-0.5">{item.phone}</Text>
              ) : null}
            </View>
          )}
        />
      )}

      <Modal visible={open} animationType="slide" transparent>
        <View className="flex-1 justify-end bg-scrim/50">
          <View className="bg-card rounded-t-2xl p-5">
            <Text className="text-lg font-bold text-primary mb-4">
              New supplier
            </Text>

            <ScrollView keyboardShouldPersistTaps="handled">
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="Name"
                placeholderTextColor={COLORS.secondary}
                className="bg-subtle border border-subtle-border rounded-xl px-4 py-3 text-primary mb-3"
              />
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="Email (optional)"
                placeholderTextColor={COLORS.secondary}
                autoCapitalize="none"
                keyboardType="email-address"
                className="bg-subtle border border-subtle-border rounded-xl px-4 py-3 text-primary mb-3"
              />
              <TextInput
                value={phone}
                onChangeText={setPhone}
                placeholder="Phone (optional)"
                placeholderTextColor={COLORS.secondary}
                keyboardType="phone-pad"
                className="bg-subtle border border-subtle-border rounded-xl px-4 py-3 text-primary mb-4"
              />
            </ScrollView>

            <View className="flex-row">
              <TouchableOpacity
                onPress={() => setOpen(false)}
                className="flex-1 py-3 rounded-xl bg-subtle items-center mr-2"
              >
                <Text className="text-secondary font-bold">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={submit}
                disabled={!canSubmit}
                className={`flex-1 py-3 rounded-xl items-center ${
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
                    Save
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}