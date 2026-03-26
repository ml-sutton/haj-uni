import type { Dose } from "@/models/dose";
import type {
  Dosage,
  IngestionMethod,
  MedicationType,
  Unit,
} from "@/models/dosage";
import { useDatabaseStore } from "@/stores/databaseStore";
import { generateId } from "@/utils/id";
import {
  useTheme,
  getGradientColors,
  primaryTextColor,
  inputBackgroundColor,
  inputBorderColor,
} from "@/contexts/theme";
import { LinearGradient } from "expo-linear-gradient";
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
import { TimeSelector } from "@/components/doses/dateSelector";
import { getSafePreferences } from "@/stores/safePreferencesStore";
import { scheduleDoseReminders } from "@/service/notificationService";

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

/** Parse "HH:mm" or "H:mm" into { hours, minutes }. Returns null if invalid. */
function parseTimeOfDay(value: string): { hours: number; minutes: number } | null {
  const trimmed = value.trim();
  const match = trimmed.match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return null;
  const hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return null;
  return { hours, minutes };
}

/** Build a Date for today at the given time (local). */
function todayAt(hours: number, minutes: number): Date {
  const d = new Date();
  d.setHours(hours, minutes, 0, 0);
  return d;
}

/** Add n days to a date (returns new Date). */
function addDays(date: Date, days: number): Date {
  const out = new Date(date);
  out.setDate(out.getDate() + days);
  return out;
}

/** Format 24h "HH:mm" for display as 12h (e.g. "9:00 AM"). */
function formatTime24To12(value: string): string {
  const t = parseTimeOfDay(value);
  if (!t) return value;
  const { hours, minutes } = t;
  const hour12 = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
  const ampm = hours < 12 ? "AM" : "PM";
  return `${hour12}:${String(minutes).padStart(2, "0")} ${ampm}`;
}

export default function CreateDoseScreen() {
  const router = useRouter();
  const { resolvedTheme } = useTheme();
  const user = useDatabaseStore((s) => s.user);
  const setUser = useDatabaseStore((s) => s.setUser);
  const isDark = resolvedTheme === "dark";
  const gradientColors = getGradientColors(resolvedTheme);
  const labelColor = primaryTextColor(resolvedTheme);
  const inputBg = inputBackgroundColor(resolvedTheme);
  const inputBorder = inputBorderColor(resolvedTheme);

  const [name, setName] = useState("");
  const [dosageAmount, setDosageAmount] = useState("");
  const [unit, setUnit] = useState<Unit | null>(null);
  const [medicationType, setMedicationType] = useState<MedicationType | null>(
    null
  );
  const [ingestionMethod, setIngestionMethod] =
    useState<IngestionMethod | null>(null);
  const [frequencyDays, setFrequencyDays] = useState("");
  const [scheduledTimeOfDay, setScheduledTimeOfDay] = useState("09:00");
  const [timeSelectorVisible, setTimeSelectorVisible] = useState(false);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const saveDose = useCallback(async (oneOff: boolean = false) => {
    if (!user) {
      setError("Not signed in");
      return;
    }
    const dosageNum = parseFloat(dosageAmount.trim());
    const freqNum = parseInt(frequencyDays.trim(), 10);
    const time = parseTimeOfDay(scheduledTimeOfDay);

    if (!name.trim()) {
      setError("Medication name is required");
      return;
    }
    if (Number.isNaN(dosageNum) || dosageNum <= 0) {
      setError("Enter a valid dosage (number > 0)");
      return;
    }
    if (!unit) {
      setError("Select a unit");
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
    if (Number.isNaN(freqNum) || freqNum < 1) {
      setError("Enter valid days between doses (at least 1)");
      return;
    }
    if (!time) {
      setError("Enter a valid schedule time (e.g. 09:00)");
      return;
    }

    setError(null);
    setSaving(true);
    try {
      const dosageId = generateId();
      let baseTime = todayAt(time.hours, time.minutes);
      // If the scheduled time has already passed today, start from tomorrow
      if (baseTime.getTime() <= Date.now()) {
        baseTime = addDays(baseTime, 1);
      }
      const count = oneOff ? 1 : (user.preferences.dosesPerDosage ?? 7);
      const doses: Dose[] = [];
      for (let i = 0; i < count; i++) {
        doses.push({
          id: generateId(),
          scheduledTime: addDays(baseTime, i * freqNum),
          takenTime: null,
        });
      }

      const newDosage: Dosage = {
        id: dosageId,
        name: name.trim(),
        frequencyDays: freqNum,
        dosage: dosageNum,
        unit,
        notes: notes.trim() || null,
        ingestionMethod,
        medicationType,
        doses,
      };
      setUser({
        ...user,
        dosages: [...(user.dosages ?? []), newDosage],
      });
      const safePrefs = getSafePreferences();
      scheduleDoseReminders(doses, {
        isDiscrete: safePrefs.discreteMode,
        isSilent: safePrefs.silentMode,
      }).catch(() => {
        // Non-blocking: reminders are best-effort
      });
      setSaving(false);
      router.back();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save dose");
      setSaving(false);
    }
  }, [
    user,
    setUser,
    name,
    dosageAmount,
    unit,
    medicationType,
    ingestionMethod,
    frequencyDays,
    scheduledTimeOfDay,
    notes,
  ]);

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
    <LinearGradient
      colors={[...gradientColors]}
      style={styles.gradient}
      start={{ x: 0.5, y: 0 }}
      end={{ x: 0.5, y: 1 }}
    >
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

          <Text style={[styles.label, { color: labelColor }]}>
            Medication name
          </Text>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: inputBg,
                borderColor: inputBorder,
                color: labelColor,
              },
            ]}
            value={name}
            onChangeText={setName}
            placeholder="e.g. Estradiol"
            placeholderTextColor={isDark ? "rgba(255,255,255,0.5)" : "#999"}
            autoCapitalize="words"
          />

          <Text style={[styles.label, { color: labelColor }]}>Dosage amount</Text>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: inputBg,
                borderColor: inputBorder,
                color: labelColor,
              },
            ]}
            value={dosageAmount}
            onChangeText={setDosageAmount}
            placeholder="e.g. 2"
            placeholderTextColor={isDark ? "rgba(255,255,255,0.5)" : "#999"}
            keyboardType="decimal-pad"
          />

          <Text style={[styles.label, { color: labelColor }]}>Unit</Text>
          <View style={styles.chipWrap}>
            {UNITS.map((u) => (
              <Pressable
                key={u}
                style={[styles.chip, { backgroundColor: chipBg(unit === u) }]}
                onPress={() => setUnit(u)}
              >
                <Text
                  style={[styles.chipText, { color: chipText(unit === u) }]}
                >
                  {u}
                </Text>
              </Pressable>
            ))}
          </View>

          <Text style={[styles.label, { color: labelColor }]}>
            Medication type
          </Text>
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
            Days between doses (frequency)
          </Text>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: inputBg,
                borderColor: inputBorder,
                color: labelColor,
              },
            ]}
            value={frequencyDays}
            onChangeText={setFrequencyDays}
            placeholder="e.g. 1"
            placeholderTextColor={isDark ? "rgba(255,255,255,0.5)" : "#999"}
            keyboardType="number-pad"
          />

          <Text style={[styles.label, { color: labelColor }]}>
            Schedule time (when to take this dose)
          </Text>
          <Pressable
            style={[
              styles.input,
              styles.timeButton,
              {
                backgroundColor: inputBg,
                borderColor: inputBorder,
              },
            ]}
            onPress={() => setTimeSelectorVisible(true)}
          >
            <Text style={[styles.timeButtonText, { color: labelColor }]}>
              {formatTime24To12(scheduledTimeOfDay)}
            </Text>
            <Text style={[styles.timeButtonHint, { color: isDark ? "rgba(255,255,255,0.6)" : "#888" }]}>
              Tap to change
            </Text>
          </Pressable>
          <TimeSelector
            visible={timeSelectorVisible}
            onClose={() => setTimeSelectorVisible(false)}
            value={scheduledTimeOfDay}
            onSelect={setScheduledTimeOfDay}
          />

          <Text style={[styles.label, { color: labelColor }]}>
            Notes (optional)
          </Text>
          <TextInput
            style={[
              styles.input,
              styles.inputMultiline,
              {
                backgroundColor: inputBg,
                borderColor: inputBorder,
                color: labelColor,
              },
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
              onPress={() => saveDose(false)}
              onLongPress={() => saveDose(true)}
              disabled={saving}
              accessibilityLabel="Save dose. Long press for a single one-off dose."
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
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
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
  hint: { fontSize: 12, marginTop: 4, marginBottom: 4 },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
  },
  timeButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  timeButtonText: { fontSize: 16, fontWeight: "600" },
  timeButtonHint: { fontSize: 13 },
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
