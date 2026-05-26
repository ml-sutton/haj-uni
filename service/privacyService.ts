import { clearAllData, writeSafeDBObject } from "@/database/database";
import { clearAuthPolicyState, resetFailedPinAttempts } from "@/service/authPolicyStore";
import { persistStoreToDatabase } from "@/stores/databaseStore";
import { useDatabaseStore } from "@/stores/databaseStore";
import { getSafePreferences } from "@/stores/safePreferencesStore";
import { useSafePreferencesStore } from "@/stores/safePreferencesStore";
import { BackHandler, Platform } from "react-native";

/** Whether discrete mode is on (e.g. for discrete notifications). */
export function isDiscreteMode(): boolean {
  return getSafePreferences().discreteMode;
}

/** Whether quick exit is enabled (caller may hide app / show cover screen). */
export function isQuickExitEnabled(): boolean {
  return getSafePreferences().quickExitEnabled;
}

/**
 * Saves both stores to DB (safe prefs + encrypted user), then clears both
 * stores (clearAuth + resetToDefaults). Call before navigating to login.
 */
export async function runQuickExit(): Promise<void> {
  const prefs = getSafePreferences();
  await writeSafeDBObject(prefs);
  await persistStoreToDatabase();
  await resetFailedPinAttempts();
  useDatabaseStore.getState().clearAuth();
  useSafePreferencesStore.getState().resetToDefaults();
}

/**
 * If quick exit is enabled, saves both stores to DB, clears both stores,
 * then runs the given callback (e.g. navigate to login). Call from a gesture
 * or header so the user can quickly hide sensitive content.
 * @param onExit - e.g. () => router.replace("/login")
 * @returns true if quick exit was enabled and ran, false otherwise.
 */
export async function triggerQuickExit(onExit: () => void): Promise<boolean> {
  if (!isQuickExitEnabled()) return false;
  await runQuickExit();
  onExit();
  return true;
}

/** Force-close the app (Android) or crash (iOS) after hiding sensitive UI. */
export function panicExitApp(): void {
  if (Platform.OS === "web") return;
  if (Platform.OS === "android") BackHandler.exitApp();
  if (Platform.OS === "ios") throw new Error("Panic: user-initiated crash");
}

/**
 * Quick exit when enabled, then force-close the app (long-press / gyro panic).
 * If quick exit is off, still panics without saving.
 */
export async function performQuickExitWithPanic(onExit: () => void): Promise<void> {
  await triggerQuickExit(onExit);
  panicExitApp();
}

/** Whether self-destruct is enabled (failed PIN attempts wipe data). */
export function isSelfDestructEnabled(): boolean {
  return getSafePreferences().selfDestructEnabled;
}

/** Whether silent mode is on. */
export function isSilentMode(): boolean {
  return getSafePreferences().silentMode;
}

/** Whether notifications are enabled. */
export function areNotificationsEnabled(): boolean {
  return getSafePreferences().notificationsEnabled;
}

/** Whether biometric login is enabled. */
export function isBiometricEnabled(): boolean {
  return getSafePreferences().biometricEnabled;
}

/**
 * Permanently wipe all app data (encrypted user, salt, safe prefs) and reset
 * the safe preferences store. Caller must clear auth state and navigate to
 * get started (e.g. clearAuth(); router.replace("/getStarted")).
 */
export async function runSelfDestruct(): Promise<void> {
  await clearAllData();
  await clearAuthPolicyState();
  useSafePreferencesStore.getState().resetToDefaults();
}
