import { useEffect } from "react";
import { Alert } from "react-native";
import { useRouter } from "expo-router";

export default function DisabledLevelsRoute() {
  const router = useRouter();

  useEffect(() => {
    Alert.alert(
      "Route disabled",
      "Levels is not yet implemented. This route is currently disabled.",
      [{ text: "OK", onPress: () => router.back() }]
    );
  }, [router]);

  return null;
}
