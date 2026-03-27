import { RESOURCES } from "@/const/resources";
import {
  cardBackgroundColor,
  primaryTextColor,
  secondaryTextColor,
  useTheme,
} from "@/contexts/theme";
import { Ionicons } from "@expo/vector-icons";
import { Alert, Linking, Pressable, StyleSheet, Text, View } from "react-native";

export function Resources() {
  const { resolvedTheme } = useTheme();
  const titleColor = primaryTextColor(resolvedTheme);
  const secondaryColor = secondaryTextColor(resolvedTheme);
  const cardBg = cardBackgroundColor(resolvedTheme);

  const handleOpen = async (url: string) => {
    try {
      const supported = await Linking.canOpenURL(url);
      if (!supported) {
        Alert.alert("Cannot open link", "This resource URL is not supported on your device.");
        return;
      }
      await Linking.openURL(url);
    } catch {
      Alert.alert("Unable to open resource", "Please try again in a moment.");
    }
  };

  return (
    <View style={styles.wrapper}>
      <Text style={[styles.sectionTitle, { color: titleColor }]}>Resources</Text>
      {RESOURCES.map((resource) => (
        <Pressable
          key={resource.id}
          style={({ pressed }) => [
            styles.resourceCard,
            { backgroundColor: cardBg },
            pressed && styles.resourcePressed,
          ]}
          onPress={() => handleOpen(resource.url)}
        >
          <View style={styles.headerRow}>
            <Text style={[styles.resourceTitle, { color: titleColor }]}>{resource.title}</Text>
            <Ionicons name="open-outline" size={18} color={secondaryColor} />
          </View>
          <Text style={[styles.resourceDescription, { color: secondaryColor }]}>
            {resource.description}
          </Text>
          <Text style={[styles.resourceCategory, { color: secondaryColor }]}>
            {resource.category}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { marginBottom: 24 },
  sectionTitle: { fontSize: 16, fontWeight: "600", marginBottom: 10 },
  resourceCard: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 8,
  },
  resourcePressed: { opacity: 0.8 },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  resourceTitle: { flex: 1, fontSize: 16, fontWeight: "600" },
  resourceDescription: { marginTop: 6, fontSize: 14, lineHeight: 20 },
  resourceCategory: { marginTop: 8, fontSize: 12, opacity: 0.9 },
});
