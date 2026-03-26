import {
  useTheme,
  getGradientColors,
  primaryTextColor,
  secondaryTextColor,
} from "@/contexts/theme";
import type { SafePreferences } from "@/models/preferences";
import {
  isBiometricUnlockAvailable,
  isNativeBiometricPlatform,
  removeStoredEncryptionKey,
  saveEncryptionKeyForBiometrics,
} from "@/service/biometricKeyStore";
import { setSelfDestructAfterFailedAttempts } from "@/service/authPolicyStore";
import {
  cancelDoseReminders,
  scheduleDoseReminders,
} from "@/service/notificationService";
import { persistStoreToDatabase, useDatabaseStore } from "@/stores/databaseStore";
import { useSafePreferencesStore } from "@/stores/safePreferencesStore";
import { useShallow } from "zustand/react/shallow";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useCallback } from "react";
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

export default function PrivacySettings() {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const titleColor = primaryTextColor(resolvedTheme);
  const secondaryColor = secondaryTextColor(resolvedTheme);
  const gradientColors = getGradientColors(resolvedTheme);
  const router = useRouter();
  const user = useDatabaseStore((s) => s.user);
  const setUser = useDatabaseStore((s) => s.setUser);

  const safePrefs = useSafePreferencesStore(
    useShallow((s) => ({
      discreteMode: s.discreteMode,
      selfDestructEnabled: s.selfDestructEnabled,
      quickExitEnabled: s.quickExitEnabled,
      silentMode: s.silentMode,
      notificationsEnabled: s.notificationsEnabled,
      biometricEnabled: s.biometricEnabled,
    }))
  );
  const updateSafePreferences = useSafePreferencesStore((s) => s.updateSafePreferences);

  const updateSafe = useCallback(
    (patch: Partial<SafePreferences>) => updateSafePreferences(patch),
    [updateSafePreferences]
  );

  const handleBiometricToggle = useCallback(
    async (enabled: boolean) => {
      if (enabled) {
        if (!isNativeBiometricPlatform()) {
          Alert.alert(
            "Not available",
            "Biometric unlock works only in the iOS and Android app."
          );
          return;
        }
        if (!(await isBiometricUnlockAvailable())) {
          Alert.alert(
            "Biometrics unavailable",
            "Set up Face ID, Touch ID, or fingerprint on this device first."
          );
          return;
        }
        const key = useDatabaseStore.getState().encryptionKey;
        if (!key) {
          Alert.alert("Unavailable", "Sign in again, then try enabling biometrics.");
          return;
        }
        try {
          await saveEncryptionKeyForBiometrics(key);
          updateSafe({ biometricEnabled: true });
        } catch (e) {
          Alert.alert(
            "Could not enable",
            e instanceof Error ? e.message : "Secure storage failed."
          );
        }
        return;
      }
      await removeStoredEncryptionKey();
      updateSafe({ biometricEnabled: false });
    },
    [updateSafe]
  );

  const updateSecure = useCallback(
    (patch: Partial<NonNullable<typeof user>["preferences"]>) => {
      if (!user) return;
      const next = { ...user, preferences: { ...user.preferences, ...patch } };
      setUser(next);
      persistStoreToDatabase().catch(() => {});
      if (patch.selfDestructAfterFailedAttempts != null) {
        setSelfDestructAfterFailedAttempts(
          patch.selfDestructAfterFailedAttempts
        ).catch(() => {});
      }
    },
    [user, setUser]
  );

  const handleNotificationsToggle = useCallback(
    async (notificationsEnabled: boolean) => {
      updateSafe({ notificationsEnabled });
      if (!notificationsEnabled) {
        await cancelDoseReminders().catch(() => {});
        return;
      }
      if (!user) return;
      const untakenUpcoming = (user.dosages ?? [])
        .flatMap((d) => d.doses)
        .filter((dose) => {
          const when = new Date(dose.scheduledTime).getTime();
          return dose.takenTime == null && when > Date.now();
        });
      await scheduleDoseReminders(untakenUpcoming, {
        isDiscrete: safePrefs.discreteMode,
        isSilent: safePrefs.silentMode,
      }).catch(() => {});
    },
    [updateSafe, user, safePrefs.discreteMode, safePrefs.silentMode]
  );

  const toggleBorderColor = isDark ? "rgba(255,255,255,0.1)" : "#eee";
  const numberInputBg = isDark ? "rgba(255,255,255,0.12)" : "#fff";
  const numberInputBorder = isDark ? "rgba(255,255,255,0.3)" : "#ccc";
  const numberInputColor = isDark ? "#fff" : "#1a1a1a";
  const placeholderColor = isDark ? "rgba(255,255,255,0.5)" : "#888";
  const securePrefs = user?.preferences ?? { selfDestructAfterFailedAttempts: 5, lastRecoveryVerifiedAt: null, dosesPerDosage: 7 };

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
          Privacy and safety
        </Text>
        <Text style={[styles.sectionTitle, { color: secondaryColor }]}>
          Privacy & safety
        </Text>
        <View style={[styles.toggleRow, { borderBottomColor: toggleBorderColor }]}>
          <Text style={[styles.toggleLabel, { color: titleColor }]}>Discrete mode</Text>
          <Switch
            value={safePrefs.discreteMode}
            onValueChange={(discreteMode) => updateSafe({ discreteMode })}
            accessibilityLabel="Discrete mode"
          />
        </View>
        <View style={[styles.toggleRow, { borderBottomColor: toggleBorderColor }]}>
          <Text style={[styles.toggleLabel, { color: titleColor }]}>Self-destruct enabled</Text>
          <Switch
            value={safePrefs.selfDestructEnabled}
            onValueChange={(selfDestructEnabled) => updateSafe({ selfDestructEnabled })}
            accessibilityLabel="Self-destruct enabled"
          />
        </View>
        <View style={[styles.toggleRow, { borderBottomColor: toggleBorderColor }]}>
          <Text style={[styles.toggleLabel, { color: titleColor }]}>Quick exit</Text>
          <Switch
            value={safePrefs.quickExitEnabled}
            onValueChange={(quickExitEnabled) => updateSafe({ quickExitEnabled })}
            accessibilityLabel="Quick exit enabled"
          />
        </View>
        <View style={[styles.toggleRow, { borderBottomColor: toggleBorderColor }]}>
          <Text style={[styles.toggleLabel, { color: titleColor }]}>Silent mode</Text>
          <Switch
            value={safePrefs.silentMode}
            onValueChange={(silentMode) => updateSafe({ silentMode })}
            accessibilityLabel="Silent mode"
          />
        </View>
        <Text style={[styles.sectionTitle, { color: secondaryColor }]}>
          Notifications
        </Text>
        <View style={[styles.toggleRow, { borderBottomColor: toggleBorderColor }]}>
          <Text style={[styles.toggleLabel, { color: titleColor }]}>Notifications enabled</Text>
          <Switch
            value={safePrefs.notificationsEnabled}
            onValueChange={handleNotificationsToggle}
            accessibilityLabel="Notifications enabled"
          />
        </View>
        <Text style={[styles.sectionTitle, { color: secondaryColor }]}>
          Security
        </Text>
        <View style={[styles.toggleRow, { borderBottomColor: toggleBorderColor }]}>
          <Text style={[styles.toggleLabel, { color: titleColor }]}>Biometric login</Text>
          <Switch
            value={safePrefs.biometricEnabled}
            onValueChange={handleBiometricToggle}
            accessibilityLabel="Biometric enabled"
          />
        </View>
        <View style={styles.row}>
          <Text style={[styles.label, { color: titleColor }]}>
            Self-destruct after failed attempts
          </Text>
          <TextInput
            style={[
              styles.numberInput,
              { backgroundColor: numberInputBg, borderColor: numberInputBorder, color: numberInputColor },
            ]}
            value={String(securePrefs.selfDestructAfterFailedAttempts)}
            onChangeText={(t) => {
              const n = parseInt(t, 10);
              if (!Number.isNaN(n) && n >= 0) updateSecure({ selfDestructAfterFailedAttempts: n });
            }}
            keyboardType="number-pad"
            placeholder="5"
            placeholderTextColor={placeholderColor}
            accessibilityLabel="Self destruct after failed attempts"
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
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  toggleLabel: { fontSize: 16, flex: 1 },
  row: { marginTop: 12, marginBottom: 12 },
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
