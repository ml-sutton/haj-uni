import {
  readEncryptedDBObject,
  writeEncryptedDBObject,
} from "@/database/database";
import type { Dose } from "@/models/dose";
import type { IngestionMethod, MedicationType } from "@/models/dose";
import { useDatabaseStore } from "@/stores/databaseStore";
import { useTheme } from "@/contexts/theme";
import { useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

const MEDICATION_TYPES: MedicationType[] = ["Hormone", "Blocker", "Helper"];
const INGESTION_METHODS: IngestionMethod[] = [
  "Oral",
  "Gel",
  "Patch",
  "Subcutaneous injection",
  "Intramuscular injection",
  "Other",
];

const defaultScheduledTime = () => new Date();

export default function CreateDoseScreen() {
  const router = useRouter();
  const { resolvedTheme } = useTheme();
  const encryptionKey = useDatabaseStore((s) => s.encryptionKey);
  const isDark = resolvedTheme === "dark";

  const [medication, setMedication] = useState("");
  const [dosage, setDosage] = useState("");
  const [unit, setUnit] = useState("mg");
  const [medicationType, setMedicationType] = useState<MedicationType | null>(
    null
  );
  const [ingestionMethod, setIngestionMethod] =
    useState<IngestionMethod | null>(null);
  const [frequency, setFrequency] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const saveDose = useCallback(async () => {
    if (!encryptionKey) {
      setError("Not signed in");
      return;
    }
    const dosageNum = parseFloat(dosage.trim());
    const frequencyNum = parseInt(frequency.trim(), 10);
    if (!medication.trim()) {
      setError("Medication is required");
      return;
    }
    if (Number.isNaN(dosageNum) || dosageNum <= 0) {
      setError("Enter a valid dosage (number > 0)");
      return;
    }
    if (!unit.trim()) {
      setError("Unit is required");
      return;
    }
    if (!medicationType) {
      setError("Select a medication type");
      return;
    }
    if (!ingestionMethod) {
      setError("Select an ingestion method");
      return;
    }
    if (Number.isNaN(frequencyNum) || frequencyNum < 1) {
      setError("Enter a valid frequency (at least 1 per day)");
      return;
    }

    setError(null);
    setSaving(true);
    try {
      const user = await readEncryptedDBObject(encryptionKey);
      const newDose: Dose = {
        medication: medication.trim(),
        dosage: dosageNum,
        unit: unit.trim(),
        medicationType,
        ingestionMethod,
        frequency: frequencyNum,
        scheduledTime: defaultScheduledTime(),
        takenTime: null,
        notes: notes.trim() || null,
      };
      await writeEncryptedDBObject(
        {
          ...user,
          doses: [...(user.doses ?? []), newDose],
        },
        encryptionKey
      );
      router.back();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save dose");
    } finally {
      setSaving(false);
    }
  }, [
    encryptionKey,
    medication,
    dosage,
    unit,
    medicationType,
    ingestionMethod,
    frequency,
    notes,
  ]);

  const labelColor = isDark ? "#fff" : "#1a1a1a";
  const inputBg = isDark ? "rgba(255,255,255,0.12)" : "#fff";
  const inputBorder = isDark ? "rgba(255,255,255,0.3)" : "#ccc";
  const chipBg = (selected: boolean) =>
    selected
      ? isDark
        ? "rgba(0,102,204,0.35)"
        : "#6495ed"
      : isDark
        ? "rgba(255,255,255,0.15)"
        : "rgba(0,0,0,0.06)";
  const chipText = (selected: boolean) => (selected ? "#fff" : labelColor);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 24 : 0}
    >
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Pressable
            onPress={() => router.back()}
            style={styles.backButton}
            accessibilityLabel="Go back"
          >
            <Text style={[styles.backButtonText, { color: labelColor }]}>
              ← Back
            </Text>
          </Pressable>
          <Text style={[styles.title, { color: labelColor }]}>New dose</Text>
        </View>

        {error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        <Text style={[styles.label, { color: labelColor }]}>Medication</Text>
        <TextInput
          style={[styles.input, { backgroundColor: inputBg, borderColor: inputBorder, color: labelColor }]}
          value={medication}
          onChangeText={setMedication}
          placeholder="e.g. Estradiol"
          placeholderTextColor={isDark ? "rgba(255,255,255,0.5)" : "#999"}
          autoCapitalize="words"
        />

        <Text style={[styles.label, { color: labelColor }]}>Dosage</Text>
        <TextInput
          style={[styles.input, { backgroundColor: inputBg, borderColor: inputBorder, color: labelColor }]}
          value={dosage}
          onChangeText={setDosage}
          placeholder="e.g. 2"
          placeholderTextColor={isDark ? "rgba(255,255,255,0.5)" : "#999"}
          keyboardType="decimal-pad"
        />

        <Text style={[styles.label, { color: labelColor }]}>Unit</Text>
        <TextInput
          style={[styles.input, { backgroundColor: inputBg, borderColor: inputBorder, color: labelColor }]}
          value={unit}
          onChangeText={setUnit}
          placeholder="e.g. mg, mL"
          placeholderTextColor={isDark ? "rgba(255,255,255,0.5)" : "#999"}
        />

        <Text style={[styles.label, { color: labelColor }]}>Medication type</Text>
        <View style={styles.chipRow}>
          {MEDICATION_TYPES.map((type) => (
            <Pressable
              key={type}
              style={[
                styles.chip,
                { backgroundColor: chipBg(medicationType === type) },
              ]}
              onPress={() => setMedicationType(type)}
            >
              <Text
                style={[
                  styles.chipText,
                  { color: chipText(medicationType === type) },
                ]}
              >
                {type}
              </Text>
            </Pressable>
          ))}
        </View>

        <Text style={[styles.label, { color: labelColor }]}>
          Ingestion method
        </Text>
        <View style={styles.chipWrap}>
          {INGESTION_METHODS.map((method) => (
            <Pressable
              key={method}
              style={[
                styles.chip,
                { backgroundColor: chipBg(ingestionMethod === method) },
              ]}
              onPress={() => setIngestionMethod(method)}
            >
              <Text
                style={[
                  styles.chipText,
                  { color: chipText(ingestionMethod === method) },
                ]}
              >
                {method}
              </Text>
            </Pressable>
          ))}
        </View>

        <Text style={[styles.label, { color: labelColor }]}>
          Times per day (frequency)
        </Text>
        <TextInput
          style={[styles.input, { backgroundColor: inputBg, borderColor: inputBorder, color: labelColor }]}
          value={frequency}
          onChangeText={setFrequency}
          placeholder="e.g. 1"
          placeholderTextColor={isDark ? "rgba(255,255,255,0.5)" : "#999"}
          keyboardType="number-pad"
        />

        <Text style={[styles.label, { color: labelColor }]}>Notes (optional)</Text>
        <TextInput
          style={[
            styles.input,
            styles.inputMultiline,
            { backgroundColor: inputBg, borderColor: inputBorder, color: labelColor },
          ]}
          value={notes}
          onChangeText={setNotes}
          placeholder="Any notes"
          placeholderTextColor={isDark ? "rgba(255,255,255,0.5)" : "#999"}
          multiline
          numberOfLines={2}
        />

        <View style={styles.actions}>
          <Pressable
            style={[styles.cancelButton, { borderColor: inputBorder }]}
            onPress={() => router.back()}
            disabled={saving}
          >
            <Text style={[styles.cancelButtonText, { color: labelColor }]}>
              Cancel
            </Text>
          </Pressable>
          <Pressable
            style={styles.saveButton}
            onPress={saveDose}
            disabled={saving}
            accessibilityLabel="Save dose"
          >
            {saving ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.saveButtonText}>Save dose</Text>
            )}
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flex: 1 },
  content: { padding: 20, paddingBottom: 40 },
  header: { flexDirection: "row", alignItems: "center", marginBottom: 20 },
  backButton: { paddingVertical: 8, paddingRight: 16 },
  backButtonText: { fontSize: 16 },
  title: { fontSize: 22, fontWeight: "600" },
  errorBox: {
    backgroundColor: "rgba(200,0,0,0.12)",
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: { color: "#c00", fontSize: 14 },
  label: {
    fontSize: 15,
    fontWeight: "500",
    marginBottom: 6,
    marginTop: 12,
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
  },
  inputMultiline: { minHeight: 60, textAlignVertical: "top" },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chipWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
  },
  chipText: { fontSize: 14, fontWeight: "500" },
  actions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 28,
    justifyContent: "flex-end",
  },
  cancelButton: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 10,
    borderWidth: 1,
  },
  cancelButtonText: { fontSize: 16, fontWeight: "600" },
  saveButton: {
    paddingHorizontal: 24,
    paddingVertical: 14,
    backgroundColor: "#6495ed",
    borderRadius: 10,
    minWidth: 120,
    alignItems: "center",
  },
  saveButtonText: { fontSize: 16, fontWeight: "600", color: "#fff" },
});
