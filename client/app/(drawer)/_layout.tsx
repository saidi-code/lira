import { Drawer } from 'expo-router/drawer';
import {
  DrawerContentScrollView,
  DrawerItemList,
  DrawerItem,
} from '@react-navigation/drawer';
import {
  View,
  Text,
  Switch,
  StyleSheet,
  TouchableOpacity,
  useColorScheme,
} from 'react-native';
import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons'; // Optional: for nice icons
import { COLORS } from '../../constants/index'; // Adjust the path as needed

// --- 1. CUSTOM DRAWER CONTENT COMPONENT ---
function CustomDrawerContent(props: any) {
  // Dark mode state (connect this to your actual Theme Context)
  const systemTheme = useColorScheme(); // 'light' or 'dark'
  const [isDark, setIsDark] = useState(systemTheme === 'dark');

  // Language state
  const [currentLang, setCurrentLang] = useState('English');
  const languages = ['English', 'Spanish', 'French', 'German'];

  const toggleDarkMode = () => {
    setIsDark((prev) => !prev);
    // In a real app, you would call your Theme Context here, e.g.:
    // ThemeContext.setTheme(!isDark ? 'dark' : 'light');
    // Or use Appearance.setColorScheme(!isDark ? 'dark' : 'light');
  };

  const selectLanguage = (lang: string) => {
    setCurrentLang(lang);
    // In a real app, you would call your i18n instance here, e.g.:
    // i18n.changeLanguage(lang.toLowerCase());
  };

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
      {/* <DrawerItemList {...props} /> */}

    

      {/* --- DARK MODE TOGGLE --- */}
      {/* <DrawerItem
     style={{height:50}}
        icon={({ color, size }) => (
          <Ionicons name={isDark ? 'moon' : 'sunny'} size={size} color={color} />
        )}
        
        label={({color,size}) => (
          <View style={{...styles.toggleRow,backgroundColor:"yellow",height:50}}>
            <Text style={{
                ...styles.labelText,
                lineHeight:10
                   }}>Dark Mode</Text>
            <Switch
            
              value={isDark}
              onValueChange={toggleDarkMode}
              trackColor={{ false: COLORS.inactive, true: COLORS.primary }}
              thumbColor={isDark ? '#f5dd4b' : '#f4f3f4'}
            />
            
          </View>
        )}
        onPress={toggleDarkMode} // Toggle also on label press
      /> */}
 <View style={{display:"flex",flexDirection:"row",alignItems:"center",justifyContent:"space-between",paddingHorizontal:15,height:50}}>
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
            
          </View>
      {/* --- LANGUAGE SELECTOR --- */}
      <View style={styles.languageSection}>
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
      </View>
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
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.primary,
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