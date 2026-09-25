import React from "react";
import { Modal, Text,Image, TouchableOpacity, View } from "react-native";
import { useRouter } from "expo-router";

const LoginOrRegisterModal = ({ show,setShow }: { show: boolean ,setShow:any}) => {
  const router = useRouter();
 
  return (
    <Modal
      visible={show}
      transparent
      animationType="fade"
      onRequestClose={() => {
        router.back();
      }}
    >
      <View className="flex-1 bg-black/50 items-center justify-center px-6">
        <View className="w-full rounded-3xl bg-card p-5" style={{
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.15,
          shadowRadius: 20,
          elevation: 6,
        }}>
          <View className="items-center mb-4">
             <View className=" justify-center items-center w-16 h-16 rounded-full bg-[#b89354]/5 mb-2  ">
                    <Image
                      style={{
                        height: 48,
                        width: 48,
                      }}
                      resizeMode="contain"
                      source={require("../assets/images/logo2.png")}
                    />
                  </View>
            <Text className="text-2xl font-bold text-primary-700 font-tajwal">
               تسجيل الدخول
            </Text>
            <Text className="text-center text-body text-base font-tajwal mt-2">
              يرجى تسجيل الدخول للمتابعة.
            </Text>
          </View>

          <TouchableOpacity
            onPress={() => {
              router.push("/(auth)/signIn");
              setShow(false);
            }}
            activeOpacity={0.8}
            className="w-full py-4 rounded-full bg-[#785920] items-center"
          >
            <Text className="text-white text-lg font-bold font-tajwal">
              تسجيل الدخول
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() =>{
              router.push("/(auth)/signUp");
              setShow(false);
            }}
            activeOpacity={0.8}
            className="w-full py-4 rounded-full bg-primary-100 items-center mt-3"
          >
            <Text className="text-[#785920] text-lg font-bold font-tajwal">
              إنشاء حساب
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() =>{
             setShow(false);
            }}
            activeOpacity={0.8}
            className="w-full items-center mt-3 py-2"
          >
            <Text className="text-muted text-base font-tajwal">إلغاء</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

export default LoginOrRegisterModal;

