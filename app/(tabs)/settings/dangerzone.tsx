import {
  useTheme,
  getGradientColors,
  primaryTextColor,
  secondaryTextColor,
  ERROR_TEXT_COLOR,
} from "@/contexts/theme";
import { getEncryptedDataForExport } from "@/database/database";
import { runSelfDestruct } from "@/service/privacyService";
import { useDatabaseStore } from "@/stores/databaseStore";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useCallback, useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Share } from "react-native";

export default function DangerZoneSettings() {
  const { resolvedTheme, highContrast } = useTheme();
  const isDark = resolvedTheme === "dark";
  const titleColor = primaryTextColor(resolvedTheme);
  const secondaryColor = secondaryTextColor(resolvedTheme);
  const gradientColors = getGradientColors(resolvedTheme);
  const router = useRouter();
  const clearAuth = useDatabaseStore((s) => s.clearAuth);
  const [confirmStep, setConfirmStep] = useState(0);
  const [exporting, setExporting] = useState(false);

  const handleExportEncrypted = useCallback(async () => {
    setExporting(true);
    try {
      const data = await getEncryptedDataForExport();
      await Share.share({
        message: data,
        title: "HAJ encrypted backup",
      });
    } catch (e) {
      Alert.alert(
        "Export failed",
        e instanceof Error ? e.message : "Could not export data"
      );
    } finally {
      setExporting(false);
    }
  }, []);

  const handleSelfDestruct = useCallback(() => {
    if (confirmStep === 0) {
      Alert.alert(
        "Self-destruct",
        "This will permanently delete all your data and you will need to set up the app again. Are you sure?",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Continue",
            style: "destructive",
            onPress: () => setConfirmStep(1),
          },
        ]
      );
      return;
    }
    if (confirmStep === 1) {
      Alert.alert(
        "Second confirmation",
        "All your doses, notes, and preferences will be erased. This cannot be undone. Confirm again?",
        [
          { text: "Cancel", style: "cancel", onPress: () => setConfirmStep(0) },
          {
            text: "I understand",
            style: "destructive",
            onPress: () => setConfirmStep(2),
          },
        ]
      );
      return;
    }
    if (confirmStep === 2) {
      Alert.alert(
        "Final confirmation",
        "Last chance. Tap \"Delete everything\" to permanently destroy all data and return to the start screen.",
        [
          { text: "Cancel", style: "cancel", onPress: () => setConfirmStep(0) },
          {
            text: "Delete everything",
            style: "destructive",
            onPress: async () => {
              setConfirmStep(0);
              await runSelfDestruct();
              clearAuth();
              router.replace("/getStarted" as any);
            },
          },
        ]
      );
    }
  }, [confirmStep, clearAuth, router]);

  const sectionBorderColor = highContrast
    ? isDark
      ? "#ffffff"
      : "#000000"
    : isDark
      ? "rgba(255,255,255,0.1)"
      : "#eee";
  const destructButtonBg = highContrast
    ? isDark
      ? "#000000"
      : "#ffffff"
    : ERROR_TEXT_COLOR;
  const destructButtonText = highContrast
    ? isDark
      ? "#ffffff"
      : "#000000"
    : "#fff";

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
        <Text style={[styles.title, { color: titleColor }]}>Danger zone</Text>
        <Text style={[styles.sectionTitle, { color: secondaryColor }]}>
          Backup &amp; destroy
        </Text>

        <Pressable
          style={({ pressed }) => [
            styles.actionRow,
            { borderBottomColor: sectionBorderColor },
            pressed && styles.actionPressed,
          ]}
          onPress={handleExportEncrypted}
          disabled={exporting}
        >
          <Ionicons name="download-outline" size={22} color={secondaryColor} />
          <Text style={[styles.actionLabel, { color: titleColor }]}>
            Export encrypted data
          </Text>
          {exporting ? (
            <Text style={[styles.actionHint, { color: secondaryColor }]}>
              Exporting…
            </Text>
          ) : (
            <Ionicons name="chevron-forward" size={20} color={secondaryColor} />
          )}
        </Pressable>
        <Text style={[styles.hint, { color: secondaryColor }]}>
          Share a backup of your encrypted data and salt. Keep it safe; you need
          your PIN to restore.
        </Text>

        <View style={styles.destructSection}>
          <Pressable
            style={({ pressed }) => [
              styles.destructButton,
              { backgroundColor: destructButtonBg, borderColor: sectionBorderColor },
              pressed && styles.destructPressed,
            ]}
            onPress={handleSelfDestruct}
          >
            <Ionicons name="trash" size={22} color={destructButtonText} />
            <Text style={[styles.destructLabel, { color: destructButtonText }]}>Self-destruct</Text>
          </Pressable>
          <Text style={[styles.destructHint, { color: secondaryColor }]}>
            Permanently delete all data (requires 3 confirmations).
          </Text>
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
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    marginTop: 16,
    marginBottom: 8,
    textTransform: "uppercase",
  },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 4,
    gap: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  actionPressed: { opacity: 0.8 },
  actionLabel: { flex: 1, fontSize: 17, fontWeight: "500" },
  actionHint: { fontSize: 14, color: "#888" },
  hint: {
    marginTop: 10,
    fontSize: 13,
    marginBottom: 24,
  },
  destructSection: {
    marginTop: 8,
    alignItems: "center",
  },
  destructButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 14,
    paddingHorizontal: 24,
    backgroundColor: ERROR_TEXT_COLOR,
    borderWidth: 1,
    borderColor: "transparent",
    borderRadius: 12,
  },
  destructPressed: { opacity: 0.9 },
  destructLabel: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "600",
  },
  destructHint: {
    marginTop: 10,
    fontSize: 13,
    textAlign: "center",
    maxWidth: 280,
  },
});
