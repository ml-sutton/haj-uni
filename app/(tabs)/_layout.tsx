import { TitleBar } from "@/components/TitleBar";
import { useTheme } from "@/contexts/theme";
import { useDatabaseStore } from "@/stores/databaseStore";
import { useStoreSync } from "@/stores/storeSync";
import { useSafePreferencesStore } from "@/stores/safePreferencesStore";
import { findActiveUntakenDose } from "@/utils/doseQueries";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Tabs, useRouter, type Href } from "expo-router";
import { useEffect, useMemo, useRef } from "react";
import { AppState, type AppStateStatus, StyleSheet } from "react-native";

const DARK_GRADIENT = ["#6495ed", "#73c2fb"] as const;
const LIGHT_GRADIENT = ["#FFA4B6", "#F19CBB"] as const;
const DARK_ACTIVE_TINT = "#f19cbb";
const LIGHT_ACTIVE_TINT = "#7fbfe9";
const DARK_INACTIVE_TINT = "rgba(255,255,255,0.75)";
const LIGHT_INACTIVE_TINT = "rgba(26,26,26,0.7)";
const DARK_BORDER = "#f19cbb";
const LIGHT_BORDER = "#7fbfe9";

const ACTIVE_DOSE_POLL_MS = 30_000;

export default function TabsLayout() {
  const { resolvedTheme, setTheme, setHighContrast } = useTheme();
  const router = useRouter();
  useStoreSync();
  const hasHydratedRef = useRef(false);
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);

  useEffect(() => {
    const checkActiveDose = () => {
      const { user, isAuthed } = useDatabaseStore.getState();
      if (!isAuthed || !user) return;
      const active = findActiveUntakenDose(user.dosages ?? []);
      if (active) {
        const href =
          `/active-dose?doseId=${encodeURIComponent(active.dose.id)}` as Href;
        router.replace(href);
      }
    };

    checkActiveDose();
    const interval = setInterval(checkActiveDose, ACTIVE_DOSE_POLL_MS);
    const sub = AppState.addEventListener("change", (next) => {
      if (appStateRef.current.match(/inactive|background/) && next === "active") {
        checkActiveDose();
      }
      appStateRef.current = next;
    });
    return () => {
      clearInterval(interval);
      sub.remove();
    };
  }, [router]);

  useEffect(() => {
    if (hasHydratedRef.current) return;
    hasHydratedRef.current = true;
    useSafePreferencesStore.getState().hydrateFromDb().then(() => {
      const prefs = useSafePreferencesStore.getState();
      setTheme(prefs.theme);
      setHighContrast(prefs.highContrast);
    });
  }, [setTheme, setHighContrast]);

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
        name="notes"
        options={{
          title: "Notes",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="document-text" size={size} color={color} />
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
