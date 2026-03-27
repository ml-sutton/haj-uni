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
  for (const dosage of user.dosages ?? []) {
    for (const dose of dosage.doses) {
      const scheduled = new Date(dose.scheduledTime);
      if (scheduled > now && dose.takenTime == null) {
        candidates.push({ name: dosage.name, scheduledTime: scheduled });
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
  for (const dosage of user.dosages ?? []) {
    for (const dose of dosage.doses) {
      total += 1;
      if (dose.takenTime != null) taken += 1;
    }
  }
  if (total === 0) return null;
  return Math.round((taken / total) * 100);
}

type WelcomeProps = {
  user: User;
};

export function Welcome({ user }: WelcomeProps) {
  const { resolvedTheme } = useTheme();
  const titleColor = primaryTextColor(resolvedTheme);
  const cardBg = cardBackgroundColor(resolvedTheme);

  const greeting = getGreeting();
  const nextMedication = getNextDoseMedicationName(user);
  const adherence = getAdherenceRate(user);
  const hasAnyDoses = (user.dosages ?? []).some((dosage) => (dosage.doses ?? []).length > 0);

  const message = hasAnyDoses
    ? `${greeting}, ${user.username}! Your next dose is of ${nextMedication ?? "an upcoming medication"} and your adherence rate is ${adherence != null ? `${adherence}%` : "still building"}.`
    : `${greeting}, ${user.username}! You have no doses yet. Create your first dose to start tracking your schedule and unlock adherence insights.`;

  return (
    <View style={[styles.card, { backgroundColor: cardBg }]}>
      <Text style={[styles.message, { color: titleColor }]}>{message}</Text>
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
