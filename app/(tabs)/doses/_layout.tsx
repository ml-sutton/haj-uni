import { Stack } from "expo-router";

/**
 * Stack layout for the Doses tab (list, create, detail).
 *
 * @remarks
 * Expo Router layout at `app/(tabs)/doses/_layout.tsx`. Hides stack headers;
 * child screens provide their own back navigation.
 *
 * @returns Nested stack for dose routes.
 */
export default function DosesLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="create" />
      <Stack.Screen name="[doseId]" />
    </Stack>
  );
}
