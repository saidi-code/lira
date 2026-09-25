import {Drawer} from "@/config/Drawer/Drawer";
import { DrawerContentScrollView } from '@react-navigation/drawer';
import { View, Text, Switch, StyleSheet } from 'react-native';
import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants/index'; // Adjust the path as needed

// --- 1. CUSTOM DRAWER CONTENT COMPONENT ---
function CustomDrawerContent(props: any) {
  // التنبيهات
  // ملاحظة: تم تعليق كود تبديل الوضع الليلي وواجهة اختيار اللغة مؤقتًا
  // أسفل هذا الملف، لذلك حُذفت متغيراته من هنا.
  // نسخة احتياطية: %TEMP%\drawer_layout_WIP_backup_20260925_180512.tsx
 const [phoneNotification, setPhoneNotification] = useState<boolean>(false);
  const [emailNoatification, setEmailNoatification] = useState<boolean>(false);

  return (
    
    <DrawerContentScrollView
      {...props}
      contentContainerStyle={styles.drawerContainer}
    >
      {/* --- DRAWER HEADER (Optional) --- */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}> الإعدادات <Ionicons name="settings-outline" size={16}/></Text>
      </View>

      {/* --- DEFAULT NAVIGATION ITEMS (Your screens) --- */}
     <View className="mx-4">
          <View className="mb-6">
            <View className="border-r-2 border-r-primary-700 mb-4">
              <Text
                className="font-tajwal mr-4 text-2xl
                     text-primary font-bold text-right"
              >
                التنبيهات
              </Text>
            </View>
            <View className=" bg-white rounded-xl shadow">
              <View className="flex-row items-center justify-between">
                <Switch
                  trackColor={{ false: "#ECE0D9", true: "#B89354" }}
                  // thumbColor={isEnabled ? "#f5dd4b" : "#f4f3f4"}
                  ios_backgroundColor="#3e3e3e"
                  onValueChange={() => setPhoneNotification((prev) => !prev)}
                  value={phoneNotification}
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
                  trackColor={{ false: "#ECE0D9", true: "#B89354" }}
                  // thumbColor={isEnabled ? "#f5dd4b" : "#f4f3f4"}
                  ios_backgroundColor="#3e3e3e"
                  onValueChange={() => setEmailNoatification((prev) => !prev)}
                  value={emailNoatification}
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
            <View className=" bg-white rounded-xl shadow">
              <View className="flex-row items-center justify-between ps-2">
                <Text className="font-tajwal font-medium text-primary">
                  العربية
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
                  د.ت
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
                  فاتح
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
 {/* <View style={{display:"flex",flexDirection:"row",alignItems:"center",justifyContent:"space-between",paddingHorizontal:15,height:50}}>
    <View style={{display:"flex",flexDirection:"row",alignItems:"center",gap:8}}>
                    <Ionicons name={isDark ? 'moon-outline' : 'sunny-outline'} size={20} color={"#666"} />

            <Text style={{
                ...styles.labelText,
              
                   }}>Dark Mode</Text>
                    </View>
            <Switch
            
              value={isDark}
              onValueChange={toggleDarkMode}
              trackColor={{ false: COLORS.inactive, true: COLORS.primary }}
              thumbColor={isDark ? '#f5dd4b' : '#f4f3f4'}
            />
            
          </View> */}
      {/* --- LANGUAGE SELECTOR --- */}
      {/* <View style={styles.languageSection}>
        <View style={styles.languageHeader}>
          <Ionicons name="globe-outline" size={22} color="#666" />
          <Text style={[styles.labelText, { marginLeft: 10 }]}>Language</Text>
        </View>
        <View style={styles.languageOptions}>
          {languages.map((lang) => (
            <TouchableOpacity
              key={lang}
              style={[
                styles.languageButton,
                currentLang === lang && styles.languageButtonActive,
              ]}
              onPress={() => selectLanguage(lang)}
            >
              <Text
                style={[
                  styles.languageText,
                  currentLang === lang && styles.languageTextActive,
                ]}
              >
                {lang}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View> */}
    </DrawerContentScrollView>
   
  );
}

// --- 2. MAIN DRAWER LAYOUT ---
export default function DrawerLayout() {
  return (
    <Drawer
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={{
        headerShown: false,
      
        // You can customize the header toggle button here too
      }}
    >
   {/* <Drawer.Screen name="(tabs)" options={{ title: 'Home' }} /> */}
      {/* Add more screens as needed */}
      {/* <Drawer.Screen name="profile" options={{ title: 'Profile' }} /> */}
    </Drawer>
  );
}

// --- 3. STYLES ---
const styles = StyleSheet.create({
  drawerContainer: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    marginBottom: 10,
   
    direction:"rtl"
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.primary,
    direction:"rtl"
  },
  divider: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginVertical: 10,
    marginHorizontal: 15,
  },
  toggleRow: {
    flex:1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    // marginHorizontal: 15,
  },
 
  labelText: {
  
    color: COLORS.primary,
  },
  languageSection: {
    paddingHorizontal: 15,
    marginTop: 5,
  },
  languageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  languageOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  languageButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  languageButtonActive: {
    backgroundColor: '#e0e7ff',
    borderColor: '#4f6ef7',
  },
  languageText: {
    fontSize: 14,
    color: '#555',
  },
  languageTextActive: {
    color: '#4f6ef7',
    fontWeight: '600',
  },
});