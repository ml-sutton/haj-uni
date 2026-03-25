import { PIN_LENGTH } from "@/components/registration/registrationTypes";
import { useTheme } from "@/contexts/theme";
import React, { useCallback, useRef, useState } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

export interface PinStepProps {
  value: string;
  onChange: (pin: string) => void;
  error?: string;
  label?: string;
  hint?: string;
}

const DIGITS = Array.from({ length: PIN_LENGTH }, (_, i) => i);

export function PinStep({
  value,
  onChange,
  error,
  label = "Create a 6-digit PIN",
  hint = "You will use this to sign in and unlock the app.",
}: PinStepProps): React.ReactElement {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);
  const inputRef = useRef<TextInput>(null);

  const labelColor = isDark ? "#fff" : "#1a1a1a";
  const hintColor = isDark ? "rgba(255,255,255,0.75)" : "#666";
  const dotBorderDefault = isDark ? "rgba(255,255,255,0.35)" : "#ccc";
  const dotBg = isDark ? "rgba(255,255,255,0.1)" : "#fff";
  const dotFocusedBg = isDark ? "rgba(0,102,204,0.2)" : "rgba(0,102,204,0.05)";
  const dotTextColor = isDark ? "#fff" : "#1a1a1a";

  const digits = value.padEnd(PIN_LENGTH, " ").split("");

  const handleChangeText = useCallback(
    (text: string) => {
      const digitsOnly = text.replace(/\D/g, "").slice(0, PIN_LENGTH);
      onChange(digitsOnly);
    },
    [onChange]
  );

  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: labelColor }]}>{label}</Text>
      <Text style={[styles.hint, { color: hintColor }]}>{hint}</Text>

      <TextInput
        ref={inputRef}
        style={styles.hiddenInput}
        value={value}
        onChangeText={handleChangeText}
        keyboardType="number-pad"
        maxLength={PIN_LENGTH}
        autoComplete="off"
        accessibilityLabel="6-digit PIN"
        accessibilityHint="Enter 6 digits"
        onFocus={() => setFocusedIndex(0)}
        onBlur={() => setFocusedIndex(null)}
      />

      <Pressable
        style={styles.dotsRow}
        onPress={() => inputRef.current?.focus()}
      >
        {DIGITS.map((index) => {
          const filled = digits[index] !== " ";
          const focused = focusedIndex !== null;
          return (
            <View
              key={index}
              style={[
                styles.dotWrap,
                {
                  borderColor: filled || focused ? "#0066cc" : dotBorderDefault,
                  backgroundColor: focused ? dotFocusedBg : dotBg,
                },
              ]}
            >
              <Text style={[styles.dotText, { color: dotTextColor }]}>
                {filled ? "•" : ""}
              </Text>
            </View>
          );
        })}
      </Pressable>

      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  label: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 6,
  },
  hint: {
    fontSize: 14,
    marginBottom: 24,
  },
  hiddenInput: {
    position: "absolute",
    width: 1,
    height: 1,
    opacity: 0,
    left: -9999,
  },
  dotsRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 12,
  },
  dotWrap: {
    width: 44,
    height: 52,
    borderRadius: 8,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  dotText: {
    fontSize: 24,
  },
  error: {
    marginTop: 12,
    fontSize: 14,
    color: "#e57373",
    textAlign: "center",
  },
});
