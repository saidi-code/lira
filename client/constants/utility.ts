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
