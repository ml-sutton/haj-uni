import {
  getGradientColors,
  inputBorderColor,
  primaryTextColor,
  secondaryTextColor,
  PRIMARY_BUTTON_BG,
  useTheme,
} from "@/contexts/theme";
import { hasDatabaseObject } from "@/database/database";
import { useFirebaseUser } from "@/hooks/useFirebaseUser";
import { getFirebaseAuth } from "@/lib/firebase";
import {
  downloadFirebaseBackup,
  getFirebaseBackupMetadata,
  uploadFirebaseBackup,
} from "@/service/firebaseBackup";
import { useDatabaseStore } from "@/stores/databaseStore";
import { signOut } from "firebase/auth";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

/**
 * Formats cloud backup timestamp for display.
 *
 * @param date - Last Firestore backup time, or `null` if never synced.
 * @returns Localized date/time string or `"Never"`.
 */
function formatSyncedAt(date: Date | null): string {
  if (!date) return "Never";
  return date.toLocaleString();
}

/**
 * Cloud sync hub after Firebase authentication (upload/download encrypted backup).
 *
 * @remarks
 * Expo Router file route: `/firebase-logged-in` (`app/firebase-logged-in.tsx`).
 * Requires Firebase sign-in. Download clears local auth and sends user to PIN login.
 *
 * @returns Backup management UI or loading/redirect state.
 */
export default function FirebaseLoggedInScreen() {
  const router = useRouter();
  const { user, loading: authLoading } = useFirebaseUser();
  const clearAuth = useDatabaseStore((s) => s.clearAuth);
  const { theme, resolvedTheme, highContrast } = useTheme();
  const gradientColors = getGradientColors(resolvedTheme, {
    themeMode: theme,
    highContrast,
  });
  const titleColor = primaryTextColor(resolvedTheme, {
    themeMode: theme,
    highContrast,
  });
  const hintColor = secondaryTextColor(resolvedTheme, {
    themeMode: theme,
    highContrast,
  });
  const borderColor = inputBorderColor(resolvedTheme, {
    themeMode: theme,
    highContrast,
  });

  const [cloudUpdatedAt, setCloudUpdatedAt] = useState<Date | null>(null);
  const [metaLoading, setMetaLoading] = useState(true);
  const [hasLocalData, setHasLocalData] = useState(false);
  const [busy, setBusy] = useState<"upload" | "download" | "signout" | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Guard route: unauthenticated Firebase users go back to sign-in.
  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace("/firebase-sign-in" as any);
    }
  }, [authLoading, user, router]);

  const refreshMetadata = useCallback(async () => {
    setMetaLoading(true);
    try {
      const meta = await getFirebaseBackupMetadata();
      setCloudUpdatedAt(meta.updatedAt);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load cloud backup info");
    } finally {
      setMetaLoading(false);
    }
  }, []);

  // On mount, detect local encrypted data and load cloud backup metadata.
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      try {
        const exists = await hasDatabaseObject();
        if (!cancelled) setHasLocalData(exists);
      } catch {
        if (!cancelled) setHasLocalData(false);
      }
      if (!cancelled) await refreshMetadata();
    })();
    return () => {
      cancelled = true;
    };
  }, [user, refreshMetadata]);

  const handleUpload = useCallback(async () => {
    setBusy("upload");
    setError(null);
    try {
      await uploadFirebaseBackup();
      await refreshMetadata();
      Alert.alert("Uploaded", "Your encrypted backup is saved to Firestore.");
    } catch (e) {
      const message = e instanceof Error ? e.message : "Upload failed";
      setError(message);
    } finally {
      setBusy(null);
    }
  }, [refreshMetadata]);

  const runDownload = useCallback(async () => {
    setBusy("download");
    setError(null);
    try {
      const meta = await downloadFirebaseBackup();
      setCloudUpdatedAt(meta.updatedAt);
      clearAuth();
      Alert.alert(
        "Downloaded",
        "Cloud backup restored on this device. Sign in with your PIN to unlock your data.",
        [{ text: "OK", onPress: () => router.replace("/login" as any) }]
      );
    } catch (e) {
      const message = e instanceof Error ? e.message : "Download failed";
      setError(message);
    } finally {
      setBusy(null);
    }
  }, [clearAuth, router]);

  const handleDownload = useCallback(() => {
    Alert.alert(
      "Download from cloud",
      hasLocalData
        ? "This replaces local encrypted data with your Firestore backup. Continue?"
        : "Restore encrypted data from your Firestore backup?",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Download", onPress: () => void runDownload() },
      ]
    );
  }, [hasLocalData, runDownload]);

  const handleSignOut = useCallback(async () => {
    setBusy("signout");
    setError(null);
    try {
      await signOut(getFirebaseAuth());
      router.replace("/firebase-sign-in" as any);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Sign out failed");
    } finally {
      setBusy(null);
    }
  }, [router]);

  if (authLoading || !user) {
    return (
      <LinearGradient colors={[...gradientColors]} style={styles.gradient}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={titleColor} />
        </View>
      </LinearGradient>
    );
  }

  const display = user.email ?? user.uid;
  const anyBusy = busy !== null;

  return (
    <LinearGradient
      colors={[...gradientColors]}
      style={styles.gradient}
      start={{ x: 0.5, y: 0 }}
      end={{ x: 0.5, y: 1 }}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={[styles.title, { color: titleColor }]}>Cloud sync</Text>
        <Text style={[styles.hint, { color: hintColor }]}>
          Signed in as {display}. Backups stay encrypted — only your PIN can
          decrypt them.
        </Text>

        <View style={[styles.card, { borderColor }]}>
          <Text style={[styles.cardLabel, { color: hintColor }]}>
            Last cloud backup
          </Text>
          {metaLoading ? (
            <ActivityIndicator color={titleColor} style={styles.cardSpinner} />
          ) : (
            <Text style={[styles.cardValue, { color: titleColor }]}>
              {formatSyncedAt(cloudUpdatedAt)}
            </Text>
          )}
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Pressable
          style={({ pressed }) => [
            styles.primaryButton,
            (!hasLocalData || anyBusy) && styles.primaryDisabled,
            pressed && hasLocalData && !anyBusy && styles.primaryPressed,
          ]}
          onPress={() => void handleUpload()}
          disabled={!hasLocalData || anyBusy}
        >
          {busy === "upload" ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.primaryButtonText}>Upload to Firestore</Text>
          )}
        </Pressable>
        {!hasLocalData ? (
          <Text style={[styles.note, { color: hintColor }]}>
            Set up the app locally first to upload a backup.
          </Text>
        ) : null}

        <Pressable
          style={({ pressed }) => [
            styles.secondaryButton,
            { borderColor },
            anyBusy && styles.primaryDisabled,
            pressed && !anyBusy && styles.primaryPressed,
          ]}
          onPress={handleDownload}
          disabled={anyBusy}
        >
          {busy === "download" ? (
            <ActivityIndicator color={PRIMARY_BUTTON_BG} />
          ) : (
            <Text style={[styles.secondaryButtonText, { color: PRIMARY_BUTTON_BG }]}>
              Download from Firestore
            </Text>
          )}
        </Pressable>

        <Pressable
          style={({ pressed }) => [
            styles.textButton,
            anyBusy && styles.primaryDisabled,
            pressed && !anyBusy && styles.primaryPressed,
          ]}
          onPress={() => void handleSignOut()}
          disabled={anyBusy}
        >
          {busy === "signout" ? (
            <ActivityIndicator color={hintColor} />
          ) : (
            <Text style={[styles.textButtonLabel, { color: hintColor }]}>
              Sign out of Firebase
            </Text>
          )}
        </Pressable>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  scroll: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 40,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 8,
  },
  hint: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 20,
  },
  card: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  cardLabel: {
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 6,
  },
  cardValue: {
    fontSize: 16,
    fontWeight: "600",
  },
  cardSpinner: { alignSelf: "flex-start" },
  error: {
    color: "#e57373",
    fontSize: 14,
    marginBottom: 12,
  },
  note: {
    fontSize: 13,
    marginTop: 8,
    marginBottom: 8,
    lineHeight: 18,
  },
  primaryButton: {
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: PRIMARY_BUTTON_BG,
    alignItems: "center",
    marginBottom: 12,
  },
  secondaryButton: {
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    marginBottom: 20,
  },
  primaryPressed: { opacity: 0.9 },
  primaryDisabled: { opacity: 0.55 },
  primaryButtonText: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "600",
  },
  secondaryButtonText: {
    fontSize: 17,
    fontWeight: "600",
  },
  textButton: {
    paddingVertical: 12,
    alignItems: "center",
  },
  textButtonLabel: {
    fontSize: 16,
    fontWeight: "600",
  },
});
