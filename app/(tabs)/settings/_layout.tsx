import { Stack } from "expo-router";

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
