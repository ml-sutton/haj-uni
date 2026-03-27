import {
  useTheme,
  primaryTextColor,
  secondaryTextColor,
  labelTextColor,
  valueTextColor,
  cardBackgroundColor,
} from "@/contexts/theme";
import type { Dosage } from "@/models/dosage";
import type { Dose } from "@/models/dose";
import type { User } from "@/models/user";
import { useCallback, useMemo, useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

function toDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function getDosesForDay(user: User, dateKey: string): { dosage: Dosage; dose: Dose }[] {
  const out: { dosage: Dosage; dose: Dose }[] = [];
  for (const dosage of user.dosages ?? []) {
    for (const dose of dosage.doses) {
      const scheduled = new Date(dose.scheduledTime);
      if (toDateKey(scheduled) === dateKey) {
        out.push({ dosage, dose });
      }
    }
  }
  out.sort((a, b) => new Date(a.dose.scheduledTime).getTime() - new Date(b.dose.scheduledTime).getTime());
  return out;
}

function getNext7Days(): { date: Date; dateKey: string; label: string; isToday: boolean }[] {
  const today = new Date();
  const days: { date: Date; dateKey: string; label: string; isToday: boolean }[] = [];
  const dayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  for (let i = 0; i < 7; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    const dateKey = toDateKey(d);
    const dayName = dayLabels[d.getDay()];
    const dateNum = d.getDate();
    days.push({
      date: d,
      dateKey,
      label: i === 0 ? "Today" : `${dayName} ${dateNum}`,
      isToday: i === 0,
    });
  }
  return days;
}

type CalendarProps = {
  user: User;
};

/** Theme-safe highlight for current day: subtle, doesn't clash with gradient/cards. */
function currentDayHighlight(theme: "dark" | "light"): string {
  return theme === "dark" ? "rgba(241,156,187,0.22)" : "rgba(127,191,233,0.35)";
}

export function Calendar({ user }: CalendarProps) {
  const { resolvedTheme } = useTheme();
  const [selectedDateKey, setSelectedDateKey] = useState<string | null>(null);

  const titleColor = primaryTextColor(resolvedTheme);
  const secondaryColor = secondaryTextColor(resolvedTheme);
  const labelColor = labelTextColor(resolvedTheme);
  const valueColor = valueTextColor(resolvedTheme);
  const cardBg = cardBackgroundColor(resolvedTheme);
  const todayBg = currentDayHighlight(resolvedTheme);
  const modalOverlayBg =
    resolvedTheme === "dark" ? "rgba(0,0,0,0.7)" : "rgba(0,0,0,0.45)";
  const modalHeaderBorder =
    resolvedTheme === "dark" ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.15)";

  const days = useMemo(() => getNext7Days(), []);
  const selectedDoses = useMemo(
    () => (selectedDateKey ? getDosesForDay(user, selectedDateKey) : []),
    [user, selectedDateKey]
  );
  const selectedLabel = useMemo(
    () => (selectedDateKey ? days.find((d) => d.dateKey === selectedDateKey)?.label ?? selectedDateKey : null),
    [selectedDateKey, days]
  );

  const openModal = useCallback((dateKey: string) => setSelectedDateKey(dateKey), []);
  const closeModal = useCallback(() => setSelectedDateKey(null), []);

  return (
    <View style={styles.wrapper}>
      <Text style={[styles.sectionTitle, { color: titleColor }]}>Next 7 days</Text>
      <View style={styles.dayRow}>
        {days.map(({ dateKey, label, isToday }) => (
          <Pressable
            key={dateKey}
            style={[
              styles.dayBox,
              { backgroundColor: cardBg },
              isToday && { backgroundColor: todayBg },
            ]}
            onPress={() => openModal(dateKey)}
          >
            <Text style={[styles.dayLabel, { color: isToday ? titleColor : secondaryColor }]} numberOfLines={1}>
              {label}
            </Text>
          </Pressable>
        ))}
      </View>

      <Modal
        visible={selectedDateKey != null}
        transparent
        animationType="fade"
        onRequestClose={closeModal}
      >
        <Pressable style={[styles.modalOverlay, { backgroundColor: modalOverlayBg }]} onPress={closeModal}>
          <Pressable
            style={[styles.modalContent, { backgroundColor: cardBg }]}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={[styles.modalHeader, { borderBottomColor: modalHeaderBorder }]}>
              <Text style={[styles.modalTitle, { color: titleColor }]}>
                Doses for {selectedLabel ?? selectedDateKey}
              </Text>
              <Pressable onPress={closeModal} hitSlop={12}>
                <Text style={[styles.modalClose, { color: titleColor }]}>Close</Text>
              </Pressable>
            </View>
            <ScrollView style={styles.modalScroll} keyboardShouldPersistTaps="handled">
              {selectedDoses.length === 0 ? (
                <Text style={[styles.empty, { color: secondaryColor }]}>No doses scheduled.</Text>
              ) : (
                selectedDoses.map(({ dosage, dose }) => (
                  <View key={dose.id} style={[styles.doseRow, { borderBottomColor: secondaryColor }]}>
                    <Text style={[styles.doseMedication, { color: valueColor }]}>{dosage.name}</Text>
                    <Text style={[styles.doseTime, { color: labelColor }]}>
                      {new Date(dose.scheduledTime).toLocaleTimeString(undefined, {
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                      {dose.takenTime != null
                        ? ` · Taken ${new Date(dose.takenTime).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}`
                        : " · Not taken"}
                    </Text>
                  </View>
                ))
              )}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { marginBottom: 24 },
  sectionTitle: { fontSize: 16, fontWeight: "600", marginBottom: 10 },
  dayRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  dayBox: {
    minWidth: 42,
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  dayLabel: { fontSize: 12, fontWeight: "600" },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  modalContent: {
    width: "100%",
    maxWidth: 400,
    maxHeight: "80%",
    borderRadius: 16,
    overflow: "hidden",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  modalTitle: { fontSize: 17, fontWeight: "600" },
  modalClose: { fontSize: 16, fontWeight: "500" },
  modalScroll: { maxHeight: 320, padding: 16 },
  empty: { fontSize: 15 },
  doseRow: {
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  doseMedication: { fontSize: 16, fontWeight: "600", marginBottom: 2 },
  doseTime: { fontSize: 13 },
});
