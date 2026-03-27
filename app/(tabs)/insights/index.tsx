import {
  cardBackgroundColor,
  getGradientColors,
  primaryTextColor,
  secondaryTextColor,
  useTheme,
} from "@/contexts/theme";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

export default function InsightsIndex() {
  const router = useRouter();
  const { theme, resolvedTheme, highContrast } = useTheme();
  const gradientColors = getGradientColors(resolvedTheme, {
    themeMode: theme,
    highContrast,
  });
  const titleColor = primaryTextColor(resolvedTheme, { themeMode: theme, highContrast });
  const secondaryColor = secondaryTextColor(resolvedTheme, {
    themeMode: theme,
    highContrast,
  });
  const cardBg = cardBackgroundColor(resolvedTheme, { themeMode: theme, highContrast });

  return (
    <LinearGradient colors={[...gradientColors]} style={styles.gradient}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.title, { color: titleColor }]}>Insights</Text>
        <Text style={[styles.subtitle, { color: secondaryColor }]}>
          Insights help you understand your dosing habits and trends over time.
          Open Adherence to review consistency, and Levels for concentration
          analytics once available.
        </Text>

        <View style={styles.list}>
          <Pressable
            style={({ pressed }) => [
              styles.linkRow,
              { backgroundColor: cardBg },
              pressed && styles.linkPressed,
            ]}
            onPress={() => router.push("/(tabs)/insights/adherence")}
          >
            <View style={styles.linkLeft}>
              <Ionicons name="checkmark-circle-outline" size={22} color={secondaryColor} />
              <Text style={[styles.linkLabel, { color: titleColor }]}>Adherence</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={secondaryColor} />
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.linkRow,
              { backgroundColor: cardBg },
              pressed && styles.linkPressed,
            ]}
            onPress={() =>
              Alert.alert(
                "Route disabled",
                "Levels is not yet implemented. This route is currently disabled."
              )
            }
          >
            <View style={styles.linkLeft}>
              <Ionicons name="pulse-outline" size={22} color={secondaryColor} />
              <Text style={[styles.linkLabel, { color: titleColor }]}>Levels</Text>
            </View>
            <Ionicons name="ban-outline" size={20} color={secondaryColor} />
          </Pressable>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 20, paddingBottom: 40, paddingTop: 16 },
  title: { fontSize: 26, fontWeight: "700", marginBottom: 10 },
  subtitle: { fontSize: 16, lineHeight: 23, marginBottom: 20 },
  list: { gap: 10 },
  linkRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  linkPressed: { opacity: 0.8 },
  linkLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  linkLabel: { fontSize: 17, fontWeight: "500" },
});
