import { Pronouns } from "@/const/pronouns";
import { useTheme } from "@/contexts/theme";
import React, { useCallback, useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

export interface PronounsStepProps {
  value: string[];
  onChange: (pronouns: string[]) => void;
}

export function PronounsStep({
  value,
  onChange,
}: PronounsStepProps): React.ReactElement {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const labelColor = isDark ? "#fff" : "#1a1a1a";
  const triggerBg = isDark ? "rgba(255,255,255,0.12)" : "#fff";
  const triggerBorder = isDark ? "rgba(255,255,255,0.3)" : "#ccc";
  const triggerTextColor = isDark ? "#fff" : "#1a1a1a";
  const chevronColor = isDark ? "rgba(255,255,255,0.6)" : "#666";
  const modalBg = isDark ? "#2d2d2d" : "#fff";
  const modalHeaderBorder = isDark ? "rgba(255,255,255,0.1)" : "#eee";
  const modalTitleColor = isDark ? "#fff" : "#1a1a1a";
  const optionTextColor = isDark ? "#fff" : "#1a1a1a";
  const optionSelectedBg = isDark ? "rgba(0,102,204,0.25)" : "rgba(0,102,204,0.08)";

  const toggleOption = useCallback(
    (option: string) => {
      const next = value.includes(option)
        ? value.filter((p) => p !== option)
        : [...value, option];
      onChange(next);
    },
    [value, onChange]
  );

  const displayText =
    value.length === 0
      ? "Select pronouns (optional)"
      : value.join(", ");

  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: labelColor }]}>Pronouns</Text>
      <Pressable
        style={[styles.trigger, { backgroundColor: triggerBg, borderColor: triggerBorder }]}
        onPress={() => setDropdownOpen(true)}
        accessibilityLabel="Select pronouns"
        accessibilityHint="Opens list of pronoun options"
      >
        <Text style={[styles.triggerText, { color: triggerTextColor }]} numberOfLines={1}>
          {displayText}
        </Text>
        <Text style={[styles.chevron, { color: chevronColor }]}>▼</Text>
      </Pressable>

      <Modal
        visible={dropdownOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setDropdownOpen(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setDropdownOpen(false)}
        >
          <Pressable style={[styles.modalContent, { backgroundColor: modalBg }]} onPress={(e) => e.stopPropagation()}>
            <View style={[styles.modalHeader, { borderBottomColor: modalHeaderBorder }]}>
              <Text style={[styles.modalTitle, { color: modalTitleColor }]}>Select pronouns</Text>
              <Pressable
                onPress={() => setDropdownOpen(false)}
                hitSlop={12}
                accessibilityLabel="Close"
              >
                <Text style={styles.modalClose}>Done</Text>
              </Pressable>
            </View>
            <ScrollView style={styles.optionsList}>
              {Pronouns.map((option) => {
                const selected = value.includes(option);
                return (
                  <Pressable
                    key={option}
                    style={[styles.optionRow, selected && { backgroundColor: optionSelectedBg }]}
                    onPress={() => toggleOption(option)}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: selected }}
                    accessibilityLabel={option}
                  >
                    <Text style={[styles.optionText, { color: optionTextColor }]}>{option}</Text>
                    {selected ? <Text style={styles.check}>✓</Text> : null}
                  </Pressable>
                );
              })}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
  },
  trigger: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    minHeight: 48,
  },
  triggerText: {
    fontSize: 16,
    flex: 1,
  },
  chevron: {
    fontSize: 12,
    marginLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "#1a1a1a",
    justifyContent: "flex-end",
  },
  modalContent: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: "70%",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  modalClose: {
    fontSize: 16,
    color: "#0066cc",
    fontWeight: "600",
  },
  optionsList: {
    paddingVertical: 8,
  },
  optionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  optionText: {
    fontSize: 16,
  },
  check: {
    fontSize: 16,
    color: "#0066cc",
    fontWeight: "600",
  },
});
