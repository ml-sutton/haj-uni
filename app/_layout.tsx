import { QuickExitGyroscopeListener } from "@/components/QuickExitGyroscopeListener";
import { migrateLegacyStorage } from "@/lib/secureStorage";
import {
  ThemeProvider,
  cardBackgroundColor,
  primaryTextColor,
  useTheme,
} from "@/contexts/theme";
import { useSafePreferencesStore } from "@/stores/safePreferencesStore";
import { Stack } from "expo-router";
import { useEffect, useRef } from "react";

function ThemedStack() {
  const { theme, resolvedTheme, highContrast, setTheme } = useTheme();
  const hasHydratedRef = useRef(false);

  useEffect(() => {
    if (hasHydratedRef.current) return;
    hasHydratedRef.current = true;
    void migrateLegacyStorage();
    useSafePreferencesStore.getState().hydrateFromDb().then(() => {
      const prefs = useSafePreferencesStore.getState();
      setTheme(prefs.theme);
    });
  }, [setTheme]);

  const headerStyle = {
    backgroundColor: cardBackgroundColor(resolvedTheme, {
      themeMode: theme,
      highContrast,
    }),
  };
  const headerTintColor = primaryTextColor(resolvedTheme, {
    themeMode: theme,
    highContrast,
  });

  return (
    <>
      <QuickExitGyroscopeListener />
      <Stack
        screenOptions={{
          headerStyle,
          headerTintColor,
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="getStarted" options={{ headerShown: false }} />
        <Stack.Screen
          name="login"
          options={{ headerShown: false, gestureEnabled: false }}
        />
        <Stack.Screen name="register" options={{ headerShown: false }} />
        <Stack.Screen
          name="firebase-sign-in"
          options={{ title: "Firebase", headerShown: true }}
        />
        <Stack.Screen
          name="firebase-logged-in"
          options={{ title: "Cloud sync", headerShown: true }}
        />
        <Stack.Screen name="recover" options={{ headerShown: false }} />
        <Stack.Screen
          name="(tabs)"
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="active-dose"
          options={{ headerShown: false, gestureEnabled: false }}
        />
        <Stack.Screen
          name="find-pharmacies"
          options={{ headerShown: false, title: "Nearby pharmacies" }}
        />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <ThemedStack />
    </ThemeProvider>
  );
}
