import { hasDatabaseObject } from "@/database/database";
import { useDatabaseStore } from "@/stores/databaseStore";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Redirect } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";

export default function Index() {
  const isAuthed = useDatabaseStore((s) => s.isAuthed);
  const [hasObject, setHasObject] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;
    AsyncStorage.clear().then(() => {});
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
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!hasObject) {
    return <Redirect href="/getStarted" />;
  }

  if (!isAuthed) {
    return <Redirect href="/login" />;
  }

  return <Redirect href="/(tabs)" />;
}
