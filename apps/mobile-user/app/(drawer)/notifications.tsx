import Header from "@/components/Header";
import { useMarkNotificationRead, useNotifications } from "@/hooks/useNotifications";
import { useAuth } from "@clerk/clerk-expo";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { ActivityIndicator, FlatList, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { openAuthModal } from "../../hooks/useCart";

export default function NotificationsScreen() {
  const router = useRouter();
  const { isSignedIn } = useAuth();
  const { data, isLoading, isError, refetch } = useNotifications();
  const markRead = useMarkNotificationRead();

  return (
    <SafeAreaView className="flex-1 bg-surface" edges={["top"]}>
      <Header showBack />
      <View className="flex-row items-center justify-between px-5 py-5">
        <Text className="font-jazera text-2xl text-primary">التنبيهات</Text>
        {!!data?.unreadCount && (
          <Text className="font-body text-sm text-muted">غير مقروء: {data.unreadCount}</Text>
        )}
      </View>

      {!isSignedIn ? (
        <View className="flex-1 items-center justify-center px-8">
          <Ionicons name="notifications-outline" size={42} color="#785920" />
          <Text className="mt-4 text-center font-body text-base text-body">سجّل الدخول لمشاهدة التنبيهات.</Text>
          <TouchableOpacity className="mt-5 rounded-xl bg-primary px-6 py-3" onPress={openAuthModal}>
            <Text className="font-body font-bold text-white">تسجيل الدخول</Text>
          </TouchableOpacity>
        </View>
      ) : isLoading ? (
        <ActivityIndicator className="mt-10" color="#785920" />
      ) : isError ? (
        <TouchableOpacity className="mx-5 mt-8 rounded-xl bg-card p-5" onPress={() => refetch()}>
          <Text className="text-center font-body text-body">تعذر تحميل التنبيهات. اضغط لإعادة المحاولة.</Text>
        </TouchableOpacity>
      ) : (
        <FlatList
          data={data?.data ?? []}
          keyExtractor={(item) => item._id}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 32, flexGrow: 1 }}
          ListEmptyComponent={
            <View className="flex-1 items-center justify-center py-20">
              <Ionicons name="notifications-off-outline" size={36} color="#9ca3af" />
              <Text className="mt-3 font-body text-muted">لا توجد تنبيهات جديدة.</Text>
            </View>
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              activeOpacity={0.8}
              className={`mb-3 rounded-2xl border p-4 ${item.isRead ? "border-primary-100 bg-card" : "border-primary/30 bg-primary/5"}`}
              onPress={async () => {
                if (!item.isRead) await markRead.mutateAsync(item._id).catch(() => undefined);
                if (item.productId) router.push(`/product/${item.productId}` as any);
              }}
            >
              <View className="flex-row items-start gap-3">
                <Ionicons
                  name={item.type === "new_product" ? "sparkles-outline" : "pricetag-outline"}
                  size={21}
                  color="#785920"
                />
                <View className="flex-1">
                  <View className="flex-row items-center justify-between">
                    <Text className="flex-1 text-right font-body font-bold text-body">{item.title}</Text>
                    {!item.isRead && <View className="ml-2 h-2 w-2 rounded-full bg-accent" />}
                  </View>
                  <Text className="mt-2 text-right font-body leading-6 text-muted">{item.body}</Text>
                  <Text className="mt-2 text-right text-xs text-muted">
                    {new Date(item.createdAt).toLocaleDateString()}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </SafeAreaView>
  );
}
