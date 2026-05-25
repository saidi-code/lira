import { Dimensions } from "react-native";
import Toast from "react-native-toast-message";
const screenHeight = Dimensions.get("window").height;
export const ShowToast = (type: string, text: string) => {
  Toast.show({
    visibilityTime: 2000,
    type: type === "success" ? "successToast" : "errorToast",
    text1: type === "success" ? "تم!" : "خطأ!",
    text2: text,
    topOffset: screenHeight / 2,
  });
};
export const showSuccessToast = (text: string = "") => {
  console.log("showSuccessToast() called");
  Toast.show({
    visibilityTime: 2000,
    type: "successToast",
    text1: "تم!",
    text2: text,
    topOffset: screenHeight / 2, // Subtract half the height of your toast to center it exactl
  });
};

export const showErrorToast = (text: string = "") => {
  Toast.show({
    visibilityTime: 2000,
    type: "errorToast",
    text1: "خطأ!",
    text2: text,
    topOffset: screenHeight / 2 - 50, // Subtract half the height of your toast to center it exactl
  });
};
export const getStatusColor = (status: string) => {
  switch (status) {
    case "placed":
      return "bg-yellow-50 text-yellow-900";
    case "processing":
      return "bg-indigo-50 text-indigo-900";
    case "shipped":
      return "bg-purple-50 text-purple-900";
    case "delivered":
      return "bg-green-50 text-green-900";
    case "cancelled":
      return "bg-red-50 text-red-900";
    default:
      return "bg-gray-50 text-gray-900";
  }
};
