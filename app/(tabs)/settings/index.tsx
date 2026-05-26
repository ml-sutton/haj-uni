import {
  useTheme,
  getGradientColors,
  primaryTextColor,
  secondaryTextColor,
} from "@/contexts/theme";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

/**
 * Navigable settings row with icon and chevron.
 *
 * @param props.href - Expo Router path to push on press.
 * @param props.label - Visible row title.
 * @param props.icon - Ionicons glyph name for the leading icon.
 * @param props.titleColor - Primary text color from theme.
 * @param props.secondaryColor - Muted icon/chevron color.
 * @param props.backgroundColor - Row background.
 * @param props.borderColor - Row border (high-contrast themes).
 * @returns A pressable settings link row.
 */
function SettingsLink({
  href,
  label,
  icon,
  titleColor,
  secondaryColor,
  backgroundColor,
  borderColor,
}: {
  href: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  titleColor: string;
  secondaryColor: string;
  backgroundColor: string;
  borderColor: string;
}) {
  const router = useRouter();
  return (
    <Pressable
      style={({ pressed }) => [
        styles.linkRow,
        { backgroundColor, borderColor },
        pressed && styles.linkPressed,
      ]}
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

/**
 * Uppercase section heading within the settings list.
 *
 * @param props.title - Section label text.
 * @param props.color - Text color from theme.
 * @returns A styled section header view.
 */
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

/**
 * Settings tab hub linking to sync, appearance, privacy, dosage, and about screens.
 *
 * @remarks
 * Expo Router file route: `/(tabs)/settings` (`app/(tabs)/settings/index.tsx`).
 *
 * @returns The settings menu screen.
 */
export default function SettingsIndex() {
  const { resolvedTheme, highContrast } = useTheme();
  const titleColor = primaryTextColor(resolvedTheme);
  const secondaryColor = secondaryTextColor(resolvedTheme);
  const gradientColors = getGradientColors(resolvedTheme);
  const linkBg = highContrast
    ? resolvedTheme === "dark"
      ? "#000000"
      : "#ffffff"
    : "rgba(255,255,255,0.15)";
  const linkBorderColor = highContrast
    ? resolvedTheme === "dark"
      ? "#ffffff"
      : "#000000"
    : "transparent";
  return (
    <LinearGradient colors={[...gradientColors]} style={styles.gradient}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <SectionHeader title="Settings" color={secondaryColor} />
        <SettingsLink
          href="/firebase-sign-in"
          label="Sync to firebase"
          icon="cloud-upload-outline"
          titleColor={titleColor}
          secondaryColor={secondaryColor}
          backgroundColor={linkBg}
          borderColor={linkBorderColor}
        />
        <SettingsLink
          href="/settings/appearance"
          label="Appearance and accessibility"
          icon="color-palette"
          titleColor={titleColor}
          secondaryColor={secondaryColor}
          backgroundColor={linkBg}
          borderColor={linkBorderColor}
        />
        <SettingsLink
          href="/settings/privacy"
          label="Privacy and safety"
          icon="shield-checkmark"
          titleColor={titleColor}
          secondaryColor={secondaryColor}
          backgroundColor={linkBg}
          borderColor={linkBorderColor}
        />
        <SettingsLink
          href="/settings/dosage"
          label="Dosage management and levels"
          icon="medical"
          titleColor={titleColor}
          secondaryColor={secondaryColor}
          backgroundColor={linkBg}
          borderColor={linkBorderColor}
        />
        <SettingsLink
          href="/settings/dangerzone"
          label="Danger zone"
          icon="warning"
          titleColor={titleColor}
          secondaryColor={secondaryColor}
          backgroundColor={linkBg}
          borderColor={linkBorderColor}
        />

        <SectionHeader title="About" color={secondaryColor} />
        <SettingsLink
          href="/settings/about"
          label="About"
          icon="information-circle"
          titleColor={titleColor}
          secondaryColor={secondaryColor}
          backgroundColor={linkBg}
          borderColor={linkBorderColor}
        />
        <SettingsLink
          href="/settings/credits"
          label="Credits"
          icon="people"
          titleColor={titleColor}
          secondaryColor={secondaryColor}
          backgroundColor={linkBg}
          borderColor={linkBorderColor}
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
    borderWidth: 1,
    borderColor: "transparent",
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
