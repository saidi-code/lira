import { Ionicons } from "@expo/vector-icons";
import { Text, View } from "react-native";
const ErrorToast = (props: any) => {
  const text1 = props?.text1;
  const text2 = props?.text2;

  return (
    <View
      className="bg-surface blur-3xl p-4 rounded-xl min-w-[300px] z-50"
      style={{
        elevation: 1,
      }}
    >
      <View className="flex-1 items-center">
        <Ionicons name="close-circle" size={44} color="#dc2626" />
        <Text className="mt-2 font-semibold font-tajwal text-xl text-body text-center">
          {text1 ?? "تم!"}
        </Text>
        {text2 && (
          <Text className="text-body text-lg font-tajwal text-right">
            {text2}
          </Text>
        )}
      </View>
    </View>
  );
};
export default ErrorToast;
