import { ThemeProvider, useTheme } from "@/contexts/theme";
import { Stack } from "expo-router";

function ThemedStack() {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const headerStyle = {
    backgroundColor: isDark ? "#333333" : "#EBEBEB",
  };
  const headerTintColor = isDark ? "#fff" : "#1a1a1a";

  return (
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
      <Stack.Screen name="recover" options={{ headerShown: false }} />
      <Stack.Screen
        name="(tabs)"
        options={{ headerShown: false }}
      />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <ThemedStack />
    </ThemeProvider>
  );
}
