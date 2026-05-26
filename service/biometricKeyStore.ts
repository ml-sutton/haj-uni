import * as LocalAuthentication from "expo-local-authentication";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

const STORAGE_KEY = "haj_biometric_encryption_key";

function writeOptions(): SecureStore.SecureStoreOptions {
  return {
    requireAuthentication: true,
    authenticationPrompt: "Unlock HAJ",
    keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
  };
}

function readOptions(): SecureStore.SecureStoreOptions {
  return {
    requireAuthentication: true,
    authenticationPrompt: "Unlock HAJ",
  };
}

/**
 * Whether the current platform supports native biometric secure storage.
 *
 * @returns `true` on iOS and Android; `false` on web and other platforms.
 */
export function isNativeBiometricPlatform(): boolean {
  return Platform.OS === "ios" || Platform.OS === "android";
}

/**
 * Whether the device can store and retrieve the session encryption key behind biometrics.
 *
 * @returns `true` when SecureStore, biometric hardware, and enrolled biometrics are all available.
 * @remarks Does not reflect the user's in-app "biometric login" preference—only device capability.
 */
export async function isBiometricUnlockAvailable(): Promise<boolean> {
  if (!isNativeBiometricPlatform()) return false;
  if (!(await SecureStore.isAvailableAsync())) return false;
  if (!SecureStore.canUseBiometricAuthentication()) return false;
  if (!(await LocalAuthentication.hasHardwareAsync())) return false;
  return LocalAuthentication.isEnrolledAsync();
}

/**
 * Human-readable label for the primary biometric method on this device.
 *
 * @returns e.g. `"Face ID"`, `"Touch ID"`, `"Fingerprint"`, or `"Biometrics"`.
 */
export async function getBiometricUnlockLabel(): Promise<string> {
  const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
  if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
    return Platform.OS === "ios" ? "Face ID" : "Face unlock";
  }
  if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
    return Platform.OS === "ios" ? "Touch ID" : "Fingerprint";
  }
  if (types.includes(LocalAuthentication.AuthenticationType.IRIS)) {
    return "Iris";
  }
  return "Biometrics";
}

/**
 * Stores the hex-encoded session encryption key in the OS keychain/keystore, gated by biometrics.
 *
 * @param hexKey - Session key derived from PIN (same key used for encrypted DB access).
 * @returns Resolves when the key is written.
 * @throws When SecureStore write fails (e.g. user cancels biometric prompt).
 * @remarks **Security:** This stores the full encryption key. Anyone who can pass device biometrics can decrypt local data. Never log or transmit `hexKey`.
 */
export async function saveEncryptionKeyForBiometrics(hexKey: string): Promise<void> {
  await SecureStore.setItemAsync(STORAGE_KEY, hexKey, writeOptions());
}

/**
 * Retrieves the biometric-protected session encryption key after user authentication.
 *
 * @returns The hex key, or `null` if missing, cancelled, or read failed.
 * @remarks **Security:** Returns the same key as PIN unlock. Call only immediately before decrypting user data; clear in-memory copies on logout via {@link removeStoredEncryptionKey}.
 */
export async function getEncryptionKeyWithBiometrics(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(STORAGE_KEY, readOptions());
  } catch {
    return null;
  }
}

/**
 * Deletes the biometric-protected encryption key from secure storage.
 *
 * @returns Resolves when deletion completes or the item was already absent.
 * @remarks Safe to call on logout or when the user disables biometric login.
 */
export async function removeStoredEncryptionKey(): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(STORAGE_KEY);
  } catch {
    // Item may already be missing or invalidated
  }
}

/**
 * Re-saves the session encryption key for biometrics after a successful PIN unlock.
 *
 * @param hexKey - Current session encryption key.
 * @param biometricEnabled - User preference from safe preferences.
 * @returns Resolves when done; failures are swallowed (PIN login already succeeded).
 * @remarks Best-effort refresh so biometric unlock stays in sync with the latest PIN-derived key.
 */
export async function refreshBiometricEncryptionKeyIfEnabled(
  hexKey: string,
  biometricEnabled: boolean
): Promise<void> {
  if (!biometricEnabled || !isNativeBiometricPlatform()) return;
  if (!(await isBiometricUnlockAvailable())) return;
  try {
    await saveEncryptionKeyForBiometrics(hexKey);
  } catch {
    // Best-effort; PIN login still succeeded
  }
}
