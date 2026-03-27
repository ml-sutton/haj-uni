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
import { useCallback, useMemo } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

type ThemePresetKey =
  | "light"
  | "dark"
  | "darkHighContrast"
  | "lightHighContrast"
  | "colonthree";

const PRESETS: { key: ThemePresetKey; label: string }[] = [
  { key: "light", label: "Light" },
  { key: "dark", label: "Dark" },
  { key: "darkHighContrast", label: "Dark High contrast" },
  { key: "lightHighContrast", label: "Light high contrast" },
  { key: "colonthree", label: "colonthree" },
];

export default function AppearanceSettings() {
  const { resolvedTheme, highContrast, setTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const neutralBorder = highContrast
    ? isDark
      ? "#ffffff"
      : "#000000"
    : isDark
      ? "rgba(255,255,255,0.1)"
      : "#eee";
  const titleColor = primaryTextColor(resolvedTheme);
  const secondaryColor = secondaryTextColor(resolvedTheme);
  const gradientColors = getGradientColors(resolvedTheme);
  const router = useRouter();

  const safePrefs = useSafePreferencesStore(
    useShallow((s) => ({ theme: s.theme }))
  );
  const updateSafePreferences = useSafePreferencesStore((s) => s.updateSafePreferences);
  const updateSafe = useCallback(
    (patch: Partial<SafePreferences>) => {
      const nextTheme = patch.theme ?? safePrefs.theme;
      setTheme(nextTheme);
      updateSafePreferences(patch);
    },
    [setTheme, safePrefs.theme, updateSafePreferences]
  );

  const selectedPreset = useMemo<ThemePresetKey>(() => {
    if (safePrefs.theme === "colonthree") return "colonthree";
    if (safePrefs.theme === "darkHighContrast") return "darkHighContrast";
    if (safePrefs.theme === "lightHighContrast") return "lightHighContrast";
    if (safePrefs.theme === "dark") return "dark";
    return "light";
  }, [safePrefs.theme]);

  const applyPreset = useCallback(
    (preset: ThemePresetKey) => {
      if (preset === "darkHighContrast") {
        updateSafe({ theme: "darkHighContrast" });
      } else if (preset === "lightHighContrast") {
        updateSafe({ theme: "lightHighContrast" });
      } else if (preset === "colonthree") {
        updateSafe({ theme: "colonthree" });
      } else if (preset === "dark") {
        updateSafe({ theme: "dark" });
      } else {
        updateSafe({ theme: "light" });
      }
    },
    [updateSafe]
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
        <Text style={[styles.sectionTitle, { color: secondaryColor }]}>Theme preset</Text>
        <View style={styles.themeButtons}>
          {PRESETS.map((preset) => (
            <Pressable
              key={preset.key}
              style={[
                styles.themeButtonWrap,
                {
                  borderColor: neutralBorder,
                  backgroundColor:
                    selectedPreset === preset.key
                      ? isDark
                        ? "rgba(255,255,255,0.14)"
                        : "rgba(0,0,0,0.08)"
                      : isDark
                        ? "rgba(255,255,255,0.08)"
                        : "rgba(0,0,0,0.03)",
                },
              ]}
              onPress={() => applyPreset(preset.key)}
            >
              <Text
                style={[
                  styles.themeButtonText,
                  { color: titleColor },
                  selectedPreset === preset.key && styles.themeButtonTextActive,
                ]}
              >
                {preset.label}
              </Text>
            </Pressable>
          ))}
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
  themeButtons: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 6,
  },
  themeButtonWrap: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  themeButtonText: { fontSize: 15, fontWeight: "500" },
  themeButtonTextActive: { fontWeight: "700" },
});
