import { getGradientColors, primaryTextColor, useTheme } from "@/contexts/theme";
import { hasDatabaseObject } from "@/database/database";
import { useDatabaseStore } from "@/stores/databaseStore";
import { findActiveUntakenDose } from "@/utils/doseQueries";
import { LinearGradient } from "expo-linear-gradient";
import { Redirect, type Href } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";

export default function Index() {
  const { theme, resolvedTheme, highContrast } = useTheme();
  const isAuthed = useDatabaseStore((s) => s.isAuthed);
  const user = useDatabaseStore((s) => s.user);
  const [hasObject, setHasObject] = useState<boolean | null>(null);
  const gradientColors = getGradientColors(resolvedTheme, { themeMode: theme, highContrast });
  const spinnerColor = primaryTextColor(resolvedTheme, { themeMode: theme, highContrast });

  useEffect(() => {
    let cancelled = false;
    // AsyncStorage.clear().then(() => {});
    hasDatabaseObject()
      .then((exists) => {
        if (!cancelled) setHasObject(exists);
      })
      .catch(() => {
        if (!cancelled) setHasObject(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (hasObject === null) {
    return (
      <LinearGradient colors={[...gradientColors]} style={{ flex: 1 }}>
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator size="large" color={spinnerColor} />
        </View>
      </LinearGradient>
    );
  }

  if (!hasObject) {
    return <Redirect href="/getStarted" />;
  }

  if (!isAuthed) {
    return <Redirect href="/login" />;
  }

  if (user) {
    const active = findActiveUntakenDose(user.dosages ?? []);
    if (active) {
      const href = `/active-dose?doseId=${encodeURIComponent(active.dose.id)}` as Href;
      return <Redirect href={href} />;
    }
  }

  return <Redirect href="/(tabs)" />;
}
