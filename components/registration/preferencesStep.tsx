import type { SafePreferences, SecurePreferences } from "@/models/preferences";
import { useTheme } from "@/contexts/theme";
import {
  isBiometricUnlockAvailable,
  isNativeBiometricPlatform,
} from "@/service/biometricKeyStore";
import React, { useCallback, useMemo, useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";

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

/**
 * Props for {@link PreferencesStep}.
 */
export interface PreferencesStepProps {
  /**
   * @param safePreferences - Non-encrypted preference values (theme, privacy toggles, notifications).
   */
  safePreferences: SafePreferences;
  /**
   * @param securePreferences - Encrypted preference values (self-destruct threshold, doses per dosage).
   */
  securePreferences: SecurePreferences;
  /**
   * @param onSafeChange - Called with the full updated safe preferences object when any safe field changes.
   */
  onSafeChange: (safe: SafePreferences) => void;
  /**
   * @param onSecureChange - Called with the full updated secure preferences object when any secure field changes.
   */
  onSecureChange: (secure: SecurePreferences) => void;
}

/**
 * Registration step for theme preset, privacy toggles, notifications, biometrics, and numeric security settings.
 *
 * @param props - Current preference snapshots and change handlers.
 * @returns A scrollable form with dropdown, switches, and number inputs bound to registration state.
 */
export function PreferencesStep({
  safePreferences,
  securePreferences,
  onSafeChange,
  onSecureChange,
}: PreferencesStepProps): React.ReactElement {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  const sectionTitleColor = isDark ? "rgba(255,255,255,0.7)" : "#666";
  const labelColor = isDark ? "#fff" : "#1a1a1a";
  const toggleBorderColor = isDark ? "rgba(255,255,255,0.1)" : "#eee";
  const numberInputBg = isDark ? "rgba(255,255,255,0.12)" : "#fff";
  const numberInputBorder = isDark ? "rgba(255,255,255,0.3)" : "#ccc";
  const numberInputColor = isDark ? "#fff" : "#1a1a1a";
  const placeholderColor = isDark ? "rgba(255,255,255,0.5)" : "#888";

  const setSafe = useCallback(
    (patch: Partial<SafePreferences>) => {
      onSafeChange({ ...safePreferences, ...patch });
    },
    [onSafeChange, safePreferences]
  );

  const setSecure = useCallback(
    (patch: Partial<SecurePreferences>) => {
      onSecureChange({ ...securePreferences, ...patch });
    },
    [onSecureChange, securePreferences]
  );

  const [presetOpen, setPresetOpen] = useState(false);
  const selectedPreset = useMemo<ThemePresetKey>(() => {
    if (safePreferences.theme === "colonthree") return "colonthree";
    if (safePreferences.theme === "darkHighContrast") return "darkHighContrast";
    if (safePreferences.theme === "lightHighContrast") return "lightHighContrast";
    if (safePreferences.theme === "dark") return "dark";
    if (safePreferences.theme === "light") return "light";
    return resolvedTheme === "dark" ? "dark" : "light";
  }, [safePreferences.theme, resolvedTheme]);

  const applyPreset = useCallback(
    (preset: ThemePresetKey) => {
      setSafe({ theme: preset });
      setPresetOpen(false);
    },
    [setSafe]
  );

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <Text style={[styles.sectionTitle, { color: sectionTitleColor }]}>Appearance</Text>
      <View style={styles.row}>
        <Text style={[styles.label, { color: labelColor }]}>Theme preset</Text>
        <View style={styles.dropdownWrap}>
          <Pressable
            style={[
              styles.dropdownTrigger,
              {
                borderColor: toggleBorderColor,
                backgroundColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.03)",
              },
            ]}
            onPress={() => setPresetOpen((v) => !v)}
          >
            <Text style={[styles.dropdownValue, { color: labelColor }]}>
              {PRESETS.find((p) => p.key === selectedPreset)?.label ?? "Light"}
            </Text>
            <Text style={[styles.dropdownChevron, { color: sectionTitleColor }]}>
              {presetOpen ? "▲" : "▼"}
            </Text>
          </Pressable>
          {presetOpen ? (
            <View
              style={[
                styles.dropdownMenu,
                {
                  borderColor: toggleBorderColor,
                  backgroundColor: isDark ? "#1a1a1a" : "#fff",
                },
              ]}
            >
              {PRESETS.map((preset) => (
                <Pressable
                  key={preset.key}
                  style={({ pressed }) => [
                    styles.dropdownItem,
                    selectedPreset === preset.key && {
                      backgroundColor: isDark ? "rgba(255,255,255,0.14)" : "rgba(0,0,0,0.06)",
                    },
                    pressed && { opacity: 0.75 },
                  ]}
                  onPress={() => applyPreset(preset.key)}
                >
                  <Text style={[styles.dropdownItemText, { color: labelColor }]}>
                    {preset.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          ) : null}
        </View>
      </View>

      <Text style={[styles.sectionTitle, { color: sectionTitleColor }]}>Privacy & safety</Text>
      <View style={[styles.toggleRow, { borderBottomColor: toggleBorderColor }]}>
        <Text style={[styles.toggleLabel, { color: labelColor }]}>Discrete mode</Text>
        <Switch
          value={safePreferences.discreteMode}
          onValueChange={(discreteMode) => setSafe({ discreteMode })}
          accessibilityLabel="Discrete mode"
        />
      </View>
      <View style={[styles.toggleRow, { borderBottomColor: toggleBorderColor }]}>
        <Text style={[styles.toggleLabel, { color: labelColor }]}>Self-destruct enabled</Text>
        <Switch
          value={safePreferences.selfDestructEnabled}
          onValueChange={(selfDestructEnabled) => setSafe({ selfDestructEnabled })}
          accessibilityLabel="Self-destruct enabled"
        />
      </View>
      <View style={[styles.toggleRow, { borderBottomColor: toggleBorderColor }]}>
        <Text style={[styles.toggleLabel, { color: labelColor }]}>Quick exit</Text>
        <Switch
          value={safePreferences.quickExitEnabled}
          onValueChange={(quickExitEnabled) => setSafe({ quickExitEnabled })}
          accessibilityLabel="Quick exit enabled"
        />
      </View>
      <View style={[styles.toggleRow, { borderBottomColor: toggleBorderColor }]}>
        <Text style={[styles.toggleLabel, { color: labelColor }]}>Silent mode</Text>
        <Switch
          value={safePreferences.silentMode}
          onValueChange={(silentMode) => setSafe({ silentMode })}
          accessibilityLabel="Silent mode"
        />
      </View>

      <Text style={[styles.sectionTitle, { color: sectionTitleColor }]}>Notifications</Text>
      <View style={[styles.toggleRow, { borderBottomColor: toggleBorderColor }]}>
        <Text style={[styles.toggleLabel, { color: labelColor }]}>Notifications enabled</Text>
        <Switch
          value={safePreferences.notificationsEnabled}
          onValueChange={(notificationsEnabled) => setSafe({ notificationsEnabled })}
          accessibilityLabel="Notifications enabled"
        />
      </View>

      <Text style={[styles.sectionTitle, { color: sectionTitleColor }]}>Security</Text>
      <View style={[styles.toggleRow, { borderBottomColor: toggleBorderColor }]}>
        <Text style={[styles.toggleLabel, { color: labelColor }]}>Biometric login</Text>
        <Switch
          value={safePreferences.biometricEnabled}
          onValueChange={async (biometricEnabled) => {
            if (biometricEnabled) {
              if (!isNativeBiometricPlatform()) {
                Alert.alert(
                  "Not available",
                  "Biometric unlock is only supported in the iOS and Android app."
                );
                return;
              }
              const ok = await isBiometricUnlockAvailable();
              if (!ok) {
                Alert.alert(
                  "Biometrics unavailable",
                  "Set up Face ID, Touch ID, or fingerprint on this device first."
                );
                return;
              }
            }
            setSafe({ biometricEnabled });
          }}
          accessibilityLabel="Biometric enabled"
        />
      </View>
      <View style={styles.row}>
        <Text style={[styles.label, { color: labelColor }]}>Self-destruct after failed attempts</Text>
        <TextInput
          style={[
            styles.numberInput,
            { backgroundColor: numberInputBg, borderColor: numberInputBorder, color: numberInputColor },
          ]}
          value={String(securePreferences.selfDestructAfterFailedAttempts)}
          onChangeText={(t) => {
            const n = parseInt(t, 10);
            if (!Number.isNaN(n) && n >= 0) setSecure({ selfDestructAfterFailedAttempts: n });
          }}
          keyboardType="number-pad"
          placeholder="5"
          placeholderTextColor={placeholderColor}
          accessibilityLabel="Self destruct after failed attempts"
        />
      </View>
      <View style={styles.row}>
        <Text style={[styles.label, { color: labelColor }]}>Doses to create per new dosage</Text>
        <Text style={[styles.hint, { color: sectionTitleColor }]}>
          When you create a new dosage, this many scheduled doses are created. Long-press Save for a single one-off dose.
        </Text>
        <TextInput
          style={[
            styles.numberInput,
            { backgroundColor: numberInputBg, borderColor: numberInputBorder, color: numberInputColor },
          ]}
          value={String(securePreferences.dosesPerDosage)}
          onChangeText={(t) => {
            const n = parseInt(t, 10);
            if (!Number.isNaN(n) && n >= 1 && n <= 999) setSecure({ dosesPerDosage: n });
          }}
          keyboardType="number-pad"
          placeholder="7"
          placeholderTextColor={placeholderColor}
          accessibilityLabel="Doses to create per new dosage"
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  content: {
    paddingBottom: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    marginTop: 16,
    marginBottom: 8,
    textTransform: "uppercase",
  },
  row: {
    marginBottom: 12,
  },
  label: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 6,
  },
  hint: {
    fontSize: 13,
    marginBottom: 6,
    opacity: 0.9,
  },
  dropdownWrap: { marginTop: 4 },
  dropdownTrigger: {
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  dropdownValue: { fontSize: 15, fontWeight: "500" },
  dropdownChevron: { fontSize: 12 },
  dropdownMenu: {
    marginTop: 8,
    borderWidth: 1,
    borderRadius: 10,
    overflow: "hidden",
  },
  dropdownItem: { paddingHorizontal: 12, paddingVertical: 10 },
  dropdownItemText: { fontSize: 15 },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  toggleLabel: {
    fontSize: 16,
    flex: 1,
  },
  numberInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    maxWidth: 80,
  },
});
