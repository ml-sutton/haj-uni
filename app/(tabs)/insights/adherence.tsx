import {
  cardBackgroundColor,
  getGradientColors,
  labelTextColor,
  primaryTextColor,
  secondaryTextColor,
  valueTextColor,
  useTheme,
} from "@/contexts/theme";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useMemo } from "react";
import { useDatabaseStore } from "@/stores/databaseStore";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

export default function AdherenceInsights() {
  const router = useRouter();
  const { theme, resolvedTheme, highContrast } = useTheme();
  const encryptionKey = useDatabaseStore((s) => s.encryptionKey);
  const user = useDatabaseStore((s) => s.user);
  const gradientColors = getGradientColors(resolvedTheme, {
    themeMode: theme,
    highContrast,
  });
  const titleColor = primaryTextColor(resolvedTheme, { themeMode: theme, highContrast });
  const secondaryColor = secondaryTextColor(resolvedTheme, {
    themeMode: theme,
    highContrast,
  });
  const labelColor = labelTextColor(resolvedTheme, { themeMode: theme, highContrast });
  const valueColor = valueTextColor(resolvedTheme, { themeMode: theme, highContrast });
  const cardBg = cardBackgroundColor(resolvedTheme, { themeMode: theme, highContrast });
  const loading = encryptionKey != null && user === null;

  const analytics = useMemo(() => {
    const allDoses = (user?.dosages ?? []).flatMap((d) => d.doses ?? []);
    const now = Date.now();
    const takenCount = allDoses.filter((dose) => dose.takenTime != null).length;
    const missed = allDoses.filter((dose) => {
      if (dose.takenTime != null) return false;
      return new Date(dose.scheduledTime).getTime() < now;
    });
    const missedCount = missed.length;

    const missesByWeekday = new Map<number, number>();
    for (const dose of missed) {
      const day = new Date(dose.scheduledTime).getDay();
      missesByWeekday.set(day, (missesByWeekday.get(day) ?? 0) + 1);
    }
    const topMiss = [...missesByWeekday.entries()].sort((a, b) => b[1] - a[1])[0];
    const weekdayLabels = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];
    const mostMissedDay = topMiss ? weekdayLabels[topMiss[0]] : null;

    return {
      takenCount,
      missedCount,
      totalDoses: allDoses.length,
      mostMissedDay,
      hasHistory: takenCount > 0 || missedCount > 0,
    };
  }, [user]);

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
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.title, { color: titleColor }]}>Adherence</Text>
        {loading ? (
          <Text style={[styles.subtitle, { color: secondaryColor }]}>Loading adherence insights…</Text>
        ) : !encryptionKey || !user || !analytics.hasHistory ? (
          <>
            <Text style={[styles.subtitle, { color: secondaryColor }]}>
              Insights are not ready yet. Create doses and use the app for a bit
              longer so we can detect taken and missed patterns.
            </Text>
            <View style={[styles.card, { backgroundColor: cardBg }]}>
              <Text style={[styles.cardText, { color: secondaryColor }]}>
                Once you start taking scheduled doses, this page will show your
                taken vs missed totals and the weekday you miss most often.
              </Text>
            </View>
          </>
        ) : (
          <>
            <Text style={[styles.subtitle, { color: secondaryColor }]}>
              These insights summarize your dose consistency based on completed and missed schedules.
            </Text>
            <View style={[styles.card, { backgroundColor: cardBg }]}>
              <View style={styles.metricRow}>
                <Text style={[styles.metricLabel, { color: labelColor }]}>Doses taken</Text>
                <Text style={[styles.metricValue, { color: valueColor }]}>{analytics.takenCount}</Text>
              </View>
              <View style={styles.metricRow}>
                <Text style={[styles.metricLabel, { color: labelColor }]}>Doses missed</Text>
                <Text style={[styles.metricValue, { color: valueColor }]}>{analytics.missedCount}</Text>
              </View>
              <View style={styles.metricRow}>
                <Text style={[styles.metricLabel, { color: labelColor }]}>Most likely day to miss</Text>
                <Text style={[styles.metricValue, { color: valueColor }]}>
                  {analytics.mostMissedDay ?? "No misses yet"}
                </Text>
              </View>
            </View>
          </>
        )}
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
  content: { paddingHorizontal: 20, paddingBottom: 40 },
  title: { fontSize: 26, fontWeight: "700", marginBottom: 10 },
  subtitle: { fontSize: 16, lineHeight: 23, marginBottom: 20 },
  card: { borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14 },
  cardText: { fontSize: 15, lineHeight: 21 },
  metricRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    gap: 12,
  },
  metricLabel: { fontSize: 15 },
  metricValue: { fontSize: 16, fontWeight: "700" },
});
