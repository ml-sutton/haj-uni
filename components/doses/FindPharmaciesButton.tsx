import {
  PRIMARY_BUTTON_BG,
  primaryTextColor,
  secondaryTextColor,
  useTheme,
} from "@/contexts/theme";
import { useRouter, type Href } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

/**
 * Props for {@link FindPharmaciesButton}.
 */
export type FindPharmaciesButtonProps = {
  /**
   * @param medicationId - Medication id passed to the pharmacy map screen query string.
   */
  medicationId: string;
  /**
   * @param medicationName - Display name shown in copy and navigation accessibility labels.
   */
  medicationName: string;
  /**
   * @param compact - When true, renders a single compact button instead of the full supply-out banner.
   */
  compact?: boolean;
};

/**
 * Navigates the user to the nearby-pharmacies map when medication supply is depleted.
 *
 * @param props - Medication context and layout variant.
 * @returns Either a compact pressable link or a banner with title, message, and primary button.
 */
export function FindPharmaciesButton({
  medicationId,
  medicationName,
  compact = false,
}: FindPharmaciesButtonProps): React.ReactElement {
  const router = useRouter();
  const { resolvedTheme } = useTheme();
  const titleColor = primaryTextColor(resolvedTheme);
  const secondaryColor = secondaryTextColor(resolvedTheme);

  const goToMap = () => {
    const href =
      `/find-pharmacies?medicationId=${encodeURIComponent(medicationId)}&medicationName=${encodeURIComponent(medicationName)}` as Href;
    router.push(href);
  };

  if (compact) {
    return (
      <Pressable
        style={styles.compactButton}
        onPress={goToMap}
        accessibilityLabel={`Find pharmacies near you for ${medicationName}`}
      >
        <Text style={styles.compactButtonText}>Find nearby pharmacies</Text>
      </Pressable>
    );
  }

  return (
    <View style={styles.banner}>
      <Text style={[styles.bannerTitle, { color: titleColor }]}>Supply out for {medicationName}</Text>
      <Text style={[styles.bannerMessage, { color: secondaryColor }]}>
        See pharmacies within 2 km of your current location.
      </Text>
      <Pressable
        style={styles.primaryButton}
        onPress={goToMap}
        accessibilityLabel={`Find pharmacies near you for ${medicationName}`}
      >
        <Text style={styles.primaryButtonText}>Find nearby pharmacies</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    marginBottom: 16,
    padding: 14,
    borderRadius: 10,
    backgroundColor: "rgba(255, 200, 200, 0.35)",
    borderWidth: 1,
    borderColor: "rgba(180, 60, 60, 0.35)",
  },
  bannerTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 6,
  },
  bannerMessage: {
    fontSize: 14,
    marginBottom: 12,
    lineHeight: 20,
  },
  primaryButton: {
    alignSelf: "flex-start",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: PRIMARY_BUTTON_BG,
  },
  primaryButtonText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
  },
  compactButton: {
    marginTop: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: PRIMARY_BUTTON_BG,
    alignSelf: "flex-start",
  },
  compactButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
});
