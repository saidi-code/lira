import Header from "@/components/Header";
import { COLORS } from "@/constants";
import { Feather, Fontisto, Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { Switch, Text, TouchableOpacity, View } from "react-native";
import { ScrollView } from "react-native-gesture-handler";
import { SafeAreaView } from "react-native-safe-area-context";
import { useSettings } from "@/context/SettingsContext";
import { useTranslation } from "@/hooks/useTranslation";
const Settings = () => {
  const router = useRouter();
  // Language / currency / theme rows read the saved preference instead of
  // hardcoding "العربية" / "د.ت" / "فاتح" (AGENT.md §3.6.2, §7 i18n).
  const { currencySymbol, languageLabel, settings, setPhoneNotifications, setEmailNotifications } = useSettings();
  const { t } = useTranslation();
  return (
    <SafeAreaView className="bg-surface  flex-1" edges={["top"]}>
      <Header showBack />
      <ScrollView showsVerticalScrollIndicator={false}>
        <View className="justify-center items-center gap-2 mt-8 mb-6">
          <Text
            className="text-center text-body text-4xl 
              leading-[43px] font-bold font-jazera"
          >
            الإعدادات
          </Text>
        </View>
        <View className="mx-4">
          <View className="mb-6">
            <View className="border-r-2 border-r-primary-700 mb-4">
              <Text
                className="font-tajwal mr-4 text-2xl
                     text-primary font-bold text-right"
              >
                إعدادات الحساب
              </Text>
            </View>
            <View className=" bg-card rounded-xl shadow">
              <TouchableOpacity
                onPress={() => router.push("/profile" as any)}
                className="flex-row justify-end items-center gap-6 p-4 border-b border-b-primary-100"
              >
                <Text className="text-lg font-body font-meduim">
                  تعديل الملف الشخصي
                </Text>
                <Feather name="user" size={16} color={COLORS.primary} />
              </TouchableOpacity>
              <View className="flex-row justify-end items-center gap-6 p-4 border-b border-b-primary-100">
                <Text className="text-lg font-body font-meduim">
                  تغيير كلمة المرور
                </Text>
                <Fontisto name="locked" size={16} color={COLORS.primary} />
              </View>
              <View className="flex-row justify-end items-center gap-6 p-4 border-b border-b-primary-100">
                <Text className="text-lg font-body font-meduim">
                  عناوين الشحن
                </Text>
                <Ionicons
                  name="location-outline"
                  size={16}
                  color={COLORS.primary}
                />
              </View>
            </View>
          </View>
          <View className="mb-6">
            <View className="border-r-2 border-r-primary-700 mb-4">
              <Text
                className="font-tajwal mr-4 text-2xl
                     text-primary font-bold text-right"
              >
                التنبيهات
              </Text>
            </View>
            <View className=" bg-card rounded-xl shadow">
              <View className="flex-row items-center justify-between">
                <Switch
                  trackColor={{ false: COLORS.surface, true: COLORS.primary }}
                  // thumbColor={isEnabled ? "#f5dd4b" : "#f4f3f4"}
                  ios_backgroundColor="#3e3e3e"
                  onValueChange={setPhoneNotifications}
                  value={settings.phoneNotifications}
                />
                <View className="flex-row justify-end items-center gap-6 p-4 border-b border-b-primary-100">
                  <Text className="text-lg font-body font-meduim">
                    تنبيهات الهاتف
                  </Text>
                  <Ionicons
                    name="notifications-outline"
                    size={16}
                    color={COLORS.primary}
                  />
                </View>
              </View>
              <View className="flex-row items-center justify-between">
                <Switch
                  trackColor={{ false: COLORS.surface, true: COLORS.primary }}
                  // thumbColor={isEnabled ? "#f5dd4b" : "#f4f3f4"}
                  ios_backgroundColor="#3e3e3e"
                  onValueChange={setEmailNotifications}
                  value={settings.emailNotifications}
                />
                <View className="flex-row justify-end items-center gap-6 p-4 border-b border-b-primary-100">
                  <Text className="text-lg font-body font-meduim">
                    تحديثات البريد الإلكتروني
                  </Text>
                  <Ionicons
                    name="mail-outline"
                    size={16}
                    color={COLORS.primary}
                  />
                </View>
              </View>
            </View>
          </View>
          <View className="mb-20">
            <View className="border-r-2 border-r-primary-700 mb-4">
              <Text
                className="font-tajwal mr-4 text-2xl
                     text-primary font-bold text-right"
              >
                التفضيلات
              </Text>
            </View>
            <View className=" bg-card rounded-xl shadow">
              <View className="flex-row items-center justify-between ps-2">
                <Text className="font-tajwal font-medium text-primary">
                  {languageLabel}
                </Text>
                <View className="flex-row justify-end items-center gap-6 p-4 border-b border-b-primary-100">
                  <Text className="text-lg font-body font-meduim">اللغة</Text>
                  <Ionicons
                    name="globe-outline"
                    size={16}
                    color={COLORS.primary}
                  />
                </View>
              </View>
              <View className="flex-row items-center justify-between ps-2">
                <Text className="font-tajwal font-medium text-primary">
                  {currencySymbol} {settings.currency}
                </Text>
                <View className="flex-row justify-end items-center gap-6 p-4 border-b border-b-primary-100">
                  <Text className="text-lg font-body font-meduim">العملة</Text>
                  <Ionicons
                    name="mail-outline"
                    size={16}
                    color={COLORS.primary}
                  />
                </View>
              </View>
              <View className="flex-row items-center justify-between ps-2">
                <Text className="font-tajwal font-medium text-primary">
                  {t(settings.theme)}
                </Text>
                <View className="flex-row justify-end items-center gap-6 p-4 border-b border-b-primary-100">
                  <Text className="text-lg font-body font-meduim">المظهر</Text>
                  <Ionicons
                    name="moon-outline"
                    size={16}
                    color={COLORS.primary}
                  />
                </View>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default Settings;
