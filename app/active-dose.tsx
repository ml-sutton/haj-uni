import { getIngestionGuidance } from "@/const/ingestionGuidance";
import {
  useTheme,
  getGradientColors,
  primaryTextColor,
  secondaryTextColor,
  labelTextColor,
  valueTextColor,
  cardBackgroundColor,
  PRIMARY_BUTTON_BG,
} from "@/contexts/theme";
import { readEncryptedDBObject } from "@/database/database";
import { persistStoreToDatabase, useDatabaseStore } from "@/stores/databaseStore";
import {
  findDoseById,
  isUntakenDoseInActiveWindow,
} from "@/utils/doseQueries";
import { medicationsAfterDoseTaken } from "@/utils/medicationSupply";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

const WINDOW_CHECK_MS = 15_000;

/**
 * Full-screen reminder for a dose currently in its active time window.
 *
 * @remarks
 * Expo Router file route: `/active-dose` (`app/active-dose.tsx`). Query param:
 * `doseId`. Shows ingestion guidance and lets the user mark the dose taken;
 * auto-redirects when the window closes or the dose is already taken.
 *
 * @returns The active-dose reminder UI or a loading placeholder.
 */
export default function ActiveDoseScreen() {
  const params = useLocalSearchParams<{ doseId?: string | string[] }>();
  const doseId =
    typeof params.doseId === "string"
      ? params.doseId
      : params.doseId?.[0] ?? null;
  const router = useRouter();
  const { resolvedTheme } = useTheme();
  const user = useDatabaseStore((s) => s.user);
  const setUser = useDatabaseStore((s) => s.setUser);
  const encryptionKey = useDatabaseStore((s) => s.encryptionKey);

  const titleColor = primaryTextColor(resolvedTheme);
  const secondaryColor = secondaryTextColor(resolvedTheme);
  const labelColor = labelTextColor(resolvedTheme);
  const valueColor = valueTextColor(resolvedTheme);
  const cardBg = cardBackgroundColor(resolvedTheme);
  const gradientColors = getGradientColors(resolvedTheme);

  const loading = encryptionKey != null && user === null;
  const [markingTaken, setMarkingTaken] = useState(false);

  const goToTabs = useCallback(() => {
    router.replace("/(tabs)");
  }, [router]);

  // Hydrate in-memory user from encrypted storage when authed but store is empty.
  useEffect(() => {
    if (!encryptionKey || user !== null) return;
    let cancelled = false;
    readEncryptedDBObject(encryptionKey)
      .then((data) => {
        if (!cancelled) setUser(data);
      })
      .catch(() => {
        if (!cancelled) goToTabs();
      });
    return () => {
      cancelled = true;
    };
  }, [encryptionKey, user, setUser, goToTabs]);

  const found = useMemo(
    () => (user && doseId ? findDoseById(user.medications ?? [], doseId) : null),
    [user, doseId]
  );

  const stillActive = useMemo(() => {
    if (!found) return false;
    return isUntakenDoseInActiveWindow(found.dose);
  }, [found]);

  // Poll while dose remains in-window; leave screen when taken or window ends.
  useEffect(() => {
    if (!found || !stillActive) return;
    const t = setInterval(() => {
      const u = useDatabaseStore.getState().user;
      if (!u || !doseId) {
        goToTabs();
        return;
      }
      const f = findDoseById(u.medications ?? [], doseId);
      if (!f || f.dose.takenTime != null || !isUntakenDoseInActiveWindow(f.dose)) {
        goToTabs();
      }
    }, WINDOW_CHECK_MS);
    return () => clearInterval(t);
  }, [found, stillActive, doseId, goToTabs]);

  // Initial guard: redirect if unauthenticated, missing doseId, or dose not active.
  useEffect(() => {
    if (loading) return;
    if (!encryptionKey) {
      goToTabs();
      return;
    }
    if (!user) return;
    if (!doseId) {
      goToTabs();
      return;
    }
    const f = findDoseById(user.medications ?? [], doseId);
    if (!f || f.dose.takenTime != null || !isUntakenDoseInActiveWindow(f.dose)) {
      goToTabs();
    }
  }, [loading, encryptionKey, user, doseId, goToTabs]);

  const markAsTaken = useCallback(() => {
    if (!user || !doseId || !found) return;
    setMarkingTaken(true);
    const updatedMedications = medicationsAfterDoseTaken(
      user.medications,
      found.medication.id,
      found.dosage.id,
      doseId
    );
    setUser({ ...user, medications: updatedMedications });
    persistStoreToDatabase().finally(() => {
      setMarkingTaken(false);
      goToTabs();
    });
  }, [user, setUser, doseId, found, goToTabs]);

  const guidance = useMemo(
    () => (found ? getIngestionGuidance(found.medication.ingestionMethod) : null),
    [found]
  );

  if (loading || !found || !stillActive) {
    return (
      <LinearGradient colors={[...gradientColors]} style={styles.gradient}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={titleColor} />
          <Text style={[styles.hint, { color: secondaryColor }]}>
            {loading ? "Loading…" : " "}
          </Text>
        </View>
      </LinearGradient>
    );
  }

  const { medication, dosage, dose } = found;

  return (
    <LinearGradient colors={[...gradientColors]} style={styles.gradient}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.title, { color: titleColor }]}>Time for your dose</Text>
        <Text style={[styles.subtitle, { color: secondaryColor }]}>
          Scheduled {new Date(dose.scheduledTime).toLocaleString()}
        </Text>

        <View style={[styles.section, { backgroundColor: cardBg }]}>
          <Text style={[styles.sectionTitle, { color: titleColor }]}>{medication.name}</Text>
          <View style={styles.row}>
            <Text style={[styles.label, { color: labelColor }]}>Amount</Text>
            <Text style={[styles.value, { color: valueColor }]}>
              {dosage.amount} {dosage.unit}
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={[styles.label, { color: labelColor }]}>How you take it</Text>
            <Text style={[styles.value, { color: valueColor }]}>{medication.ingestionMethod}</Text>
          </View>
        </View>

        {guidance ? (
          <View style={[styles.section, { backgroundColor: cardBg }]}>
            <Text style={[styles.sectionTitle, { color: titleColor }]}>{guidance.headline}</Text>
            <Text style={[styles.disclaimer, { color: secondaryColor }]}>
              These are general reminders only. Always follow your clinician, pharmacist, or medication
              leaflet.
            </Text>
            {guidance.steps.map((step, i) => (
              <View key={i} style={styles.stepRow}>
                <Text style={[styles.stepBullet, { color: titleColor }]}>{i + 1}.</Text>
                <Text style={[styles.stepText, { color: valueColor }]}>{step}</Text>
              </View>
            ))}
          </View>
        ) : null}

        {dosage.notes ? (
          <View style={[styles.section, { backgroundColor: cardBg }]}>
            <Text style={[styles.sectionTitle, { color: titleColor }]}>Your notes</Text>
            <Text style={[styles.value, { color: valueColor }]}>{dosage.notes}</Text>
          </View>
        ) : null}

        <Pressable
          style={[styles.markTakenButton, markingTaken && styles.markTakenButtonDisabled]}
          onPress={markAsTaken}
          disabled={markingTaken}
          accessibilityLabel="Mark dose as taken"
        >
          {markingTaken ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.markTakenButtonText}>Mark as taken</Text>
          )}
        </Pressable>
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
  title: { fontSize: 24, fontWeight: "700", marginBottom: 6 },
  subtitle: { fontSize: 15, marginBottom: 20 },
  section: {
    marginBottom: 20,
    padding: 16,
    borderRadius: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 10,
  },
  disclaimer: {
    fontSize: 12,
    lineHeight: 17,
    marginBottom: 12,
    fontStyle: "italic",
  },
  row: { marginBottom: 8 },
  label: { fontSize: 13, marginBottom: 2 },
  value: { fontSize: 15, fontWeight: "500" },
  stepRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    marginBottom: 10,
  },
  stepBullet: {
    fontSize: 15,
    fontWeight: "600",
    width: 22,
  },
  stepText: { flex: 1, fontSize: 15, lineHeight: 22 },
  hint: { marginTop: 8, fontSize: 16 },
  markTakenButton: {
    marginTop: 8,
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: PRIMARY_BUTTON_BG,
    borderRadius: 12,
    alignItems: "center",
  },
  markTakenButtonDisabled: { opacity: 0.7 },
  markTakenButtonText: { fontSize: 17, fontWeight: "600", color: "#fff" },
});
