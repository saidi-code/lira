import { useSignIn } from "@clerk/clerk-expo";
import type { EmailCodeFactor } from "@clerk/types";
import { Link, useRouter } from "expo-router";
import * as React from "react";
import {
  ActivityIndicator,
  Image,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";
import Entypo from "@expo/vector-icons/build/Entypo";
import { COLORS } from "@/constants";
export default function Page() {
  const { signIn, setActive, isLoaded } = useSignIn();
  const router = useRouter();

  const [emailAddress, setEmailAddress] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [code, setCode] = React.useState("");
  const [showEmailCode, setShowEmailCode] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [authError, setAuthError] = React.useState("");
  // Handle the submission of the sign-in form
  const onSignInPress = React.useCallback(async () => {
    if (!isLoaded) return;
    setLoading(true);

    // Start the sign-in process using the email and password provided
    try {
      const signInAttempt = await signIn.create({
        identifier: emailAddress,
        password,
      });

      // If sign-in process is complete, set the created session as active
      // and redirect the user
      if (signInAttempt.status === "complete") {
        await setActive({
          session: signInAttempt.createdSessionId,
          navigate: async ({ session }) => {
            if (session?.currentTask) {
              // Handle pending session tasks
              // See https://clerk.com/docs/guides/development/custom-flows/authentication/session-tasks
              console.log(session?.currentTask);
              return;
            }

            router.replace("/");
          },
        });
      } else if (signInAttempt.status === "needs_second_factor") {
        // Check if email_code is a valid second factor
        // This is required when Client Trust is enabled and the user
        // is signing in from a new device.
        // See https://clerk.com/docs/guides/secure/client-trust
        const emailCodeFactor = signInAttempt.supportedSecondFactors?.find(
          (factor): factor is EmailCodeFactor =>
            factor.strategy === "email_code",
        );

        if (emailCodeFactor) {
          await signIn.prepareSecondFactor({
            strategy: "email_code",
            emailAddressId: emailCodeFactor.emailAddressId,
          });
          setShowEmailCode(true);
        }
      } else {
        // If the status is not complete, check why. User may need to
        // complete further steps.
        console.error(JSON.stringify(signInAttempt, null, 2));
      }
    } catch (err: any) {
      // See https://clerk.com/docs/guides/development/custom-flows/error-handling
      // for more info on error handling
      if (err?.status === 422) {
        setAuthError("Invalid Password or Email");
      }
      console.error(JSON.stringify(err, null, 2));
    } finally {
      setLoading(false);
    }
  }, [isLoaded, signIn, setActive, router, emailAddress, password]);

  // Handle the submission of the email verification code
  const onVerifyPress = React.useCallback(async () => {
    if (!isLoaded) return;
    setLoading(true);

    try {
      const signInAttempt = await signIn.attemptSecondFactor({
        strategy: "email_code",
        code,
      });

      if (signInAttempt.status === "complete") {
        await setActive({
          session: signInAttempt.createdSessionId,
          navigate: async ({ session }) => {
            if (session?.currentTask) {
              // Handle pending session tasks
              // See https://clerk.com/docs/guides/development/custom-flows/authentication/session-tasks
              console.log(session?.currentTask);
              return;
            }

            router.replace("/");
          },
        });
      } else {
        console.error(JSON.stringify(signInAttempt, null, 2));
      }
    } catch (err) {
      setAuthError("Code Not Valid");
      console.error(JSON.stringify(err, null, 2));
    } finally {
      setLoading(false);
    }
  }, [isLoaded, signIn, setActive, router, code]);

  // Display email code verification form
  if (showEmailCode) {
    return (
     
     <View className="flex-1 items-center justify-center pt-32 bg-surface">

      <View className="flex-1 items-center justify-center">
      <View className="relative ">
        <View className="justify-center items-center w-16 h-16 rounded-full bg-[#b89354]/5 
        mb-2 absolute 
        top-1/2 
        left-1/2 
        -translate-x-1/2 
        -translate-y-1/2">
                           <Image
                             style={{
                               height: 48,
                               width: 48,
                             }}
                             resizeMode="contain"
                           source={require("../../assets/images/logo2.png")}
                           />
        </View>
        <View className="flex-1 bg-card">
          <View className="flex  items-center ">
            <Text className="text-3xl  text-center font-bold  text-primary">
              تحقق من بريدك الإلكتروني
            </Text>
            <Text style={styles.description}>
              *تم إرسال رمز التحقق إلى بريدك الإلكتروني.
            </Text>
            <View className="h-[150px] w-[150px] flex items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-[#D4AF37] to-[#5A0599]">
              <Image
                source={require("../../assets/images/logo2.png")}
                style={{ width: 100, height: 100 }}
                resizeMode="cover"
              />
            </View>
          </View>
          {authError && (
            <View className="p-4 rounded-lg bg-danger-surface mb-4">
              <Text className="text-danger text-sm font-semibold">
                {authError}
              </Text>
            </View>
          )}
          <View className="mb-4">
            <TextInput
              style={styles.input}
              value={code}
              placeholder="أدخل رمز التحقق"
              placeholderTextColor="#666666"
              onChangeText={(code) => setCode(code)}
              keyboardType="numeric"
            />
          </View>

          <TouchableOpacity
            style={styles.button}
            disabled={!code}
            onPress={onVerifyPress}
          >
            {loading ? (
              <ActivityIndicator size={"small"} color="#fff" />
            ) : (
              <Text style={styles.buttonText}>تحقق</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
      </View>
      </View>
     
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-surface">
     

      <View className="flex-1 justify-center">
      
        <View className="bg-card/90 mx-4 py-4 px-4 rounded-lg shadow shadow-primary-500">
            <View className="flex gap-4 items-center  mb-8">
           <View className=" justify-center items-center  w-20 h-20 rounded-full bg-[#b89354]/5 mb-2  ">
                         <Image
                           style={{
                             height: 72,
                             width: 72,
                           }}
                           resizeMode="contain"
                           source={require("../../assets/images/logo2.png")}
                         />
                       </View>
          <Text className="text-3xl  text-center font-bold  text-primary mb-4">
            تسجيل الدخول
          </Text>
        </View>
          {authError && (
            <View className="p-4 rounded-lg bg-danger-surface mb-4">
              <Text className="text-danger text-sm font-semibold">
                {authError}
              </Text>
            </View>
          )}
          <View className="mb-4 text-right">
            <Text style={styles.label}>عنوان البريد الإلكتروني</Text>

            <TextInput
              style={styles.input}
              autoCapitalize="none"
              value={emailAddress}
              placeholder="أدخل البريد الإلكتروني"
              placeholderTextColor="#666666"
              onChangeText={(emailAddress) => setEmailAddress(emailAddress)}
              keyboardType="email-address"
              textAlign="right"
            />
          </View>
          <View className="mb-6">
            <Text style={styles.label}>كلمة المرور</Text>

            <TextInput
              style={styles.input}
              value={password}
              placeholder="أدخل كلمة المرور"
              placeholderTextColor="#666666"
              secureTextEntry={true}
              onChangeText={(password) => setPassword(password)}
              textAlign="right"
            />
          </View>

          <TouchableOpacity
            // style={({ pressed }) => [
            //   styles.button,
            //   (!emailAddress || !password) && styles.buttonDisabled,
            //   pressed && styles.buttonPressed,
            // ]}
            onPress={onSignInPress}
            disabled={!emailAddress || !password}
            style={styles.button}
          >
            {loading ? (
              <ActivityIndicator size={"small"} color="#fff" />
            ) : (
              <Text className="" style={styles.buttonText}>
                تسجيل الدخول
              </Text>
            )}
          </TouchableOpacity>
          <View style={styles.linkContainer}>
            <Link href="/signUp">
              <Text className="text-base underline font-semibold text-right text-accent">
                إنشاء حساب
              </Text>
            </Link>
            <Text className="text-base text-muted text-right">
              لا تمتلك حساباً؟
            </Text>
          </View>
        </View>
                 <View className="mt-6 items-center justify-center">
            <Link
              href="/"
              className="flex-row-reverse items-center  px-6 py-3 rounded-full"
              style={{ backgroundColor: "#f7efe1" }}
            >
              <Text
                className="text-primary font-tajwal  font-bold text-lg"
                style={{ textDecorationLine: "underline" }}
              >
                العودة إلي المتجر
              </Text>
              <Entypo name="shop" size={18} color={COLORS.primary} />
            </Link>
          </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    gap: 12,
  },
  title: {
    marginBottom: 8,
  },
  description: {
    fontSize: 12,
    marginBottom: 16,
    opacity: 0.8,
  },
  label: {
    fontWeight: "600",
    fontSize: 14,
    color: "#111111",
    marginBottom: 8,
    textAlign: "right",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    backgroundColor: "#F7F7F7",
    color: "#111111",
  },
  button: {
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 8,
    backgroundColor: "#785920",
  },
  buttonPressed: {
    backgroundColor: "#333333",
  },
  buttonDisabled: {
    // opacity: 0.5,
    backgroundColor: "#333333",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "600",
  },
  linkContainer: {
    flexDirection: "row",
    gap: 4,
    marginTop: 8,
    alignItems: "center",
    justifyContent: "flex-end",
  },
});
