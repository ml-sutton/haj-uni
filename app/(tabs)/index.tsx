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
import { LinearGradient } from "expo-linear-gradient";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

export default function Home() {
  const { resolvedTheme } = useTheme();
  const encryptionKey = useDatabaseStore((s) => s.encryptionKey);
  const user = useDatabaseStore((s) => s.user);
  const titleColor = primaryTextColor(resolvedTheme);
  const secondaryColor = secondaryTextColor(resolvedTheme);
  const labelColor = labelTextColor(resolvedTheme);
  const valueColor = valueTextColor(resolvedTheme);
  const cardBg = cardBackgroundColor(resolvedTheme);

  const gradientColors = getGradientColors(resolvedTheme);
  const loading = encryptionKey != null && user === null;

  if (loading) {
    return (
      <LinearGradient colors={[...gradientColors]} style={styles.gradient}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={titleColor} />
          <Text style={[styles.hint, { color: secondaryColor }]}>Loading user data…</Text>
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
              ? "Not signed in. User data is encrypted."
              : "Loading user data…"}
          </Text>
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={[...gradientColors]} style={styles.gradient}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.title, { color: titleColor }]}>Your data</Text>

        <Text style={[styles.sectionTitle, { color: titleColor }]}>Profile</Text>
        <View style={styles.row}>
          <Text style={[styles.label, { color: labelColor }]}>Username</Text>
          <Text style={[styles.value, { color: valueColor }]}>{user.username}</Text>
        </View>
        <View style={styles.row}>
          <Text style={[styles.label, { color: labelColor }]}>Pronouns</Text>
          <Text style={[styles.value, { color: valueColor }]}>
            {user.pronouns.length ? user.pronouns.join(", ") : "—"}
          </Text>
        </View>

        <Text style={[styles.sectionTitle, { color: titleColor }]}>Preferences (secure)</Text>
        <View style={styles.row}>
          <Text style={[styles.label, { color: labelColor }]}>Self-destruct after attempts</Text>
          <Text style={[styles.value, { color: valueColor }]}>{String(user.preferences.selfDestructAfterFailedAttempts)}</Text>
        </View>
        <View style={styles.row}>
          <Text style={[styles.label, { color: labelColor }]}>Last recovery verified</Text>
          <Text style={[styles.value, { color: valueColor }]}>
            {user.preferences.lastRecoveryVerifiedAt
              ? new Date(user.preferences.lastRecoveryVerifiedAt).toLocaleString()
              : "—"}
          </Text>
        </View>

        <Text style={[styles.sectionTitle, { color: titleColor }]}>Doses</Text>
        {(() => {
          const allDoses = (user.dosages ?? []).flatMap((d) =>
            d.doses.map((dose) => ({ dosage: d, dose }))
          );
          if (allDoses.length === 0) {
            return <Text style={[styles.hint, { color: secondaryColor }]}>No doses recorded.</Text>;
          }
          return allDoses.map(({ dosage, dose }) => (
            <View key={dose.id} style={[styles.doseCard, { backgroundColor: cardBg }]}>
              <View style={styles.row}>
                <Text style={[styles.label, { color: labelColor }]}>Medication</Text>
                <Text style={[styles.value, { color: valueColor }]}>{dosage.name}</Text>
              </View>
              <View style={styles.row}>
                <Text style={[styles.label, { color: labelColor }]}>Dosage</Text>
                <Text style={[styles.value, { color: valueColor }]}>{dosage.dosage} {dosage.unit}</Text>
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
                    : "—"}
                </Text>
              </View>
              {dosage.notes != null && dosage.notes !== "" && (
                <View style={styles.row}>
                  <Text style={[styles.label, { color: labelColor }]}>Notes</Text>
                  <Text style={[styles.value, { color: valueColor }]}>{dosage.notes}</Text>
                </View>
              )}
            </View>
          ));
        })()}
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
  title: { fontSize: 24, fontWeight: "700", marginBottom: 8 },
  sectionTitle: { fontSize: 16, fontWeight: "600", marginTop: 16, marginBottom: 6 },
  row: { flexDirection: "row", marginBottom: 4 },
  label: { fontWeight: "500", marginRight: 6, minWidth: 120 },
  value: { flex: 1 },
  hint: { marginTop: 8, fontSize: 16 },
  error: { marginTop: 8, fontSize: 14 },
  doseCard: {
    marginBottom: 12,
    padding: 12,
    borderRadius: 8,
  },
});
