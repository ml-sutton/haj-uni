import {
  useTheme,
  getGradientColors,
  primaryTextColor,
  secondaryTextColor,
  PRIMARY_BUTTON_BG,
} from "@/contexts/theme";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";

export default function GetStarted() {
  const router = useRouter();
  const { resolvedTheme } = useTheme();
  const titleColor = primaryTextColor(resolvedTheme);
  const subtitleColor = secondaryTextColor(resolvedTheme);
  const gradientColors = getGradientColors(resolvedTheme);

  return (
    <LinearGradient
      colors={[...gradientColors]}
      style={styles.gradient}
      start={{ x: 0.5, y: 0 }}
      end={{ x: 0.5, y: 1 }}
    >
      <View style={styles.container}>
        <Image
          source={require("@/assets/images/hajapp-icon.png")}
          style={styles.icon}
          accessibilityLabel="Haj app icon"
        />
        <Text style={[styles.title, { color: titleColor }]}>
          Welcome to Haj!
        </Text>
        <Text
          style={[
            styles.subtitle,
            { color: subtitleColor },
          ]}
        >
          Are you ready to enter the world of cool shark facts?
        </Text>
        <Pressable
          style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
          onPress={() => router.push("/register")}
        >
          <Text style={styles.buttonText}>Dive in</Text>
        </Pressable>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  icon: {
    width: 120,
    height: 120,
    marginBottom: 32,
    borderRadius: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  title: {
    fontSize: 26,
    fontWeight: "700",
    marginBottom: 12,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 17,
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 24,
  },
  button: {
    paddingVertical: 16,
    paddingHorizontal: 40,
    borderRadius: 12,
    backgroundColor: PRIMARY_BUTTON_BG,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 6,
  },
  buttonPressed: {
    opacity: 0.85,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#fff",
  },
});
