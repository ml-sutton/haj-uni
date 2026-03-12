import { Stack } from "expo-router";

export default function DosesLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="create" />
      <Stack.Screen name="[doseId]" />
    </Stack>
  );
}
