import {
  useTheme,
  getGradientColors,
  primaryTextColor,
  secondaryTextColor,
  labelTextColor,
  valueTextColor,
  cardBackgroundColor,
} from "@/contexts/theme";
import type { IngestionMethod, MedicationType, Unit } from "@/models/dosage";
import { persistStoreToDatabase } from "@/stores/databaseStore";
import { useDatabaseStore } from "@/stores/databaseStore";
import { findDoseById } from "@/utils/doseQueries";
import {
  isMedicationSupplyDepleted,
  medicationsAfterDoseTaken,
  medicationsAfterDoseUntaken,
} from "@/utils/medicationSupply";
import { FindPharmaciesButton } from "@/components/doses/FindPharmaciesButton";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
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
const UNITS: Unit[] = ["mg", "mL", "mcg", "g", "IU", "patch", "Other"];

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
    () => (user && doseId ? findDoseById(user.medications ?? [], doseId) : null),
    [user, doseId]
  );
  const loading = encryptionKey != null && user === null;
  const [markingTaken, setMarkingTaken] = useState(false);
  const [savingEdits, setSavingEdits] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [unit, setUnit] = useState<Unit | null>(null);
  const [medicationType, setMedicationType] = useState<MedicationType | null>(null);
  const [ingestionMethod, setIngestionMethod] = useState<IngestionMethod | null>(null);
  const [frequencyDays, setFrequencyDays] = useState("");
  const [notes, setNotes] = useState("");

  const startEditing = useCallback(() => {
    if (!found) return;
    setName(found.medication.name);
    setAmount(String(found.dosage.amount));
    setUnit(found.dosage.unit);
    setMedicationType(found.medication.medicationType);
    setIngestionMethod(found.medication.ingestionMethod);
    setFrequencyDays(String(found.dosage.frequencyDays));
    setNotes(found.dosage.notes ?? "");
    setEditError(null);
    setIsEditing(true);
  }, [found]);

  const cancelEditing = useCallback(() => {
    setIsEditing(false);
    setEditError(null);
  }, []);

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
    setMarkingTaken(false);
  }, [user, setUser, doseId, found]);

  const undoTaken = useCallback(() => {
    if (!user || !doseId || !found) return;
    setMarkingTaken(true);
    const updatedMedications = medicationsAfterDoseUntaken(
      user.medications,
      found.medication.id,
      found.dosage.id,
      doseId
    );
    setUser({ ...user, medications: updatedMedications });
    setMarkingTaken(false);
  }, [user, setUser, doseId, found]);

  const saveEdits = useCallback(async () => {
    if (!user || !found) return;
    const amountNum = parseFloat(amount.trim());
    const frequencyNum = parseInt(frequencyDays.trim(), 10);
    if (!name.trim()) {
      setEditError("Medication name is required.");
      return;
    }
    if (Number.isNaN(amountNum) || amountNum <= 0) {
      setEditError("Amount must be a number greater than 0.");
      return;
    }
    if (!unit || !medicationType || !ingestionMethod) {
      setEditError("Please select unit, medication type, and ingestion method.");
      return;
    }
    if (Number.isNaN(frequencyNum) || frequencyNum < 1) {
      setEditError("Frequency must be at least 1 day.");
      return;
    }

    setEditError(null);
    setSavingEdits(true);
    try {
      const updatedMedications = user.medications.map((m) => {
        if (m.id !== found.medication.id) return m;
        return {
          ...m,
          name: name.trim(),
          medicationType,
          ingestionMethod,
          dosages: m.dosages.map((d) =>
            d.id === found.dosage.id
              ? {
                  ...d,
                  amount: amountNum,
                  unit,
                  frequencyDays: frequencyNum,
                  notes: notes.trim() ? notes.trim() : null,
                }
              : d
          ),
        };
      });
      setUser({ ...user, medications: updatedMedications });
      await persistStoreToDatabase().catch(() => {});
      setIsEditing(false);
    } finally {
      setSavingEdits(false);
    }
  }, [
    amount,
    found,
    frequencyDays,
    ingestionMethod,
    medicationType,
    name,
    notes,
    setUser,
    unit,
    user,
  ]);

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

  const { medication, dosage, dose } = found;
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

        {isMedicationSupplyDepleted(medication) ? (
          <FindPharmaciesButton
            medicationId={medication.id}
            medicationName={medication.name}
          />
        ) : null}

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
          <Pressable
            style={[styles.markTakenButton, markingTaken && styles.markTakenButtonDisabled]}
            onPress={dose.takenTime ? undoTaken : markAsTaken}
            disabled={markingTaken}
            accessibilityLabel={dose.takenTime ? "Undo taken dose" : "Mark dose as taken now"}
          >
            {markingTaken ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.markTakenButtonText}>
                {dose.takenTime ? "Undo as taken" : "Mark as taken now"}
              </Text>
            )}
          </Pressable>
        </View>

        <View style={[styles.section, { backgroundColor: cardBg }]}>
          <View style={styles.connectedHeader}>
            <Text style={[styles.sectionTitle, { color: titleColor }]}>Connected dosage</Text>
            {isEditing ? (
              <View style={styles.editActions}>
                <Pressable onPress={cancelEditing} accessibilityLabel="Cancel editing dose details">
                  <Text style={[styles.actionText, { color: secondaryColor }]}>Cancel</Text>
                </Pressable>
                <Pressable onPress={saveEdits} disabled={savingEdits} accessibilityLabel="Save dose details">
                  <Text style={[styles.actionText, { color: titleColor }]}>
                    {savingEdits ? "Saving..." : "Save"}
                  </Text>
                </Pressable>
              </View>
            ) : (
              <Pressable onPress={startEditing} accessibilityLabel="Edit dose details">
                <Text style={[styles.actionText, { color: titleColor }]}>Edit</Text>
              </Pressable>
            )}
          </View>

          {editError ? <Text style={styles.errorText}>{editError}</Text> : null}

          {isEditing ? (
            <>
              <Text style={[styles.inputLabel, { color: labelColor }]}>Medication</Text>
              <TextInput
                style={[styles.input, { color: valueColor, borderColor: labelColor }]}
                value={name}
                onChangeText={setName}
                placeholder="Medication name"
                placeholderTextColor={secondaryColor}
              />
              <Text style={[styles.inputLabel, { color: labelColor }]}>Amount</Text>
              <TextInput
                style={[styles.input, { color: valueColor, borderColor: labelColor }]}
                value={amount}
                onChangeText={setAmount}
                placeholder="e.g. 2"
                placeholderTextColor={secondaryColor}
                keyboardType="decimal-pad"
              />
              <Text style={[styles.inputLabel, { color: labelColor }]}>Unit</Text>
              <View style={styles.chipWrap}>
                {UNITS.map((u) => (
                  <Pressable
                    key={u}
                    onPress={() => setUnit(u)}
                    style={[styles.chip, unit === u && styles.chipSelected]}
                  >
                    <Text style={[styles.chipText, unit === u ? styles.chipTextSelected : styles.chipTextDefault]}>
                      {u}
                    </Text>
                  </Pressable>
                ))}
              </View>
              <Text style={[styles.inputLabel, { color: labelColor }]}>Medication type</Text>
              <View style={styles.chipWrap}>
                {MEDICATION_TYPES.map((type) => (
                  <Pressable
                    key={type}
                    onPress={() => setMedicationType(type)}
                    style={[styles.chip, medicationType === type && styles.chipSelected]}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        medicationType === type ? styles.chipTextSelected : styles.chipTextDefault,
                      ]}
                    >
                      {type}
                    </Text>
                  </Pressable>
                ))}
              </View>
              <Text style={[styles.inputLabel, { color: labelColor }]}>Ingestion method</Text>
              <View style={styles.chipWrap}>
                {INGESTION_METHODS.map((method) => (
                  <Pressable
                    key={method}
                    onPress={() => setIngestionMethod(method)}
                    style={[styles.chip, ingestionMethod === method && styles.chipSelected]}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        ingestionMethod === method ? styles.chipTextSelected : styles.chipTextDefault,
                      ]}
                    >
                      {method}
                    </Text>
                  </Pressable>
                ))}
              </View>
              <Text style={[styles.inputLabel, { color: labelColor }]}>Frequency (days)</Text>
              <TextInput
                style={[styles.input, { color: valueColor, borderColor: labelColor }]}
                value={frequencyDays}
                onChangeText={setFrequencyDays}
                placeholder="e.g. 1"
                placeholderTextColor={secondaryColor}
                keyboardType="number-pad"
              />
              <Text style={[styles.inputLabel, { color: labelColor }]}>Notes</Text>
              <TextInput
                style={[styles.input, styles.notesInput, { color: valueColor, borderColor: labelColor }]}
                value={notes}
                onChangeText={setNotes}
                placeholder="Optional notes"
                placeholderTextColor={secondaryColor}
                multiline
              />
            </>
          ) : (
            <>
              <View style={styles.row}>
                <Text style={[styles.label, { color: labelColor }]}>Medication</Text>
                <Text style={[styles.value, { color: valueColor }]}>{medication.name}</Text>
              </View>
              <View style={styles.row}>
                <Text style={[styles.label, { color: labelColor }]}>Amount</Text>
                <Text style={[styles.value, { color: valueColor }]}>
                  {dosage.amount} {dosage.unit}
                </Text>
              </View>
              <View style={styles.row}>
                <Text style={[styles.label, { color: labelColor }]}>Type</Text>
                <Text style={[styles.value, { color: valueColor }]}>{medication.medicationType}</Text>
              </View>
              <View style={styles.row}>
                <Text style={[styles.label, { color: labelColor }]}>Method</Text>
                <Text style={[styles.value, { color: valueColor }]}>{medication.ingestionMethod}</Text>
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
            </>
          )}
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
  connectedHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  editActions: { flexDirection: "row", gap: 16 },
  actionText: { fontSize: 15, fontWeight: "600" },
  errorText: { fontSize: 13, color: "#b00020", marginBottom: 8 },
  inputLabel: { fontSize: 13, marginTop: 8, marginBottom: 6 },
  input: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 10, fontSize: 15 },
  notesInput: { minHeight: 60, textAlignVertical: "top" },
  chipWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 8 },
  chip: {
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "rgba(128,128,128,0.5)",
    backgroundColor: "rgba(128,128,128,0.12)",
  },
  chipSelected: {
    backgroundColor: "#6495ed",
    borderColor: "#6495ed",
  },
  chipText: { fontSize: 13, fontWeight: "500" },
  chipTextDefault: { color: "#333" },
  chipTextSelected: { color: "#fff" },
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
