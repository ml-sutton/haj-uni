import {
  useTheme,
  getGradientColors,
  primaryTextColor,
  secondaryTextColor,
  PRIMARY_BUTTON_BG,
} from "@/contexts/theme";
import { LinearGradient } from "expo-linear-gradient";
import { Pressable, StyleSheet, Text, View } from "react-native";

export default function Settings() {
  const { theme, toggleTheme, resolvedTheme } = useTheme();
  const titleColor = primaryTextColor(resolvedTheme);
  const secondaryColor = secondaryTextColor(resolvedTheme);
  const gradientColors = getGradientColors(resolvedTheme);

  return (
    <LinearGradient colors={[...gradientColors]} style={styles.gradient}>
      <View style={styles.container}>
        <Text style={[styles.title, { color: titleColor }]}>Settings</Text>
        <Text style={[styles.subtitle, { color: secondaryColor }]}>
          This page is not implemented.
        </Text>
        <Pressable style={styles.button} onPress={toggleTheme}>
          <Text style={styles.buttonText}>
            Toggle theme (current: {theme})
          </Text>
        </Pressable>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 26,
    fontWeight: "700",
    marginBottom: 12,
  },
  subtitle: {
    marginBottom: 24,
    fontSize: 17,
  },
  button: {
    paddingHorizontal: 24,
    paddingVertical: 14,
    backgroundColor: PRIMARY_BUTTON_BG,
    borderRadius: 12,
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
});
