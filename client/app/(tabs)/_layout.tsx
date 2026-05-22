import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { COLORS } from "../../constants/index";
export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: true,
        tabBarActiveTintColor: COLORS.active,
        tabBarInactiveTintColor: COLORS.inactive,
        tabBarStyle: {
          backgroundColor: "#FCF9F1",

          opacity: 0.8,
          borderTopWidth: 1,
          borderTopColor: "#F0F0F0",
          height: 96,
          //   paddingTop: 6,
          //   paddingBottom: 6,
          //   elevation: 1,
        },
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
        options={{
          title: "المفضلة",
          tabBarIcon: ({ color, focused }) => {
            return (
              <Ionicons
                size={24}
                name="heart-sharp"
                color={focused ? COLORS.active : COLORS.inactive}
              />
            );
          },
        }}
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
