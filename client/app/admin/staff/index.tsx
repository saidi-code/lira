// app/admin/staff/index.tsx
// ==========================================
//   Who can do what — admin only.
//
// A role set here lasts only until the next sign-in, because the Clerk webhook
// re-syncs `role` from `publicMetadata` and a metadata role that is present
// overwrites this. That is stated on the screen rather than left to be
// discovered when a change silently reverts.
// ==========================================
import { RequireCapability } from "@/components/admin/RequireCapability";
import { COLORS } from "@/constants";
import { USER_ROLES, type UserRole } from "@/constants/roles";
import { useAdminUsers, useSetUserRole } from "@/hooks/useAdmin";
import { Ionicons } from "@expo/vector-icons";
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

import type { AdminUser } from "@/config/adminApi";

/** `cashier` is listed because it is assignable — it grants nothing today. */
const ROLE_NOTE: Partial<Record<UserRole, string>> = {
  cashier: "grants no access today",
};

// Admin-only. `href: null` hides the tab from a manager but does not unregister
// the route, so the guard is on the screen as well.
export default function StaffRoute() {
  return (
    <RequireCapability capability="users">
      <StaffScreen />
    </RequireCapability>
  );
}

function StaffScreen() {
  const { users, isLoading, isRefetching, error, refetch } = useAdminUsers({
    limit: 100,
  });
  const setRole = useSetUserRole();

  const [editing, setEditing] = useState<AdminUser | null>(null);

  return (
    <View className="flex-1 bg-surface">
      {isLoading && users.length === 0 ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <FlatList
          data={users}
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
            <View className="bg-primary/10 border border-subtle-border rounded-2xl p-4 mb-4">
              <Text className="text-primary text-xs font-medium">
                A role set here is overwritten on the next sign-in
              </Text>
              <Text className="text-secondary text-xs mt-1">
                The Clerk webhook syncs the role from public metadata, so set it
                there too or this change will revert.
              </Text>
            </View>
          }
          ListEmptyComponent={
            <View className="items-center py-12">
              <Ionicons
                name={error ? "alert-circle-outline" : "people-outline"}
                size={40}
                color={COLORS.secondary}
              />
              <Text className="text-secondary mt-3 text-center">
                {error
                  ? "Could not load users. Pull down to retry."
                  : "No users yet."}
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => setEditing(item)}
              className="bg-card p-4 rounded-2xl border border-subtle-border mb-3 flex-row items-center"
            >
              <View className="w-10 h-10 rounded-full bg-subtle items-center justify-center mr-3">
                <Text className="text-primary font-bold">
                  {(item.name || "?").charAt(0).toUpperCase()}
                </Text>
              </View>

              <View className="flex-1">
                <Text className="text-primary font-bold text-sm">
                  {item.name}
                </Text>
                <Text className="text-secondary text-xs">
                  {item.email ?? "(phone-only)"}
                </Text>
              </View>

              <View className="bg-subtle px-2 py-1 rounded-full">
                <Text className="text-secondary text-[10px] font-bold uppercase">
                  {item.role}
                </Text>
              </View>
            </TouchableOpacity>
          )}
        />
      )}

      <Modal visible={editing !== null} animationType="slide" transparent>
        <View className="flex-1 justify-end bg-scrim/50">
          <View className="bg-card rounded-t-2xl p-5">
            <Text className="text-lg font-bold text-primary">
              {editing?.name}
            </Text>
            <Text className="text-secondary text-xs mt-0.5">
              {editing?.email ?? "(phone-only)"}
            </Text>

            {USER_ROLES.map((role) => {
              const selected = editing?.role === role;
              return (
                <TouchableOpacity
                  key={role}
                  onPress={() => {
                    if (!editing || selected) return;
                    setRole.mutate(
                      { userId: editing._id, role },
                      { onSuccess: () => setEditing(null) }
                    );
                  }}
                  disabled={setRole.isPending}
                  className={`p-4 rounded-xl mt-2 flex-row justify-between items-center ${
                    selected ? "bg-primary/10" : "bg-subtle"
                  }`}
                >
                  <View className="flex-1 pr-3">
                    <Text
                      className={`font-medium capitalize ${
                        selected ? "text-primary font-bold" : "text-secondary"
                      }`}
                    >
                      {role}
                    </Text>
                    {ROLE_NOTE[role] ? (
                      <Text className="text-secondary text-[10px] mt-0.5">
                        {ROLE_NOTE[role]}
                      </Text>
                    ) : null}
                  </View>
                  {selected && (
                    <Ionicons
                      name="checkmark-circle"
                      size={20}
                      color={COLORS.primary}
                    />
                  )}
                </TouchableOpacity>
              );
            })}

            <TouchableOpacity
              onPress={() => setEditing(null)}
              className="mt-4 py-3 rounded-xl bg-subtle items-center"
            >
              <Text className="text-secondary font-bold">Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}