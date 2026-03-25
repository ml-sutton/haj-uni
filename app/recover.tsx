import {
  useTheme,
  getGradientColors,
  primaryTextColor,
  secondaryTextColor,
  PRIMARY_BUTTON_BG,
} from "@/contexts/theme";
import { PinStep } from "@/components/registration/pinStep";
import { PIN_LENGTH } from "@/components/registration/registrationTypes";
import {
  hasRecoveryEnabled,
  recoverAccountWithMnemonic,
} from "@/database/database";
import {
  normalizeMnemonicPhrase,
  isValidMnemonicPhrase,
} from "@/service/mnemonicCrypto";
import { useDatabaseStore } from "@/stores/databaseStore";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

type RecoverStep = "phrase" | "pin" | "confirm";

export default function RecoverScreen() {
  const router = useRouter();
  const { resolvedTheme } = useTheme();
  const gradientColors = getGradientColors(resolvedTheme);
  const labelColor = primaryTextColor(resolvedTheme);
  const hintColor = secondaryTextColor(resolvedTheme);

  const [recoveryAvailable, setRecoveryAvailable] = useState<boolean | null>(
    null
  );
  const [step, setStep] = useState<RecoverStep>("phrase");
  const [phraseInput, setPhraseInput] = useState("");
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [pinError, setPinError] = useState<string | undefined>();
  const [phraseError, setPhraseError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const setEncryptionKey = useDatabaseStore((s) => s.setEncryptionKey);
  const setUser = useDatabaseStore((s) => s.setUser);
  const setIsAuthed = useDatabaseStore((s) => s.setIsAuthed);

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

  const handlePhraseContinue = useCallback(() => {
    setPhraseError(null);
    const n = normalizeMnemonicPhrase(phraseInput);
    if (!isValidMnemonicPhrase(n)) {
      setPhraseError("Enter a valid 24-word recovery phrase.");
      return;
    }
    setStep("pin");
  }, [phraseInput]);

  const handlePinContinue = useCallback(() => {
    setPinError(undefined);
    if (pin.length !== PIN_LENGTH) {
      setPinError(`Enter a ${PIN_LENGTH}-digit PIN`);
      return;
    }
    setStep("confirm");
  }, [pin]);

  const handleComplete = useCallback(async () => {
    setPinError(undefined);
    if (confirmPin.length !== PIN_LENGTH) {
      setPinError(`Enter a ${PIN_LENGTH}-digit PIN`);
      return;
    }
    if (confirmPin !== pin) {
      setPinError("PINs do not match");
      return;
    }
    setLoading(true);
    setPhraseError(null);
    try {
      const normalized = normalizeMnemonicPhrase(phraseInput);
      const { masterKey, user } = await recoverAccountWithMnemonic(
        normalized,
        pin
      );
      setEncryptionKey(masterKey);
      setUser(user);
      setIsAuthed(true);
      router.replace("/(tabs)");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Recovery failed";
      setPhraseError(msg);
      setStep("phrase");
      setPin("");
      setConfirmPin("");
    } finally {
      setLoading(false);
    }
  }, [
    phraseInput,
    pin,
    confirmPin,
    setEncryptionKey,
    setUser,
    setIsAuthed,
    router,
  ]);

  if (recoveryAvailable === null) {
    return (
      <LinearGradient colors={[...gradientColors]} style={styles.gradient}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={PRIMARY_BUTTON_BG} />
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient
      colors={[...gradientColors]}
      style={styles.gradient}
      start={{ x: 0.5, y: 0 }}
      end={{ x: 0.5, y: 1 }}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Pressable
          style={({ pressed }) => [styles.backRow, pressed && { opacity: 0.7 }]}
          onPress={() => {
            if (step === "phrase") router.back();
            else if (step === "pin") setStep("phrase");
            else setStep("pin");
          }}
        >
          <Ionicons name="chevron-back" size={24} color={labelColor} />
          <Text style={[styles.backLabel, { color: labelColor }]}>Back</Text>
        </Pressable>

        <Text style={[styles.title, { color: labelColor }]}>
          Recover account
        </Text>
        <Text style={[styles.hint, { color: hintColor }]}>
          Use your 24-word recovery phrase to unlock your data and set a new
          PIN. Your phrase is never saved on the device.
        </Text>

        {!recoveryAvailable ? (
          <View style={styles.warnBox}>
            <Text style={styles.warnText}>
              This account was created without a recovery phrase. Recovery is
              not available.
            </Text>
          </View>
        ) : null}

        {step === "phrase" && recoveryAvailable ? (
          <View style={styles.section}>
            <Text style={[styles.label, { color: labelColor }]}>
              Recovery phrase
            </Text>
            <TextInput
              style={[
                styles.phraseInput,
                {
                  color: labelColor,
                  borderColor: hintColor,
                  backgroundColor:
                    resolvedTheme === "dark"
                      ? "rgba(255,255,255,0.06)"
                      : "rgba(255,255,255,0.9)",
                },
              ]}
              value={phraseInput}
              onChangeText={(t) => {
                setPhraseInput(t);
                setPhraseError(null);
              }}
              placeholder="Enter all 24 words in order"
              placeholderTextColor={hintColor}
              multiline
              autoCapitalize="none"
              autoCorrect={false}
              editable={!loading}
            />
            {phraseError ? (
              <Text style={styles.error}>{phraseError}</Text>
            ) : null}
            <Pressable
              style={({ pressed }) => [
                styles.button,
                pressed && styles.buttonPressed,
                loading && styles.buttonDisabled,
              ]}
              onPress={handlePhraseContinue}
              disabled={loading}
            >
              <Text style={styles.buttonText}>Continue</Text>
            </Pressable>
          </View>
        ) : null}

        {step === "pin" && recoveryAvailable ? (
          <View style={styles.section}>
            <PinStep
              value={pin}
              onChange={(p) => {
                setPin(p);
                setPinError(undefined);
              }}
              error={pinError}
              label="New 6-digit PIN"
              hint="This replaces your previous PIN. It is not stored as plain text."
            />
            <Pressable
              style={({ pressed }) => [
                styles.button,
                pressed && styles.buttonPressed,
                loading && styles.buttonDisabled,
              ]}
              onPress={handlePinContinue}
              disabled={loading}
            >
              <Text style={styles.buttonText}>Continue</Text>
            </Pressable>
          </View>
        ) : null}

        {step === "confirm" && recoveryAvailable ? (
          <View style={styles.section}>
            <PinStep
              value={confirmPin}
              onChange={(p) => {
                setConfirmPin(p);
                setPinError(undefined);
              }}
              error={pinError}
              label="Confirm new PIN"
              hint="Enter the same 6 digits again."
            />
            <Pressable
              style={({ pressed }) => [
                styles.button,
                pressed && styles.buttonPressed,
                (!confirmPin || confirmPin.length !== PIN_LENGTH || loading) &&
                  styles.buttonDisabled,
              ]}
              onPress={handleComplete}
              disabled={
                !confirmPin ||
                confirmPin.length !== PIN_LENGTH ||
                loading
              }
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Complete recovery</Text>
              )}
            </Pressable>
          </View>
        ) : null}
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 40,
    paddingTop: 8,
  },
  backRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 16,
    alignSelf: "flex-start",
  },
  backLabel: { fontSize: 17, fontWeight: "500" },
  title: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 8,
  },
  hint: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 20,
  },
  warnBox: {
    backgroundColor: "rgba(229, 115, 115, 0.2)",
    borderRadius: 10,
    padding: 14,
    marginBottom: 16,
  },
  warnText: {
    fontSize: 15,
    lineHeight: 21,
    color: "#c62828",
  },
  section: { marginBottom: 8 },
  label: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
  },
  phraseInput: {
    minHeight: 120,
    borderWidth: 1,
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
    textAlignVertical: "top",
    marginBottom: 12,
  },
  error: {
    fontSize: 14,
    color: "#e57373",
    marginBottom: 12,
  },
  button: {
    marginTop: 8,
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: PRIMARY_BUTTON_BG,
    alignItems: "center",
  },
  buttonPressed: { opacity: 0.88 },
  buttonDisabled: { opacity: 0.5 },
  buttonText: {
    fontSize: 17,
    fontWeight: "600",
    color: "#fff",
  },
});
