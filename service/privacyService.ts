import { clearAllData, writeSafeDBObject } from "@/database/database";
import { clearAuthPolicyState, resetFailedPinAttempts } from "@/service/authPolicyStore";
import { persistStoreToDatabase } from "@/stores/databaseStore";
import { useDatabaseStore } from "@/stores/databaseStore";
import { getSafePreferences } from "@/stores/safePreferencesStore";
import { useSafePreferencesStore } from "@/stores/safePreferencesStore";
import { BackHandler, Platform } from "react-native";

/**
 * Whether discrete mode is enabled (e.g. generic notification copy instead of medication-specific text).
 *
 * @returns Current value from the safe preferences store.
 */
export function isDiscreteMode(): boolean {
  return getSafePreferences().discreteMode;
}

/**
 * Whether quick exit is enabled (gesture/header can hide sensitive UI and return to login).
 *
 * @returns Current value from the safe preferences store.
 */
export function isQuickExitEnabled(): boolean {
  return getSafePreferences().quickExitEnabled;
}

/**
 * Persists in-memory state, then clears session and preference stores without destroying local DB files.
 *
 * @returns Resolves after safe prefs and encrypted user are flushed and stores are reset.
 * @remarks **Privacy:** Writes current data to disk before clearing memory—use when the user wants to hide the app quickly, not wipe data. Caller should navigate to login after this resolves.
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
 * Runs quick exit when enabled, then invokes a navigation callback.
 *
 * @param onExit - Called after state is saved and cleared (e.g. `() => router.replace("/login")`).
 * @returns `true` if quick exit ran; `false` if the feature is disabled.
 */
export async function triggerQuickExit(onExit: () => void): Promise<boolean> {
  if (!isQuickExitEnabled()) return false;
  await runQuickExit();
  onExit();
  return true;
}

/**
 * Force-closes the app after sensitive UI should already be hidden.
 *
 * @remarks **Privacy:** On Android calls `BackHandler.exitApp()`; on iOS throws to crash the process (Apple has no public exit API). No-op on web. Use only for explicit panic flows (e.g. gyro quick exit).
 */
export function panicExitApp(): void {
  if (Platform.OS === "web") return;
  if (Platform.OS === "android") BackHandler.exitApp();
  if (Platform.OS === "ios") throw new Error("Panic: user-initiated crash");
}

/**
 * Attempts quick exit (when enabled), navigates away, then force-closes the app.
 *
 * @param onExit - Navigation callback (e.g. replace login route).
 * @returns Resolves after quick exit attempt; app may terminate immediately after via {@link panicExitApp}.
 * @remarks If quick exit is disabled, still calls {@link panicExitApp} without saving—intentional panic behavior.
 */
export async function performQuickExitWithPanic(onExit: () => void): Promise<void> {
  await triggerQuickExit(onExit);
  panicExitApp();
}

/**
 * Whether self-destruct on repeated failed PINs is enabled in preferences.
 *
 * @returns Current value from the safe preferences store.
 */
export function isSelfDestructEnabled(): boolean {
  return getSafePreferences().selfDestructEnabled;
}

/**
 * Whether silent mode is on (notifications without sound).
 *
 * @returns Current value from the safe preferences store.
 */
export function isSilentMode(): boolean {
  return getSafePreferences().silentMode;
}

/**
 * Whether dose reminder notifications are allowed.
 *
 * @returns Current value from the safe preferences store.
 */
export function areNotificationsEnabled(): boolean {
  return getSafePreferences().notificationsEnabled;
}

/**
 * Whether biometric unlock is enabled in user preferences.
 *
 * @returns Current value from the safe preferences store.
 * @remarks Reflects preference only; device capability is checked separately in {@link isBiometricUnlockAvailable}.
 */
export function isBiometricEnabled(): boolean {
  return getSafePreferences().biometricEnabled;
}

/**
 * Permanently wipes all local app data and resets preference defaults in memory.
 *
 * @returns Resolves after encrypted DB, salts, wrapped keys, and auth policy are cleared.
 * @remarks **Security:** Irreversible. Caller must call `clearAuth()` and navigate to onboarding (e.g. `/getStarted`). Does not sign out Firebase—that is separate.
 */
export async function runSelfDestruct(): Promise<void> {
  await clearAllData();
  await clearAuthPolicyState();
  useSafePreferencesStore.getState().resetToDefaults();
}
