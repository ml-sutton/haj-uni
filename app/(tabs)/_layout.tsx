import { useTheme } from "@/contexts/theme";
import { Tabs } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useMemo } from "react";
import { StyleSheet } from "react-native";
import { TitleBar } from "@/components/TitleBar";

const DARK_GRADIENT = ["#6495ed", "#73c2fb"] as const;
const LIGHT_GRADIENT = ["#FFA4B6", "#F19CBB"] as const;
const DARK_ACTIVE_TINT = "#f19cbb";
const LIGHT_ACTIVE_TINT = "#7fbfe9";
const DARK_INACTIVE_TINT = "rgba(255,255,255,0.75)";
const LIGHT_INACTIVE_TINT = "rgba(26,26,26,0.7)";
const DARK_BORDER = "#f19cbb";
const LIGHT_BORDER = "#7fbfe9";

export default function TabsLayout() {
  const { resolvedTheme } = useTheme();

  const gradientColors = useMemo(
    () => (resolvedTheme === "dark" ? DARK_GRADIENT : LIGHT_GRADIENT),
    [resolvedTheme]
  );

  const tabBarOptions = useMemo(
    () => ({
      tabBarActiveTintColor: resolvedTheme === "dark" ? DARK_ACTIVE_TINT : LIGHT_ACTIVE_TINT,
      tabBarInactiveTintColor: resolvedTheme === "dark" ? DARK_INACTIVE_TINT : LIGHT_INACTIVE_TINT,
      tabBarStyle: {
        borderTopColor: resolvedTheme === "dark" ? DARK_BORDER : LIGHT_BORDER,
        borderTopWidth: 2,
      },
      tabBarBackground: () => (
        <LinearGradient
          colors={[...gradientColors]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={StyleSheet.absoluteFill}
        />
      ),
      header: () => <TitleBar />,
    }),
    [resolvedTheme, gradientColors]
  );

  return (
    <Tabs screenOptions={tabBarOptions}>
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="doses"
        options={{
          title: "Doses",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="medical" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="levels"
        options={{
          title: "Levels",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="analytics" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Settings",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="settings" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
