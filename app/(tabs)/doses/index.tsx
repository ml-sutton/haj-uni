import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { readEncryptedDBObject } from "@/database/database";
import type { Dose } from "@/models/dose";
import type { User } from "@/models/user";
import { useDatabaseStore } from "@/stores/databaseStore";
import { useRouter } from "expo-router";

export default function DosesScreen() {
  const router = useRouter();
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
      setError(e instanceof Error ? e.message : "Failed to load doses");
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, [encryptionKey]);

  useFocusEffect(
    useCallback(() => {
      loadUser();
    }, [loadUser])
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
        <Text style={styles.hint}>Loading doses…</Text>
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
        <Text style={styles.hint}>Sign in to view and manage doses.</Text>
      </View>
    );
  }

  const doses: Dose[] = user.doses ?? [];

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <Text style={styles.title}>Doses</Text>
        <Pressable
          style={styles.addButton}
          onPress={() => router.push("/(tabs)/doses/create")}
          accessibilityLabel="Add dose"
        >
          <Text style={styles.addButtonText}>Add dose</Text>
        </Pressable>
      </View>

      {doses.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>You have no doses</Text>
          <Text style={styles.emptyMessage}>
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
          {doses.map((dose, i) => (
            <View key={i} style={styles.card}>
              <Text style={styles.cardMedication}>{dose.medication}</Text>
              <Text style={styles.cardDetail}>
                {dose.dosage} {dose.unit} · {dose.medicationType} ·{" "}
                {dose.ingestionMethod}
              </Text>
              <Text style={styles.cardDetail}>
                {dose.frequency}x/day · Scheduled{" "}
                {new Date(dose.scheduledTime).toLocaleString()}
              </Text>
              {dose.takenTime && (
                <Text style={styles.cardTaken}>
                  Taken {new Date(dose.takenTime).toLocaleString()}
                </Text>
              )}
            </View>
          ))}
        </View>
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
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  title: { fontSize: 24, fontWeight: "600" },
  addButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: "rgba(0,0,0,0.08)",
    borderRadius: 8,
  },
  addButtonText: { fontSize: 15, fontWeight: "600" },
  empty: {
    marginTop: 24,
    alignItems: "center",
  },
  emptyTitle: { fontSize: 18, fontWeight: "600", marginBottom: 8 },
  emptyMessage: {
    fontSize: 15,
    color: "#666",
    textAlign: "center",
    marginBottom: 20,
  },
  primaryButton: {
    paddingHorizontal: 24,
    paddingVertical: 14,
    backgroundColor: "#6495ed",
    borderRadius: 10,
  },
  primaryButtonText: { fontSize: 16, fontWeight: "600", color: "#fff" },
  list: { gap: 12 },
  card: {
    padding: 14,
    backgroundColor: "#f5f5f5",
    borderRadius: 10,
  },
  cardMedication: { fontSize: 16, fontWeight: "600", marginBottom: 4 },
  cardDetail: { fontSize: 13, color: "#555", marginBottom: 2 },
  cardTaken: { fontSize: 13, color: "#2e7d32", marginTop: 4 },
  hint: { color: "#666", marginTop: 8 },
  error: { color: "#c00", marginTop: 8 },
});
