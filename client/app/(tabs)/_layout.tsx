import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { COLORS } from "../../constants/index";
import {View} from "react-native"
export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarActiveTintColor: COLORS.active,
        tabBarInactiveTintColor: COLORS.inactive,
        tabBarStyle: {
          backgroundColor: "#FCF9F1",
          // opacity: 0.8,
          borderWidth: 1,
          borderTopColor: "#F0F0F0",
          // height: 96,
          //   paddingTop: 6,
          //   paddingBottom: 6,
            elevation: 1,
            borderBttomColor:"black",
        },
        animation:"shift"
        
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "رئيسية",
          tabBarIcon: ({ focused }) => {
            return (
              <Ionicons
                size={24}
                name="home-sharp"
                color={focused ? COLORS.active : COLORS.inactive}
              />
            );
          },
        }}
      />
      <Tabs.Screen
        name="wishlist"
        options= {{
              title: "المفضلة",
              tabBarIcon: ({ color, focused }) => {
                return (
                  <View
                  className="shadow-white shadow-md" 
                  style = {{ 
                    backgroundColor:focused ? COLORS.active :"white",
                    borderRadius:"100%",
                    height:35,
                    width:35,
                    position:"absoulte",
                    top:-14,
                    scale:focused ? 2 : 1
              
                  
                  
                  }} >
                        <Ionicons
                      style={{
                       
                      }}
                          size= {focused ? 24: 22}
                          name="heart-sharp"
                          color={focused ? "white" :COLORS.active }
                          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
                        />
                  </View>
                )
              }}
        } 
      />

      <Tabs.Screen
        name="shop"
        options={{
          title: "المتجر",
          tabBarIcon: ({ color, focused }) => {
            return (
              <Ionicons
                size={24}
                name="rose-sharp"
                color={focused ? COLORS.active : COLORS.inactive}
              />
            );
          },
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "الملف الشخصي",
          tabBarIcon: ({ color, focused }) => {
            return (
              <Ionicons
                size={24}
                name="person-sharp"
                color={focused ? COLORS.active : COLORS.inactive}
              />
            );
          },
        }}
      />
      <Tabs.Screen
        name="cart"
        options={{
          href: null, // 🚀 hides from tab bar
        }}
      />
    </Tabs>
  );
}
