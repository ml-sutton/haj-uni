import {
  useTheme,
  getGradientColors,
  primaryTextColor,
  secondaryTextColor,
  labelTextColor,
  valueTextColor,
  cardBackgroundColor,
} from "@/contexts/theme";
import { useDatabaseStore } from "@/stores/databaseStore";
import { findDoseById } from "@/utils/doseQueries";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

export default function DoseDetailScreen() {
  const params = useLocalSearchParams<{ doseId: string }>();
  const doseId = typeof params.doseId === "string" ? params.doseId : params.doseId?.[0] ?? null;
  const router = useRouter();
  const { resolvedTheme } = useTheme();
  const user = useDatabaseStore((s) => s.user);
  const setUser = useDatabaseStore((s) => s.setUser);
  const titleColor = primaryTextColor(resolvedTheme);
  const secondaryColor = secondaryTextColor(resolvedTheme);
  const labelColor = labelTextColor(resolvedTheme);
  const valueColor = valueTextColor(resolvedTheme);
  const cardBg = cardBackgroundColor(resolvedTheme);
  const gradientColors = getGradientColors(resolvedTheme);

  const encryptionKey = useDatabaseStore((s) => s.encryptionKey);
  const found = useMemo(
    () => (user && doseId ? findDoseById(user.dosages ?? [], doseId) : null),
    [user, doseId]
  );
  const loading = encryptionKey != null && user === null;
  const [markingTaken, setMarkingTaken] = useState(false);

  const markAsTaken = useCallback(() => {
    if (!user || !doseId || !found) return;
    setMarkingTaken(true);
    const updatedDosages = (user.dosages ?? []).map((d) => {
      if (d.id !== found.dosage.id) return d;
      return {
        ...d,
        doses: d.doses.map((dose) =>
          dose.id === doseId
            ? { ...dose, takenTime: new Date() }
            : dose
        ),
      };
    });
    setUser({ ...user, dosages: updatedDosages });
    setMarkingTaken(false);
  }, [user, setUser, doseId, found]);

  if (loading) {
    return (
      <LinearGradient colors={[...gradientColors]} style={styles.gradient}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={titleColor} />
          <Text style={[styles.hint, { color: secondaryColor }]}>Loading…</Text>
        </View>
      </LinearGradient>
    );
  }

  if (!encryptionKey || !user) {
    return (
      <LinearGradient colors={[...gradientColors]} style={styles.gradient}>
        <View style={styles.centered}>
          <Text style={[styles.hint, { color: secondaryColor }]}>
            {!encryptionKey ? "Sign in to view doses." : "Loading…"}
          </Text>
          <Pressable style={styles.backBtn} onPress={() => router.back()}>
            <Text style={[styles.backBtnText, { color: titleColor }]}>Go back</Text>
          </Pressable>
        </View>
      </LinearGradient>
    );
  }

  if (!found) {
    return (
      <LinearGradient colors={[...gradientColors]} style={styles.gradient}>
        <View style={styles.centered}>
          <Text style={[styles.hint, { color: secondaryColor }]}>Dose not found.</Text>
          <Pressable style={styles.backBtn} onPress={() => router.back()}>
            <Text style={[styles.backBtnText, { color: titleColor }]}>Go back</Text>
          </Pressable>
        </View>
      </LinearGradient>
    );
  }

  const { dosage, dose } = found;
  const takenCount = dosage.doses.filter((d) => d.takenTime != null).length;
  const totalCount = dosage.doses.length;
  const adherencePercent =
    totalCount > 0 ? Math.round((takenCount / totalCount) * 100) : 0;

  return (
    <LinearGradient colors={[...gradientColors]} style={styles.gradient}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Pressable
            onPress={() => router.back()}
            style={styles.backButton}
            accessibilityLabel="Go back"
          >
            <Text style={[styles.backButtonText, { color: titleColor }]}>← Back</Text>
          </Pressable>
          <Text style={[styles.title, { color: titleColor }]}>Dose details</Text>
        </View>

        <View style={[styles.section, { backgroundColor: cardBg }]}>
          <Text style={[styles.sectionTitle, { color: titleColor }]}>This dose</Text>
          <View style={styles.row}>
            <Text style={[styles.label, { color: labelColor }]}>Scheduled</Text>
            <Text style={[styles.value, { color: valueColor }]}>
              {new Date(dose.scheduledTime).toLocaleString()}
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={[styles.label, { color: labelColor }]}>Taken</Text>
            <Text style={[styles.value, { color: valueColor }]}>
              {dose.takenTime
                ? new Date(dose.takenTime).toLocaleString()
                : "Not yet taken"}
            </Text>
          </View>
          {!dose.takenTime && (
            <Pressable
              style={[styles.markTakenButton, markingTaken && styles.markTakenButtonDisabled]}
              onPress={markAsTaken}
              disabled={markingTaken}
              accessibilityLabel="Mark dose as taken now"
            >
              {markingTaken ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.markTakenButtonText}>Mark as taken now</Text>
              )}
            </Pressable>
          )}
        </View>

        <View style={[styles.section, { backgroundColor: cardBg }]}>
          <Text style={[styles.sectionTitle, { color: titleColor }]}>Connected dosage</Text>
          <View style={styles.row}>
            <Text style={[styles.label, { color: labelColor }]}>Medication</Text>
            <Text style={[styles.value, { color: valueColor }]}>{dosage.name}</Text>
          </View>
          <View style={styles.row}>
            <Text style={[styles.label, { color: labelColor }]}>Amount</Text>
            <Text style={[styles.value, { color: valueColor }]}>
              {dosage.dosage} {dosage.unit}
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={[styles.label, { color: labelColor }]}>Type</Text>
            <Text style={[styles.value, { color: valueColor }]}>{dosage.medicationType}</Text>
          </View>
          <View style={styles.row}>
            <Text style={[styles.label, { color: labelColor }]}>Method</Text>
            <Text style={[styles.value, { color: valueColor }]}>{dosage.ingestionMethod}</Text>
          </View>
          <View style={styles.row}>
            <Text style={[styles.label, { color: labelColor }]}>Frequency</Text>
            <Text style={[styles.value, { color: valueColor }]}>Every {dosage.frequencyDays} day(s)</Text>
          </View>
          {dosage.notes ? (
            <View style={styles.row}>
              <Text style={[styles.label, { color: labelColor }]}>Notes</Text>
              <Text style={[styles.value, { color: valueColor }]}>{dosage.notes}</Text>
            </View>
          ) : null}
        </View>

        <View style={[styles.section, { backgroundColor: cardBg }]}>
          <Text style={[styles.sectionTitle, { color: titleColor }]}>Adherence (this dosage)</Text>
          <View style={styles.adherenceRow}>
            <Text style={[styles.adherenceText, { color: valueColor }]}>
              {takenCount} of {totalCount} doses taken
            </Text>
            <Text style={[styles.adherencePercent, { color: titleColor }]}>{adherencePercent}%</Text>
          </View>
        </View>
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
  header: { flexDirection: "row", alignItems: "center", marginBottom: 24 },
  backButton: { paddingVertical: 8, paddingRight: 16 },
  backButtonText: { fontSize: 16, fontWeight: "600" },
  title: { fontSize: 22, fontWeight: "700" },
  section: {
    marginBottom: 24,
    padding: 16,
    borderRadius: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
  },
  row: { marginBottom: 8 },
  label: { fontSize: 13, marginBottom: 2 },
  value: { fontSize: 15, fontWeight: "500" },
  adherenceRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  adherenceText: { fontSize: 15 },
  adherencePercent: { fontSize: 18, fontWeight: "600" },
  hint: { marginTop: 8, fontSize: 16 },
  error: { marginTop: 8, fontSize: 14 },
  backBtn: { marginTop: 16, paddingVertical: 10 },
  backBtnText: { fontSize: 16, fontWeight: "600" },
  markTakenButton: {
    marginTop: 16,
    paddingVertical: 14,
    paddingHorizontal: 20,
    backgroundColor: "#2e7d32",
    borderRadius: 10,
    alignItems: "center",
  },
  markTakenButtonDisabled: { opacity: 0.7 },
  markTakenButtonText: { fontSize: 16, fontWeight: "600", color: "#fff" },
});
