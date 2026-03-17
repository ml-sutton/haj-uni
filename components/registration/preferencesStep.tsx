import type { SafePreferences, SecurePreferences } from "@/models/preferences";
import { useTheme } from "@/contexts/theme";
import React from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";

export interface PreferencesStepProps {
  safePreferences: SafePreferences;
  securePreferences: SecurePreferences;
  onSafeChange: (safe: SafePreferences) => void;
  onSecureChange: (secure: SecurePreferences) => void;
}

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
  const themeButtonBg = isDark ? "rgba(255,255,255,0.15)" : "#f0f0f0";
  const themeButtonActiveBg = isDark ? "rgba(0,102,204,0.4)" : "rgba(0,102,204,0.15)";
  const themeButtonTextColor = isDark ? "rgba(255,255,255,0.8)" : "#666";
  const themeButtonActiveTextColor = isDark ? "#7fbfe9" : "#0066cc";
  const toggleBorderColor = isDark ? "rgba(255,255,255,0.1)" : "#eee";
  const numberInputBg = isDark ? "rgba(255,255,255,0.12)" : "#fff";
  const numberInputBorder = isDark ? "rgba(255,255,255,0.3)" : "#ccc";
  const numberInputColor = isDark ? "#fff" : "#1a1a1a";
  const placeholderColor = isDark ? "rgba(255,255,255,0.5)" : "#888";

  const setSafe = (patch: Partial<SafePreferences>) => {
    onSafeChange({ ...safePreferences, ...patch });
  };

  const setSecure = (patch: Partial<SecurePreferences>) => {
    onSecureChange({ ...securePreferences, ...patch });
  };

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <Text style={[styles.sectionTitle, { color: sectionTitleColor }]}>Appearance</Text>
      <View style={styles.row}>
        <Text style={[styles.label, { color: labelColor }]}>Theme</Text>
        <View style={styles.themeButtons}>
          <Pressable
            style={[
              styles.themeButtonWrap,
              { backgroundColor: safePreferences.theme === "system" ? themeButtonActiveBg : themeButtonBg },
            ]}
            onPress={() => setSafe({ theme: "system" })}
          >
            <Text
              style={[
                styles.themeButtonText,
                { color: safePreferences.theme === "system" ? themeButtonActiveTextColor : themeButtonTextColor },
                safePreferences.theme === "system" && styles.themeButtonTextActive,
              ]}
            >
              System
            </Text>
          </Pressable>
          <Pressable
            style={[
              styles.themeButtonWrap,
              { backgroundColor: safePreferences.theme === "light" ? themeButtonActiveBg : themeButtonBg },
            ]}
            onPress={() => setSafe({ theme: "light" })}
          >
            <Text
              style={[
                styles.themeButtonText,
                { color: safePreferences.theme === "light" ? themeButtonActiveTextColor : themeButtonTextColor },
                safePreferences.theme === "light" && styles.themeButtonTextActive,
              ]}
            >
              Light
            </Text>
          </Pressable>
          <Pressable
            style={[
              styles.themeButtonWrap,
              { backgroundColor: safePreferences.theme === "dark" ? themeButtonActiveBg : themeButtonBg },
            ]}
            onPress={() => setSafe({ theme: "dark" })}
          >
            <Text
              style={[
                styles.themeButtonText,
                { color: safePreferences.theme === "dark" ? themeButtonActiveTextColor : themeButtonTextColor },
                safePreferences.theme === "dark" && styles.themeButtonTextActive,
              ]}
            >
              Dark
            </Text>
          </Pressable>
        </View>
      </View>

      <View style={[styles.toggleRow, { borderBottomColor: toggleBorderColor }]}>
        <Text style={[styles.toggleLabel, { color: labelColor }]}>High contrast</Text>
        <Switch
          value={safePreferences.highContrast}
          onValueChange={(highContrast) => setSafe({ highContrast })}
          accessibilityLabel="High contrast mode"
        />
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
          onValueChange={(biometricEnabled) => setSafe({ biometricEnabled })}
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
  themeButtons: {
    flexDirection: "row",
    gap: 12,
    marginTop: 4,
  },
  themeButtonWrap: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  themeButtonText: {
    fontSize: 16,
  },
  themeButtonTextActive: {
    fontWeight: "600",
  },
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
