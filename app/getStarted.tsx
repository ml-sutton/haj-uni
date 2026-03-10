import { useTheme } from "@/contexts/theme";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";

const DARK_GRADIENT = ["#174A5E", "#333333"] as const;
const LIGHT_GRADIENT = ["#F7DAF7", "#EBEBEB"] as const;

export default function GetStarted() {
  const router = useRouter();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const gradient = isDark ? DARK_GRADIENT : LIGHT_GRADIENT;

  return (
    <LinearGradient
      colors={[...gradient]}
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
        <Text style={[styles.title, { color: isDark ? "#fff" : "#1a1a1a" }]}>
          Welcome to Haj!
        </Text>
        <Text
          style={[
            styles.subtitle,
            { color: isDark ? "rgba(255,255,255,0.9)" : "#444" },
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
    backgroundColor: "#0066cc",
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
