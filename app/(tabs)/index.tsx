import { Calendar } from "@/components/index/Calendar";
import { NotepadNav } from "@/components/index/NotepadNav";
import { Welcome } from "@/components/index/Welcome";
import {
  getGradientColors,
  primaryTextColor,
  secondaryTextColor,
  useTheme,
} from "@/contexts/theme";
import { useDatabaseStore } from "@/stores/databaseStore";
import { LinearGradient } from "expo-linear-gradient";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

/**
 * Home tab: personalized welcome, dose calendar, and notepad shortcuts.
 *
 * @remarks
 * Expo Router file route: `/(tabs)` / `/(tabs)/index` (`app/(tabs)/index.tsx`).
 * Requires decrypted user in {@link useDatabaseStore}.
 *
 * @returns The home dashboard or loading/unauthenticated placeholders.
 */
export default function Home() {
  const { resolvedTheme } = useTheme();
  const encryptionKey = useDatabaseStore((s) => s.encryptionKey);
  const user = useDatabaseStore((s) => s.user);
  const titleColor = primaryTextColor(resolvedTheme);
  const secondaryColor = secondaryTextColor(resolvedTheme);

  const gradientColors = getGradientColors(resolvedTheme);
  const loading = encryptionKey != null && user === null;

  if (loading) {
    return (
      <LinearGradient colors={[...gradientColors]} style={styles.gradient}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={titleColor} />
          <Text style={[styles.hint, { color: secondaryColor }]}>Loading user data…</Text>
        </View>
      </LinearGradient>
    );
  }

  if (!encryptionKey || !user) {
    return (
      <LinearGradient colors={[...gradientColors]} style={styles.gradient}>
        <View style={styles.centered}>
          <Text style={[styles.hint, { color: secondaryColor }]}>
            {!encryptionKey
              ? "Not signed in. User data is encrypted."
              : "Loading user data…"}
          </Text>
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={[...gradientColors]} style={styles.gradient}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Welcome user={user} />
        <Calendar user={user} />
        <NotepadNav user={user} />
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  scroll: { flex: 1 },
  content: { padding: 20, paddingBottom: 40 },
  hint: { marginTop: 8, fontSize: 16 },
});
