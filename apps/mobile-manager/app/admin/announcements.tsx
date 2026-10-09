import { RequireCapability } from "@/components/admin/RequireCapability";
import { apiClient } from "@/config/api";
import { useAuth } from "@clerk/clerk-expo";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { ActivityIndicator, Alert, ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";

function AnnouncementComposer() {
  const { getToken } = useAuth();
  const [type, setType] = useState<"promotion" | "new_product">("promotion");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [productId, setProductId] = useState("");
  const send = useMutation({
    mutationFn: async () => {
      const token = await getToken();
      const response = await apiClient.post("/notifications/broadcast", {
        type,
        title: title.trim(),
        body: body.trim(),
        ...(type === "new_product" ? { productId: productId.trim() } : {}),
      }, { headers: { Authorization: `Bearer ${token}` } });
      return response.data;
    },
    onSuccess: (result) => {
      Alert.alert("Notification sent", `Saved for customers. Expo accepted ${result.delivery.accepted} push notifications.`);
      setTitle("");
      setBody("");
      setProductId("");
    },
    onError: (error: any) => Alert.alert("Could not send", error?.response?.data?.message ?? "Please try again."),
  });

  return (
    <ScrollView className="flex-1 bg-surface px-5 pt-6" keyboardShouldPersistTaps="handled">
      <Text className="mb-2 text-2xl font-bold text-primary">Customer announcements</Text>
      <Text className="mb-6 text-muted">Send a promotion or announce a new product to customer devices.</Text>
      <View className="mb-4 flex-row gap-3">
        {(["promotion", "new_product"] as const).map((value) => (
          <TouchableOpacity key={value} onPress={() => setType(value)} className={`rounded-xl px-4 py-3 ${type === value ? "bg-primary" : "bg-card"}`}>
            <Text className={type === value ? "text-white" : "text-body"}>{value === "promotion" ? "Promotion" : "New product"}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <TextInput value={title} onChangeText={setTitle} placeholder="Notification title" maxLength={120} className="mb-3 rounded-xl bg-card px-4 py-3 text-body" />
      <TextInput value={body} onChangeText={setBody} placeholder="Message for customers" maxLength={500} multiline className="mb-3 min-h-28 rounded-xl bg-card px-4 py-3 text-body" />
      {type === "new_product" && <TextInput value={productId} onChangeText={setProductId} placeholder="Active product ID" autoCapitalize="none" className="mb-3 rounded-xl bg-card px-4 py-3 text-body" />}
      <TouchableOpacity
        disabled={send.isLoading || !title.trim() || !body.trim() || (type === "new_product" && !productId.trim())}
        onPress={() => send.mutate()}
        className="mt-2 items-center rounded-xl bg-primary px-5 py-4 disabled:opacity-50"
      >
        {send.isLoading ? <ActivityIndicator color="white" /> : <Text className="font-bold text-white">Send to customers</Text>}
      </TouchableOpacity>
    </ScrollView>
  );
}

export default function AnnouncementsScreen() {
  return <RequireCapability capability="announcements"><AnnouncementComposer /></RequireCapability>;
}
