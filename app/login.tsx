import {
  useTheme,
  getGradientColors,
  primaryTextColor,
  secondaryTextColor,
  PRIMARY_BUTTON_BG,
} from "@/contexts/theme";
import { hasRecoveryEnabled, login, readEncryptedDBObject, readSafeDBObject } from "@/database/database";
import {
  getBiometricUnlockLabel,
  getEncryptionKeyWithBiometrics,
  isBiometricUnlockAvailable,
  isNativeBiometricPlatform,
  refreshBiometricEncryptionKeyIfEnabled,
  removeStoredEncryptionKey,
} from "@/service/biometricKeyStore";
import {
  getSelfDestructAfterFailedAttempts,
  recordFailedPinAttempt,
  resetFailedPinAttempts,
  setSelfDestructAfterFailedAttempts,
} from "@/service/authPolicyStore";
import { runSelfDestruct } from "@/service/privacyService";
import { useNavigation, useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useDatabaseStore } from "@/stores/databaseStore";

const PIN_LENGTH = 6;
const DIGITS = Array.from({ length: PIN_LENGTH }, (_, i) => i);

/**
 * PIN unlock screen with optional biometric unlock and account recovery links.
 *
 * @remarks
 * Expo Router file route: `/login` (`app/login.tsx`). Blocks back navigation until
 * unlock succeeds. Records failed PIN attempts and may trigger self-destruct when
 * enabled. Redirects to `/` on success.
 *
 * @returns The login screen UI.
 */
export default function Login() {
  const router = useRouter();
  const navigation = useNavigation();
  const { theme, resolvedTheme, highContrast } = useTheme();
  const isDark = resolvedTheme === "dark";
  const gradientColors = getGradientColors(resolvedTheme, {
    themeMode: theme,
    highContrast,
  });
  const labelColor = primaryTextColor(resolvedTheme, {
    themeMode: theme,
    highContrast,
  });
  const hintColor = secondaryTextColor(resolvedTheme, {
    themeMode: theme,
    highContrast,
  });

  // Prevent leaving login via gesture/back until unlock completes or self-destruct redirects.
  useEffect(() => {
    const unsubscribe = navigation.addListener("beforeRemove", (e) => {
      if (!allowingRemoveRef.current) e.preventDefault();
    });
    return unsubscribe;
  }, [navigation]);

  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [bioLoading, setBioLoading] = useState(false);
  const [recoveryAvailable, setRecoveryAvailable] = useState(false);
  const [showBiometricUnlock, setShowBiometricUnlock] = useState(false);
  const [showWebBiometricHint, setShowWebBiometricHint] = useState(false);
  const [biometricLabel, setBiometricLabel] = useState("Biometrics");
  const inputRef = useRef<TextInput>(null);
  const allowingRemoveRef = useRef(false);
  const biometricEnabledRef = useRef(false);
  const didAutoBiometricRef = useRef(false);

  // Load whether mnemonic recovery is configured for this device.
  useEffect(() => {
    let cancelled = false;
    hasRecoveryEnabled()
      .then((ok) => {
        if (!cancelled) setRecoveryAvailable(ok);
      })
      .catch(() => {
        if (!cancelled) setRecoveryAvailable(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const setEncryptionKey = useDatabaseStore((s) => s.setEncryptionKey);
  const setUser = useDatabaseStore((s) => s.setUser);
  const setIsAuthed = useDatabaseStore((s) => s.setIsAuthed);
  const clearAuth = useDatabaseStore((s) => s.clearAuth);
  const selfDestructEnabledRef = useRef(false);
  const selfDestructAfterRef = useRef(5);

  const dotBorderDefault = isDark ? "rgba(255,255,255,0.35)" : "#ccc";
  const dotBg = isDark ? "rgba(255,255,255,0.1)" : "#fff";
  const dotFocusedBg = isDark ? "rgba(0,102,204,0.2)" : "rgba(0,102,204,0.05)";
  const dotTextColor = labelColor;

  const digits = pin.padEnd(PIN_LENGTH, " ").split("");
  const canSubmit = pin.length === PIN_LENGTH;

  // Read safe prefs to decide biometric UI, self-destruct thresholds, and web hints.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const safe = await readSafeDBObject();
        if (cancelled) return;
        biometricEnabledRef.current = safe.biometricEnabled;
        selfDestructEnabledRef.current = safe.selfDestructEnabled;
        selfDestructAfterRef.current = await getSelfDestructAfterFailedAttempts();
        if (Platform.OS === "web" && safe.biometricEnabled) {
          setShowWebBiometricHint(true);
        }
        if (!safe.biometricEnabled || !isNativeBiometricPlatform()) {
          setShowBiometricUnlock(false);
          return;
        }
        const available = await isBiometricUnlockAvailable();
        if (cancelled) return;
        const label = await getBiometricUnlockLabel();
        if (cancelled) return;
        setBiometricLabel(label);
        setShowBiometricUnlock(available);
      } catch {
        if (!cancelled) setShowBiometricUnlock(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  /**
   * Decrypts user data with the derived key and navigates into the app.
   *
   * @param key - Master encryption key from PIN or biometrics.
   */
  const completeUnlock = useCallback(
    async (key: string) => {
      const user = await readEncryptedDBObject(key);
      setEncryptionKey(key);
      setUser(user);
      setIsAuthed(true);
      await setSelfDestructAfterFailedAttempts(
        user.preferences.selfDestructAfterFailedAttempts
      );
      await resetFailedPinAttempts();
      await refreshBiometricEncryptionKeyIfEnabled(
        key,
        biometricEnabledRef.current
      );
      allowingRemoveRef.current = true;
      router.replace("/");
    },
    [setEncryptionKey, setUser, setIsAuthed, router]
  );

  // Attempt biometric unlock once when native biometrics are available.
  useEffect(() => {
    if (!showBiometricUnlock || loading || didAutoBiometricRef.current) return;
    didAutoBiometricRef.current = true;
    let cancelled = false;
    (async () => {
      setBioLoading(true);
      try {
        const key = await getEncryptionKeyWithBiometrics();
        if (cancelled || !key) return;
        await completeUnlock(key);
      } catch {
        // User cancelled or key invalid; PIN remains available
      } finally {
        if (!cancelled) setBioLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [showBiometricUnlock, loading, completeUnlock]);

  const handleChangeText = useCallback((text: string) => {
    const digitsOnly = text.replace(/\D/g, "").slice(0, PIN_LENGTH);
    setPin(digitsOnly);
    setError(null);
  }, []);

  const handleBiometricPress = useCallback(async () => {
    if (bioLoading || loading) return;
    setBioLoading(true);
    setError(null);
    try {
      const key = await getEncryptionKeyWithBiometrics();
      if (!key) {
        setError(`Could not unlock with ${biometricLabel}. Use your PIN.`);
        return;
      }
      try {
        await completeUnlock(key);
      } catch {
        await removeStoredEncryptionKey();
        setError(
          "Stored biometric key no longer matches your data. Use your PIN."
        );
      }
    } catch (e) {
      setError(
        e instanceof Error ? e.message : `${biometricLabel} unlock failed`
      );
    } finally {
      setBioLoading(false);
    }
  }, [bioLoading, loading, biometricLabel, completeUnlock]);

  const handleSubmit = useCallback(async () => {
    if (!canSubmit || loading) return;
    setLoading(true);
    setError(null);
    try {
      const key = await login(pin);
      await completeUnlock(key);
    } catch (e) {
      const message = e instanceof Error ? e.message : "Invalid PIN";
      if (message === "Invalid PIN") {
        const failedAttempts = await recordFailedPinAttempt();
        const shouldSelfDestruct =
          selfDestructEnabledRef.current &&
          failedAttempts >= selfDestructAfterRef.current;
        if (shouldSelfDestruct) {
          await runSelfDestruct();
          clearAuth();
          allowingRemoveRef.current = true;
          router.replace("/getStarted");
          return;
        }
      }
      setError(message);
      setPin("");
    } finally {
      setLoading(false);
    }
  }, [pin, canSubmit, loading, completeUnlock, clearAuth, router]);

  const busy = loading || bioLoading;

  return (
    <LinearGradient
      colors={[...gradientColors]}
      style={styles.gradient}
      start={{ x: 0.5, y: 0 }}
      end={{ x: 0.5, y: 1 }}
    >
      <View style={styles.container}>
        <Image
          source={require("@/assets/images/hajapp-icon.png")}
          style={styles.appIcon}
          accessibilityLabel="App icon"
        />
        <Text style={[styles.welcome, { color: labelColor }]}>
          Welcome back
        </Text>
        <Text style={[styles.hint, { color: hintColor }]}>
          Enter your PIN to continue
        </Text>

        {showWebBiometricHint ? (
          <Text style={[styles.webBiometricHint, { color: hintColor }]}>
            Biometric login is not available on web. Use your PIN.
          </Text>
        ) : null}

        <View style={styles.pinSection}>
          <TextInput
            ref={inputRef}
            style={styles.hiddenInput}
            value={pin}
            onChangeText={handleChangeText}
            keyboardType="number-pad"
            maxLength={PIN_LENGTH}
            autoComplete="off"
            editable={!busy}
            accessibilityLabel="6-digit PIN"
          />
          <Pressable
            style={styles.dotsRow}
            onPress={() => inputRef.current?.focus()}
            disabled={busy}
          >
            {DIGITS.map((index) => {
              const filled = digits[index] !== " ";
              const focused = pin.length === index;
              return (
                <View
                  key={index}
                  style={[
                    styles.dotWrap,
                    {
                      borderColor:
                        filled || focused ? "#0066cc" : dotBorderDefault,
                      backgroundColor: focused ? dotFocusedBg : dotBg,
                    },
                  ]}
                >
                  <Text style={[styles.dotText, { color: dotTextColor }]}>
                    {filled ? "•" : ""}
                  </Text>
                </View>
              );
            })}
          </Pressable>
          {error ? (
            <Text style={styles.error}>{error}</Text>
          ) : null}
        </View>

        <Pressable
          style={({ pressed }) => [
            styles.button,
            (!canSubmit || busy) && styles.buttonDisabled,
            pressed && canSubmit && !busy && styles.buttonPressed,
          ]}
          onPress={handleSubmit}
          disabled={!canSubmit || busy}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Log in</Text>
          )}
        </Pressable>

        {showBiometricUnlock ? (
          <Pressable
            style={({ pressed }) => [
              styles.biometricButton,
              { borderColor: isDark ? "rgba(255,255,255,0.4)" : "#0066cc" },
              busy && styles.buttonDisabled,
              pressed && !busy && styles.biometricButtonPressed,
            ]}
            onPress={handleBiometricPress}
            disabled={busy}
            accessibilityLabel={`Unlock with ${biometricLabel}`}
          >
            {bioLoading ? (
              <ActivityIndicator color={labelColor} />
            ) : (
              <Text style={[styles.biometricButtonText, { color: labelColor }]}>
                Use {biometricLabel}
              </Text>
            )}
          </Pressable>
        ) : null}

        <Pressable
          style={({ pressed }) => [
            styles.firebaseRow,
            { borderColor: isDark ? "rgba(255,255,255,0.4)" : PRIMARY_BUTTON_BG },
            pressed && !busy && styles.firebaseRowPressed,
            busy && styles.buttonDisabled,
          ]}
          onPress={() => router.push("/firebase-sign-in" as any)}
          disabled={busy}
          accessibilityRole="button"
          accessibilityLabel="Pull from Firebase"
        >
          <Text style={[styles.firebaseRowText, { color: labelColor }]}>
            Pull from firebase
          </Text>
        </Pressable>

        {recoveryAvailable ? (
          <Pressable
            style={({ pressed }) => [styles.recoverRow, pressed && { opacity: 0.75 }]}
            onPress={() => router.push("/recover" as any)}
            accessibilityRole="button"
            accessibilityLabel="Recover account with recovery phrase"
          >
            <Ionicons name="key-outline" size={20} color={PRIMARY_BUTTON_BG} />
            <Text style={[styles.recoverLabel, { color: PRIMARY_BUTTON_BG }]}>
              Forgot PIN? Recover with phrase
            </Text>
          </Pressable>
        ) : null}
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  appIcon: {
    width: 100,
    height: 100,
    borderRadius: 100,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  welcome: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 8,
    textAlign: "center",
  },
  hint: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 32,
  },
  webBiometricHint: {
    fontSize: 14,
    textAlign: "center",
    marginBottom: 16,
    marginTop: -16,
    paddingHorizontal: 8,
  },
  pinSection: {
    width: "100%",
    marginBottom: 28,
    alignItems: "center",
  },
  hiddenInput: {
    position: "absolute",
    width: 1,
    height: 1,
    opacity: 0,
    left: -9999,
  },
  dotsRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 10,
  },
  dotWrap: {
    width: 42,
    height: 50,
    borderRadius: 8,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  dotText: {
    fontSize: 22,
  },
  error: {
    marginTop: 14,
    fontSize: 14,
    color: "#e57373",
    textAlign: "center",
  },
  button: {
    paddingVertical: 16,
    paddingHorizontal: 48,
    borderRadius: 12,
    backgroundColor: PRIMARY_BUTTON_BG,
    minWidth: 160,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 6,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonPressed: {
    opacity: 0.85,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#fff",
  },
  biometricButton: {
    marginTop: 16,
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
    borderWidth: 2,
    minWidth: 200,
    alignItems: "center",
    justifyContent: "center",
  },
  biometricButtonPressed: {
    opacity: 0.85,
  },
  biometricButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  firebaseRow: {
    marginTop: 20,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    borderWidth: 2,
    minWidth: 200,
    alignItems: "center",
    justifyContent: "center",
  },
  firebaseRowPressed: {
    opacity: 0.85,
  },
  firebaseRowText: {
    fontSize: 16,
    fontWeight: "600",
  },
  recoverRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 24,
    paddingVertical: 8,
  },
  recoverLabel: {
    fontSize: 16,
    fontWeight: "600",
  },
});
