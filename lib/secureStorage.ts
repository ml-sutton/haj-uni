import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";

/** Android SecureStore values are limited; chunk above this size (bytes). */
const CHUNK_SIZE = 1800;

/** Suffix appended to a base key to store the number of value chunks. */
const CHUNK_COUNT_SUFFIX = "__chunk_count";

/**
 * Canonical SecureStore / AsyncStorage keys for app secrets and database blobs.
 *
 * @remarks
 * Keys must match `[A-Za-z0-9._-]` per SecureStore constraints. Use only these constants
 * when reading or writing sensitive data so migration and multi-remove stay consistent.
 *
 * @property safe - Plaintext {@link SafePreferences} JSON.
 * @property encrypted - AES-encrypted user database payload (`iv:base64` or legacy JSON).
 * @property salt - Hex salt for PIN key derivation.
 * @property wrappedMasterPin - AES-wrapped master encryption key (PIN-derived KEK).
 * @property wrappedMasterMnemonic - AES-wrapped master key (mnemonic-derived KEK).
 * @property authPolicy - Serialized auth policy (e.g. self-destruct threshold).
 * @property failedPinAttempts - Counter of consecutive failed PIN attempts.
 */
export const SecureStorageKeys = {
  safe: "haj_database_safe",
  encrypted: "haj_database_encrypted",
  salt: "haj_database_salt",
  wrappedMasterPin: "haj_database_wrapped_master_pin",
  wrappedMasterMnemonic: "haj_database_wrapped_master_mnemonic",
  authPolicy: "haj_auth_policy",
  failedPinAttempts: "haj_auth_failed_pin_attempts",
} as const;

/** Maps current secure keys to legacy `@haj/...` AsyncStorage paths for one-time migration. */
const LEGACY_ASYNC_KEY: Record<string, string> = {
  [SecureStorageKeys.safe]: "@haj/database/safe",
  [SecureStorageKeys.encrypted]: "@haj/database/encrypted",
  [SecureStorageKeys.salt]: "@haj/database/salt",
  [SecureStorageKeys.wrappedMasterPin]: "@haj/database/wrapped_master_pin",
  [SecureStorageKeys.wrappedMasterMnemonic]: "@haj/database/wrapped_master_mnemonic",
  [SecureStorageKeys.authPolicy]: "@haj/auth/policy",
  [SecureStorageKeys.failedPinAttempts]: "@haj/auth/failed_pin_attempts",
};

/** Builds the metadata key that stores how many chunks exist for a large value. */
function chunkCountKey(secureKey: string): string {
  return `${secureKey}${CHUNK_COUNT_SUFFIX}`;
}

/** Builds the storage key for chunk `index` of a chunked value. */
function chunkKey(secureKey: string, index: number): string {
  return `${secureKey}__${index}`;
}

/** SecureStore options: data accessible only while the device is unlocked, not synced to iCloud. */
function secureOptions(): SecureStore.SecureStoreOptions {
  return {
    keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
  };
}

/**
 * Whether Expo SecureStore is available on this device (false on some web/simulator setups).
 *
 * @returns `true` when reads/writes should use SecureStore instead of AsyncStorage only.
 */
async function useSecureStore(): Promise<boolean> {
  return SecureStore.isAvailableAsync();
}

/**
 * Reads a value that was split across multiple SecureStore entries.
 *
 * @param secureKey - Base key shared by all chunks.
 * @returns Concatenated string, or `null` if metadata or any chunk is missing.
 */
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

/**
 * Writes a large string as fixed-size chunks plus a chunk-count metadata entry.
 *
 * @param secureKey - Base key for the value.
 * @param value - Full string to persist (may exceed {@link CHUNK_SIZE}).
 */
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

/**
 * Removes a single-key entry and all chunk keys associated with `secureKey`.
 *
 * @param secureKey - Base key whose chunks should be deleted.
 */
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

/**
 * Reads from SecureStore, trying a single key first then chunked storage.
 *
 * @param secureKey - Storage key.
 * @returns Stored value or `null` if absent.
 */
async function readSecure(secureKey: string): Promise<string | null> {
  const single = await SecureStore.getItemAsync(secureKey, secureOptions());
  if (single !== null) return single;
  return readChunks(secureKey);
}

/**
 * Writes to SecureStore, using one key for small values or chunks for large ones.
 *
 * @param secureKey - Storage key.
 * @param value - String to persist.
 */
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

/** Deletes both the primary SecureStore key and any chunked fragments. */
async function deleteSecure(secureKey: string): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(secureKey);
  } catch {
    // not present
  }
  await deleteChunks(secureKey);
}

/**
 * Reads from AsyncStorage using the canonical key, then the legacy path if needed.
 *
 * @param secureKey - Canonical key (see {@link SecureStorageKeys}).
 * @returns Stored value or `null`.
 */
async function readAsync(secureKey: string): Promise<string | null> {
  const primary = await AsyncStorage.getItem(secureKey);
  if (primary !== null) return primary;
  const legacy = LEGACY_ASYNC_KEY[secureKey];
  if (!legacy) return null;
  return AsyncStorage.getItem(legacy);
}

/**
 * Copies a legacy AsyncStorage value into secure storage and removes the old key.
 *
 * @param secureKey - Canonical key to migrate.
 * @returns The migrated value, or `null` if nothing was stored under legacy paths.
 */
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

/**
 * Reads a value from secure storage, migrating legacy AsyncStorage on first access.
 *
 * @param secureKey - Key from {@link SecureStorageKeys} or another allowed secure key.
 * @returns Stored string, or `null` if the key has never been set.
 *
 * @remarks
 * On devices without SecureStore, falls back to AsyncStorage and normalizes legacy paths.
 */
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

/**
 * Writes a value to secure storage and clears any legacy AsyncStorage copy for that key.
 *
 * @param secureKey - Key from {@link SecureStorageKeys}.
 * @param value - String to store (encrypted payloads may be large and will be chunked on Android).
 */
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

/**
 * Removes a value from secure storage and any legacy AsyncStorage copy.
 *
 * @param secureKey - Key to remove.
 */
export async function secureRemoveItem(secureKey: string): Promise<void> {
  if (await useSecureStore()) {
    await deleteSecure(secureKey);
  }
  await AsyncStorage.removeItem(secureKey);
  const legacyKey = LEGACY_ASYNC_KEY[secureKey];
  if (legacyKey) await AsyncStorage.removeItem(legacyKey);
}

/**
 * Removes multiple keys in parallel via {@link secureRemoveItem}.
 *
 * @param secureKeys - Keys to delete.
 */
export async function secureMultiRemove(secureKeys: string[]): Promise<void> {
  await Promise.all(secureKeys.map((key) => secureRemoveItem(key)));
}

/**
 * Eagerly migrates all known {@link SecureStorageKeys} from legacy AsyncStorage.
 *
 * @remarks
 * Call once at app start so subsequent reads do not hit legacy paths on the critical path.
 */
export async function migrateLegacyStorage(): Promise<void> {
  await Promise.all(
    Object.values(SecureStorageKeys).map((key) => secureGetItem(key))
  );
}
