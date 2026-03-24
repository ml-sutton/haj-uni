import {
  useTheme,
  getGradientColors,
  primaryTextColor,
  secondaryTextColor,
} from "@/contexts/theme";
import type { SafePreferences } from "@/models/preferences";
import { useSafePreferencesStore } from "@/stores/safePreferencesStore";
import { useShallow } from "zustand/react/shallow";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useCallback } from "react";
import { Pressable, ScrollView, StyleSheet, Switch, Text, View } from "react-native";

const themeButtonBg = (isDark: boolean, active: boolean) =>
  active ? (isDark ? "rgba(0,102,204,0.4)" : "rgba(0,102,204,0.15)") : isDark ? "rgba(255,255,255,0.15)" : "#f0f0f0";
const themeButtonTextColor = (isDark: boolean, active: boolean) =>
  active ? (isDark ? "#7fbfe9" : "#0066cc") : isDark ? "rgba(255,255,255,0.8)" : "#666";

export default function AppearanceSettings() {
  const { resolvedTheme, setTheme, setHighContrast } = useTheme();
  const isDark = resolvedTheme === "dark";
  const titleColor = primaryTextColor(resolvedTheme);
  const secondaryColor = secondaryTextColor(resolvedTheme);
  const gradientColors = getGradientColors(resolvedTheme);
  const router = useRouter();

  const safePrefs = useSafePreferencesStore(
    useShallow((s) => ({ theme: s.theme, highContrast: s.highContrast }))
  );
  const updateSafePreferences = useSafePreferencesStore((s) => s.updateSafePreferences);

  const updateSafe = useCallback(
    (patch: Partial<SafePreferences>) => {
      const nextTheme = patch.theme ?? safePrefs.theme;
      const nextHighContrast = patch.highContrast ?? safePrefs.highContrast;
      setTheme(nextTheme);
      setHighContrast(nextHighContrast);
      updateSafePreferences(patch);
    },
    [setTheme, setHighContrast, safePrefs.theme, safePrefs.highContrast, updateSafePreferences]
  );

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
      >
        <Text style={[styles.title, { color: titleColor }]}>
          Appearance and accessibility
        </Text>
        <Text style={[styles.sectionTitle, { color: secondaryColor }]}>Theme</Text>
        <View style={styles.themeButtons}>
          {(["system", "light", "dark"] as const).map((theme) => (
            <Pressable
              key={theme}
              style={[
                styles.themeButtonWrap,
                { backgroundColor: themeButtonBg(isDark, safePrefs.theme === theme) },
              ]}
              onPress={() => updateSafe({ theme })}
            >
              <Text
                style={[
                  styles.themeButtonText,
                  { color: themeButtonTextColor(isDark, safePrefs.theme === theme) },
                  safePrefs.theme === theme && styles.themeButtonTextActive,
                ]}
              >
                {theme.charAt(0).toUpperCase() + theme.slice(1)}
              </Text>
            </Pressable>
          ))}
        </View>
        <View style={[styles.toggleRow, { borderBottomColor: isDark ? "rgba(255,255,255,0.1)" : "#eee" }]}>
          <Text style={[styles.toggleLabel, { color: titleColor }]}>High contrast</Text>
          <Switch
            value={safePrefs.highContrast}
            onValueChange={(highContrast) => updateSafe({ highContrast })}
            accessibilityLabel="High contrast mode"
          />
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  loadingWrap: { flex: 1, justifyContent: "center", alignItems: "center" },
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
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    marginTop: 16,
    marginBottom: 8,
    textTransform: "uppercase",
  },
  themeButtons: { flexDirection: "row", gap: 12, marginBottom: 16 },
  themeButtonWrap: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  themeButtonText: { fontSize: 16 },
  themeButtonTextActive: { fontWeight: "600" },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  toggleLabel: { fontSize: 16, flex: 1 },
});
