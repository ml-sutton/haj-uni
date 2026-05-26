import {
  getGradientColors,
  primaryTextColor,
  secondaryTextColor,
  useTheme,
} from "@/contexts/theme";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams } from "expo-router";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

function paramToString(value: string | string[] | undefined): string {
  if (typeof value === "string") return value;
  if (Array.isArray(value) && value.length > 0) return value[0] ?? "";
  return "";
}

export default function FirebaseLoggedInScreen() {
  const { user } = useLocalSearchParams<{ user?: string | string[] }>();
  const { theme, resolvedTheme, highContrast } = useTheme();
  const gradientColors = getGradientColors(resolvedTheme, {
    themeMode: theme,
    highContrast,
  });
  const titleColor = primaryTextColor(resolvedTheme, {
    themeMode: theme,
    highContrast,
  });
  const secondaryColor = secondaryTextColor(resolvedTheme, {
    themeMode: theme,
    highContrast,
  });
  const display = paramToString(user);

  return (
    <LinearGradient
      colors={[...gradientColors]}
      style={styles.gradient}
      start={{ x: 0.5, y: 0 }}
      end={{ x: 0.5, y: 1 }}
    >
      <View style={styles.center}>
        <Text style={[styles.message, { color: titleColor }]}>
          YOU ARE LOGGED IN {display}
        </Text>
        <Text style={[styles.sub, { color: secondaryColor }]}>
          Firebase Authentication session is active for this account.
        </Text>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 28,
  },
  message: {
    fontSize: 20,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 12,
  },
  sub: {
    fontSize: 15,
    textAlign: "center",
    lineHeight: 22,
  },
});
