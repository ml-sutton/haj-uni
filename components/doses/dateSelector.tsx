import {
  primaryTextColor,
  secondaryTextColor,
  cardBackgroundColor,
  inputBorderColor,
} from "@/contexts/theme";
import { useTheme } from "@/contexts/theme";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

/** Parse 24h "HH:mm" into { hour12, minute, isPM }. */
function parse24h(value: string): { hour12: number; minute: number; isPM: boolean } {
  const match = value.trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return { hour12: 9, minute: 0, isPM: false };
  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  if (hours < 0 || hours > 23) hours = 9;
  if (minutes < 0 || minutes > 59) return { hour12: hours % 12 || 12, minute: 0, isPM: hours >= 12 };
  const isPM = hours >= 12;
  const hour12 = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
  return { hour12, minute: minutes, isPM };
}

/** Round minute to nearest step (e.g. 5). */
function roundToStep(n: number, step: number): number {
  return Math.round(n / step) * step;
}

/** Format 12h selection to 24h "HH:mm". */
function to24h(hour12: number, minute: number, isPM: boolean): string {
  let hours = hour12;
  if (isPM && hour12 !== 12) hours += 12;
  if (!isPM && hour12 === 12) hours = 0;
  const h = String(hours).padStart(2, "0");
  const m = String(minute).padStart(2, "0");
  return `${h}:${m}`;
}

const HOURS_12 = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
const MINUTE_STEPS = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];

export interface TimeSelectorProps {
  visible: boolean;
  onClose: () => void;
  /** Current value in 24h "HH:mm". */
  value: string;
  /** Called with 24h "HH:mm" when user confirms. */
  onSelect: (value: string) => void;
}

export function TimeSelector({ visible, onClose, value, onSelect }: TimeSelectorProps) {
  const { resolvedTheme } = useTheme();
  const titleColor = primaryTextColor(resolvedTheme);
  const secondaryColor = secondaryTextColor(resolvedTheme);
  const cardBg = cardBackgroundColor(resolvedTheme);
  const inputBorder = inputBorderColor(resolvedTheme);

  const parsed = useMemo(() => parse24h(value), [value]);
  const [hour12, setHour12] = useState(parsed.hour12);
  const [minute, setMinute] = useState(roundToStep(parsed.minute, 5));
  const [isPM, setIsPM] = useState(parsed.isPM);

  useEffect(() => {
    if (visible) {
      const p = parse24h(value);
      setHour12(p.hour12);
      setMinute(roundToStep(p.minute, 5));
      setIsPM(p.isPM);
    }
  }, [visible, value]);

  const handleDone = useCallback(() => {
    onSelect(to24h(hour12, minute, isPM));
    onClose();
  }, [hour12, minute, isPM, onSelect, onClose]);

  const chipBg = (selected: boolean) =>
    selected
      ? resolvedTheme === "dark"
        ? "rgba(100,149,237,0.5)"
        : "#6495ed"
      : resolvedTheme === "dark"
        ? "rgba(255,255,255,0.12)"
        : "rgba(0,0,0,0.06)";
  const chipText = (selected: boolean) => (selected ? "#fff" : titleColor);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable
          style={[styles.card, { backgroundColor: cardBg, borderColor: inputBorder }]}
          onPress={(e) => e.stopPropagation()}
        >
          <View style={styles.header}>
            <Text style={[styles.title, { color: titleColor }]}>Schedule time</Text>
            <Pressable onPress={onClose} hitSlop={12}>
              <Text style={[styles.closeText, { color: secondaryColor }]}>Cancel</Text>
            </Pressable>
          </View>

          <Text style={[styles.sectionLabel, { color: secondaryColor }]}>Hour</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipRow}
            style={styles.chipScroll}
          >
            {HOURS_12.map((h) => (
              <Pressable
                key={h}
                style={[styles.chip, { backgroundColor: chipBg(hour12 === h) }]}
                onPress={() => setHour12(h)}
              >
                <Text style={[styles.chipText, { color: chipText(hour12 === h) }]}>{h}</Text>
              </Pressable>
            ))}
          </ScrollView>

          <Text style={[styles.sectionLabel, { color: secondaryColor }]}>Minute</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipRow}
            style={styles.chipScroll}
          >
            {MINUTE_STEPS.map((m) => (
              <Pressable
                key={m}
                style={[styles.chip, { backgroundColor: chipBg(minute === m) }]}
                onPress={() => setMinute(m)}
              >
                <Text style={[styles.chipText, { color: chipText(minute === m) }]}>
                  {String(m).padStart(2, "0")}
                </Text>
              </Pressable>
            ))}
          </ScrollView>

          <Text style={[styles.sectionLabel, { color: secondaryColor }]}>AM / PM</Text>
          <View style={styles.ampmRow}>
            <Pressable
              style={[styles.ampmChip, { backgroundColor: chipBg(!isPM) }]}
              onPress={() => setIsPM(false)}
            >
              <Text style={[styles.ampmText, { color: chipText(!isPM) }]}>AM</Text>
            </Pressable>
            <Pressable
              style={[styles.ampmChip, { backgroundColor: chipBg(isPM) }]}
              onPress={() => setIsPM(true)}
            >
              <Text style={[styles.ampmText, { color: chipText(isPM) }]}>PM</Text>
            </Pressable>
          </View>

          <View style={styles.preview}>
            <Text style={[styles.previewText, { color: titleColor }]}>
              {hour12}:{String(minute).padStart(2, "0")} {isPM ? "PM" : "AM"}
            </Text>
          </View>

          <Pressable style={styles.doneButton} onPress={handleDone}>
            <Text style={styles.doneButtonText}>Done</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "#1a1a1a",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  card: {
    width: "100%",
    maxWidth: 400,
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  title: { fontSize: 18, fontWeight: "600" },
  closeText: { fontSize: 16 },
  sectionLabel: {
    fontSize: 13,
    fontWeight: "500",
    marginBottom: 8,
    marginTop: 4,
  },
  chipRow: { flexDirection: "row", gap: 8, paddingVertical: 4 },
  chipScroll: { maxHeight: 52, marginBottom: 4 },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    minWidth: 44,
    alignItems: "center",
  },
  chipText: { fontSize: 16, fontWeight: "600" },
  ampmRow: { flexDirection: "row", gap: 12, marginTop: 4 },
  ampmChip: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  ampmText: { fontSize: 16, fontWeight: "600" },
  preview: {
    alignItems: "center",
    marginTop: 20,
    marginBottom: 16,
  },
  previewText: { fontSize: 22, fontWeight: "700" },
  doneButton: {
    backgroundColor: "#6495ed",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  doneButtonText: { fontSize: 16, fontWeight: "600", color: "#fff" },
});
