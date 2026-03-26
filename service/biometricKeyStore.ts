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

export function isNativeBiometricPlatform(): boolean {
  return Platform.OS === "ios" || Platform.OS === "android";
}

/** True when secure storage and device biometrics can protect the derived encryption key. */
export async function isBiometricUnlockAvailable(): Promise<boolean> {
  if (!isNativeBiometricPlatform()) return false;
  if (!(await SecureStore.isAvailableAsync())) return false;
  if (!SecureStore.canUseBiometricAuthentication()) return false;
  if (!(await LocalAuthentication.hasHardwareAsync())) return false;
  return LocalAuthentication.isEnrolledAsync();
}

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

export async function saveEncryptionKeyForBiometrics(hexKey: string): Promise<void> {
  await SecureStore.setItemAsync(STORAGE_KEY, hexKey, writeOptions());
}

export async function getEncryptionKeyWithBiometrics(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(STORAGE_KEY, readOptions());
  } catch {
    return null;
  }
}

export async function removeStoredEncryptionKey(): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(STORAGE_KEY);
  } catch {
    // Item may already be missing or invalidated
  }
}

/** After a successful PIN unlock, refresh the biometric-protected copy if the user opted in. */
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
