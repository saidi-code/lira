// app/settings/password.tsx — change password (Clerk)
import { useUser } from "@clerk/clerk-expo";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import Header from "@/components/Header";
import { COLORS } from "@/constants";
import { showErrorToast, showSuccessToast } from "@/constants/utility";

const PasswordField = ({
  label,
  value,
  onChangeText,
  placeholder,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder: string;
}) => (
  <View className="mb-4">
    <Text className="text-right font-medium font-body text-primary mb-1">
      {label}
    </Text>
    <View
      className="my-2 flex-row items-center rounded-md overflow-hidden bg-card"
      style={{
        shadowColor: COLORS.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        outlineStyle: "solid",
        outlineWidth: 1,
        outlineColor: COLORS.primary,
        outlineOffset: 2,
      }}
    >
      <View className="p-4 pr-3">
        <Ionicons name="lock-closed-outline" size={18} color={COLORS.primary} />
      </View>
      <TextInput
        className="flex-1 py-4 pr-2 text-right text-base font-medium font-tajwal text-body"
        placeholder={placeholder}
        placeholderTextColor="#a8a29e"
        value={value}
        onChangeText={onChangeText}
        secureTextEntry
        textAlign="right"
        returnKeyType="done"
      />
    </View>
  </View>
);

const ChangePasswordScreen = () => {
  const router = useRouter();
  const { user, isLoaded } = useUser();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);

  const hasPassword = user?.passwordEnabled ?? false;

  const handleSave = async () => {
    if (!isLoaded || !user) return;

    if (hasPassword && !currentPassword) {
      showErrorToast("أدخل كلمة المرور الحالية");
      return;
    }
    if (newPassword.length < 8) {
      showErrorToast("كلمة المرور الجديدة يجب أن تكون 8 أحرف على الأقل");
      return;
    }
    if (newPassword !== confirmPassword) {
      showErrorToast("كلمتا المرور غير متطابقتين");
      return;
    }

    setSaving(true);
    try {
      await user.updatePassword({
        ...(hasPassword ? { currentPassword } : {}),
        newPassword,
      });
      showSuccessToast("تم تغيير كلمة المرور بنجاح");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      router.back();
    } catch (error: any) {
      const message =
        error?.errors?.[0]?.longMessage ||
        error?.errors?.[0]?.message ||
        "تعذّر تغيير كلمة المرور، حاول مرة أخرى";
      showErrorToast(message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView className="bg-surface flex-1" edges={["top"]}>
      <Header showBack />
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 48 }}
        >
          <View className="justify-center items-center gap-2 mt-8 mb-6">
            <Text
              className="text-center text-body text-4xl leading-[43px] font-bold font-jazera"
            >
              تغيير كلمة المرور
            </Text>
            <Text className="text-center text-primary text-base font-medium font-tajwal uppercase tracking-wider">
              حافظ على أمان حسابك
            </Text>
          </View>

          <View className="mx-4">
            {hasPassword && (
              <PasswordField
                label="كلمة المرور الحالية"
                value={currentPassword}
                onChangeText={setCurrentPassword}
                placeholder="أدخل كلمة المرور الحالية"
              />
            )}
            <PasswordField
              label="كلمة المرور الجديدة"
              value={newPassword}
              onChangeText={setNewPassword}
              placeholder="8 أحرف على الأقل"
            />
            <PasswordField
              label="تأكيد كلمة المرور الجديدة"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="أعد إدخال كلمة المرور الجديدة"
            />

            <TouchableOpacity
              activeOpacity={0.85}
              disabled={saving}
              onPress={handleSave}
              className={`mt-4 p-4 rounded-lg flex-row justify-center gap-2 items-center bg-primary-solid border border-primary/10 ${
                saving ? "opacity-70" : ""
              }`}
            >
              {saving ? (
                <ActivityIndicator color="white" />
              ) : (
                <>
                  <Ionicons name="checkmark-circle-outline" size={20} color="white" />
                  <Text className="font-body text-white font-semibold text-lg">
                    حفظ التغييرات
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default ChangePasswordScreen;