import { useTheme } from "@/contexts/theme";
import React from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

export interface UsernameStepProps {
  value: string;
  onChange: (username: string) => void;
  error?: string;
}

export function UsernameStep({
  value,
  onChange,
  error,
}: UsernameStepProps): React.ReactElement {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const labelColor = isDark ? "#fff" : "#1a1a1a";
  const inputBg = isDark ? "rgba(255,255,255,0.12)" : "#fff";
  const inputBorder = isDark ? "rgba(255,255,255,0.3)" : "#ccc";
  const inputColor = isDark ? "#fff" : "#1a1a1a";
  const placeholderColor = isDark ? "rgba(255,255,255,0.5)" : "#888";

  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: labelColor }]}>Username</Text>
      <TextInput
        style={[
          styles.input,
          {
            backgroundColor: inputBg,
            borderColor: error ? "#e57373" : inputBorder,
            color: inputColor,
          },
        ]}
        value={value}
        onChangeText={onChange}
        placeholder="Choose a username"
        placeholderTextColor={placeholderColor}
        autoCapitalize="none"
        autoCorrect={false}
        accessibilityLabel="Username"
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
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
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
  },
  error: {
    marginTop: 4,
    fontSize: 14,
    color: "#e57373",
  },
});
