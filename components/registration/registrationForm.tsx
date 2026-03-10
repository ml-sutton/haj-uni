import {
  registerPin,
  writeEncryptedDBObject,
  writeSafeDBObject,
} from "@/database/database";
import { useDatabaseStore } from "@/stores/databaseStore";
import { TitleBar } from "@/components/TitleBar";
import { PinStep } from "@/components/registration/pinStep";
import { PreferencesStep } from "@/components/registration/preferencesStep";
import { PronounsStep } from "@/components/registration/pronounsStep";
import type { RegistrationFormData } from "@/components/registration/registrationTypes";
import {
  DEFAULT_REGISTRATION_FORM_DATA,
  PIN_LENGTH,
} from "@/components/registration/registrationTypes";
import { UsernameStep } from "@/components/registration/usernameStep";
import { useTheme } from "@/contexts/theme";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

/** Same as (tabs) top/bottom bar gradient */
const TABS_DARK_GRADIENT = ["#6495ed", "#73c2fb"] as const;
const TABS_LIGHT_GRADIENT = ["#FFA4B6", "#F19CBB"] as const;
const ONBOARDING_DARK_GRADIENT = ["#174A5E", "#333333"] as const;
const ONBOARDING_LIGHT_GRADIENT = ["#F7DAF7", "#EBEBEB"] as const;
const TOP_BAR_HEIGHT = 72;

const STEPS = [
  "username",
  "pronouns",
  "preferences",
  "pin",
  "saving",
  "welcome",
] as const;

type StepId = (typeof STEPS)[number];

const STEP_ORDER: StepId[] = [...STEPS];

export interface RegistrationFormProps {
  onSubmit?: (data: RegistrationFormData) => void | Promise<void>;
}

export function RegistrationForm({
  onSubmit,
}: RegistrationFormProps): React.ReactElement {
  const { resolvedTheme, setTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const tabsGradient = isDark ? TABS_DARK_GRADIENT : TABS_LIGHT_GRADIENT;
  const onboardingGradient = isDark ? ONBOARDING_DARK_GRADIENT : ONBOARDING_LIGHT_GRADIENT;

  const [stepIndex, setStepIndex] = useState(0);
  const [data, setData] = useState<RegistrationFormData>(DEFAULT_REGISTRATION_FORM_DATA);
  const [usernameError, setUsernameError] = useState<string | undefined>();
  const [pinError, setPinError] = useState<string | undefined>();

  // Sync registration theme choice to app theme so the UI updates immediately
  useEffect(() => {
    setTheme(data.safePreferences.theme);
  }, [data.safePreferences.theme, setTheme]);

  const router = useRouter();
  const setDatabaseObject = useDatabaseStore((s) => s.setDatabaseObject);
  const savingStartedRef = useRef(false);

  const stepId = STEP_ORDER[stepIndex];
  const isFirst = stepIndex === 0;
  const isPinStep = stepId === "pin";
  const isSavingStep = stepId === "saving";
  const isWelcomeStep = stepId === "welcome";

  const updateData = useCallback((patch: Partial<RegistrationFormData>) => {
    setData((prev) => ({ ...prev, ...patch }));
  }, []);

  const validateUsername = useCallback((): boolean => {
    const t = data.username.trim();
    if (t.length === 0) {
      setUsernameError("Username is required");
      return false;
    }
    setUsernameError(undefined);
    return true;
  }, [data.username]);

  const validatePin = useCallback((): boolean => {
    if (data.pin.length !== PIN_LENGTH) {
      setPinError(`Enter a ${PIN_LENGTH}-digit PIN`);
      return false;
    }
    setPinError(undefined);
    return true;
  }, [data.pin]);

  const saveToDatabase = useCallback(
    async (formData: RegistrationFormData) => {
      const key = await registerPin(formData.pin);
      await writeSafeDBObject(formData.safePreferences);
      const user = {
        username: formData.username.trim(),
        pronouns: formData.pronouns,
        doses: [],
        preferences: formData.securePreferences,
      };
      await writeEncryptedDBObject(user, key);
      setDatabaseObject({
        user,
        safePreferences: formData.safePreferences,
      });
    },
    [setDatabaseObject]
  );

  useEffect(() => {
    if (stepId !== "saving" || savingStartedRef.current) return;
    savingStartedRef.current = true;
    saveToDatabase(data)
      .then(() => {
        onSubmit?.(data);
        setStepIndex((i) => Math.min(i + 1, STEP_ORDER.length - 1));
      })
      .catch(() => {
        savingStartedRef.current = false;
        setStepIndex(STEP_ORDER.indexOf("pin"));
      });
  }, [stepId, data, saveToDatabase, onSubmit]);

  const goNext = useCallback(() => {
    if (stepId === "username" && !validateUsername()) return;
    if (stepId === "pin" && !validatePin()) return;
    if (isPinStep) {
      setStepIndex((i) => Math.min(i + 1, STEP_ORDER.length - 1));
      return;
    }
    if (!isWelcomeStep && !isSavingStep) {
      setStepIndex((i) => Math.min(i + 1, STEP_ORDER.length - 1));
    }
  }, [stepId, isPinStep, isWelcomeStep, isSavingStep, validateUsername, validatePin]);

  const goBack = useCallback(() => {
    setStepIndex((i) => Math.max(i - 1, 0));
    setUsernameError(undefined);
    setPinError(undefined);
  }, []);

  const progressTextColor = isDark ? "rgba(255,255,255,0.95)" : "#444";
  const progressTrackColor = isDark ? "rgba(255,255,255,0.25)" : "rgba(0,0,0,0.12)";
  const footerBorderColor = isDark ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.08)";
  const buttonSecondaryBg = isDark ? "rgba(255,255,255,0.2)" : "#f0f0f0";
  const buttonSecondaryTextColor = isDark ? "#fff" : "#1a1a1a";

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 24 : 0}
    >
      <TitleBar title="HAJ | Registration" />
      <View style={styles.middleWrap}>
        <LinearGradient
          colors={[...onboardingGradient]}
          style={StyleSheet.absoluteFill}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
        />
        <View style={[styles.stepBar, { zIndex: 1 }]}>
          <Text style={[styles.progressText, { color: progressTextColor }]}>
            {isSavingStep
              ? "Creating your account…"
              : `Step ${stepIndex + 1} of ${STEP_ORDER.length}`}
          </Text>
          <View style={[styles.progressBarTrack, { backgroundColor: progressTrackColor }]}>
            <View
              style={[
                styles.progressBarFill,
                { width: `${((stepIndex + 1) / STEP_ORDER.length) * 100}%` },
              ]}
            />
          </View>
        </View>
        <ScrollView
          style={[styles.scroll, { zIndex: 0 }]}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {stepId === "username" && (
            <UsernameStep
              value={data.username}
              onChange={(username) => updateData({ username })}
              error={usernameError}
            />
          )}
          {stepId === "pronouns" && (
            <PronounsStep
              value={data.pronouns}
              onChange={(pronouns) => updateData({ pronouns })}
            />
          )}
          {stepId === "preferences" && (
            <PreferencesStep
              safePreferences={data.safePreferences}
              securePreferences={data.securePreferences}
              onSafeChange={(safePreferences) => updateData({ safePreferences })}
              onSecureChange={(securePreferences) => updateData({ securePreferences })}
            />
          )}
          {stepId === "pin" && (
            <PinStep
              value={data.pin}
              onChange={(pin) => updateData({ pin })}
              error={pinError}
            />
          )}
          {stepId === "saving" && (
            <View style={styles.savingWrap}>
              <ActivityIndicator size="large" color="#0066cc" />
              <Text style={[styles.savingText, { color: progressTextColor }]}>
                Saving your account…
              </Text>
            </View>
          )}
          {stepId === "welcome" && (
            <View style={styles.welcomeWrap}>
              <Text style={[styles.welcomeTitle, { color: progressTextColor }]}>
                Welcome {data.username.trim() || "there"},
              </Text>
              <Text style={[styles.welcomeSubtitle, { color: progressTextColor }]}>
                Get ready to enter the world of cool shark facts!
              </Text>
            </View>
          )}
        </ScrollView>
      </View>

      <LinearGradient
        colors={[...tabsGradient]}
        style={styles.footerGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        <View style={[styles.footer, { borderTopColor: footerBorderColor }]}>
          {isSavingStep ? null : isWelcomeStep ? (
            <Pressable
              style={({ pressed }) => [styles.button, styles.buttonPrimary, pressed && styles.buttonPressed]}
              onPress={() => router.push("/login")}
            >
              <Text style={styles.buttonPrimaryText}>Sign in</Text>
            </Pressable>
          ) : (
            <>
              {!isFirst ? (
                <Pressable
                  style={({ pressed }) => [
                    styles.button,
                    { backgroundColor: buttonSecondaryBg },
                    pressed && styles.buttonPressed,
                  ]}
                  onPress={goBack}
                >
                  <Text style={[styles.buttonSecondaryText, { color: buttonSecondaryTextColor }]}>
                    Back
                  </Text>
                </Pressable>
              ) : (
                <View style={styles.button} />
              )}
              <Pressable
                style={({ pressed }) => [styles.button, styles.buttonPrimary, pressed && styles.buttonPressed]}
                onPress={goNext}
              >
                <Text style={styles.buttonPrimaryText}>
                  {isPinStep ? "Create account" : "Next"}
                </Text>
              </Pressable>
            </>
          )}
        </View>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  stepBar: {
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 16,
    minHeight: TOP_BAR_HEIGHT,
    height: TOP_BAR_HEIGHT,
    justifyContent: "center",
    flexShrink: 0,
    backgroundColor: "transparent",
  },
  progressText: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 8,
  },
  progressBarTrack: {
    height: 6,
    borderRadius: 3,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: "#0066cc",
    borderRadius: 3,
  },
  savingWrap: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 48,
    gap: 16,
  },
  savingText: {
    fontSize: 16,
    fontWeight: "500",
  },
  welcomeWrap: {
    paddingVertical: 24,
    alignItems: "center",
  },
  welcomeTitle: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 12,
    textAlign: "center",
  },
  welcomeSubtitle: {
    fontSize: 17,
    lineHeight: 24,
    textAlign: "center",
    opacity: 0.95,
  },
  middleWrap: {
    flex: 1,
    position: "relative",
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  footerGradient: {
    paddingBottom: 32,
  },
  footer: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonPrimary: {
    backgroundColor: "#0066cc",
  },
  buttonPressed: {
    opacity: 0.8,
  },
  buttonPrimaryText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
  buttonSecondaryText: {
    fontSize: 16,
    fontWeight: "600",
  },
});
