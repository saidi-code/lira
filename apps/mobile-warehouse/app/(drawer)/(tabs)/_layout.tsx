import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { COLORS } from "../../../constants/index";
import { View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Header from "@/components/Header"

function TabIconWrapper({
  focused,
  children,
}: {
  focused: boolean;
  children: React.ReactNode;
}) {
  return (
    <View
      style={{
        height: 48,
        width: 48,
        borderRadius: 999,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: focused ? COLORS.primary : COLORS.white,
        borderWidth: 1,
        borderColor: focused ? COLORS.primary : COLORS.white,
       
        marginTop:-32   ,  
        // transform: [{ scale:1}],
        shadowColor: COLORS.shadow,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: focused ? 0.12 : 0.06,
        shadowRadius: 10,
        elevation: focused ? 4 : 1,
        
      }}
    >
      {children}
    </View>
  );
}
export default function TabLayout() {
  return (
    <SafeAreaView className="bg-surface flex-1" edges={["top"]}>
      <Header showSearch showBack={false} />
      <Tabs
        initialRouteName="shop"
        
        screenOptions={{
        
          headerShown: false,
          tabBarShowLabel: true,
          // tabBarActiveTintColor: COLORS.active,
          // tabBarInactiveTintColor: COLORS.inactive,
          tabBarLabelStyle: {
            fontSize: 7,
            fontWeight: "600",
            color: COLORS.white,
            marginBottom: 2,
          },
        
          tabBarStyle: {
          
            borderWidth: 1,
            // borderColor: COLORS.active,
            borderTopColor: COLORS.canvas,
          shadowColor: COLORS.shadow,
          // shadowOffset: { width: 0, height: 6 },
            borderRadius:14,
            // elevation: 6,
            // height: 78,
            // paddingTop: 16,
            // paddingBottom: 32,
            // marginBottom:50,
            // backgroundColor:COLORS.accent,
            backgroundColor: COLORS.primary,
            height:62
          
          },
          animation: "shift",
          
        }}
      >
      
        <Tabs.Screen
          name="wishlist"
          options={{
          
            title: "المفضلة",
            tabBarIcon: ({ focused }) => (
              <TabIconWrapper focused={focused}>
                <Ionicons
                  size={20}
                      name={focused ? "heart-sharp" : "heart-outline"} 
                    color={focused ? COLORS.white : COLORS.primary}
                />
              </TabIconWrapper>
            ),
          }}
        />

        <Tabs.Screen
          name="index"
            options={{
                title: "البحث",
            
              tabBarIcon: ({ focused }) => (
              <TabIconWrapper focused={focused}>
                <Ionicons
                  size={20}
                  name={focused ? "search-sharp" : "search-outline"} 
                  color={focused ? COLORS.white : COLORS.inactive}
                />
              </TabIconWrapper>
            ),
          
          
          }}
        />
          <Tabs.Screen
        name="shop"
          options={{
          title: "المتجر",
          
            tabBarIcon: ({ focused }) => (
            <View style={{
                  height: 56,
                  width: 56,
                  borderRadius: 999,
                  justifyContent: "center",
                  alignItems: "center",
                  backgroundColor: focused ? COLORS.primary : COLORS.white,
                  borderWidth: 1,
                  borderColor: focused ? COLORS.primary : COLORS.white,
                  transform: [{ scale: focused ? 1.08 : 1 }],
                  shadowColor: COLORS.shadow ,
                  shadowOpacity: focused ? 0.12 : 0.06,
                  shadowRadius: 10,
                  shadowOffset: { width: 0, height: 6 },
                  elevation: focused ? 4 : 1,
                  marginTop:-32
        }}>
                <Ionicons
                  size={32}
                  name={focused ? "rose-sharp" : "rose-outline"} 
                  color={focused ? COLORS.white : COLORS.primary}
                />
                </View>
            
            ),

          
        
          }}
        />
          <Tabs.Screen
          name="cart"
          options={{
            title: "الحقيبة",
            tabBarIcon: ({ focused }) => (
              <TabIconWrapper focused={focused}>
                <Ionicons
                  size={20}
                
                  name={focused ? "bag-sharp" : "bag-outline"} 
                  
                  color={focused ? COLORS.white : COLORS.inactive}
                />
              </TabIconWrapper>
            ),
          }}
          // options={{
          //   href: null, // 🚀 hides from tab bar
          // }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: "الملف الشخصي",
            tabBarIcon: ({ focused }) => (
              <TabIconWrapper focused={focused}>
                <Ionicons
                  size={20}
                    name={focused ? "person-sharp" : "person-outline"} 
                    color={focused ? COLORS.white : COLORS.inactive}
                />
              </TabIconWrapper>
            ),          
          }}
        />
    
      </Tabs>
  </SafeAreaView>
   
  );
}
