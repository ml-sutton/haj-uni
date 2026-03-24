import {
  useTheme,
  getGradientColors,
  primaryTextColor,
  secondaryTextColor,
} from "@/contexts/theme";
import { Credits } from "@/const/credits";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

export default function CreditsScreen() {
  const { resolvedTheme } = useTheme();
  const titleColor = primaryTextColor(resolvedTheme);
  const secondaryColor = secondaryTextColor(resolvedTheme);
  const gradientColors = getGradientColors(resolvedTheme);
  const router = useRouter();

  return (
    <LinearGradient colors={[...gradientColors]} style={styles.gradient}>
      <Pressable
        style={({ pressed }) => [styles.backRow, pressed && { opacity: 0.7 }]}
        onPress={() => router.back()}
      >
        <Ionicons name="chevron-back" size={24} color={titleColor} />
        <Text style={[styles.backLabel, { color: titleColor }]}>Back</Text>
      </Pressable>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.title, { color: titleColor }]}>Credits</Text>
        <Text style={[styles.subtitle, { color: secondaryColor }]}>
          Thank you to everyone who helped bring HAJ to life.
        </Text>
        <View style={styles.list}>
          {Credits.map((credit) => (
            <View
              key={`${credit.alias}-${credit.title}`}
              style={styles.creditCard}
            >
              <Text style={[styles.alias, { color: titleColor }]}>
                {credit.alias}
              </Text>
              <Text style={[styles.pronouns, { color: secondaryColor }]}>
                {credit.pronouns}
              </Text>
              <Text style={[styles.role, { color: secondaryColor }]}>
                {credit.title}
              </Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  backRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 4,
  },
  backLabel: { fontSize: 17, fontWeight: "500" },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 40 },
  title: { fontSize: 26, fontWeight: "700", marginBottom: 8 },
  subtitle: { fontSize: 17, lineHeight: 24 },
  list: { marginTop: 16, gap: 12 },
  creditCard: {
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
  },
  alias: { fontSize: 18, fontWeight: "700" },
  pronouns: { marginTop: 4, fontSize: 14 },
  role: { marginTop: 8, fontSize: 16, fontWeight: "600" },
});
