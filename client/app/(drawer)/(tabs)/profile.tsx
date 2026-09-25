import Header from "@/components/Header";
import { COLORS, PROFILE_MENU } from "@/constants";
import { useAuth, useUser } from "@clerk/clerk-expo";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { Image, Text, TouchableOpacity, View } from "react-native";
import { ScrollView } from "react-native-gesture-handler";
import { SafeAreaView } from "react-native-safe-area-context";

const Profile = () => {
  const { user } = useUser();
  const { signOut } = useAuth();
  const handleLogout = async () => {
    await signOut();
    router.replace("/(auth)/signIn");
  };
  const router = useRouter();

  return (
    <SafeAreaView className="bg-surface shadow flex-1" edges={["top"]}>
      <Header showBack />
      {!user ? (
        <View className="flex-1">
          <View className="items-center mt-6 mb-12">
            <View
              style={{
                position: "relative",
                zIndex: 0,
              }}
            >
              <View
                className="h-[58px] w-[58px] items-center 
        justify-center rounded-full overflow-hidden "
                style={{
                  outlineStyle: "solid",
                  outlineWidth: 1,
                  outlineColor: COLORS.primary,
                  outlineOffset: 2,
                }}
              >
                <Ionicons name="person" size={60} color={"#4b5563"} />
              </View>
            </View>
            <Text className="font-tajwal mr-4 mb-2 text-2xl text-body font-bold text-center mt-4">
              مستخدم ضيف
            </Text>
            <View className="px-2 py-1 rounded-full bg-accent/10">
              <Text className="text-accent text-sm tracking-wide font-body">
                عضو غير مسجل
              </Text>
            </View>
          </View>
          <View
            className="mx-4 justify-center items-center
           bg-card/90 shadow shadow-primary-100 rounded-md px-4 py-8 "
          >
            <Text
              className="text-body font-tajwal 
            font-semibold text-xl leading-8 tracking-wide mb-8 text-center"
            >
              سجّل الدخول لعرض ملفّك الشخصي والطلبات وعنوانك.
            </Text>
            <TouchableOpacity
              onPress={() => router.push("/(auth)/signIn")}
              activeOpacity={0.8}
              className="self-stretch py-4 px-8 bg-[#785920] rounded-full shadow-md "
              style={{
                shadowColor: "rgba(120,89,32,0.05)",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 1,
                shadowRadius: 20,
                elevation: 4,
              }}
            >
              {/* Arrow icon (left pointing, rotated 180°) */}

              {/* <Ionicons name="basket-outline" color={"#fff"} size={20} /> */}

              {/* Button Text */}
              <Text className="text-white text-base  font-normal text-center">
                تسجيل الدخول / إنشاء حساب
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <ScrollView className="flex-1" showsHorizontalScrollIndicator={false}>
          <View className="items-center mt-4 mb-4">
            <View
              style={{
                position: "relative",
                zIndex: 0,
              }}
            >
              <View
                className="h-[58px] w-[58px] items-center 
        justify-center rounded-full overflow-hidden "
                style={{
                  outlineStyle: "solid",
                  outlineWidth: 1,
                  outlineColor: COLORS.primary,
                  outlineOffset: 2,
                }}
              >
                <Image
                  resizeMode="cover"
                  style={{
                    height: 58,
                    width: 58,
                  }}
                  source={{ uri: user.imageUrl }}
                />
              </View>
              <TouchableOpacity
                onPress={() => router.push("/profile")}
                className="absolute h-7 w-7 bg-primary-solid  border-white border-2 rounded-full right-[-3px] bottom-[-3px] items-center justify-center z-10"
              >
                <MaterialCommunityIcons name="pencil" size={14} color="white" />
              </TouchableOpacity>
            </View>
            <Text className="font-tajwal mr-4 text-2xl text-body font-bold text-center mt-4">
              {user.firstName + " " + user.lastName}
            </Text>
            <View className="px-2 py-1 rounded-full bg-accent/10">
              <Text className="text-accent text-sm tracking-wide font-body">
                عضو مسجل
              </Text>
            </View>
            {user.publicMetadata?.role === "admin" && (
              <TouchableOpacity
                onPress={() => router.push("/admin")}
                className="mt-4 px-6 py-2 bg-primary-solid rounded-full"
              >
                <Text className="font-bold text-white">Go to Admin Panel</Text>
              </TouchableOpacity>
            )}
          </View>
          <View className="mx-4  bg-card shadow shadow-accent/5 rounded-md mb-3 ">
            {PROFILE_MENU.map((m, index) => (
              <TouchableOpacity
                onPress={() => router.push(m.route as any)}
                key={index}
                className="flex-row justify-between items-center p-4 border-b border-b-primary-100 "
              >
                <View>
                  <Ionicons
                    name="chevron-back-sharp"
                    size={20}
                    color={COLORS.primary}
                  />
                </View>
                <View className="flex-row items-center gap-2 ">
                  <Text className=" text-lg font-body font-meduim text-body ">
                    {m.title}
                  </Text>

                  <View className="h-6 w-6 bg-surface rounded-[4px] relative">
                    <View className="absolute top-[6px] left-[12px]">
                      <Ionicons
                        name={m.icon as any}
                        size={22}
                        color={COLORS.primary}
                      />
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity
            onPress={() => {
              handleLogout();
            }}
            className="mx-4 p-4 rounded-lg flex-row justify-center gap-2 items-center bg-[#BA1A1A]/5 border border-[#BA1A1A]/10 mt-6"
          >
            <Text className="font-body text-danger font-semibold text-lg">
              تسجيل الخروج
            </Text>
            <Ionicons name="log-out-outline" color={"red"} size={24} />
          </TouchableOpacity>
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

export default Profile;
