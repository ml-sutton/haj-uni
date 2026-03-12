import {
  useTheme,
  getGradientColors,
  primaryTextColor,
  secondaryTextColor,
  PRIMARY_BUTTON_BG,
} from "@/contexts/theme";
import { login, readEncryptedDBObject } from "@/database/database";
import { useNavigation, useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useDatabaseStore } from "@/stores/databaseStore";

const PIN_LENGTH = 6;
const DIGITS = Array.from({ length: PIN_LENGTH }, (_, i) => i);

export default function Login() {
  const router = useRouter();
  const navigation = useNavigation();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const gradientColors = getGradientColors(resolvedTheme);
  const labelColor = primaryTextColor(resolvedTheme);
  const hintColor = secondaryTextColor(resolvedTheme);

  useEffect(() => {
    const unsubscribe = navigation.addListener("beforeRemove", (e) => {
      if (!allowingRemoveRef.current) e.preventDefault();
    });
    return unsubscribe;
  }, [navigation]);

  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<TextInput>(null);
  const allowingRemoveRef = useRef(false);

  const setEncryptionKey = useDatabaseStore((s) => s.setEncryptionKey);
  const setUser = useDatabaseStore((s) => s.setUser);
  const setIsAuthed = useDatabaseStore((s) => s.setIsAuthed);

  const dotBorderDefault = isDark ? "rgba(255,255,255,0.35)" : "#ccc";
  const dotBg = isDark ? "rgba(255,255,255,0.1)" : "#fff";
  const dotFocusedBg = isDark ? "rgba(0,102,204,0.2)" : "rgba(0,102,204,0.05)";
  const dotTextColor = labelColor;

  const digits = pin.padEnd(PIN_LENGTH, " ").split("");
  const canSubmit = pin.length === PIN_LENGTH;

  const handleChangeText = useCallback((text: string) => {
    const digitsOnly = text.replace(/\D/g, "").slice(0, PIN_LENGTH);
    setPin(digitsOnly);
    setError(null);
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!canSubmit || loading) return;
    setLoading(true);
    setError(null);
    try {
      const key = await login(pin);
      const user = await readEncryptedDBObject(key);
      setEncryptionKey(key);
      setUser(user);
      setIsAuthed(true);
      allowingRemoveRef.current = true;
      router.replace("/(tabs)");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Invalid PIN");
      setPin("");
    } finally {
      setLoading(false);
    }
  }, [pin, canSubmit, loading, setEncryptionKey, setUser, setIsAuthed, router]);

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

        <View style={styles.pinSection}>
          <TextInput
            ref={inputRef}
            style={styles.hiddenInput}
            value={pin}
            onChangeText={handleChangeText}
            keyboardType="number-pad"
            maxLength={PIN_LENGTH}
            autoComplete="off"
            editable={!loading}
            accessibilityLabel="6-digit PIN"
          />
          <Pressable
            style={styles.dotsRow}
            onPress={() => inputRef.current?.focus()}
            disabled={loading}
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
                      borderColor: filled || focused ? "#0066cc" : dotBorderDefault,
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
            (!canSubmit || loading) && styles.buttonDisabled,
            pressed && canSubmit && !loading && styles.buttonPressed,
          ]}
          onPress={handleSubmit}
          disabled={!canSubmit || loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Log in</Text>
          )}
        </Pressable>
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
});
