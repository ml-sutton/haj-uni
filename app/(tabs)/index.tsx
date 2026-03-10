import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { readEncryptedDBObject } from "@/database/database";
import type { User } from "@/models/user";
import { useDatabaseStore } from "@/stores/databaseStore";

const sectionTitle = { fontSize: 16, fontWeight: "600", marginTop: 16, marginBottom: 6 };
const row = { flexDirection: "row", marginBottom: 4 };
const label = { fontWeight: "500", marginRight: 6, minWidth: 120 };
const value = { flex: 1, color: "#333" };

export default function Home() {
  const encryptionKey = useDatabaseStore((s) => s.encryptionKey);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadUser = useCallback(async () => {
    if (!encryptionKey) {
      setUser(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await readEncryptedDBObject(encryptionKey);
      setUser(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load user data");
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, [encryptionKey]);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
        <Text style={styles.hint}>Loading user data…</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.error}>{error}</Text>
      </View>
    );
  }

  if (!user) {
    return (
      <View style={styles.centered}>
        <Text style={styles.hint}>Not signed in. User data is encrypted.</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.title}>Your data</Text>

      <Text style={sectionTitle}>Profile</Text>
      <View style={row}>
        <Text style={label}>Username</Text>
        <Text style={value}>{user.username}</Text>
      </View>
      <View style={row}>
        <Text style={label}>Pronouns</Text>
        <Text style={value}>
          {user.pronouns.length ? user.pronouns.join(", ") : "—"}
        </Text>
      </View>

      <Text style={sectionTitle}>Preferences (secure)</Text>
      <View style={row}>
        <Text style={label}>Self-destruct after attempts</Text>
        <Text style={value}>{String(user.preferences.selfDestructAfterFailedAttempts)}</Text>
      </View>
      <View style={row}>
        <Text style={label}>Last recovery verified</Text>
        <Text style={value}>
          {user.preferences.lastRecoveryVerifiedAt
            ? new Date(user.preferences.lastRecoveryVerifiedAt).toLocaleString()
            : "—"}
        </Text>
      </View>

      <Text style={sectionTitle}>Doses ({user.doses.length})</Text>
      {user.doses.length === 0 ? (
        <Text style={styles.hint}>No doses recorded.</Text>
      ) : (
        user.doses.map((dose, i) => (
          <View key={i} style={styles.doseCard}>
            <View style={row}>
              <Text style={label}>Medication</Text>
              <Text style={value}>{dose.medication}</Text>
            </View>
            <View style={row}>
              <Text style={label}>Dosage</Text>
              <Text style={value}>{dose.dosage} {dose.unit}</Text>
            </View>
            <View style={row}>
              <Text style={label}>Type</Text>
              <Text style={value}>{dose.medicationType}</Text>
            </View>
            <View style={row}>
              <Text style={label}>Method</Text>
              <Text style={value}>{dose.ingestionMethod}</Text>
            </View>
            <View style={row}>
              <Text style={label}>Frequency</Text>
              <Text style={value}>{dose.frequency} per day</Text>
            </View>
            <View style={row}>
              <Text style={label}>Scheduled</Text>
              <Text style={value}>
                {new Date(dose.scheduledTime).toLocaleString()}
              </Text>
            </View>
            <View style={row}>
              <Text style={label}>Taken</Text>
              <Text style={value}>
                {dose.takenTime
                  ? new Date(dose.takenTime).toLocaleString()
                  : "—"}
              </Text>
            </View>
            {dose.notes != null && dose.notes !== "" && (
              <View style={row}>
                <Text style={label}>Notes</Text>
                <Text style={value}>{dose.notes}</Text>
              </View>
            )}
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  scroll: { flex: 1 },
  content: { padding: 20, paddingBottom: 40 },
  title: { fontSize: 24, fontWeight: "600", marginBottom: 8 },
  hint: { color: "#666", marginTop: 8 },
  error: { color: "#c00", marginTop: 8 },
  doseCard: {
    marginBottom: 12,
    padding: 12,
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
  },
});
