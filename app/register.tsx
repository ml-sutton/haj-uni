import { RegistrationForm } from "@/components/registration/registrationForm";
import type { RegistrationFormData } from "@/components/registration/registrationTypes";
import { PRIMARY_BUTTON_BG } from "@/contexts/theme";
import { useRouter } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function Register() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const handleSubmit = (_data: RegistrationFormData): void => {
    // Persistence runs inside RegistrationForm (save step); hook for analytics/tests.
  };

  return (
    <View style={styles.root}>
      <Pressable
        style={({ pressed }) => [
          styles.firebaseChip,
          { top: insets.top + 8 },
          pressed && styles.firebaseChipPressed,
        ]}
        onPress={() => router.push("/firebase-sign-in" as any)}
        accessibilityRole="button"
        accessibilityLabel="Pull from Firebase"
      >
        <Text style={[styles.firebaseChipText, { color: PRIMARY_BUTTON_BG }]}>
          Pull from firebase
        </Text>
      </Pressable>
      <RegistrationForm onSubmit={handleSubmit} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  firebaseChip: {
    position: "absolute",
    right: 12,
    zIndex: 20,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  firebaseChipPressed: { opacity: 0.75 },
  firebaseChipText: {
    fontSize: 15,
    fontWeight: "700",
  },
});
