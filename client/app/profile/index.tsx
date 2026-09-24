import Header from "@/components/Header";
import { COLORS } from "@/constants";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { useState } from "react";
import { Image, Text, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
const UpdateProfile = () => {
  const [firstName, setFirstName] = useState<string>("");
  const [lastName, setLastName] = useState<string>("");
  const [phone, setPhone] = useState<string>("");
  return (
    <SafeAreaView className="bg-surface shadow flex-1" edges={["top"]}>
      <Header showBack />
      <View className="items-center mt-4 mb-6">
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
              source={require("../../assets/images/user_profile.png")}
            />
          </View>
          <View className="absolute h-7 w-7 bg-primary  border-white border-2 rounded-full right-[-3px] bottom-[-3px] items-center justify-center z-10">
            <MaterialCommunityIcons name="camera" size={14} color="white" />
          </View>
        </View>
        <Text className="font-tajwal mr-4 text-2xl text-body font-bold text-center mt-4">
          أحمد المنصور
        </Text>
        <View className="px-2 py-1 rounded-full bg-accent/10">
          <Text className="text-accent text-sm tracking-wide font-body">
            عضو مسجل
          </Text>
        </View>
      </View>
      <View className="mx-4   mb-6 ">
        <View className="mb-4">
          <Text className="text-right font-medium font-body text-primary">
            الإسم
          </Text>
          <View
            className={`my-3 flex-row items-center
               rounded-md overflow-hidden
            `}
            style={{
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.05,
              shadowRadius: 8,
              outlineStyle: "solid",
              outlineWidth: 1,
              outlineColor: COLORS.primary,
              outlineOffset: 2,
            }}
          >
            {/* Left icon – sparkles (with touch feedback) */}
            <View className="p-4 pr-3 ">
              <Feather name="user" size={20} color={COLORS.primary} />
            </View>

            {/* TextInput – flexible, right-aligned */}
            <TextInput
              className="flex-1 py-4 pr-2 text-right text-base font-medium 
               font-tajwal text-stone-800"
              placeholder="الإسم..."
              placeholderTextColor="#a8a29e"
              value={firstName}
              onChangeText={(e) => setFirstName(e)}
              textAlign="right"
              textAlignVertical="center"
              returnKeyType="done"
              clearButtonMode="never" // we handle custom clear
            />
          </View>
        </View>
        <View className="mb-4">
          <Text className="text-right font-medium font-body text-primary">
            اللقب
          </Text>
          <View
            className={`my-3 flex-row items-center
               rounded-md overflow-hidden
            `}
            style={{
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.05,
              shadowRadius: 8,
              outlineStyle: "solid",
              outlineWidth: 1,
              outlineColor: COLORS.primary,
              outlineOffset: 2,
            }}
          >
            {/* Left icon – sparkles (with touch feedback) */}
            <View className="p-4 pr-3 ">
              <Feather name="user" size={20} color={COLORS.primary} />
            </View>

            {/* TextInput – flexible, right-aligned */}
            <TextInput
              className="flex-1 py-4 pr-2 text-right text-base font-medium 
               font-tajwal text-stone-800"
              placeholder="اللقب..."
              placeholderTextColor="#a8a29e"
              value={lastName}
              onChangeText={(e) => setLastName(e)}
              textAlign="right"
              textAlignVertical="center"
              returnKeyType="done"
              clearButtonMode="never" // we handle custom clear
            />
          </View>
        </View>
        <View className="mb-4">
          <Text className="text-right font-medium font-body text-primary">
            رقم الهاتف
          </Text>
          <View
            className={`my-3 flex-row items-center
               rounded-md overflow-hidden
            `}
            style={{
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.05,
              shadowRadius: 8,
              outlineStyle: "solid",
              outlineWidth: 1,
              outlineColor: COLORS.primary,
              outlineOffset: 2,
            }}
          >
            {/* Left icon – sparkles (with touch feedback) */}
            <View className="p-4 pr-3 ">
              <Feather name="phone" size={20} color={COLORS.primary} />
            </View>

            {/* TextInput – flexible, right-aligned */}
            <TextInput
              className="flex-1 py-4 pr-2 text-right text-base font-medium 
               font-tajwal text-stone-800"
              placeholder=" رقم الهاتف..."
              placeholderTextColor="#a8a29e"
              value={phone}
              onChangeText={(e) => setPhone(e)}
              textAlign="right"
              textAlignVertical="center"
              returnKeyType="done"
              clearButtonMode="never" // we handle custom clear
              keyboardType="phone-pad"
            />
          </View>
        </View>
      </View>
      <TouchableOpacity className="mx-4 p-4 rounded-lg flex-row justify-center gap-2 items-center bg-primary border border-primary/10">
        <Text className="font-body text-white font-semibold text-lg">
          حفظ التغييرات
        </Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

export default UpdateProfile;
