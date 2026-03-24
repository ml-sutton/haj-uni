import {
  useTheme,
  getGradientColors,
  primaryTextColor,
  secondaryTextColor,
} from "@/contexts/theme";
import { useDatabaseStore } from "@/stores/databaseStore";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

function SettingsLink({
  href,
  label,
  icon,
  titleColor,
  secondaryColor,
}: {
  href: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  titleColor: string;
  secondaryColor: string;
}) {
  const router = useRouter();
  return (
    <Pressable
      style={({ pressed }) => [styles.linkRow, pressed && styles.linkPressed]}
      onPress={() => router.push(href as any)}
    >
      <View style={styles.linkLeft}>
        <Ionicons name={icon} size={22} color={secondaryColor} />
        <Text style={[styles.linkLabel, { color: titleColor }]}>{label}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color={secondaryColor} />
    </Pressable>
  );
}

function SectionHeader({
  title,
  color,
}: {
  title: string;
  color: string;
}) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={[styles.sectionTitle, { color }]}>{title}</Text>
    </View>
  );
}

export default function SettingsIndex() {
  const { resolvedTheme } = useTheme();
  const titleColor = primaryTextColor(resolvedTheme);
  const secondaryColor = secondaryTextColor(resolvedTheme);
  const gradientColors = getGradientColors(resolvedTheme);
  const router = useRouter();
  return (
    <LinearGradient colors={[...gradientColors]} style={styles.gradient}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <SectionHeader title="Settings" color={secondaryColor} />
        <SettingsLink
          href="/settings/appearance"
          label="Appearance and accessibility"
          icon="color-palette"
          titleColor={titleColor}
          secondaryColor={secondaryColor}
        />
        <SettingsLink
          href="/settings/privacy"
          label="Privacy and safety"
          icon="shield-checkmark"
          titleColor={titleColor}
          secondaryColor={secondaryColor}
        />
        <SettingsLink
          href="/settings/dosage"
          label="Dosage management and levels"
          icon="medical"
          titleColor={titleColor}
          secondaryColor={secondaryColor}
        />
        <SettingsLink
          href="/settings/dangerzone"
          label="Danger zone"
          icon="warning"
          titleColor={titleColor}
          secondaryColor={secondaryColor}
        />

        <SectionHeader title="About" color={secondaryColor} />
        <SettingsLink
          href="/settings/about"
          label="About"
          icon="information-circle"
          titleColor={titleColor}
          secondaryColor={secondaryColor}
        />
        <SettingsLink
          href="/settings/credits"
          label="Credits"
          icon="people"
          titleColor={titleColor}
          secondaryColor={secondaryColor}
        />
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
  },
  sectionHeader: {
    marginTop: 20,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  linkRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 12,
    marginBottom: 8,
  },
  linkPressed: { opacity: 0.8 },
  linkLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  linkLabel: {
    fontSize: 17,
    fontWeight: "500",
  },
});
