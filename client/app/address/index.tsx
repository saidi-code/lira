import Header from "@/components/Header";
import { COLORS } from "@/constants";
import { ShowToast } from "@/constants/utility";
import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  Modal,
  Pressable,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useAddress } from "@/hooks/useAddress";
import { SelectList } from "react-native-dropdown-select-list";
import { ScrollView } from "react-native-gesture-handler";
import { SafeAreaView } from "react-native-safe-area-context";
import { BackendAddress } from "@/config/addressApi";

// The address-type dropdown works with Arabic labels, while the API
// expects the English enum from the Address model.
const ADDRESS_TYPE_MAP: Partial<Record<string, "Home" | "Work" | "Other">> = {
  المنزل: "Home",
  المكتب: "Work",
  أخري: "Other",
};

const AddressScreen = () => {
  const {
    addresses,
    addAddress,
    updateAddress,
    deleteAddress,
  } = useAddress();

  const [openModal, setOpenModal] = useState(false);
  const [addressType, setAddressType] = useState("المنزل");
  const [, setAddressCountry] = useState("");
  const [addressState, setAdressState] = useState("");
  const [addressCity, setAddressCity] = useState("");
  const [addressAddress, setAdressAdress] = useState("");
  const [addressCodePostal, setAdressCodePostal] = useState("");
  const [addressPhone, setAddressPhone] = useState("");
  const [selectedAddress, setSelectedAddress] = useState<BackendAddress | null>(
    null
  );
  const [isEditing, setIsEditing] = useState(false);

  const handleEditAddress = (address: BackendAddress) => {
    setIsEditing(true);
    setSelectedAddress(address);
    setAddressType(
      Object.entries(ADDRESS_TYPE_MAP).find(([, v]) => v === address.type)?.[0] ??
        "المنزل"
    );
    setAddressCity(address.city);
    setAdressState(address.state);
    setAdressAdress(address.street);
    setAdressCodePostal(address.zipCode);
    setAddressPhone(address.phoneNumber);
    setOpenModal(true);
  };

  const handleAddAddress = async () => {
    const payload = {
      type: ADDRESS_TYPE_MAP[addressType] ?? "Other",
      city: addressCity,
      zipCode: addressCodePostal,
      phoneNumber: addressPhone,
      state: addressState,
      street: addressAddress,
      isDefault: true,
    };

    if (isEditing && selectedAddress) {
      await updateAddress(selectedAddress._id, {
        type: payload.type,
        street: payload.street,
        city: payload.city,
        state: payload.state,
        zipCode: payload.zipCode,
        phoneNumber: payload.phoneNumber,
      });
    } else {
      await addAddress(payload);
    }

    setOpenModal(false);
    setIsEditing(false);
    setSelectedAddress(null);
  };

  return (
    <SafeAreaView className="flex-1 bg-red-50" edges={["top"]}>
      <Header showBack />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{}}
        className="mx-4"
      >
        <View className="mx-4 items-end gap-2 mt-8 mb-12">
          <Text className="text-right text-body text-4xl leading-[43px] font-bold font-jazera">
            عناوين الشحن
          </Text>
          <Text className="text-right text-primary text-base font-medium font-tajwal uppercase tracking-wider">
            أدر عناوينك المفضلة لتجربة تسوق أسرع وأكثر تميزاً.
          </Text>
        </View>

        {addresses.length === 0 ? (
          <View className="p-4 items-center justify-center bg-canvas rounded-xl border border-primary border-dashed">
            <Text className="text-primary-900 text-lg leading-6 font-tajwal tracking-tighter text-center px-4 mb-6">
              يبدو أن لديك عناوين شحن فارغة حالياً. أضف عنوانك الآن ليتم تجهيز
              طلباتك وتأكيدها بسلاسة.
            </Text>
            <TouchableOpacity
              onPress={() => setOpenModal(true)}
              className="w-full flex-row justify-center items-center gap-2 px-4 py-4 bg-primary rounded-lg border border-accent"
            >
              <Ionicons name="locate-outline" color={"white"} size={24} />
              <Text className="text-white text-center font-semibold font-tajwal">
                إضافة عنوان جديد
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          addresses.map((a) => (
            <View
              key={a._id}
              className="bg-white relative rounded-md shadow border border-1 border-primary-100 overflow-hidden pt-8 px-6 mb-6"
            >
              {a.isDefault && (
                <View className="absolute top-0 right-0 bg-primary py-1 px-4 rounded-bl-md">
                  <Text className="font-body text-sm text-white">
                    العنوان الافتراضي
                  </Text>
                </View>
              )}

              <View className="flex-row justify-end items-center gap-3">
                <Text className="text-body font-tajwal text-2xl">
                  {ADDRESS_TYPE_MAP[a.type] === "Home"
                    ? "المنزل"
                    : ADDRESS_TYPE_MAP[a.type] === "Work"
                      ? "المكتب"
                      : "أخري"}
                </Text>
                <View className="items-center bg-surface p-3 rounded-full">
                  <Ionicons
                    name={
                      a.type === "Home"
                        ? "home-outline"
                        : a.type === "Work"
                          ? "briefcase-outline"
                          : "options-outline"
                    }
                    color={COLORS.primary}
                    size={24}
                  />
                </View>
              </View>

              <View className="mb-3">
                <Text className="font-body text-body text-lg text-right">
                  {a.street} ,ولاية {a.state} ,{a.city} {a.zipCode}
                </Text>
                <Text className="font-body text-body text-lg text-right">
                  تونس
                </Text>
              </View>

              <View className="flex-row justify-end items-center gap-2 mb-6">
                <Text className="font-body text-primary text-lg text-right">
                  {a.phoneNumber}
                </Text>
                <Ionicons name="call-outline" color={COLORS.primary} size={18} />
              </View>

              <View className="border-t border-t-primary-100 py-4 flex-row justify-end items-center gap-4">
                <TouchableOpacity
                  onPress={() => deleteAddress(a._id)}
                  className="flex-row items-center gap-1"
                >
                  <Text className="font-body text-sm text-red-500">حذف</Text>
                  <Ionicons name="trash-outline" color={"#ef4444"} size={16} />
                </TouchableOpacity>
                <Pressable
                  className="flex-row items-center gap-1"
                  onPress={() => handleEditAddress(a)}
                >
                  <Text className="font-body text-sm text-accent">تعديل</Text>
                  <Ionicons
                    name="pencil-outline"
                    color={COLORS.primary}
                    size={16}
                  />
                </Pressable>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {addresses.length !== 0 && (
        <TouchableOpacity
          onPress={() => setOpenModal(true)}
          className="mx-4 py-4 bg-primary rounded-lg border border-accent mb-12"
        >
          <Text className="text-white text-center font-semibold font-tajwal">
            إضافة عنوان جديد
          </Text>
        </TouchableOpacity>
      )}

      <Modal
        className="-z-10"
        visible={openModal}
        animationType="fade"
        transparent
        onRequestClose={() => setOpenModal(false)}
      >
        <View className="bg-surface flex-1 rounded-t-2xl p-4 relative">
          <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
            <View className="flex-row justify-between items-center mb-4 pb-4 border-b border-primary-100">
              <View className="flex flex-row items-center gap-2">
                <Ionicons
                  name="repeat-outline"
                  size={18}
                  color={COLORS.inactive}
                />
                <Text className="text-sm font-base font-body text-primary-700">
                  إعادة تعيين
                </Text>
              </View>
              <TouchableOpacity onPress={() => setOpenModal(false)}>
                <Ionicons
                  name="close-outline"
                  size={24}
                  color={COLORS.inactive}
                />
              </TouchableOpacity>
            </View>

            <View className="mx-4 items-center gap-2 mt-8 mb-12">
              <Text className="text-center text-body text-4xl leading-[43px] font-bold font-jazera">
                {isEditing ? "تعديل عنوان الشحن" : "إضافة عنوان جديد"}
              </Text>
              <Text className="text-center text-primary text-base font-medium font-tajwal uppercase tracking-wider">
                أدخل تفاصيل التوصيل المفضلة لديك
              </Text>
            </View>

            <View className="mb-12 mx-2 bg-white rounded-xl shadow p-6">
              <View className="mb-4">
                <Text className="text-body text-lg font-tajwal text-right">
                  نوع العنوان
                </Text>
                <SelectList
                  search={false}
                  dropdownTextStyles={{ textAlign: "right" }}
                  defaultOption={{ key: addressType, value: addressType }}
                  setSelected={(val: any) => setAddressType(val)}
                  save="value"
                  inputStyles={{ textAlign: "right" }}
                  boxStyles={{
                    flexDirection: "row-reverse",
                    justifyContent: "space-between",
                  }}
                  data={[
                    { key: "المنزل", value: "المنزل" },
                    { key: "المكتب", value: "المكتب" },
                    { key: "أخري", value: "أخري" },
                  ]}
                />
              </View>

              <View className="mb-4">
                <Text className="text-body text-lg font-tajwal text-right">
                  الهاتف
                </Text>
                <TextInput
                  numberOfLines={5}
                  multiline={true}
                  className="border border-body rounded-lg text-right p-2"
                  value={addressPhone}
                  onChangeText={setAddressPhone}
                  placeholder="مثال:+216123456"
                  placeholderTextColor={"#3d3d3d"}
                />
              </View>

              <View className="mb-4">
                <Text className="text-body text-lg font-tajwal text-right">
                  العنوان
                </Text>
                <TextInput
                  numberOfLines={5}
                  multiline={true}
                  className="border border-body rounded-lg text-right p-2"
                  value={addressAddress}
                  onChangeText={setAdressAdress}
                  placeholder="إسم الحي, إسم الشارع, عددالمنزل مثال: حي الإسكان شارع الحرية منزل عدد 3"
                  placeholderTextColor={"#3d3d3d"}
                />
              </View>

              <View className="mb-4">
                <Text className="text-body text-lg font-tajwal text-right">
                  البلد
                </Text>
                <SelectList
                  search={false}
                  inputStyles={{ textAlign: "right" }}
                  boxStyles={{
                    flexDirection: "row-reverse",
                    justifyContent: "space-between",
                  }}
                  placeholder="أختر البلد"
                  // BackendAddress has no country field (not stored server-side),
                  // so the single available option is always the default.
                  defaultOption={{ key: "تونس", value: "تونس" }}
                  dropdownTextStyles={{ textAlign: "right" }}
                  setSelected={(val: any) => setAddressCountry(val)}
                  save="value"
                  data={[{ key: "تونس", value: "تونس" }]}
                />
              </View>

              <View className="mb-4">
                <Text className="text-body text-lg font-tajwal text-right">
                  الولاية
                </Text>
                <SelectList
                  search={false}
                  inputStyles={{ textAlign: "right" }}
                  boxStyles={{
                    flexDirection: "row-reverse",
                    justifyContent: "space-between",
                  }}
                  dropdownTextStyles={{ textAlign: "right" }}
                  defaultOption={
                    isEditing
                      ? {
                          key: selectedAddress?.state ?? "مدنين",
                          value: selectedAddress?.state ?? "مدنين",
                        }
                      : { key: "مدنين", value: "مدنين" }
                  }
                  setSelected={(val: any) => setAdressState(val)}
                  save="value"
                  data={[{ key: "مدنين", value: "مدنين" }]}
                />
              </View>

              <View className="mb-4">
                <Text className="text-body text-lg font-tajwal text-right">
                  المدينة
                </Text>
                <TextInput
                  className="border border-body rounded-lg text-right px-2"
                  value={addressCity}
                  onChangeText={setAddressCity}
                  placeholder="إسم المدينة مثال:'بني خداش'"
                  placeholderTextColor={"#3d3d3d"}
                />
              </View>

              <View className="mb-4">
                <Text className="text-body text-lg font-tajwal text-right">
                  الترقيم البريدي
                </Text>
                <TextInput
                  className="border border-body rounded-lg text-right px-2"
                  value={addressCodePostal}
                  onChangeText={setAdressCodePostal}
                  placeholder="مثال: 4100"
                  placeholderTextColor={"#3d3d3d"}
                  keyboardType="numeric"
                />
              </View>
            </View>

            <TouchableOpacity
              onPress={async () => {
                await handleAddAddress();
                ShowToast(
                  "success",
                  isEditing
                    ? "تم تحديث العنوان بنجاح"
                    : "تم إضافة عنوان جديد بنجاح"
                );
              }}
              className="flex-row justify-center items-center gap-2 mx-4 py-4 bg-green-500 rounded-lg border border-green-300 mb-12"
            >
              <Text className="text-white leading-6 text-center font-semibold font-tajwal">
                {isEditing ? "حفظ التغيرات" : "إضافة عنوان جديد"}
              </Text>
              <Ionicons name="add-circle-outline" color={"white"} size={24} />
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default AddressScreen;