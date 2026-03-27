import {
  useTheme,
  getGradientColors,
  primaryTextColor,
  secondaryTextColor,
} from "@/contexts/theme";
import { useDatabaseStore } from "@/stores/databaseStore";
import { persistStoreToDatabase } from "@/stores/databaseStore";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useCallback } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

export default function DosageSettings() {
  const { resolvedTheme, highContrast } = useTheme();
  const isDark = resolvedTheme === "dark";
  const titleColor = primaryTextColor(resolvedTheme);
  const secondaryColor = secondaryTextColor(resolvedTheme);
  const gradientColors = getGradientColors(resolvedTheme);
  const router = useRouter();
  const user = useDatabaseStore((s) => s.user);
  const setUser = useDatabaseStore((s) => s.setUser);

  const dosesPerDosage = user?.preferences?.dosesPerDosage ?? 7;

  const updateDosesPerDosage = useCallback(
    (n: number) => {
      if (!user || n < 1 || n > 999) return;
      const next = {
        ...user,
        preferences: { ...user.preferences, dosesPerDosage: n },
      };
      setUser(next);
      persistStoreToDatabase().catch(() => {});
    },
    [user, setUser]
  );

  const numberInputBg = highContrast ? (isDark ? "#000000" : "#ffffff") : isDark ? "rgba(255,255,255,0.12)" : "#fff";
  const numberInputBorder = highContrast ? (isDark ? "#ffffff" : "#000000") : isDark ? "rgba(255,255,255,0.3)" : "#ccc";
  const numberInputColor = highContrast ? (isDark ? "#ffffff" : "#000000") : isDark ? "#fff" : "#1a1a1a";
  const placeholderColor = highContrast ? (isDark ? "#ffffff" : "#000000") : isDark ? "rgba(255,255,255,0.5)" : "#888";

  return (
    <LinearGradient colors={[...gradientColors]} style={styles.gradient}>
      <Pressable
        style={({ pressed }) => [styles.backRow, pressed && { opacity: 0.7 }]}
        onPress={() => router.back()}
      >
        <Ionicons name="chevron-back" size={24} color={titleColor} />
        <Text style={[styles.backLabel, { color: titleColor }]}>Back</Text>
      </Pressable>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={[styles.title, { color: titleColor }]}>
          Dosage management and levels
        </Text>
        <Text style={[styles.subtitle, { color: secondaryColor }]}>
          When you create a new dosage, this many scheduled doses are created. Long-press Save for a single one-off dose.
        </Text>
        <View style={styles.row}>
          <Text style={[styles.label, { color: titleColor }]}>
            Doses to create per new dosage
          </Text>
          <TextInput
            style={[
              styles.numberInput,
              { backgroundColor: numberInputBg, borderColor: numberInputBorder, color: numberInputColor },
            ]}
            value={String(dosesPerDosage)}
            onChangeText={(t) => {
              const n = parseInt(t, 10);
              if (!Number.isNaN(n) && n >= 1 && n <= 999) updateDosesPerDosage(n);
            }}
            keyboardType="number-pad"
            placeholder="7"
            placeholderTextColor={placeholderColor}
            accessibilityLabel="Doses to create per new dosage"
          />
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  backRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 4,
  },
  backLabel: { fontSize: 17, fontWeight: "500" },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 40 },
  title: { fontSize: 26, fontWeight: "700", marginBottom: 8 },
  subtitle: { fontSize: 15, marginBottom: 20, lineHeight: 22 },
  row: { marginBottom: 12 },
  label: { fontSize: 16, fontWeight: "500", marginBottom: 6 },
  numberInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    maxWidth: 80,
  },
});
