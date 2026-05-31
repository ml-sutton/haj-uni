import {
  useTheme,
  getGradientColors,
  primaryTextColor,
  secondaryTextColor,
} from "@/contexts/theme";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SupportUsAdButton } from "@/components/SupportUsAdButton";
import { Pressable, ScrollView, StyleSheet, Text } from "react-native";

/**
 * About screen with a short description of the HAJ app.
 *
 * @remarks
 * Expo Router file route: `/settings/about` (`app/(tabs)/settings/about.tsx`).
 *
 * @returns Static about content.
 */
export default function AboutScreen() {
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
        <Text style={[styles.title, { color: titleColor }]}>About</Text>
        <Text style={[styles.subtitle, { color: secondaryColor }]}>
          HAJ is a personal health and dosage tracking app. Your data is stored
          locally and protected with a PIN.
        </Text>
        <SupportUsAdButton />
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
});
