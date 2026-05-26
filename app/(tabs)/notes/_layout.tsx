import { Stack } from "expo-router";

/**
 * Stack layout for the Notes tab (list and editor).
 *
 * @remarks
 * Expo Router layout at `app/(tabs)/notes/_layout.tsx`.
 *
 * @returns Nested stack for note routes (`index`, `[noteId]`).
 */
export default function NotesLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="[noteId]" />
    </Stack>
  );
}
