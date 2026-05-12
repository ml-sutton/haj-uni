import type { Dose } from "@/models/dose";
import type {
  Dosage,
  IngestionMethod,
  MedicationType,
  TimeOfDay,
  Unit,
} from "@/models/dosage";
import type { Medication } from "@/models/medication";
import { useDatabaseStore, persistStoreToDatabase } from "@/stores/databaseStore";
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
import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import { TimeSelector } from "@/components/doses/dateSelector";
import { getSafePreferences } from "@/stores/safePreferencesStore";
import {
  cancelDoseRemindersForDoseIds,
  scheduleDoseReminders,
} from "@/service/notificationService";

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

function parseTimeOfDay(value: string): { hours: number; minutes: number } | null {
  const trimmed = value.trim();
  const match = trimmed.match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return null;
  const hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return null;
  return { hours, minutes };
}

function todayAt(hours: number, minutes: number): Date {
  const d = new Date();
  d.setHours(hours, minutes, 0, 0);
  return d;
}

function addDays(date: Date, days: number): Date {
  const out = new Date(date);
  out.setDate(out.getDate() + days);
  return out;
}

function formatTime24To12(value: string): string {
  const t = parseTimeOfDay(value);
  if (!t) return value;
  const { hours, minutes } = t;
  const hour12 = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
  const ampm = hours < 12 ? "AM" : "PM";
  return `${hour12}:${String(minutes).padStart(2, "0")} ${ampm}`;
}

function timeOfDayToHHmm(t: TimeOfDay): string {
  return `${String(t.hour).padStart(2, "0")}:${String(t.minute).padStart(2, "0")}`;
}

function parseScheduleTimesToModel(times: string[]): TimeOfDay[] {
  const out: TimeOfDay[] = [];
  for (const s of times) {
    const p = parseTimeOfDay(s);
    if (p) out.push({ hour: p.hours, minute: p.minutes });
  }
  return out;
}

function buildDosesForTimesOfDay(
  timesOfDay: TimeOfDay[],
  frequencyDays: number,
  occurrencesPerSlot: number,
  oneOff: boolean
): Dose[] {
  const doses: Dose[] = [];
  const n = oneOff ? 1 : occurrencesPerSlot;
  for (const { hour, minute } of timesOfDay) {
    let baseTime = todayAt(hour, minute);
    if (baseTime.getTime() <= Date.now()) {
      baseTime = addDays(baseTime, 1);
    }
    for (let i = 0; i < n; i++) {
      doses.push({
        id: generateId(),
        scheduledTime: addDays(baseTime, i * frequencyDays),
        takenTime: null,
      });
    }
  }
  return doses;
}

type EditTarget = { medicationId: string; dosageId: string };
const CREATE_NEW_MEDICATION = "__new_medication__";

const DEFAULT_TIMES = ["09:00"];

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
  const [medicationType, setMedicationType] = useState<MedicationType | null>(null);
  const [ingestionMethod, setIngestionMethod] = useState<IngestionMethod | null>(null);
  const [frequencyDays, setFrequencyDays] = useState("");
  const [scheduleTimes, setScheduleTimes] = useState<string[]>(() => [...DEFAULT_TIMES]);
  const [timeSelectorVisible, setTimeSelectorVisible] = useState(false);
  const [editingTimeIndex, setEditingTimeIndex] = useState<number | null>(null);
  const [quantity, setQuantity] = useState("");
  const [refillAlertOn, setRefillAlertOn] = useState(false);
  const [refillAlertQty, setRefillAlertQty] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editTarget, setEditTarget] = useState<EditTarget | null>(null);
  const [selectedMedicationId, setSelectedMedicationId] = useState<string>(CREATE_NEW_MEDICATION);

  const scheduleRows = useMemo(() => {
    if (!user?.medications?.length) return [];
    return user.medications.flatMap((m) =>
      m.dosages.map((d) => ({
        medicationId: m.id,
        dosageId: d.id,
        medicationName: m.name,
        summary: `${d.amount} ${d.unit} · ${d.timesOfDay.map(timeOfDayToHHmm).join(", ")} · every ${d.frequencyDays}d`,
      }))
    );
  }, [user?.medications]);

  const resetForm = useCallback(() => {
    setName("");
    setDosageAmount("");
    setUnit(null);
    setMedicationType(null);
    setIngestionMethod(null);
    setFrequencyDays("");
    setScheduleTimes([...DEFAULT_TIMES]);
    setQuantity("");
    setRefillAlertOn(false);
    setRefillAlertQty("");
    setNotes("");
    setEditTarget(null);
    setSelectedMedicationId(CREATE_NEW_MEDICATION);
    setError(null);
  }, []);

  const startEdit = useCallback(
    (medicationId: string, dosageId: string) => {
      if (!user) return;
      const med = user.medications.find((m) => m.id === medicationId);
      const dos = med?.dosages.find((d) => d.id === dosageId);
      if (!med || !dos) return;
      setEditTarget({ medicationId, dosageId });
      setSelectedMedicationId(medicationId);
      setName(med.name);
      setDosageAmount(String(dos.amount));
      setUnit(dos.unit);
      setMedicationType(med.medicationType);
      setIngestionMethod(med.ingestionMethod);
      setFrequencyDays(String(dos.frequencyDays));
      setScheduleTimes(dos.timesOfDay.map(timeOfDayToHHmm));
      setQuantity(String(med.quantity));
      setRefillAlertOn(med.refillAlertOn);
      setRefillAlertQty(med.refillAlertQty > 0 ? String(med.refillAlertQty) : "");
      setNotes(dos.notes ?? "");
      setError(null);
    },
    [user]
  );

  const openTimeEditor = useCallback((index: number) => {
    setEditingTimeIndex(index);
    setTimeSelectorVisible(true);
  }, []);

  const onTimeSelected = useCallback(
    (value: string) => {
      if (editingTimeIndex == null) return;
      setScheduleTimes((prev) => {
        const next = [...prev];
        next[editingTimeIndex] = value;
        return next;
      });
      setTimeSelectorVisible(false);
      setEditingTimeIndex(null);
    },
    [editingTimeIndex]
  );

  const addScheduleTime = useCallback(() => {
    setScheduleTimes((prev) => [...prev, "12:00"]);
  }, []);

  const removeScheduleTime = useCallback((index: number) => {
    setScheduleTimes((prev) => (prev.length <= 1 ? prev : prev.filter((_, i) => i !== index)));
  }, []);

  const deleteSchedule = useCallback(
    (medicationId: string, dosageId: string) => {
      if (!user) return;
      const med = user.medications.find((m) => m.id === medicationId);
      const dos = med?.dosages.find((d) => d.id === dosageId);
      if (!med || !dos) return;
      Alert.alert(
        "Delete schedule",
        `Remove this schedule for ${med.name}? Scheduled reminders for its doses will be cancelled.`,
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Delete",
            style: "destructive",
            onPress: async () => {
              await cancelDoseRemindersForDoseIds(dos.doses.map((d) => d.id)).catch(() => {});
              const nextMedications = user.medications
                .map((m) => {
                  if (m.id !== medicationId) return m;
                  const nextDosages = m.dosages.filter((d) => d.id !== dosageId);
                  return { ...m, dosages: nextDosages };
                })
                .filter((m) => m.dosages.length > 0);
              setUser({ ...user, medications: nextMedications });
              if (editTarget?.dosageId === dosageId) resetForm();
              await persistStoreToDatabase().catch(() => {});
            },
          },
        ]
      );
    },
    [user, setUser, editTarget, resetForm]
  );

  const saveDose = useCallback(
    async (oneOff: boolean = false) => {
      if (!user) {
        setError("Not signed in");
        return;
      }
      const dosageNum = parseFloat(dosageAmount.trim());
      const freqNum = parseInt(frequencyDays.trim(), 10);
      const timesOfDay = parseScheduleTimesToModel(scheduleTimes);
      const qtyParsed = parseInt(quantity.trim(), 10);
      const qtyNum = Number.isNaN(qtyParsed) || qtyParsed < 0 ? 0 : qtyParsed;
      const refillQtyParsed = parseInt(refillAlertQty.trim(), 10);
      const refillQtyNum =
        refillAlertOn && !Number.isNaN(refillQtyParsed) && refillQtyParsed >= 0
          ? refillQtyParsed
          : 0;

      const selectedExistingMedication =
        selectedMedicationId !== CREATE_NEW_MEDICATION
          ? user.medications.find((m) => m.id === selectedMedicationId) ?? null
          : null;
      const creatingNewMedication = selectedExistingMedication == null;

      if (creatingNewMedication && !name.trim()) {
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
      if (creatingNewMedication && !medicationType) {
        setError("Select a medication type");
        return;
      }
      if (creatingNewMedication && !ingestionMethod) {
        setError("Select an ingestion method");
        return;
      }
      if (Number.isNaN(freqNum) || freqNum < 1) {
        setError("Enter valid days between doses (at least 1)");
        return;
      }
      if (timesOfDay.length === 0) {
        setError("Add at least one valid schedule time (e.g. 09:00)");
        return;
      }

      setError(null);
      setSaving(true);
      try {
        const count = oneOff ? 1 : (user.preferences.dosesPerDosage ?? 7);
        const doses = buildDosesForTimesOfDay(timesOfDay, freqNum, count, oneOff);
        const safePrefs = getSafePreferences();

        if (editTarget) {
          const med = user.medications.find((m) => m.id === editTarget.medicationId);
          const prevDosage = med?.dosages.find((d) => d.id === editTarget.dosageId);
          if (!med || !prevDosage) {
            setError("That schedule no longer exists.");
            setSaving(false);
            return;
          }
          await cancelDoseRemindersForDoseIds(prevDosage.doses.map((d) => d.id)).catch(() => {});

          const updatedDosage: Dosage = {
            ...prevDosage,
            timesOfDay,
            amount: dosageNum,
            unit,
            frequencyDays: freqNum,
            notes: notes.trim() || null,
            doses,
          };

          const nextMedications: Medication[] = user.medications.map((m) => {
            if (m.id !== editTarget.medicationId) return m;
            return {
              ...m,
              name: creatingNewMedication ? name.trim() : m.name,
              ingestionMethod: creatingNewMedication ? ingestionMethod! : m.ingestionMethod,
              medicationType: creatingNewMedication ? medicationType! : m.medicationType,
              quantity: qtyNum,
              refillAlertOn,
              refillAlertQty: refillQtyNum,
              dosages: m.dosages.map((d) => (d.id === editTarget.dosageId ? updatedDosage : d)),
            };
          });

          setUser({ ...user, medications: nextMedications });
          await scheduleDoseReminders(doses, {
            isDiscrete: safePrefs.discreteMode,
            isSilent: safePrefs.silentMode,
          }).catch(() => {});
        } else {
          const dosageId = generateId();
          const newDosage: Dosage = {
            id: dosageId,
            timesOfDay,
            amount: dosageNum,
            unit,
            frequencyDays: freqNum,
            notes: notes.trim() || null,
            doses,
          };

          if (selectedExistingMedication) {
            setUser({
              ...user,
              medications: user.medications.map((m) =>
                m.id === selectedExistingMedication.id ? { ...m, dosages: [...m.dosages, newDosage] } : m
              ),
            });
          } else {
            const medicationId = generateId();
            const newMedication: Medication = {
              id: medicationId,
              name: name.trim(),
              ingestionMethod: ingestionMethod!,
              medicationType: medicationType!,
              quantity: qtyNum,
              refillAlertOn,
              refillAlertQty: refillQtyNum,
              dosages: [newDosage],
            };
            setUser({
              ...user,
              medications: [...user.medications, newMedication],
            });
          }
          await scheduleDoseReminders(doses, {
            isDiscrete: safePrefs.discreteMode,
            isSilent: safePrefs.silentMode,
          }).catch(() => {});
        }

        await persistStoreToDatabase().catch(() => {});
        resetForm();
        setSaving(false);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to save");
        setSaving(false);
      }
    },
    [
      user,
      setUser,
      name,
      dosageAmount,
      unit,
      medicationType,
      ingestionMethod,
      frequencyDays,
      scheduleTimes,
      quantity,
      refillAlertOn,
      refillAlertQty,
      notes,
      editTarget,
      selectedMedicationId,
      resetForm,
    ]
  );

  const chipBg = (selected: boolean) =>
    selected
      ? isDark
        ? "rgba(0,102,204,0.35)"
        : "#6495ed"
      : isDark
        ? "rgba(255,255,255,0.15)"
        : "rgba(0,0,0,0.06)";
  const chipText = (selected: boolean) => (selected ? "#fff" : labelColor);

  const timeSelectorValue =
    editingTimeIndex != null ? (scheduleTimes[editingTimeIndex] ?? "09:00") : "09:00";

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
              <Text style={[styles.backButtonText, { color: labelColor }]}>← Back</Text>
            </Pressable>
            <Text style={[styles.title, { color: labelColor }]}>
              {editTarget ? "Edit schedule" : "Add schedule"}
            </Text>
          </View>

          {error ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          {scheduleRows.length > 0 ? (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: labelColor }]}>Your schedules</Text>
              {scheduleRows.map((row) => (
                <View
                  key={`${row.medicationId}-${row.dosageId}`}
                  style={[styles.scheduleRow, { borderColor: inputBorder, backgroundColor: inputBg }]}
                >
                  <View style={styles.scheduleRowText}>
                    <Text style={[styles.scheduleName, { color: labelColor }]}>{row.medicationName}</Text>
                    <Text style={[styles.scheduleMeta, { color: labelColor }]}>{row.summary}</Text>
                  </View>
                  <View style={styles.scheduleActions}>
                    <Pressable
                      onPress={() => startEdit(row.medicationId, row.dosageId)}
                      style={[styles.smallBtn, { borderColor: inputBorder }]}
                      accessibilityLabel={`Edit schedule for ${row.medicationName}`}
                    >
                      <Text style={[styles.smallBtnText, { color: labelColor }]}>Edit</Text>
                    </Pressable>
                    <Pressable
                      onPress={() => deleteSchedule(row.medicationId, row.dosageId)}
                      style={styles.smallBtnDanger}
                      accessibilityLabel={`Delete schedule for ${row.medicationName}`}
                    >
                      <Text style={styles.smallBtnDangerText}>Delete</Text>
                    </Pressable>
                  </View>
                </View>
              ))}
            </View>
          ) : null}

          {editTarget ? (
            <Pressable onPress={resetForm} style={styles.cancelEditRow}>
              <Text style={[styles.cancelEditText, { color: labelColor }]}>Cancel editing</Text>
            </Pressable>
          ) : null}

          {selectedMedicationId === CREATE_NEW_MEDICATION || !!editTarget ? (
            <Text style={[styles.label, { color: labelColor }]}>Medication name</Text>
          ) : null}
          {!editTarget && user?.medications?.length ? (
            <>
              <Text style={[styles.label, { color: labelColor }]}>Use existing medication or create new</Text>
              <View style={styles.chipWrap}>
                {user.medications.map((m) => (
                  <Pressable
                    key={m.id}
                    style={[styles.chip, { backgroundColor: chipBg(selectedMedicationId === m.id) }]}
                    onPress={() => setSelectedMedicationId(m.id)}
                  >
                    <Text style={[styles.chipText, { color: chipText(selectedMedicationId === m.id) }]}>
                      {m.name}
                    </Text>
                  </Pressable>
                ))}
                <Pressable
                  style={[
                    styles.chip,
                    { backgroundColor: chipBg(selectedMedicationId === CREATE_NEW_MEDICATION) },
                  ]}
                  onPress={() => setSelectedMedicationId(CREATE_NEW_MEDICATION)}
                >
                  <Text
                    style={[
                      styles.chipText,
                      { color: chipText(selectedMedicationId === CREATE_NEW_MEDICATION) },
                    ]}
                  >
                    + Create new medication
                  </Text>
                </Pressable>
              </View>
            </>
          ) : null}

          {selectedMedicationId !== CREATE_NEW_MEDICATION && !editTarget ? (
            <View style={[styles.scheduleRow, { borderColor: inputBorder, backgroundColor: inputBg }]}>
              <View style={styles.scheduleRowText}>
                <Text style={[styles.scheduleName, { color: labelColor }]}>
                  {
                    user?.medications.find((m) => m.id === selectedMedicationId)?.name ??
                    "Selected medication"
                  }
                </Text>
                <Text style={[styles.scheduleMeta, { color: labelColor }]}>
                  Details will be reused from this medication.
                </Text>
              </View>
            </View>
          ) : (
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
          )}

          <Text style={[styles.label, { color: labelColor }]}>Amount (per time)</Text>
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
                <Text style={[styles.chipText, { color: chipText(unit === u) }]}>{u}</Text>
              </Pressable>
            ))}
          </View>

          {selectedMedicationId === CREATE_NEW_MEDICATION || !!editTarget ? (
            <>
              <Text style={[styles.label, { color: labelColor }]}>Medication type</Text>
              <View style={styles.chipRow}>
                {MEDICATION_TYPES.map((type) => (
                  <Pressable
                    key={type}
                    style={[styles.chip, { backgroundColor: chipBg(medicationType === type) }]}
                    onPress={() => setMedicationType(type)}
                  >
                    <Text style={[styles.chipText, { color: chipText(medicationType === type) }]}>
                      {type}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </>
          ) : null}

          {selectedMedicationId === CREATE_NEW_MEDICATION || !!editTarget ? (
            <>
              <Text style={[styles.label, { color: labelColor }]}>Ingestion method</Text>
              <View style={styles.chipWrap}>
                {INGESTION_METHODS.map((method) => (
                  <Pressable
                    key={method}
                    style={[styles.chip, { backgroundColor: chipBg(ingestionMethod === method) }]}
                    onPress={() => setIngestionMethod(method)}
                  >
                    <Text style={[styles.chipText, { color: chipText(ingestionMethod === method) }]}>
                      {method}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </>
          ) : null}

          {selectedMedicationId === CREATE_NEW_MEDICATION || !!editTarget ? (
            <>
              <Text style={[styles.label, { color: labelColor }]}>Quantity on hand (optional)</Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: inputBg,
                    borderColor: inputBorder,
                    color: labelColor,
                  },
                ]}
                value={quantity}
                onChangeText={setQuantity}
                placeholder="0"
                placeholderTextColor={isDark ? "rgba(255,255,255,0.5)" : "#999"}
                keyboardType="number-pad"
              />

              <View style={styles.refillRow}>
                <Text style={[styles.label, { color: labelColor, marginTop: 0 }]}>Refill alert</Text>
                <Switch
                  value={refillAlertOn}
                  onValueChange={setRefillAlertOn}
                  accessibilityLabel="Refill alert"
                />
              </View>
              {refillAlertOn ? (
                <>
                  <Text style={[styles.label, { color: labelColor }]}>Alert when quantity at or below</Text>
                  <TextInput
                    style={[
                      styles.input,
                      {
                        backgroundColor: inputBg,
                        borderColor: inputBorder,
                        color: labelColor,
                      },
                    ]}
                    value={refillAlertQty}
                    onChangeText={setRefillAlertQty}
                    placeholder="e.g. 7"
                    placeholderTextColor={isDark ? "rgba(255,255,255,0.5)" : "#999"}
                    keyboardType="number-pad"
                  />
                </>
              ) : null}
            </>
          ) : null}

          <Text style={[styles.label, { color: labelColor }]}>Days between repeats (frequency)</Text>
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

          <Text style={[styles.label, { color: labelColor }]}>Times of day (tap to set each)</Text>
          {scheduleTimes.map((t, index) => (
            <View key={index} style={styles.timeRow}>
              <Pressable
                style={[
                  styles.input,
                  styles.timeButton,
                  {
                    backgroundColor: inputBg,
                    borderColor: inputBorder,
                    flex: 1,
                  },
                ]}
                onPress={() => openTimeEditor(index)}
              >
                <Text style={[styles.timeButtonText, { color: labelColor }]}>{formatTime24To12(t)}</Text>
                <Text
                  style={[styles.timeButtonHint, { color: isDark ? "rgba(255,255,255,0.6)" : "#888" }]}
                >
                  Tap to change
                </Text>
              </Pressable>
              {scheduleTimes.length > 1 ? (
                <Pressable
                  onPress={() => removeScheduleTime(index)}
                  style={[styles.removeTimeBtn, { borderColor: inputBorder }]}
                  accessibilityLabel="Remove this time"
                >
                  <Text style={[styles.removeTimeBtnText, { color: labelColor }]}>−</Text>
                </Pressable>
              ) : null}
            </View>
          ))}
          <Pressable
            onPress={addScheduleTime}
            style={[styles.addTimeBtn, { borderColor: inputBorder }]}
            accessibilityLabel="Add another time of day"
          >
            <Text style={[styles.addTimeBtnText, { color: labelColor }]}>+ Add time</Text>
          </Pressable>
          <TimeSelector
            visible={timeSelectorVisible}
            onClose={() => {
              setTimeSelectorVisible(false);
              setEditingTimeIndex(null);
            }}
            value={timeSelectorValue}
            onSelect={onTimeSelected}
          />

          <Text style={[styles.label, { color: labelColor }]}>Notes (optional)</Text>
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
              onPress={() => (editTarget ? resetForm() : router.back())}
              disabled={saving}
            >
              <Text style={[styles.cancelButtonText, { color: labelColor }]}>
                {editTarget ? "Cancel" : "Close"}
              </Text>
            </Pressable>
            <Pressable
              style={styles.saveButton}
              onPress={() => saveDose(false)}
              onLongPress={() => saveDose(true)}
              disabled={saving}
              accessibilityLabel="Save schedule. Long press for a single one-off occurrence per time."
            >
              {saving ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.saveButtonText}>{editTarget ? "Save changes" : "Save"}</Text>
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
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 16, fontWeight: "600", marginBottom: 10 },
  scheduleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 10,
    gap: 8,
  },
  scheduleRowText: { flex: 1, minWidth: 0 },
  scheduleName: { fontSize: 16, fontWeight: "600" },
  scheduleMeta: { fontSize: 13, marginTop: 4, opacity: 0.9 },
  scheduleActions: { flexDirection: "row", gap: 8 },
  smallBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  smallBtnText: { fontSize: 14, fontWeight: "600" },
  smallBtnDanger: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: "rgba(200,0,0,0.2)",
  },
  smallBtnDangerText: { fontSize: 14, fontWeight: "600", color: "#b00020" },
  cancelEditRow: { marginBottom: 16 },
  cancelEditText: { fontSize: 15, fontWeight: "500", textDecorationLine: "underline" },
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
  timeRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 },
  timeButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  timeButtonText: { fontSize: 16, fontWeight: "600" },
  timeButtonHint: { fontSize: 13 },
  removeTimeBtn: {
    width: 44,
    height: 48,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  removeTimeBtnText: { fontSize: 22, fontWeight: "600" },
  addTimeBtn: {
    alignSelf: "flex-start",
    marginTop: 4,
    marginBottom: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
    borderWidth: 1,
  },
  addTimeBtnText: { fontSize: 15, fontWeight: "600" },
  inputMultiline: { minHeight: 60, textAlignVertical: "top" },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chipWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
  },
  chipText: { fontSize: 14, fontWeight: "500" },
  refillRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 12,
  },
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
