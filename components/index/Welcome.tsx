import {
  useTheme,
  primaryTextColor,
  cardBackgroundColor,
} from "@/contexts/theme";
import { getGreeting } from "@/const/greetings";
import type { User } from "@/models/user";
import { StyleSheet, Text, View } from "react-native";

function getNextDoseMedicationName(user: User): string | null {
  const now = new Date();
  const candidates: { name: string; scheduledTime: Date }[] = [];
  for (const medication of user.medications ?? []) {
    for (const dosage of medication.dosages) {
      for (const dose of dosage.doses) {
        const scheduled = new Date(dose.scheduledTime);
        if (scheduled > now && dose.takenTime == null) {
          candidates.push({ name: medication.name, scheduledTime: scheduled });
        }
      }
    }
  }
  if (candidates.length === 0) return null;
  candidates.sort((a, b) => a.scheduledTime.getTime() - b.scheduledTime.getTime());
  return candidates[0].name;
}

function getAdherenceRate(user: User): number | null {
  let total = 0;
  let taken = 0;
  for (const medication of user.medications ?? []) {
    for (const dosage of medication.dosages) {
      for (const dose of dosage.doses) {
        total += 1;
        if (dose.takenTime != null) taken += 1;
      }
    }
  }
  if (total === 0) return null;
  return Math.round((taken / total) * 100);
}

/**
 * Props for {@link Welcome}.
 */
export type WelcomeProps = {
  /**
   * @param user - Authenticated user for greeting, next dose, and adherence summary.
   */
  user: User;
};

/**
 * Home-screen welcome card with time-based greeting, next upcoming dose, and adherence percentage.
 *
 * @param props - User profile and medication schedule.
 * @returns A themed card with a single summary message line.
 */
export function Welcome({ user }: WelcomeProps) {
  const { resolvedTheme } = useTheme();
  const titleColor = primaryTextColor(resolvedTheme);
  const cardBg = cardBackgroundColor(resolvedTheme);

  const greeting = getGreeting();
  const nextMedication = getNextDoseMedicationName(user);
  const adherence = getAdherenceRate(user);

  const medicationText = nextMedication ?? "—";
  const adherenceText = adherence != null ? `${adherence}%` : "—";

  return (
    <View style={[styles.card, { backgroundColor: cardBg }]}>
      <Text style={[styles.message, { color: titleColor }]}>
        {greeting}, {user.username}! Your next dose is of {medicationText} and your
        adherence rate is {adherenceText}.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 18,
    marginBottom: 20,
  },
  message: {
    fontSize: 16,
    lineHeight: 24,
  },
});
