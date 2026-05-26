import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";

/** Android SecureStore values are limited; chunk above this size (bytes). */
const CHUNK_SIZE = 1800;
const CHUNK_COUNT_SUFFIX = "__chunk_count";

/** SecureStore allows only [A-Za-z0-9._-] in keys. */
export const SecureStorageKeys = {
  safe: "haj_database_safe",
  encrypted: "haj_database_encrypted",
  salt: "haj_database_salt",
  wrappedMasterPin: "haj_database_wrapped_master_pin",
  wrappedMasterMnemonic: "haj_database_wrapped_master_mnemonic",
  authPolicy: "haj_auth_policy",
  failedPinAttempts: "haj_auth_failed_pin_attempts",
} as const;

const LEGACY_ASYNC_KEY: Record<string, string> = {
  [SecureStorageKeys.safe]: "@haj/database/safe",
  [SecureStorageKeys.encrypted]: "@haj/database/encrypted",
  [SecureStorageKeys.salt]: "@haj/database/salt",
  [SecureStorageKeys.wrappedMasterPin]: "@haj/database/wrapped_master_pin",
  [SecureStorageKeys.wrappedMasterMnemonic]: "@haj/database/wrapped_master_mnemonic",
  [SecureStorageKeys.authPolicy]: "@haj/auth/policy",
  [SecureStorageKeys.failedPinAttempts]: "@haj/auth/failed_pin_attempts",
};

function chunkCountKey(secureKey: string): string {
  return `${secureKey}${CHUNK_COUNT_SUFFIX}`;
}

function chunkKey(secureKey: string, index: number): string {
  return `${secureKey}__${index}`;
}

function secureOptions(): SecureStore.SecureStoreOptions {
  return {
    keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
  };
}

async function useSecureStore(): Promise<boolean> {
  return SecureStore.isAvailableAsync();
}

async function readChunks(secureKey: string): Promise<string | null> {
  const countRaw = await SecureStore.getItemAsync(
    chunkCountKey(secureKey),
    secureOptions()
  );
  if (!countRaw) return null;
  const count = Number.parseInt(countRaw, 10);
  if (!Number.isFinite(count) || count < 1) return null;
  const parts: string[] = [];
  for (let i = 0; i < count; i++) {
    const part = await SecureStore.getItemAsync(chunkKey(secureKey, i), secureOptions());
    if (part === null) return null;
    parts.push(part);
  }
  return parts.join("");
}

async function writeChunks(secureKey: string, value: string): Promise<void> {
  const count = Math.ceil(value.length / CHUNK_SIZE);
  await SecureStore.setItemAsync(
    chunkCountKey(secureKey),
    String(count),
    secureOptions()
  );
  for (let i = 0; i < count; i++) {
    const part = value.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE);
    await SecureStore.setItemAsync(chunkKey(secureKey, i), part, secureOptions());
  }
}

async function deleteChunks(secureKey: string): Promise<void> {
  const countRaw = await SecureStore.getItemAsync(
    chunkCountKey(secureKey),
    secureOptions()
  );
  if (countRaw) {
    const count = Number.parseInt(countRaw, 10);
    if (Number.isFinite(count) && count > 0) {
      for (let i = 0; i < count; i++) {
        try {
          await SecureStore.deleteItemAsync(chunkKey(secureKey, i));
        } catch {
          // already removed
        }
      }
    }
    try {
      await SecureStore.deleteItemAsync(chunkCountKey(secureKey));
    } catch {
      // already removed
    }
  }
}

async function readSecure(secureKey: string): Promise<string | null> {
  const single = await SecureStore.getItemAsync(secureKey, secureOptions());
  if (single !== null) return single;
  return readChunks(secureKey);
}

async function writeSecure(secureKey: string, value: string): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(secureKey);
  } catch {
    // not present
  }
  await deleteChunks(secureKey);
  if (value.length <= CHUNK_SIZE) {
    await SecureStore.setItemAsync(secureKey, value, secureOptions());
    return;
  }
  await writeChunks(secureKey, value);
}

async function deleteSecure(secureKey: string): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(secureKey);
  } catch {
    // not present
  }
  await deleteChunks(secureKey);
}

async function readAsync(secureKey: string): Promise<string | null> {
  const primary = await AsyncStorage.getItem(secureKey);
  if (primary !== null) return primary;
  const legacy = LEGACY_ASYNC_KEY[secureKey];
  if (!legacy) return null;
  return AsyncStorage.getItem(legacy);
}

async function migrateLegacyToSecure(secureKey: string): Promise<string | null> {
  const legacy = await readAsync(secureKey);
  if (legacy === null) return null;
  if (await useSecureStore()) {
    await writeSecure(secureKey, legacy);
  } else {
    await AsyncStorage.setItem(secureKey, legacy);
  }
  const legacyKey = LEGACY_ASYNC_KEY[secureKey];
  if (legacyKey) await AsyncStorage.removeItem(legacyKey);
  return legacy;
}

/** Read a value from secure storage (migrates legacy AsyncStorage on first access). */
export async function secureGetItem(secureKey: string): Promise<string | null> {
  if (await useSecureStore()) {
    const value = await readSecure(secureKey);
    if (value !== null) return value;
    return migrateLegacyToSecure(secureKey);
  }
  const value = await readAsync(secureKey);
  if (value === null) return null;
  if (LEGACY_ASYNC_KEY[secureKey] && (await AsyncStorage.getItem(secureKey)) === null) {
    await AsyncStorage.setItem(secureKey, value);
    await AsyncStorage.removeItem(LEGACY_ASYNC_KEY[secureKey]);
  }
  return value;
}

/** Write a value to secure storage. */
export async function secureSetItem(secureKey: string, value: string): Promise<void> {
  if (await useSecureStore()) {
    await writeSecure(secureKey, value);
    const legacyKey = LEGACY_ASYNC_KEY[secureKey];
    if (legacyKey) await AsyncStorage.removeItem(legacyKey);
    return;
  }
  await AsyncStorage.setItem(secureKey, value);
  const legacyKey = LEGACY_ASYNC_KEY[secureKey];
  if (legacyKey) await AsyncStorage.removeItem(legacyKey);
}

/** Remove a value from secure storage and any legacy AsyncStorage copy. */
export async function secureRemoveItem(secureKey: string): Promise<void> {
  if (await useSecureStore()) {
    await deleteSecure(secureKey);
  }
  await AsyncStorage.removeItem(secureKey);
  const legacyKey = LEGACY_ASYNC_KEY[secureKey];
  if (legacyKey) await AsyncStorage.removeItem(legacyKey);
}

export async function secureMultiRemove(secureKeys: string[]): Promise<void> {
  await Promise.all(secureKeys.map((key) => secureRemoveItem(key)));
}

/** Eagerly migrate all known keys from legacy AsyncStorage (call once at app start). */
export async function migrateLegacyStorage(): Promise<void> {
  await Promise.all(
    Object.values(SecureStorageKeys).map((key) => secureGetItem(key))
  );
}
