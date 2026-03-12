import {
  useTheme,
  getGradientColors,
  primaryTextColor,
  secondaryTextColor,
  cardBackgroundColor,
  PRIMARY_BUTTON_BG,
} from "@/contexts/theme";
import type { Dose } from "@/models/dose";
import type { Dosage } from "@/models/dosage";
import { useDatabaseStore } from "@/stores/databaseStore";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

export default function DosesScreen() {
  const router = useRouter();
  const { resolvedTheme } = useTheme();
  const encryptionKey = useDatabaseStore((s) => s.encryptionKey);
  const user = useDatabaseStore((s) => s.user);
  const titleColor = primaryTextColor(resolvedTheme);
  const secondaryColor = secondaryTextColor(resolvedTheme);
  const cardBg = cardBackgroundColor(resolvedTheme);
  const gradientColors = getGradientColors(resolvedTheme);
  const loading = encryptionKey != null && user === null;

  if (loading) {
    return (
      <LinearGradient colors={[...gradientColors]} style={styles.gradient}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={titleColor} />
          <Text style={[styles.hint, { color: secondaryColor }]}>Loading doses…</Text>
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
              ? "Sign in to view and manage doses."
              : "Loading doses…"}
          </Text>
        </View>
      </LinearGradient>
    );
  }

  const allDoses: { dosage: Dosage; dose: Dose }[] = (user.dosages ?? []).flatMap(
    (d) => d.doses.map((dose) => ({ dosage: d, dose }))
  );

  return (
    <LinearGradient colors={[...gradientColors]} style={styles.gradient}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={[styles.title, { color: titleColor }]}>Doses</Text>
          <Pressable
            style={[styles.addButton, { backgroundColor: cardBg }]}
            onPress={() => router.push("/(tabs)/doses/create")}
            accessibilityLabel="Add dose"
          >
            <Text style={[styles.addButtonText, { color: titleColor }]}>Add dose</Text>
          </Pressable>
        </View>

        {allDoses.length === 0 ? (
          <View style={styles.empty}>
            <Text style={[styles.emptyTitle, { color: titleColor }]}>You have no doses</Text>
            <Text style={[styles.emptyMessage, { color: secondaryColor }]}>
              Create a dose to track your medication schedule.
            </Text>
            <Pressable
              style={styles.primaryButton}
              onPress={() => router.push("/(tabs)/doses/create")}
              accessibilityLabel="Create your first dose"
            >
              <Text style={styles.primaryButtonText}>Create your first dose</Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.list}>
            {allDoses.map(({ dosage, dose }) => (
              <Pressable
                key={dose.id}
                style={[styles.card, { backgroundColor: cardBg }]}
                onPress={() => router.push(`/(tabs)/doses/${dose.id}`)}
                accessibilityLabel={`View details for ${dosage.name} dose`}
              >
                <Text style={[styles.cardMedication, { color: titleColor }]}>{dosage.name}</Text>
                <Text style={[styles.cardDetail, { color: secondaryColor }]}>
                  {dosage.dosage} {dosage.unit} · {dosage.medicationType} ·{" "}
                  {dosage.ingestionMethod}
                </Text>
                <Text style={[styles.cardDetail, { color: secondaryColor }]}>
                  Every {dosage.frequencyDays} day(s) · Scheduled{" "}
                  {new Date(dose.scheduledTime).toLocaleString()}
                </Text>
                {dose.takenTime && (
                  <Text style={styles.cardTaken}>
                    Taken {new Date(dose.takenTime).toLocaleString()}
                  </Text>
                )}
              </Pressable>
            ))}
          </View>
        )}
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
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  title: { fontSize: 24, fontWeight: "700" },
  addButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addButtonText: { fontSize: 15, fontWeight: "600" },
  empty: {
    marginTop: 24,
    alignItems: "center",
  },
  emptyTitle: { fontSize: 18, fontWeight: "700", marginBottom: 8 },
  emptyMessage: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 20,
  },
  primaryButton: {
    paddingHorizontal: 24,
    paddingVertical: 14,
    backgroundColor: PRIMARY_BUTTON_BG,
    borderRadius: 12,
  },
  primaryButtonText: { fontSize: 18, fontWeight: "600", color: "#fff" },
  list: { gap: 12 },
  card: {
    padding: 14,
    borderRadius: 10,
  },
  cardMedication: { fontSize: 16, fontWeight: "600", marginBottom: 4 },
  cardDetail: { fontSize: 13, marginBottom: 2 },
  cardTaken: { fontSize: 13, color: "#2e7d32", marginTop: 4 },
  hint: { marginTop: 8, fontSize: 16 },
  error: { marginTop: 8, fontSize: 14 },
});
