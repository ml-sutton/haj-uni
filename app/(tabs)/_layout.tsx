import { TitleBar } from "@/components/TitleBar";
import {
  getGradientColors,
  tabBarActiveTint,
  tabBarBorderColor,
  tabBarInactiveTint,
  useTheme,
} from "@/contexts/theme";
import { useDatabaseStore } from "@/stores/databaseStore";
import { useStoreSync } from "@/stores/storeSync";
import { useSafePreferencesStore } from "@/stores/safePreferencesStore";
import { findActiveUntakenDose } from "@/utils/doseQueries";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Tabs, useRouter, type Href } from "expo-router";
import { useEffect, useMemo, useRef } from "react";
import { AppState, type AppStateStatus, StyleSheet } from "react-native";

const ACTIVE_DOSE_POLL_MS = 30_000;
const TABS_DARK_GRADIENT = ["#6495ed", "#73c2fb"] as const;
const TABS_LIGHT_GRADIENT = ["#FFA4B6", "#F19CBB"] as const;

/**
 * Main tab navigator (Home, Doses, Levels, Notes, Settings) with shared chrome.
 *
 * @remarks
 * Expo Router layout at `app/(tabs)/_layout.tsx`. Runs {@link useStoreSync},
 * hydrates theme preferences, and polls for active doses to redirect to
 * `/active-dose` when a reminder window opens.
 *
 * @returns The themed bottom-tab navigator.
 */
export default function TabsLayout() {
  const { theme, resolvedTheme, highContrast, setTheme } = useTheme();
  const router = useRouter();
  useStoreSync();
  const hasHydratedRef = useRef(false);
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);

  // Redirect to active-dose when an untaken dose enters its window; recheck on resume.
  useEffect(() => {
    const checkActiveDose = () => {
      const { user, isAuthed } = useDatabaseStore.getState();
      if (!isAuthed || !user) return;
      const allDosages = (user.medications ?? []).flatMap((m) => m.dosages);
      const active = findActiveUntakenDose(allDosages);
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

  // One-time theme hydration from safe preferences after tabs mount.
  useEffect(() => {
    if (hasHydratedRef.current) return;
    hasHydratedRef.current = true;
    useSafePreferencesStore.getState().hydrateFromDb().then(() => {
      const prefs = useSafePreferencesStore.getState();
      setTheme(prefs.theme);
    });
  }, [setTheme]);

  const gradientColors = useMemo(
    () =>
      highContrast
        ? resolvedTheme === "dark"
          ? (["#000000", "#000000"] as const)
          : (["#ffffff", "#ffffff"] as const)
        : theme === "colonthree"
          ? getGradientColors(resolvedTheme, { themeMode: theme, highContrast })
          : resolvedTheme === "dark"
            ? TABS_DARK_GRADIENT
            : TABS_LIGHT_GRADIENT,
    [theme, resolvedTheme, highContrast]
  );

  const tabBarOptions = useMemo(
    () => ({
      tabBarActiveTintColor: highContrast
        ? resolvedTheme === "dark"
          ? "#ffffff"
          : "#000000"
        : tabBarActiveTint(resolvedTheme, { themeMode: theme, highContrast }),
      tabBarInactiveTintColor: highContrast
        ? resolvedTheme === "dark"
          ? "#ffffff"
          : "#000000"
        : tabBarInactiveTint(resolvedTheme, { themeMode: theme, highContrast }),
      tabBarStyle: {
        borderTopColor: tabBarBorderColor(resolvedTheme, {
          themeMode: theme,
          highContrast,
        }),
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
    [theme, resolvedTheme, highContrast, gradientColors]
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
