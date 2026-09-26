import {Drawer} from "@/config/Drawer/Drawer";
import { DrawerContentScrollView } from '@react-navigation/drawer';
import {
  Modal,
  Pressable,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useMemo, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants/index';
import {
  CURRENCIES,
  LANGUAGES,
  THEME_MODES,
  useSettings,
  type CurrencyCode,
} from '../../context/SettingsContext';
import { useAppColors, type Colors } from '../../constants/utility';
import { useTranslation } from '../../hooks/useTranslation';
import type { TranslationKey } from '../../constants/i18n';

// --- 1. CUSTOM DRAWER CONTENT COMPONENT ---
function CustomDrawerContent(props: any) {
  const colors = useAppColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  // الإعدات، تُقرأ Context
  const {
    settings,
    setLanguage,
    setCurrency,
    setTheme,
    setPhoneNotifications,
    setEmailNotifications,
    languageLabel,
    currencySymbol,
  } = useSettings();

  const [picker, setPicker] = useState<PickerKind | null>(null);
  const openPicker = (kind: PickerKind) => setPicker(kind);
  const closePicker = () => setPicker(null);

  const { t, setTextDirection } = useTranslation();

  const themeLabel = t(
    settings.theme === "light"
      ? "light"
      : settings.theme === "dark"
        ? "dark"
        : "system"
  );

  return (
    
    <DrawerContentScrollView
      {...props}
      contentContainerStyle={styles.drawerContainer}
    >
      {/* --- DRAWER HEADER (Optional) --- */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}> {t("settings")} <Ionicons name="settings-outline" size={16}/></Text>
      </View>

      {/* --- DEFAULT NAVIGATION ITEMS (Your screens) --- */}
     <View className="mx-4">
          <View className="mb-6">
            <View className="border-r-2 border-r-primary-700 mb-4">
              <Text
                className="font-tajwal mr-4 text-2xl
                     text-primary font-bold text-right"
              >
                {t("notifications")}
              </Text>
            </View>
            <View className=" bg-card rounded-xl shadow">
              <View className="flex-row items-center justify-between">
                <Switch
                  trackColor={{ false: colors.surface, true: colors.primary }}
                  // thumbColor={isEnabled ? "#f5dd4b" : "#f4f3f4"}
                  ios_backgroundColor="#3e3e3e"
                  onValueChange={setPhoneNotifications}
                  value={settings.phoneNotifications}
                />
                <View className="flex-row justify-end items-center gap-6 p-4 border-b border-b-primary-100">
                  <Text className="text-lg font-body font-meduim">
                    {t("phoneNotifications")}
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
                  trackColor={{ false: colors.surface, true: colors.primary }}
                  // thumbColor={isEnabled ? "#f5dd4b" : "#f4f3f4"}
                  ios_backgroundColor="#3e3e3e"
                  onValueChange={setEmailNotifications}
                  value={settings.emailNotifications}
                />
                <View className="flex-row justify-end items-center gap-6 p-4 border-b border-b-primary-100">
                  <Text className="text-lg font-body font-meduim">
                    {t("emailNotifications")}
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
                {t("preferences")}
              </Text>
            </View>
            <View className="bg-card rounded-xl shadow overflow-hidden">
              <SettingRow
                icon="earth-outline"
                label={t("language")}
                value={languageLabel}
                onPress={() => openPicker("language")}
              />
              <View className="h-px bg-subtle mx-4" />
              <SettingRow
                icon="cash-outline"
                label={t("currency")}
                value={`${currencySymbol} ${settings.currency}`}
                onPress={() => openPicker("currency")}
              />
              <View className="h-px bg-subtle mx-4" />
              <SettingRow
                icon="moon-outline"
                label={t("theme")}
                value={themeLabel}
                onPress={() => openPicker("theme")}
              />
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
              trackColor={{ false: colors.inactive, true: colors.primary }}
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

      {/* --- SETTINGS PICKER MODAL --- */}
      <Modal
        visible={picker !== null}
        transparent
        animationType="fade"
        onRequestClose={closePicker}
      >
        <View className="flex-1 justify-end">
          <Pressable className="flex-1 bg-black/40" onPress={closePicker} />
          <View className="bg-card rounded-t-3xl px-5 pt-5 pb-10">
            <Text className="font-tajwal text-lg font-bold text-primary text-center mb-5">
              {picker ? t(PICKER_TITLE_KEYS[picker]) : ""}
            </Text>

            {picker === "language" &&
              LANGUAGES.map((option) => (
                <OptionRow
                  key={option.code}
                  label={option.label}
                  selected={settings.language === option.code}
                  onPress={() => {
                    setLanguage(option.code);
                    // Arabic is RTL; French/English are LTR. Flipping here (from
                    // a user gesture, as RN requires) mirrors the whole app.
                    setTextDirection(option.code === "ar");
                    closePicker();
                  }}
                />
              ))}

            {picker === "currency" &&
              CURRENCIES.map((option) => (
                <OptionRow
                  key={option.code}
                  label={`${t(CURRENCY_LABEL_KEYS[option.code])} (${option.symbol})`}
                  selected={settings.currency === option.code}
                  onPress={() => {
                    setCurrency(option.code);
                    closePicker();
                  }}
                />
              ))}

            {picker === "theme" &&
              THEME_MODES.map((option) => (
                <OptionRow
                  key={option.code}
                  label={option.label}
                  selected={settings.theme === option.code}
                  onPress={() => {
                    setTheme(option.code);
                    closePicker();
                  }}
                />
              ))}
          </View>
        </View>
      </Modal>
    </DrawerContentScrollView>
   
  );
}


// --- 1b. SETTINGS ROW COMPONENTS ---
type PickerKind = "language" | "currency" | "theme";

// Maps a picker to its translation key rather than a fixed string, so the
// modal title follows the active language.
const PICKER_TITLE_KEYS: Record<PickerKind, TranslationKey> = {
  language: "chooseLanguage",
  currency: "chooseCurrency",
  theme: "chooseTheme",
};

// Currency names live in the catalog so the picker follows the active
// language; the symbols and codes stay locale-independent.
const CURRENCY_LABEL_KEYS: Record<CurrencyCode, TranslationKey> = {
  TND: "currencyTND",
  EUR: "currencyEUR",
  USD: "currencyUSD",
  SAR: "currencySAR",
};

type IconName = React.ComponentProps<typeof Ionicons>["name"];

function SettingRow({
  icon,
  label,
  value,
  onPress,
}: {
  icon: IconName;
  label: string;
  value: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      className="flex-row items-center justify-between p-4"
      activeOpacity={0.7}
    >
      <View className="flex-row justify-end items-center gap-6">
        <Text className="text-lg font-body font-meduim">{label}</Text>
        <Ionicons name={icon} size={16} color={COLORS.primary} />
      </View>
      <View className="flex-row items-center gap-2">
        <Text className="text-base font-body text-primary">{value}</Text>
        <Ionicons name="chevron-back" size={14} color={COLORS.inactive} />
      </View>
    </TouchableOpacity>
  );
}

function OptionRow({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      className="flex-row items-center justify-between py-4 px-2"
      activeOpacity={0.7}
    >
      <Text
        className={`text-base font-body ${selected ? "text-primary font-bold" : "text-gray-700"}`}
      >
        {label}
      </Text>
      {selected && (
        <Ionicons name="checkmark" size={18} color={COLORS.primary} />
      )}
    </TouchableOpacity>
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
const createStyles = (colors: Colors) =>
  StyleSheet.create({
  drawerContainer: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: colors.surface,
    marginBottom: 10,
   
    direction:"rtl"
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.primary,
    direction:"rtl"
  },
  divider: {
    height: 1,
    backgroundColor: colors.surface,
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
  
    color: colors.primary,
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