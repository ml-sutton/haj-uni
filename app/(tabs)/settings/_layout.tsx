import { Stack } from "expo-router";

/**
 * Stack layout for Settings sub-screens (appearance, privacy, danger zone, etc.).
 *
 * @remarks
 * Expo Router layout at `app/(tabs)/settings/_layout.tsx`.
 *
 * @returns Nested stack for settings child routes.
 */
export default function SettingsLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="appearance" />
      <Stack.Screen name="privacy" />
      <Stack.Screen name="dangerzone" />
      <Stack.Screen name="dosage" />
      <Stack.Screen name="about" />
      <Stack.Screen name="credits" />
    </Stack>
  );
}
