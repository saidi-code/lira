import { COLORS } from "@/constants";
import { useSignUp } from "@clerk/clerk-expo";
import { Entypo } from "@expo/vector-icons";
import { Link, useRouter } from "expo-router";
import * as React from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,Image
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
export default function Page() {
  const { isLoaded, signUp, setActive } = useSignUp();
  const router = useRouter();

  const [emailAddress, setEmailAddress] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [firstName, setFirstName] = React.useState("");
  const [lastName, setLastName] = React.useState("");
  const [pendingVerification, setPendingVerification] = React.useState(false);
  const [code, setCode] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [authError, setAuthError] = React.useState("");
  // Handle submission of sign-up form
  const onSignUpPress = async () => {
    setLoading(true);
    if (!isLoaded) return;

    // Start sign-up process using email and password provided
    try {
      await signUp.create({
        emailAddress,
        password,
        firstName,
        lastName,
      });

      // Send user an email with verification code
      await signUp.prepareEmailAddressVerification({ strategy: "email_code" });

      // Set 'pendingVerification' to true to display second form
      // and capture code
      setPendingVerification(true);
    } catch (err) {
      // See https://clerk.com/docs/guides/development/custom-flows/error-handling
      // for more info on error handling
      setAuthError("Please fill all fields");
      console.error(JSON.stringify(err, null, 2));
    } finally {
      setLoading(false);
    }
  };

  // Handle submission of verification form
  const onVerifyPress = async () => {
    if (!isLoaded) return;

    try {
      // Use the code the user provided to attempt verification
      const signUpAttempt = await signUp.attemptEmailAddressVerification({
        code,
      });

      // If verification was completed, set the session to active
      // and redirect the user
      if (signUpAttempt.status === "complete") {
        await setActive({
          session: signUpAttempt.createdSessionId,
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
        // If the status is not complete, check why. User may need to
        // complete further steps.
        console.error(JSON.stringify(signUpAttempt, null, 2));
      }
    } catch (err) {
      // See https://clerk.com/docs/guides/development/custom-flows/error-handling
      // for more info on error handling
      setAuthError("Code Not Valid");
      console.error(JSON.stringify(err, null, 2));
    }
  };

  if (pendingVerification) {
    return (
      <SafeAreaView className="flex-1 bg-white" style={{ padding: 28 }}>
      
        <Text style={styles.title}>تحقق من بريدك الإلكتروني</Text>
        <Text style={styles.description}>
          تم إرسال رمز التحقق إلى بريدك الإلكتروني.
        </Text>
        <TextInput
          style={styles.input}
          value={code}
          placeholder="أدخل رمز التحقق"
          placeholderTextColor="#666666"
          onChangeText={(code) => setCode(code)}
          keyboardType="numeric"
        />
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
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-surface">
     
     
      <ScrollView  contentContainerStyle={{
        flex:1,
        display: "flex",
        justifyContent: "center",
       
       
      }} showsVerticalScrollIndicator={false}>
        <View className="bg-white/90 mx-4 py-8 px-4 rounded-lg shadow shadow-primary-500">
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
                      إنشاء حساب
                    </Text>
                  </View>
          {authError && (
            <View className="p-4 rounded-lg bg-red-100 mb-4">
              <Text className="text-red-500 text-sm font-semibold">
                {authError}
              </Text>
            </View>
          )}
          <View className="mb-4">
            <Text style={styles.label}>الاسم الأول</Text>
            <TextInput
              style={styles.input}
              autoCapitalize="words"
              value={firstName}
              placeholder="الاسم الأول"
              placeholderTextColor="#666666"
              onChangeText={(firstName) => setFirstName(firstName)}
              keyboardType="name-phone-pad"
            />
          </View>
          <View className="mb-4">
            <Text style={styles.label}>اسم العائلة</Text>
            <TextInput
              style={styles.input}
              autoCapitalize="words"
              value={lastName}
              placeholder="اسم العائلة"
              placeholderTextColor="#666666"
              onChangeText={(lastName) => setLastName(lastName)}
              keyboardType="name-phone-pad"
            />
          </View>
          <View className="mb-4">
            <Text style={styles.label}>عنوان البريد الإلكتروني</Text>
            <TextInput
              style={styles.input}
              autoCapitalize="none"
              value={emailAddress}
              placeholder="أدخل البريد الإلكتروني"
              placeholderTextColor="#666666"
              onChangeText={(email) => setEmailAddress(email)}
              keyboardType="email-address"
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
            onPress={onSignUpPress}
            disabled={!emailAddress || !password || !firstName || !lastName}
            style={styles.button}
          >
            {loading ? (
              <ActivityIndicator size={"small"} color="#fff" />
            ) : (
              <Text className="" style={styles.buttonText}>
                تسجيل حساب
              </Text>
            )}
          </TouchableOpacity>

          <View style={styles.linkContainer}>
            <Link href="/signIn">
              <Text className="text-base font-semibold text-accent underline">
                تسجيل الدخول
              </Text>
            </Link>
            <Text className="text-base text-gray-400">هل لديك حساب؟ </Text>
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
      </ScrollView>
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
